import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { normalisiereImmobilie, zahlAusText } from './utils/zahlen.js';

// Supabase Konfiguration
// Diese Werte findest du in deinem Supabase Dashboard:
// Project Settings -> API -> Project URL & anon/public key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'DEINE_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'DEIN_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper Funktionen für Immobilien

// Alle Immobilien des eingeloggten Users laden
export async function loadImmobilien() {
  const { data, error } = await supabase
    .from('immobilien')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden:', error);
    throw error;
  }

  // Konvertiere DB-Format zu App-Format
  return data.map(dbToApp);
}

// Gegencheck 2: diese Felder wurden bisher nie in die Datenbank geschrieben und
// gingen nach dem Speichern verloren. Sie liegen jetzt in immobilien.zusatzdaten.
const ZUSATZ_KEYS = [
  'nkAbrechnungen', 'kautionen', 'mieteFaelligkeitstag', 'geschaetzterWertDatum',
  'etage', 'energieausweisGueltigBis', 'heizungsart',
  'hausverwaltungName', 'hausverwaltungAnsprechpartner', 'hausverwaltungKontakt',
  'miteigentumsanteil', 'naechsteEigentuemerversammlung', 'mietModus',
  // Phase E: Kostenstruktur
  'hausgeldNichtUmlagefaehig', 'kontofuehrung', 'weitereKostenAktiv', 'weitereKostenChips', 'keller',
  // Phase G: Plausibilitätsprüfung — Bestätigungen mit Zeitstempel und Feldherkunft
  'plausiBestaetigt', 'feldHerkunft',
  // Phase I: Anlage-Wizard
  'ort', 'erwerbsart', 'mietstatus',
  'arbitrageSonstige', // weitere laufende Kosten bei Arbitrage
  'kappungsgrenze', // 20 oder 15 % (angespannter Wohnungsmarkt) — Was-wäre-wenn bei der Mieterhöhung
  'nachforderungen', // Nachforderung mit Ratenplan (z. B. Strom-Nachzahlung, von Mietern in Raten zurückgezahlt)
  // Wer zahlt welche Kosten (mit Datum) + neue Positionen
  'kostenZahler', 'heizung', 'rundfunk', 'arbitrageHeizung',
];

// Immobilie speichern (neu oder update)
export async function saveImmobilie(immobilie) {
  const dbData = appToDb(immobilie);

  const doSave = async (data) => {
    if (immobilie.id && typeof immobilie.id === 'string' && immobilie.id.includes('-')) {
      // Update existierende Immobilie (UUID)
      const { data: result, error } = await supabase
        .from('immobilien')
        .update(data)
        .eq('id', immobilie.id)
        .select()
        .single();
      if (error) throw error;
      return dbToApp(result);
    } else {
      // Neue Immobilie erstellen
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt');
      const { data: result, error } = await supabase
        .from('immobilien')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return dbToApp(result);
    }
  };

  // Fehlt eine Spalte in der Datenbank (Migration nicht eingespielt), wird NUR diese
  // eine Spalte weggelassen und erneut gespeichert — alle anderen Daten bleiben drin.
  // Früher fielen dabei ganze Feldgruppen weg (Zusatzdaten, Wohnungen, Dokumente …),
  // ohne dass es jemand merkte. Jetzt gibt es zusätzlich einen sichtbaren Hinweis.
  let daten = { ...dbData };
  const weggelassen = [];
  for (let versuch = 0; versuch < 12; versuch++) {
    try {
      const ergebnis = await doSave(daten);
      if (weggelassen.length) fehlendeSpaltenMelden(weggelassen);
      return ergebnis;
    } catch (error) {
      const spalte = fehlendeSpalte(error);
      if (!spalte || !(spalte in daten)) throw error;
      delete daten[spalte];
      weggelassen.push(spalte);
    }
  }
  throw new Error('Speichern fehlgeschlagen: zu viele fehlende Datenbankspalten (' + weggelassen.join(', ') + ')');
}

// Spaltennamen aus Postgres-/PostgREST-Fehlermeldungen lesen
export function fehlendeSpalte(error) {
  const m = String(error?.message || '');
  const a = m.match(/Could not find the '([a-z0-9_]+)' column/i);
  if (a) return a[1];
  const b = m.match(/column "([a-z0-9_]+)"(?: of relation "[a-z0-9_]+")? does not exist/i);
  if (b) return b[1];
  return null;
}

const schonGemeldet = new Set();
function fehlendeSpaltenMelden(spalten) {
  const neu = spalten.filter(s => !schonGemeldet.has(s));
  if (!neu.length) return;
  neu.forEach(s => schonGemeldet.add(s));
  console.warn('Datenbank-Spalten fehlen (Migration ausführen):', neu.join(', '));
  try {
    toast('Gespeichert — ein Teil der Angaben (' + neu.join(', ') + ') kann erst nach einem Datenbank-Update gespeichert werden.', { icon: '⚠️', duration: 8000, id: 'spalten-fehlen' });
  } catch { /* ohne Toaster (z. B. Tests) */ }
}

// Immobilie löschen
export async function deleteImmobilie(id) {
  const { error } = await supabase
    .from('immobilien')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Konvertierung: Datenbank -> App Format
function dbToApp(db) {
  return normalisiereImmobilie(dbToAppRoh(db));
}

function dbToAppRoh(db) {
  return {
    id: db.id,
    name: db.name,
    plz: db.plz,
    adresse: db.adresse,
    immobilienTyp: db.immobilien_typ,
    objektart: db.objektart,
    zustand: db.zustand,
    wohnflaeche: Number(db.wohnflaeche) || 0,
    grundstueck: Number(db.grundstueck) || 0,
    zimmer: Number(db.zimmer) || 0,
    baujahr: db.baujahr,
    stockwerk: db.stockwerk,
    energieeffizienz: db.energieeffizienz,
    balkon: db.balkon,
    garage: db.garage,
    keller: db.keller,
    kaufpreis: Number(db.kaufpreis) || 0,
    kaufdatum: db.kaufdatum,
    eigenkapital: Number(db.eigenkapital) || 0,
    ekFuerNebenkosten: db.ek_fuer_nebenkosten != null ? Number(db.ek_fuer_nebenkosten) : undefined,
    ekFuerKaufpreis: db.ek_fuer_kaufpreis != null ? Number(db.ek_fuer_kaufpreis) : undefined,
    kaltmiete: Number(db.kaltmiete) || 0,
    geschaetzterWert: Number(db.geschaetzter_wert) || 0,
    // Bug-Fix: != null statt || bei allen Feldern, wo 0 ein gültiger, bewusst
    // gesetzter Wert sein kann (z.B. 0 % Tilgung in der Tilgungsfreistellung,
    // 0 % Wertsteigerungs-Annahme) — || hätte 0 fälschlich zum Default zurückgesetzt.
    zinssatz: db.zinssatz != null ? Number(db.zinssatz) : 4.0,
    tilgung: db.tilgung != null ? Number(db.tilgung) : 2.0,
    laufzeit: db.laufzeit || 25,
    finanzierungsbetrag: db.finanzierungsbetrag ? Number(db.finanzierungsbetrag) : null,
    kaufnebenkosten: db.kaufnebenkosten != null ? Number(db.kaufnebenkosten) : 10,
    kaufnebenkostenModus: db.kaufnebenkosten_modus,
    bundesland: db.bundesland,
    nebenkosten: Number(db.nebenkosten) || 0,
    instandhaltung: Number(db.instandhaltung) || 0,
    verwaltung: Number(db.verwaltung) || 0,
    hausgeld: Number(db.hausgeld) || 0,
    strom: Number(db.strom) || 0,
    internet: Number(db.internet) || 0,
    vermietungsmodell: db.vermietungsmodell || 'kaltmiete',
    nebenkostenVomMieter: Number(db.nebenkosten_vom_mieter) || 0,
    wertsteigerung: db.wertsteigerung != null ? Number(db.wertsteigerung) : 2.0,
    mietsteigerung: db.mietsteigerung != null ? Number(db.mietsteigerung) : 1.5,
    steuersatz: db.steuersatz != null ? Number(db.steuersatz) : 42,
    gebaeudeAnteilProzent: db.gebaeude_anteil_prozent != null ? Number(db.gebaeude_anteil_prozent) : 80,
    afaSatz: db.afa_satz != null ? Number(db.afa_satz) : 2.0,
    afaAnpassungen: db.afa_anpassungen || [],
    afaModus: db.afa_modus || 'linear',
    afaDegressivWechseljahr: db.afa_degressiv_wechseljahr || null,
    grundsteuerMonat: Number(db.grundsteuer_monat) || 0,
    versicherungMonat: Number(db.versicherung_monat) || 0,
    fahrtkostenModus: db.fahrtkosten_modus,
    fahrtenProMonat: db.fahrten_pro_monat || 0,
    entfernungKm: Number(db.entfernung_km) || 0,
    kmPauschale: db.km_pauschale != null ? Number(db.km_pauschale) : 0.30,
    eigeneWarmmiete: Number(db.eigene_warmmiete) || 0,
    anzahlZimmerVermietet: db.anzahl_zimmer_vermietet || 0,
    untermieteProZimmer: Number(db.untermiete_pro_zimmer) || 0,
    arbitrageStrom: Number(db.arbitrage_strom) || 0,
    arbitrageInternet: Number(db.arbitrage_internet) || 0,
    arbitrageGEZ: db.arbitrage_gez != null ? Number(db.arbitrage_gez) : 18.36, // Bug-Fix: 0 ist ein gültiger Wert ("kein GEZ"), || hätte ihn fälschlich auf 18.36 zurückgesetzt
    mietvertragStart: db.mietvertrag_start,
    finanzierungsphasen: db.finanzierungsphasen || [],
    mietHistorie: db.miet_historie || {},
    mietEingaenge: db.miet_eingaenge || [],
    fahrtenListe: db.fahrten_liste || [],
    investitionen: db.investitionen || [],
    kaufnebenkostenPositionen: db.kaufnebenkosten_positionen,
    aktiv: db.aktiv !== false,
    aufgabedatum: db.aufgabedatum || '',
    mietAnpassungen: db.miet_anpassungen || [],
    mietvertragEnde: db.mietvertrag_ende || '',
    dauerauftrag: db.dauerauftrag || false,
    dauerauftragBetrag: Number(db.dauerauftrag_betrag) || 0,
    zaehler: db.zaehler || [],
    bausparvertraege: db.bausparvertraege || [],
    stellplatz: db.stellplatz || null,
    eigentumsform: db.eigentumsform || 'allein',
    userAnteil: db.user_anteil ?? 100,
    gbrPartner: db.gbr_partner || [],
    dokumente: db.dokumente || [],
    wohnungen: db.wohnungen || [],
    vollEigenfinanziert: db.voll_eigenfinanziert || false,
    geschenkt: db.geschenkt || false,
    kreditLaeuftBereits: db.kredit_laeuft_bereits || false,
    aktuelleRestschuld: db.aktuelle_restschuld || 0,
    kreditMonatsrate: db.kredit_monatsrate || 0,
    zinsbindungBis: db.zinsbindung_bis || null,
    // Migration 012: Zusatzdaten (nur bekannte Schlüssel übernehmen)
    ...Object.fromEntries(
      Object.entries(db.zusatzdaten || {}).filter(([k]) => ZUSATZ_KEYS.includes(k))
    ),
  };
}

// Zahl- und Datumsspalten der Tabelle immobilien. Leere Eingabefelder liefern ""
// — Postgres lehnt das für NUMERIC/INTEGER/DATE ab ("invalid input syntax for
// type numeric"). Vor dem Speichern deshalb "" → null und Text → Zahl.
const ZAHL_SPALTEN = new Set(['wohnflaeche', 'grundstueck', 'zimmer', 'kaufpreis', 'eigenkapital', 'ek_fuer_nebenkosten',
  'ek_fuer_kaufpreis', 'kaltmiete', 'geschaetzter_wert', 'zinssatz', 'tilgung', 'finanzierungsbetrag', 'kaufnebenkosten',
  'nebenkosten', 'instandhaltung', 'verwaltung', 'hausgeld', 'strom', 'internet', 'nebenkosten_vom_mieter', 'wertsteigerung',
  'mietsteigerung', 'steuersatz', 'gebaeude_anteil_prozent', 'afa_satz', 'grundsteuer_monat', 'versicherung_monat',
  'entfernung_km', 'km_pauschale', 'eigene_warmmiete', 'untermiete_pro_zimmer', 'arbitrage_strom', 'arbitrage_internet',
  'arbitrage_gez', 'dauerauftrag_betrag', 'user_anteil', 'aktuelle_restschuld', 'kredit_monatsrate']);
const GANZZAHL_SPALTEN = new Set(['baujahr', 'stockwerk', 'laufzeit', 'fahrten_pro_monat', 'anzahl_zimmer_vermietet',
  'afa_degressiv_wechseljahr', 'zinsbindung_bis']);
const DATUM_SPALTEN = new Set(['kaufdatum', 'aufgabedatum', 'mietvertrag_start', 'mietvertrag_ende']);

export function zahlenBereinigen(row) {
  const out = { ...row };
  for (const [k, v] of Object.entries(out)) {
    const zahl = ZAHL_SPALTEN.has(k), ganz = GANZZAHL_SPALTEN.has(k);
    if (zahl || ganz) {
      if (v === '' || v === null || v === undefined) { out[k] = v === undefined ? undefined : null; continue; }
      if (typeof v === 'number') { out[k] = Number.isFinite(v) ? (ganz ? Math.round(v) : v) : null; continue; }
      const t = String(v).trim();
      if (t === '') { out[k] = null; continue; }
      const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t); // "1.234,5" oder "1234.5"
      out[k] = Number.isFinite(n) ? (ganz ? Math.round(n) : n) : null;
    } else if (DATUM_SPALTEN.has(k) && v === '') {
      out[k] = null;
    }
  }
  return out;
}

// Konvertierung: App -> Datenbank Format
function appToDb(app) {
  return zahlenBereinigen(appToDbRoh(app));
}

function appToDbRoh(app) {
  return {
    name: app.name,
    plz: app.plz,
    adresse: app.adresse,
    immobilien_typ: app.immobilienTyp || 'kaufimmobilie',
    objektart: app.objektart,
    zustand: app.zustand,
    wohnflaeche: app.wohnflaeche,
    grundstueck: app.grundstueck,
    zimmer: app.zimmer,
    baujahr: app.baujahr,
    stockwerk: app.stockwerk,
    energieeffizienz: app.energieeffizienz,
    balkon: app.balkon,
    garage: app.garage,
    keller: app.keller,
    kaufpreis: app.kaufpreis,
    kaufdatum: app.kaufdatum || null,
    eigenkapital: app.eigenkapital,
    ek_fuer_nebenkosten: app.ekFuerNebenkosten,
    ek_fuer_kaufpreis: app.ekFuerKaufpreis,
    kaltmiete: app.kaltmiete,
    geschaetzter_wert: app.geschaetzterWert,
    zinssatz: app.zinssatz,
    tilgung: app.tilgung,
    laufzeit: app.laufzeit,
    finanzierungsbetrag: app.finanzierungsbetrag,
    kaufnebenkosten: app.kaufnebenkosten,
    kaufnebenkosten_modus: app.kaufnebenkostenModus,
    bundesland: app.bundesland,
    nebenkosten: app.nebenkosten,
    instandhaltung: app.instandhaltung,
    verwaltung: app.verwaltung,
    hausgeld: app.hausgeld,
    strom: app.strom,
    internet: app.internet,
    vermietungsmodell: app.vermietungsmodell || 'kaltmiete',
    nebenkosten_vom_mieter: app.nebenkostenVomMieter || 0,
    wertsteigerung: app.wertsteigerung,
    mietsteigerung: app.mietsteigerung,
    steuersatz: app.steuersatz,
    gebaeude_anteil_prozent: app.gebaeudeAnteilProzent,
    afa_satz: app.afaSatz,
    afa_anpassungen: app.afaAnpassungen || [],
    afa_modus: app.afaModus || 'linear',
    afa_degressiv_wechseljahr: app.afaDegressivWechseljahr || null,
    grundsteuer_monat: app.grundsteuerMonat || 0,
    versicherung_monat: app.versicherungMonat || 0,
    fahrtkosten_modus: app.fahrtkostenModus,
    fahrten_pro_monat: app.fahrtenProMonat,
    entfernung_km: app.entfernungKm,
    km_pauschale: app.kmPauschale,
    eigene_warmmiete: app.eigeneWarmmiete,
    anzahl_zimmer_vermietet: app.anzahlZimmerVermietet,
    untermiete_pro_zimmer: app.untermieteProZimmer,
    arbitrage_strom: app.arbitrageStrom,
    arbitrage_internet: app.arbitrageInternet,
    arbitrage_gez: app.arbitrageGEZ,
    mietvertrag_start: app.mietvertragStart || null,
    finanzierungsphasen: app.finanzierungsphasen,
    miet_historie: app.mietHistorie,
    miet_eingaenge: app.mietEingaenge,
    fahrten_liste: app.fahrtenListe,
    investitionen: app.investitionen,
    kaufnebenkosten_positionen: app.kaufnebenkostenPositionen,
    aktiv: app.aktiv !== false,
    aufgabedatum: app.aufgabedatum || null,
    miet_anpassungen: app.mietAnpassungen || [],
    mietvertrag_ende: app.mietvertragEnde || null,
    dauerauftrag: app.dauerauftrag || false,
    dauerauftrag_betrag: app.dauerauftragBetrag || null,
    zaehler: app.zaehler || [],
    bausparvertraege: app.bausparvertraege || [],
    stellplatz: app.stellplatz || null,
    eigentumsform: app.eigentumsform || 'allein',
    user_anteil: app.userAnteil ?? 100,
    gbr_partner: app.gbrPartner || [],
    dokumente: app.dokumente || [],
    wohnungen: app.wohnungen || [],
    voll_eigenfinanziert: app.vollEigenfinanziert || false,
    geschenkt: app.geschenkt || false,
    kredit_laeuft_bereits: app.kreditLaeuftBereits || false,
    aktuelle_restschuld: app.aktuelleRestschuld || 0,
    kredit_monatsrate: app.kreditMonatsrate || 0,
    zinsbindung_bis: app.zinsbindungBis || null,
    zusatzdaten: Object.fromEntries(
      ZUSATZ_KEYS.filter(k => app[k] !== undefined).map(k => [k, app[k]])
    ),
  };
}

// ==================== DOKUMENTE (Supabase Storage) ====================

const DOKUMENTE_BUCKET = 'immobilien-dokumente';

export async function uploadDokument(immobilieId, file, typ = 'Sonstiges', mieterMeta = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
  const subFolder = mieterMeta?.id ? `mieter-${mieterMeta.id}` : 'allgemein';
  const path = `${user.id}/${immobilieId}/${subFolder}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    path,
    typ,
    groesse: file.size,
    hochgeladenAm: new Date().toISOString(),
    mieterId: mieterMeta?.id || null,
    mieterName: mieterMeta?.name || null,
  };
}

export async function deleteDokument(path) {
  const { error } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .remove([path]);
  if (error) throw error;
}

export async function getDokumentUrl(path) {
  const { data } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .createSignedUrl(path, 3600); // 1 Stunde gültig
  return data?.signedUrl || null;
}

// ==================== MIETER ====================

export async function loadMieter() {
  const { data, error } = await supabase
    .from('mieter')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveMieter(mieter) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  // Aufrufer übergeben teils DB-Datensätze (snake_case, z. B. Mieterhöhung/Mietanpassung)
  // statt Formulardaten (camelCase). Fehlende camelCase-Felder aus snake_case übernehmen,
  // damit beim Update nichts (Objekt-Zuordnung, Kaution, NK-VZ …) verloren geht.
  const SNAKE = { immobilieId: 'immobilie_id', zimmerBezeichnung: 'zimmer_bezeichnung', nkVorauszahlung: 'nk_vorauszahlung', kautionBetrag: 'kaution_betrag', kautionBezahlt: 'kaution_bezahlt', kautionBezahltAm: 'kaution_bezahlt_am', kautionZurueck: 'kaution_zurueck', kautionZurueckAm: 'kaution_zurueck_am', kautionAbzug: 'kaution_abzug', kautionAbzugGrund: 'kaution_abzug_grund', zaehlerstandStrom: 'zaehlerstand_strom', zaehlerstandWasser: 'zaehlerstand_wasser', zaehlerstandHeizung: 'zaehlerstand_heizung', schlusselZurueck: 'schluessel_zurueck', zustandNotizen: 'zustand_notizen', letzteMahnungAm: 'letzte_mahnung_am', naechsteAnpassungDatum: 'naechste_anpassung_datum', mietanpassungenMieter: 'mietanpassungen_mieter', letzteMieterhoehung: 'letzte_mieterhoehung' };
  mieter = { ...mieter };
  Object.entries(SNAKE).forEach(([cm, db]) => { if (mieter[cm] === undefined && mieter[db] !== undefined) mieter[cm] = mieter[db]; });

  const dbData = {
    immobilie_id: mieter.immobilieId,
    name: mieter.name,
    email: mieter.email || null,
    telefon: mieter.telefon || null,
    zimmer_bezeichnung: mieter.zimmerBezeichnung || null,
    mietbeginn: mieter.mietbeginn || null,
    mietende: mieter.mietende || null,
    kaltmiete: zahlAusText(mieter.kaltmiete) ?? null,
    nk_vorauszahlung: zahlAusText(mieter.nkVorauszahlung) ?? null,
    gesamtueberweisung: zahlAusText(mieter.gesamtueberweisung) ?? null,
    kaution_betrag: zahlAusText(mieter.kautionBetrag) ?? null,
    kaution_bezahlt: mieter.kautionBezahlt || false,
    kaution_bezahlt_am: mieter.kautionBezahltAm || null,
    kaution_zurueck: mieter.kautionZurueck || false,
    kaution_zurueck_am: mieter.kautionZurueckAm || null,
    kaution_abzug: zahlAusText(mieter.kautionAbzug) ?? 0,
    kaution_abzug_grund: mieter.kautionAbzugGrund || null,
    auszugsdatum: mieter.auszugsdatum || null,
    zaehlerstand_strom: zahlAusText(mieter.zaehlerstandStrom) ?? null,
    zaehlerstand_wasser: zahlAusText(mieter.zaehlerstandWasser) ?? null,
    zaehlerstand_heizung: zahlAusText(mieter.zaehlerstandHeizung) ?? null,
    schluessel_zurueck: mieter.schlusselZurueck || false,
    zustand_notizen: mieter.zustandNotizen || null,
    mahnstufe: Math.round(zahlAusText(mieter.mahnstufe) ?? 0),
    letzte_mahnung_am: mieter.letzteMahnungAm || null,
    aktiv: mieter.aktiv !== false,
    notizen: mieter.notizen || null,
    vertragstyp: mieter.vertragstyp || 'unbefristet',
    kuendigungsfrist: mieter.kuendigungsfrist || null,
    naechste_anpassung_datum: mieter.naechsteAnpassungDatum || null,
    mietanpassungen_mieter: mieter.mietanpassungenMieter || [],
    letzte_mieterhoehung: mieter.letzteMieterhoehung || null,
  };

  const doMieterSave = async (data) => {
    if (mieter.id) {
      const { data: result, error } = await supabase.from('mieter').update(data).eq('id', mieter.id).select().single();
      if (error) throw error;
      return result;
    } else {
      const { data: result, error } = await supabase.from('mieter').insert({ ...data, user_id: user.id }).select().single();
      if (error) throw error;
      return result;
    }
  };

  let daten = { ...dbData };
  const weggelassen = [];
  for (let versuch = 0; versuch < 8; versuch++) {
    try {
      const ergebnis = await doMieterSave(daten);
      if (weggelassen.length) fehlendeSpaltenMelden(weggelassen);
      return ergebnis;
    } catch (error) {
      const spalte = fehlendeSpalte(error);
      if (!spalte || !(spalte in daten)) throw error;
      delete daten[spalte];
      weggelassen.push(spalte);
    }
  }
  throw new Error('Speichern fehlgeschlagen: fehlende Datenbankspalten (' + weggelassen.join(', ') + ')');
}

export async function deleteMieter(id) {
  const { error } = await supabase.from('mieter').delete().eq('id', id);
  if (error) throw error;
}

// ==================== NEBENKOSTENABRECHNUNGEN ====================

export async function loadNKAbrechnungen() {
  const { data, error } = await supabase
    .from('nebenkostenabrechnungen')
    .select('*')
    .order('abrechnungsjahr', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveNKAbrechnung(abrechnung) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  // Abrechnungsjahr ist Pflicht (NOT NULL) — leeres/ungültiges Jahr klar melden
  // statt eine Datenbank-Fehlermeldung zu zeigen.
  const jahr = Math.round(zahlAusText(abrechnung.abrechnungsjahr) ?? NaN);
  if (!Number.isFinite(jahr) || jahr < 1900 || jahr > 2200) {
    throw new Error('Bitte ein gültiges Abrechnungsjahr eintragen (z. B. ' + (new Date().getFullYear() - 1) + ').');
  }
  const dbData = {
    mieter_id: abrechnung.mieterId || null,
    immobilie_id: abrechnung.immobilieId || null,
    abrechnungsjahr: jahr,
    mieter_name: abrechnung.mieterName || '',
    immobilie_name: abrechnung.immobilieName || '',
    mieterflaeche: zahlAusText(abrechnung.mieterflaeche) ?? 0,
    gesamtflaeche: zahlAusText(abrechnung.gesamtflaeche) ?? 0,
    anzahl_parteien: Math.max(1, Math.round(zahlAusText(abrechnung.anzahlParteien) || 1)),
    kostenpositionen: abrechnung.kostenpositionen || [],
    vorauszahlungen_gesamt: zahlAusText(abrechnung.vorauszahlungenGesamt) ?? 0,
    status: abrechnung.status || 'entwurf',
    notizen: abrechnung.notizen || null,
  };

  if (abrechnung.id) {
    const { data, error } = await supabase
      .from('nebenkostenabrechnungen')
      .update(dbData)
      .eq('id', abrechnung.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('nebenkostenabrechnungen')
      .insert({ ...dbData, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteNKAbrechnung(id) {
  const { error } = await supabase.from('nebenkostenabrechnungen').delete().eq('id', id);
  if (error) throw error;
}

// ==================== KALKULATIONEN ====================

export async function loadKalkulationen() {
  const { data, error } = await supabase
    .from('kalkulationen')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id,
    name: d.name,
    savedAt: d.updated_at,
    ...(d.params || {}),
  }));
}

export async function saveKalkulation(kalk) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  const { id, name, savedAt, ...params } = kalk;
  const dbData = {
    name: name || 'Kalkulation',
    typ: params.typ || 'kauf',
    params,
    updated_at: new Date().toISOString(),
  };

  const isUpdate = id && typeof id === 'string' && id.includes('-');
  if (isUpdate) {
    const { data, error } = await supabase
      .from('kalkulationen')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, savedAt: data.updated_at, ...(data.params || {}) };
  } else {
    const { data, error } = await supabase
      .from('kalkulationen')
      .insert({ ...dbData, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, savedAt: data.updated_at, ...(data.params || {}) };
  }
}

export async function deleteKalkulation(id) {
  const { error } = await supabase.from('kalkulationen').delete().eq('id', id);
  if (error) throw error;
}
