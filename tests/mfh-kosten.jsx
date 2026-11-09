// Mehrfamilienhaus: Kosten fürs ganze Haus + je Wohnung. Ausführen: npm run test:mfhkosten
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://www.renditly.de/app', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','HTMLElement','Node','Element','MutationObserver','Event','KeyboardEvent','MouseEvent','FocusEvent','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','HTMLInputElement','HTMLSelectElement']) { try { globalThis[k] = w[k]; } catch {} }
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); globalThis.matchMedia = w.matchMedia;
w.HTMLElement.prototype.scrollTo = function () {}; w.HTMLElement.prototype.scrollIntoView = function () {};
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const M = await import('../src/utils/mfh.js');
const B = await import('../src/utils/berechnung.js');
const { default: ImmobilienDetail } = await import('../src/components/ImmobilienDetail.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const we = (name, fl, kosten = {}) => ({ id: name, name, wohnflaeche: fl, kaltmiete: 800, mieterName: 'M ' + name, mietbeginn: '2022-01-01', mietEingaenge: [], kosten });
const haus = (x = {}) => ({ id: 'm', name: 'MFH', immobilienTyp: 'mehrfamilienhaus', aktiv: true, kaufpreis: 500000, kaufdatum: '2020-01-01', finanzierungsphasen: [], wohnungen: [we('EG', 60), we('OG', 40)], ...x });

const h1 = haus({ hauskosten: { hausverwaltung: 300, grundsteuer: 100, versicherung: 100, strom: 0, internet: 0, instandhaltung: 100, sonstige: 0 } });
const k1 = M.mfhKosten(h1);
ok(k1.hausSumme === 600 && Math.round(k1.je[0].hausAnteilSumme) === 360 && Math.round(k1.je[1].hausAnteilSumme) === 240, 'Hauskosten 600 € verteilt nach Wohnfläche: EG 360 €, OG 240 €');
ok(B.cashflowMonat(h1).betrieb === 600, 'Cashflow/Portfolio: Hauskosten zählen voll (vorher nur Wohnungskosten)');
const h2 = haus({ hauskosten: h1.hauskosten, wohnungen: [we('EG', 60, { sonstige: 50 }), we('OG', 40)] });
ok(B.cashflowMonat(h2).betrieb === 650 && M.mfhKosten(h2).je[0].summe === 410, 'Haus + einzelne Wohnung: 600 + 50 = 650 €, EG trägt 360 + 50');
ok(Math.round(M.mfhKosten({ ...h1, hauskostenVerteilung: 'einheiten' }).je[0].hausAnteilSumme) === 300, 'Verteilung gleich je Einheit: 300 € / 300 €');
ok(Math.round(M.mfhKosten(haus({ hauskosten: h1.hauskosten, wohnungen: [we('EG', 60), we('OG', 0)] })).je[0].hausAnteilSumme) === 300, 'Fehlende Wohnfläche → gleich je Einheit statt falscher Quote');

// Altbestand aus dem Anlage-Assistenten (Kosten auf Objektebene)
const alt = haus({ verwaltung: 200, grundsteuerMonat: 50, versicherungMonat: 30, strom: 20 });
ok(B.cashflowMonat(alt).betrieb === 300, 'Altbestand ohne Wohnungskosten: alle Objektkosten zählen (Grundsteuer/Versicherung vorher vergessen)');
const altMitWE = haus({ verwaltung: 200, wohnungen: [we('EG', 60, { strom: 10 }), we('OG', 40)] });
ok(B.cashflowMonat(altMitWE).betrieb === 10 && M.ungenutzteAltkosten(altMitWE)?.hausverwaltung === 200, 'Altbestand + Wohnungskosten: nichts doppelt, Altkosten werden zum Übernehmen angeboten');
const st = M.mfhAlsKostenObjekt(h2);
ok(st.verwaltung === 300 && st.grundsteuerMonat === 100 && st.versicherungMonat === 100 && st.nebenkosten === 50 && st.hausgeld === 0, 'Steuer/Export: Hauskosten + Wohnungskosten als Werbungskosten-Felder');

// Oberfläche
{
  let gespeichert = null;
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(<ImmobilienDetail immobilie={alt} initialTab="cashflow" onClose={()=>{}} onSave={(p) => { gespeichert = p; }} onSaveMieter={()=>{}} portfolio={[alt]} mieterListe={[]} aufgaben={[]} />); });
  const body = () => document.body.textContent;
  ok(/Ganzes Haus €\/Monat/.test(body()) && /Kostenaufstellung Gesamt/.test(body()), 'Gesamtansicht: Hauskosten direkt eintragbar');
  const feld = document.querySelector('input[aria-label="Hausverwaltung ganzes Haus"]');
  ok(feld && feld.value === '200', 'Werte aus dem Anlegen erscheinen als Hauskosten (200 € Hausverwaltung)');
  const setze = async (el, v) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new w.Event('input', { bubbles: true })); }); await act(async () => { el.dispatchEvent(new w.FocusEvent('blur', { bubbles: true })); el.dispatchEvent(new w.FocusEvent('focusout', { bubbles: true })); }); };
  await setze(feld, '250');
  ok(gespeichert?.hauskosten?.hausverwaltung === 250 && gespeichert.hauskosten.grundsteuer === 50, 'Hausverwaltung 250 € gespeichert, übrige Hauskosten bleiben (Grundsteuer 50 €)');
  const egZeile = [...document.querySelectorAll('tr')].find(tr => /^EG/.test(tr.textContent.trim()));
  await act(async () => { egZeile.click(); });
  ok(/Anteil an den Kosten fürs ganze Haus \(60 % nach Wohnfläche\)/.test(body()) && /\+ 150 € Haus/.test(body().replace(/ /g, ' ')), 'Wohnung EG: 60 % Hausanteil sichtbar (Hausverwaltung + 150 €)');
  await act(async () => { root.unmount(); });
}
{
  let gespeichert = null;
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(<ImmobilienDetail immobilie={altMitWE} initialTab="cashflow" onClose={()=>{}} onSave={(p) => { gespeichert = p; }} onSaveMieter={()=>{}} portfolio={[altMitWE]} mieterListe={[]} aufgaben={[]} />); });
  const btn = [...document.querySelectorAll('button')].find(b => /Als Hauskosten übernehmen/.test(b.textContent));
  ok(!!btn, 'Hinweis: beim Anlegen erfasste Hauskosten wurden nicht gezählt → übernehmen');
  await act(async () => { btn.click(); });
  ok(gespeichert?.hauskosten?.hausverwaltung === 200 && B.cashflowMonat({ ...altMitWE, hauskosten: gespeichert.hauskosten }).betrieb === 210, 'Übernommen: 200 € Haus + 10 € Wohnung');
  await act(async () => { root.unmount(); });
}

console.log(fehler ? `${fehler} Fehler` : 'MFH-Kosten: alles grün');
process.exit(fehler ? 1 : 0);
