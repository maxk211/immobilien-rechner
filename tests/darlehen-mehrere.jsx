// Mehrere parallele Darlehen je Objekt. Ausführen: npm run test:darlehen
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://www.renditly.de/app', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','HTMLElement','Node','Element','MutationObserver','Event','KeyboardEvent','MouseEvent','FocusEvent','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','HTMLInputElement','HTMLSelectElement']) { try { globalThis[k] = w[k]; } catch {} }
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); globalThis.matchMedia = w.matchMedia;
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { renderToString } = await import('react-dom/server');
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const B = await import('../src/utils/berechnung.js');
const D = await import('../src/utils/darlehen.js');
const { generiereAufgaben } = await import('../src/components/VermieterTodos.jsx');
const { default: ImmobilienDetail } = await import('../src/components/ImmobilienDetail.jsx');
const { default: WeitereDarlehen } = await import('../src/components/WeitereDarlehen.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const gleich = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;
const txt = (h) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const H = new Date();
const ph1 = { id:1, darlehensTyp:'annuitaet', sollzinssatz:3.5, anfangstilgung:2, zinsbindung:10, kreditStartDatum:'2021-02-01', zinsbindungBis:'2031-01-31' };
const basis = { id:'o', name:'ETW', immobilienTyp:'kaufimmobilie', aktiv:true, kaufpreis:250000, kaufnebenkosten:10, kaufdatum:'2021-01-01', kaltmiete:1100, wertsteigerung:2, finanzierungsbetrag:200000, finanzierungsphasen:[ph1] };
const kfw = { id:2, name:'KfW 261', zweck:'kauf', betrag:50000, phasen:[{ id:21, darlehensTyp:'annuitaet', sollzinssatz:1.5, anfangstilgung:2, zinsbindung:10, kreditStartDatum:'2022-03-01', zinsbindungBis:'2032-02-28' }] };
const zwei = { ...basis, weitereDarlehen:[kfw] };

const vHaupt = D.darlehensVerlauf(basis, H), vKfw = D.darlehensVerlauf(D.darlehenAlsObjekt(zwei, kfw), H), vGes = D.darlehensVerlauf(zwei, H);
ok(gleich(vGes.rateHeute, vHaupt.rateHeute + vKfw.rateHeute) && gleich(vGes.restschuldHeute, vHaupt.restschuldHeute + vKfw.restschuldHeute) && gleich(vGes.fk, 250000), `Gesamt = Summe der Darlehen (Rate ${Math.round(vGes.rateHeute)} = ${Math.round(vHaupt.rateHeute)} + ${Math.round(vKfw.rateHeute)})`);
const cf = B.cashflowMonat(zwei, H), cf1 = B.cashflowMonat(basis, H);
ok(gleich(cf.rate, vGes.rateHeute) && gleich(cf.zinsen, vHaupt.zinsHeute + vKfw.zinsHeute) && gleich(cf.tilgung, vHaupt.tilgungHeute + vKfw.tilgungHeute), 'Cashflow: Rate, Zins, Tilgung beider Darlehen');
ok(gleich(cf1.nach - cf.nach, vKfw.rateHeute), 'Cashflow nach Tilgung sinkt genau um die zweite Rate');
ok(gleich(B.berechneRestschuld(zwei).restschuld, Math.round(vGes.restschuldHeute), 1), 'Restschuld: beide Darlehen');
ok(gleich(B.berechneImmoVermoegenswerte(zwei).restschuld, vGes.restschuldHeute, 1) && B.berechneImmoVermoegenswerte(zwei).fremdkapital === 250000, 'Vermögen/Netto-Vermögen: Restschuld beider Darlehen');
const j = H.getFullYear() - 1;
ok(gleich(B.berechneZinsUndTilgung(zwei, j).zinsen, Math.round(vHaupt.zinsenImJahr(j) + vKfw.zinsenImJahr(j)), 1), `Steuer: Zinsen ${j} beider Darlehen`);
ok(B.berechneJahresZinsenFuerSteuer(zwei, j) === B.berechneZinsUndTilgung(zwei, j).zinsen, 'Steuer-Export = Steuer-Reiter (eine Rechnung)');

// Anschlussfinanzierung am eigenen Darlehen: kein Doppelzählen
const kfwAnschluss = { ...kfw, phasen:[{ ...kfw.phasen[0], zinsbindungBis:'2024-02-29', zinsbindung:2 }, { id:22, darlehensTyp:'annuitaet', sollzinssatz:4.2, anfangstilgung:3, zinsbindung:10, kreditStartDatum:'2024-03-01', zinsbindungBis:'2034-02-28' }] };
const mitA = { ...basis, weitereDarlehen:[kfwAnschluss] };
const vA = D.darlehensVerlauf(D.darlehenAlsObjekt(mitA, kfwAnschluss), H);
ok(gleich(D.darlehensVerlauf(mitA, H).rateHeute, vHaupt.rateHeute + vA.rateHeute) && gleich(vA.zinsHeute / vA.restschuldAm(new Date(H.getFullYear(), H.getMonth(), 1)) * 1200, 4.2, 0.05), 'Anschluss am Darlehen 2: nur die aktive Phase zählt (4,2 %), nichts doppelt');
const abgel = { ...basis, weitereDarlehen:[{ ...kfw, phasen:[{ ...kfw.phasen[0], abbezahltAm:'2025-01-01' }] }] };
ok(gleich(B.cashflowMonat(abgel, H).rate, vHaupt.rateHeute) && gleich(B.berechneRestschuld(abgel).restschuld, Math.round(vHaupt.restschuldHeute), 1), 'Abgelöstes Darlehen 2: keine Rate, keine Restschuld mehr');

// Beliebig viele
const drei = { ...zwei, weitereDarlehen:[kfw, { id:3, name:'Privat', zweck:'modernisierung', betrag:20000, phasen:[{ id:31, darlehensTyp:'endfaellig', sollzinssatz:5, zinsbindung:5, laufzeit:5, kreditStartDatum:'2024-01-01', zinsbindungBis:'2028-12-31' }] }] };
const v3 = D.darlehensVerlauf(drei, H);
ok(v3.darlehen.length === 3 && gleich(v3.restschuldHeute, vGes.restschuldHeute + 20000, 1) && gleich(v3.zinsHeute - vGes.zinsHeute, 20000 * 0.05 / 12, 0.5), 'Drei Darlehen inkl. endfälligem (nur Zins, Restschuld bleibt)');
const cf3 = B.cashflowMonat(drei, H);
ok(Math.abs(cf3.zinsen + cf3.tilgung - cf3.rate) < 0.01 && Math.abs((cf3.vor - cf3.nach) - cf3.tilgung) < 0.01, 'Invarianten mit drei Darlehen');

// EK-Rendite: nur Kauf-Darlehen mindern das eingesetzte EK
const rKauf = B.berechneRendite({ ...basis, finanzierungsbetrag:200000, weitereDarlehen:[kfw] });
const rMod = B.berechneRendite({ ...basis, finanzierungsbetrag:200000, weitereDarlehen:[{ ...kfw, zweck:'modernisierung' }] });
ok(rKauf.eigenkapitalQuote < rMod.eigenkapitalQuote, 'EK: KfW zum Kauf senkt das eingesetzte EK, Modernisierungskredit nicht');

// Erinnerung Zinsbindung je Darlehen
const bald = new Date(H.getFullYear(), H.getMonth() + 6, 28).toISOString().slice(0, 10);
const erinn = generiereAufgaben([{ ...basis, weitereDarlehen:[{ ...kfw, phasen:[{ ...kfw.phasen[0], zinsbindungBis: bald }] }] }], [], []);
ok(erinn.some(a => a.id.startsWith('zinsbindung-o-d') && /KfW 261/.test(a.titel)), 'Was steht an: Zinsbindung von Darlehen 2 mit Namen');

// Oberfläche
const fin = txt(renderToString(<ImmobilienDetail immobilie={zwei} initialTab="finanzierung" onClose={()=>{}} onSave={()=>{}} portfolio={[zwei]} mieterListe={[]} aufgaben={[]} />));
ok(/Alle Darlehen zusammen/.test(fin) && /Darlehen 2/.test(fin) && /KfW 261/.test(fin) && /Weiteres Darlehen hinzufügen/.test(fin), 'Finanzierung: Gesamtübersicht, Darlehen 2 mit eigenem Reiter, Knopf „Weiteres Darlehen hinzufügen“');
{
  let gespeichert = null;
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(<WeitereDarlehen params={basis} updateParams={(p) => { gespeichert = p; }} marktwert={300000} />); });
  const btn = (t) => [...document.querySelectorAll('button')].find(b => b.textContent.includes(t));
  await act(async () => { btn('Weiteres Darlehen hinzufügen').click(); });
  const setze = async (el, v) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new w.Event('input', { bubbles: true })); }); };
  const inp = [...document.querySelectorAll('input')];
  await act(async () => { btn('Darlehen anlegen').click(); });
  ok(document.body.textContent.includes('Bitte ausfüllen'), 'Formular: Pflichtfelder werden gemeinsam gemeldet');
  await setze(inp.find(i => i.placeholder?.startsWith('z. B. KfW')), 'KfW 124');
  await setze(inp[1], '30000');
  await act(async () => { btn('Teil der Kauffinanzierung').click(); });
  const nums = [...document.querySelectorAll('input[inputmode="decimal"]')];
  await setze(nums[1], '2,1'); // Komma wie im echten Leben
  await setze(nums[2], '2');
  const dates = [...document.querySelectorAll('input[type="date"]')];
  await setze(dates[0], '2025-05-01'); await setze(dates[1], '2035-04-30');
  await act(async () => { btn('Darlehen anlegen').click(); });
  const d = gespeichert?.weitereDarlehen?.[0];
  ok(d && d.betrag === 30000 && d.zweck === 'kauf' && d.phasen[0].sollzinssatz === 2.1 && d.phasen[0].anfangstilgung === 2 && d.phasen[0].kreditStartDatum === '2025-05-01' && d.phasen[0].zinsbindung === 10, 'Anlegen: eigenes Darlehen mit Betrag, Zins, Tilgung, Beginn, Zinsbindung');
  ok(gespeichert && (gespeichert.finanzierungsphasen || []).length === 1, 'Darlehen 1 bleibt unverändert');
  await act(async () => { root.unmount(); });
}

console.log(fehler ? `${fehler} Fehler` : 'Mehrere Darlehen: alles grün');
process.exit(fehler ? 1 : 0);
