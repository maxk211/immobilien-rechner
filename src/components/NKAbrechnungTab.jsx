import { useState } from 'react';
import { Receipt, Lightbulb, FileText, Wallet, TrendingDown, AlertTriangle, Mail } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { NK_KOSTENPOSITIONEN_DEFAULTS } from '../constants/index.js';
import NKAbrechnungForm from './NKAbrechnungForm';
import { erstelleMieterschreiben } from '../utils/mieterschreiben.js';

// Abschnitt 3.8: Status einer Abrechnung — Ablauf offen → in Arbeit → verschickt.
const STATUS_OPTIONEN = [
  { value: 'offen', label: 'Offen', badge: 'bg-red-100 text-red-700' },
  { value: 'in_arbeit', label: 'In Arbeit', badge: 'bg-amber-100 text-amber-700' },
  { value: 'verschickt', label: 'Verschickt', badge: 'bg-emerald-100 text-emerald-700' },
];

const NKAbrechnungTab = ({ params, updateParams, immobilie, mieterListe = [] }) => {
  const aktuellesJahr = new Date().getFullYear();
  const [filterJahr, setFilterJahr] = useState(aktuellesJahr - 1);
  const [showForm, setShowForm] = useState(false);
  const [editAbrechnung, setEditAbrechnung] = useState(null); // null = neu, sonst Objekt

  const nkAbrechnungen = params.nkAbrechnungen || [];
  const jahresAbrechnungen = nkAbrechnungen.filter(a => a.abrechnungsjahr === filterJahr && a.typ === 'nk_abrechnung_detail');

  // Vorauszahlungen aus Mieteingängen für das Jahr berechnen
  const nkVomMieter = params.nebenkostenVomMieter || 0;
  const vorauszahlungenGesamt = nkVomMieter * 12;

  // Speichert nur — schließt den Assistenten NICHT. Der 4-Schritte-Ablauf
  // (Zeitraum → Kosten → Ergebnis → Mieterschreiben) speichert beim Übergang
  // von "Ergebnis prüfen" zu "Mieterschreiben erstellen" und bleibt offen,
  // damit Schritt 4 direkt im Anschluss nutzbar ist. Schließen passiert erst
  // über onCancel ("Abbrechen" oder "Fertig" in Schritt 4).
  const saveAbrechnung = (abrechnung) => {
    let updated;
    let gespeichert;
    if (abrechnung.id && nkAbrechnungen.find(a => a.id === abrechnung.id)) {
      gespeichert = abrechnung;
      updated = nkAbrechnungen.map(a => a.id === abrechnung.id ? abrechnung : a);
    } else {
      gespeichert = { ...abrechnung, id: Date.now(), typ: 'nk_abrechnung_detail', erstellt: new Date().toISOString(), status: abrechnung.status || 'offen' };
      updated = [...nkAbrechnungen, gespeichert];
    }
    updateParams({ ...params, nkAbrechnungen: updated });
    return gespeichert; // Assistent braucht die (neu vergebene) id für den nächsten Schritt
  };

  const schliesseForm = () => { setShowForm(false); setEditAbrechnung(null); };

  const deleteAbrechnung = (id) => {
    updateParams({ ...params, nkAbrechnungen: nkAbrechnungen.filter(a => a.id !== id) });
  };

  const setStatus = (id, status) => {
    updateParams({ ...params, nkAbrechnungen: nkAbrechnungen.map(a => a.id === id ? { ...a, status } : a) });
  };

  const [pdfLaeuft, setPdfLaeuft] = useState(null); // id der Abrechnung, für die gerade ein PDF gebaut wird

  const mieterschreibenErstellen = async (abr) => {
    setPdfLaeuft(abr.id);
    try {
      await erstelleMieterschreiben(abr, immobilie);
      // Nach dem Versand-Schreiben ist die Abrechnung typischerweise "verschickt"
      if ((abr.status || 'offen') !== 'verschickt') setStatus(abr.id, 'verschickt');
    } finally {
      setPdfLaeuft(null);
    }
  };

  // Neue leere Abrechnung — Mietername vorbefüllen, wenn eindeutig ein aktiver Mieter vorhanden ist
  const aktiveMieter = mieterListe.filter(m => m.aktiv !== false);
  const neueAbrechnung = {
    abrechnungsjahr: filterJahr,
    mieterName: aktiveMieter.length === 1 ? (aktiveMieter[0].name || '') : '',
    wohnflaeche: params.wohnflaeche || 0,
    gesamtflaeche: params.wohnflaeche || 0,
    vorauszahlungen: vorauszahlungenGesamt,
    kostenpositionen: NK_KOSTENPOSITIONEN_DEFAULTS.map(pos => ({ ...pos, gesamtkosten: 0, mieteranteil: 100 })),
    notizen: '',
    status: 'offen',
  };

  // Abschnitt 3.8: Fristhinweis oben, wenn die Abrechnung des Vorjahres "offen ist"
  // — das deckt sowohl komplett fehlend als auch vorhanden-aber-noch-nicht-
  // verschickt (offen/in Arbeit) ab, nicht nur den Fall "gar kein Datensatz".
  const letztesJahr = aktuellesJahr - 1;
  const vorjahresAbrechnung = nkAbrechnungen.find(a => a.typ === 'nk_abrechnung_detail' && parseInt(a.abrechnungsjahr) === letztesJahr);
  const vorjahresAbrechnungOffen = aktiveMieter.length > 0 &&
    (!vorjahresAbrechnung || (vorjahresAbrechnung.status || 'offen') !== 'verschickt');
  const nachFristStichtag = new Date() > new Date(aktuellesJahr, 9, 1); // 1. Oktober

  const jahre = [];
  const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : aktuellesJahr - 3;
  for (let j = kaufjahr; j <= aktuellesJahr; j++) jahre.push(j);

  if (showForm) {
    const abr = editAbrechnung || neueAbrechnung;
    return <NKAbrechnungForm abrechnung={abr} onSave={saveAbrechnung} onCancel={schliesseForm} mieterListe={mieterListe} immobilie={immobilie} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Receipt size={16} /> NK-Abrechnungen</h3>
            <p className="text-xs text-gray-500 mt-0.5">Jährliche Betriebskostenabrechnung mit dem Mieter</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            + Neue Abrechnung
          </button>
        </div>
        {/* Jahresauswahl */}
        <div className="flex gap-1 mt-4 flex-wrap">
          {jahre.map(j => (
            <button key={j} onClick={() => setFilterJahr(j)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${filterJahr === j ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {j}
            </button>
          ))}
        </div>
      </div>

      {/* Fristhinweis: Abrechnung des Vorjahres ist offen — fehlt komplett ODER
          existiert bereits, ist aber noch nicht verschickt (offen/in Arbeit). */}
      {vorjahresAbrechnungOffen && (
        <div className={`rounded-2xl p-4 text-sm border flex items-start gap-2 ${nachFristStichtag ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">NK-Abrechnung {letztesJahr} steht noch aus</div>
            <div className="mt-0.5 text-xs opacity-90">
              {!vorjahresAbrechnung
                // Gesetzliche Frist § 556 Abs. 3 BGB: Zugang beim Mieter bis 12 Monate
                // nach Ende des Abrechnungszeitraums (Kalenderjahr → 31.12. Folgejahr).
                // Der 1. Oktober ist nur der Erinnerungs-Stichtag aus dem Konzept.
                ? (nachFristStichtag
                    ? `Für ${letztesJahr} wurde noch keine Abrechnung erfasst. Die gesetzliche Frist endet am 31.12.${aktuellesJahr} — danach sind Nachforderungen in der Regel ausgeschlossen.`
                    : `Für ${letztesJahr} wurde noch keine Abrechnung erfasst. Gesetzliche Frist: 31.12.${aktuellesJahr}.`)
                : `Für ${letztesJahr} liegt bereits eine Abrechnung vor, sie wurde aber noch nicht verschickt (Status: ${vorjahresAbrechnung.status === 'in_arbeit' ? 'In Arbeit' : 'Offen'}).`}
            </div>
          </div>
        </div>
      )}

      {/* NK-Vorauszahlungen Info */}
      {nkVomMieter > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm">
          <div className="font-semibold text-blue-800 flex items-center gap-1"><Lightbulb size={14} /> Vorauszahlungen {filterJahr}</div>
          <div className="text-indigo-700 mt-1">
            {nkVomMieter > 0 ? `${formatCurrency(nkVomMieter)}/Monat × 12 = ` : ''}<strong>{formatCurrency(vorauszahlungenGesamt)}</strong> Vorauszahlungen erhalten
          </div>
        </div>
      )}

      {/* Abrechnungsliste */}
      {jahresAbrechnungen.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <div className="flex justify-center mb-3"><FileText size={40} className="text-gray-300" /></div>
          <div className="text-gray-500 font-semibold">Noch keine NK-Abrechnung für {filterJahr}</div>
          <div className="text-gray-400 text-sm mt-1">Erstelle die jährliche Betriebskostenabrechnung für den Mieter</div>
          <button onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700">
            Abrechnung erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jahresAbrechnungen.map(abr => {
            const gesamtkosten = (abr.kostenpositionen || []).reduce((s, k) => s + (k.gesamtkosten * (k.mieteranteil / 100) || 0), 0);
            const saldo = (abr.vorauszahlungen || 0) - gesamtkosten;
            const istErstattung = saldo > 0;
            const status = abr.status || 'offen';
            const statusOpt = STATUS_OPTIONEN.find(s => s.value === status) || STATUS_OPTIONEN[0];
            return (
              <div key={abr.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-gray-800">NK-Abrechnung {abr.abrechnungsjahr}</div>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      <div>Zeitraum: 01.01.–31.12.{abr.abrechnungsjahr}</div>
                      {abr.mieterName && <div>Mieter: {abr.mieterName}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={status}
                      onChange={(e) => setStatus(abr.id, e.target.value)}
                      className={`text-xs font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer ${statusOpt.badge}`}
                    >
                      {STATUS_OPTIONEN.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button onClick={() => { setEditAbrechnung(abr); setShowForm(true); }} className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold">Bearbeiten</button>
                    <button onClick={() => deleteAbrechnung(abr.id)} className="text-red-400 hover:text-red-600 text-xs">Löschen</button>
                  </div>
                </div>
                {/* Kostenpositionen */}
                <div className="space-y-1.5 mb-4">
                  {(abr.kostenpositionen || []).filter(k => k.gesamtkosten > 0).map(pos => (
                    <div key={pos.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{pos.icon} {pos.label}</span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-800">{formatCurrency(pos.gesamtkosten * (pos.mieteranteil / 100))}</span>
                        {pos.mieteranteil !== 100 && <span className="text-xs text-gray-400 ml-1">({pos.mieteranteil}% von {formatCurrency(pos.gesamtkosten)})</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Saldo */}
                <div className="border-t border-gray-200 pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tatsächliche Kosten (Mieteranteil)</span>
                    <span className="font-semibold">{formatCurrency(gesamtkosten)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Vorauszahlungen</span>
                    <span className="font-semibold text-indigo-600">−{formatCurrency(abr.vorauszahlungen || 0)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold p-2 rounded-lg ${istErstattung ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                    <span className="flex items-center gap-1">{istErstattung ? <><Wallet size={14} /> Erstattung an Mieter</> : <><TrendingDown size={14} /> Nachzahlung vom Mieter</>}</span>
                    <span>{formatCurrency(Math.abs(saldo))}</span>
                  </div>
                </div>
                {abr.notizen && <p className="text-xs text-gray-500 mt-2">{abr.notizen}</p>}
                <button
                  onClick={() => mieterschreibenErstellen(abr)}
                  disabled={pdfLaeuft === abr.id}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors disabled:opacity-50"
                >
                  <Mail size={14} /> {pdfLaeuft === abr.id ? 'Wird erstellt…' : 'Mieterschreiben erstellen (PDF)'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// NK-Abrechnung Formular

export default NKAbrechnungTab;
