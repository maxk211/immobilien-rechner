// Belegung je Wohneinheit + Übernahme der beim Anlegen erfassten Mieter (Davids Fall).
// Ausführen: npm run test:belegung
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
import { renderToString } from 'react-dom/server';
import { einheitenStatus, mieterAusWohnungen } from '../src/utils/belegung.js';
import { generiereAufgaben } from '../src/components/VermieterTodos.jsx';
import ImmobilienKarte from '../src/components/ImmobilienKarte.jsx';
import ImmobilienDetail from '../src/components/ImmobilienDetail.jsx';
import MieteingaengeMonat from '../src/components/MieteingaengeMonat.jsx';

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const txt = (h) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const we = (name, mieterName, extra = {}) => ({ id: name, name, kaltmiete: 700, wohnflaeche: 60, mieterName, mietbeginn: mieterName ? '2024-01-01' : '', mietEingaenge: [], kosten: {}, ...extra });
const mfh = (wohnungen) => ({ id: 'm', name: 'MFH David', immobilienTyp: 'mehrfamilienhaus', aktiv: true, kaufpreis: 600000, kaufdatum: '2020-01-01', mieteFaelligkeitstag: 1, wertsteigerung: 2, finanzierungsphasen: [], wohnungen });
const ids = (t) => t.map(a => a.id);

// Davids Fall: Mieter je Wohnung beim Anlegen, keine Datensätze in der Mieterverwaltung
const david = mfh([we('EG', 'Anna Huber'), we('1. OG', 'Ben Kraus'), we('2. OG', 'Cem Yilmaz')]);
const b = einheitenStatus(david, []);
ok(b.gesamt === 'voll' && b.vermietet === 3, `Davids MFH: voll vermietet (vorher „steht leer“) — ${b.vermietet}/${b.anzahl}`);
const t = generiereAufgaben([david], [], []);
ok(!ids(t).includes('leerstand-m'), '„Was steht an“: kein „Immobilie steht leer“ mehr');
ok(ids(t).includes('mieter-uebernehmen-m'), '„Was steht an“: Hinweis „3 Mieter aus den Wohnungen übernehmen“');
const neu = mieterAusWohnungen(david, []);
ok(neu.length === 3 && neu[0].immobilieId === 'm' && neu[0].name === 'Anna Huber' && neu[0].zimmerBezeichnung === 'EG' && neu[0].kaltmiete === 700 && neu[0].mietbeginn === '2024-01-01', 'Übernahme: Datensätze mit Wohnung, Kaltmiete, Mietbeginn');
const db = neu.map((m, i) => ({ id: 'r' + i, immobilie_id: m.immobilieId, name: m.name, zimmer_bezeichnung: m.zimmerBezeichnung, aktiv: true }));
ok(mieterAusWohnungen(david, db).length === 0 && einheitenStatus(david, db).ohneMieterdatensatz.length === 0, 'Nach der Übernahme: nichts doppelt, kein Hinweis mehr');
ok(!ids(generiereAufgaben([david], db, [])).some(i => i.startsWith('mieter-uebernehmen')), '„Was steht an“: Übernahme-Hinweis verschwindet');

// Teilweise / offen / leer
const teil = mfh([we('EG', 'Anna'), we('OG', 'Ben'), we('DG', '', { leer: true })]);
const bt = einheitenStatus(teil, []);
ok(bt.gesamt === 'teilweise' && bt.leer === 1, 'Teilweise vermietet: 2 vermietet, 1 ausdrücklich leer');
ok(generiereAufgaben([teil], [], []).some(a => a.id === 'leerstand-m' && /1 von 3 Wohnungen steht leer/.test(a.titel)), '„Was steht an“: „1 von 3 Wohnungen steht leer“');
const offen = mfh([we('EG', 'Anna'), we('OG', ''), we('DG', '')]);
const bo = einheitenStatus(offen, []);
const to = generiereAufgaben([offen], [], []);
ok(bo.gesamt === 'teilweise' && bo.unbekannt === 2 && bo.leer === 0, 'Ohne Angaben: Belegung offen, KEIN Leerstand');
ok(!ids(to).includes('leerstand-m') && to.some(a => a.id === 'belegung-offen-m' && a.kategorie === 'Daten'), '„Was steht an“: „Belegung von 2 Wohnungen offen“ statt Leerstand');
const nix = mfh([we('EG', ''), we('OG', '')]);
ok(einheitenStatus(nix, []).gesamt === 'unbekannt' && !ids(generiereAufgaben([nix], [], [])).includes('leerstand-m'), 'Ganz ohne Mieterangaben: unbekannt, nicht „steht leer“');
const alleLeer = mfh([we('EG', '', { leer: true }), we('OG', '', { leer: true })]);
ok(einheitenStatus(alleLeer, []).gesamt === 'leer' && generiereAufgaben([alleLeer], [], []).some(a => a.id === 'leerstand-m'), 'Alle Wohnungen ausdrücklich leer → Leerstand');
const ausgezogen = mfh([we('EG', 'Anna', { mietende: '2025-06-30' }), we('OG', 'Ben')]);
ok(einheitenStatus(ausgezogen, []).leer === 1, 'Beendetes Mietverhältnis zählt als leer');

// Einzelobjekt
const kauf = (x) => ({ id: 'k', name: 'ETW', immobilienTyp: 'kaufimmobilie', aktiv: true, kaufpreis: 200000, kaltmiete: 800, kaufdatum: '2020-01-01', finanzierungsphasen: [], ...x });
ok(einheitenStatus(kauf({ mietstatus: 'vermietet' }), []).gesamt === 'voll' && generiereAufgaben([kauf({ mietstatus: 'vermietet' })], [], []).some(a => a.id === 'mieter-anlegen-k') && !ids(generiereAufgaben([kauf({ mietstatus: 'vermietet' })], [], [])).includes('leerstand-k'), 'ETW vermietet ohne Mieterdatensatz: kein Leerstand, Hinweis „Mieter anlegen“');
ok(generiereAufgaben([kauf({ mietstatus: 'leer' })], [], []).some(a => a.id === 'leerstand-k'), 'ETW „steht leer“ laut Anlage → Leerstand');
ok(!ids(generiereAufgaben([kauf({})], [], [])).includes('leerstand-k'), 'Ältere ETW mit Miete, ohne Angabe: kein falscher Leerstand');
ok(einheitenStatus(kauf({ mietstatus: 'selbst' }), []).gesamt === 'eigennutzung', 'Selbst genutzt: Eigennutzung');

// Miete offen je Wohnung (Mieteingänge werden beim MFH pro Wohnung geführt)
const miete = generiereAufgaben([david], [], []).find(a => a.id === 'miete-ausstehend-m');
ok(miete && /3 Wohnungen/.test(miete.titel) && /Anna Huber/.test(miete.sub), 'Miete offen: je Wohnung, mit Mieternamen');

// Oberflächen
const karte = txt(renderToString(<ImmobilienKarte immobilie={david} mieterListe={[]} aufgaben={[]} onClick={()=>{}} />));
ok(/3\/3 vermietet/.test(karte), 'Karte: „Mieter (3/3 vermietet)“');
const meHtml = txt(renderToString(<MieteingaengeMonat portfolio={[david]} mieterListe={[]} onBuchen={()=>{}} />));
ok(/MFH David/.test(meHtml), 'Mieteingänge: MFH erscheint, obwohl noch keine Datensätze');
const vermietung = txt(renderToString(<ImmobilienDetail immobilie={david} initialTab="mieter" onClose={()=>{}} onSave={()=>{}} onSaveMieter={()=>{}} portfolio={[david]} mieterListe={[]} aufgaben={[]} />));
ok(/3 Mieter stehen nur an den Wohnungen/.test(vermietung) && /Mieter übernehmen/.test(vermietung), 'Vermietung: Hinweis + Knopf „Mieter übernehmen“');

console.log(fehler ? `${fehler} Fehler` : 'Belegung: alles grün');
process.exit(fehler ? 1 : 0);
