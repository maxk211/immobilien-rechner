import { useState, useMemo } from 'react';
import { Zap, Check, X, ChevronUp, ChevronDown, User, FileText, TrendingDown, Wallet, Info } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete } from '../utils/miete.js';
import ZahlungErfassenForm from './ZahlungErfassenForm';

const MieteinnahmenTracker = ({ params, updateParams, immobilie, mieterListe = [] }) => {
  const [mietEingaenge, setMietEingaenge] = useState(params.mietEingaenge || []);
  const [filterJahr, setFilterJahr] = useState(new Date().getFullYear());
  const [ausnahmeMonat, setAusnahmeMonat] = useState(null); // {nr, name} for exception modal
  const [ausnahmeForm, setAusnahmeForm] = useState({ typ: 'verspaetet', betrag: '', notiz: '' });
  const [detailMonat, setDetailMonat] = useState(null); // nr of expanded month
  const [showNKModal, setShowNKModal] = useState(false); // NK-Abrechnung erfassen
  const [nkAbrechnungen, setNkAbrechnungen] = useState(params.nkAbrechnungen || []);

  const kaufDatumObj = immobilie.kaufdatum ? new Date(immobilie.kaufdatum) : null;
  const kaufjahr = kaufDatumObj ? kaufDatumObj.getFullYear() : new Date().getFullYear();
  const kaufmonat = kaufDatumObj ? kaufDatumObj.getMonth() + 1 : 1; // 1-basiert
  const aktuellesJahr = new Date().getFullYear();
  const aktuellerMonat = new Date().getMonth() + 1;
  const jahre = [];
  for (let j = kaufjahr; j <= aktuellesJahr + 1; j++) jahre.push(j);

  const MONATE = [
    { nr: 1, name: 'Januar', kurz: 'Jan' }, { nr: 2, name: 'Februar', kurz: 'Feb' },
    { nr: 3, name: 'März', kurz: 'Mär' }, { nr: 4, name: 'April', kurz: 'Apr' },
    { nr: 5, name: 'Mai', kurz: 'Mai' }, { nr: 6, name: 'Juni', kurz: 'Jun' },
    { nr: 7, name: 'Juli', kurz: 'Jul' }, { nr: 8, name: 'August', kurz: 'Aug' },
    { nr: 9, name: 'September', kurz: 'Sep' }, { nr: 10, name: 'Oktober', kurz: 'Okt' },
    { nr: 11, name: 'November', kurz: 'Nov' }, { nr: 12, name: 'Dezember', kurz: 'Dez' }
  ];

  const isDauerauftrag = params.dauerauftrag || false;
  const vermietungsmodell = params.vermietungsmodell || 'kaltmiete';
  const nkVomMieter = vermietungsmodell === 'kaltmiete_nk' ? (params.nebenkostenVomMieter || 0) : 0;

  const aktuelleMiete = getAktuelleMiete(params); // aktuell gültige Kaltmiete/Warmmiete
  const dauerauftragBetrag = params.dauerauftragBetrag || aktuelleMiete || 0;

  // Erwarteter Gesamtbetrag vom Mieter je nach Mietmodell:
  // kaltmiete   → nur Kaltmiete
  // kaltmiete_nk → Kaltmiete + NK-Vorauszahlung
  // warmmiete   → Warmmiete (= kaltmiete-Feld enthält Warmmiete)
  const erwarteterBetrag = (aktuelleMiete || 0) + nkVomMieter;

  // Ermittelt den erwarteten Gesamtbetrag für einen bestimmten Monat (historisch korrekt)
  const getMieteForMonat = (jahr, monatNr) => {
    // Kaltmiete/Warmmiete historisch korrekt aus mietAnpassungen
    const anpassungen = (params.mietAnpassungen || []).filter(a => a.kaltmiete != null);
    const sorted = [...anpassungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
    // 15. des Monats verwenden, um Timezone-Probleme mit ISO-Datums-Strings (UTC) zu vermeiden.
    // new Date('2026-07-01') ist UTC-Mitternacht = 02:00 CEST, > 01. Juli 00:00 lokal → 15. ist sicher.
    const monatsDatum = new Date(jahr, monatNr - 1, 15);
    let gueltig = null;
    for (const anp of sorted) {
      if (new Date(anp.datum) <= monatsDatum) gueltig = anp;
      else break;
    }
    // Basiskaltmiete: letzte gültige Anpassung oder Basiswert (NICHT aktuelleMiete,
    // da die schon die neueste Anpassung enthält und historisch falsch wäre)
    const kaltmieteForMonat = gueltig
      ? gueltig.kaltmiete
      : (isDauerauftrag ? dauerauftragBetrag : (params.kaltmiete || 0));
    // NK-Vorauszahlung addieren (nur bei kaltmiete_nk, aktueller Wert)
    return kaltmieteForMonat + nkVomMieter;
  };

  const saveEingaenge = (neueEingaenge) => {
    setMietEingaenge(neueEingaenge);
    updateParams({ ...params, mietEingaenge: neueEingaenge });
  };

  const handleDeleteEingang = (id) => saveEingaenge(mietEingaenge.filter(e => e.id !== id));

  // Ein-Klick Abhaken: Erstellt sofort eine Zahlung für den Monat (mit historisch korrektem Betrag)
  const handleAbhaken = (monat) => {
    const datum = `${filterJahr}-${String(monat.nr).padStart(2, '0')}-01`;
    const betrag = getMieteForMonat(filterJahr, monat.nr);
    const neuerEingang = { id: Date.now(), datum, betrag, typ: 'kaltmiete', notiz: '' };
    saveEingaenge([...mietEingaenge, neuerEingang]);
  };

  // Ausnahme speichern
  const handleAusnahmeSpeichern = () => {
    if (!ausnahmeMonat) return;
    const datum = `${filterJahr}-${String(ausnahmeMonat.nr).padStart(2, '0')}-05`;
    const ausnahmeLabels = { verspaetet: 'Verspätet', falscher_betrag: 'Falscher Betrag', nicht_bezahlt: 'Nicht bezahlt' };
    const neuerEingang = {
      id: Date.now(),
      datum,
      betrag: ausnahmeForm.betrag !== '' ? parseFloat(ausnahmeForm.betrag) : 0,
      typ: 'ausnahme',
      ausnahmeTyp: ausnahmeForm.typ,
      notiz: ausnahmeForm.notiz || ausnahmeLabels[ausnahmeForm.typ]
    };
    saveEingaenge([...mietEingaenge, neuerEingang]);
    setAusnahmeMonat(null);
    setAusnahmeForm({ typ: 'verspaetet', betrag: '', notiz: '' });
  };

  // Monatsberechnung
  const monatsUebersicht = MONATE.map(m => {
    // Monate vor dem Kaufdatum im Kaufjahr überspringen
    const istVorKauf = filterJahr === kaufjahr && m.nr < kaufmonat;

    const monatEingaenge = mietEingaenge.filter(e => {
      const d = new Date(e.datum);
      return d.getFullYear() === filterJahr && (d.getMonth() + 1) === m.nr;
    });
    const ausnahmen = monatEingaenge.filter(e => e.typ === 'ausnahme');
    const zahlungen = monatEingaenge.filter(e => e.typ !== 'ausnahme');
    const summe = zahlungen.reduce((s, e) => s + (parseFloat(e.betrag) || 0), 0);
    const istZukunft = filterJahr > aktuellesJahr || (filterJahr === aktuellesJahr && m.nr > aktuellerMonat);
    // Historisch korrekte Miete für diesen Monat
    const erwartetFuerMonat = getMieteForMonat(filterJahr, m.nr);

    let status;
    if (istVorKauf) {
      status = 'vor_kauf';
    } else if (istZukunft) {
      status = 'zukunft';
    } else if (ausnahmen.some(e => e.ausnahmeTyp === 'nicht_bezahlt')) {
      status = 'nicht_bezahlt';
    } else if (isDauerauftrag && ausnahmen.length === 0) {
      status = 'dauerauftrag'; // auto-bezahlt
    } else if (summe >= erwartetFuerMonat && summe > 0) {
      status = 'bezahlt';
    } else if (summe > 0) {
      status = 'teilweise';
    } else {
      status = 'offen';
    }
    const verspaetet = ausnahmen.some(e => e.ausnahmeTyp === 'verspaetet') ||
      zahlungen.some(e => new Date(e.datum).getDate() > 5);

    return { ...m, monatEingaenge, ausnahmen, zahlungen, summe, status, verspaetet, istZukunft, istVorKauf, erwartetFuerMonat };
  });

  const bezahltMonate = monatsUebersicht.filter(m => m.status === 'bezahlt' || m.status === 'dauerauftrag').length;
  const offeneMonate = monatsUebersicht.filter(m => m.status === 'offen' || m.status === 'nicht_bezahlt').length;
  // Jahreseinnahmen: vor_kauf und zukunft ignorieren
  const gesamtJahr = monatsUebersicht.reduce((s, m) => {
    if (m.status === 'vor_kauf' || m.status === 'zukunft') return s;
    if (m.status === 'dauerauftrag') return s + m.erwartetFuerMonat;
    return s + m.summe;
  }, 0);

  const statusConfig = {
    bezahlt:      { bg: 'bg-emerald-50 border-emerald-200', icon: <Check size={12}/>, iconColor: 'text-emerald-600', label: 'bg-emerald-100 text-emerald-700' },
    dauerauftrag: { bg: 'bg-emerald-50 border-emerald-200', icon: <Zap size={12}/>, iconColor: 'text-emerald-500', label: 'bg-emerald-100 text-emerald-700' },
    teilweise:    { bg: 'bg-amber-50 border-amber-200', icon: '~', iconColor: 'text-amber-600', label: 'bg-amber-100 text-amber-700' },
    offen:        { bg: 'bg-red-50 border-red-200', icon: <X size={12}/>, iconColor: 'text-red-500', label: 'bg-red-100 text-red-700' },
    nicht_bezahlt:{ bg: 'bg-red-50 border-red-300', icon: <X size={12}/>, iconColor: 'text-red-600', label: 'bg-red-100 text-red-700' },
    zukunft:      { bg: 'bg-gray-50 border-gray-200', icon: '–', iconColor: 'text-gray-300', label: 'bg-gray-100 text-gray-400' },
    vor_kauf:     { bg: 'bg-gray-50 border-gray-100', icon: '○', iconColor: 'text-gray-200', label: 'bg-gray-100 text-gray-300' },
  };

  // Monatsliste generieren: von Kaufdatum bis heute
  const forderungen = useMemo(() => {
    if (!immobilie.kaufdatum) return [];
    const start = new Date(immobilie.kaufdatum);
    start.setDate(1);
    const heute = new Date();
    heute.setDate(1);
    const liste = [];
    let d = new Date(start);
    while (d <= heute) {
      const monatKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const forderungBetrag = getMieteForMonat(d.getFullYear(), d.getMonth()+1);
      // Zahlungen die diesem Monat zugeordnet sind
      const zahlungen = mietEingaenge.filter(e => {
        const emonat = e.monat || `${new Date(e.datum).getFullYear()}-${String(new Date(e.datum).getMonth()+1).padStart(2,'0')}`;
        return emonat === monatKey && e.typ !== 'ausnahme';
      });
      const eingegangen = zahlungen.reduce((s,e) => s + (parseFloat(e.betrag)||0), 0);
      const differenz = eingegangen - forderungBetrag;
      let status = 'offen';
      if (eingegangen >= forderungBetrag && eingegangen > 0) status = 'beglichen';
      else if (eingegangen > 0) status = 'teilweise';
      else if (isDauerauftrag) status = 'dauerauftrag';
      liste.push({ monatKey, jahr: d.getFullYear(), monat: d.getMonth()+1, forderungBetrag, eingegangen, differenz, status, zahlungen });
      d = new Date(d.getFullYear(), d.getMonth()+1, 1);
    }
    return liste.reverse(); // neueste zuerst
  }, [mietEingaenge, immobilie.kaufdatum, params.mietAnpassungen, isDauerauftrag, filterJahr]);

  const MONATE_NAMEN = ['','Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

  // Offene Forderungen: komplett offen + Restbetrag bei Teilzahlungen
  const offenGesamt = forderungen
    .filter(f => f.status === 'offen' || f.status === 'teilweise')
    .reduce((s, f) => s + Math.max(0, f.forderungBetrag - f.eingegangen), 0);
  const offenAnzahl = forderungen.filter(f => f.status === 'offen' || f.status === 'teilweise').length;
  const jahresForderungen = forderungen.filter(f => f.jahr === filterJahr);
  const jahresEinnahmen = jahresForderungen.reduce((s,f) => s + (f.status === 'dauerauftrag' ? f.forderungBetrag : f.eingegangen), 0);
  // Jahressumme aufgeteilt nach Kalt und NK
  const jahresKalt = jahresForderungen.reduce((s, f) => {
    if (f.status === 'vor_kauf' || f.status === 'zukunft') return s;
    const kaltAnteil = f.forderungBetrag - nkVomMieter;
    if (f.status === 'dauerauftrag') return s + kaltAnteil;
    const ratio = f.forderungBetrag > 0 ? kaltAnteil / f.forderungBetrag : 1;
    return s + f.eingegangen * ratio;
  }, 0);
  const jahresNKEingegangen = nkVomMieter > 0 ? jahresEinnahmen - jahresKalt : 0;

  return (
    <div className="space-y-5">
      {/* Dauerauftrag-Einstellung */}
      <div className={`rounded-2xl border p-5 ${isDauerauftrag ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateParams({ ...params, dauerauftrag: !isDauerauftrag, dauerauftragBetrag: dauerauftragBetrag || erwarteterBetrag })}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isDauerauftrag ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isDauerauftrag ? 'translate-x-6' : ''}`}></span>
            </button>
            <div>
              <div className="font-bold text-gray-800 text-sm flex items-center gap-1"><Zap size={14} /> Dauerauftrag</div>
              <div className="text-xs text-gray-500">Miete kommt automatisch — kein manuelles Abhaken nötig</div>
            </div>
          </div>
          {isDauerauftrag && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Erwarteter Betrag:</span>
              <input
                type="number"
                value={dauerauftragBetrag}
                onChange={e => updateParams({ ...params, dauerauftragBetrag: parseFloat(e.target.value) || 0 })}
                className="w-28 px-3 py-1.5 text-sm font-bold border border-emerald-300 rounded-lg text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-sm text-gray-500">€/Monat</span>
            </div>
          )}
        </div>
        {isDauerauftrag && (
          <p className="text-xs text-emerald-600 mt-3">
            Alle vergangenen Monate werden als <Check size={12} className="inline" /> bezahlt angezeigt. Nur Ausnahmen (Verspätung, falscher Betrag) müssen erfasst werden.
          </p>
        )}
      </div>

      {/* Übersicht Forderungen */}
      {offenAnzahl > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-3xl font-black text-red-500">{offenAnzahl}</div>
          <div className="flex-1">
            <div className="font-bold text-red-700">
              {forderungen.filter(f => f.status === 'offen').length > 0 && forderungen.filter(f => f.status === 'teilweise').length > 0
                ? `${forderungen.filter(f => f.status === 'offen').length} offen, ${forderungen.filter(f => f.status === 'teilweise').length} teilbezahlt`
                : forderungen.filter(f => f.status === 'offen').length > 0
                  ? `${offenAnzahl} offene Forderung${offenAnzahl !== 1 ? 'en' : ''}`
                  : `${offenAnzahl} Forderung${offenAnzahl !== 1 ? 'en' : ''} teilbezahlt`}
            </div>
            <div className="text-sm text-red-600">Ausstehend gesamt: <strong>{formatCurrency(offenGesamt)}</strong></div>
          </div>
        </div>
      )}

      {/* Jahresauswahl + KPI */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {jahre.map(j => (
            <button key={j} onClick={() => setFilterJahr(j)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${filterJahr === j ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {j}
            </button>
          ))}
        </div>
        <div className="text-right text-sm text-gray-500">
          <span>Einnahmen {filterJahr}: <span className="font-bold text-indigo-700">{formatCurrency(jahresEinnahmen)}</span></span>
          {nkVomMieter > 0 && (
            <div className="text-xs text-gray-400 mt-0.5">
              davon Kaltmiete: <span className="font-semibold text-gray-600">{formatCurrency(jahresKalt)}</span>
              {' · '}NK: <span className="font-semibold text-gray-600">{formatCurrency(jahresNKEingegangen)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hinweis: Verlaufshistorie optional */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span><strong>Hinweis:</strong> Die erwarteten Beträge basieren auf der aktuellen Kaltmiete. Eine Verlaufshistorie (Mietanpassungen) ist <strong>optional</strong> — nur für den Miete-Verlaufsgraph relevant, nicht für Berechnungen.</span>
      </div>

      {/* Forderungs-Liste */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-3">Monat</div>
          <div className="col-span-3 text-right">Forderung</div>
          <div className="col-span-3 text-right">Eingegangen</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1"></div>
        </div>

        {forderungen.filter(f => f.jahr === filterJahr).map((f, idx) => {
          const isExpanded = detailMonat === f.monatKey;
          return (
            <div key={f.monatKey} className={`border-b border-gray-100 last:border-0 ${isExpanded ? 'bg-blue-50' : ''}`}>
              <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                {/* Monat */}
                <div className="col-span-3">
                  <div className="font-semibold text-gray-800 text-sm">{MONATE_NAMEN[f.monat]}</div>
                  <div className="text-xs text-gray-400">{f.jahr}</div>
                </div>
                {/* Forderung */}
                <div className="col-span-3 text-right">
                  <div className="text-sm font-semibold text-gray-700">{formatCurrency(f.forderungBetrag)}</div>
                </div>
                {/* Eingegangen */}
                <div className="col-span-3 text-right">
                  {f.status === 'dauerauftrag' ? (
                    <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1"><Zap size={12} /> Auto</div>
                  ) : f.eingegangen > 0 ? (
                    <div className={`text-sm font-bold ${f.eingegangen >= f.forderungBetrag ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatCurrency(f.eingegangen)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300">—</div>
                  )}
                  {/* Differenz: Typo-Fix (f.differenz statt f.diferenz) */}
                  {f.eingegangen > 0 && f.differenz !== 0 && (
                    <div className={`text-[10px] font-semibold ${f.differenz > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {f.differenz > 0 ? '+' : ''}{formatCurrency(f.differenz)}
                    </div>
                  )}
                  {/* Restforderung bei Teilzahlung */}
                  {f.status === 'teilweise' && (
                    <div className="text-[10px] text-red-500 font-semibold">
                      noch {formatCurrency(f.forderungBetrag - f.eingegangen)} offen
                    </div>
                  )}
                </div>
                {/* Status Badge */}
                <div className="col-span-2 flex justify-center">
                  {f.status === 'beglichen' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 inline-flex items-center gap-0.5"><Check size={10} /> Beglichen</span>}
                  {f.status === 'dauerauftrag' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 inline-flex items-center gap-0.5"><Zap size={10} /> Auto</span>}
                  {f.status === 'teilweise' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">~ Teilweise</span>}
                  {f.status === 'offen' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 inline-flex items-center gap-0.5"><X size={10} /> Offen</span>}
                </div>
                {/* Actions */}
                <div className="col-span-1 flex justify-end items-center gap-1">
                  {/* Schnell-Abhaken: nur bei offenen/teilweisen Forderungen */}
                  {(f.status === 'offen' || f.status === 'teilweise') && !isDauerauftrag && (
                    <button
                      onClick={() => {
                        const heute = new Date().toISOString().split('T')[0];
                        saveEingaenge([...mietEingaenge, {
                          id: Date.now(), monat: f.monatKey,
                          datum: heute, betrag: f.forderungBetrag, notiz: '', typ: 'kaltmiete'
                        }]);
                      }}
                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                      title={`${formatCurrency(f.forderungBetrag)} als eingegangen markieren`}
                    >
                      <Check size={12} />
                    </button>
                  )}
                  {/* Dropdown für Detailansicht / Korrektur */}
                  <button
                    onClick={() => setDetailMonat(isExpanded ? null : f.monatKey)}
                    className="text-gray-300 hover:text-gray-500 text-sm leading-none px-1"
                    title={isExpanded ? 'Schließen' : 'Details / Korrektur'}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-blue-100">
                  {/* Bestehende Zahlungen */}
                  {f.zahlungen.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gebuchte Zahlungen</p>
                      <div className="space-y-1.5">
                        {f.zahlungen.map(z => {
                          const zahlungMieter = z.mieterId ? mieterListe.find(m => String(m.id) === String(z.mieterId)) : null;
                          return (
                            <div key={z.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200 text-sm">
                              <div>
                                <span className="font-semibold text-emerald-700">{formatCurrency(z.betrag)}</span>
                                <span className="text-gray-400 ml-2 text-xs">eingegangen {new Date(z.datum).toLocaleDateString('de-DE')}</span>
                                {zahlungMieter && (
                                  <span className="ml-2 text-xs bg-blue-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5">
                                    <User size={11} /> {zahlungMieter.name}
                                  </span>
                                )}
                                {z.notiz && <span className="text-gray-400 ml-2 text-xs">· {z.notiz}</span>}
                              </div>
                              <button onClick={() => handleDeleteEingang(z.id)} className="text-red-400 hover:text-red-600 text-xs px-2"><X size={12} /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Neue Zahlung erfassen */}
                  <ZahlungErfassenForm
                    monatKey={f.monatKey}
                    forderungBetrag={f.forderungBetrag}
                    mieterListe={mieterListe}
                    onSave={(zahlung) => {
                      saveEingaenge([...mietEingaenge, { id: Date.now(), monat: f.monatKey, ...zahlung }]);
                      setDetailMonat(null);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {forderungen.filter(f => f.jahr === filterJahr).length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            Kein Kaufdatum hinterlegt oder keine Monate in diesem Jahr.
          </div>
        )}
      </div>

      {/* NK-Abrechnungen */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1"><FileText size={14} /> NK-Abrechnungen</h3>
          <button onClick={() => setShowNKModal(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
            + NK-Abrechnung
          </button>
        </div>

        {nkAbrechnungen.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">Noch keine NK-Abrechnungen erfasst</p>
        ) : (
          <div className="space-y-3">
            {nkAbrechnungen.map(abr => {
              const offeneRaten = abr.raten.filter(r => !r.bezahlt);
              const bezahlteRaten = abr.raten.filter(r => r.bezahlt);
              const bezahltBetrag = bezahlteRaten.reduce((s, r) => s + r.betrag, 0);
              const istVollstaendigBezahlt = offeneRaten.length === 0;
              const toggleRate = (rateId) => {
                const heute = new Date().toISOString().split('T')[0];
                const updatedAbr = { ...abr, raten: abr.raten.map(r =>
                  r.id === rateId ? { ...r, bezahlt: !r.bezahlt, bezahltAm: !r.bezahlt ? heute : null } : r
                )};
                const updated = nkAbrechnungen.map(a => a.id === abr.id ? updatedAbr : a);
                setNkAbrechnungen(updated);
                updateParams({ ...params, nkAbrechnungen: updated });
              };
              const deleteAbr = () => {
                const updated = nkAbrechnungen.filter(a => a.id !== abr.id);
                setNkAbrechnungen(updated);
                updateParams({ ...params, nkAbrechnungen: updated });
              };
              return (
                <div key={abr.id} className={`rounded-xl border p-4 ${istVollstaendigBezahlt ? 'bg-emerald-50 border-emerald-200' : abr.typ === 'nachzahlung' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${abr.typ === 'nachzahlung' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {abr.typ === 'nachzahlung' ? <span className="inline-flex items-center gap-1"><TrendingDown size={12} /> Nachzahlung</span> : <span className="inline-flex items-center gap-1"><Wallet size={12} /> Erstattung</span>}
                        </span>
                        <span className="text-xs text-gray-500">NK {abr.abrechnungsjahr}</span>
                        {istVollstaendigBezahlt && <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-0.5"><Check size={11} /> Abgeschlossen</span>}
                      </div>
                      <div className="text-lg font-black text-gray-800 mt-1">{formatCurrency(abr.gesamtbetrag)}</div>
                      {abr.notiz && <div className="text-xs text-gray-500">{abr.notiz}</div>}
                    </div>
                    <button onClick={deleteAbr} className="text-red-400 hover:text-red-600 text-xs"><X size={12} /></button>
                  </div>
                  {/* Raten */}
                  <div className="space-y-1.5">
                    {abr.raten.map(rate => (
                      <div key={rate.id} className={`flex items-center justify-between rounded-lg px-3 py-2 border text-sm ${rate.bezahlt ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleRate(rate.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold transition-colors ${rate.bezahlt ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'}`}>
                            {rate.bezahlt ? <Check size={10} /> : ''}
                          </button>
                          <span className={`font-semibold ${rate.bezahlt ? '' : 'text-gray-800'}`}>{formatCurrency(rate.betrag)}</span>
                          <span className="text-xs text-gray-400">
                            {rate.bezahlt ? `bezahlt ${rate.bezahltAm ? new Date(rate.bezahltAm).toLocaleDateString('de-DE') : ''}` : `fällig ${new Date(rate.faelligDatum).toLocaleDateString('de-DE')}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!istVollstaendigBezahlt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Noch offen: <strong>{formatCurrency(abr.gesamtbetrag - bezahltBetrag)}</strong> ({offeneRaten.length} Rate{offeneRaten.length !== 1 ? 'n' : ''})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNKModal && (
        <NKAbrechnungModal
          abrechnungsjahr={filterJahr - 1}
          onClose={() => setShowNKModal(false)}
          onSave={(abr) => {
            const updated = [...nkAbrechnungen, abr];
            setNkAbrechnungen(updated);
            updateParams({ ...params, nkAbrechnungen: updated });
            setShowNKModal(false);
          }}
        />
      )}
    </div>
  );
};

// Inline-Formular zum Erfassen einer Zahlung für einen Monat

export default MieteinnahmenTracker;
