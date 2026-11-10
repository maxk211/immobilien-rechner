// Code-Prüfung: eine Quelle für Mieterdaten/Kaution/NK, Jahreswerte, Schließen-Rückfrage,
// keine veraltete Kopie in den Mieteingängen, Zahlenfelder mit Komma. Ausführen: npm run test:audit
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://www.renditly.de/app', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','HTMLElement','Node','Element','MutationObserver','Event','KeyboardEvent','MouseEvent','FocusEvent','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','HTMLInputElement','HTMLSelectElement']) { try { globalThis[k] = w[k]; } catch {} }
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); globalThis.matchMedia = w.matchMedia;
w.HTMLElement.prototype.scrollTo = function () {}; w.HTMLElement.prototype.scrollIntoView = function () {};
w.confirm = () => true; globalThis.confirm = w.confirm;
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 60000);
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { act } = React;
const B = await import('../src/utils/belegung.js');
const V = await import('../src/utils/mietverlauf.js');
const { getJahresDurchschnittFuerFeld } = await import('../src/utils/miete.js');
const { generiereAufgaben } = await import('../src/components/VermieterTodos.jsx');
const { default: ImmobilienDetail } = await import('../src/components/ImmobilienDetail.jsx');
const { default: KautionsManager } = await import('../src/components/KautionsManager.jsx');
const { default: MieteinnahmenTracker } = await import('../src/components/MieteinnahmenTracker.jsx');
const { default: ZahlFeld } = await import('../src/components/ZahlFeld.jsx');
const { useSchliessenMitRueckfrage } = await import('../src/components/UngespeichertDialog.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const setze = async (el, v) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new w.Event('input', { bubbles: true })); }); };
const knopf = (root, re) => [...root.querySelectorAll('button')].find(b => re.test(b.textContent.trim()));
const neuRoot = () => createRoot(document.getElementById('root'));

// ── 1 · Mehrfamilienhaus: Mieterdatensatz ist die Quelle ──
const we = (name, mieterName, x = {}) => ({ id: name, name, kaltmiete: 700, wohnflaeche: 60, mieterName, mietbeginn: '2021-01-01', mietEingaenge: [], kosten: {}, ...x });
const haus = (wohnungen) => ({ id: 'm', name: 'MFH', immobilienTyp: 'mehrfamilienhaus', aktiv: true, kaufpreis: 600000, kaufdatum: '2020-01-01', finanzierungsphasen: [], wohnungen });
const ausgezogen = [{ id: 'r1', immobilie_id: 'm', name: 'Anna', zimmer_bezeichnung: 'EG', aktiv: false, auszugsdatum: '2026-06-30', mietbeginn: '2021-01-01' }];
const st = B.einheitenStatus(haus([we('EG', 'Anna', { mieterId: 'r1' }), we('OG', 'Ben')]), ausgezogen);
ok(st.einheiten[0].status === 'leer' && st.einheiten[1].status === 'vermietet', 'Auszug in der Mieterverwaltung → Wohnung leer (vorher blieb sie „vermietet“)');
const nachAuszug = B.wohnungenMitMieter([we('EG', 'Anna', { mieterId: 'r1' })], ausgezogen[0]);
ok(nachAuszug[0].mietende === '2026-06-30', 'Auszug zieht das Mietende an der Wohnung nach');
const geaendert = B.wohnungenMitMieter([we('EG', 'Anna', { mieterId: 'r1' })], { id: 'r1', name: 'Anna Huber', mietbeginn: '2021-03-01', aktiv: true, kaution_betrag: 2100, kaution_bezahlt: true });
ok(geaendert[0].mieterName === 'Anna Huber' && geaendert[0].mietbeginn === '2021-03-01' && geaendert[0].kautionBetrag === 2100 && geaendert[0].kautionBezahlt, 'Name, Mietbeginn, Kaution aus dem Mieterdatensatz an der Wohnung');
const nachfolger = B.wohnungenMitMieter([we('EG', 'Cem', { mieterId: 'r2' })], { ...ausgezogen[0], zimmer_bezeichnung: 'EG' });
ok(nachfolger[0].mieterName === 'Cem', 'Ehemaliger Mieter überschreibt keinen Nachfolger');
ok(B.mieterAusWohnungen(haus([we('EG', 'Anna', { kautionBetrag: 2100, kautionBezahlt: true })]), [])[0].kautionBetrag === 2100, 'Mieter übernehmen: Kaution kommt mit');
const kautionHaus = haus([we('EG', 'Anna', { kautionBetrag: 2100, kautionBezahlt: true })]);
ok(!generiereAufgaben([kautionHaus], [{ id: 'r1', immobilie_id: 'm', name: 'Anna', zimmer_bezeichnung: 'EG', aktiv: true, mietbeginn: '2021-01-01', kaution_betrag: 2100, kaution_bezahlt: true }], []).some(a => a.id === 'kaution-fehlt-r1'), 'Kaution am Mieter → keine falsche „Keine Kaution hinterlegt“-Erinnerung');
{
  let gespeichert = null; const mCalls = [];
  const root = neuRoot();
  const mieter = [{ id: 'r1', immobilie_id: 'm', name: 'Anna', zimmer_bezeichnung: 'EG', aktiv: true, mietbeginn: '2021-01-01', kaution_betrag: 0 }];
  await act(async () => { root.render(<ImmobilienDetail immobilie={haus([we('EG', 'Anna', { mieterId: 'r1' })])} initialTab="wohnungen" onClose={()=>{}} onSave={(p) => { gespeichert = p; }} onSaveMieter={async (m) => { mCalls.push(m); return { ...m, id: m.id || 'neu' }; }} portfolio={[]} mieterListe={mieter} aufgaben={[]} />); });
  const karte = [...document.querySelectorAll('p')].find(p => p.textContent === 'EG').closest('div.rounded-2xl');
  await act(async () => { karte.click(); });
  const beginn = [...document.querySelectorAll('label')].find(l => l.textContent === 'Mietbeginn').parentElement.querySelector('input');
  await setze(beginn, '2021-04-01');
  await act(async () => { knopf(document, /^Speichern$/).click(); });
  ok(mCalls.some(m => m.id === 'r1' && m.mietbeginn === '2021-04-01'), 'Wohnungsformular: geänderter Mietbeginn geht an den Mieterdatensatz');
  await act(async () => { root.unmount(); });
}

// ── 2 · Kaution: eine Quelle (Mieterdatensatz) ──
{
  const mCalls = []; let params = { kautionen: [] };
  const root = neuRoot();
  const mieter = [{ id: 'r', immobilie_id: 'e', name: 'Mieterin', aktiv: true, kaution_betrag: 900, kaution_bezahlt: false }];
  await act(async () => { root.render(<KautionsManager params={params} updateParams={(p) => { params = p; }} mieterListe={mieter} onSaveMieter={async (m) => { mCalls.push(m); return m; }} />); });
  ok(/Mieterin/.test(document.body.textContent) && /900/.test(document.body.textContent) && !/Aus Mieterdaten übernehmen/.test(document.body.textContent), 'Kautionsliste zeigt die Kaution vom Mieter direkt (keine Kopie zum Übernehmen)');
  await act(async () => { knopf(document, /Bearbeiten/).click(); });
  const betrag = [...document.querySelectorAll('label')].find(l => /Vereinbarter Kautionsbetrag/.test(l.textContent)).parentElement.querySelector('input');
  await setze(betrag, '1.050,00');
  await act(async () => { knopf(document, /^Speichern$/).click(); });
  ok(mCalls.some(m => m.id === 'r' && m.kautionBetrag === 1050), 'Kaution geändert → am Mieterdatensatz gespeichert (1.050 €, Komma erkannt)');
  await act(async () => { root.unmount(); });
}

// ── 3 · NK-Vorauszahlung + Gesamtüberweisung: Spiegel vom Objekt ──
{
  const mCalls = [];
  const root = neuRoot();
  const etw = { id: 'e', name: 'ETW', immobilienTyp: 'kaufimmobilie', aktiv: true, kaufpreis: 200000, kaufdatum: '2019-01-01', finanzierungsphasen: [], mietstatus: 'vermietet', kaltmiete: 800, vermietungsmodell: 'kaltmiete_nk', nebenkostenVomMieter: 180, mietAnpassungen: [] };
  const mieter = [{ id: 'r', immobilie_id: 'e', name: 'M', aktiv: true, mietbeginn: '2020-01-01', kaltmiete: 800, nk_vorauszahlung: 150, gesamtueberweisung: 950 }];
  await act(async () => { root.render(<ImmobilienDetail immobilie={etw} initialTab="mieter" onClose={()=>{}} onSave={()=>{}} onSaveMieter={async (m) => { mCalls.push(m); return m; }} portfolio={[etw]} mieterListe={mieter} aufgaben={[]} />); });
  await act(async () => { knopf(document, /Anpassung eintragen/).click(); });
  const lab = (re) => [...document.querySelectorAll('label')].find(l => re.test(l.textContent)).querySelector('input');
  await setze(lab(/Gültig ab/), '2026-01-01');
  await setze(lab(/Neue Kaltmiete/), '850');
  await act(async () => { knopf(document, /^Übernehmen$/).click(); });
  const m = mCalls.find(x => x.id === 'r');
  ok(m && m.kaltmiete === 850 && m.nkVorauszahlung === 180 && m.gesamtueberweisung === 1030, 'Mieter: Kaltmiete 850, NK 180 vom Objekt, Gesamtüberweisung neu berechnet (1.030 €)');
  await act(async () => { root.unmount(); });
}

// ── 4 · Alte Jahreswerte → eine Liste ──
const alt = { kaltmiete: 1000, mietAnpassungen: [], verwaltung: 30, mietHistorie: { 2022: { kaltmiete: 900, verwaltung: 40 } } };
const u = V.jahreswerteUebernehmen(alt);
const neu = { ...alt, ...u };
ok(getJahresDurchschnittFuerFeld(neu, 2022, 'kaltmiete') === 900 && getJahresDurchschnittFuerFeld(neu, 2023, 'kaltmiete') === 1000 && getJahresDurchschnittFuerFeld(neu, 2022, 'verwaltung') === 40 && getJahresDurchschnittFuerFeld(neu, 2023, 'verwaltung') === 30, 'Jahreswerte übernommen: 2022 = 900 €/40 €, ab 2023 wieder 1.000 €/30 €');
ok(Object.keys(u.mietHistorie).length === 0 && !V.letzteErhoehungZeile(neu), 'Danach keine Jahreswerte mehr; Korrektur zählt nicht als Mieterhöhung');

// ── 5 · Schließen mit offenen Änderungen ──
{
  const log = [];
  function Probe() {
    const { schliessen, dialog } = useSchliessenMitRueckfrage({ hatAenderungen: true, onSpeichern: async () => log.push('gespeichert'), onSchliessen: () => log.push('zu') });
    return <div><button onClick={schliessen}>X</button>{dialog}</div>;
  }
  const root = neuRoot();
  await act(async () => { root.render(<Probe />); });
  await act(async () => { knopf(document, /^X$/).click(); });
  ok(/Ungespeicherte Änderungen/.test(document.body.textContent) && !log.length, 'X mit offenen Änderungen → Rückfrage statt still schließen');
  await act(async () => { knopf(document, /Speichern und schließen/).click(); });
  ok(log.join(',') === 'gespeichert,zu', '„Speichern und schließen“ speichert zuerst');
  await act(async () => { root.unmount(); });
}

// ── 6 · Mieteingänge: keine veraltete Kopie ──
{
  let gesendet = null;
  const root = neuRoot();
  const immo = { kaufdatum: '2026-01-01' };
  const p1 = { kaltmiete: 700, mietAnpassungen: [], mietEingaenge: [] };
  const render = async (p) => act(async () => { root.render(<MieteinnahmenTracker params={p} updateParams={(x) => { gesendet = x; }} immobilie={immo} mieterListe={[]} />); });
  await render(p1);
  const vonAussen = { ...p1, mietEingaenge: [{ id: 1, datum: '2026-01-01', monat: '2026-01', betrag: 700, typ: 'kaltmiete' }] };
  await render(vonAussen); // z. B. Sammelbuchung über die Leiste oben
  const btn = [...document.querySelectorAll('button')].find(b => /als eingegangen buchen/.test(b.getAttribute('title') || '')) || [...document.querySelectorAll('button')].find(b => /Eingegangen|Erhalten|abhaken/i.test(b.textContent));
  if (btn) await act(async () => { btn.click(); });
  ok(btn && gesendet && gesendet.mietEingaenge.some(e => e.id === 1), 'Nächste Buchung behält die Sammelbuchung (vorher überschrieben)');
  await act(async () => { root.unmount(); });
}

// ── 7 · Zahlenfelder mit Komma ──
{
  const werte = [];
  const root = neuRoot();
  await act(async () => { root.render(<ZahlFeld value={''} onChange={(e) => werte.push(e.target.value)} />); });
  const inp = document.querySelector('input');
  await setze(inp, '478,10'); await setze(inp, '1.250,50'); await setze(inp, '');
  ok(werte.includes('478.1') && werte.includes('1250.5') && werte[werte.length - 1] === '', 'Zahlenfeld: „478,10“ → 478.1, „1.250,50“ → 1250.5, leer bleibt leer');
  await act(async () => { root.unmount(); });
}

console.log(fehler ? `${fehler} Fehler` : 'Code-Prüfung: alles grün');
process.exit(fehler ? 1 : 0);
