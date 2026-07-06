// Zähler-Typen
export const ZAEHLER_TYPEN = [
  { id: 'strom',   label: 'Strom',   icon: '⚡', einheit: 'kWh', farbe: 'amber' },
  { id: 'wasser',  label: 'Wasser',  icon: '💧', einheit: 'm³',  farbe: 'blue'  },
  { id: 'heizung', label: 'Heizung', icon: '🔥', einheit: 'kWh', farbe: 'red'   },
];

// NK-Kostenpositionen Defaults
export const NK_KOSTENPOSITIONEN_DEFAULTS = [
  { key: 'heizung', label: 'Heizkosten', icon: '🔥' },
  { key: 'wasser', label: 'Wasser/Abwasser', icon: '💧' },
  { key: 'muell', label: 'Müllentsorgung', icon: '🗑️' },
  { key: 'gebaeude_versicherung', label: 'Gebäudeversicherung', icon: '🛡️' },
  { key: 'hausmeister', label: 'Hausmeister', icon: '🔧' },
  { key: 'aufzug', label: 'Aufzug', icon: '🏢' },
  { key: 'treppenhausreinigung', label: 'Treppenhausreinigung', icon: '🧹' },
  { key: 'gartenpflege', label: 'Gartenpflege', icon: '🌿' },
  { key: 'strassenbeitrag', label: 'Straßenreinigung', icon: '🛤️' },
  { key: 'kabelfernsehen', label: 'Kabelfernsehen', icon: '📺' },
  { key: 'sonstiges', label: 'Sonstiges', icon: '📦' },
];

// NK-Standard-Positionen
export const NK_STANDARD_POSITIONEN = [
  { bezeichnung: 'Heizung & Warmwasser', kategorie: 'heizung', gesamtkosten: '', umlageschluessel: 'wohnflaeche', mieteranteil_fest: '' },
  { bezeichnung: 'Wasser & Abwasser', kategorie: 'wasser', gesamtkosten: '', umlageschluessel: 'wohnflaeche', mieteranteil_fest: '' },
  { bezeichnung: 'Müll & Entsorgung', kategorie: 'muell', gesamtkosten: '', umlageschluessel: 'wohnflaeche', mieteranteil_fest: '' },
  { bezeichnung: 'Grundsteuer', kategorie: 'grundsteuer', gesamtkosten: '', umlageschluessel: 'wohnflaeche', mieteranteil_fest: '' },
  { bezeichnung: 'Gebäudeversicherung', kategorie: 'versicherung', gesamtkosten: '', umlageschluessel: 'wohnflaeche', mieteranteil_fest: '' },
  { bezeichnung: 'Hausmeister', kategorie: 'hausmeister', gesamtkosten: '', umlageschluessel: 'wohnflaeche', mieteranteil_fest: '' },
];

// Changelog
export const CHANGELOG_VERSION = '2.8.0';
export const CHANGELOG_EINTRAEGE = [
  { emoji: '🏘️', text: 'Mehrfamilienhaus: Neuer Immobilientyp mit Wohnungsmanagement – alle Wohnungen separat erfassen, Gesamtwerte automatisch aggregiert' },
  { emoji: '🔑', text: 'Kautionsmanagement: Kautionen pro Mieter erfassen, Status verfolgen (ausstehend / erhalten / zurückgegeben)' },
  { emoji: '📈', text: 'Anschlussfinanzierung im Cashflow: Jede Finanzierungsphase nutzt ihre eigene Rate in der jährlichen Cashflow-Vorschau' },
  { emoji: '🎁', text: 'Schenkung / Erbschaft: Immobilien mit Kaufpreis 0 € anlegen – KPIs zeigen sinnvolle Werte statt Infinity' },
  { emoji: '💰', text: 'Cash-on-Cash Rendite ersetzt Leverage-KPI im Kennzahlenstreifen' },
  { emoji: '🐛', text: 'Rate-Bug behoben: Zinsen/Tilgung im Cashflow-Tab stimmen jetzt mit dem Finanzierungstab überein' },
  { emoji: '🐛', text: 'Cashflow-Berechnung nutzt jetzt die korrekte aktive Finanzierungsphase (auch bei Einzelphasen)' },
  { emoji: '📊', text: 'Vermieterkosten können jetzt rückwirkend per Jahr angepasst werden (Manuell-Modus im Cashflow-Tab)' },
];
