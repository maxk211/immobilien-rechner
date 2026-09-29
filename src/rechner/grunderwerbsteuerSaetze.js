// Grunderwerbsteuersätze aller 16 Bundesländer — heute gültiger Satz.
// Einzige Quelle ist die Tabelle mit Gültig-ab-Historie in src/config/grunderwerbsteuer.js.
import { GREST_HISTORIE, grestSatz } from '../config/grunderwerbsteuer.js';

export const GRUNDERWERBSTEUER_SAETZE = Object.entries(GREST_HISTORIE)
  .map(([key, v]) => ({ key, land: v.name, satz: grestSatz(key).satz, seit: grestSatz(key).ab }))
  .sort((a, b) => a.land.localeCompare(b.land, 'de'));
