// Szenario-Matrix: jede Objektart in vielen Varianten — anlegen, speichern/laden, alle Reiter rendern,
// alle Kennzahlen rechnen. Keine Fehlerseite, kein NaN/Infinity, Cashflow-Invarianten stimmen.
// Ausführen: npm run test:szenarien
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
const { renderToString } = await import('react-dom/server');
const { _testRundlauf: R } = await import('../src/supabaseClient.js');
const { baueImmobilie } = await import('../src/components/AnlageWizard.jsx');
const B = await import('../src/utils/berechnung.js');
const { generiereAufgaben } = await import('../src/components/VermieterTodos.jsx');
const { default: ImmobilienDetail } = await import('../src/components/ImmobilienDetail.jsx');
const { default: ImmobilienKarte } = await import('../src/components/ImmobilienKarte.jsx');
const { default: PortfolioOverview } = await import('../src/components/PortfolioOverview.jsx');
const { default: MieteingaengeMonat } = await import('../src/components/MieteingaengeMonat.jsx');
let fehler = 0, n = 0;
const ok = (b, t) => { n++; if (!b) { fehler++; console.log(`✗ ${t}`); } };
const laden = (o, id) => R.dbToApp({ ...JSON.parse(JSON.stringify(R.appToDb(o))), id });
const zahlenOk = (obj, pfad = '') => {
  const schlecht = [];
  const lauf = (v, p) => {
    if (typeof v === 'number' && !Number.isFinite(v)) schlecht.push(p);
    else if (v && typeof v === 'object' && !(v instanceof Date) && p.split('.').length < 4) Object.entries(v).forEach(([k, x]) => typeof x !== 'function' && lauf(x, `${p}.${k}`));
  };
  lauf(obj, pfad); return schlecht;
};
const basis = { eigentumMonat: '2020-01', kaufpreis: '250000', erwerbsart: 'kauf', chips: [], wohnungen: [], plz: '93047', strasse: 'Teststr. 1', ort: 'Regensburg' };
const kredit = { kenne: 'tilgung', darlehenManuell: '200000', sollzins: '3,5', tilgung: '2', kreditSeit: '2020-01', zinsbindungBis: '2030-01-31', zbBestaetigt: true };
const varianten = [
  ['ETW vermietet, Miete+NK, Kredit', { typ: 'kaufimmobilie', ...basis, ...kredit, mietstatus: 'vermietet', vermietungsmodell: 'kaltmiete_nk', kaltmiete: '850', nkVz: '180', hausgeld: '320', nuHG: '110', mieterName: 'Anna', mieterSeit: '2021-03', letzteErhoehung: '2024-03', erhProzent: '8' }],
  ['ETW vermietet, nur Kaltmiete, ohne Kredit', { typ: 'kaufimmobilie', ...basis, zahlweise: 'bar', mietstatus: 'vermietet', vermietungsmodell: 'kaltmiete', kaltmiete: '700', nieErhoeht: true, mieterSeit: '2022-01' }],
  ['ETW Pauschalmiete', { typ: 'kaufimmobilie', ...basis, ...kredit, mietstatus: 'vermietet', vermietungsmodell: 'warmmiete', kaltmiete: '950' }],
  ['ETW selbst genutzt', { typ: 'kaufimmobilie', ...basis, ...kredit, mietstatus: 'selbst' }],
  ['ETW leer', { typ: 'kaufimmobilie', ...basis, ...kredit, mietstatus: 'leer' }],
  ['Geerbt ohne Kredit', { typ: 'kaufimmobilie', ...basis, erwerbsart: 'erbe', verkehrswert: '320000', kaufpreis: '', mietstatus: 'vermietet', kaltmiete: '900' }],
  ['Geschenkt mit Kredit', { typ: 'kaufimmobilie', ...basis, erwerbsart: 'geschenk', verkehrswert: '280000', kaufpreis: '', kreditBeiErbe: true, ...kredit, mietstatus: 'vermietet', kaltmiete: '800' }],
  ['Kauf in der Zukunft (Notar nächsten Monat)', { typ: 'kaufimmobilie', ...basis, ...kredit, eigentumMonat: '2027-01', kreditSeit: '2027-01', mietstatus: 'vermietet', kaltmiete: '800' }],
  ['MFH 3 WE gemischt belegt', { typ: 'mehrfamilienhaus', ...basis, kaufpreis: '900000', ...kredit, darlehenManuell: '700000', sev: '300', ruecklage: '200', wohnungen: [{ name: 'EG', wohnflaeche: '70', kaltmiete: '800', mieterName: 'A', mietbeginn: '2021-01' }, { name: 'OG', wohnflaeche: '65', kaltmiete: '750', mieterName: 'B' }, { name: 'DG', wohnflaeche: '40', kaltmiete: '' }] }],
  ['MFH ohne Fläche/Miete (nur angelegt)', { typ: 'mehrfamilienhaus', ...basis, kaufpreis: '500000', wohnungen: [{ name: 'WE 1', wohnflaeche: '', kaltmiete: '' }] }],
  ['Arbitrage', { typ: 'mietimmobilie', eigeneWarmmiete: '1200', zimmerVermietet: '4', untermieteProZimmer: '480', mietvertragEnde: '2029-06-30', chips: [], wohnungen: [] }],
  ['Arbitrage leer (alles 0)', { typ: 'mietimmobilie', chips: [], wohnungen: [] }],
];
const portfolio = [];
const mieterListe = [];
const heute = new Date();
for (const [name, d] of varianten) {
  let roh;
  try { roh = baueImmobilie(d); } catch (e) { ok(false, `${name}: Anlegen wirft ${e.message}`); continue; }
  const immo = laden({ ...roh, name }, `id-${portfolio.length}`);
  portfolio.push(immo);
  if (d.mieterName && immo.immobilienTyp !== 'mehrfamilienhaus') mieterListe.push({ id: `m-${immo.id}`, immobilie_id: immo.id, name: d.mieterName, aktiv: true, mietbeginn: '2021-03-01', kaltmiete: Number(d.kaltmiete) });
  // Rechnen
  let cf, r;
  try { cf = B.cashflowMonat(immo, heute); r = B.berechneRendite(immo); } catch (e) { ok(false, `${name}: Rechnen wirft ${e.message}`); continue; }
  ok(zahlenOk(cf).length === 0, `${name}: Cashflow ohne NaN (${zahlenOk(cf).join(', ')})`);
  ok(zahlenOk(r, 'rendite').length === 0, `${name}: Rendite ohne NaN (${zahlenOk(r, 'rendite').slice(0, 5).join(', ')})`);
  ok(Math.abs(cf.zinsen + cf.tilgung - cf.rate) < 0.01, `${name}: Rate = Zins + Tilgung`);
  ok(Math.abs((cf.vor - cf.nach) - cf.tilgung) < 0.01, `${name}: vor − nach Tilgung = Tilgung`);
  for (const j of [heute.getFullYear() - 1, heute.getFullYear()]) {
    try { const zt = B.berechneZinsUndTilgung(immo, j); ok(!zt || zahlenOk(zt).length === 0, `${name}: Zins/Tilgung ${j} ohne NaN`); } catch (e) { ok(false, `${name}: Zins/Tilgung ${j} wirft ${e.message}`); }
  }
  try { const v = B.berechneImmoVermoegenswerte(immo); ok(zahlenOk(v).length === 0, `${name}: Vermögen ohne NaN`); } catch (e) { ok(false, `${name}: Vermögen wirft ${e.message}`); }
  // Alle Reiter rendern
  const tabs = ['uebersicht', 'wohnungen', 'cashflow', 'finanzierung', 'bauspar', 'steuern', 'mieteinnahmen', 'mieter', 'nkabrechnung', 'stammdaten', 'kaufwert', 'investitionen', 'zaehler', 'dokumente'];
  for (const t of tabs) {
    try {
      const h = renderToString(<ImmobilienDetail immobilie={immo} initialTab={t} onClose={()=>{}} onSave={()=>{}} onSaveMieter={()=>{}} portfolio={portfolio} mieterListe={mieterListe} aufgaben={[]} />);
      ok(!/Ein Fehler ist aufgetreten|Anzeige-Fehler/.test(h), `${name}: Reiter „${t}“ ohne Fehlerseite`);
      ok(!/NaN|Infinity|undefined €|\[object Object\]/.test(h.replace(/<[^>]+>/g, ' ')), `${name}: Reiter „${t}“ ohne NaN/undefined im Text`);
    } catch (e) { ok(false, `${name}: Reiter „${t}“ wirft ${e.message}`); }
  }
  try { const h = renderToString(<ImmobilienKarte immobilie={immo} mieterListe={mieterListe} aufgaben={[]} onClick={()=>{}} />); ok(!/NaN|Infinity/.test(h.replace(/<[^>]+>/g, ' ')), `${name}: Karte ohne NaN`); } catch (e) { ok(false, `${name}: Karte wirft ${e.message}`); }
}
try { generiereAufgaben(portfolio, mieterListe, []); ok(true, ''); } catch (e) { ok(false, `Was steht an wirft ${e.message}`); }
try { const h = renderToString(<PortfolioOverview portfolio={portfolio} mieterListe={mieterListe} />); ok(!/NaN|Infinity/.test(h.replace(/<[^>]+>/g, ' ')), 'Portfolio-Übersicht ohne NaN'); } catch (e) { ok(false, `Portfolio-Übersicht wirft ${e.message}`); }
try { const h = renderToString(<MieteingaengeMonat portfolio={portfolio} mieterListe={mieterListe} onBuchen={()=>{}} onOpenImmobilie={()=>{}} />); ok(!/NaN/.test(h), 'Mieteingänge-Dashboard ohne NaN'); } catch (e) { ok(false, `Mieteingänge-Dashboard wirft ${e.message}`); }
for (const i of portfolio) { const c = B.cashflowMonat(i, heute); if (process.env.TABELLE) console.log(`  ${i.name.padEnd(42)} Miete ${String(Math.round(c.kaltmiete ?? c.einnahmen)).padStart(6)}  Kosten ${String(Math.round(c.betrieb)).padStart(5)}  Rate ${String(Math.round(c.rate)).padStart(5)}  Zins ${String(Math.round(c.zinsen)).padStart(5)}  CF nach ${String(Math.round(c.nach)).padStart(6)}  FK ${Math.round(B.berechneImmoVermoegenswerte(i)?.fremdkapital ?? 0)}`); }
console.log(fehler ? `${fehler} von ${n} Prüfungen fehlgeschlagen` : `Szenarien: alle ${n} Prüfungen grün (${varianten.length} Varianten)`);
process.exit(fehler ? 1 : 0);
