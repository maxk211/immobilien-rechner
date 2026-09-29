// Schwellen der Plausibilitätsprüfung (UX-Paket Teil 3, Abschnitt 8).
// Bewusst Konfiguration statt Code: sobald genug Objekte im System sind,
// lassen sich diese Werte aus den eigenen Daten ableiten.
export const PLAUSI_SCHWELLEN = {
  mieteProQm: { min: 4, max: 25 },            // €/m² Kaltmiete
  kaufpreisfaktor: { min: 10, max: 40, ueblichMin: 15, ueblichMax: 30 },
  hausgeldProQm: { min: 1, max: 5 },           // €/m² im Monat
  sollzins: { min: 0.5, max: 9 },              // % p. a.
  anfangstilgung: { min: 0.5, max: 15 },       // % p. a.
  kaufnebenkosten: { min: 5, max: 18 },        // % vom Kaufpreis
  wohnflaeche: { min: 15, max: 400 },          // m²
  eigenkapitalquote: { min: 0.05 },            // Anteil der Gesamtinvestition
  marktwertFaktor: { min: 0.3, max: 3 },       // Marktwert ÷ Kaufpreis
  marktwertAlterMonate: 18,
  rateAbweichung: 0.05,                        // Rate vs. Zins + Tilgung
  schlusszahlungAbweichung: 0.05,
  // Cockpit-Erinnerung "X Zahlen prüfen": ab 1 Widerspruch oder mehr als 2 gelben Hinweisen
  erinnerung: { rotAb: 1, gelbMehrAls: 2 },
};
