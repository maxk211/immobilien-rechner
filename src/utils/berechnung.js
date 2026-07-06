import { getPreisNachPLZ } from '../constants/plz.js';
import { getAktuelleMiete, getAktuelleUntermiete, getAktuelleWarmmiete } from './miete.js';

// Immobilienwert schätzen
export const schaetzeImmobilienwert = (immobilie) => {
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

  const geschaetzterWert = Math.round(preisProQm * (immobilie.wohnflaeche || 80));

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

// Wertsteigerung seit Kauf berechnen
export const berechneWertsteigerungSeitKauf = (immobilie, aktuellerWert) => {
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
  const finanzierungsbetrag = immobilie.finanzierungsbetrag;

  // Fremdkapital berechnen
  const kaufnebenkostenAbsolut = immobilie.kaufpreis * (kaufnebenkosten / 100);
  const gesamtinvestition = immobilie.kaufpreis + kaufnebenkostenAbsolut;

  // Eigenkapital aus neuer Aufteilung oder legacy
  const gesamtEK = (immobilie.ekFuerNebenkosten !== undefined && immobilie.ekFuerKaufpreis !== undefined)
    ? (immobilie.ekFuerNebenkosten || 0) + (immobilie.ekFuerKaufpreis || 0)
    : (immobilie.eigenkapital ?? immobilie.kaufpreis * 0.2);

  // Finanzierungsbetrag: Entweder manuell eingegeben oder berechnet
  const anfangsFremdkapital = finanzierungsbetrag !== null && finanzierungsbetrag !== undefined
    ? finanzierungsbetrag
    : Math.max(0, gesamtinvestition - gesamtEK);

  if (anfangsFremdkapital <= 0) return { restschuld: 0, anfangsFremdkapital: 0, getilgt: 0 };

  // Monatliche Annuität: feste Rate aus erster Phase oder berechnet
  const monatszins = zinssatz / 100 / 12;
  const laufzeit = immobilie.laufzeit ?? 25;
  const erstePhase = (immobilie.finanzierungsphasen || [])[0];
  const annuitaet = (erstePhase?.finanzierungsModus === 'festRate' && erstePhase?.monatlicherBetrag > 0)
    ? erstePhase.monatlicherBetrag
    : (monatszins > 0 ? anfangsFremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) / (Math.pow(1 + monatszins, laufzeit * 12) - 1) : 0);

  // Restschuld iterativ berechnen
  let restschuld = anfangsFremdkapital;
  for (let monat = 0; monat < monateSeitKauf && restschuld > 0; monat++) {
    const monatsZinsen = restschuld * monatszins;
    const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
    restschuld = Math.max(0, restschuld - monatsTilgung);
  }

  return {
    restschuld: Math.round(restschuld),
    anfangsFremdkapital: Math.round(anfangsFremdkapital),
    getilgt: Math.round(anfangsFremdkapital - restschuld)
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
  if (immo.geschenkt || immo.vollEigenfinanziert || !immo.kaufpreis) return 0;

  const kaufjahr = immo.kaufdatum ? new Date(immo.kaufdatum).getFullYear() : null;
  if (!kaufjahr || targetJahr < kaufjahr) return 0;

  // Fremdkapital
  const kNkProzent = immo.kaufnebenkosten ?? 10;
  const gesamtEK = (immo.ekFuerNebenkosten != null && immo.ekFuerKaufpreis != null)
    ? (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0)
    : (immo.eigenkapital ?? immo.kaufpreis * 0.2);
  const fk = immo.finanzierungsbetrag != null
    ? immo.finanzierungsbetrag
    : Math.max(0, immo.kaufpreis * (1 + kNkProzent / 100) - gesamtEK);

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

// Rendite-Berechnung
export const berechneRendite = (params) => {
  const {
    kaufpreis, zinssatz, tilgung, laufzeit,
    kaltmiete, nebenkosten, instandhaltung, verwaltung,
    hausgeld = 0, strom = 0, internet = 0,
    wertsteigerung, mietsteigerung, kaufnebenkosten,
    finanzierungsbetrag, kaufdatum,
    ekFuerNebenkosten, ekFuerKaufpreis, eigenkapital,
    vermietungsmodell = 'kaltmiete',
    nebenkostenVomMieter = 0
  } = params;

  // Kaufjahr für Chart-Darstellung
  const kaufjahr = kaufdatum ? new Date(kaufdatum).getFullYear() : new Date().getFullYear();

  const kaufnebenkostenAbsolut = kaufpreis * (kaufnebenkosten / 100);
  const gesamtinvestition = kaufpreis + kaufnebenkostenAbsolut;

  // Eigenkapital berechnen aus neuer Aufteilung (falls vorhanden) oder legacy
  const gesamtEK = (ekFuerNebenkosten !== undefined && ekFuerKaufpreis !== undefined)
    ? (ekFuerNebenkosten || 0) + (ekFuerKaufpreis || 0)
    : (eigenkapital || 0);

  // Finanzierungsbetrag: Entweder manuell eingegeben oder berechnet
  const fremdkapital = finanzierungsbetrag !== null && finanzierungsbetrag !== undefined
    ? finanzierungsbetrag
    : Math.max(0, gesamtinvestition - gesamtEK);

  // Einnahmen basierend auf Vermietungsmodell:
  // - kaltmiete: Nur Kaltmiete (NK werden via Abrechnung umgelegt, kein direkter Cashflow)
  // - kaltmiete_nk: Kaltmiete + NK-Vorauszahlung vom Mieter
  // - warmmiete: Warmmiete (alles inkl., Vermieter zahlt alle Betriebskosten)
  const jahresmieteKalt = kaltmiete * 12;
  const jahresNKVomMieter = vermietungsmodell === 'kaltmiete_nk' ? (nebenkostenVomMieter || 0) * 12 : 0;

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
  const jahresNebenkosten = (params.nebenkosten || 0) * 12;
  const jahresVermieterKosten = jahresinstandhaltung + jahresverwaltung + jahresHausgeld + jahresStrom + jahresInternet + jahresNebenkosten;
  const nettoEinnahmen = jahresEinnahmen - jahresVermieterKosten;
  const nettorendite = kaufpreis > 0 ? (nettoEinnahmen / kaufpreis) * 100 : 0;

  // Aktive Finanzierungsphase bestimmen (basierend auf Kreditstartdatum + heute)
  // Wenn finanzierungsphasen vorhanden: nimm die aktuell laufende Phase
  const aktivePhaseDaten = (() => {
    const phasen = params.finanzierungsphasen;
    if (!phasen || phasen.length === 0) return null;
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
  const cashOnCash = gesamtEK > 0 ? (cashflowVorSteuern / gesamtEK) * 100 : 0;

  const eigenkapitalRendite = gesamtEK > 0 ? ((nettoEinnahmen + (kaufpreis * wertsteigerung / 100)) / gesamtEK) * 100 : 0;

  const leverageEffekt = eigenkapitalRendite - nettorendite;

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

  for (let i = 0; i <= laufzeit; i++) {
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
      cashflow: Math.round((aktuelleMiete * 12) + jahresNKVomMieter - jahresinstandhaltung - jahresverwaltung - jahresHausgeld - jahresStrom - jahresInternet - jahresrate)
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

/**
 * berechneMtlCashflow — EINHEITLICHE Cashflow-Berechnung für alle Immobilientypen.
 * Gibt den aktuellen monatlichen Netto-Cashflow zurück.
 * Wird genutzt in: ImmobilienKarte, PortfolioOverview, Selbstauskunft-PDF.
 * (CashflowUebersicht hat eigene monatsDaten-Logik mit Jahres-Overrides + Zinsen/Tilgung-Detail.)
 */
export const berechneMtlCashflow = (immo) => {
  const typ = immo.immobilienTyp;

  // ── Mietimmobilie (Arbitrage-Modell) ──────────────────────────────
  if (typ === 'mietimmobilie') {
    const vertragsEnde = immo.mietvertragEnde ? new Date(immo.mietvertragEnde) : null;
    if (vertragsEnde && vertragsEnde < new Date()) return 0;
    const einnahmen = (immo.anzahlZimmerVermietet || 0) * getAktuelleUntermiete(immo);
    const ausgaben = getAktuelleWarmmiete(immo)
      + (immo.arbitrageStrom || 0)
      + (immo.arbitrageInternet || 0)
      + (immo.arbitrageGEZ ?? 18.36);
    return einnahmen - ausgaben;
  }

  // ── MFH / Kaufimmobilie ────────────────────────────────────────────
  // Gesamtmiete: bei MFH Summe aller Wohnungen, sonst mietAnpassungen-aware
  const gesamtMiete = typ === 'mehrfamilienhaus'
    ? (immo.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0)
    : getAktuelleMiete(immo);

  // Phase-aware Kreditrate via berechneRendite — berücksichtigt finanzierungsphasen korrekt
  const ergebnis = berechneRendite({ ...immo, kaltmiete: gesamtMiete });

  // NK-Vorauszahlung vom Mieter (nur bei kaltmiete_nk Modell, nicht bei MFH)
  const nkVomMieter = (typ !== 'mehrfamilienhaus' && (immo.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk')
    ? (immo.nebenkostenVomMieter || 0)
    : 0;

  // Laufende Betriebskosten des Vermieters
  const betriebskosten = (immo.instandhaltung || 0)
    + (immo.verwaltung || 0)
    + (immo.hausgeld || 0)
    + (immo.strom || 0)
    + (immo.internet || 0)
    + (immo.nebenkosten || 0);

  // Bauspar-Sparraten aller noch aktiven Verträge (vor Zuteilungsreife)
  const bauspar = (immo.bausparvertraege || [])
    .filter(b => !b.zuteilungsreifAb || new Date(b.zuteilungsreifAb) > new Date())
    .reduce((s, b) => s + (parseFloat(b.monatlicheSparrate) || 0), 0);

  // Stellplatz-Mieteinnahmen
  const spMtl = (immo.stellplatz?.vorhanden && immo.stellplatz?.istVermietet)
    ? (immo.stellplatz.monatlicheMiete || 0) * (immo.stellplatz.anzahl || 1)
    : 0;

  return gesamtMiete + nkVomMieter + spMtl - ergebnis.monatlicheRate - betriebskosten - bauspar;
};

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
  const phasen = params.finanzierungsphasen || [];
  const kreditStartStr = phasen[0]?.kreditStartDatum || params.kaufdatum;
  if (!kreditStartStr || !params.kaufpreis) return null;

  const kreditStart = new Date(kreditStartStr);
  const ksJahr = kreditStart.getFullYear();
  const ksMonat = kreditStart.getMonth(); // 0-indexed

  // Anfangs-Fremdkapital (identische Logik wie berechneRendite)
  const kNKAbs = (params.kaufpreis || 0) * ((params.kaufnebenkosten ?? 10) / 100);
  const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
    ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
    : (params.eigenkapital || 0);
  const anfangsFK = (params.finanzierungsbetrag !== null && params.finanzierungsbetrag !== undefined)
    ? params.finanzierungsbetrag
    : Math.max(0, (params.kaufpreis || 0) + kNKAbs - gesamtEK);

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
// Berechnet Restschuld, Jahres-Tilgung und freies Vermögen für eine Kaufimmobilie
export const berechneImmoVermoegenswerte = (immo) => {
  if (immo.immobilienTyp !== 'kaufimmobilie') return null;
  const kaufnebenkosten = immo.kaufnebenkosten ?? 10;
  const kaufnebenkostenAbsolut = (immo.kaufpreis || 0) * (kaufnebenkosten / 100);
  const gesamtEK = (immo.ekFuerNebenkosten !== undefined && immo.ekFuerKaufpreis !== undefined)
    ? (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0)
    : (immo.eigenkapital ?? (immo.kaufpreis || 0) * 0.2);
  const fremdkapital = immo.finanzierungsbetrag ?? Math.max(0, (immo.kaufpreis || 0) + kaufnebenkostenAbsolut - gesamtEK);
  const marktwert = immo.geschaetzterWert || immo.kaufpreis || 0;

  if (fremdkapital <= 0) return { fremdkapital: 0, restschuld: 0, tilgungJahr: 0, freiVermoegen: marktwert, marktwert };

  const simuliere = (startKredit, mzins, rate, monate) => {
    let rs = startKredit;
    for (let m = 0; m < monate && rs > 0; m++) rs = Math.max(0, rs - Math.max(0, rate - rs * mzins));
    return rs;
  };

  const phasen = immo.finanzierungsphasen;
  const jetzt = new Date();
  const aktuellesJahr = jetzt.getFullYear();

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
