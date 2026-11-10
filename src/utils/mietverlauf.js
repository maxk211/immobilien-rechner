// Mietverlauf — EINE Quelle für die Miete eines Mietverhältnisses.
//
// Gespeichert wird nur am Objekt (Eigentumswohnung: immo.kaltmiete + immo.mietAnpassungen) bzw.
// an der Wohnung (Mehrfamilienhaus: w.kaltmiete + w.mietAnpassungen). Alles andere — „aktuelle
// Kaltmiete“, „letzte Mieterhöhung“ am Mieter, Prozent, Alt/Neu — wird daraus ABGELEITET.
// So gibt es eine Zahl nie an zwei Stellen.
//
// mietAnpassungen enthält auch reine Kosten-Einträge (Hausgeld ab …); die bleiben unangetastet.

import { zahl, zahlAusText } from './zahlen.js';
import { artVon, tag } from './kappung.js';

const iso = (s) => String(s || '').slice(0, 10);
const istMiete = (a) => a && a.datum && a.kaltmiete != null && a.kaltmiete !== '';
const MIET_FELDER = ['kaltmiete', 'vorher', 'grund', 'art', 'quelle'];

// Zeilen für die Anzeige: Gültig ab · Grund · Alt · Neu · %
export function mietZeilen(quelle) {
  const liste = (quelle?.mietAnpassungen || []).filter(istMiete)
    .map(a => ({ ...a, d: tag(a.datum) })).filter(a => a.d).sort((a, b) => a.d - b.d);
  return liste.map((a, i) => {
    const alt = i === 0
      ? (a.vorher != null && a.vorher !== '' ? zahl(a.vorher) : zahl(quelle?.kaltmiete))
      : zahl(liste[i - 1].kaltmiete);
    const neu = zahl(a.kaltmiete);
    return {
      datum: iso(a.datum), d: a.d, grund: a.grund || 'Mieterhöhung', art: artVon(a),
      alt, neu, diff: neu - alt, prozent: alt > 0 ? Math.round((neu / alt - 1) * 1000) / 10 : null,
      erste: i === 0, zukunft: a.d > new Date(),
    };
  });
}

// Miete, die unmittelbar VOR einem Datum galt (für Alt bei rückwirkenden Einträgen)
export function mieteVor(quelle, datum) {
  const d = tag(datum);
  const z = mietZeilen(quelle).filter(r => r.d < d);
  if (z.length) return z[z.length - 1].neu;
  const erste = mietZeilen(quelle)[0];
  return erste ? erste.alt : zahl(quelle?.kaltmiete);
}
export const istVorErster = (quelle, datum) => { const z = mietZeilen(quelle); return !z.length || tag(datum) < z[0].d; };

// Anpassung setzen (neu oder bearbeitet). altesDatum: beim Bearbeiten das bisherige Datum.
export function setzeMietanpassung(liste, { datum, kaltmiete, grund = 'Mieterhöhung', vorher = null }, altesDatum = null) {
  let neu = [...(liste || [])];
  if (altesDatum && iso(altesDatum) !== iso(datum)) neu = entferneMietanpassung(neu, altesDatum);
  const i = neu.findIndex(a => iso(a.datum) === iso(datum));
  const miete = { kaltmiete: zahl(kaltmiete), grund, ...(vorher != null && vorher !== '' ? { vorher: zahl(vorher) } : {}) };
  if (i >= 0) {
    const ohne = { ...neu[i] }; delete ohne.vorher; delete ohne.quelle;
    neu[i] = { ...ohne, datum: iso(datum), ...miete };
  } else neu.push({ datum: iso(datum), ...miete });
  return neu.sort((a, b) => new Date(a.datum) - new Date(b.datum));
}

// Mietanpassung entfernen — Kosten-Felder desselben Eintrags bleiben erhalten
export function entferneMietanpassung(liste, datum) {
  return (liste || []).flatMap(a => {
    if (iso(a.datum) !== iso(datum) || !istMiete(a)) return [a];
    const rest = { ...a }; MIET_FELDER.forEach(k => delete rest[k]);
    return Object.keys(rest).some(k => k !== 'datum' && k !== 'id') ? [rest] : [];
  });
}

// Aktuelle Miete (heute gültig, angekündigte Erhöhungen zählen erst ab ihrem Datum)
export function aktuelleMiete(quelle, heute = new Date()) {
  const z = mietZeilen(quelle).filter(r => r.d <= heute);
  if (z.length) return z[z.length - 1].neu;
  const erste = mietZeilen(quelle)[0];
  return erste ? erste.alt : zahl(quelle?.kaltmiete);
}

// „Kaltmiete“ an einer Stelle ändern → genau die Zahl ändern, aus der sie kommt
// (ohne Anpassungen: Ausgangsmiete; sonst die heute gültige Anpassung).
export function aktuelleMieteAendern(quelle, wert, heute = new Date()) {
  const z = mietZeilen(quelle).filter(r => r.d <= heute);
  if (!z.length) {
    const erste = mietZeilen(quelle)[0];
    // Nur künftige Anpassungen: deren „vorher“ bzw. die Ausgangsmiete ist die heutige Miete
    if (erste && (quelle.mietAnpassungen || []).some(a => istMiete(a) && iso(a.datum) === erste.datum && a.vorher != null && a.vorher !== '')) {
      return { mietAnpassungen: (quelle.mietAnpassungen || []).map(a => (istMiete(a) && iso(a.datum) === erste.datum ? { ...a, vorher: zahl(wert) } : a)) };
    }
    return { kaltmiete: zahl(wert) };
  }
  const letzte = z[z.length - 1];
  return { mietAnpassungen: (quelle.mietAnpassungen || []).map(a => (istMiete(a) && iso(a.datum) === letzte.datum ? { ...a, kaltmiete: zahl(wert) } : a)) };
}

// Letzte Mieterhöhung nach § 558 im laufenden Mietverhältnis (ab Mietbeginn)
export function letzteErhoehungZeile(quelle, mietbeginn = null) {
  const S = tag(mietbeginn);
  const z = mietZeilen(quelle).filter(r => r.art === 'erhoehung' && (!S || r.d >= S));
  return z.length ? z[z.length - 1] : null;
}

// Spiegel am Mieterdatensatz — nie selbst bearbeitet, immer aus dem Verlauf berechnet
// bisherLetzte: bisheriges Datum am Mieter (Altbestand ohne Betrag bleibt, bis eine Erhöhung erfasst
// ist); wurde genau diese Erhöhung im Verlauf gelöscht, fällt auch das Datum weg.
export function mieterSpiegel(quelle, { mietbeginn = null, nieErhoeht = false, bisherLetzte = null, vorherQuelle = null } = {}) {
  const z = letzteErhoehungZeile(quelle, mietbeginn);
  const geloescht = bisherLetzte && vorherQuelle && mietZeilen(vorherQuelle).some(r => r.datum === iso(bisherLetzte))
    && !mietZeilen(quelle).some(r => r.datum === iso(bisherLetzte));
  return {
    kaltmiete: aktuelleMiete(quelle),
    letzteMieterhoehung: z ? z.datum : (nieErhoeht && mietbeginn ? iso(mietbeginn) : (geloescht ? null : (bisherLetzte ? iso(bisherLetzte) : null))),
    mietanpassungenMieter: [], // frühere Zweitliste am Mieter — Daten stehen jetzt am Objekt/an der Wohnung
  };
}

// Altbestand: Anpassungen, die nur am Mieter standen (alte Zweitliste), in den Verlauf übernehmen
export function mieterListeUebernehmen(quelle, mieterAnpassungen = []) {
  let liste = [...(quelle?.mietAnpassungen || [])];
  const vorhanden = new Set(liste.filter(istMiete).map(a => iso(a.datum)));
  (mieterAnpassungen || []).forEach(a => {
    const betrag = zahl(a?.betrag ?? a?.kaltmiete, null);
    if (!a?.datum || !(betrag > 0) || vorhanden.has(iso(a.datum))) return;
    liste = setzeMietanpassung(liste, { datum: a.datum, kaltmiete: betrag, grund: a.grund || 'Mieterhöhung' });
    vorhanden.add(iso(a.datum));
  });
  return liste;
}

// Eingabe „Neue Kaltmiete“ / „Erhöhung in %“ / „Miete davor“ → Werte (Komma erlaubt)
export function eingabeAuswerten({ vorher, neu, prozent }, altBekannt) {
  const v = zahlAusText(vorher), n = zahlAusText(neu), p = zahlAusText(prozent);
  const alt = v ?? altBekannt;
  if (n != null && n > 0) return { alt, neu: n, prozent: alt > 0 ? Math.round((n / alt - 1) * 1000) / 10 : null, vorherEingabe: v };
  if (p != null && alt > 0) return { alt, neu: Math.round(alt * (1 + p / 100) * 100) / 100, prozent: p, vorherEingabe: v };
  return { alt, neu: null, prozent: null, vorherEingabe: v };
}

// ── Alte Jahreswerte („manuell“ je Jahr/Monat) in Mietverlauf und Kostenanpassungen übernehmen ──
// Ein Jahreswert gilt nur für sein Jahr: am Anfang ein Eintrag mit dem Wert, danach wieder der Wert,
// der ohne ihn gegolten hätte. So bleibt jede Zahl an genau einer Stelle (mietAnpassungen).
const wertAm = (p, feld, datum) => {
  const d = tag(datum);
  if (feld === 'kaltmiete') return mietZeilen(p).filter(r => r.d <= d).slice(-1)[0]?.neu ?? (mietZeilen(p)[0]?.alt ?? zahl(p.kaltmiete));
  let w = zahl(p[feld]);
  [...(p.mietAnpassungen || [])].filter(a => a && a[feld] != null && a[feld] !== '' && a.datum).sort((a, b) => new Date(a.datum) - new Date(b.datum))
    .forEach(a => { if (tag(a.datum) <= d) w = zahl(a[feld]); });
  return w;
};
export function hatJahreswerte(p) { return Object.values(p?.mietHistorie || {}).some(e => e && Object.keys(e).length); }
export function jahreswerteUebernehmen(p) {
  const hist = p?.mietHistorie || {};
  const stuecke = Object.entries(hist).map(([k, e]) => {
    const m = String(k).match(/^(\d{4})(?:-(\d{1,2}))?$/);
    if (!m || !e) return null;
    const y = +m[1], mon = m[2] != null ? +m[2] : null;
    const von = mon == null ? new Date(y, 0, 1, 12) : new Date(y, mon, 1, 12);
    const bis = mon == null ? new Date(y + 1, 0, 1, 12) : new Date(y, mon + 1, 1, 12);
    return { von, bis, felder: e };
  }).filter(Boolean).sort((a, b) => a.von - b.von);
  let liste = [...(p.mietAnpassungen || [])];
  const isoD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  const setze = (datum, feld, wert) => {
    if (feld === 'kaltmiete') { liste = setzeMietanpassung(liste, { datum, kaltmiete: wert, grund: 'Korrektur (Jahreswert)' }); return; }
    const i = liste.findIndex(a => String(a.datum).slice(0, 10) === datum);
    if (i >= 0) liste[i] = { ...liste[i], [feld]: zahl(wert) }; else liste.push({ datum, [feld]: zahl(wert) });
  };
  stuecke.forEach(st => Object.entries(st.felder).forEach(([feld, wert]) => {
    if (wert === null || wert === undefined || wert === '') return;
    setze(isoD(st.von), feld, wert);
    const folgt = stuecke.some(x => +x.von === +st.bis && x.felder[feld] != null && x.felder[feld] !== '');
    if (!folgt) setze(isoD(st.bis), feld, wertAm(p, feld, st.bis));
  }));
  liste.sort((a, b) => new Date(a.datum) - new Date(b.datum));
  return { mietAnpassungen: liste, mietHistorie: {}, mietModus: 'automatisch' };
}
