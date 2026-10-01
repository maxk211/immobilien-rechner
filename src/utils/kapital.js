// Kapital-Kennzahlen (UX-Paket Teil 3, Abschnitt 4 + 9):
//  - Netto-Vermögen  = Marktwert − Restschuld (UX-Gesamtpaket A.4: eine Zahl, ein Name)
//  - Beleihbar frei   = Beleihungsgrenze × Marktwert − Restschuld, mindestens 0
//  - Cashflow vor Tilgung = Cashflow nach Tilgung + monatliche Tilgung
// Die Beleihungsgrenze ist eine Annahme und gehört in die Einstellungen (Standard 80 %).
import { berechneImmoVermoegenswerte, cashflowMonat } from './berechnung.js';

const KEY = 'renditlyBeleihungsgrenze';
export const BELEIHUNGSGRENZE_STANDARD = 80;

export function getBeleihungsgrenze() {
  try {
    const v = Number(localStorage.getItem(KEY));
    if (v >= 40 && v <= 100) return v;
  } catch (e) { /* kein Storage */ }
  return BELEIHUNGSGRENZE_STANDARD;
}

export function setBeleihungsgrenze(prozent) {
  try { localStorage.setItem(KEY, String(prozent)); } catch (e) { /* ignorieren */ }
  try { window.dispatchEvent(new Event('renditly-beleihungsgrenze')); } catch (e) { /* SSR */ }
}

export const beleihbarFrei = (marktwert, restschuld, grenze = getBeleihungsgrenze()) =>
  Math.max(0, (grenze / 100) * (marktwert || 0) - (restschuld || 0));

// Kapitalwerte eines Objekts. Mietimmobilien (Arbitrage) haben weder Wert noch Kredit.
export function kapitalWerte(immo, grenze = getBeleihungsgrenze()) {
  const vw = berechneImmoVermoegenswerte(immo);
  if (!vw) return null;
  const marktwert = vw.marktwert || 0;
  const restschuld = vw.restschuld || 0;
  return {
    marktwert,
    restschuld,
    deinAnteil: marktwert - restschuld,
    beleihbarFrei: beleihbarFrei(marktwert, restschuld, grenze),
    tilgungMonat: (vw.tilgungJahr || 0) / 12,
  };
}

// Cashflow nach und vor Tilgung (monatlich) — dieselbe Funktion wie Cockpit und Zahlen-Reiter
export function cashflowVorNach(immo) {
  const cf = cashflowMonat(immo);
  return {
    nach: cf.nach,
    vor: cf.vor,
    tilgung: cf.tilgung,
    bauspar: cf.bauspar,
    hatKredit: cf.hatKredit,
  };
}
