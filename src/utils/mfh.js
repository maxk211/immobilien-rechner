// Mehrfamilienhaus — Miete je Wohneinheit. EINE Regel für Cockpit, Mieteingänge,
// Cashflow, Steuer, Karte und „Was steht an“.
//
// Je Wohnung: kaltmiete = Ausgangsmiete, mietAnpassungen[] = { datum, kaltmiete } (Mieterhöhungen),
// letzteMieterhoehung = 'JJJJ-MM-TT' (manuell erfasst), mietEingaenge[] wie bei der Eigentumswohnung.
// Auf Objektebene werden kaltmiete (Summe der Ausgangsmieten) und mietAnpassungen (Summe aller
// Wohnungen zu jedem Anpassungsdatum) daraus abgeleitet, damit Steuer, Prognose und Export
// dieselben Funktionen nutzen wie bei der Eigentumswohnung.

import { zahl } from './zahlen.js';
import { berechneMietStatusFuerMonat } from './miete.js';

const anpassungenVon = (w) => (w?.mietAnpassungen || [])
  .filter(a => a && a.kaltmiete != null && a.kaltmiete !== '' && a.datum)
  .sort((a, b) => new Date(a.datum) - new Date(b.datum));

// Kaltmiete einer Wohnung zu einem Stichtag (Ende des Tages)
export function weMieteAm(w, datum = new Date()) {
  const stichtag = new Date(datum); stichtag.setHours(23, 59, 59, 999);
  const liste = anpassungenVon(w);
  let miete = liste.length && liste[0].vorher != null && liste[0].vorher !== '' ? zahl(liste[0].vorher) : zahl(w?.kaltmiete);
  for (const a of liste) { if (new Date(a.datum) <= stichtag) miete = zahl(a.kaltmiete); else break; }
  return miete;
}

// Soll-Miete eines Monats (Monatsmitte wie im Mieteingänge-Tracker)
export const weMieteImMonat = (w, jahr, monatNr) => weMieteAm(w, new Date(jahr, monatNr - 1, 15));

export const mfhMieteAm = (wohnungen, datum = new Date()) => (wohnungen || []).reduce((s, w) => s + weMieteAm(w, datum), 0);

// Objektwerte aus den Wohnungen: Ausgangsmiete + Anpassungs-Zeitreihe
export function mfhMietAggregat(wohnungen) {
  const liste = wohnungen || [];
  // Ausgangsmiete = Miete vor der ersten Anpassung (inkl. nachgetragenem „vorher“)
  const kaltmiete = liste.reduce((s, w) => s + weMieteAm(w, new Date(1900, 0, 1)), 0);
  const daten = [...new Set(liste.flatMap(w => anpassungenVon(w).map(a => String(a.datum).slice(0, 10))))].sort();
  const mietAnpassungen = daten.map(d => ({ datum: d, kaltmiete: Math.round(mfhMieteAm(liste, new Date(d)) * 100) / 100, quelle: 'wohnungen' }));
  return { kaltmiete, mietAnpassungen };
}
export const hatWeAnpassungen = (wohnungen) => (wohnungen || []).some(w => anpassungenVon(w).length > 0);

// Ist die Wohnung in diesem Monat vermietet? (Mieter eingetragen, Mietbeginn/-ende beachtet)
export function weVermietetImMonat(w, jahr, monatNr) {
  if (!w?.mieterName) return false;
  if (w.mietbeginn && new Date(w.mietbeginn) > new Date(jahr, monatNr - 1, 28)) return false;
  if (w.mietende && new Date(w.mietende) < new Date(jahr, monatNr - 1, 15)) return false;
  return true;
}

// Status aller Wohnungen in einem Monat
export function mfhMonatsStatus(wohnungen, jahr, monatNr) {
  return (wohnungen || []).map((w, idx) => {
    const vermietet = weVermietetImMonat(w, jahr, monatNr);
    const soll = vermietet ? weMieteImMonat(w, jahr, monatNr) : 0;
    // Dauerauftrag je Wohnung: gilt als eingegangen, solange kein „nicht bezahlt“ vermerkt ist
    const da = !!w.dauerauftrag;
    const st = berechneMietStatusFuerMonat(w.mietEingaenge, jahr, monatNr, soll, da);
    const status = !(vermietet && soll > 0) ? 'keine' : st.status === 'dauerauftrag' ? 'bezahlt' : st.status;
    return { idx, w, name: w.name || `WE ${idx + 1}`, vermietet, soll, ist: st.status === 'dauerauftrag' ? soll : st.summe, status, dauerauftrag: st.status === 'dauerauftrag' };
  });
}

// „Alle als eingegangen“: bucht für jede vermietete Wohnung, für die in dem Monat noch NICHTS
// gebucht ist, die Soll-Miete. Teilzahlungen und „nicht bezahlt“-Vermerke bleiben unangetastet —
// die hat jemand bewusst erfasst.
export function alleMietenBuchen(wohnungen, jahr, monatNr, { notiz = 'Sammelbuchung' } = {}) {
  const monat = `${jahr}-${String(monatNr).padStart(2, '0')}`;
  const status = mfhMonatsStatus(wohnungen, jahr, monatNr);
  const gebucht = [];
  const basisId = Date.now();
  const neu = (wohnungen || []).map((w, i) => {
    const s = status[i];
    if (s.status !== 'offen') return w;
    const id = basisId + i;
    gebucht.push({ idx: i, id, name: s.name, betrag: s.soll });
    return { ...w, mietEingaenge: [...(w.mietEingaenge || []), { id, datum: `${monat}-01`, monat, betrag: s.soll, typ: 'kaltmiete', notiz, sammel: true }] };
  });
  const uebrig = status.filter(s => s.status === 'teilweise' || s.status === 'nicht_bezahlt');
  return { wohnungen: neu, gebucht, uebrig, summe: gebucht.reduce((s, g) => s + g.betrag, 0) };
}

// Rückgängig: genau die Buchungen einer Sammelbuchung wieder entfernen
export const sammelbuchungZurueck = (wohnungen, ids) => {
  const weg = new Set(ids);
  return (wohnungen || []).map(w => ((w.mietEingaenge || []).some(e => weg.has(e.id))
    ? { ...w, mietEingaenge: w.mietEingaenge.filter(e => !weg.has(e.id)) } : w));
};

// Rest des Monats für EINE Wohnung buchen (Ein-Klick im Cockpit)
export function weMieteBuchen(wohnungen, idx, jahr, monatNr) {
  const w = wohnungen[idx];
  if (!w || w.dauerauftrag) return wohnungen;
  const monat = `${jahr}-${String(monatNr).padStart(2, '0')}`;
  const soll = weMieteImMonat(w, jahr, monatNr);
  const st = berechneMietStatusFuerMonat(w.mietEingaenge, jahr, monatNr, soll, false);
  const rest = Math.max(0, Math.round((soll - st.summe) * 100) / 100);
  if (!(rest > 0)) return wohnungen;
  const heute = new Date();
  const datum = (heute.getFullYear() === jahr && heute.getMonth() + 1 === monatNr)
    ? `${monat}-${String(heute.getDate()).padStart(2, '0')}` : `${monat}-01`;
  const neu = [...wohnungen];
  neu[idx] = { ...w, mietEingaenge: [...(w.mietEingaenge || []), { id: Date.now(), datum, monat, betrag: rest, typ: 'kaltmiete', notiz: '' }] };
  return neu;
}

// Letzte Mieterhöhung einer Wohnung: spätestes Datum aus Wohnung, Mieterdatensatz und
// eingetragenen Anpassungen. Eine angekündigte (künftige) Erhöhung zählt mit ihrem
// Wirksamkeitsdatum — sonst schlüge „Was steht an“ eine zweite Erhöhung vor. null = nicht hinterlegt.
export function letzteErhoehungWE(w, mieter = null) {
  let letzte = null;
  const nimm = (s) => { if (!s) return; const d = new Date(s); if (!Number.isNaN(d.getTime()) && (!letzte || d > letzte)) letzte = d; };
  nimm(w?.letzteMieterhoehung);
  nimm(mieter?.letzte_mieterhoehung || mieter?.letzteMieterhoehung);
  anpassungenVon(w).forEach(a => nimm(a.datum));
  return letzte;
}

// Neue Miete ab Datum für eine Wohnung eintragen (Mieterhöhung)
// extra: { grund, vorher } — Modernisierung/Neuvermietung zählen nicht als „letzte Mieterhöhung“ (§ 558)
export function weMieterhoehung(w, datum, kaltmiete, extra = {}) {
  const rest = (w.mietAnpassungen || []).filter(a => String(a.datum).slice(0, 10) !== String(datum).slice(0, 10));
  const grund = extra.grund || 'Mieterhöhung';
  const zaehlt = !/modern|neuverm|senk|staffel|index/i.test(grund);
  const eintrag = { datum, kaltmiete: zahl(kaltmiete), grund, ...(extra.vorher != null && extra.vorher !== '' ? { vorher: zahl(extra.vorher) } : {}) };
  return {
    ...w,
    mietAnpassungen: [...rest, eintrag].sort((a, b) => new Date(a.datum) - new Date(b.datum)),
    letzteMieterhoehung: zaehlt && (!w.letzteMieterhoehung || new Date(datum) > new Date(w.letzteMieterhoehung)) ? datum : (w.letzteMieterhoehung || null),
  };
}
