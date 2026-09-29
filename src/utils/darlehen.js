// Monatsgenauer Darlehensverlauf über alle Finanzierungsphasen (UX-Paket Teil 3, Abschnitt 5–7).
//
// - Phasen laufen nacheinander; Beginn/Ende kommen aus phasenZeitraeume (echte Daten,
//   "Zinsbindung bis" statt Jahreszahl).
// - Die letzte Phase läuft nach dem Zinsbindungsende mit unveränderter Rate weiter
//   ("danach unbekannter Zins") — daraus entsteht "schuldenfrei ca.".
// - Erfasste Sondertilgungen (phase.sondertilgungen = [{ id, datum, betrag }]) und ein
//   "Darlehen abbezahlt" (phase.abbezahltAm) wirken ab ihrem Monat auf alle Folgewerte.
import { phasenZeitraeume } from './finanzierung.js';

const MAX_MONATE = 60 * 12;
const monatsIndex = (d) => d.getFullYear() * 12 + d.getMonth();
const ausIndex = (i) => new Date(Math.floor(i / 12), i % 12, 1);

export const anfangsFremdkapital = (immo) => {
  if (immo.geschenkt || immo.vollEigenfinanziert) return 0;
  if (immo.finanzierungsbetrag !== null && immo.finanzierungsbetrag !== undefined) return Number(immo.finanzierungsbetrag) || 0;
  const kNK = (immo.kaufpreis || 0) * ((immo.kaufnebenkosten ?? 10) / 100);
  const ek = (immo.ekFuerNebenkosten !== undefined && immo.ekFuerKaufpreis !== undefined)
    ? (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0)
    : (immo.eigenkapital || 0);
  return Math.max(0, (immo.kaufpreis || 0) + kNK - ek);
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
export function darlehensVerlauf(immo, heute = new Date()) {
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
  const monatHeute = monate.find(e => e.idx === heuteIdx);
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
