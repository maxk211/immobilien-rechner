// Mietverlauf: EINE Quelle, rückwirkend eintragen, bearbeiten, löschen, Alt → Neu, %.
// Ausführen: npm run test:mietverlauf
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://www.renditly.de/app', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','HTMLElement','Node','Element','MutationObserver','Event','KeyboardEvent','MouseEvent','FocusEvent','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','HTMLInputElement','HTMLSelectElement','HTMLFormElement']) { try { globalThis[k] = w[k]; } catch {} }
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); globalThis.matchMedia = w.matchMedia;
w.HTMLElement.prototype.scrollTo = function () {}; w.HTMLElement.prototype.scrollIntoView = function () {};
w.confirm = () => true; globalThis.confirm = w.confirm;
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 60000);
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const V = await import('../src/utils/mietverlauf.js');
const { getAktuelleMiete, getJahresDurchschnittFuerFeld } = await import('../src/utils/miete.js');
const { default: ImmobilienDetail } = await import('../src/components/ImmobilienDetail.jsx');
const { default: MieterFormular } = await import('../src/components/MieterFormular.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const nb = (s) => s.replace(/ /g, ' ');
const setze = async (el, v) => { const proto = el.tagName === 'SELECT' ? w.HTMLSelectElement.prototype : w.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); };
const feldIn = (root, re) => [...root.querySelectorAll('label')].find(l => re.test(l.textContent))?.querySelector('input,select');
const knopf = (root, re) => [...root.querySelectorAll('button')].find(b => re.test(b.textContent.trim()));

// ── Rechenkern ──
const q0 = { kaltmiete: 510, mietAnpassungen: [{ datum: '2026-01-01', hausgeld: 300 }] };
let l = V.setzeMietanpassung(q0.mietAnpassungen, { datum: '2024-06-01', kaltmiete: 510, grund: 'Mieterhöhung', vorher: 478 });
let z = V.mietZeilen({ ...q0, mietAnpassungen: l });
ok(z.length === 1 && z[0].alt === 478 && z[0].neu === 510 && z[0].prozent === 6.7, 'Rückwirkend nachgetragen: Alt 478 → Neu 510 (+6,7 %)');
l = V.setzeMietanpassung(l, { datum: '2022-01-01', kaltmiete: 478, grund: 'Mieterhöhung', vorher: 450 });
z = V.mietZeilen({ ...q0, mietAnpassungen: l });
ok(z.length === 2 && z[0].alt === 450 && z[1].alt === 478, 'Noch früher eingefügt: 450 → 478 → 510, Alt jeweils aus der Zeile davor');
l = V.setzeMietanpassung(l, { datum: '2024-07-01', kaltmiete: 515, grund: 'Mieterhöhung' }, '2024-06-01');
ok(V.mietZeilen({ ...q0, mietAnpassungen: l }).some(r => r.datum === '2024-07-01' && r.neu === 515) && !l.some(a => a.datum === '2024-06-01'), 'Bearbeiten: Datum und Betrag geändert, alter Eintrag weg');
l = V.entferneMietanpassung(l, '2024-07-01');
ok(V.mietZeilen({ ...q0, mietAnpassungen: l }).length === 1 && l.some(a => a.datum === '2026-01-01' && a.hausgeld === 300), 'Löschen: Mietanpassung weg, Kostenanpassung (Hausgeld) bleibt');
const q1 = { kaltmiete: 478, mietAnpassungen: [{ datum: '2024-06-01', kaltmiete: 510 }] };
ok(V.aktuelleMiete(q1) === 510 && getAktuelleMiete(q1) === 510, 'Aktuelle Miete = dieselbe Zahl wie im Cashflow');
const korr = V.aktuelleMieteAendern(q1, 520);
ok(!('kaltmiete' in korr) && korr.mietAnpassungen[0].kaltmiete === 520, '„Kaltmiete“ ändern korrigiert die gültige Anpassung, nicht eine zweite Zahl');
ok(V.eingabeAuswerten({ neu: '478,10' }, 450).neu === 478.1 && V.eingabeAuswerten({ prozent: '6,5' }, 478).neu === 509.07, 'Komma: „478,10“ und „6,5 %“ werden richtig gelesen');
const sp = V.mieterSpiegel({ kaltmiete: 478, mietAnpassungen: [] }, { bisherLetzte: '2024-06-01', vorherQuelle: q1 });
ok(sp.letzteMieterhoehung === null && sp.kaltmiete === 478, 'Erhöhung gelöscht → „letzte Mieterhöhung“ am Mieter fällt auch weg');
ok(getJahresDurchschnittFuerFeld({ kaltmiete: 510, mietAnpassungen: [{ datum: '2024-06-01', kaltmiete: 510, vorher: 478 }] }, 2023, 'kaltmiete') === 478, 'Steuer 2023 rechnet mit der Miete davor');

// ── Eigentumswohnung: Mieter-Seite und Cashflow = eine Liste ──
const etw = { id: 'e', name: 'ETW', immobilienTyp: 'kaufimmobilie', aktiv: true, kaufpreis: 200000, kaufdatum: '2019-01-01', plz: '93047', finanzierungsphasen: [], mietstatus: 'vermietet', kaltmiete: 510, mietAnpassungen: [] };
const mieter = [{ id: 'r', immobilie_id: 'e', name: 'Mieterin', aktiv: true, mietbeginn: '2020-01-01', kaltmiete: 510, mietanpassungen_mieter: [] }];
{
  let gespeichert = null; const mCalls = [];
  const root = createRoot(document.getElementById('root'));
  const render = async (immo) => act(async () => { root.render(<ImmobilienDetail immobilie={immo} initialTab="mieter" onClose={()=>{}} onSave={(p) => { gespeichert = p; }} onSaveMieter={async (m) => { mCalls.push(m); return m; }} portfolio={[immo]} mieterListe={mieter} aufgaben={[]} />); });
  await render(etw);
  await act(async () => { knopf(document, /Anpassung eintragen/).click(); });
  const box = document.querySelector('.bg-gray-50.border-b');
  await setze(feldIn(document, /Gültig ab/), '2024-06-01');
  await setze(feldIn(document, /Neue Kaltmiete/), '510');
  await act(async () => { knopf(document, /^Übernehmen$/).click(); });
  ok(/Wie hoch war die Miete vor dem 1\.6\.2024/.test(document.body.textContent) && !gespeichert, 'Rückwirkend ohne „Miete davor“: klare Frage direkt am Formular, nichts still falsch gespeichert');
  await setze(feldIn(document, /Miete davor/), '478');
  ok(/Alt 478\s?€ → Neu 510\s?€ \(\+6,7 %\)/.test(nb(document.body.textContent)), 'Vorschau beim Eintragen: Alt 478 € → Neu 510 € (+6,7 %)');
  await act(async () => { knopf(document, /^Übernehmen$/).click(); });
  ok(gespeichert?.mietAnpassungen?.some(a => a.datum === '2024-06-01' && a.kaltmiete === 510 && a.vorher === 478), 'Sofort am Objekt gespeichert');
  ok(mCalls.some(m => m.id === 'r' && m.letzteMieterhoehung === '2024-06-01' && m.kaltmiete === 510 && (m.mietanpassungenMieter || []).length === 0), 'Mieter: letzte Mieterhöhung + Kaltmiete nur gespiegelt, keine Zweitliste');
  const immo2 = { ...etw, ...gespeichert };
  mieter[0] = { ...mieter[0], letzte_mieterhoehung: '2024-06-01' }; // App hat den Mieter aktualisiert
  await render(immo2);
  ok(/\+6,7 %/.test(document.body.textContent) && /478/.test(document.body.textContent), 'Tabelle zeigt Alt, Neu und Prozent');
  gespeichert = null; mCalls.length = 0;
  await act(async () => { document.querySelector('button[aria-label="Anpassung 2024-06-01 löschen"]').click(); });
  ok(gespeichert && !gespeichert.mietAnpassungen.some(a => a.kaltmiete != null), 'Löschen entfernt die Anpassung am Objekt');
  ok(mCalls.some(m => m.id === 'r' && m.letzteMieterhoehung === null), 'Und die „letzte Mieterhöhung“ am Mieter');
  // Cashflow-Reiter: dieselbe Liste
  gespeichert = null;
  await act(async () => { root.unmount(); });
  const root2 = createRoot(document.getElementById('root'));
  await act(async () => { root2.render(<ImmobilienDetail immobilie={immo2} initialTab="cashflow" onClose={()=>{}} onSave={(p) => { gespeichert = p; }} onSaveMieter={async (m) => m} portfolio={[immo2]} mieterListe={mieter} aufgaben={[]} />); });
  ok(document.querySelector('button[aria-label="Anpassung 2024-06-01 bearbeiten"]') && /Dieselbe Liste wie auf der Mieter-Seite/.test(document.body.textContent), 'Cashflow-Reiter zeigt dieselbe Anpassung (eine Quelle)');
  await act(async () => { root2.unmount(); });
}

// ── Mieterformular: alte Zweitliste wird übernommen, § 558 direkt eintragbar ──
{
  let gespeichertMieter = null; let verlauf = null;
  const root = createRoot(document.getElementById('root'));
  const m = { id: 'r', immobilie_id: 'e', name: 'Mieterin', kaltmiete: 510, mietbeginn: '2020-01-01', letzte_mieterhoehung: null, mietanpassungen_mieter: [{ id: 1, datum: '2022-01-01', betrag: 478, grund: 'Mietspiegel' }] };
  await act(async () => { root.render(<MieterFormular mieter={m} portfolio={[{ ...etw, kaltmiete: 450 }]} onSave={async (f) => { gespeichertMieter = f; return f; }} onClose={()=>{}} onMietverlauf={async (liste) => { verlauf = liste; }} />); });
  await act(async () => { knopf(document, /Anpassungen/).click(); });
  ok(document.querySelector('button[aria-label="Anpassung 2022-01-01 bearbeiten"]'), 'Alte Anpassung, die nur am Mieter stand, erscheint im Verlauf');
  const amber = [...document.querySelectorAll('p')].find(p => /Letzte Mieterhöhung nach § 558/.test(p.textContent)).parentElement;
  ok(/1\.1\.2022/.test(amber.textContent), '§ 558-Block: letzte Erhöhung aus dem Verlauf (01.01.2022)');
  await act(async () => { knopf(amber, /^Neue Erhöhung$/).click(); });
  await setze(amber.querySelector('input[type="date"]'), '2024-06-01');
  await setze(feldIn(amber, /oder Erhöhung in %/), '6,7');
  ok(/Alt 478\s?€ → Neu 510(,03)?\s?€ \(\+6,7 %\)/.test(nb(amber.textContent)), '§ 558: Datum + „6,7 %“ → Alt 478 € → Neu 510,03 €');
  await act(async () => { knopf(amber, /^Übernehmen$/).click(); });
  ok(/1\.6\.2024 · 478/.test(nb(amber.textContent)), '§ 558-Block zeigt die Erhöhung mit Alt → Neu');
  await act(async () => { document.querySelector('form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); });
  await new Promise(r => setTimeout(r, 50));
  ok(verlauf?.some(a => a.datum === '2022-01-01' && a.kaltmiete === 478) && verlauf.some(a => a.datum === '2024-06-01' && Math.round(a.kaltmiete) === 510), 'Speichern: beide Anpassungen landen am Objekt (auch die rückwirkende)');
  ok(gespeichertMieter?.letzteMieterhoehung === '2024-06-01' && (gespeichertMieter.mietanpassungenMieter || []).length === 0, 'Mieter: letzte Erhöhung gespiegelt, Zweitliste geleert');
  await act(async () => { root.unmount(); });
}

console.log(fehler ? `${fehler} Fehler` : 'Mietverlauf: alles grün');
process.exit(fehler ? 1 : 0);
