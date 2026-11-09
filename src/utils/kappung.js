// Mieterhöhung bis zur ortsüblichen Vergleichsmiete (§ 558 BGB) — EINE Rechnung für
// „Was steht an“, Mieter-Seite, Wohnungskarten, „Was wäre, wenn?“ und das Mieterhöhungsschreiben.
//
// Regeln (Stand Nov. 2026, keine Rechtsberatung):
//  • 15 Monate: Die Miete muss zum Wirksamkeitstag seit 15 Monaten unverändert sein. Das
//    Erhöhungsverlangen frühestens 12 Monate nach der letzten Erhöhung; wirksam ab dem
//    dritten Kalendermonat nach Zugang (§ 558b).
//  • Kappungsgrenze: höchstens +20 % in drei Jahren, in Gebieten mit Landesverordnung +15 %.
//    Ausgangswert ist die Miete drei Jahre VOR dem Wirksamkeitstag.
//  • Erhöhungen wegen Modernisierung (§ 559) zählen weder für die 15 Monate noch für die
//    Kappungsgrenze. Bei Staffel- oder Indexmiete gibt es keine Erhöhung nach § 558.
//  • Neuvermietung: neues Mietverhältnis — Fristen und Kappungsgrenze beginnen neu.
//  • Obergrenze bleibt zusätzlich die ortsübliche Vergleichsmiete (Mietspiegel) — die kennt renditly nicht.
//
// Datenmodell einer Anpassung: { datum, kaltmiete (neu), vorher? (Miete davor), grund? }.
// `vorher` ist nötig, wenn vor dieser Anpassung keine Miete bekannt ist (z. B. nachgetragene
// Erhöhung, die Ausgangsmiete steht bereits auf dem erhöhten Wert).

import { zahl } from './zahlen.js';

export const GRUENDE = ['Mieterhöhung', 'Mietspiegel', 'Modernisierung', 'Neuvermietung', 'Staffelmiete', 'Indexmiete', 'Mietsenkung'];

export function artVon(a) {
  const g = String(a?.art || a?.grund || '').toLowerCase();
  if (g.includes('modern')) return 'modernisierung';
  if (g.includes('neuverm')) return 'neuvermietung';
  if (g.includes('staffel')) return 'staffel';
  if (g.includes('index')) return 'index';
  if (g.includes('senk')) return 'senkung';
  return 'erhoehung'; // Mieterhöhung, Mietspiegel, ohne Angabe → zählt (vorsichtige Annahme)
}

// Datum ohne Zeitzonen-Verschiebung (Mittag)
export const tag = (s) => {
  if (!s) return null;
  if (s instanceof Date) return new Date(s.getFullYear(), s.getMonth(), s.getDate(), 12);
  const m = String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +(m[3] || 1), 12);
  const d = new Date(s); return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
};
export const plusMonate = (d, n) => { const x = new Date(d); const t = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + n); x.setDate(Math.min(t, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); return x; };
const ersterNaechster = (d) => (d.getDate() === 1 ? new Date(d.getFullYear(), d.getMonth(), 1, 12) : new Date(d.getFullYear(), d.getMonth() + 1, 1, 12));
const isoTag = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const monatJahr = (d) => (d ? d.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }) : '');

export function anpassungsListe(anp) {
  return (anp || [])
    .filter(a => a && a.datum && a.kaltmiete != null && a.kaltmiete !== '')
    .map(a => ({ ...a, d: tag(a.datum), neu: zahl(a.kaltmiete), vorherWert: a.vorher != null && a.vorher !== '' ? zahl(a.vorher) : null, art: artVon(a) }))
    .filter(a => a.d)
    .sort((a, b) => a.d - b.d);
}

// Kaltmiete zu einem Stichtag. Vor der ersten Anpassung gilt deren „vorher“ (falls erfasst),
// sonst die hinterlegte Ausgangsmiete.
export function mieteZum(quelle, datum) {
  const liste = anpassungsListe(quelle?.mietAnpassungen);
  const d = tag(datum) || new Date();
  let m = liste.length && liste[0].vorherWert != null ? liste[0].vorherWert : zahl(quelle?.kaltmiete);
  for (const a of liste) { if (a.d <= d) m = a.neu; else break; }
  return m;
}

// ── Orte mit abgesenkter Kappungsgrenze (15 %) ───────────────────────────────
// Bewusst klein und geprüft gehalten; wird erweitert. Vorschlag, kein stilles Setzen.
export const KAPPUNG_ORTE = [
  { name: 'Erfurt', land: 'Thüringen', bis: '2029-09-30', quelle: 'Thüringer Kappungsgrenzen-Verordnung',
    plz: ['99084', '99085', '99086', '99087', '99089', '99091', '99092', '99094', '99095', '99096', '99097', '99098', '99099'] },
  { name: 'Jena', land: 'Thüringen', bis: '2029-09-30', quelle: 'Thüringer Kappungsgrenzen-Verordnung',
    plz: ['07743', '07745', '07747', '07749', '07751'] },
];

export function kappungsOrt(immo, heute = new Date()) {
  const text = [immo?.adresse, immo?.ort, immo?.stadt].filter(Boolean).join(' ');
  const plz = String(immo?.plz || '').trim() || (text.match(/\b(\d{5})\b/) || [])[1] || '';
  const ort = KAPPUNG_ORTE.find(o => (plz && o.plz.includes(plz)) || new RegExp(`\\b${o.name}\\b`, 'i').test(text));
  if (!ort || tag(ort.bis) < tag(heute)) return null;
  return ort;
}

// Welche Grenze gilt? Eingestellt (15/20) hat Vorrang; sonst Ort-Vorschlag (vorsichtig 15 %), sonst 20 %.
export function kappungsgrenze(immo, heute = new Date()) {
  const k = Number(immo?.kappungsgrenze);
  const ort = kappungsOrt(immo, heute);
  if (k === 15 || k === 20) return { prozent: k, quelle: 'eingestellt', ort };
  if (ort) return { prozent: 15, quelle: 'ort', ort };
  return { prozent: 20, quelle: 'standard', ort: null };
}

// Höchstmiete nach Kappungsgrenze für einen Wirksamkeitstag D. mietbeginn: Beginn des
// Mietverhältnisses (davor zählt nichts). Modernisierungserhöhungen im Fenster kommen obendrauf.
export function kappungsMaxZum({ kaltmiete, mietAnpassungen, mietbeginn = null, prozent = 20 }, datum) {
  const q = { kaltmiete, mietAnpassungen };
  const liste = anpassungsListe(mietAnpassungen);
  const D = tag(datum);
  const S = tag(mietbeginn);
  const vor3 = new Date(D); vor3.setFullYear(vor3.getFullYear() - 3);
  const basis = S && vor3 < S ? mieteZum(q, S) : mieteZum(q, vor3);
  const zuschlag = liste.filter(a => a.art === 'modernisierung' && a.d > vor3 && a.d <= D && (!S || a.d >= S))
    .reduce((x, a) => x + Math.max(0, a.neu - (a.vorherWert ?? mieteZum(q, new Date(a.d.getTime() - 86400000)))), 0);
  return { basis, max: Math.floor(basis * (1 + prozent / 100) + zuschlag) };
}

// ── Kern: wann ist die nächste Erhöhung möglich und wie viel? ────────────────
// status: 'moeglich' | 'warten' (15-Monats-Frist läuft) | 'ausgeschoepft' (Kappungsgrenze voll)
//       | 'betrag_fehlt' (Datum der letzten Erhöhung bekannt, Betrag nicht) | 'datum_fehlt'
//       | 'vertrag' (Staffel-/Indexmiete — keine Erhöhung nach § 558)
export function naechsteErhoehung({ kaltmiete, mietAnpassungen, letzteErhoehung = null, mietbeginn = null, prozent = 20, heute = new Date() }) {
  const q = { kaltmiete, mietAnpassungen };
  const liste = anpassungsListe(mietAnpassungen);
  const h = tag(heute);
  const neuverm = liste.filter(a => a.art === 'neuvermietung').map(a => a.d);
  const kandS = [tag(mietbeginn), ...neuverm].filter(Boolean);
  const S = kandS.length ? new Date(Math.max(...kandS)) : null;
  const imVertrag = liste.filter(a => !S || a.d >= S);
  const vertrag = [...imVertrag].reverse().find(a => a.art === 'staffel' || a.art === 'index');
  const aktuell = liste.length ? liste[liste.length - 1].neu : zahl(kaltmiete);
  const basisInfo = { aktuell, prozent, mietbeginn: S, eingaben: { kaltmiete, mietAnpassungen, mietbeginn: S, prozent } };
  if (vertrag) return { ...basisInfo, status: 'vertrag', vertragsart: vertrag.art };

  const aenderungen = imVertrag.filter(a => a.art === 'erhoehung' || a.art === 'senkung');
  const lf = tag(letzteErhoehung);
  const kandL = [...aenderungen.map(a => a.d), ...(lf && (!S || lf >= S) ? [lf] : [])];
  const letzte = kandL.length ? new Date(Math.max(...kandL)) : null;
  const bezug = letzte || S;
  if (!bezug) return { ...basisInfo, status: 'datum_fehlt' };

  const fruehWirksam = new Date(h.getFullYear(), h.getMonth() + 3, 1, 12); // Zugang diesen Monat
  const frist15 = plusMonate(bezug, 15);
  const start = ersterNaechster(new Date(Math.max(frist15, fruehWirksam)));
  const versandFrueh = letzte ? plusMonate(letzte, 12) : null;
  const versandFuer = (D) => { const v = new Date(D.getFullYear(), D.getMonth() - 3, 1, 12); const ab = new Date(Math.max(v, h, versandFrueh || h)); return ab; };

  // Nachgetragenes Datum ohne Betrag: Kappungsgrenze lässt sich nicht prüfen
  const nahe = (a, b) => Math.abs(a - b) <= 45 * 86400000;
  const betragFehlt = lf && (!S || lf - S > 45 * 86400000) && !liste.some(a => a.art !== 'neuvermietung' && nahe(a.d, lf));
  if (betragFehlt) return { ...basisInfo, status: 'betrag_fehlt', letzte: lf, abDatum: start, versandAb: versandFuer(start) };

  const maxAm = (D) => kappungsMaxZum({ kaltmiete, mietAnpassungen, mietbeginn: S, prozent }, D);

  for (let i = 0; i <= 48; i++) {
    const D = plusMonate(start, i);
    const { basis, max } = maxAm(D);
    const spielraum = max - aktuell;
    if (spielraum >= 1) {
      const status = i === 0 ? (D <= fruehWirksam ? 'moeglich' : 'warten') : 'ausgeschoepft';
      return { ...basisInfo, status, letzte: bezug, abDatum: D, abISO: isoTag(D), versandAb: versandFuer(D), frist15, basis, maxMiete: max, spielraum, gesperrtBis: i > 0 ? D : null };
    }
  }
  return { ...basisInfo, status: 'ausgeschoepft', letzte: bezug, abDatum: null, frist15, gesperrtBis: null, spielraum: 0 };
}

// Prüfung eines konkreten Vorhabens (Schreiben / Regler): neue Miete ab Datum
export function pruefeVorhaben(pruefung, { datum, neueMiete }) {
  const hinweise = [];
  if (!pruefung) return hinweise;
  const D = tag(datum);
  if (pruefung.status === 'vertrag') hinweise.push({ ton: 'rot', text: `${pruefung.vertragsart === 'staffel' ? 'Staffelmiete' : 'Indexmiete'} vereinbart — eine Erhöhung auf die Vergleichsmiete (§ 558 BGB) ist dann ausgeschlossen.` });
  if (pruefung.status === 'betrag_fehlt') hinweise.push({ ton: 'gelb', text: 'Um wie viel zuletzt erhöht wurde, ist nicht hinterlegt — die Kappungsgrenze kann renditly so nicht prüfen. Bitte bei der letzten Erhöhung die Miete davor eintragen.' });
  if (pruefung.status === 'datum_fehlt') hinweise.push({ ton: 'gelb', text: 'Weder Mietbeginn noch letzte Erhöhung sind hinterlegt — Sperrfrist und Kappungsgrenze lassen sich nicht prüfen.' });
  if (D && pruefung.frist15 && D < tag(pruefung.frist15)) hinweise.push({ ton: 'rot', text: `Zu früh: Die Miete muss 15 Monate unverändert sein — wirksam frühestens ab ${tag(pruefung.frist15).toLocaleDateString('de-DE')}.` });
  if (pruefung.status === 'ausgeschoepft' && D && pruefung.gesperrtBis && D < pruefung.gesperrtBis) hinweise.push({ ton: 'rot', text: `Kappungsgrenze (${pruefung.prozent} % in drei Jahren) ausgeschöpft — die nächste Erhöhung ist frühestens ab ${monatJahr(pruefung.gesperrtBis)} möglich.` });
  const gesperrt = pruefung.status === 'ausgeschoepft' && D && pruefung.gesperrtBis && D < pruefung.gesperrtBis;
  if (!gesperrt && neueMiete > 0 && D && pruefung.eingaben && ['moeglich', 'warten', 'ausgeschoepft'].includes(pruefung.status)) {
    const { basis, max } = kappungsMaxZum(pruefung.eingaben, D);
    if (neueMiete > max) hinweise.push({ ton: 'rot', text: `Über der Kappungsgrenze: zum ${D.toLocaleDateString('de-DE')} höchstens ${max.toLocaleString('de-DE')} € (${pruefung.prozent} % auf ${Math.round(basis).toLocaleString('de-DE')} € drei Jahre vorher).` });
  }
  return hinweise;
}

// Kurztext für Karten und Listen
export function erhoehungKurz(p) {
  if (!p) return null;
  switch (p.status) {
    case 'moeglich': return { ton: 'gruen', text: `Erhöhung möglich · bis +${Math.round(p.spielraum).toLocaleString('de-DE')} €` };
    case 'warten': return { ton: 'grau', text: `nächste Erhöhung ab ${monatJahr(p.abDatum)}` };
    case 'ausgeschoepft': return { ton: 'grau', text: p.gesperrtBis ? `Kappungsgrenze voll bis ${monatJahr(p.gesperrtBis)}` : 'Kappungsgrenze ausgeschöpft' };
    case 'betrag_fehlt': return { ton: 'gelb', text: 'Betrag der letzten Erhöhung fehlt' };
    case 'datum_fehlt': return { ton: 'gelb', text: 'letzte Erhöhung fehlt' };
    case 'vertrag': return { ton: 'grau', text: p.vertragsart === 'staffel' ? 'Staffelmiete' : 'Indexmiete' };
    default: return null;
  }
}

// Erfassung „letzte Erhöhung“: aus zwei von drei Angaben (vorher, nachher, Prozent) die dritte
export function erhoehungAusAngaben({ vorher, nachher, prozent }) {
  const v = zahl(vorher, null), n = zahl(nachher, null), p = zahl(prozent, null);
  if (v > 0 && n > 0) return { vorher: v, nachher: n, prozent: Math.round((n / v - 1) * 1000) / 10 };
  if (n > 0 && p != null && p > -100) return { vorher: Math.round(n / (1 + p / 100) * 100) / 100, nachher: n, prozent: p };
  if (v > 0 && p != null) return { vorher: v, nachher: Math.round(v * (1 + p / 100) * 100) / 100, prozent: p };
  return null;
}

// ── Eingaben je Objektart zusammenstellen ─────────────────────────────────────
const spaeter = (...xs) => xs.map(tag).filter(Boolean).reduce((a, b) => (!a || b > a ? b : a), null);
const isoOderNull = (d) => (d ? isoTag(d) : null);

// Eigentumswohnung: Miete und Anpassungen am Objekt, Datum/Mietbeginn am (aktiven) Mieter
export function erhoehungETW(immo, mieterListe = [], heute = new Date()) {
  const aktive = (mieterListe || []).filter(m => m.immobilie_id === immo?.id && m.aktiv !== false);
  const grenze = kappungsgrenze(immo, heute);
  const letzteFeld = spaeter(...aktive.map(m => m.letzte_mieterhoehung || m.letzteMieterhoehung));
  const mietbeginn = spaeter(...aktive.map(m => m.mietbeginn));
  const p = naechsteErhoehung({ kaltmiete: immo?.kaltmiete, mietAnpassungen: immo?.mietAnpassungen, letzteErhoehung: isoOderNull(letzteFeld), mietbeginn: isoOderNull(mietbeginn), prozent: grenze.prozent, heute });
  return mitDatumspruefung({ ...p, grenze, letzteBekannt: !!letzteFeld || anpassungsListe(immo?.mietAnpassungen).some(a => a.art === 'erhoehung' && (!p.mietbeginn || a.d >= p.mietbeginn)), hatMieter: aktive.length > 0 });
}

// Wohnung im Mehrfamilienhaus: alles an der Wohnung, ergänzt um den Mieterdatensatz
export function erhoehungWE(immo, w, mieter = null, heute = new Date()) {
  const grenze = kappungsgrenze(immo, heute);
  const letzteFeld = spaeter(w?.letzteMieterhoehung, mieter?.letzte_mieterhoehung || mieter?.letzteMieterhoehung);
  const mietbeginn = tag(w?.mietbeginn || mieter?.mietbeginn);
  const p = naechsteErhoehung({ kaltmiete: w?.kaltmiete, mietAnpassungen: w?.mietAnpassungen, letzteErhoehung: isoOderNull(letzteFeld), mietbeginn: isoOderNull(mietbeginn), prozent: grenze.prozent, heute });
  return mitDatumspruefung({ ...p, grenze, letzteBekannt: !!letzteFeld || anpassungsListe(w?.mietAnpassungen).some(a => a.art === 'erhoehung' && (!p.mietbeginn || a.d >= p.mietbeginn)) });
}

// Ohne Angabe zur letzten Erhöhung (weder Datum noch „seit Einzug nicht erhöht“) rechnet renditly
// nicht still ab Mietbeginn — sonst erschiene ein Spielraum, den es vielleicht nicht gibt.
function mitDatumspruefung(p) {
  if (!p.letzteBekannt && ['moeglich', 'warten', 'ausgeschoepft'].includes(p.status)) return { ...p, status: 'datum_fehlt', ohneDatumStatus: p.status };
  return p;
}
