// Nachforderung mit Ratenplan
// ─────────────────────────────────────────────────────────────────────────────
// Beispiel: 9.000 € Strom-Nachzahlung. Du zahlst sie in Raten an den Anbieter
// (geht von deinem Konto ab), 1.800 € trägst du selbst, den Rest zahlen drei
// Mieter mit je 200 € Zuschlag pro Monat zurück. Wer alles auf einmal zahlt,
// ist fertig — ab dann wird wieder nur die normale Miete erwartet.
//
// Datenmodell (immo.nachforderungen, JSONB "zusatzdaten"):
// {
//   id, titel, gesamt, eigenanteil, notiz,
//   anbieter: { betragMonat, ab: 'JJJJ-MM', monate },     // was von deinem Konto abgeht
//   mieter: [{ id, name, mieterId?, anteil, zuschlag, ab: 'JJJJ-MM',
//              zahlungen: [{ id, monat: 'JJJJ-MM', datum, betrag, art: 'rate'|'einmal'|'sonstig' }],
//              ausfall: { betrag, datum, monat: 'JJJJ-MM', notiz } }]   // Mieter zahlt den Rest nicht mehr
// }
// Bewusst getrennt von der Miete: keine Mieterhöhung, keine Rendite-Verfälschung,
// keine falschen Fristen für die nächste Mieterhöhung.

const n = (v) => Number(v) || 0;
const r2 = (v) => Math.round(v * 100) / 100;

export const monatKey = (jahr, monat) => `${jahr}-${String(monat).padStart(2, '0')}`;
export const heuteKey = (d = new Date()) => monatKey(d.getFullYear(), d.getMonth() + 1);
const plusMonate = (key, k) => {
  const [j, m] = key.split('-').map(Number);
  const d = new Date(j, m - 1 + k, 1);
  return monatKey(d.getFullYear(), d.getMonth() + 1);
};
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const monatName = (key) => { const [j, m] = key.split('-').map(Number); return `${MONATE[m - 1]} ${j}`; };

// ── Anbieter-Seite ─────────────────────────────────────────────────────────
export function anbieterImMonat(nf, key) {
  const a = nf?.anbieter;
  if (!a?.ab || !(n(a.betragMonat) > 0)) return 0;
  const monate = Math.max(1, Math.round(n(a.monate) || 1));
  if (key < a.ab || key > plusMonate(a.ab, monate - 1)) return 0;
  return n(a.betragMonat);
}
export const anbieterSumme = (nf) => n(nf?.anbieter?.betragMonat) * Math.max(1, Math.round(n(nf?.anbieter?.monate) || 1));
export const anbieterEnde = (nf) => nf?.anbieter?.ab ? plusMonate(nf.anbieter.ab, Math.max(1, Math.round(n(nf.anbieter.monate) || 1)) - 1) : null;

// ── Mieter-Seite ───────────────────────────────────────────────────────────
export const gezahltBis = (m, key = '9999-12') => r2((m.zahlungen || []).filter(z => z.monat <= key).reduce((s, z) => s + n(z.betrag), 0));
export const gezahlt = (m) => gezahltBis(m);
// Forderungsausfall: der Teil, den der Mieter nicht mehr zahlt — bleibt bei dir
export const ausfallBetrag = (m) => r2(n(m?.ausfall?.betrag));
export const restbetrag = (m) => Math.max(0, r2(n(m.anteil) - gezahlt(m) - ausfallBetrag(m)));
export const istImMonat = (m, key) => r2((m.zahlungen || []).filter(z => z.monat === key).reduce((s, z) => s + n(z.betrag), 0));

// Was in diesem Monat fällig ist: Zuschlag, solange nach den Zahlungen der
// Vormonate noch etwas offen ist — höchstens der Rest.
export function sollImMonat(m, key) {
  if (!m.ab || key < m.ab || !(n(m.zuschlag) > 0)) return 0;
  if (m.ausfall?.monat && key >= m.ausfall.monat) return 0; // ab dem Ausfall wird nichts mehr erwartet
  const restVorher = n(m.anteil) - gezahltBis(m, plusMonate(key, -1));
  return restVorher > 0.004 ? r2(Math.min(n(m.zuschlag), restVorher)) : 0;
}

// Monatsverlauf eines Mieters: bis einschließlich heute die echten Zahlungen,
// danach der Plan (Zuschlag bis der Rest 0 ist). Ergebnis: { 'JJJJ-MM': betrag }
export function mieterVerlauf(m, heute = heuteKey()) {
  const out = {};
  (m.zahlungen || []).forEach(z => { if (z.monat <= heute) out[z.monat] = r2((out[z.monat] || 0) + n(z.betrag)); });
  let rest = n(m.anteil) - gezahltBis(m, heute) - ausfallBetrag(m);
  // Zahlungen, die schon für die Zukunft erfasst sind
  (m.zahlungen || []).filter(z => z.monat > heute).forEach(z => { out[z.monat] = r2((out[z.monat] || 0) + n(z.betrag)); rest -= n(z.betrag); });
  if (rest <= 0.004 || !(n(m.zuschlag) > 0) || !m.ab) return out;
  let key = plusMonate(heute, 1) > m.ab ? plusMonate(heute, 1) : m.ab;
  // Laufender Monat: wenn noch nichts gezahlt, steht der Zuschlag auch hier aus
  if (heute >= m.ab && istImMonat(m, heute) === 0) key = heute;
  for (let i = 0; i < 600 && rest > 0.004; i++, key = plusMonate(key, 1)) {
    const b = r2(Math.min(n(m.zuschlag), rest));
    out[key] = r2((out[key] || 0) + b);
    rest -= b;
  }
  return out;
}
export function voraussichtlichFertig(m, heute = heuteKey()) {
  if (m.ausfall) return null;
  if (restbetrag(m) <= 0.004) {
    const zs = [...(m.zahlungen || [])].sort((a, b) => a.monat.localeCompare(b.monat));
    let s = 0; for (const z of zs) { s += n(z.betrag); if (s >= n(m.anteil) - 0.004) return z.monat; }
    return null;
  }
  const keys = Object.keys(mieterVerlauf(m, heute)).sort();
  return keys.length ? keys[keys.length - 1] : null;
}

// ── Summen pro Objekt ──────────────────────────────────────────────────────
// Monat: Ausgabe (an Anbieter) und Einnahmen (Rückzahlungen, Ist bis heute, danach Plan)
export function nachforderungMonat(immo, key, heute = heuteKey()) {
  let ausgabe = 0, einnahmen = 0;
  (immo?.nachforderungen || []).forEach(nf => {
    ausgabe += anbieterImMonat(nf, key);
    (nf.mieter || []).forEach(m => { einnahmen += mieterVerlauf(m, heute)[key] || 0; });
  });
  return { ausgabe: r2(ausgabe), einnahmen: r2(einnahmen), netto: r2(einnahmen - ausgabe) };
}
export function nachforderungJahr(immo, jahr, heute = heuteKey()) {
  let ausgabe = 0, einnahmen = 0;
  for (let m = 1; m <= 12; m++) {
    const x = nachforderungMonat(immo, monatKey(jahr, m), heute);
    ausgabe += x.ausgabe; einnahmen += x.einnahmen;
  }
  return { ausgabe: r2(ausgabe), einnahmen: r2(einnahmen), netto: r2(einnahmen - ausgabe) };
}
// Steuer: nur tatsächlich geflossenes Geld (Ist). Anbieter-Raten gelten bis heute als gezahlt.
export function nachforderungSteuerJahr(immo, jahr, heute = heuteKey()) {
  let ausgabe = 0, einnahmen = 0;
  const ausfaelle = [];
  (immo?.nachforderungen || []).forEach(nf => {
    for (let m = 1; m <= 12; m++) { const k = monatKey(jahr, m); if (k <= heute) ausgabe += anbieterImMonat(nf, k); }
    (nf.mieter || []).forEach(mi => (mi.zahlungen || []).forEach(z => { if (z.monat.startsWith(`${jahr}-`)) einnahmen += n(z.betrag); }));
    (nf.mieter || []).forEach(mi => { if (mi.ausfall?.monat?.startsWith(`${jahr}-`)) ausfaelle.push({ titel: nf.titel, name: mi.name, betrag: ausfallBetrag(mi), datum: mi.ausfall.datum }); });
  });
  // Ausfälle sind nur ein Hinweis: bei Einkünften aus V+V zählt, was geflossen ist.
  // Die Raten an den Anbieter stecken schon voll in den Werbungskosten.
  return { ausgabe: r2(ausgabe), einnahmen: r2(einnahmen), ausfall: r2(ausfaelle.reduce((x, a) => x + a.betrag, 0)), ausfaelle };
}
export const hatNachforderungen = (immo) => (immo?.nachforderungen || []).length > 0;

// Übersicht einer Nachforderung
export function nachforderungStand(nf, heute = heuteKey()) {
  const mieter = nf.mieter || [];
  const anteile = mieter.reduce((s, m) => s + n(m.anteil), 0);
  const zurueck = mieter.reduce((s, m) => s + Math.min(n(m.anteil), gezahlt(m)), 0);
  const offen = mieter.reduce((s, m) => s + restbetrag(m), 0);
  const ausgefallen = mieter.reduce((s, m) => s + ausfallBetrag(m), 0);
  const anbieterBezahlt = (() => { let s = 0; const a = nf.anbieter; if (!a?.ab) return 0; for (let i = 0; i < Math.max(1, n(a.monate)); i++) { const k = plusMonate(a.ab, i); if (k <= heute) s += n(a.betragMonat); } return s; })();
  return {
    anteile: r2(anteile), zurueck: r2(zurueck), offen: r2(offen),
    eigenanteil: r2(n(nf.eigenanteil)),
    ausgefallen: r2(ausgefallen),
    verlust: r2(n(nf.eigenanteil) + ausgefallen), // was am Ende insgesamt bei dir bleibt
    luecke: r2(n(nf.gesamt) - n(nf.eigenanteil) - anteile), // ≠ 0 → Aufteilung passt nicht zum Gesamtbetrag
    anbieterSumme: r2(anbieterSumme(nf)), anbieterBezahlt: r2(anbieterBezahlt),
    anbieterOffen: r2(Math.max(0, anbieterSumme(nf) - anbieterBezahlt)),
    anbieterAbweichung: nf.anbieter?.ab ? r2(anbieterSumme(nf) - n(nf.gesamt)) : 0,
    fertig: offen <= 0.004,
  };
}

// Offene Rückzahlungen im laufenden Monat (für "Was steht an")
export function offeneRueckzahlungen(immo, heute = new Date()) {
  const key = heuteKey(heute);
  const tag = immo?.mieteFaelligkeitstag ?? 3;
  if (heute.getDate() < tag) return [];
  const res = [];
  (immo?.nachforderungen || []).forEach(nf => (nf.mieter || []).forEach(m => {
    const soll = sollImMonat(m, key);
    const ist = istImMonat(m, key);
    if (soll > 0 && ist + 0.004 < soll) res.push({ nf, mieter: m, betrag: r2(soll - ist), monat: key, tage: heute.getDate() - tag });
  }));
  return res;
}

// ── Änderungen (unveränderlich, geben die neue Liste zurück) ───────────────
const neueId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export function mitZahlung(liste, nfId, mieterId, zahlung) {
  return (liste || []).map(nf => nf.id !== nfId ? nf : {
    ...nf,
    mieter: nf.mieter.map(m => m.id !== mieterId ? m : {
      ...m, zahlungen: [...(m.zahlungen || []), { id: neueId(), art: 'rate', ...zahlung, betrag: r2(n(zahlung.betrag)) }],
    }),
  });
}
export function ohneZahlung(liste, nfId, mieterId, zahlungId) {
  return (liste || []).map(nf => nf.id !== nfId ? nf : {
    ...nf, mieter: nf.mieter.map(m => m.id !== mieterId ? m : { ...m, zahlungen: (m.zahlungen || []).filter(z => z.id !== zahlungId) }),
  });
}
// Aktuellen Monat als eingegangen buchen (Rate = fälliger Betrag)
export function rateEingegangen(liste, nfId, mieterId, heute = new Date()) {
  const nf = (liste || []).find(x => x.id === nfId);
  const m = nf?.mieter.find(x => x.id === mieterId);
  if (!m) return liste;
  const key = heuteKey(heute);
  const betrag = r2(Math.max(0, sollImMonat(m, key) - istImMonat(m, key))) || Math.min(n(m.zuschlag), restbetrag(m));
  if (!(betrag > 0)) return liste;
  return mitZahlung(liste, nfId, mieterId, { monat: key, datum: heute.toISOString().slice(0, 10), betrag, art: 'rate' });
}
// Rest auf einmal bezahlt
export function restKomplett(liste, nfId, mieterId, datum = new Date().toISOString().slice(0, 10)) {
  const m = (liste || []).find(x => x.id === nfId)?.mieter.find(x => x.id === mieterId);
  const rest = m ? restbetrag(m) : 0;
  if (!(rest > 0)) return liste;
  return mitZahlung(liste, nfId, mieterId, { monat: datum.slice(0, 7), datum, betrag: rest, art: 'einmal' });
}

// Mieter zahlt den Rest nicht mehr → als Forderungsausfall markieren
export function alsAusgefallen(liste, nfId, mieterId, { betrag, datum = new Date().toISOString().slice(0, 10), notiz = '' } = {}) {
  return (liste || []).map(nf => nf.id !== nfId ? nf : {
    ...nf,
    mieter: nf.mieter.map(m => {
      if (m.id !== mieterId) return m;
      const max = Math.max(0, r2(n(m.anteil) - gezahlt(m)));
      const b = betrag == null ? max : Math.min(max, r2(n(betrag)));
      return b > 0 ? { ...m, ausfall: { betrag: b, datum, monat: datum.slice(0, 7), notiz } } : m;
    }),
  });
}
export function ausfallAufheben(liste, nfId, mieterId) {
  return (liste || []).map(nf => nf.id !== nfId ? nf : {
    ...nf, mieter: nf.mieter.map(m => { if (m.id !== mieterId) return m; const { ausfall, ...rest } = m; return rest; }), // eslint-disable-line no-unused-vars
  });
}

// Neue Nachforderung aus dem Formular
export function baueNachforderung(f) {
  const namen = (f.mieter || []).filter(m => (m.name || '').trim());
  return {
    id: f.id || neueId(),
    titel: (f.titel || '').trim() || 'Nachforderung',
    gesamt: r2(n(f.gesamt)),
    eigenanteil: r2(n(f.eigenanteil)),
    notiz: f.notiz || '',
    anbieter: f.anbieterAktiv === false ? null : { betragMonat: r2(n(f.anbieterBetrag)), ab: f.anbieterAb, monate: Math.max(1, Math.round(n(f.anbieterMonate) || 1)) },
    mieter: namen.map(m => ({
      id: m.id || neueId(), name: m.name.trim(), mieterId: m.mieterId || null,
      anteil: r2(n(m.anteil)), zuschlag: r2(n(m.zuschlag)), ab: m.ab || f.mieterAb,
      zahlungen: m.zahlungen || [],
      ...(m.ausfall ? { ausfall: m.ausfall } : {}),
    })),
  };
}
// Gleichmäßige Aufteilung (Rundungsrest auf den ersten Mieter)
export function teileAuf(gesamt, eigenanteil, anzahl) {
  const rest = Math.max(0, n(gesamt) - n(eigenanteil));
  if (!(anzahl > 0)) return [];
  const je = Math.floor((rest / anzahl) * 100) / 100;
  const out = Array.from({ length: anzahl }, () => je);
  out[0] = r2(out[0] + (rest - je * anzahl));
  return out;
}
