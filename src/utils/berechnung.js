import { getPreisNachPLZ } from '../constants/plz.js';
import { getAktuelleMiete, getAktuelleUntermiete, getAktuelleWarmmiete, getAktuellerWert, zahltIchAm, zahlerAnteilJahr, arbitrageZusatzkosten } from './miete.js';
import { darlehensVerlauf, anfangsFremdkapital } from './darlehen.js';
import { bausparMonat } from './bauspar.js';
import { normalisiereImmobilie, zahl } from './zahlen.js';

// Immobilienwert schätzen
export const schaetzeImmobilienwert = (immobilie) => {
  immobilie = normalisiereImmobilie(immobilie); // Text/leer → Zahl/null (utils/zahlen.js)
  const { preis: basisPreis, genauigkeit } = getPreisNachPLZ(immobilie.plz);
  let preisProQm = basisPreis;

  // Zustandsfaktoren
  const zustandsFaktoren = {
    'neuwertig': 1.15,
    'sehr gut': 1.08,
    'gut': 1.0,
    'normal': 0.95,
    'renovierungsbedürftig': 0.80,
    'sanierungsbedürftig': 0.65
  };

  // Objektart-Faktoren
  const objektFaktoren = {
    'eigentumswohnung': 1.0,
    'einfamilienhaus': 1.1,
    'doppelhaushälfte': 1.05,
    'reihenhaus': 0.95,
    'mehrfamilienhaus': 0.9,
    'grundstück': 0.7
  };

  // Energieeffizienz-Faktoren
  const energieFaktoren = {
    'A+': 1.08, 'A': 1.05, 'B': 1.02, 'C': 1.0,
    'D': 0.98, 'E': 0.95, 'F': 0.92, 'G': 0.88, 'H': 0.85
  };

  // Faktoren anwenden
  preisProQm *= zustandsFaktoren[immobilie.zustand] || 1.0;
  preisProQm *= objektFaktoren[immobilie.objektart] || 1.0;
  preisProQm *= energieFaktoren[immobilie.energieeffizienz] || 1.0;

  // Baujahr-Anpassung
  if (immobilie.baujahr) {
    const alter = new Date().getFullYear() - parseInt(immobilie.baujahr);
    if (alter <= 5) preisProQm *= 1.1;
    else if (alter <= 15) preisProQm *= 1.05;
    else if (alter <= 30) preisProQm *= 1.0;
    else if (alter <= 50) preisProQm *= 0.95;
    else if (alter <= 80) preisProQm *= 0.90;
    else preisProQm *= 0.85;
  }

  // Extras
  if (immobilie.balkon) preisProQm *= 1.03;
  if (immobilie.garage) preisProQm *= 1.04;
  if (immobilie.keller) preisProQm *= 1.02;

  // Ohne Wohnfläche keine Schätzung (vorher: stillschweigend 80 m² angenommen)
  const geschaetzterWert = Math.round(preisProQm * (Number(immobilie.wohnflaeche) || 0));

  // Konfidenzbereich basierend auf Genauigkeit
  let konfidenz = 0.15;
  if (genauigkeit === 'exakt') konfidenz = 0.08;
  else if (genauigkeit === 'PLZ-Bereich (4-stellig)') konfidenz = 0.12;
  else if (genauigkeit === 'PLZ-Bereich (3-stellig)') konfidenz = 0.15;
  else if (genauigkeit === 'Region') konfidenz = 0.20;
  else konfidenz = 0.25;

  return {
    wert: geschaetzterWert,
    preisProQm: Math.round(preisProQm),
    genauigkeit,
    konfidenzMin: Math.round(geschaetzterWert * (1 - konfidenz)),
    konfidenzMax: Math.round(geschaetzterWert * (1 + konfidenz))
  };
};

// Aktuellen Gesamtwert inkl. Stellplatz-Kaufpreis berechnen
export const getAktuellerGesamtwert = (immo) => {
  immo = normalisiereImmobilie(immo); // Text/leer → Zahl/null (utils/zahlen.js)
  const basis = immo.geschaetzterWert || immo.kaufpreis || 0;
  const sp = immo.stellplatz;
  const spWert = (sp?.vorhanden && sp?.kaufpreisAnteil) ? (sp.kaufpreisAnteil * (sp.anzahl || 1)) : 0;
  return basis + spWert;
};

// Wertsteigerung seit Kauf berechnen
export const berechneWertsteigerungSeitKauf = (immobilie, aktuellerWert) => {
  immobilie = normalisiereImmobilie(immobilie); // Text/leer → Zahl/null (utils/zahlen.js)
  if (!immobilie.kaufdatum || !immobilie.kaufpreis) return null;

  const kaufdatum = new Date(immobilie.kaufdatum);
  const heute = new Date();
  const jahreSeitKauf = (heute - kaufdatum) / (1000 * 60 * 60 * 24 * 365.25);

  if (jahreSeitKauf <= 0) return null;

  const absoluteSteigerung = aktuellerWert - immobilie.kaufpreis;
  const prozentSteigerung = ((aktuellerWert / immobilie.kaufpreis) - 1) * 100;
  const jaehrlicheRendite = (Math.pow(aktuellerWert / immobilie.kaufpreis, 1 / jahreSeitKauf) - 1) * 100;

  return {
    absoluteSteigerung,
    prozentSteigerung,
    jaehrlicheRendite,
    jahreSeitKauf
  };
};

// Restschuld berechnen basierend auf Kreditstartdatum (oder Kaufdatum) und Finanzierung
export const berechneRestschuld = (immobilie) => {
  immobilie = normalisiereImmobilie(immobilie); // Text/leer → Zahl/null (utils/zahlen.js)
  // Phase F: datumsgenauer Verlauf (Sondertilgungen, abbezahlt) hat Vorrang — dieselbe
  // Rechnung wie der Finanzierungs-Reiter, auch bei Erbe/Schenkung ohne Kaufpreis.
  const verlaufRS = (immobilie.finanzierungsphasen || []).length ? darlehensVerlauf(immobilie) : null;
  if (verlaufRS) {
    return { restschuld: Math.round(verlaufRS.restschuldHeute), anfangsFremdkapital: verlaufRS.fk, getilgt: Math.max(0, verlaufRS.fk - verlaufRS.restschuldHeute) };
  }

  // Geschenkt oder voll eigenfinanziert: es existiert kein Kredit, also auch
  // keine Restschuld — sonst würde unten fälschlich ein Fremdkapital in Höhe
  // der Kaufnebenkosten (Default 10 %) konstruiert und "getilgt".
  if (!immobilie.kreditLaeuftBereits && anfangsFremdkapital(immobilie) <= 0) {
    return { restschuld: 0, anfangsFremdkapital: 0, getilgt: 0 };
  }

  // "Kredit läuft bereits" (Altdaten ohne Finanzierungsphase): Restschuld direkt bekannt
  if (immobilie.kreditLaeuftBereits && immobilie.aktuelleRestschuld != null) {
    const rs = immobilie.aktuelleRestschuld || 0;
    const kp = immobilie.kaufpreis || rs;
    return { restschuld: rs, anfangsFremdkapital: kp, getilgt: Math.max(0, kp - rs) };
  }
  if (!immobilie.kaufpreis) return null;

  // Kreditstartdatum: aus erster Finanzierungsphase oder Fallback auf Kaufdatum
  const erstePhaseRS = (immobilie.finanzierungsphasen || [])[0];
  const startDatumStr = erstePhaseRS?.kreditStartDatum || immobilie.kaufdatum;
  if (!startDatumStr) return null;

  const startDatum = new Date(startDatumStr);
  const heute = new Date();
  const monateSeitKauf = Math.floor((heute - startDatum) / (1000 * 60 * 60 * 24 * 30.44));

  if (monateSeitKauf <= 0) return null;

  // Finanzierungsparameter mit Defaults
  const zinssatz = immobilie.zinssatz ?? 4.0;
  const tilgung = immobilie.tilgung ?? 2.0;
  const kaufnebenkosten = immobilie.kaufnebenkosten ?? 10;
  void kaufnebenkosten; void tilgung;

  // Finanzierungsbetrag: gemeinsame Regel (darlehen.js)
  const fkStart = anfangsFremdkapital(immobilie);
  if (fkStart <= 0) return { restschuld: 0, anfangsFremdkapital: 0, getilgt: 0 };

  // Monatliche Annuität: feste Rate aus erster Phase oder berechnet
  const monatszins = zinssatz / 100 / 12;
  const laufzeit = immobilie.laufzeit ?? 25;
  const erstePhase = (immobilie.finanzierungsphasen || [])[0];
  const annuitaet = (erstePhase?.finanzierungsModus === 'festRate' && erstePhase?.monatlicherBetrag > 0)
    ? erstePhase.monatlicherBetrag
    : (monatszins > 0 ? fkStart * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) / (Math.pow(1 + monatszins, laufzeit * 12) - 1) : 0);

  // Restschuld iterativ berechnen
  let restschuld = fkStart;
  for (let monat = 0; monat < monateSeitKauf && restschuld > 0; monat++) {
    const monatsZinsen = restschuld * monatszins;
    const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
    restschuld = Math.max(0, restschuld - monatsTilgung);
  }

  return {
    restschuld: Math.round(restschuld),
    anfangsFremdkapital: Math.round(fkStart),
    getilgt: Math.round(fkStart - restschuld)
  };
};

// Gibt die monatliche Kreditrate für ein bestimmtes Kalenderjahr zurück,
// anhand der Finanzierungsphasen (Anschlussfinanzierung berücksichtigt)
export const berechneJahresRateFuerPhasen = (phasen, fremdkapital, kreditStartJahr, targetJahr, fallbackRate) => {
  if (!phasen || phasen.length === 0 || fremdkapital <= 0) return fallbackRate;
  let jahrOffset = 0;
  let aktuelleRestschuld = fremdkapital;
  for (let i = 0; i < phasen.length; i++) {
    const phase = phasen[i];
    const phasenzins = phase.sollzinssatz ?? phase.zinssatz ?? 4.0;
    const startKreditPhase = (i > 0 && phase.restschuldOverride != null) ? phase.restschuldOverride : aktuelleRestschuld;
    const phaseLaufzeit = phase.darlehensTyp === 'endfaellig' ? (phase.laufzeit || 10) : (phase.zinsbindung || 10);
    const phaseEndJahr = kreditStartJahr + jahrOffset + phaseLaufzeit;
    const mzins = phasenzins / 100 / 12;
    const lmonate = phaseLaufzeit * 12;
    // Vereinfachte deutsche Formel: K × (Z/12 + T/12) — identisch mit Finanzierung-Tab
    const anfangstilgung = phase.anfangstilgung || (phase.darlehensTyp === 'endfaellig' ? 0 : 2.0);
    const phasenRate = (phase.monatlicherBetrag > 0)
      ? phase.monatlicherBetrag
      : (startKreditPhase > 0 ? startKreditPhase * (mzins + anfangstilgung / 100 / 12) : 0);
    if (targetJahr < phaseEndJahr || i === phasen.length - 1) {
      return phasenRate;
    }
    // Restschuld nach dieser Phase für die nächste Phase
    let rs = startKreditPhase;
    for (let m = 0; m < lmonate && rs > 0; m++) {
      const mz = rs * mzins;
      rs = Math.max(0, rs - Math.min(phasenRate - mz, rs));
    }
    aktuelleRestschuld = rs;
    jahrOffset += phaseLaufzeit;
  }
  return fallbackRate;
};

/**
 * Berechnet die tatsächlichen Schuldzinsen (Zinsanteil der Annuität) für ein
 * bestimmtes Steuerjahr — annuitätisch korrekt, mit Phasenberücksichtigung.
 * Ersetzt die vereinfachte Formel fremdkapital × zinssatz im Steuerexport.
 */
export const berechneJahresZinsenFuerSteuer = (immo, targetJahr) => {
  immo = normalisiereImmobilie(immo); // Text/leer → Zahl/null (utils/zahlen.js)
  if (anfangsFremdkapital(immo) <= 0) return 0;

  const kaufjahr = immo.kaufdatum ? new Date(immo.kaufdatum).getFullYear() : null;
  if (!kaufjahr || targetJahr < kaufjahr) return 0;

  // Fremdkapital: gemeinsame Regel
  const fk = anfangsFremdkapital(immo);

  if (fk <= 0) return 0;

  // Phasen-Timeline vorberechnen (startRelJahr, zinssatz, monthlyRate)
  const phasen = immo.finanzierungsphasen || [];
  const timeline = [];
  let tempRS = fk;
  let offset = 0;
  if (phasen.length > 0) {
    for (let p = 0; p < phasen.length; p++) {
      const ph = phasen[p];
      const pz = ph.sollzinssatz ?? ph.zinssatz ?? (immo.zinssatz || 4);
      const phaseLaufzeit = ph.zinsbindung || 10;
      const startRS = (p > 0 && ph.restschuldOverride != null) ? ph.restschuldOverride : tempRS;
      const at = ph.anfangstilgung || (immo.tilgung || 2.0);
      const mz = pz / 100 / 12;
      const rate = ph.monatlicherBetrag > 0 ? ph.monatlicherBetrag : startRS * (mz + at / 100 / 12);
      timeline.push({ startRelJahr: offset, zinssatz: pz, monthlyRate: rate });
      let pr = startRS;
      for (let m = 0; m < phaseLaufzeit * 12 && pr > 0; m++) {
        const mzM = pr * mz;
        pr = Math.max(0, pr - Math.min(rate - mzM, pr));
      }
      tempRS = pr;
      offset += phaseLaufzeit;
    }
  } else {
    const pz = immo.zinssatz || 4;
    const mz = pz / 100 / 12;
    const lauf = immo.laufzeit || 25;
    const rate = mz > 0 ? fk * mz * Math.pow(1 + mz, lauf * 12) / (Math.pow(1 + mz, lauf * 12) - 1) : fk * (immo.tilgung || 2) / 100 / 12;
    timeline.push({ startRelJahr: 0, zinssatz: pz, monthlyRate: rate });
  }

  // Jahresweise simulieren und Zinsanteil für targetJahr ermitteln
  let rs = fk;
  for (let yr = kaufjahr; yr <= targetJahr && rs > 0; yr++) {
    const relJahr = yr - kaufjahr;
    // Aktive Phase: letzter Eintrag mit startRelJahr ≤ relJahr
    let active = timeline[timeline.length - 1];
    for (const t of timeline) { if (relJahr >= t.startRelJahr) active = t; }
    const monatszins = active.zinssatz / 100 / 12;
    let jahresZinsen = 0;
    for (let m = 0; m < 12 && rs > 0; m++) {
      const mzM = rs * monatszins;
      jahresZinsen += mzM;
      rs = Math.max(0, rs - Math.min(active.monthlyRate - mzM, rs));
    }
    if (yr === targetJahr) return Math.round(jahresZinsen);
  }
  return 0;
};

// ── Kostenstruktur (UX-Paket Teil 2, Nachtrag + Rechenregeln) ────────────────
// Bewirtschaftung = nicht umlagefähiger Hausgeldanteil + eigene Rücklage
//                  + Grundsteuer + Versicherung + SEV (+ weitere gewählte Posten)
// Die Nebenkosten-Vorauszahlung und der umlagefähige Hausgeldanteil laufen nur
// durch (Ausgleich über die Jahresabrechnung) und zählen deshalb nicht im Cashflow.
// Solange der nicht umlagefähige Anteil unbekannt ist (Feld leer), bleibt es bei
// der bisherigen Rechnung: volles Hausgeld als Kosten, volle NK-VZ als Einnahme.
// Pauschalmiete: keine Abrechnung — volles Hausgeld ist echte Kosten.
// get(feld) liefert den Monatswert eines datierbaren Kostenfelds (aktuell oder Jahresschnitt).
// jahr (optional): für Jahreswerte — dann zählt der Anteil der Monate, in denen ich zahle.
export const kostenStruktur = (immo, get = (f) => zahl(immo?.[f]), jahr = null) => {
  immo = normalisiereImmobilie(immo);
  const getRoh = get; get = (f) => zahl(getRoh(f));
  // Wer zahlt? Positionen, die der Mieter/die Firma direkt zahlt, sind keine Kosten für mich.
  const zf = (feld) => (jahr != null ? zahlerAnteilJahr(immo, feld, jahr) : (zahltIchAm(immo, feld) ? 1 : 0));
  const modell = immo?.vermietungsmodell || 'kaltmiete';
  const istMFH = immo?.immobilienTyp === 'mehrfamilienhaus';
  const hausgeld = get('hausgeld');
  const nuRoh = immo?.hausgeldNichtUmlagefaehig;
  const nuBekannt = !istMFH && modell !== 'warmmiete' && nuRoh !== null && nuRoh !== undefined && nuRoh !== '' && !Number.isNaN(Number(nuRoh));
  const nichtUmlagefaehig = nuBekannt ? Math.min(Math.max(0, Number(nuRoh)), hausgeld) : null;
  const nkVomMieter = (!istMFH && modell === 'kaltmiete_nk') ? (Number(immo?.nebenkostenVomMieter) || 0) : 0;
  const sev = get('verwaltung');
  // Grundsteuer/Versicherung gehören seit Phase E in den Cashflow (vorher nur Steuer). MFH unverändert.
  const grundsteuer = istMFH ? 0 : (Number(immo?.grundsteuerMonat) || 0);
  const weitere = {
    ruecklage: get('instandhaltung'),
    versicherung: istMFH ? 0 : (Number(immo?.versicherungMonat) || 0),
    strom: get('strom') * zf('strom'),
    heizung: istMFH ? 0 : get('heizung') * zf('heizung'),
    internet: get('internet') * zf('internet'),
    rundfunk: istMFH ? 0 : get('rundfunk') * zf('rundfunk'),
    kontofuehrung: istMFH ? 0 : (Number(immo?.kontofuehrung) || 0),
    sonstige: get('nebenkosten') * zf('nebenkosten'),
  };
  const weitereSumme = Object.values(weitere).reduce((a, b) => a + b, 0);
  const hausgeldImCashflow = nuBekannt ? nichtUmlagefaehig : hausgeld;
  const nkImCashflow = nuBekannt ? 0 : nkVomMieter;
  return {
    modell, nuBekannt, hausgeld, nichtUmlagefaehig,
    umlagefaehig: nuBekannt ? hausgeld - nichtUmlagefaehig : null,
    nkVomMieter, nkImCashflow, hausgeldImCashflow,
    sev, grundsteuer, weitere, weitereSumme,
    bewirtschaftung: hausgeldImCashflow + sev + grundsteuer + weitereSumme,
  };
};

// Rendite-Berechnung
export const berechneRendite = (params) => {
  params = normalisiereImmobilie(params); // Text/leer → Zahl/null (utils/zahlen.js)
  // Fehlende Zahlen (leer/null) nicht als NaN durchrechnen — gleiche Defaults wie
  // berechneRestschuld/berechneImmoVermoegenswerte (Kaufnebenkosten 10 %).
  const zahl = (v, d = 0) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));
  params = {
    ...params,
    kaufpreis: zahl(params?.kaufpreis),
    kaufnebenkosten: zahl(params?.kaufnebenkosten, 10),
    kaltmiete: zahl(params?.kaltmiete),
    instandhaltung: zahl(params?.instandhaltung),
    verwaltung: zahl(params?.verwaltung),
    // Fehlende Annahmen wie beim Laden aus der Datenbank (dbToApp): 2 % / 1,5 %
    wertsteigerung: zahl(params?.wertsteigerung, 2),
    mietsteigerung: zahl(params?.mietsteigerung, 1.5),
  };
  const {
    kaufpreis, zinssatz, tilgung, laufzeit,
    kaltmiete, nebenkosten, instandhaltung, verwaltung,
    hausgeld = 0, strom = 0, internet = 0,
    wertsteigerung, mietsteigerung, kaufnebenkosten,
    finanzierungsbetrag, kaufdatum,
    ekFuerNebenkosten, ekFuerKaufpreis, eigenkapital,
    vermietungsmodell = 'kaltmiete',
    nebenkostenVomMieter = 0,
    vollEigenfinanziert = false,
    geschenkt = false,
  } = params;

  // "Kredit läuft bereits": Fremdkapital und Rate direkt bekannt
  const kreditLaeuftBereits = params.kreditLaeuftBereits || false;

  // Kaufjahr für Chart-Darstellung
  const kaufjahr = kaufdatum ? new Date(kaufdatum).getFullYear() : new Date().getFullYear();

  const kaufnebenkostenAbsolut = kaufpreis * (kaufnebenkosten / 100);
  const gesamtinvestition = kaufpreis + kaufnebenkostenAbsolut;

  // Eigenkapital berechnen aus neuer Aufteilung (falls vorhanden) oder legacy
  const gesamtEK = (ekFuerNebenkosten !== undefined && ekFuerKaufpreis !== undefined)
    ? (ekFuerNebenkosten || 0) + (ekFuerKaufpreis || 0)
    : (eigenkapital || 0);

  // Finanzierungsbetrag: kein Kredit bei vollEigenfinanziert/geschenkt, sonst manuell oder berechnet
  const fremdkapital = kreditLaeuftBereits
    ? (params.aktuelleRestschuld || 0)
    : anfangsFremdkapital({ ...params, vollEigenfinanziert, geschenkt, finanzierungsbetrag });

  // Einnahmen basierend auf Vermietungsmodell:
  // - kaltmiete: Nur Kaltmiete (NK werden via Abrechnung umgelegt, kein direkter Cashflow)
  // - kaltmiete_nk: Kaltmiete + NK-Vorauszahlung vom Mieter
  // - warmmiete: Warmmiete (alles inkl., Vermieter zahlt alle Betriebskosten)
  const jahresmieteKalt = kaltmiete * 12;
  const ks = kostenStruktur(params);
  const jahresNKVomMieter = ks.nkImCashflow * 12;

  // Stellplatz-Einnahmen (falls vorhanden und vermietet)
  const sp = params.stellplatz;
  const stellplatzMonatsMiete = (sp?.vorhanden && sp?.istVermietet)
    ? (sp.monatlicheMiete || 0) * (sp.anzahl || 1)
    : 0;
  const jahresStellplatz = stellplatzMonatsMiete * 12;

  const jahresEinnahmen = jahresmieteKalt + jahresNKVomMieter + jahresStellplatz;

  const jahresinstandhaltung = instandhaltung * 12;
  const jahresverwaltung = verwaltung * 12;
  const jahresHausgeld = hausgeld * 12;
  const jahresStrom = strom * 12;
  const jahresInternet = internet * 12;

  // Bruttorendite auf Basis der Mieteinnahmen (ohne NK-Vorauszahlung da Durchlaufposten bei kaltmiete_nk)
  const bruttorendite = kaufpreis > 0 ? (jahresmieteKalt / kaufpreis) * 100 : 0;

  // Nettorendite: Vermieter-Kosten von den Gesamteinnahmen abziehen
  const jahresVermieterKosten = ks.bewirtschaftung * 12;
  const nettoEinnahmen = jahresEinnahmen - jahresVermieterKosten;
  const nettorendite = kaufpreis > 0 ? (nettoEinnahmen / kaufpreis) * 100 : 0;

  // Aktive Finanzierungsphase bestimmen (basierend auf Kreditstartdatum + heute)
  // Wenn finanzierungsphasen vorhanden: nimm die aktuell laufende Phase
  const aktivePhaseDaten = kreditLaeuftBereits
    ? {
        zinssatz: zinssatz ?? 3.5,
        monatlicherBetrag: params.kreditMonatsrate || 0,
        restschuld: params.aktuelleRestschuld || 0,
      }
    : (() => {
    const phasen = params.finanzierungsphasen;
    if (!phasen || phasen.length === 0) return null;
    // Phase F: Darlehen als abbezahlt markiert → keine Kreditrate mehr
    const verlaufR = darlehensVerlauf(params);
    if (verlaufR?.abbezahltHeute && phasen.some(p => p.abbezahltAm)) {
      return { zinssatz: 0, restschuld: 0, laufzeit: 1, monatlicherBetrag: 0 };
    }
    // Kreditstart: aus Phase 1 oder Kaufdatum
    const kreditStart = phasen[0]?.kreditStartDatum || kaufdatum;
    if (!kreditStart) return null;
    const startJahr = new Date(kreditStart).getFullYear();
    const aktuellesJahr = new Date().getFullYear();
    let jahrOffset = 0;
    let aktuelleRestschuld = fremdkapital;
    for (let i = 0; i < phasen.length; i++) {
      const phase = phasen[i];
      // Zinssatz: sollzinssatz bevorzugen (neues Feld), Fallback auf zinssatz (Legacy), dann params-Wert
      const phasenzins = phase.sollzinssatz ?? phase.zinssatz ?? zinssatz;
      const startKreditPhase = (i > 0 && phase.restschuldOverride != null) ? phase.restschuldOverride : aktuelleRestschuld;
      const phaseLaufzeit = phase.darlehensTyp === 'endfaellig' ? (phase.laufzeit || 10) : (phase.zinsbindung || 10);
      const endjahr = startJahr + jahrOffset + phaseLaufzeit;
      // Rate für diese Phase: vereinfachte deutsche Formel K × (Z/12 + T/12) — identisch mit Finanzierung-Tab
      const mzins = phasenzins / 100 / 12;
      const lmonate = phaseLaufzeit * 12;
      const pAT = phase.anfangstilgung || (phase.darlehensTyp === 'endfaellig' ? 0 : 2.0);
      const phasenRate = (phase.monatlicherBetrag > 0)
        ? phase.monatlicherBetrag
        : (startKreditPhase > 0 ? startKreditPhase * (mzins + pAT / 100 / 12) : 0);
      // Restschuld nach dieser Phase berechnen
      let rs = startKreditPhase;
      for (let m = 0; m < lmonate && rs > 0; m++) {
        const mz = rs * mzins;
        rs = Math.max(0, rs - Math.min(phasenRate - mz, rs));
      }
      aktuelleRestschuld = rs;
      jahrOffset += phaseLaufzeit;
      if (aktuellesJahr < endjahr || i === phasen.length - 1) {
        return {
          zinssatz: phasenzins,
          restschuld: startKreditPhase,
          laufzeit: phaseLaufzeit,
          monatlicherBetrag: phasenRate,
        };
      }
    }
    return null;
  })();

  const effZinssatz = aktivePhaseDaten ? aktivePhaseDaten.zinssatz : zinssatz;
  const effKredit = aktivePhaseDaten ? aktivePhaseDaten.restschuld : fremdkapital;
  const effLaufzeit = aktivePhaseDaten ? aktivePhaseDaten.laufzeit : (laufzeit ?? 25);
  const monatszins = effZinssatz / 100 / 12;
  // Feste Rate aus aktiver Phase verwenden, sonst berechnen
  const annuitaet = (aktivePhaseDaten?.monatlicherBetrag > 0)
    ? aktivePhaseDaten.monatlicherBetrag
    : (effKredit > 0 && monatszins > 0 ? effKredit * (monatszins * Math.pow(1 + monatszins, effLaufzeit * 12)) / (Math.pow(1 + monatszins, effLaufzeit * 12) - 1) : 0);
  const jahresannuitaet = annuitaet * 12;

  const cashflowVorSteuern = nettoEinnahmen - jahresannuitaet;
  // B4: Für Renditen zählt das tatsächlich eingesetzte Eigenkapital = Gesamtinvestition
  // minus Darlehen. Die einzelnen EK-Felder können dem Darlehensbetrag widersprechen
  // (z. B. Vollfinanzierung inkl. Nebenkosten, alte EK-Angabe noch gesetzt) — dann
  // entstanden Werte wie 111 % auf einen Eigenkapital-Anteil, den es so nicht gab.
  const ekEingesetzt = kreditLaeuftBereits ? gesamtEK : Math.max(0, gesamtinvestition - fremdkapital);
  const cashOnCash = ekEingesetzt > 0 ? (cashflowVorSteuern / ekEingesetzt) * 100 : 0;

  // Abschnitt 7.5: bei 0€ Eigenkapital ist die EK-Rendite nicht 0%, sondern nicht
  // definiert (Division durch 0) — nur bei echtem 0-EK-Fall wird null zurückgegeben,
  // damit die UI "n. v." statt eines irreführenden "0,00%" in Rot anzeigen kann.
  const eigenkapitalRenditeRoh = ekEingesetzt > 0 ? ((nettoEinnahmen + (kaufpreis * wertsteigerung / 100)) / ekEingesetzt) * 100 : 0;
  const eigenkapitalRendite = ekEingesetzt > 0 ? eigenkapitalRenditeRoh : null;
  // Teil 3, Abschnitt 5.6: unter 5 % Eigenkapitalquote ist die EK-Rendite mathematisch
  // richtig, als Kennzahl aber nicht aussagekräftig (winziger Nenner) — die UI zeigt
  // dann einen Hinweis statt einer Prozentzahl.
  const eigenkapitalQuote = gesamtinvestition > 0 ? ekEingesetzt / gesamtinvestition : 0;
  const ekRenditeNichtAussagekraeftig = ekEingesetzt > 0 && eigenkapitalQuote < 0.05;

  const leverageEffekt = eigenkapitalRenditeRoh - nettorendite;

  // Entwicklung über Zeit — phasenbewusst
  // Precompute phase-timeline damit im Loop kein quadratischer Aufwand entsteht
  const phasenTimeline = (() => {
    const phasen = params.finanzierungsphasen || [];
    if (phasen.length === 0) return null;
    const tl = [];
    let tempRS = fremdkapital;
    let offset = 0;
    for (let p = 0; p < phasen.length; p++) {
      const ph = phasen[p];
      const pz = ph.sollzinssatz ?? ph.zinssatz ?? zinssatz ?? 4;
      const phaseLaufzeit = ph.zinsbindung || 10;
      const startRS = (p > 0 && ph.restschuldOverride != null) ? ph.restschuldOverride : tempRS;
      const at = ph.anfangstilgung || tilgung || 2.0;
      const mz = pz / 100 / 12;
      const rate = ph.monatlicherBetrag > 0
        ? ph.monatlicherBetrag
        : (startRS > 0 ? startRS * (mz + at / 100 / 12) : 0);
      tl.push({ startRelJahr: offset, zinssatz: pz, monthlyRate: rate, jahresrate: rate * 12 });
      // Restschuld am Ende der Phase berechnen
      let pr = startRS;
      for (let m = 0; m < phaseLaufzeit * 12 && pr > 0; m++) {
        const mzM = pr * mz;
        pr = Math.max(0, pr - Math.min(rate - mzM, pr));
      }
      tempRS = pr;
      offset += phaseLaufzeit;
    }
    return tl;
  })();

  const getPhasenDaten = (relJahr) => {
    if (!phasenTimeline) return { zinssatz: zinssatz ?? 4, jahresrate: jahresannuitaet };
    // Letzten Eintrag dessen startRelJahr ≤ relJahr finden
    let active = phasenTimeline[phasenTimeline.length - 1];
    for (const p of phasenTimeline) {
      if (relJahr >= p.startRelJahr) active = p;
    }
    return active;
  };

  const entwicklung = [];
  let aktuellerWert = kaufpreis;
  let aktuelleMiete = kaltmiete;
  let restschuld = fremdkapital;
  let gesamtTilgung = 0;
  let gesamtZinsen = 0;

  for (let i = 0; i <= (laufzeit ?? 25); i++) {
    const { zinssatz: jahresZinssatz, jahresrate } = getPhasenDaten(i);
    const jahresZinsen = restschuld * (jahresZinssatz / 100);
    const jahresTilgung = Math.min(jahresrate - jahresZinsen, restschuld);

    entwicklung.push({
      jahr: kaufjahr + i,
      jahrRelativ: i,
      immobilienwert: Math.round(aktuellerWert),
      restschuld: Math.round(restschuld),
      eigenkapital: Math.round(aktuellerWert - restschuld),
      jahresmiete: Math.round(aktuelleMiete * 12),
      cashflow: Math.round((aktuelleMiete * 12) + jahresNKVomMieter - jahresVermieterKosten - jahresrate)
    });

    aktuellerWert *= (1 + wertsteigerung / 100);
    aktuelleMiete *= (1 + mietsteigerung / 100);
    restschuld = Math.max(0, restschuld - jahresTilgung);
    gesamtTilgung += jahresTilgung;
    gesamtZinsen += jahresZinsen;
  }

  return {
    bruttorendite,
    nettorendite,
    eigenkapitalRendite,
    eigenkapitalQuote,
    ekRenditeNichtAussagekraeftig,
    cashOnCash,
    leverageEffekt,
    monatlicheRate: annuitaet,
    cashflowMonatlich: cashflowVorSteuern / 12,
    entwicklung,
    gesamtTilgung,
    gesamtZinsen,
    fremdkapital,
    kaufnebenkostenAbsolut,
    // Aktive Phase für CashflowUebersicht
    effZinssatz,
    effRestschuld: effKredit,
    // Stellplatz
    stellplatzMonatsMiete,
  };
};

// ─── Cashflow pro Monat — EINE Funktion für Karte, Cockpit, Zahlen-Reiter, Dashboard ───
// UX-Gesamtpaket B12/B15: Vorher gab es drei Rechenwege (Karte ohne Darlehen bei
// Schenkung, Cockpit ohne Bausparrate, Zahlen-Reiter korrekt). Jetzt rufen alle
// Stellen diese Funktion auf; ein Test prüft, dass sie überall dasselbe liefert.
//
// Rückgabe (alles pro Monat):
//   einnahmen   Miete (+ NK-Vorauszahlung, soweit sie im Cashflow zählt) + Stellplatz
//   betrieb     Bewirtschaftung (nicht umlagefähiges Hausgeld, SEV, Grundsteuer, …)
//   rate        Kreditrate des laufenden Monats (phasenbewusst)
//   zinsen      Zinsanteil dieses Monats, tilgung = rate − zinsen
//   bauspar     Sparraten aktiver Bausparverträge
//   vor         Cashflow vor Tilgung  = einnahmen − betrieb − zinsen − bauspar
//   nach        Cashflow nach Tilgung = einnahmen − betrieb − rate − bauspar
// Kostenfelder je Wohnung im MFH (wie KOSTEN_FELDER in MehrfamilienhausDetail)
export const MFH_KOSTEN_KEYS = ['hausverwaltung', 'instandhaltung', 'grundsteuer', 'versicherung', 'strom', 'internet', 'sonstige'];

export const cashflowMonat = (immo, heute = new Date()) => {
  immo = normalisiereImmobilie(immo); // Text/leer → Zahl/null (utils/zahlen.js)
  const typ = immo?.immobilienTyp;
  if (typ === 'mietimmobilie') {
    const vertragsEnde = immo.mietvertragEnde ? new Date(immo.mietvertragEnde) : null;
    const leer = { einnahmen: 0, betrieb: 0, rate: 0, zinsen: 0, tilgung: 0, bauspar: 0, vor: 0, nach: 0, hatKredit: false, stellplatz: 0, kaltmiete: 0, nkImCashflow: 0, ks: null };
    if (vertragsEnde && vertragsEnde < heute) return leer;
    const einnahmen = (immo.anzahlZimmerVermietet || 0) * getAktuelleUntermiete(immo);
    const betrieb = getAktuelleWarmmiete(immo) + arbitrageZusatzkosten(immo, heute);
    return { ...leer, einnahmen, betrieb, kaltmiete: einnahmen, vor: einnahmen - betrieb, nach: einnahmen - betrieb };
  }

  const istMFH = typ === 'mehrfamilienhaus';
  // MFH: Miete und Kosten je Wohnung (wie in der MFH-Detailansicht), sonst Kostenstruktur
  const kaltmiete = istMFH
    ? (immo.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0)
    : getAktuelleMiete(immo);
  let betrieb, nkImCashflow = 0, ks = null;
  if (istMFH) {
    const weKosten = (immo.wohnungen || []).some(w => w.kosten && Object.keys(w.kosten).length);
    betrieb = weKosten
      ? (immo.wohnungen || []).reduce((s, w) => s + MFH_KOSTEN_KEYS.reduce((k, f) => k + (Number((w.kosten || {})[f]) || 0), 0), 0)
      : (Number(immo.instandhaltung) || 0) + (Number(immo.verwaltung) || 0) + (Number(immo.hausgeld) || 0) + (Number(immo.strom) || 0) + (Number(immo.internet) || 0) + (Number(immo.nebenkosten) || 0);
  } else {
    ks = kostenStruktur(immo, (f) => getAktuellerWert(immo, f));
    betrieb = ks.bewirtschaftung;
    nkImCashflow = ks.nkImCashflow;
  }
  const sp = immo.stellplatz;
  const stellplatz = (sp?.vorhanden && sp?.istVermietet) ? (Number(sp.monatlicheMiete) || 0) * (Number(sp.anzahl) || 1) : 0;

  // Kreditrate: phasenbewusst über berechneRendite, Zinsanteil exakt für diesen Monat
  const ergebnis = berechneRendite({ ...immo, kaltmiete, ...(istMFH ? { vermietungsmodell: 'kaltmiete', nebenkostenVomMieter: 0 } : {}) });
  let rate = Math.max(0, ergebnis.monatlicheRate || 0);
  let zinsen = 0;
  // Darlehen mit Phasen: Rate, Zins und Tilgung aus derselben Quelle wie der Finanzierungs-Reiter
  // (darlehensVerlauf). Vorher konnte der Cashflow die Aufteilung über einen zweiten Weg herleiten
  // und bei frisch gestarteten Krediten "Zinsen = ganze Rate, Tilgung 0" zeigen.
  const dv = (immo.finanzierungsphasen || []).length ? darlehensVerlauf(immo, heute) : null;
  if (dv) {
    // Rate, Zins und Tilgung exakt aus dem Monat von heute (bzw. der ersten Rate, wenn der
    // Kredit erst startet): Zins = Restschuld × Sollzins / 12, Tilgung = Rate − Zins.
    if (dv.abbezahltHeute) { rate = 0; zinsen = 0; }
    else if (dv.rateHeute > 0) { rate = dv.rateHeute; zinsen = Math.min(rate, dv.zinsHeute || 0); }
  } else if (rate > 0) {
    const zt = berechneZinsUndTilgung(immo, heute.getFullYear(), heute.getMonth());
    zinsen = zt ? Math.max(0, Math.min(zt.zinsen, rate))
      : Math.max(0, Math.min(rate, (ergebnis.effRestschuld || 0) * ((ergebnis.effZinssatz || 0) / 100 / 12)));
  }
  const tilgung = Math.max(0, rate - zinsen);

  // A.7: Bausparrate nach Rolle — Tilgungsersatz zählt wie Tilgung (nicht in "vor Tilgung"),
  // Rücklage für das Objekt als laufende Kosten (in beiden Werten)
  const bs = bausparMonat(immo, heute);
  const bauspar = bs.gesamt;

  const einnahmen = kaltmiete + nkImCashflow + stellplatz;
  // "schuldenfrei" hängt allein an der Restschuld — nie am Tilgungsanteil (ein endfälliges
  // Darlehen hat Tilgung 0 und ist trotzdem nicht schuldenfrei).
  const restschuld = dv ? Math.max(0, dv.restschuldHeute || 0) : Math.max(0, berechneRestschuld(immo)?.restschuld || 0);
  return {
    restschuld, schuldenfrei: restschuld < 0.5,
    kaltmiete, nkImCashflow, stellplatz, einnahmen, betrieb, ks,
    rate, zinsen, tilgung, bauspar, bausparTilgung: bs.tilgung, bausparKosten: bs.kosten,
    vermoegensaufbau: tilgung + bs.tilgung,
    vor: einnahmen - betrieb - zinsen - bs.kosten,
    nach: einnahmen - betrieb - rate - bauspar,
    hatKredit: rate > 0,
  };
};

/**
 * berechneMtlCashflow — Cashflow nach Tilgung (monatlich). Kurzform von cashflowMonat().
 * Wird genutzt in: ImmobilienKarte, PortfolioOverview, Selbstauskunft-PDF, Rechner-Vergleich.
 */
export const berechneMtlCashflow = (immo) => cashflowMonat(immo).nach;

/**
 * Berechnet den exakten Zins- und Tilgungsanteil für ein Zieljahr oder Zielmonat.
 * Berücksichtigt Anschlussfinanzierungen (mehrere Finanzierungsphasen) korrekt
 * durch monatsgenaue Iteration von Kreditbeginn bis Zielpunkt.
 *
 * @param {Object} params - Immobilien-Parameter (inkl. finanzierungsphasen, kaufdatum, etc.)
 * @param {number} targetJahr - Zieljahr (z.B. 2024)
 * @param {number|null} targetMonat - 0–11 für spezifischen Kalendermonat; null = ganzes Jahr
 * @returns {{ zinsen, tilgung, restschuldAnfang, restschuldEnde } | null}
 */
export const berechneZinsUndTilgung = (params, targetJahr, targetMonat = null) => {
  params = normalisiereImmobilie(params); // Text/leer → Zahl/null (utils/zahlen.js)
  const phasen = params.finanzierungsphasen || [];

  // "Kredit läuft bereits": Zins/Tilgung aus Restschuld + Rate schätzen
  if (params.kreditLaeuftBereits && params.aktuelleRestschuld > 0) {
    const rs = params.aktuelleRestschuld || 0;
    const rate = params.kreditMonatsrate || 0;
    const mzins = (params.zinssatz || 3.5) / 100 / 12;
    const monatlicheZinsen = rs * mzins;
    const monatlicheTilgung = Math.max(0, rate - monatlicheZinsen);
    const f = targetMonat !== null ? 1 : 12; // Monatsabfrage liefert einen Monat, nicht das Jahr
    return {
      zinsen: Math.round(monatlicheZinsen * f),
      tilgung: Math.round(monatlicheTilgung * f),
      restschuldAnfang: rs,
      restschuldEnde: Math.max(0, rs - monatlicheTilgung * 12),
    };
  }

  const kreditStartStr = phasen[0]?.kreditStartDatum || params.kaufdatum;
  if (!kreditStartStr) return null;

  // Phase F: datumsgenauer Verlauf (Zinsbindung-bis-Daten, erfasste Sondertilgungen,
  // "Darlehen abbezahlt") — eine Rechnung für Finanzierungs-Reiter, Cashflow und Steuer.
  if (phasen.length > 0) {
    const v = darlehensVerlauf(params);
    if (v) {
      const von = targetJahr * 12 + (targetMonat !== null ? targetMonat : 0);
      const bis = targetJahr * 12 + (targetMonat !== null ? targetMonat : 11);
      let z = 0, t = 0;
      v.monate.forEach(e => { if (e.idx >= von && e.idx <= bis) { z += e.zins; t += e.tilgung + e.sonder; } });
      const d0 = new Date(Math.floor(von / 12), von % 12, 1);
      const d1 = new Date(Math.floor((bis + 1) / 12), (bis + 1) % 12, 1);
      return { zinsen: Math.round(z), tilgung: Math.round(t), restschuldAnfang: Math.round(v.restschuldAm(d0)), restschuldEnde: Math.round(v.restschuldAm(d1)) };
    }
  }
  if (!params.kaufpreis) return null;

  const kreditStart = new Date(kreditStartStr);
  const ksJahr = kreditStart.getFullYear();
  const ksMonat = kreditStart.getMonth(); // 0-indexed

  // Anfangs-Fremdkapital (identische Logik wie berechneRendite)
  const anfangsFK = params.kreditLaeuftBereits ? (params.aktuelleRestschuld || 0) : anfangsFremdkapital(params);

  if (anfangsFK <= 0) return { zinsen: 0, tilgung: 0, restschuldAnfang: 0, restschuldEnde: 0 };

  // Absoluter Monat relativ zum Kreditstart (0 = erster Kreditmonat)
  const toAbs = (j, m) => (j - ksJahr) * 12 + m - ksMonat;

  const zStartM = targetMonat !== null ? targetMonat : 0;
  const zEndM = targetMonat !== null ? targetMonat : 11;
  const absStart = toAbs(targetJahr, zStartM);
  const absEnd = toAbs(targetJahr, zEndM);

  // Zielzeitraum vollständig vor Kreditbeginn
  if (absEnd < 0) return { zinsen: 0, tilgung: 0, restschuldAnfang: anfangsFK, restschuldEnde: anfangsFK };

  const effStart = Math.max(0, absStart); // Clamp auf Kreditbeginn für erstes Jahr

  // Phasenliste aufbauen: { s: startAbsM, e: endAbsM, mz: Monatszinssatz, rate, override }
  const phaseListe = [];
  if (phasen.length > 0) {
    let kRS = anfangsFK;
    let phS = 0;
    for (let i = 0; i < phasen.length; i++) {
      const ph = phasen[i];
      const pz = ph.sollzinssatz ?? ph.zinssatz ?? (params.zinssatz ?? 4.0);
      const sk = (i > 0 && ph.restschuldOverride != null) ? ph.restschuldOverride : kRS;
      const lm = (ph.darlehensTyp === 'endfaellig' ? (ph.laufzeit || 10) : (ph.zinsbindung || 10)) * 12;
      const mz = pz / 100 / 12;
      const pAT = ph.anfangstilgung || (ph.darlehensTyp === 'endfaellig' ? 0 : 2.0);
      const rate = ph.monatlicherBetrag > 0 ? ph.monatlicherBetrag : (sk > 0 ? sk * (mz + pAT / 100 / 12) : 0);
      const isLast = i === phasen.length - 1;

      phaseListe.push({
        s: phS, e: isLast ? Infinity : phS + lm, mz, rate,
        override: (i > 0 && ph.restschuldOverride != null) ? ph.restschuldOverride : null,
      });

      // Restschuld am Phasenende für nächste Phase
      let rs = sk;
      for (let m = 0; m < lm && rs > 0; m++) {
        rs = Math.max(0, rs - Math.min(rate - rs * mz, rs));
      }
      kRS = rs;
      phS += lm;
    }
  } else {
    // Fallback: Einzel-Phase mit exakter Annuität (wie berechneRendite ohne Phasen)
    const pz = params.zinssatz ?? 4.0;
    const mz = pz / 100 / 12;
    const lm = (params.laufzeit ?? 25) * 12;
    const rate = anfangsFK > 0
      ? (mz > 0
        ? anfangsFK * (mz * Math.pow(1 + mz, lm)) / (Math.pow(1 + mz, lm) - 1)
        : anfangsFK / lm)
      : 0;
    phaseListe.push({ s: 0, e: Infinity, mz, rate, override: null });
  }

  // Monatsgenaue Iteration von Kreditbeginn bis Zielpunkt
  let rs = anfangsFK;
  let sumZins = 0, sumTilg = 0;
  let rsAnfang = anfangsFK;
  let done = false;

  for (let phi = 0; phi < phaseListe.length && !done; phi++) {
    const ph = phaseListe[phi];
    // Restschuld-Override bei Anschlussfinanzierung (manuell gesetzte Restschuld)
    if (ph.override !== null) rs = ph.override;

    for (let absM = ph.s; absM < ph.e && rs > 0; absM++) {
      if (absM > absEnd) { done = true; break; }
      const iz = rs * ph.mz;
      const tg = Math.max(0, Math.min(ph.rate - iz, rs));
      // Restschuld am Anfang des Zielzeitraums merken (vor Tilgung dieses Monats)
      if (absM === effStart) rsAnfang = rs;
      if (absM >= effStart && absM <= absEnd) { sumZins += iz; sumTilg += tg; }
      rs = Math.max(0, rs - tg);
    }
  }

  return { zinsen: Math.round(sumZins), tilgung: Math.round(sumTilg), restschuldAnfang: Math.round(rsAnfang), restschuldEnde: Math.round(rs) };
};

// ─── Vermögenswerte-Helper ───────────────────────────────────────────────────
// Berechnet Restschuld, Jahres-Tilgung und freies Vermögen für Kauf- und MFH-Immobilien
export const berechneImmoVermoegenswerte = (immo) => {
  immo = normalisiereImmobilie(immo); // Text/leer → Zahl/null (utils/zahlen.js)
  if (immo.immobilienTyp === 'mietimmobilie') return null;
  const marktwertGeschenkt = getAktuellerGesamtwert(immo);
  // Ob ein Kredit zählt, entscheidet allein das Darlehen — nicht die Erwerbsart (B12/B7)
  if (!immo.kreditLaeuftBereits && anfangsFremdkapital(immo) <= 0) {
    return { fremdkapital: 0, restschuld: 0, tilgungJahr: 0, freiVermoegen: marktwertGeschenkt, marktwert: marktwertGeschenkt };
  }
  const fremdkapital = anfangsFremdkapital(immo);
  const marktwert = getAktuellerGesamtwert(immo);

  if (immo.kreditLaeuftBereits && immo.aktuelleRestschuld != null) {
    const rs = immo.aktuelleRestschuld || 0;
    const rate = immo.kreditMonatsrate || 0;
    const mzins = (immo.zinssatz || 3.5) / 100 / 12;
    const monatlicheZinsen = rs * mzins;
    const tilgungMtl = Math.max(0, rate - monatlicheZinsen);
    return {
      fremdkapital: rs,
      restschuld: rs,
      tilgungJahr: Math.round(tilgungMtl * 12),
      freiVermoegen: Math.max(0, marktwert - rs),
      marktwert,
    };
  }

  if (fremdkapital <= 0) return { fremdkapital: 0, restschuld: 0, tilgungJahr: 0, freiVermoegen: marktwert, marktwert };

  const simuliere = (startKredit, mzins, rate, monate) => {
    let rs = startKredit;
    for (let m = 0; m < monate && rs > 0; m++) rs = Math.max(0, rs - Math.max(0, rate - rs * mzins));
    return rs;
  };

  const phasen = immo.finanzierungsphasen;
  const jetzt = new Date();
  const aktuellesJahr = jetzt.getFullYear();

  // Phase F: datumsgenauer Verlauf inkl. Sondertilgungen und "abbezahlt"
  const verlauf = (phasen && phasen.length > 0) ? darlehensVerlauf(immo, jetzt) : null;
  if (verlauf) {
    const rsHeute = verlauf.restschuldHeute;
    return { fremdkapital, restschuld: rsHeute, tilgungJahr: Math.round(verlauf.tilgungImJahr(aktuellesJahr)), freiVermoegen: Math.max(0, marktwert - rsHeute), marktwert };
  }

  if (phasen && phasen.length > 0 && immo.kaufdatum) {
    const kreditStartDatum = new Date(phasen[0]?.kreditStartDatum || immo.kaufdatum);
    let jahrOffset = 0;
    let aktuelleRestschuld = fremdkapital;

    for (let i = 0; i < phasen.length; i++) {
      const phase = phasen[i];
      const phasenzins = phase.sollzinssatz ?? phase.zinssatz ?? (immo.zinssatz ?? 4.0);
      const startK = (i > 0 && phase.restschuldOverride != null) ? phase.restschuldOverride : aktuelleRestschuld;
      const laufzeit = phase.darlehensTyp === 'endfaellig' ? (phase.laufzeit || 10) : (phase.zinsbindung || 10);
      const mzins = phasenzins / 100 / 12;
      const pAT = phase.anfangstilgung || (phase.darlehensTyp === 'endfaellig' ? 0 : 2.0);
      const rate = (phase.monatlicherBetrag > 0) ? phase.monatlicherBetrag : (startK > 0 ? startK * (mzins + pAT / 100 / 12) : 0);

      const phaseStartJahr = kreditStartDatum.getFullYear() + jahrOffset;
      const phaseEndJahr = phaseStartJahr + laufzeit;
      const isLast = i === phasen.length - 1;

      if (aktuellesJahr < phaseEndJahr || isLast) {
        const phaseStartDatum = new Date(kreditStartDatum);
        phaseStartDatum.setFullYear(phaseStartJahr);
        const monateGesamt = Math.max(0, (jetzt.getFullYear() - phaseStartDatum.getFullYear()) * 12 + jetzt.getMonth() - phaseStartDatum.getMonth());
        const restschuld = simuliere(startK, mzins, rate, monateGesamt);
        const monateJan1 = Math.max(0, (aktuellesJahr - phaseStartDatum.getFullYear()) * 12 - phaseStartDatum.getMonth());
        const rsJan1 = simuliere(startK, mzins, rate, monateJan1);
        const rsJan1Next = simuliere(rsJan1, mzins, rate, 12);
        return { fremdkapital, restschuld, tilgungJahr: Math.max(0, rsJan1 - rsJan1Next), freiVermoegen: Math.max(0, marktwert - restschuld), marktwert };
      }
      aktuelleRestschuld = simuliere(startK, mzins, rate, laufzeit * 12);
      jahrOffset += laufzeit;
    }
  }

  // Fallback ohne Phasen
  if (!immo.kaufdatum) return { fremdkapital, restschuld: fremdkapital, tilgungJahr: 0, freiVermoegen: Math.max(0, marktwert - fremdkapital), marktwert };
  const mzins = (immo.zinssatz ?? 4.0) / 100 / 12;
  const rate = fremdkapital * (mzins + (immo.tilgung ?? 2.0) / 100 / 12);
  const kaufDatum = new Date(immo.kaufdatum);
  const monateGesamt = Math.max(0, (jetzt.getFullYear() - kaufDatum.getFullYear()) * 12 + jetzt.getMonth() - kaufDatum.getMonth());
  const restschuld = simuliere(fremdkapital, mzins, rate, monateGesamt);
  const monateJan1 = Math.max(0, (aktuellesJahr - kaufDatum.getFullYear()) * 12 - kaufDatum.getMonth());
  const rsJan1 = simuliere(fremdkapital, mzins, rate, monateJan1);
  const rsJan1Next = simuliere(rsJan1, mzins, rate, 12);
  return { fremdkapital, restschuld, tilgungJahr: Math.max(0, rsJan1 - rsJan1Next), freiVermoegen: Math.max(0, marktwert - restschuld), marktwert };
};
