// Sonderumlage der WEG + Erhaltungsrücklage: Cashflow, Steuer (BFH IX R 19/24), 15-%-Regel,
// Erinnerungen, Erfassung. Ausführen: npm run test:sonderumlage
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://www.renditly.de/app', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','HTMLElement','Node','Element','MutationObserver','Event','KeyboardEvent','MouseEvent','FocusEvent','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','HTMLInputElement']) { try { globalThis[k] = w[k]; } catch {} }
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); globalThis.matchMedia = w.matchMedia;
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { renderToString } = await import('react-dom/server');
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const { cashflowMonat } = await import('../src/utils/berechnung.js');
const su = await import('../src/utils/sonderumlage.js');
const { generiereAufgaben } = await import('../src/components/VermieterTodos.jsx');
const { default: Steuerberechnung } = await import('../src/components/Steuerberechnung.jsx');
const { default: SonderumlagenManager } = await import('../src/components/SonderumlagenManager.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const txt = (h) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const ph = { id:1, darlehensTyp:'annuitaet', sollzinssatz:3.5, anfangstilgung:2, zinsbindung:10, kreditStartDatum:'2021-02-01' };
const basis = { id:'w', name:'ETW', immobilienTyp:'kaufimmobilie', kaufpreis:200000, kaufnebenkosten:10, kaufdatum:'2021-01-01', kaltmiete:800, hausgeld:250, wertsteigerung:2, gebaeudeAnteilProzent:80, ekFuerNebenkosten:20000, ekFuerKaufpreis:0, finanzierungsphasen:[ph] };
const dach = { id:7, titel:'Dachsanierung', zweck:'erhaltung', betrag:3000, faelligAm:'2026-11-15', raten:3, verwendung:[] };

// Zahlungen + Cashflow
const z = su.zahlungenVon(dach);
ok(z.length === 3 && z.every(x => x.betrag === 1000) && z[0].datum === '2026-11-15' && z[2].datum === '2027-01-15', 'Raten: 3 × 1.000 € (Nov, Dez, Jan)');
const mit = { ...basis, sonderumlagen:[dach] };
const nov = new Date(2026, 10, 20), okt = new Date(2026, 9, 20);
const cOhne = cashflowMonat(basis, nov), cMit = cashflowMonat(mit, nov), cOkt = cashflowMonat(mit, okt);
ok(Math.round(cOhne.nach - cMit.nach) === 1000 && Math.round(cOhne.vor - cMit.vor) === 1000, 'Cashflow: im Zahlungsmonat −1.000 € vor UND nach Tilgung');
ok(Math.round(cOkt.nach) === Math.round(cashflowMonat(basis, okt).nach), 'Cashflow: im Monat davor unverändert');
ok(Math.abs((cMit.vor - cMit.nach) - (cMit.tilgung + cMit.bausparTilgung)) < 0.01, 'Invariante vor − nach = Tilgung bleibt');
ok(su.sonderumlageImJahr(mit, 2026) === 2000 && su.sonderumlageImJahr(mit, 2027) === 1000, 'Jahressumme: 2026 = 2.000 €, 2027 = 1.000 €');

// Steuer: Erhaltung erst bei Verwendung
ok(su.erhaltungsaufwandJahr(mit, 2026) === 0 && su.erhaltungsaufwandJahr(mit, 2027) === 0, 'Steuer: ohne Verwendung nichts absetzbar (BFH IX R 19/24)');
const verwendet = { ...basis, sonderumlagen:[{ ...dach, verwendung:[{ jahr:2027, betrag:3000 }] }] };
ok(su.erhaltungsaufwandJahr(verwendet, 2027) === 3000 && su.erhaltungsaufwandJahr(verwendet, 2026) === 0, 'Steuer: absetzbar im Jahr der Verwendung (2027: 3.000 €)');
const modern = { ...basis, sonderumlagen:[{ id:8, titel:'Aufzug', zweck:'modernisierung', betrag:6000, faelligAm:'2026-03-01', raten:1 }] };
const em = su.steuerEintraege(modern);
ok(em.length === 1 && em[0].kategorie === 'modernisierung' && su.erhaltungsaufwandJahr(modern, 2026) === 0, 'Steuer: Modernisierung über die AfA, nicht sofort');

// Hausgeld / Erhaltungsrücklage
const hg = su.hausgeldSteuerJahr({ hausgeldRuecklage:100, ruecklageVerwendung:[{ jahr:2026, betrag:500 }] }, 2026, 3000);
ok(hg.bekannt && hg.zufuehrung === 1200 && hg.verwendung === 500 && hg.abziehbar === 2300, 'Hausgeld: 3.000 − 1.200 Zuführung + 500 Verwendung = 2.300 € absetzbar');
const hgU = su.hausgeldSteuerJahr({}, 2026, 3000);
ok(!hgU.bekannt && hgU.abziehbar === 3000, 'Hausgeld: Rücklagenanteil unbekannt → voll angesetzt (mit Hinweis)');

// 15-%-Regel
const neu = { ...basis, kaufdatum:'2025-03-01', investitionen:[{ id:1, datum:'2026-05-01', kategorie:'erhaltung', betrag:20000 }], sonderumlagen:[{ id:9, titel:'Fassade', zweck:'erhaltung', betrag:10000, faelligAm:'2026-06-01', raten:1, verwendung:[{ jahr:2026, betrag:10000 }] }] };
const r = su.regel15(neu, [...neu.investitionen, ...su.sonderumlagenAlsInvestitionen(neu)]);
ok(Math.round(r.grenze) === 26400 && r.summe === 30000 && r.ueberschritten, `15-%-Regel: Grenze 26.400 € (80 % von 220.000 €), 30.000 € inkl. Sonderumlage → überschritten`);
ok(su.erhaltungsaufwandJahr(neu, 2026) === 0 && su.steuerEintraege(neu).every(e => e.kategorie === 'herstellung'), '15-%-Regel: Erhaltung wird zu anschaffungsnahen Herstellungskosten (AfA)');

// Steuer-Reiter: eigene Rücklage nicht mehr absetzbar
const st = txt(renderToString(<Steuerberechnung params={{ ...basis, instandhaltung:50 }} ergebnis={{ monatlicheRate: 700 }} immobilie={basis} onUpdateParams={()=>{}} />));
ok(!/Erhaltungsaufwand \(laufend\)/.test(st) && /eigene Rücklage für Reparaturen/.test(st), 'Steuer-Reiter: eigene Rücklage nicht als Werbungskosten, mit Hinweis');
ok(/Anteil der Erhaltungsrücklage am Hausgeld ist nicht eingetragen/.test(st), 'Steuer-Reiter: Hinweis, wenn Rücklagenanteil fehlt');

// Erinnerungen
const heute = new Date();
const bald = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + 10).toISOString().slice(0, 10);
const aufg = generiereAufgaben([{ ...basis, sonderumlagen:[{ ...dach, faelligAm: bald, raten:1 }, { id:5, titel:'Heizung', zweck:'erhaltung', betrag:2000, faelligAm:`${heute.getFullYear() - 1}-04-01`, raten:1 }] }], [], []);
ok(aufg.some(a => a.id.startsWith('sonderumlage-faellig')), '„Was steht an“: Zahlung in 10 Tagen fällig');
ok(aufg.some(a => a.id.startsWith('sonderumlage-verwendung') && a.kategorie === 'Steuer'), '„Was steht an“: Vorjahres-Sonderumlage ohne Verwendung → Steuer-Hinweis');

// Erfassung
{
  let gespeichert = null;
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(<SonderumlagenManager params={{ ...basis }} updateParams={(p) => { gespeichert = p; }} />); });
  const btn = (t) => [...document.querySelectorAll('button')].find(b => b.textContent.includes(t));
  await act(async () => { btn('Sonderumlage erfassen').click(); });
  const setze = async (el, v) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new w.Event('input', { bubbles: true })); }); };
  const inputs = [...document.querySelectorAll('input')];
  await setze(inputs.find(i => i.placeholder === 'z. B. Dachsanierung'), 'Dach');
  await setze(inputs.find(i => i.placeholder === 'laut Beschluss'), '2400');
  await setze(inputs.find(i => i.type === 'date'), '2026-12-01');
  await act(async () => { document.querySelector('input[type="checkbox"]').click(); });
  await act(async () => { btn('Speichern').click(); });
  const s0 = gespeichert?.sonderumlagen?.[0];
  ok(s0 && s0.betrag === 2400 && s0.zweck === 'erhaltung' && s0.verwendung?.[0]?.jahr === 2026 && s0.verwendung[0].betrag === 2400, 'Erfassung: gespeichert, „im selben Jahr ausgeführt“ → Verwendung 2026');
  await act(async () => { root.unmount(); });
}

console.log(fehler ? `${fehler} Fehler` : 'Sonderumlage: alles grün');
process.exit(fehler ? 1 : 0);
