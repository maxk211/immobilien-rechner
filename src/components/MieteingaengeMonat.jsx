import { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, berechneMietStatusFuerMonat } from '../utils/miete.js';

// Abschnitt 3.1 (Dashboard-Block "Mieteingänge des aktuellen Monats"): eine Kachel
// pro aktivem Objekt mit Mieter(n), Sollbetrag + Status über dieselbe
// berechneMietStatusFuerMonat()-Quelle wie Mieteinnahmen-Tab und Cockpit-Ampel.
// Direktes Verbuchen ist bewusst auf Kaufimmobilien beschränkt — dort ist die
// Miet-Logik (Fälligkeitstag, Dauerauftrag, ein Betrag pro Monat) klar definiert.
// Mehrfamilienhäuser (mehrere Wohnungen) und Mietimmobilien (Untervermietung mit
// Arbitrage-Logik) bekommen stattdessen eine einfache Kachel, die zum Objekt führt.
const MieteingaengeMonat = ({ portfolio, mieterListe = [], onBuchen, onOpenImmobilie }) => {
  const [buchtId, setBuchtId] = useState(null);
  const [bulkLaeuft, setBulkLaeuft] = useState(false);

  const heute = new Date();
  const jahr = heute.getFullYear();
  const monatNr = heute.getMonth() + 1;
  const monatsName = heute.toLocaleDateString('de-DE', { month: 'long' });

  const aktivePortfolio = portfolio.filter(i => i.aktiv !== false);

  const buchbareEintraege = [];
  const sonstigeKacheln = [];

  aktivePortfolio.forEach(immo => {
    const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
    if (aktiveMieter.length === 0) return;

    if (immo.immobilienTyp === 'mehrfamilienhaus' || immo.immobilienTyp === 'mietimmobilie') {
      sonstigeKacheln.push(immo);
      return;
    }

    const faelligkeitstag = immo.mieteFaelligkeitstag ?? 3;
    const nkVomMieter = immo.vermietungsmodell === 'kaltmiete_nk' ? (immo.nebenkostenVomMieter || 0) : 0;
    const erwarteterBetrag = immo.dauerauftrag
      ? (immo.dauerauftragBetrag || getAktuelleMiete(immo) || 0)
      : getAktuelleMiete(immo) + nkVomMieter;
    if (erwarteterBetrag <= 0) return;

    const { status, summe } = berechneMietStatusFuerMonat(immo.mietEingaenge, jahr, monatNr, erwarteterBetrag, immo.dauerauftrag);
    buchbareEintraege.push({ immo, erwarteterBetrag, status, summe, restBetrag: Math.max(0, erwarteterBetrag - summe) });
  });

  if (buchbareEintraege.length === 0 && sonstigeKacheln.length === 0) return null;

  const offeneEintraege = buchbareEintraege.filter(e => e.status === 'offen' || e.status === 'teilweise' || e.status === 'nicht_bezahlt');

  const buche = async (eintrag) => {
    const betrag = eintrag.status === 'teilweise' ? eintrag.restBetrag : eintrag.erwarteterBetrag;
    if (betrag <= 0) return;
    setBuchtId(eintrag.immo.id);
    try {
      const tagImMonat = jahr === heute.getFullYear() && monatNr === heute.getMonth() + 1 ? heute.getDate() : 1;
      const datumISO = new Date(jahr, monatNr - 1, tagImMonat).toISOString().split('T')[0];
      const neuerEingang = { id: Date.now(), datum: datumISO, betrag, typ: 'kaltmiete', notiz: '' };
      const neueMietEingaenge = [...(eintrag.immo.mietEingaenge || []), neuerEingang];
      await onBuchen(eintrag.immo.id, { mietEingaenge: neueMietEingaenge });
    } finally {
      setBuchtId(null);
    }
  };

  const bucheAlle = async () => {
    setBulkLaeuft(true);
    try {
      for (const eintrag of offeneEintraege) {
        await buche(eintrag);
      }
    } finally {
      setBulkLaeuft(false);
    }
  };

  const statusInfo = (status) => {
    if (status === 'bezahlt') return { icon: <CheckCircle2 size={16} className="text-emerald-500" />, text: 'Eingegangen', color: 'text-emerald-600' };
    if (status === 'dauerauftrag') return { icon: <CheckCircle2 size={16} className="text-emerald-500" />, text: 'Dauerauftrag', color: 'text-emerald-600' };
    if (status === 'teilweise') return { icon: <AlertCircle size={16} className="text-amber-500" />, text: 'Teilweise', color: 'text-amber-600' };
    if (status === 'nicht_bezahlt') return { icon: <AlertCircle size={16} className="text-red-500" />, text: 'Nicht bezahlt', color: 'text-red-600' };
    return { icon: <Circle size={16} className="text-gray-300" />, text: 'Offen', color: 'text-gray-400' };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="font-bold text-gray-800">Mieteingänge {monatsName} {jahr}</span>
        {offeneEintraege.length > 0 && (
          <button
            onClick={bucheAlle}
            disabled={bulkLaeuft}
            className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {bulkLaeuft && <Loader2 size={12} className="animate-spin" />}
            Alle als eingegangen buchen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {buchbareEintraege.map(eintrag => {
          const info = statusInfo(eintrag.status);
          const kannBuchen = eintrag.status === 'offen' || eintrag.status === 'teilweise' || eintrag.status === 'nicht_bezahlt';
          const laedt = buchtId === eintrag.immo.id;
          return (
            <div key={eintrag.immo.id} className="border border-gray-100 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">{eintrag.immo.name || eintrag.immo.adresse}</div>
                  <div className="text-xs text-gray-400">Soll {formatCurrency(eintrag.erwarteterBetrag)}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${info.color}`}>
                  {info.icon} {info.text}
                </div>
              </div>
              {kannBuchen ? (
                <button
                  onClick={() => buche(eintrag)}
                  disabled={laedt}
                  className="mt-auto text-xs font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {laedt && <Loader2 size={12} className="animate-spin" />}
                  {eintrag.status === 'teilweise' ? `Rest (${formatCurrency(eintrag.restBetrag)}) buchen` : 'Als eingegangen buchen'}
                </button>
              ) : (
                <button
                  onClick={() => onOpenImmobilie(eintrag.immo, 'mieteinnahmen')}
                  className="mt-auto text-xs font-semibold text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"
                >
                  Details <ChevronRight size={12} />
                </button>
              )}
            </div>
          );
        })}

        {sonstigeKacheln.map(immo => (
          <div
            key={immo.id}
            onClick={() => onOpenImmobilie(immo, null)}
            className="border border-gray-100 rounded-xl p-3.5 flex flex-col gap-2 cursor-pointer hover:border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-sm text-gray-800 truncate">{immo.name || immo.adresse}</div>
            <div className="text-xs text-gray-400">
              {immo.immobilienTyp === 'mehrfamilienhaus' ? 'Mehrere Wohnungen' : 'Untervermietung'}
            </div>
            <div className="mt-auto text-xs font-semibold text-gray-400 flex items-center gap-1">
              Objekt öffnen <ChevronRight size={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MieteingaengeMonat;
