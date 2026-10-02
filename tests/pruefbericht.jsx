// Abnahme-Tests zum Prüfbericht vom 02.10.2026 (B2, B4, B10, N-1 … N-4, Darlehen abschließen,
// Finanzierungsphasen, „Rechnet sich das?“). Ausführen: npm run test:bericht
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
const { Toaster } = await import('react-hot-toast');
const { berechneRendite, cashflowMonat } = await import('../src/utils/berechnung.js');
const { generiereAufgaben } = await import('../src/components/VermieterTodos.jsx');
const { default: VermieterTodos } = await import('../src/components/VermieterTodos.jsx');
const { default: MieteingaengeMonat } = await import('../src/components/MieteingaengeMonat.jsx');
const { default: PortfolioOverview } = await import('../src/components/PortfolioOverview.jsx');
const { default: ZahlInput } = await import('../src/components/ZahlInput.jsx');
const { pruefeImmobilie } = await import('../src/utils/plausibilitaet.js');
const { rechne } = await import('../src/components/RechnetSichDas.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const txt = (h) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const H = new Date();
const ph = { id:1, darlehensTyp:'annuitaet', sollzinssatz:3.5, anfangstilgung:2, zinsbindung:10, kreditStartDatum:'2021-02-01', zinsbindungBis:'2031-01-31' };
const basis = { id:'b', name:'Basis', immobilienTyp:'kaufimmobilie', kaufpreis:200000, kaufnebenkosten:10, kaufdatum:'2021-01-01', kaltmiete:800, hausgeld:250, wertsteigerung:2, finanzierungsphasen:[ph] };

// ── B4: EK-Rendite ──────────────────────────────────────────────────────────────
const voll = berechneRendite({ ...basis, finanzierungsbetrag: 220000, eigenkapital: 12000 }); // KP+NK komplett finanziert, alte EK-Angabe
ok(voll.eigenkapitalRendite == null, `B4: Vollfinanzierung mit alter EK-Angabe → keine EK-Rendite (vorher Prozentwert), Quote ${(voll.eigenkapitalQuote * 100).toFixed(1)} %`);
const knapp = berechneRendite({ ...basis, finanzierungsbetrag: 214000 }); // 6.000 € EK = 2,7 %
ok(knapp.ekRenditeNichtAussagekraeftig === true, 'B4: unter 5 % Eigenkapitalquote → „nicht aussagekräftig“');
const normal = berechneRendite({ ...basis, ekFuerNebenkosten: 20000, ekFuerKaufpreis: 40000 });
ok(normal.eigenkapitalRendite > 0 && !normal.ekRenditeNichtAussagekraeftig, `B4: normale Finanzierung (27 % EK) zeigt EK-Rendite ${normal.eigenkapitalRendite.toFixed(1)} %`);

// ── B10: Kachel Cashflow weiß ───────────────────────────────────────────────────
const dash = renderToString(<PortfolioOverview portfolio={[{ ...basis, ekFuerNebenkosten:20000, ekFuerKaufpreis:0 }]} />);
const kachel = dash.slice(Math.max(0, dash.indexOf('Cashflow / Monat') - 400), dash.indexOf('Cashflow / Monat'));
ok(/bg-white/.test(kachel) && !/bg-(ink|gray-900|slate-900|black)/.test(kachel), 'B10: Kachel „Cashflow / Monat“ ist weiß');

// ── N-2 / N-3: Bausparvertrag ohne Rolle / ohne Summe ──────────────────────────
const bsOhne = { ...basis, id:'n', name:'Nerlystraße', ekFuerNebenkosten:20000, ekFuerKaufpreis:0, bausparvertraege:[{ id:9, monatlicheSparrate:350, bausparsumme:0, vertragSeit:'2026-09-01' }] };
const aufg = generiereAufgaben([bsOhne], [], []);
ok(aufg.some(a => a.id.startsWith('bauspar-rolle') && a.kategorie === 'Finanzierung' && a.targetTab === 'bauspar'), 'N-2: „Was steht an“ meldet Bausparvertrag ohne Rolle (Finanzierung → Bauspar)');
ok(aufg.some(a => a.id.startsWith('bauspar-summe')), 'N-3: „Was steht an“ meldet fehlende Bausparsumme');
ok(pruefeImmobilie(bsOhne).some(h => h.id.startsWith('bauspar-summe') && h.stufe === 'rot'), 'N-3: Plausibilitätsprüfung meldet Bausparsumme 0 € als Widerspruch');
const mitRolle = generiereAufgaben([{ ...bsOhne, bausparvertraege:[{ ...bsOhne.bausparvertraege[0], rolle:'tilgungsersatz', bausparsumme:50000 }] }], [], []);
ok(!mitRolle.some(a => a.id.startsWith('bauspar-')), 'N-2/N-3: mit Rolle und Summe keine Meldung');
const cfOhne = cashflowMonat(bsOhne), cfTE = cashflowMonat({ ...bsOhne, bausparvertraege:[{ ...bsOhne.bausparvertraege[0], rolle:'tilgungsersatz' }] });
ok(Math.round(cfTE.vor - cfOhne.vor) === 350 && Math.round(cfTE.vermoegensaufbau - cfOhne.vermoegensaufbau) === 350, 'N-2: Rolle „Tilgungsersatz“ hebt vor Tilgung und Vermögensaufbau um 350 €');

// ── Zinsbindungs-Erinnerung auch bei Schenkung mit Darlehen ─────────────────────
const schenk = { ...basis, id:'s', kaufpreis:0, geschenkt:true, erwerbsart:'schenkung', finanzierungsbetrag:100000, finanzierungsphasen:[{ ...ph, kreditStartDatum:'2017-01-01', zinsbindungBis: new Date(H.getFullYear(), H.getMonth() + 6, 28).toISOString().slice(0,10) }] };
ok(generiereAufgaben([schenk], [], []).some(a => a.id === 'zinsbindung-s'), 'Zinsbindungs-Erinnerung auch bei Schenkung mit Darlehen (vorher übersprungen)');

// ── Darlehen abschließen + Finanzierungsphasen ─────────────────────────────────
const abbez = cashflowMonat({ ...basis, ekFuerNebenkosten:20000, ekFuerKaufpreis:0, finanzierungsphasen:[{ ...ph, abbezahltAm:'2025-06-01' }] });
ok(abbez.rate === 0 && abbez.schuldenfrei && abbez.restschuld === 0, 'Darlehen abschließen → abbezahlt: Rate 0, Restschuld 0, schuldenfrei');
const zweiPh = { ...basis, ekFuerNebenkosten:20000, ekFuerKaufpreis:0, finanzierungsphasen:[{ ...ph, kreditStartDatum:'2016-02-01', zinsbindungBis:'2021-01-31' }, { id:2, darlehensTyp:'annuitaet', sollzinssatz:4.5, anfangstilgung:3, zinsbindung:10 }] };
const c2 = cashflowMonat(zweiPh);
ok(Math.abs(c2.zinsen / c2.restschuld * 12 - 0.045) < 0.002, `Anschlussfinanzierung: Zins der aktiven Phase 2 (${(c2.zinsen / c2.restschuld * 1200).toFixed(2)} % ≈ 4,5 %)`);
ok(Math.abs(c2.zinsen + c2.tilgung - c2.rate) < 0.01, 'Anschlussfinanzierung: Zins + Tilgung = Rate');

// ── „Rechnet sich das?“ ─────────────────────────────────────────────────────────
const r = rechne({ kaufpreis:100000, knkManuell:0, eigenkapital:0, sollzins:4, tilgung:2, kaltmiete:700, hausgeld:0, nuHG:'', sev:0, ruecklage:0, grundsteuerJahr:0, sonstige:0, sanierung:0 });
ok(Math.round(r.rate) === 500 && Math.round(r.zinsMonat) === 333 && Math.round(r.vor - r.nach) === 167, `„Rechnet sich das?“: Rate ${Math.round(r.rate)} · Zins ${Math.round(r.zinsMonat)} · vor−nach ${Math.round(r.vor - r.nach)} (wie im Objekt)`);

// ── N-4: einheitliche Kopfzeilen ───────────────────────────────────────────────
const todosHtml = txt(renderToString(<VermieterTodos portfolio={[bsOhne]} mieterListe={[]} nkAbrechnungen={[]} />));
const mieter = [{ id:'m1', immobilie_id:'n', name:'Kim', aktiv:true, kaltmiete:800 }];
const meHtmlRaw = renderToString(<MieteingaengeMonat portfolio={[{ ...bsOhne, mieteFaelligkeitstag: 1 }]} mieterListe={mieter} onBuchen={()=>{}} />);
const meHtml = txt(meHtmlRaw);
ok(/Was steht an \d+ offen/.test(todosHtml), 'N-4: „Was steht an“ — Zustand als erste Plakette');
ok(/verbucht/.test(meHtml) && !/noch offen/.test(meHtml), 'N-4: Mieteingänge — Plaketten statt Fließtext, keine Wiederholung „noch offen“');
const pfeilRechts = (h) => { const i = h.indexOf('w-8 h-8 rounded-lg border'); const t = h.indexOf('font-bold text-gray-800'); return i > t && t > 0; };
ok(pfeilRechts(renderToString(<VermieterTodos portfolio={[bsOhne]} mieterListe={[]} nkAbrechnungen={[]} />)) && pfeilRechts(meHtmlRaw), 'N-4: Pfeil bei beiden Kopfzeilen rechts als 32-px-Knopf');

// ── B2: große Änderung erst nach Bestätigung ───────────────────────────────────
{
  const werte = [];
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(<><Toaster /><ZahlInput value={2650} onChange={e => werte.push(e.target.value)} /></>); });
  const input = document.querySelector('input');
  const setze = async (v) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(input, v); await act(async () => { input.dispatchEvent(new w.Event('input', { bubbles: true })); }); };
  await act(async () => { input.dispatchEvent(new w.FocusEvent('focus')); input.focus(); });
  await setze('265');
  await act(async () => { await sleep(700); });
  ok(werte.length === 0, 'B2: gelöschte Ziffer (2650 → 265) wird nicht nach 500 ms übernommen');
  await act(async () => { input.blur(); input.dispatchEvent(new w.FocusEvent('blur')); await sleep(50); });
  ok(werte.length === 0 && document.body.textContent.includes('Große Änderung'), 'B2: Klick daneben übernimmt NICHT, sondern fragt „Übernehmen / Verwerfen“');
  let plausi = 0; w.addEventListener('renditly-plausi-pruefen', () => plausi++);
  const knopf = [...document.querySelectorAll('button')].find(b => b.textContent === 'Verwerfen');
  await act(async () => { knopf.click(); await sleep(20); });
  ok(werte.length === 0 && input.value === '2650', 'B2: „Verwerfen“ stellt 2650 wieder her');
  await act(async () => { input.focus(); }); await setze('265'); await act(async () => { input.blur(); input.dispatchEvent(new w.FocusEvent('blur')); await sleep(50); });
  const ueb = [...document.querySelectorAll('button')].find(b => b.textContent === 'Übernehmen');
  await act(async () => { ueb.click(); await sleep(20); });
  ok(werte[0] === '265' && plausi === 1, 'B2: „Übernehmen“ speichert und stößt die Plausibilitätsprüfung an');
  await act(async () => { input.focus(); }); await setze('270'); await act(async () => { await sleep(700); });
  ok(werte[1] === '270', 'B2: kleine Änderung (265 → 270) wird nach 500 ms übernommen');
  await act(async () => { root.unmount(); });
}

console.log(fehler ? `${fehler} Fehler` : 'Prüfbericht: alles grün');
process.exit(fehler ? 1 : 0);
