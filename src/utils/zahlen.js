// Zahlen robust machen — EINE Stelle für alle Rechnungen.
//
// Hintergrund: Eingabefelder liefern Text ("800"), leere Felder liefern "". In
// JavaScript ergibt "800" + 160 = "800160" (Text wird angehängt statt addiert).
// Deshalb werden Immobilien-Daten vor jeder Rechnung normalisiert:
//   • Text mit Zahl → Zahl ("1.234,50" und "1234.5" werden verstanden)
//   • "" oder Unsinn → null (gilt dann als "nicht ausgefüllt", wie bisher)
//   • Zahlen, null und undefined bleiben unverändert (Default-Logik bleibt gleich)

export function zahlAusText(v) {
  if (v === null || v === undefined) return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const t = String(v).trim().replace(/\s|€|%/g, '');
  if (t === '') return null;
  const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return Number.isFinite(n) ? n : null;
}

// Zahl mit Ersatzwert (für Summen): zahl("800") = 800, zahl("") = 0
export const zahl = (v, ersatz = 0) => {
  const n = zahlAusText(v);
  return n === null || n === undefined ? ersatz : n;
};

const normFelder = (obj, felder) => {
  if (!obj || typeof obj !== 'object') return obj;
  let neu = null;
  for (const f of felder) {
    const v = obj[f];
    if (v === null || v === undefined || typeof v === 'number' && Number.isFinite(v)) continue;
    if (typeof v === 'object') continue;
    const n = zahlAusText(v);
    if (n !== v) { neu = neu || { ...obj }; neu[f] = n; }
  }
  return neu || obj;
};
const normListe = (liste, felder, extra) => Array.isArray(liste)
  ? liste.map(x => { const y = normFelder(x, felder); return extra ? extra(y) : y; })
  : liste;

const IMMO_FELDER = [
  'kaufpreis', 'kaufnebenkosten', 'wohnflaeche', 'grundstueck', 'zimmer', 'kaltmiete', 'geschaetzterWert',
  'eigenkapital', 'ekFuerNebenkosten', 'ekFuerKaufpreis', 'finanzierungsbetrag', 'zinssatz', 'tilgung', 'laufzeit',
  'nebenkosten', 'instandhaltung', 'verwaltung', 'hausgeld', 'strom', 'internet', 'nebenkostenVomMieter',
  'wertsteigerung', 'mietsteigerung', 'steuersatz', 'gebaeudeAnteilProzent', 'afaSatz', 'grundsteuerMonat',
  'versicherungMonat', 'entfernungKm', 'kmPauschale', 'fahrtenProMonat', 'eigeneWarmmiete', 'anzahlZimmerVermietet',
  'untermieteProZimmer', 'arbitrageStrom', 'arbitrageInternet', 'arbitrageGEZ', 'arbitrageSonstige', 'arbitrageHeizung',
  'dauerauftragBetrag', 'userAnteil', 'aktuelleRestschuld', 'kreditMonatsrate',
  'hausgeldNichtUmlagefaehig', 'kontofuehrung', 'heizung', 'rundfunk', 'kappungsgrenze', 'mieteFaelligkeitstag',
];
const PHASEN_FELDER = ['sollzinssatz', 'zinssatz', 'effektivzins', 'anfangstilgung', 'tilgungssatz', 'zinsbindung', 'laufzeit',
  'monatlicherBetrag', 'monatlicheTilgung', 'restschuldOverride', 'sondertilgungErlaubtProzent', 'sondertilgungJaehrlich',
  'schlusszahlung', 'startbetrag', 'darlehensbetrag'];
const BAUSPAR_FELDER = ['bausparsumme', 'monatlicheSparrate', 'aktuellerSparbetrag', 'guthabenzins', 'darlehenszins', 'abschlussgebuehr'];
const ANPASSUNG_FELDER = ['kaltmiete', 'eigeneWarmmiete', 'untermieteProZimmer', 'nebenkostenVomMieter', 'instandhaltung',
  'verwaltung', 'hausgeld', 'strom', 'internet', 'hausgeldNichtUmlagefaehig', 'grundsteuerMonat', 'versicherungMonat', 'betrag'];

// Liefert eine Kopie mit sauberen Zahlen (oder dasselbe Objekt, wenn nichts zu tun ist).
export function normalisiereImmobilie(immo) {
  if (!immo || typeof immo !== 'object') return immo;
  let r = normFelder(immo, IMMO_FELDER);
  const setze = (k, v) => { if (v !== r[k]) { if (r === immo) r = { ...immo }; r[k] = v; } };

  setze('finanzierungsphasen', normListe(immo.finanzierungsphasen, PHASEN_FELDER,
    (p) => Array.isArray(p?.sondertilgungen) ? { ...p, sondertilgungen: normListe(p.sondertilgungen, ['betrag']) } : p));
  setze('bausparvertraege', normListe(immo.bausparvertraege, BAUSPAR_FELDER));
  setze('mietAnpassungen', normListe(immo.mietAnpassungen, ANPASSUNG_FELDER));
  setze('investitionen', normListe(immo.investitionen, ['betrag']));
  setze('wohnungen', normListe(immo.wohnungen, ['kaltmiete', 'wohnflaeche', 'nebenkosten', 'nkVorauszahlung'],
    (w) => w?.kosten && typeof w.kosten === 'object'
      ? { ...w, kosten: Object.fromEntries(Object.entries(w.kosten).map(([k, v]) => [k, typeof v === 'object' ? v : zahlAusText(v)])) }
      : w));
  if (immo.stellplatz && typeof immo.stellplatz === 'object') setze('stellplatz', normFelder(immo.stellplatz, ['monatlicheMiete', 'anzahl', 'kosten']));
  if (immo.mietHistorie && typeof immo.mietHistorie === 'object' && !Array.isArray(immo.mietHistorie)) {
    let geaendert = false;
    const mh = Object.fromEntries(Object.entries(immo.mietHistorie).map(([k, e]) => {
      const n = e && typeof e === 'object' ? normFelder(e, ANPASSUNG_FELDER) : e;
      if (n !== e) geaendert = true;
      return [k, n];
    }));
    if (geaendert) setze('mietHistorie', mh);
  }
  return r;
}
