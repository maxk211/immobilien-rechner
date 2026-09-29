// Grunderwerbsteuer-Sätze je Bundesland mit Gültig-ab-Historie (UX-Paket Teil 2, Datenfelder).
// Bis 31.08.2006 bundesweit 3,5 % (seit 01.01.1997); seit der Föderalismusreform
// (01.09.2006) legen die Länder den Satz selbst fest. Maßgeblich ist der Satz am Tag
// des notariellen Kaufvertrags (Entstehung der Steuer), hier vereinfacht: Kaufdatum.
// Stand: September 2026 · ohne Gewähr. Quellen: Landesgesetze / Übersichten u. a.
// finanz-tools.de (Stand 2026), taxfoundation.org (April 2024), de.wikipedia.org.
// Neue Änderungen einfach als weiteren Eintrag { ab, satz } ergänzen.

export const GREST_HISTORIE = {
  'baden-wuerttemberg': { name: 'Baden-Württemberg', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2011-11-05', satz: 5.0 }] },
  'bayern': { name: 'Bayern', saetze: [{ ab: '1997-01-01', satz: 3.5 }] },
  'berlin': { name: 'Berlin', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2007-01-01', satz: 4.5 }, { ab: '2012-04-01', satz: 5.0 }, { ab: '2014-01-01', satz: 6.0 }] },
  'brandenburg': { name: 'Brandenburg', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2011-01-01', satz: 5.0 }, { ab: '2015-07-01', satz: 6.5 }] },
  'bremen': { name: 'Bremen', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2011-01-01', satz: 4.5 }, { ab: '2014-01-01', satz: 5.0 }, { ab: '2025-07-01', satz: 5.5 }] },
  'hamburg': { name: 'Hamburg', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2009-01-01', satz: 4.5 }, { ab: '2023-01-01', satz: 5.5 }] },
  'hessen': { name: 'Hessen', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2013-01-01', satz: 5.0 }, { ab: '2014-08-01', satz: 6.0 }] },
  'mecklenburg': { name: 'Mecklenburg-Vorpommern', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2012-07-01', satz: 5.0 }, { ab: '2019-07-01', satz: 6.0 }] },
  'niedersachsen': { name: 'Niedersachsen', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2011-01-01', satz: 4.5 }, { ab: '2014-01-01', satz: 5.0 }] },
  'nrw': { name: 'Nordrhein-Westfalen', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2011-10-01', satz: 5.0 }, { ab: '2015-01-01', satz: 6.5 }] },
  'rheinland-pfalz': { name: 'Rheinland-Pfalz', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2012-03-01', satz: 5.0 }] },
  'saarland': { name: 'Saarland', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2011-01-01', satz: 4.0 }, { ab: '2012-01-01', satz: 4.5 }, { ab: '2013-01-01', satz: 5.5 }, { ab: '2015-01-01', satz: 6.5 }] },
  'sachsen': { name: 'Sachsen', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2023-01-01', satz: 5.5 }] },
  'sachsen-anhalt': { name: 'Sachsen-Anhalt', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2010-03-01', satz: 4.5 }, { ab: '2012-03-01', satz: 5.0 }] },
  'schleswig-holstein': { name: 'Schleswig-Holstein', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2012-01-01', satz: 5.0 }, { ab: '2014-01-01', satz: 6.5 }] },
  'thueringen': { name: 'Thüringen', saetze: [{ ab: '1997-01-01', satz: 3.5 }, { ab: '2011-04-07', satz: 5.0 }, { ab: '2017-01-01', satz: 6.5 }, { ab: '2024-01-01', satz: 5.0 }] },
};

export const BUNDESLAND_KEYS = Object.keys(GREST_HISTORIE);

// Satz am Stichtag; ohne Datum der heute gültige.
export function grestSatz(bundesland, datum = new Date()) {
  const bl = GREST_HISTORIE[bundesland];
  if (!bl) return null;
  const d = datum ? new Date(datum) : new Date();
  let satz = bl.saetze[0].satz;
  let ab = bl.saetze[0].ab;
  bl.saetze.forEach(s => { if (new Date(s.ab) <= d) { satz = s.satz; ab = s.ab; } });
  return { satz, ab };
}

// Keine Grunderwerbsteuer bei Erwerb von Todes wegen und Schenkung (§ 3 Nr. 2 GrEStG).
// Ausnahme Schenkung unter Auflage: der Wert der Auflage ist steuerpflichtig — Hinweis im UI.
export const grestFrei = (immo) => !!immo?.geschenkt || immo?.erwerbsart === 'schenkung' || immo?.erwerbsart === 'erbe';

// Landesname aus Geocoder (Photon/Nominatim) → interner Schlüssel
const NAME_ZU_KEY = Object.fromEntries(Object.entries(GREST_HISTORIE).map(([k, v]) => [v.name.toLowerCase(), k]));
NAME_ZU_KEY['baden-wurttemberg'] = 'baden-wuerttemberg';
NAME_ZU_KEY['thuringen'] = 'thueringen';
NAME_ZU_KEY['north rhine-westphalia'] = 'nrw';
NAME_ZU_KEY['bavaria'] = 'bayern';
NAME_ZU_KEY['lower saxony'] = 'niedersachsen';
NAME_ZU_KEY['saxony'] = 'sachsen';
NAME_ZU_KEY['saxony-anhalt'] = 'sachsen-anhalt';
NAME_ZU_KEY['hesse'] = 'hessen';
NAME_ZU_KEY['rhineland-palatinate'] = 'rheinland-pfalz';
NAME_ZU_KEY['thuringia'] = 'thueringen';
NAME_ZU_KEY['mecklenburg-western pomerania'] = 'mecklenburg';
NAME_ZU_KEY['freie hansestadt bremen'] = 'bremen';
export const bundeslandAusName = (name) => name ? (NAME_ZU_KEY[String(name).toLowerCase().trim()] || null) : null;

// Schnelle Offline-Schätzung aus der PLZ — nur für Leitregionen, die eindeutig in
// einem Land liegen. Grenzregionen liefern null; dann entscheidet der Geocoder oder der Nutzer.
const PLZ2 = {
  '09': 'sachsen',
  '98': 'thueringen', '99': 'thueringen',
  '10': 'berlin', '12': 'berlin', '13': 'berlin',
  '15': 'brandenburg',
  '18': 'mecklenburg',
  '20': 'hamburg',   '24': 'schleswig-holstein', '25': 'schleswig-holstein',
  '26': 'niedersachsen', '30': 'niedersachsen', '31': 'niedersachsen',   '39': 'sachsen-anhalt',
  '40': 'nrw', '41': 'nrw', '42': 'nrw', '44': 'nrw', '45': 'nrw', '46': 'nrw', '47': 'nrw', '50': 'nrw', '51': 'nrw', '52': 'nrw', '58': 'nrw', '59': 'nrw', '32': 'nrw', '33': 'nrw',
  '54': 'rheinland-pfalz', '55': 'rheinland-pfalz', '56': 'rheinland-pfalz', '67': 'rheinland-pfalz',
  '60': 'hessen', '61': 'hessen', '64': 'hessen',   '70': 'baden-wuerttemberg', '71': 'baden-wuerttemberg', '72': 'baden-wuerttemberg', '73': 'baden-wuerttemberg', '74': 'baden-wuerttemberg', '75': 'baden-wuerttemberg', '77': 'baden-wuerttemberg', '78': 'baden-wuerttemberg', '79': 'baden-wuerttemberg',
  '80': 'bayern', '81': 'bayern', '82': 'bayern', '83': 'bayern', '84': 'bayern', '85': 'bayern', '86': 'bayern', '87': 'bayern', '90': 'bayern', '91': 'bayern', '92': 'bayern', '93': 'bayern', '94': 'bayern', '95': 'bayern', '96': 'bayern', };
export const bundeslandAusPlz = (plz) => {
  const p = String(plz || '').trim();
  if (!/^\d{5}$/.test(p)) return null;
  if (p.startsWith('28')) return (Number(p) >= 28195 && Number(p) <= 28779) ? 'bremen' : null;
  if (p.startsWith('66')) return Number(p) <= 66459 ? 'saarland' : null;
  return PLZ2[p.slice(0, 2)] || null;
};

// Geocoder (OpenStreetMap/Photon, frei und ohne Schlüssel) — liefert das Bundesland zur Adresse.
export async function bundeslandAusAdresse({ plz, ort, adresse } = {}) {
  const q = [adresse, plz, ort, 'Deutschland'].filter(Boolean).join(' ');
  if (!q.trim()) return null;
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=de`);
    if (!r.ok) return null;
    const j = await r.json();
    const f = j?.features?.[0]?.properties;
    if (!f || (f.countrycode && f.countrycode !== 'DE')) return null;
    return bundeslandAusName(f.state) || (f.city === 'Berlin' ? 'berlin' : f.city === 'Hamburg' ? 'hamburg' : null);
  } catch {
    return null;
  }
}
