// PLZ-Daten werden aus public/plz-preise.json geladen (nicht im JS-Bundle)
// → reduziert initialen Bundle-Parse um ~50 ms

let _preise = null;
let _bereiche = null;
let _loadPromise = null;

// Sofort beim Modul-Load starten (non-blocking)
const _loadData = () => {
  if (_loadPromise) return _loadPromise;
  _loadPromise = fetch('/plz-preise.json')
    .then(r => r.json())
    .then(data => {
      _preise = data.preise;
      _bereiche = data.bereiche;
    })
    .catch(err => {
      console.warn('PLZ-Daten konnten nicht geladen werden:', err);
      _preise = {};
      _bereiche = { default: 3000 };
    });
  return _loadPromise;
};

// Prefetch sofort beim Import auslösen
_loadData();

// Warten bis Daten bereit — für Fälle wo sichergestellt sein muss, dass Daten geladen
export const waitForPLZData = () => _loadPromise || _loadData();

// Synchrone Lookup-Funktion — Daten sind normalerweise schon geladen,
// da der User erst nach Interaktion eine PLZ eingibt (~1-2s nach App-Start)
export const getPreisNachPLZ = (plz) => {
  const preise  = _preise  || {};
  const bereiche = _bereiche || { default: 3000 };

  if (!plz) return { preis: bereiche['default'] || 3000, genauigkeit: 'keine PLZ' };

  const plzString = plz.toString().trim();

  // 1. Exakte PLZ-Suche (5-stellig)
  if (preise[plzString]) {
    return { preis: preise[plzString], genauigkeit: 'exakt' };
  }

  // 2. 4-stellige PLZ-Suche
  const plz4 = plzString.substring(0, 4);
  const matches4 = Object.keys(preise).filter(p => p.startsWith(plz4));
  if (matches4.length > 0) {
    const avgPreis = Math.round(matches4.reduce((s, p) => s + preise[p], 0) / matches4.length);
    return { preis: avgPreis, genauigkeit: 'PLZ-Bereich (4-stellig)' };
  }

  // 3. 3-stellige PLZ-Suche
  const plz3 = plzString.substring(0, 3);
  const matches3 = Object.keys(preise).filter(p => p.startsWith(plz3));
  if (matches3.length > 0) {
    const avgPreis = Math.round(matches3.reduce((s, p) => s + preise[p], 0) / matches3.length);
    return { preis: avgPreis, genauigkeit: 'PLZ-Bereich (3-stellig)' };
  }

  // 4. 2-stellige Bereichssuche
  const plz2 = plzString.substring(0, 2);
  if (bereiche[plz2]) {
    return { preis: bereiche[plz2], genauigkeit: 'Region' };
  }

  // 5. Default
  return { preis: bereiche['default'] || 3000, genauigkeit: 'Deutschland Durchschnitt' };
};
