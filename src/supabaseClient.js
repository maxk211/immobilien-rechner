import { createClient } from '@supabase/supabase-js';

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

// Immobilie speichern (neu oder update)
export async function saveImmobilie(immobilie) {
  const dbData = appToDb(immobilie);

  if (immobilie.id && typeof immobilie.id === 'string' && immobilie.id.includes('-')) {
    // Update existierende Immobilie (UUID)
    const { data, error } = await supabase
      .from('immobilien')
      .update(dbData)
      .eq('id', immobilie.id)
      .select()
      .single();

    if (error) throw error;
    return dbToApp(data);
  } else {
    // Neue Immobilie erstellen
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Nicht eingeloggt');

    const { data, error } = await supabase
      .from('immobilien')
      .insert({ ...dbData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return dbToApp(data);
  }
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
    ekFuerNebenkosten: Number(db.ek_fuer_nebenkosten) || 0,
    ekFuerKaufpreis: Number(db.ek_fuer_kaufpreis) || 0,
    kaltmiete: Number(db.kaltmiete) || 0,
    geschaetzterWert: Number(db.geschaetzter_wert) || 0,
    zinssatz: Number(db.zinssatz) || 4.0,
    tilgung: Number(db.tilgung) || 2.0,
    laufzeit: db.laufzeit || 25,
    finanzierungsbetrag: db.finanzierungsbetrag ? Number(db.finanzierungsbetrag) : null,
    kaufnebenkosten: Number(db.kaufnebenkosten) || 10,
    kaufnebenkostenModus: db.kaufnebenkosten_modus,
    bundesland: db.bundesland,
    nebenkosten: Number(db.nebenkosten) || 0,
    instandhaltung: Number(db.instandhaltung) || 0,
    verwaltung: Number(db.verwaltung) || 0,
    hausgeld: Number(db.hausgeld) || 0,
    strom: Number(db.strom) || 0,
    internet: Number(db.internet) || 0,
    wertsteigerung: Number(db.wertsteigerung) || 2.0,
    mietsteigerung: Number(db.mietsteigerung) || 1.5,
    steuersatz: Number(db.steuersatz) || 42,
    gebaeudeAnteilProzent: Number(db.gebaeude_anteil_prozent) || 80,
    afaSatz: Number(db.afa_satz) || 2.0,
    fahrtkostenModus: db.fahrtkosten_modus,
    fahrtenProMonat: db.fahrten_pro_monat || 0,
    entfernungKm: Number(db.entfernung_km) || 0,
    kmPauschale: Number(db.km_pauschale) || 0.30,
    eigeneWarmmiete: Number(db.eigene_warmmiete) || 0,
    anzahlZimmerVermietet: db.anzahl_zimmer_vermietet || 0,
    untermieteProZimmer: Number(db.untermiete_pro_zimmer) || 0,
    arbitrageStrom: Number(db.arbitrage_strom) || 0,
    arbitrageInternet: Number(db.arbitrage_internet) || 0,
    arbitrageGEZ: Number(db.arbitrage_gez) || 18.36,
    mietvertragStart: db.mietvertrag_start,
    finanzierungsphasen: db.finanzierungsphasen || [],
    mietHistorie: db.miet_historie || {},
    mietEingaenge: db.miet_eingaenge || [],
    fahrtenListe: db.fahrten_liste || [],
    investitionen: db.investitionen || [],
    kaufnebenkostenPositionen: db.kaufnebenkosten_positionen
  };
}

// Konvertierung: App -> Datenbank Format
function appToDb(app) {
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
    wertsteigerung: app.wertsteigerung,
    mietsteigerung: app.mietsteigerung,
    steuersatz: app.steuersatz,
    gebaeude_anteil_prozent: app.gebaeudeAnteilProzent,
    afa_satz: app.afaSatz,
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
    kaufnebenkosten_positionen: app.kaufnebenkostenPositionen
  };
}
