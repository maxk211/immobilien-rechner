// Plausibilitätsprüfung (UX-Paket Teil 3, Abschnitt 8).
//
// Drei Stufen:
//   rot  = Widerspruch, zwei Angaben können nicht beide stimmen. Nicht wegbestätigbar.
//   gelb = ungewöhnlich. "Stimmt so" bestätigt dauerhaft — bis sich der Wert ändert.
//   grau = von renditly abgeleitet/geschätzt oder rein informativ. Blockiert nichts.
//
// Bestätigungen liegen in immo.plausiBestaetigt = { [regelId]: { wert, am } }.
// "wert" ist ein Fingerabdruck der geprüften Zahl(en); ändert sich die Zahl, fragt die Prüfung neu.
// Feldherkunft liegt in immo.feldHerkunft = { [feld]: 'manuell'|'dokument'|'berechnet'|'geschaetzt' }.
import { PLAUSI_SCHWELLEN as S } from '../config/plausibilitaet.js';
import { phasenZeitraeume } from './finanzierung.js';
import { darlehensVerlauf, phasenZins } from './darlehen.js';
import { getAktuelleMiete } from './miete.js';
import { grestSatz, grestFrei, GREST_HISTORIE } from '../config/grunderwerbsteuer.js';

const eur = (v) => `${Math.round(Number(v) || 0).toLocaleString('de-DE')} €`;
const eur2 = (v) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const pct = (v, n = 2) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n })} %`;
const dat = (d) => d ? new Date(d).toLocaleDateString('de-DE') : '—';
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addJahre = (d, j) => { const x = new Date(d); x.setFullYear(x.getFullYear() + j); x.setDate(x.getDate() - 1); return x; };

// Durchschnittliche Kaltmiete/m² der übrigen Kauf-Objekte (Vergleich mit dem eigenen Portfolio)
export function portfolioMieteProQm(portfolio = [], ausserId) {
  const werte = portfolio
    .filter(i => i.id !== ausserId && i.aktiv !== false && !['mietimmobilie', 'mehrfamilienhaus'].includes(i.immobilienTyp))
    .map(i => ({ m: getAktuelleMiete(i), f: Number(i.wohnflaeche) || 0 }))
    .filter(x => x.m > 0 && x.f > 0);
  if (werte.length === 0) return null;
  return { schnitt: werte.reduce((s, x) => s + x.m / x.f, 0) / werte.length, anzahl: werte.length };
}

/**
 * @returns Array<{ id, stufe, titel, text, feld?, feldLabel?, wert?, vorschlag?, vorschlagText?, fingerprint }>
 * Nur für Kaufimmobilien (Wohnung). MFH und Mietimmobilie haben eine andere Datenstruktur.
 */
export function pruefeImmobilie(immo, { portfolio = [], mieter = [], heute = new Date() } = {}) {
  if (!immo || ['mietimmobilie', 'mehrfamilienhaus'].includes(immo.immobilienTyp)) return [];
  const h = [];
  const add = (x) => h.push({ fingerprint: String(x.wert ?? ''), ...x });
  const kaufpreis = Number(immo.kaufpreis) || 0;
  const flaeche = Number(immo.wohnflaeche) || 0;
  const miete = getAktuelleMiete(immo) || Number(immo.kaltmiete) || 0;
  const hausgeld = Number(immo.hausgeld) || 0;
  const kaufdatum = immo.kaufdatum ? new Date(immo.kaufdatum) : null;
  const phasen = immo.finanzierungsphasen || [];
  const zr = phasen.length ? phasenZeitraeume(immo) : [];
  const verlauf = phasen.length ? darlehensVerlauf(immo, heute) : null;
  const kreditLaeuft = !!verlauf && verlauf.fk > 0;

  // ── Widersprüche (rot) ───────────────────────────────────────────────────
  zr.forEach((z, i) => {
    const p = phasen[i];
    if (z.start && p.zinsbindungBis && new Date(p.zinsbindungBis) <= z.start) {
      const jahre = p.darlehensTyp === 'endfaellig' ? (p.laufzeit || 10) : (p.zinsbindung || 10);
      const vorschlag = iso(addJahre(z.start, jahre));
      add({ id: `zb-vor-start-${i}`, stufe: 'rot', titel: 'Die Zinsbindung endet vor dem Kreditstart',
        text: `Kreditstart ${dat(z.start)}, Zinsbindung bis ${dat(p.zinsbindungBis)}. Das kann nicht beides stimmen. Solange das offen ist, ist die Restschuld zum Zinsbindungsende nicht verlässlich.`,
        feld: `phase:${i}:zinsbindungBis`, feldTyp: 'date', feldLabel: 'Zinsbindung bis', wert: p.zinsbindungBis,
        vorschlag, vorschlagText: `Vorschlag aus ${jahre} Jahren Laufzeit: ${dat(vorschlag)}` });
    }
    if (kaufdatum && z.ende && z.ende < kaufdatum && i === phasen.length - 1) {
      add({ id: `zb-vor-kauf-${i}`, stufe: 'rot', titel: 'Die Zinsbindung endet vor dem Kaufdatum',
        text: `Gekauft am ${dat(kaufdatum)}, Zinsbindung bis ${dat(z.ende)}. Bitte Datum aus dem Kreditvertrag prüfen.`,
        feld: `phase:${i}:zinsbindungBis`, feldTyp: 'date', feldLabel: 'Zinsbindung bis', wert: p.zinsbindungBis || iso(z.ende) });
    }
  });
  if (verlauf) {
    const maxRs = Math.max(...verlauf.monate.map(e => e.rsNach), 0);
    const hoechsterStart = Math.max(verlauf.fk, ...verlauf.phasen.map(p => p.startbetrag));
    if (maxRs > hoechsterStart * 1.001) {
      add({ id: 'restschuld-waechst', stufe: 'rot', titel: 'Die Restschuld wächst statt zu sinken',
        text: `Die Rate deckt nicht einmal die Zinsen — die Restschuld steigt auf ${eur(maxRs)}. Das geht nur mit negativer Tilgung. Rate oder Zins prüfen.`,
        wert: Math.round(maxRs) });
    }
  }
  const nu = immo.hausgeldNichtUmlagefaehig;
  if (nu !== null && nu !== undefined && nu !== '' && Number(nu) > hausgeld && hausgeld >= 0) {
    add({ id: 'nu-ueber-hausgeld', stufe: 'rot', titel: 'Nicht umlagefähiger Anteil ist größer als das Hausgeld',
      text: `Davon nicht umlagefähig ${eur(nu)}, Hausgeld gesamt ${eur(hausgeld)}. Ein Teilbetrag kann nicht größer sein als das Ganze.`,
      feld: 'hausgeldNichtUmlagefaehig', feldLabel: 'davon nicht umlagefähig', wert: nu });
  }
  phasen.forEach((p, i) => {
    const z = phasenZins(p, immo);
    if (kreditLaeuft && z === 0 && p.darlehensTyp !== 'kfw') {
      add({ id: `zins-null-${i}`, stufe: 'rot', titel: `Sollzins 0 % bei laufendem Darlehen${phasen.length > 1 ? ` (Phase ${i + 1})` : ''}`,
        text: 'Ein Darlehen ohne Zins gibt es praktisch nicht. Vermutlich fehlt die Eingabe.',
        feld: `phase:${i}:sollzinssatz`, feldLabel: 'Sollzins p. a.', wert: z });
    }
  });

  // ── Ungewöhnlich (gelb) ──────────────────────────────────────────────────
  if (miete > 0 && flaeche > 0) {
    const qm = miete / flaeche;
    if (qm < S.mieteProQm.min || qm > S.mieteProQm.max) {
      const pf = portfolioMieteProQm(portfolio, immo.id);
      add({ id: 'miete-qm', stufe: 'gelb', titel: `Die Miete liegt bei ${eur2(qm)} pro m²`,
        text: `${pf ? `In deinen anderen ${pf.anzahl} Objekten liegt der Schnitt bei ${eur2(pf.schnitt)}/m². ` : ''}Üblich sind ${S.mieteProQm.min} bis ${S.mieteProQm.max} €. ${qm > S.mieteProQm.max ? 'Hast du vielleicht die Jahresmiete statt der Monatsmiete eingetragen?' : 'Stimmt die Wohnfläche?'}`,
        feld: 'kaltmiete', feldLabel: 'Kaltmiete pro Monat', wert: Number(immo.kaltmiete) || miete });
    }
  }
  if (kaufpreis > 0 && miete > 0) {
    const f = kaufpreis / (miete * 12);
    if (f < S.kaufpreisfaktor.min || f > S.kaufpreisfaktor.max) {
      add({ id: 'kaufpreisfaktor', stufe: 'gelb', titel: `Kaufpreisfaktor ${Math.round(f)} — sehr ${f > S.kaufpreisfaktor.max ? 'hoch' : 'niedrig'}`,
        text: `Du zahlst das ${Math.round(f)}-fache der Jahreskaltmiete. Üblich sind ${S.kaufpreisfaktor.ueblichMin} bis ${S.kaufpreisfaktor.ueblichMax}. Entweder ist der Kaufpreis ${f > S.kaufpreisfaktor.max ? 'zu hoch' : 'zu niedrig'} eingetragen oder die Miete ${f > S.kaufpreisfaktor.max ? 'zu niedrig' : 'zu hoch'}.`,
        feld: 'kaufpreis', feldLabel: 'Kaufpreis', wert: kaufpreis, fingerprint: `${kaufpreis}|${miete}` });
    }
  }
  if (hausgeld > 0 && flaeche > 0) {
    const hq = hausgeld / flaeche;
    if (hq < S.hausgeldProQm.min || hq > S.hausgeldProQm.max) {
      add({ id: 'hausgeld-qm', stufe: 'gelb', titel: `Hausgeld ${eur2(hq)} pro m²`,
        text: `Üblich sind etwa ${S.hausgeldProQm.min} bis ${S.hausgeldProQm.max} € pro m² im Monat. ${hq > S.hausgeldProQm.max ? 'Jahresbetrag statt Monatsbetrag?' : 'Fehlt ein Teil des Hausgelds?'}`,
        feld: 'hausgeld', feldLabel: 'Hausgeld an die WEG', wert: hausgeld, fingerprint: `${hausgeld}|${flaeche}` });
    }
  }
  if (kreditLaeuft) {
    verlauf.phasen.forEach((vp, i) => {
      const p = phasen[i];
      const z = phasenZins(p, immo);
      if (z > 0 && (z < S.sollzins.min || z > S.sollzins.max)) {
        add({ id: `sollzins-${i}`, stufe: 'gelb', titel: `Sollzins ${pct(z)}${phasen.length > 1 ? ` (Phase ${i + 1})` : ''}`,
          text: `Üblich sind ${pct(S.sollzins.min, 1)} bis ${pct(S.sollzins.max, 0)}. Tippfehler beim Komma?`,
          feld: `phase:${i}:sollzinssatz`, feldLabel: 'Sollzins p. a.', wert: z });
      }
      const at = Number(p.anfangstilgung);
      if (!(p.monatlicherBetrag > 0) && p.darlehensTyp !== 'endfaellig' && at > 0 && (at < S.anfangstilgung.min || at > S.anfangstilgung.max)) {
        const bauspar = p.darlehensTyp === 'bauspardarlehen';
        add({ id: `tilgung-${i}`, stufe: bauspar && at > S.anfangstilgung.max ? 'grau' : 'gelb',
          titel: `Anfangstilgung ${pct(at)}${phasen.length > 1 ? ` (Phase ${i + 1})` : ''}`,
          text: at > S.anfangstilgung.max
            ? (bauspar ? 'Bei Bauspardarlehen üblich — nur zur Info.' : `Über ${S.anfangstilgung.max} % ist ungewöhnlich, meist handelt es sich um ein Bauspardarlehen. Darlehensart prüfen.`)
            : `Unter ${pct(S.anfangstilgung.min, 1)} dauert die Rückzahlung sehr lange. Stimmt der Wert?`,
          feld: `phase:${i}:anfangstilgung`, feldLabel: 'Anfangstilgung p. a.', wert: at });
      }
      if (p.monatlicherBetrag > 0 && p.darlehensTyp !== 'endfaellig' && vp.startbetrag > 0) {
        const erwartet = vp.startbetrag * (z + (Number(p.anfangstilgung) || 0)) / 100 / 12;
        if (p.anfangstilgung && erwartet > 0 && Math.abs(p.monatlicherBetrag - erwartet) / erwartet > S.rateAbweichung) {
          add({ id: `rate-${i}`, stufe: 'gelb', titel: 'Rate passt nicht zu Zins und Tilgung',
            text: `Eingetragen: ${eur(p.monatlicherBetrag)} im Monat. Aus ${eur(vp.startbetrag)} × (${pct(z)} + ${pct(p.anfangstilgung)}) ÷ 12 ergeben sich ${eur(erwartet)}. renditly rechnet mit der eingetragenen Rate.`,
            feld: `phase:${i}:monatlicherBetrag`, feldLabel: 'Monatsrate', wert: p.monatlicherBetrag, fingerprint: `${p.monatlicherBetrag}|${z}|${p.anfangstilgung}|${Math.round(vp.startbetrag)}` });
        }
      }
      if (p.schlusszahlung > 0 && p.abbezahltAm) {
        const rechen = verlauf.restschuldAm(new Date(new Date(p.abbezahltAm).getTime() - 86400000));
        if (rechen > 0 && Math.abs(p.schlusszahlung - rechen) / rechen > S.schlusszahlungAbweichung) {
          add({ id: `schluss-${i}`, stufe: 'gelb', titel: 'Schlusszahlung weicht vom Rechenwert ab',
            text: `Eingetragen ${eur(p.schlusszahlung)}, rechnerisch ${eur(rechen)}. Sondertilgungen oder Gebühren verschieben den Betrag — der Kontoauszug ist die Wahrheit.`,
            feld: `phase:${i}:schlusszahlung`, feldLabel: 'Tatsächliche Schlusszahlung', wert: p.schlusszahlung });
        }
      }
    });
  }
  const knk = Number(immo.kaufnebenkosten);
  if (kaufpreis > 0 && !immo.geschenkt && knk > 0 && (knk < S.kaufnebenkosten.min || knk > S.kaufnebenkosten.max)) {
    add({ id: 'kaufnebenkosten', stufe: 'gelb', titel: `Kaufnebenkosten ${pct(knk, 1)}`,
      text: `Üblich sind ${S.kaufnebenkosten.min} bis ${S.kaufnebenkosten.max} % (Grunderwerbsteuer je Bundesland plus Notar, Grundbuch, ggf. Makler).`,
      feld: 'kaufnebenkosten', feldLabel: 'Kaufnebenkosten in %', wert: knk });
  }
  // Kaufnebenkosten unter der Grunderwerbsteuer des Bundeslands allein (Teil 3, 8: "abgeglichen mit dem Bundesland")
  const grest = immo.bundesland && !grestFrei(immo) ? grestSatz(immo.bundesland, immo.kaufdatum || heute) : null;
  if (kaufpreis > 0 && grest && knk > 0 && knk < grest.satz && !(knk < S.kaufnebenkosten.min)) {
    add({ id: 'kaufnebenkosten-grest', stufe: 'gelb', titel: `Kaufnebenkosten ${pct(knk, 1)} — weniger als die Grunderwerbsteuer`,
      text: `In ${GREST_HISTORIE[immo.bundesland].name} galt am Kaufdatum ${pct(grest.satz, 1)} Grunderwerbsteuer. Dazu kommen Notar und Grundbuch.`,
      feld: 'kaufnebenkosten', feldLabel: 'Kaufnebenkosten in %', wert: knk, fingerprint: `${knk}|${immo.bundesland}` });
  }
  if (flaeche > 0 && (flaeche < S.wohnflaeche.min || flaeche > S.wohnflaeche.max)) {
    add({ id: 'wohnflaeche', stufe: 'gelb', titel: `Wohnfläche ${flaeche} m²`,
      text: `Für eine Wohnung ungewöhnlich (üblich ${S.wohnflaeche.min} bis ${S.wohnflaeche.max} m²).`,
      feld: 'wohnflaeche', feldLabel: 'Wohnfläche', wert: flaeche });
  }
  const mw = Number(immo.geschaetzterWert) || 0;
  if (mw > 0 && kaufpreis > 0 && (mw > kaufpreis * S.marktwertFaktor.max || mw < kaufpreis * S.marktwertFaktor.min)) {
    add({ id: 'marktwert-faktor', stufe: 'gelb', titel: 'Marktwert weicht stark vom Kaufpreis ab',
      text: `Marktwert ${eur(mw)}, Kaufpreis ${eur(kaufpreis)}. Jahreszahl statt Betrag eingetragen oder eine Null zu viel?`,
      feld: 'geschaetzterWert', feldLabel: 'Marktwert heute', wert: mw, fingerprint: `${mw}|${kaufpreis}` });
  }
  if (kaufdatum) {
    // Mietbeginn vor Eigentum → gelb (Mieter übernommen?)
    mieter.filter(m => m.immobilie_id === immo.id && m.aktiv !== false).forEach(m => {
      if (m.mietbeginn && new Date(m.mietbeginn) < kaufdatum) {
        add({ id: `mietbeginn-${m.id}`, stufe: 'gelb', titel: `Mietbeginn vor dem Kaufdatum (${m.name || 'Mieter'})`,
          text: `Mietbeginn ${dat(m.mietbeginn)}, gekauft am ${dat(kaufdatum)}. Hast du den Mieter übernommen? Dann stimmt das so.`,
          wert: m.mietbeginn });
      }
    });
  }

  // ── Geschätzt / informativ (grau) ────────────────────────────────────────
  const gesamtInvest = kaufpreis * (1 + (knk || 0) / 100);
  const ek = (Number(immo.ekFuerNebenkosten) || 0) + (Number(immo.ekFuerKaufpreis) || 0);
  if (kreditLaeuft && gesamtInvest > 0 && ek / gesamtInvest < S.eigenkapitalquote.min) {
    add({ id: 'ek-quote', stufe: 'grau', titel: 'Kaum Eigenkapital eingesetzt',
      text: `Eigenkapital ${eur(ek)} bei ${eur(gesamtInvest)} Gesamtinvestition. Die Eigenkapitalrendite wird deshalb nicht als Prozentwert gezeigt.`, wert: ek });
  }
  if (mw > 0) {
    const gepflegt = immo.geschaetzterWertDatum ? new Date(immo.geschaetzterWertDatum) : null;
    const monate = gepflegt ? (heute - gepflegt) / (1000 * 60 * 60 * 24 * 30.44) : null;
    if (!gepflegt || monate > S.marktwertAlterMonate) {
      add({ id: 'marktwert-alt', stufe: 'grau', titel: gepflegt ? 'Marktwert seit über 18 Monaten nicht gepflegt' : 'Marktwert noch nie gepflegt',
        text: gepflegt ? `Zuletzt am ${dat(gepflegt)}. Beleihbar frei und dein Anteil hängen daran.` : 'Beleihbar frei und dein Anteil hängen daran.',
        feld: 'geschaetzterWert', feldLabel: 'Marktwert heute', wert: mw, fingerprint: `${mw}|${immo.geschaetzterWertDatum || ''}` });
    }
  }
  zr.forEach((z, i) => {
    const p = phasen[i];
    if (z.ende && z.endeGeschaetzt && !p.abbezahltAm && (i === phasen.length - 1)) {
      add({ id: `zb-geschaetzt-${i}`, stufe: 'grau', titel: 'Zinsbindungsende ist geschätzt',
        text: `Aus Start plus ${p.zinsbindung || 10} Jahren abgeleitet (${dat(z.ende)}). Das Datum aus dem Kreditvertrag eintragen — daran hängt deine Erinnerung.`,
        feld: `phase:${i}:zinsbindungBis`, feldTyp: 'date', feldLabel: 'Zinsbindung bis', wert: p.zinsbindungBis || iso(z.ende), bestaetigbarAlsDatum: true });
    }
  });
  Object.entries(immo.feldHerkunft || {}).forEach(([feld, herkunft]) => {
    if (herkunft !== 'geschaetzt') return;
    if (feld === 'hausgeldNichtUmlagefaehig' && nu != null && nu !== '') {
      add({ id: 'nu-geschaetzt', stufe: 'grau', titel: 'Nicht umlagefähiger Anteil ist geschätzt (35 %)',
        text: 'Den echten Wert findest du in der Hausgeldabrechnung oder im Wirtschaftsplan.',
        feld: 'hausgeldNichtUmlagefaehig', feldLabel: 'davon nicht umlagefähig', wert: nu });
    }
  });

  // Bestätigte gelbe/graue Hinweise ausblenden, solange sich der Wert nicht geändert hat
  const best = immo.plausiBestaetigt || {};
  return h.filter(x => x.stufe === 'rot' || best[x.id]?.wert !== x.fingerprint);
}

// Alle geprüften Werte, die gerade NICHT auffällig sind — für die Zeile
// "N weitere Werte sind unauffällig · Alle anzeigen" in der Prüfung.
// offeneHinweise = Ergebnis von pruefeImmobilie (ohne bestätigte).
export function unauffaelligeWerte(immo, offeneHinweise = [], { heute = new Date() } = {}) {
  if (!immo || ['mietimmobilie', 'mehrfamilienhaus'].includes(immo.immobilienTyp)) return [];
  const offen = new Set(offeneHinweise.map(x => x.id));
  const best = immo.plausiBestaetigt || {};
  const w = [];
  const add = (id, label, wert, ids = [id]) => {
    if (ids.some(i => offen.has(i))) return;
    w.push({ id, label, wert, bestaetigt: ids.some(i => best[i]) });
  };
  const kaufpreis = Number(immo.kaufpreis) || 0;
  const flaeche = Number(immo.wohnflaeche) || 0;
  const miete = getAktuelleMiete(immo) || Number(immo.kaltmiete) || 0;
  const hausgeld = Number(immo.hausgeld) || 0;
  const knk = Number(immo.kaufnebenkosten) || 0;
  const mw = Number(immo.geschaetzterWert) || 0;
  if (miete > 0 && flaeche > 0) add('miete-qm', 'Kaltmiete pro m²', eur2(miete / flaeche));
  if (miete > 0 && kaufpreis > 0) add('kaufpreisfaktor', 'Kaufpreisfaktor', (kaufpreis / (miete * 12)).toLocaleString('de-DE', { maximumFractionDigits: 1 }));
  if (hausgeld > 0 && flaeche > 0) add('hausgeld-qm', 'Hausgeld pro m²', eur2(hausgeld / flaeche));
  if (flaeche > 0) add('wohnflaeche', 'Wohnfläche', `${flaeche.toLocaleString('de-DE')} m²`);
  if (kaufpreis > 0 && knk > 0 && !immo.geschenkt) add('kaufnebenkosten', 'Kaufnebenkosten', pct(knk, 1), ['kaufnebenkosten', 'kaufnebenkosten-grest']);
  if (mw > 0 && kaufpreis > 0) add('marktwert-faktor', 'Marktwert zu Kaufpreis', `${eur(mw)} / ${eur(kaufpreis)}`);
  if (mw > 0) add('marktwert-alt', 'Marktwert aktuell gepflegt', immo.geschaetzterWertDatum ? dat(immo.geschaetzterWertDatum) : '—');
  const nu = immo.hausgeldNichtUmlagefaehig;
  if (nu !== null && nu !== undefined && nu !== '' && hausgeld > 0) add('nu-ueber-hausgeld', 'Nicht umlagefähig ≤ Hausgeld', `${eur(nu)} von ${eur(hausgeld)}`, ['nu-ueber-hausgeld', 'nu-geschaetzt']);
  const phasen = immo.finanzierungsphasen || [];
  const mehr = phasen.length > 1;
  phasen.forEach((p, i) => {
    const sfx = mehr ? ` (Phase ${i + 1})` : '';
    const z = phasenZins(p, immo);
    if (z > 0) add(`sollzins-${i}`, `Sollzins${sfx}`, pct(z));
    const at = Number(p.anfangstilgung);
    if (at > 0 && p.darlehensTyp !== 'endfaellig') add(`tilgung-${i}`, `Anfangstilgung${sfx}`, pct(at));
    if (p.monatlicherBetrag > 0 && at > 0) add(`rate-${i}`, `Rate passt zu Zins und Tilgung${sfx}`, eur(p.monatlicherBetrag));
    if (p.zinsbindungBis) add(`zb-vor-start-${i}`, `Zinsbindung nach Kreditstart${sfx}`, dat(p.zinsbindungBis), [`zb-vor-start-${i}`, `zb-vor-kauf-${i}`, `zb-geschaetzt-${i}`]);
    if (p.schlusszahlung > 0 && p.abbezahltAm) add(`schluss-${i}`, `Schlusszahlung${sfx}`, eur(p.schlusszahlung));
  });
  if (phasen.length) {
    const v = darlehensVerlauf(immo, heute);
    if (v && v.fk > 0) add('restschuld-waechst', 'Restschuld sinkt planmäßig', eur(v.restschuldAm(heute)));
  }
  return w;
}

export const zaehle = (hinweise) => ({
  rot: hinweise.filter(x => x.stufe === 'rot').length,
  gelb: hinweise.filter(x => x.stufe === 'gelb').length,
  grau: hinweise.filter(x => x.stufe === 'grau').length,
});

// Erinnerung im Cockpit: ab 1 Widerspruch oder mehr als 2 gelben Hinweisen
export const brauchtErinnerung = (hinweise) => {
  const z = zaehle(hinweise);
  return z.rot >= S.erinnerung.rotAb || z.gelb > S.erinnerung.gelbMehrAls;
};

// Wert eines Feldpfads ("kaltmiete" oder "phase:1:sollzinssatz") setzen
export function setzeFeld(params, feld, wert) {
  if (feld.startsWith('phase:')) {
    const [, idx, key] = feld.split(':');
    const phasen = (params.finanzierungsphasen || []).map((p, i) => {
      if (i !== Number(idx)) return p;
      const upd = { ...p, [key]: wert };
      if (key === 'zinsbindungBis') upd.zinsbindungBisBestaetigt = !!wert;
      if (key === 'monatlicherBetrag' || key === 'anfangstilgung') { /* Rate/Tilgung bleiben wie eingegeben */ }
      return upd;
    });
    return { ...params, finanzierungsphasen: phasen };
  }
  const extra = feld === 'geschaetzterWert' ? { geschaetzterWertDatum: new Date().toISOString().slice(0, 10) } : {};
  return { ...params, ...extra, [feld]: wert, feldHerkunft: { ...(params.feldHerkunft || {}), [feld]: 'manuell' } };
}

export function bestaetige(params, hinweis) {
  const extra = hinweis.bestaetigbarAlsDatum ? setzeFeld(params, hinweis.feld, hinweis.wert) : params;
  return { ...extra, plausiBestaetigt: { ...(params.plausiBestaetigt || {}), [hinweis.id]: { wert: hinweis.fingerprint, am: new Date().toISOString() } } };
}
