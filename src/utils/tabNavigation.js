/**
 * Synchrones Tab-Navigations-Signal für Deep-Links aus VermieterTodos.
 *
 * Problem: React Props/State sind asynchron. Wenn VermieterTodos eine Immobilie
 * öffnet UND einen Ziel-Tab setzt, gibt es Race-Conditions zwischen dem ersten
 * Mount des Detail-Components und dem Zeitpunkt, zu dem der initialTab-Prop
 * dort ankommt. Dieses Modul löst das durch ein synchrones Modul-Level-Signal:
 *
 * 1. VermieterTodos ruft setTargetTab('mieter') synchron auf
 * 2. setSelectedImmobilie(immo) triggert einen Re-Render
 * 3. KaufimmobilieDetail mounted → consumeTargetTab() liest 'mieter' und löscht es
 * 4. useState('mieter') → activeTab = 'mieter' ✓
 */

let _targetTab = null;

/** Setzt den gewünschten Tab bevor die Immobilie geöffnet wird */
export function setTargetTab(tab) {
  _targetTab = tab || null;
}

/** Liest und löscht den gesetzten Tab (einmalig beim Mount aufrufen) */
export function consumeTargetTab() {
  const tab = _targetTab;
  _targetTab = null;
  return tab;
}
