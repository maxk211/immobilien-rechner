// Sonderumlagen der WEG + Erhaltungsrücklage über das Hausgeld — Cashflow und Steuer.
//
// Steuerliche Grundlage (BFH, Urteil vom 14.01.2025, IX R 19/24): Zahlungen in die
// Erhaltungsrücklage der WEG sind erst Werbungskosten, wenn und soweit die WEG das Geld
// für Erhaltungsmaßnahmen AUSGIBT — nicht schon bei Zahlung. Das gilt für die laufende
// Zuführung über das Hausgeld genauso wie für eine Sonderumlage, die in die Rücklage fließt.
//
// Datenmodell (immo.sonderumlagen[]):
//   { id, titel, zweck: 'erhaltung' | 'modernisierung' | 'ruecklage', betrag,
//     faelligAm: 'JJJJ-MM-TT' (erste Zahlung), raten: Anzahl Monatsraten (≥ 1),
//     verwendung: [{ jahr, betrag }]   // laut WEG-Jahresabrechnung (nur Erhaltung/Rücklage)
//     notiz }
// Erhaltungsrücklage über das Hausgeld:
//   immo.hausgeldRuecklage       — Zuführung €/Monat laut Wirtschaftsplan (leer = unbekannt)
//   immo.ruecklageVerwendung[]   — [{ jahr, betrag }] dein Anteil an Entnahmen für Erhaltung

import { zahl } from './zahlen.js';

export const SU_ZWECK = {
  erhaltung: { label: 'Erhaltung / Reparatur', kurz: 'Erhaltung', hint: 'z. B. Dach, Fassade, Heizung — absetzbar im Jahr, in dem die WEG das Geld ausgibt' },
  modernisierung: { label: 'Modernisierung / Neues', kurz: 'Modernisierung', hint: 'z. B. Aufzug, Balkone, Dämmung über Standard — über die AfA abgeschrieben' },
  ruecklage: { label: 'Aufstockung der Rücklage', kurz: 'Rücklage', hint: 'fließt in die Erhaltungsrücklage — absetzbar erst, wenn die WEG es ausgibt' },
};

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const r2 = (x) => Math.round(x * 100) / 100;

// Einzelne Zahlungen einer Sonderumlage (gleich hohe Monatsraten, letzte Rate gleicht Rundung aus)
export function zahlungenVon(su) {
  const betrag = zahl(su?.betrag);
  if (!(betrag > 0) || !su?.faelligAm) return [];
  const start = new Date(su.faelligAm);
  if (Number.isNaN(start.getTime())) return [];
  const n = Math.max(1, Math.round(zahl(su.raten, 1)));
  const rate = r2(betrag / n);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i, Math.min(start.getDate(), 28));
    return { datum: iso(d), jahr: d.getFullYear(), monat: d.getMonth(), betrag: i === n - 1 ? r2(betrag - rate * (n - 1)) : rate };
  });
}

const alle = (immo) => (immo?.sonderumlagen || []).filter(Boolean);

export const sonderumlageImMonat = (immo, datum = new Date()) =>
  alle(immo).flatMap(zahlungenVon)
    .filter(z => z.jahr === datum.getFullYear() && z.monat === datum.getMonth())
    .reduce((s, z) => s + z.betrag, 0);

export const sonderumlageImJahr = (immo, jahr) =>
  alle(immo).flatMap(zahlungenVon).filter(z => z.jahr === jahr).reduce((s, z) => s + z.betrag, 0);

export const verwendetSumme = (su) => (su?.verwendung || []).reduce((s, v) => s + zahl(v?.betrag), 0);
export const nochNichtVerwendet = (su) => Math.max(0, zahl(su?.betrag) - verwendetSumme(su));

// Für die Steuer: Sonderumlagen als Einträge in der Logik von „Reparaturen & Investitionen“.
// Erhaltung/Rücklage → Erhaltungsaufwand im Jahr der Verwendung, Modernisierung → AfA ab Zahlung.
export function sonderumlagenAlsInvestitionen(immo) {
  const out = [];
  alle(immo).forEach((su) => {
    const titel = su.titel || 'Sonderumlage';
    if (su.zweck === 'modernisierung') {
      zahlungenVon(su).forEach((z, i) => out.push({
        id: `su-${su.id}-${i}`, datum: z.datum, kategorie: 'modernisierung', betrag: z.betrag,
        beschreibung: `Sonderumlage: ${titel}`, quelle: 'sonderumlage',
      }));
    } else {
      (su.verwendung || []).forEach((v, i) => {
        const jahr = Math.round(zahl(v?.jahr));
        if (!(jahr > 1900) || !(zahl(v?.betrag) > 0)) return;
        out.push({
          id: `su-${su.id}-v${i}`, datum: `${jahr}-12-31`, kategorie: 'erhaltung', betrag: zahl(v.betrag),
          beschreibung: `Sonderumlage: ${titel} (von der WEG ${jahr} verwendet)`, quelle: 'sonderumlage',
        });
      });
    }
  });
  return out;
}

// Hausgeld steuerlich: Zuführung zur Erhaltungsrücklage heraus, deren Verwendung hinein
export function hausgeldSteuerJahr(immo, jahr, jahresHausgeld, faktor = 1) {
  const roh = immo?.hausgeldRuecklage;
  const bekannt = roh !== null && roh !== undefined && roh !== '' && Number.isFinite(Number(roh));
  const zufuehrung = bekannt ? Math.min(jahresHausgeld, Math.max(0, zahl(roh)) * 12 * faktor) : 0;
  const verwendung = (immo?.ruecklageVerwendung || [])
    .filter(v => Math.round(zahl(v?.jahr)) === jahr)
    .reduce((s, v) => s + zahl(v?.betrag), 0);
  return { bekannt, zufuehrung, verwendung, abziehbar: jahresHausgeld - zufuehrung + verwendung };
}

// 15-%-Grenze (§ 6 Abs. 1 Nr. 1a EStG): Instandsetzung/Modernisierung in den ersten drei Jahren
// nach dem Kauf über 15 % der Gebäude-Anschaffungskosten (netto) → anschaffungsnahe
// Herstellungskosten, nur über die AfA. Basis: Gebäudeanteil am Kaufpreis inkl. Nebenkosten.
export function regel15(immo, eintraege, heute = new Date()) {
  const kauf = immo?.kaufdatum ? new Date(immo.kaufdatum) : null;
  const kp = zahl(immo?.kaufpreis);
  if (!kauf || Number.isNaN(kauf.getTime()) || !(kp > 0)) return null;
  const knk = zahl(immo?.kaufnebenkosten, 10);
  const anteil = zahl(immo?.gebaeudeAnteilProzent, 80) / 100;
  const gebaeudewert = kp * (1 + knk / 100) * anteil;
  const fensterEnde = new Date(kauf); fensterEnde.setFullYear(fensterEnde.getFullYear() + 3);
  const imFenster = (e) => { const d = new Date(e.datum); return d >= kauf && d <= fensterEnde && ['erhaltung', 'modernisierung', 'herstellung'].includes(e.kategorie); };
  const relevant = (eintraege || []).filter(imFenster);
  const summe = relevant.reduce((s, e) => s + zahl(e.betrag), 0);
  const grenze = gebaeudewert * 0.15;
  return { kauf, fensterEnde, gebaeudewert, grenze, summe, ueberschritten: summe > grenze, imFenster, nochImFenster: heute <= fensterEnde };
}

// Hinweise für „Was steht an“
export function sonderumlageHinweise(immo, heute = new Date()) {
  const out = [];
  const in30 = new Date(heute); in30.setDate(in30.getDate() + 30);
  alle(immo).forEach((su) => {
    const naechste = zahlungenVon(su).find(z => new Date(z.datum) >= new Date(heute.getFullYear(), heute.getMonth(), heute.getDate()));
    if (naechste && new Date(naechste.datum) <= in30) out.push({ typ: 'faellig', su, zahlung: naechste });
    const letzteZahlungJahr = Math.max(0, ...zahlungenVon(su).map(z => z.jahr));
    if (su.zweck !== 'modernisierung' && letzteZahlungJahr && letzteZahlungJahr < heute.getFullYear() && nochNichtVerwendet(su) > 0.5) {
      out.push({ typ: 'verwendung', su, offen: nochNichtVerwendet(su) });
    }
  });
  return out;
}

// Alle steuerlich relevanten Einträge eines Objekts (eigene Investitionen + Sonderumlagen),
// mit 15-%-Regel angewandt. EINE Regel für Steuer-Reiter und Steuer-Export.
export function steuerEintraege(immo) {
  const roh = [...(immo?.investitionen || []), ...sonderumlagenAlsInvestitionen(immo)];
  const r15 = regel15(immo, roh);
  return roh.map(inv => r15?.ueberschritten && r15.imFenster(inv) && (inv.kategorie || 'erhaltung') === 'erhaltung'
    ? { ...inv, kategorie: 'herstellung', anschaffungsnah: true } : inv);
}

// Sofort absetzbarer Erhaltungsaufwand eines Jahres
export const erhaltungsaufwandJahr = (immo, jahr) => steuerEintraege(immo)
  .filter(inv => (inv.kategorie || 'erhaltung') === 'erhaltung' && new Date(inv.datum).getFullYear() === jahr)
  .reduce((s, inv) => s + zahl(inv.betrag), 0);
