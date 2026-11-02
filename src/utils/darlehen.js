// Monatsgenauer Darlehensverlauf über alle Finanzierungsphasen (UX-Paket Teil 3, Abschnitt 5–7).
//
// - Phasen laufen nacheinander; Beginn/Ende kommen aus phasenZeitraeume (echte Daten,
//   "Zinsbindung bis" statt Jahreszahl).
// - Die letzte Phase läuft nach dem Zinsbindungsende mit unveränderter Rate weiter
//   ("danach unbekannter Zins") — daraus entsteht "schuldenfrei ca.".
// - Erfasste Sondertilgungen (phase.sondertilgungen = [{ id, datum, betrag }]) und ein
//   "Darlehen abbezahlt" (phase.abbezahltAm) wirken ab ihrem Monat auf alle Folgewerte.
import { phasenZeitraeume } from './finanzierung.js';
import { normalisiereImmobilie } from './zahlen.js';

const MAX_MONATE = 60 * 12;
const monatsIndex = (d) => d.getFullYear() * 12 + d.getMonth();
const ausIndex = (i) => new Date(Math.floor(i / 12), i % 12, 1);

// Anfangs-Fremdkapital — EINE Regel für Karte, Cockpit, Zahlen-Reiter, Steuer und Dashboard.
// UX-Gesamtpaket B12: Die Erwerbsart entscheidet nie darüber, ob ein Darlehen zählt —
// allein das Vorhandensein eines Darlehens. Ein geschenktes oder geerbtes Objekt mit
// Darlehen (Betrag oder Finanzierungsphase) hat also Kreditrate und Restschuld.
// Eigenkapital-Vorgaben wie in der Detailansicht: fehlt "EK für Nebenkosten", gelten
// die Nebenkosten als selbst bezahlt; fehlt "EK für Kaufpreis", der Rest des Gesamt-EK.
export const anfangsFremdkapital = (immo) => {
  immo = normalisiereImmobilie(immo); // Text/leer → Zahl/null (utils/zahlen.js)
  if (!immo || immo.vollEigenfinanziert) return 0;
  const fb = immo.finanzierungsbetrag;
  const explizit = fb !== null && fb !== undefined && fb !== '' ? (Number(fb) || 0) : null;
  const hatPhasen = (immo.finanzierungsphasen || []).length > 0;
  if (immo.geschenkt) {
    if (explizit !== null) return explizit;
    if (!hatPhasen) return 0; // geschenkt ohne Darlehen: kein Kredit konstruieren
  }
  if (explizit !== null) return explizit;
  const kp = Number(immo.kaufpreis) || 0;
  const kNK = kp * ((immo.kaufnebenkosten ?? 10) / 100);
  const ekNK = immo.ekFuerNebenkosten ?? kNK;
  const ekKP = immo.ekFuerKaufpreis ?? (immo.eigenkapital ? Math.max(0, Number(immo.eigenkapital) - kNK) : 0);
  return Math.max(0, kp + kNK - (Number(ekNK) || 0) - (Number(ekKP) || 0));
};

export const phasenZins = (phase, immo) => Number(phase.sollzinssatz ?? phase.zinssatz ?? immo?.zinssatz ?? 4) || 0;

// Rate einer Phase aus Startbetrag. Tilgungsdarlehen: feste Tilgung (Rate sinkt), hier Tilgungsanteil.
export const phasenRate = (phase, startbetrag, immo) => {
  const mz = phasenZins(phase, immo) / 100 / 12;
  if (phase.darlehensTyp === 'endfaellig') return startbetrag * mz;
  if (phase.monatlicherBetrag > 0) return Number(phase.monatlicherBetrag);
  const at = phase.anfangstilgung ?? 2;
  return startbetrag * (mz + (Number(at) || 0) / 100 / 12);
};

/**
 * @returns {null | { monate, phasen, restschuldAm(date), restschuldHeute, rateHeute, abbezahltHeute, schuldenfrei }}
 */
function darlehensVerlaufEinzeln(immo, heute = new Date()) {
  immo = normalisiereImmobilie(immo); // Text/leer → Zahl/null (utils/zahlen.js)
  const phasen = immo?.finanzierungsphasen || [];
  const fk = anfangsFremdkapital(immo || {});
  if (!phasen.length || fk <= 0) return null;
  const zr = phasenZeitraeume(immo);
  if (!zr[0]?.start) return null;

  const monate = [];
  const info = [];
  let rs = fk;
  let idx = monatsIndex(zr[0].start);

  for (let i = 0; i < phasen.length; i++) {
    const ph = phasen[i];
    const z = zr[i];
    const istLetzte = i === phasen.length - 1;
    const naechsteStart = !istLetzte && zr[i + 1]?.start ? monatsIndex(zr[i + 1].start) : null;
    const startIdx = z.start ? Math.max(idx, monatsIndex(z.start)) : idx;
    // Lücke: Restschuld bleibt stehen, keine Rate
    idx = startIdx;
    if (i > 0 && ph.restschuldOverride != null && ph.restschuldOverride !== '') rs = Number(ph.restschuldOverride) || 0;
    const startbetrag = rs;
    const mz = phasenZins(ph, immo) / 100 / 12;
    const typ = ['kfw', 'bauspardarlehen'].includes(ph.darlehensTyp) ? 'annuitaet' : (ph.darlehensTyp || 'annuitaet');
    const rate = phasenRate(ph, startbetrag, immo);
    const festeTilgung = typ === 'tilgung'
      ? (ph.monatlicheTilgung > 0 ? Number(ph.monatlicheTilgung) : startbetrag * (Number(ph.tilgungssatz ?? ph.anfangstilgung ?? 2) || 0) / 100 / 12)
      : 0;
    // "Zinsbindung bis 31.07." schließt den Juli ein; ein Monatsanfang (01.08.) nicht
    const endeZbIdx = z.ende ? monatsIndex(z.ende) + (z.ende.getDate() >= 28 ? 1 : 0) : null;
    const endIdx = naechsteStart ?? (istLetzte ? monatsIndex(zr[0].start) + MAX_MONATE : (endeZbIdx ?? idx + 120));
    const abbezahltIdx = ph.abbezahltAm ? monatsIndex(new Date(ph.abbezahltAm)) : null;
    const sonder = {};
    (ph.sondertilgungen || []).forEach(s => {
      if (!s?.datum || !(Number(s.betrag) > 0)) return;
      const k = monatsIndex(new Date(s.datum));
      sonder[k] = (sonder[k] || 0) + Number(s.betrag);
    });

    let zinsenSumme = 0, tilgungSumme = 0, zinsenBisZb = 0, tilgungBisZb = 0, restschuldBeiZb = null;
    let schuldenfreiIdx = null;
    let m = idx;
    for (; m < endIdx && rs > 0.5; m++) {
      if (abbezahltIdx != null && m >= abbezahltIdx) {
        monate.push({ i, idx: m, rsVor: rs, zins: 0, tilgung: rs, sonder: 0, rsNach: 0, abloesung: true });
        tilgungSumme += rs; rs = 0; schuldenfreiIdx = m; m++; break;
      }
      const zins = rs * mz;
      let tilgung = typ === 'endfaellig' ? 0 : typ === 'tilgung' ? festeTilgung : Math.max(0, rate - zins);
      tilgung = Math.min(tilgung, rs);
      let s = Math.min(sonder[m] || 0, rs - tilgung);
      const rsVor = rs;
      rs = Math.max(0, rs - tilgung - s);
      monate.push({ i, idx: m, rsVor, zins, tilgung, sonder: s, rsNach: rs });
      zinsenSumme += zins; tilgungSumme += tilgung + s;
      if (endeZbIdx == null || m < endeZbIdx) { zinsenBisZb += zins; tilgungBisZb += tilgung + s; }
      if (endeZbIdx != null && m === endeZbIdx - 1) restschuldBeiZb = rs;
      if (rs <= 0.5) { rs = 0; schuldenfreiIdx = m + 1; }
    }
    if (restschuldBeiZb == null && endeZbIdx != null) restschuldBeiZb = endeZbIdx <= idx ? startbetrag : rs;

    info.push({
      idx: i, phase: ph, typ,
      start: ausIndex(startIdx), ende: z.ende, endeGeschaetzt: z.endeGeschaetzt,
      startbetrag, rate: typ === 'tilgung' ? festeTilgung + startbetrag * mz : rate,
      sollzins: phasenZins(ph, immo),
      anfangstilgung: startbetrag > 0 && typ !== 'endfaellig'
        ? ((typ === 'tilgung' ? festeTilgung : Math.max(0, rate - startbetrag * mz)) * 12 / startbetrag) * 100 : 0,
      zinsenGesamt: zinsenSumme, tilgungGesamt: tilgungSumme,
      zinsenBisZinsbindung: zinsenBisZb, tilgungBisZinsbindung: tilgungBisZb,
      restschuldBeiZinsbindung: restschuldBeiZb ?? rs,
      restschuldAmEnde: rs,
      schuldenfrei: schuldenfreiIdx != null ? ausIndex(schuldenfreiIdx) : null,
      abbezahlt: ph.abbezahltAm ? new Date(ph.abbezahltAm) : null,
      endIdx: m,
    });
    idx = m;
    if (rs <= 0 && !istLetzte) {
      // Weitere Phasen starten mit 0 — nur, wenn sie keinen eigenen Startbetrag haben
      rs = 0;
    }
  }

  const heuteIdx = monatsIndex(heute);
  const restschuldAm = (d) => {
    const k = monatsIndex(d);
    if (k < monatsIndex(zr[0].start)) return fk;
    let wert = null;
    for (const e of monate) { if (e.idx < k || (e.abloesung && e.idx <= k)) wert = e.rsNach; else break; }
    return wert ?? fk;
  };
  // Aktive Phase: die, in deren Zeitraum heute liegt (sonst die letzte begonnene)
  let aktivIdx = 0;
  info.forEach(p => { if (monatsIndex(p.start) <= heuteIdx) aktivIdx = p.idx; });
  const restschuldHeute = restschuldAm(heute);
  // Monat null: Ein Kredit, der erst in einem späteren Monat startet, zeigt bereits die
  // Aufteilung seiner ersten Rate (Zins + Tilgung) — nie "0 € Zins · 0 € Tilgung".
  const monatHeute = monate.find(e => e.idx === heuteIdx) || (monate[0] && monate[0].idx > heuteIdx ? monate[0] : undefined);
  const letzte = info[info.length - 1];
  return {
    monate, phasen: info, fk,
    aktivIdx,
    restschuldAm,
    restschuldHeute,
    rateHeute: restschuldHeute > 0 ? (monatHeute ? monatHeute.zins + monatHeute.tilgung : info[aktivIdx]?.rate || 0) : 0,
    zinsHeute: monatHeute?.zins || 0,
    tilgungHeute: monatHeute?.tilgung || 0,
    abbezahltHeute: restschuldHeute <= 0.5,
    schuldenfrei: letzte?.schuldenfrei || null,
    tilgungImJahr: (jahr) => monate.filter(e => Math.floor(e.idx / 12) === jahr).reduce((s, e) => s + e.tilgung + e.sonder, 0),
    zinsenImJahr: (jahr) => monate.filter(e => Math.floor(e.idx / 12) === jahr).reduce((s, e) => s + e.zins, 0),
  };
}

// Restschuld zum Stichtag, wenn man heute einmalig `betrag` sondertilgt (für den Rechner)
export function mitSondertilgung(immo, phaseIdx, betrag, datum = new Date()) {
  if (!(betrag > 0)) return darlehensVerlauf(immo);
  const phasen = (immo.finanzierungsphasen || []).map((p, i) => i === phaseIdx
    ? { ...p, sondertilgungen: [...(p.sondertilgungen || []), { id: 'sim', datum: datum.toISOString().slice(0, 10), betrag }] }
    : p);
  return darlehensVerlauf({ ...immo, finanzierungsphasen: phasen });
}

// Neue Monatsrate bei Anschlusszins: Restschuld × (Zins + Tilgung) / 12
export const anschlussRate = (restschuld, zinsProzent, tilgungProzent) =>
  restschuld * ((zinsProzent + tilgungProzent) / 100) / 12;

// ── Mehrere parallele Darlehen ─────────────────────────────────────────────────────
// immo.finanzierungsphasen = Darlehen 1 (mit seinen Anschlussfinanzierungen).
// immo.weitereDarlehen = [{ id, name, zweck: 'kauf'|'modernisierung'|'sonstiges', betrag,
//                           phasen: [...] }] — jedes mit eigenen Phasen/Anschlüssen.
// Anschlussfinanzierungen hängen immer am eigenen Darlehen; abgelöste Phasen laufen
// in der Kette weiter und werden nie doppelt gerechnet.

// Ein weiteres Darlehen als eigenständiges „Objekt“ für die Einzelrechnung
export const darlehenAlsObjekt = (immo, d) => ({
  ...immo,
  finanzierungsphasen: d?.phasen || [],
  finanzierungsbetrag: d?.betrag ?? 0,
  geschenkt: false, vollEigenfinanziert: false, kreditLaeuftBereits: false,
  ekFuerNebenkosten: undefined, ekFuerKaufpreis: undefined,
  weitereDarlehen: [], bausparvertraege: [],
});

export const weitereDarlehen = (immo) => (immo?.weitereDarlehen || []).filter(d => d && (d.phasen || []).length);

// Verlauf je Darlehen: [{ idx, name, zweck, darlehen, verlauf }] — Darlehen 1 zuerst
export function darlehensListe(immo, heute = new Date()) {
  const liste = [];
  const haupt = darlehensVerlaufEinzeln(immo, heute);
  if (haupt) liste.push({ idx: 0, name: (immo?.finanzierungsphasen || [])[0]?.kreditinstitut || 'Darlehen 1', zweck: 'kauf', darlehen: null, verlauf: haupt });
  weitereDarlehen(immo).forEach((d, i) => {
    const v = darlehensVerlaufEinzeln(darlehenAlsObjekt(immo, d), heute);
    if (v) liste.push({ idx: i + 1, name: d.name || `Darlehen ${i + 2}`, zweck: d.zweck, darlehen: d, verlauf: v });
  });
  return liste;
}

// Gesamtverlauf: Raten, Zinsen, Tilgung und Restschuld aller Darlehen zusammengeführt.
// Gleiche Felder wie der Einzelverlauf, damit Cashflow, Steuer, Cockpit und Karte
// unverändert damit rechnen. `phasen`/`aktivIdx` beziehen sich auf Darlehen 1.
export function darlehensVerlauf(immo, heute = new Date()) {
  immo = normalisiereImmobilie(immo);
  const haupt = darlehensVerlaufEinzeln(immo, heute);
  if (!weitereDarlehen(immo).length) return haupt;
  const liste = darlehensListe(immo, heute);
  if (!liste.length) return null;
  if (liste.length === 1) return { ...liste[0].verlauf, darlehen: liste };
  const vs = liste.map(x => x.verlauf);
  const proIdx = new Map();
  vs.forEach(v => v.monate.forEach(e => {
    const a = proIdx.get(e.idx) || { idx: e.idx, zins: 0, tilgung: 0, sonder: 0, rsVor: 0, rsNach: 0 };
    a.zins += e.zins; a.tilgung += e.tilgung; a.sonder += e.sonder; a.rsVor += e.rsVor; a.rsNach += e.rsNach;
    proIdx.set(e.idx, a);
  }));
  const monate = [...proIdx.values()].sort((a, b) => a.idx - b.idx);
  const summe = (f) => vs.reduce((s, v) => s + (f(v) || 0), 0);
  const restschuldAm = (d) => vs.reduce((s, v) => s + v.restschuldAm(d), 0);
  const restschuldHeute = summe(v => v.restschuldHeute);
  const alleFrei = vs.every(v => v.schuldenfrei || v.abbezahltHeute);
  const basis = haupt || vs[0];
  return {
    ...basis,
    monate,
    fk: summe(v => v.fk),
    restschuldAm,
    restschuldHeute,
    rateHeute: summe(v => (v.abbezahltHeute ? 0 : v.rateHeute)),
    zinsHeute: summe(v => (v.abbezahltHeute ? 0 : v.zinsHeute)),
    tilgungHeute: summe(v => (v.abbezahltHeute ? 0 : v.tilgungHeute)),
    abbezahltHeute: restschuldHeute <= 0.5,
    schuldenfrei: alleFrei ? new Date(Math.max(...vs.map(v => (v.schuldenfrei || heute).getTime()))) : null,
    tilgungImJahr: (jahr) => summe(v => v.tilgungImJahr(jahr)),
    zinsenImJahr: (jahr) => summe(v => v.zinsenImJahr(jahr)),
    darlehen: liste,
  };
}

// Darlehenssumme gesamt (Anfangswerte) und der Teil, der den Kauf finanziert hat
export const fremdkapitalGesamt = (immo) => anfangsFremdkapital(immo || {}) + weitereDarlehen(immo).reduce((s, d) => s + (Number(d.betrag) || 0), 0);
export const fremdkapitalKauf = (immo) => anfangsFremdkapital(immo || {}) + weitereDarlehen(immo).filter(d => d.zweck === 'kauf').reduce((s, d) => s + (Number(d.betrag) || 0), 0);
export const hatDarlehen = (immo) => anfangsFremdkapital(immo || {}) > 0 || weitereDarlehen(immo).length > 0;
