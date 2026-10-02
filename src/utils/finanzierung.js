import { normalisiereImmobilie } from './zahlen.js';
// Zeitliche Einordnung der Finanzierungsphasen — EINE Logik für Cockpit,
// Finanzierungs-Reiter und Erinnerungen (UX-Paket Teil 3, Abschnitt 5.2 + 6).
//
// - "Zinsbindung bis" ist ein echtes Datum (phase.zinsbindungBis). Fehlt es,
//   wird es aus Start + Jahren geschätzt und gilt als "ungeprüft", bis der
//   Nutzer es einmal bestätigt (phase.zinsbindungBisBestaetigt).
// - Warnungen gelten nur für die AKTIVE Phase. Eine Phase mit Folgephase ist
//   Historie und löst nie mehr einen Alarm aus.

const MS_MONAT = 1000 * 60 * 60 * 24 * 30.44;

const addJahre = (datum, jahre) => {
  const d = new Date(datum);
  d.setFullYear(d.getFullYear() + jahre);
  return d;
};

export const monateBis = (datum, heute = new Date()) => (datum - heute) / MS_MONAT;

// Liefert je Phase: start, ende (Zinsbindungsende bzw. Laufzeitende bei endfällig),
// endeGeschaetzt (true = aus Jahren abgeleitet oder nicht bestätigt).
export function phasenZeitraeume(immo) {
  immo = normalisiereImmobilie(immo); // Text/leer → Zahl/null (utils/zahlen.js)
  const phasen = immo?.finanzierungsphasen || [];
  const res = [];
  let vorherEnde = null;
  phasen.forEach((phase, idx) => {
    const startRoh = phase.kreditStartDatum || (idx === 0 ? immo.kaufdatum : null);
    const start = startRoh ? new Date(startRoh) : vorherEnde ? new Date(vorherEnde) : null;
    const jahre = phase.darlehensTyp === 'endfaellig' ? (phase.laufzeit || 10) : (phase.zinsbindung || 10);
    let ende = null;
    let endeGeschaetzt = true;
    if (phase.zinsbindungBis) {
      ende = new Date(phase.zinsbindungBis);
      endeGeschaetzt = !phase.zinsbindungBisBestaetigt;
    } else if (start) {
      ende = addJahre(start, jahre);
    }
    res.push({ phase, idx, start, ende, endeGeschaetzt });
    vorherEnde = ende;
  });
  return res;
}

// Status der Finanzierung für Erinnerungen und Anzeigen.
// Rückgabe: { aktiv, stufe: 'neutral'|'grau'|'gelb'|'rot', monate, luecke }
//  - rot:  Zinsbindung der letzten Phase abgelaufen, keine Folgephase
//  - gelb: < 24 Monate bis Ende, oder Lücke zwischen zwei Phasen
//  - grau: < 60 Monate (Forward-Darlehen möglich)
export function finanzierungsStatus(immo, heute = new Date()) {
  const zr = phasenZeitraeume(immo);
  if (zr.length === 0) return null;
  // Aktive Phase: die letzte, deren Start nicht in der Zukunft liegt
  let aktiv = zr[0];
  zr.forEach(z => { if (!z.start || z.start <= heute) aktiv = z; });
  const letzte = zr[zr.length - 1];

  // Lücke: eine Folgephase beginnt mehr als einen Monat nach dem Ende der Vorphase
  let luecke = null;
  for (let i = 1; i < zr.length; i++) {
    const a = zr[i - 1].ende, b = zr[i].start;
    if (a && b && (b - a) / MS_MONAT > 1) { luecke = { von: a, bis: b }; break; }
  }

  // Als abbezahlt markiert → keine Zinsbindungs-Warnung mehr (Teil 3, "Darlehen abschließen")
  if (letzte.phase?.abbezahltAm) return { aktiv, letzte, stufe: 'neutral', monate: null, luecke, abbezahlt: true };
  // Warnungen nur für die letzte Phase (alle anderen haben eine Folgephase)
  if (!letzte.ende) return { aktiv, letzte, stufe: 'neutral', monate: null, luecke };
  const monate = monateBis(letzte.ende, heute);
  let stufe = 'neutral';
  if (monate < 0) stufe = 'rot';
  else if (monate < 24) stufe = 'gelb';
  else if (monate < 60) stufe = 'grau';
  return { aktiv, letzte, stufe, monate, luecke };
}

export const formatMonatJahr = (d) => d ? d.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }) : '—';
