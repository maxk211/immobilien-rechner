// Speicher-Rundlauf: alles, was die App an einem Objekt speichert, muss nach dem Neuladen wieder
// genauso da sein (App → Datenbank-Zeile → App). Ausführen: npm run test:speichern
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
const { _testRundlauf: R } = await import('../src/supabaseClient.js');
const { baueImmobilie } = await import('../src/components/AnlageWizard.jsx');
const { normalisiereImmobilie } = await import('../src/utils/zahlen.js');
let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
// Datenbank simulieren: JSON-Rundlauf (JSONB/Spalten), id + Zeitstempel wie von Supabase
const rundlauf = (o) => R.dbToApp({ ...JSON.parse(JSON.stringify(R.appToDb(o))), id: o.id || 'x1', created_at: '2026-01-01' });
const gleich = (a, b) => JSON.stringify(a === '' ? null : (a ?? null)) === JSON.stringify(b === '' ? null : (b ?? null)); // leer = null
const vergleiche = (name, o, ausnahmen = []) => {
  const vorher = normalisiereImmobilie(o);
  const nachher = rundlauf(o);
  const weg = Object.keys(vorher).filter(k => !ausnahmen.includes(k) && vorher[k] !== undefined && !gleich(vorher[k], nachher[k]));
  ok(weg.length === 0, `${name}: alle ${Object.keys(vorher).length} Felder überleben das Speichern${weg.length ? ` — ABWEICHEND: ${weg.map(k => `${k} (${JSON.stringify(vorher[k])?.slice(0, 40)} → ${JSON.stringify(nachher[k])?.slice(0, 40)})`).join(', ')}` : ''}`);
  return nachher;
};

// Anlage-Assistent: alle Varianten
const W = [
  ['ETW vermietet, Miete+NK, letzte Erhöhung', { typ: 'kaufimmobilie', mietstatus: 'vermietet', vermietungsmodell: 'kaltmiete_nk', kaltmiete: '800', nkVz: '150', chips: ['strom', 'heizung', 'rundfunk', 'kontofuehrung', 'sonstige', 'internet'], strom: '20', heizung: '30', rundfunk: '18', kontofuehrung: '5', sonstige: '10', internet: '30', eigentumMonat: '2020-01', kaufpreis: '250000', erwerbsart: 'kauf', wohnungen: [], letzteErhoehung: '2024-02', erhProzent: '10', hausgeld: '320', nuHG: '110', ruecklage: '40', grundsteuerJahr: '240', versicherung: '15', sev: '25', plz: '93047', ort: 'Regensburg', strasse: 'Hauptstr. 1', name: 'ETW' }],
  ['ETW selbst genutzt, Kredit läuft', { typ: 'kaufimmobilie', mietstatus: 'selbst', eigentumMonat: '2018-06', kaufpreis: '300000', erwerbsart: 'kauf', chips: [], wohnungen: [], darlehenManuell: '200000', sollzins: '1,9', tilgung: '2', kreditSeit: '2018-06', zinsbindungBis: '2028-05-31', zbBestaetigt: true }],
  ['Geerbt / geschenkt', { typ: 'kaufimmobilie', erwerbsart: 'geschenk', verkehrswert: '300000', eigentumMonat: '2022-05', chips: [], wohnungen: [], mietstatus: 'leer' }],
  ['Mehrfamilienhaus', { typ: 'mehrfamilienhaus', eigentumMonat: '2020-01', kaufpreis: '600000', erwerbsart: 'kauf', chips: [], sev: '200', ruecklage: '150', wohnungen: [{ name: 'EG', wohnflaeche: '60', kaltmiete: '700', mieterName: 'A', mietbeginn: '2021-01' }, { name: 'OG', wohnflaeche: '40', kaltmiete: '500' }] }],
  ['Mietimmobilie (Arbitrage)', { typ: 'mietimmobilie', eigeneWarmmiete: '900', zimmerVermietet: '3', untermieteProZimmer: '450', mietvertragEnde: '2028-12-31', chips: [], wohnungen: [] }],
];
for (const [n, d] of W) vergleiche(`Assistent · ${n}`, baueImmobilie(d));

// Voll ausgestattetes Objekt mit allem, was man später in der App pflegt
const voll = {
  ...baueImmobilie(W[0][1]), id: 'voll', finanzierungsbetrag: 200000,
  kaltmiete: 478.1, geschaetzterWert: 310000, geschaetzterWertDatum: '2026-10-01', wertsteigerung: 0, mietsteigerung: 0,
  mietAnpassungen: [{ datum: '2024-02-01', kaltmiete: 510.5, vorher: 478.1, grund: 'Mieterhöhung' }, { datum: '2025-07-01', hausgeld: 340 }],
  mietEingaenge: [{ id: 1, datum: '2026-01-03', monat: '2026-01', betrag: 660.5, typ: 'kaltmiete', notiz: 'ok' }],
  finanzierungsphasen: [{ id: 1, darlehensTyp: 'annuitaet', sollzinssatz: 3.2, anfangstilgung: 0, kreditStartDatum: '2020-01-01', zinsbindungBis: '2030-01-31', zinsbindungBisBestaetigt: true, sondertilgungen: [{ datum: '2024-12-01', betrag: 5000 }] }],
  weitereDarlehen: [{ id: 2, name: 'KfW', zweck: 'modernisierung', betrag: 30000, phasen: [{ id: 21, darlehensTyp: 'annuitaet', sollzinssatz: 1.5, anfangstilgung: 2, kreditStartDatum: '2023-01-01', zinsbindungBis: '2033-01-31' }] }],
  bausparvertraege: [{ id: 1, bausparkasse: 'LBS', bausparsumme: 50000, rolle: 'tilgung' }],
  sonderumlagen: [{ id: 1, titel: 'Dach', zweck: 'erhaltung', betrag: 4000, faelligAm: '2025-03-01', raten: 4, verwendung: [{ jahr: 2025, betrag: 3000 }] }],
  hausgeldRuecklage: 0, ruecklageVerwendung: [{ jahr: 2025, betrag: 200 }],
  nachforderungen: [{ id: 1, titel: 'Strom', betrag: 600 }], kautionen: [{ id: 1, mieterId: 'r', verwahrform: 'kautionskonto' }],
  nkAbrechnungen: [{ id: 1, jahr: 2025 }], investitionen: [{ id: 1, datum: '2025-05-01', betrag: 1200, kategorie: 'erhaltung' }],
  zaehler: [{ id: 1, typ: 'strom' }], dokumente: [{ id: 'd', name: 'a.pdf', path: 'p' }],
  stellplatz: { vorhanden: true, istVermietet: true, monatlicheMiete: 60, anzahl: 1 },
  eigentumsform: 'gbr', userAnteil: 50, gbrPartner: [{ name: 'B', anteil: 50 }],
  afaSatz: 2.5, afaModus: 'degressiv', afaDegressivWechseljahr: 2030, gebaeudeAnteilProzent: 75, steuersatz: 35,
  kappungsgrenze: 15, kostenZahler: { strom: [{ ab: '2025-01-01', zahler: 'mieter' }] }, mieteFaelligkeitstag: 5,
  dauerauftrag: true, dauerauftragBetrag: 660.5, aktiv: false, aufgabedatum: '2026-09-30',
  plausiBestaetigt: { kaufpreis: '2026-01-01' }, hausverwaltungName: 'HV GmbH', etage: '2. OG', energieausweisGueltigBis: '2030-01-01',
};
const n = vergleiche('Voll ausgestattete Eigentumswohnung', voll);
ok(n.mietAnpassungen[0].vorher === 478.1 && n.mietAnpassungen[0].grund === 'Mieterhöhung', 'Mietverlauf mit „Miete davor“ und Grund bleibt erhalten');

const mfh = {
  ...baueImmobilie(W[3][1]), id: 'mfh', hauskosten: { hausverwaltung: 300, grundsteuer: 80, versicherung: 60, strom: 0, internet: 0, instandhaltung: 100, sonstige: 0 }, hauskostenVerteilung: 'einheiten',
  wohnungen: [
    { id: 'EG', name: 'EG', wohnflaeche: 60, kaltmiete: 700, mieterName: 'A', mieterId: 'r1', mietbeginn: '2021-01-01', letzteMieterhoehung: '2024-03-01', nieErhoeht: false, dauerauftrag: true, kautionBetrag: 2100, kautionBezahlt: true,
      mietAnpassungen: [{ datum: '2024-03-01', kaltmiete: 735, vorher: 700, grund: 'Mieterhöhung' }], mietEingaenge: [{ id: 1, datum: '2026-01-01', monat: '2026-01', betrag: 735, typ: 'kaltmiete', sammel: true }], kosten: { sonstige: 20 } },
    { id: 'OG', name: 'OG', wohnflaeche: 40, kaltmiete: 500, leer: true, mietAnpassungen: [], mietEingaenge: [], kosten: {} },
  ],
};
const nm = vergleiche('Mehrfamilienhaus mit Hauskosten, Mietverlauf, Dauerauftrag, Kaution', mfh, ['kaltmiete', 'mietAnpassungen']);
ok(nm.kaltmiete === 1200 && nm.mietAnpassungen.some(a => a.kaltmiete === 1235), 'MFH: Objektmiete wird aus den Wohnungen abgeleitet (1.200 Ausgang, 1.235 nach Erhöhung)');

console.log(fehler ? `${fehler} Fehler` : 'Speichern: alles grün');
process.exit(fehler ? 1 : 0);
