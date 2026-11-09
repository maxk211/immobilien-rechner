// Mieterhöhung: 15-Monats-Frist + Kappungsgrenze (§ 558 BGB) — Loom-Fall Erfurt.
// Ausführen: npm run test:kappung
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
const { renderToString } = await import('react-dom/server');
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const K = await import('../src/utils/kappung.js');
const { getJahresDurchschnittFuerFeld } = await import('../src/utils/miete.js');
const { generiereAufgaben } = await import('../src/components/VermieterTodos.jsx');
const { baueImmobilie } = await import('../src/components/AnlageWizard.jsx');
const { MietanpassungenTabelle, KappungsgrenzeWahl } = await import('../src/components/MieterSeitenleiste.jsx');
const { default: MieterhoeungModal } = await import('../src/components/MieterhoeungModal.jsx');
const { default: ImmobilienDetail } = await import('../src/components/ImmobilienDetail.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const txt = (h) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const de = (d) => d?.toLocaleDateString('de-DE');
const ids = (t) => t.map(a => a.id);

// ── Loom-Fall (fester Stichtag): Erfurt, +15 % im Februar 2025 ──
const H = new Date(2026, 10, 9);
const erfurt = { kaltmiete: 1150, mietAnpassungen: [{ datum: '2025-02-01', kaltmiete: 1150, vorher: 1000, grund: 'Mieterhöhung' }], mietbeginn: '2020-01-01', prozent: 15, heute: H };
const p1 = K.naechsteErhoehung(erfurt);
ok(p1.status === 'ausgeschoepft' && de(p1.gesperrtBis) === '1.2.2028', `Erfurt +15 % (02/2025): Kappungsgrenze voll bis ${de(p1.gesperrtBis)} — vorher „möglich · +0 €“`);
ok(de(p1.versandAb) === '1.11.2027', `… Schreiben frühestens ${de(p1.versandAb)} verschicken (Wirksamkeit 3. Monat nach Zugang)`);
const p20 = K.naechsteErhoehung({ ...erfurt, prozent: 20 });
ok(p20.status === 'moeglich' && p20.spielraum === 50 && de(p20.abDatum) === '1.2.2027', 'Ohne Landesverordnung (20 %): +50 € ab 02/2027 (1.000 × 1,2 − 1.150)');
ok(K.naechsteErhoehung({ ...erfurt, mietAnpassungen: [], letzteErhoehung: '2025-02-01' }).status === 'betrag_fehlt', 'Nur Datum, kein Betrag: „Betrag fehlt“ statt erfundenem Spielraum');
const frist = K.naechsteErhoehung({ kaltmiete: 1000, mietAnpassungen: [{ datum: '2026-01-01', kaltmiete: 1050, vorher: 1000 }], mietbeginn: '2020-01-01', prozent: 20, heute: H });
ok(frist.status === 'warten' && de(frist.abDatum) === '1.4.2027' && de(frist.versandAb) === '1.1.2027', '15-Monats-Frist: Erhöhung 01/2026 → wirksam frühestens 04/2027, Schreiben ab 01/2027');
const neuverm = K.naechsteErhoehung({ kaltmiete: 1000, mietAnpassungen: [{ datum: '2025-06-01', kaltmiete: 1300, grund: 'Neuvermietung' }], mietbeginn: '2025-06-01', prozent: 20, heute: H });
ok(neuverm.status === 'moeglich' && neuverm.spielraum === 260, 'Neuvermietung: Fristen und Grenze ab neuem Mietverhältnis (1.300 × 1,2)');
const modern = K.naechsteErhoehung({ kaltmiete: 1000, mietAnpassungen: [{ datum: '2023-01-01', kaltmiete: 1000, vorher: 950 }, { datum: '2025-06-01', kaltmiete: 1100, grund: 'Modernisierung' }], mietbeginn: '2015-01-01', prozent: 20, heute: H });
ok(modern.status === 'moeglich' && modern.spielraum === 200, 'Modernisierungserhöhung zählt nicht zur Kappungsgrenze (+200 statt +100)');
ok(K.naechsteErhoehung({ kaltmiete: 1000, mietAnpassungen: [{ datum: '2024-01-01', kaltmiete: 1000, grund: 'Staffelmiete' }], mietbeginn: '2023-01-01', heute: H }).status === 'vertrag', 'Staffelmiete: keine Erhöhung nach § 558');
const zuFrueh = K.pruefeVorhaben(p20, { datum: '2026-12-01', neueMiete: 1300 });
ok(zuFrueh.some(h => /Zu früh/.test(h.text)) || zuFrueh.some(h => /Über der Kappungsgrenze/.test(h.text)), 'Schreiben: zu früh / zu hoch wird gemeldet');
ok(K.pruefeVorhaben(p20, { datum: '2027-02-01', neueMiete: 1300 }).some(h => /höchstens 1\.200/.test(h.text)), 'Schreiben: über Kappungsgrenze → „höchstens 1.200 €“');
ok(K.pruefeVorhaben(p1, { datum: '2027-02-01', neueMiete: 1200 }).some(h => /ausgeschöpft.*02\/2028/.test(h.text)), 'Schreiben (Erfurt): „ausgeschöpft — frühestens 02/2028“');

// ── Ort: Erfurt/Jena 15 % als Vorschlag ──
ok(K.kappungsgrenze({ plz: '99084' }).prozent === 15 && K.kappungsgrenze({ plz: '99084' }).quelle === 'ort', 'Erfurt (PLZ): 15 % vorgeschlagen');
ok(K.kappungsgrenze({ adresse: 'Löbdergraben 1, 07743 Jena' }).ort?.name === 'Jena', 'Jena (Adresse) erkannt');
ok(K.kappungsgrenze({ plz: '93047' }).prozent === 20, 'Anderswo: 20 %');
ok(K.kappungsgrenze({ plz: '99084', kappungsgrenze: 20 }).prozent === 20, 'Eingestellt hat Vorrang (mit Warnhinweis in der Oberfläche)');
const wahl = txt(renderToString(<KappungsgrenzeWahl immo={{ plz: '99084' }} />));
ok(/Erfurt: 15 % per Thüringer Kappungsgrenzen-Verordnung/.test(wahl) && /bitte bestätigen/.test(wahl), 'Oberfläche: „Erfurt: 15 % … bitte bestätigen“');

// ── Steuer & Historie: „Miete davor“ gilt für die Zeit vor der Erhöhung ──
ok(getJahresDurchschnittFuerFeld({ kaltmiete: 1150, mietAnpassungen: erfurt.mietAnpassungen }, 2024, 'kaltmiete') === 1000, 'Steuer 2024: 1.000 € (vor der nachgetragenen Erhöhung), nicht 1.150 €');

// ── „Was steht an“ (relativ zu heute) ──
const heute = new Date();
const vor = (n) => { const d = new Date(heute.getFullYear(), heute.getMonth() - n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
const etw = (x) => ({ id: 'e', name: 'ETW Erfurt', immobilienTyp: 'kaufimmobilie', aktiv: true, kaufpreis: 200000, kaufdatum: '2019-01-01', plz: '99084', finanzierungsphasen: [], mietstatus: 'vermietet', ...x });
const mieter = (x = {}) => [{ id: 'r', immobilie_id: 'e', name: 'Mieterin', aktiv: true, mietbeginn: '2020-01-01', letzte_mieterhoehung: vor(21), ...x }];
const tA = generiereAufgaben([etw({ kaltmiete: 1150, mietAnpassungen: [{ datum: vor(21), kaltmiete: 1150, vorher: 1000, grund: 'Mieterhöhung' }] })], mieter(), []);
ok(!ids(tA).includes('mieterhoehung-e'), '„Was steht an“ Erfurt nach +15 %: KEIN „Mieterhöhung möglich“ mehr');
const tB = generiereAufgaben([etw({ kaltmiete: 1150, mietAnpassungen: [] })], mieter(), []);
ok(!ids(tB).includes('mieterhoehung-e') && ids(tB).includes('mieterhoehung-betrag-e'), '„Was steht an“ nur Datum: „um wie viel?“ statt „+173 €“');
const tC = generiereAufgaben([etw({ plz: '93047', kaltmiete: 1100, mietAnpassungen: [{ datum: vor(21), kaltmiete: 1100, vorher: 1000 }] })], mieter(), []);
const mC = tC.find(a => a.id === 'mieterhoehung-e');
ok(mC && /\+100/.test(mC.titel) && /Kappungsgrenze 20 %/.test(mC.sub), '„Was steht an“ echter Spielraum: +100 € (20 %)');
const tD = generiereAufgaben([etw({ kaltmiete: 1150, mietAnpassungen: [] })], mieter({ letzte_mieterhoehung: null }), []);
ok(ids(tD).includes('mieterhoehung-datum-e') && !ids(tD).includes('mieterhoehung-e'), 'Ohne Angabe zur letzten Erhöhung: „nicht hinterlegt“, kein Spielraum ab Mietbeginn geraten');

// ── Erfassung: Assistent, Mietanpassungen-Tabelle ──
const wiz = baueImmobilie({ typ: 'kaufimmobilie', mietstatus: 'vermietet', vermietungsmodell: 'kaltmiete', kaltmiete: '1150', letzteErhoehung: '2025-02', erhProzent: '15', erhVorher: '', eigentumMonat: '2019-01', kaufpreis: '200000', erwerbsart: 'kauf', wohnungen: [], chips: [] });
ok(wiz.mietAnpassungen?.[0]?.vorher === 1000 && wiz.mietAnpassungen[0].kaltmiete === 1150 && wiz.mietAnpassungen[0].datum === '2025-02-01', 'Assistent: „+15 %“ → Erhöhung 1.000 → 1.150 € gespeichert');
{
  let neu = null;
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(<MietanpassungenTabelle anpassungen={[]} basisMiete={1150} onAdd={(a) => { neu = a; }} />); });
  const btn = (re) => [...document.querySelectorAll('button')].find(b => re.test(b.textContent));
  const setze = async (el, v) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new w.Event('input', { bubbles: true })); }); };
  await act(async () => { btn(/Anpassung eintragen/).click(); });
  await setze(document.querySelector('input[type="date"]'), '2025-02-01');
  const feld = (re) => [...document.querySelectorAll('label')].find(l => re.test(l.textContent))?.querySelector('input');
  await setze(feld(/Neue Kaltmiete/), '1150');
  await act(async () => { btn(/^Speichern$/).click(); });
  ok(!neu && /Wie hoch war die Miete vor dieser Erhöhung/.test(document.body.textContent), 'Tabelle: nachgetragene Erhöhung ohne „Miete davor“ wird nicht still gespeichert');
  await setze(feld(/Miete davor/), '1000');
  await act(async () => { btn(/^Speichern$/).click(); });
  ok(neu?.vorher === 1000 && neu.kaltmiete === 1150, 'Tabelle: mit Miete davor gespeichert (1.000 → 1.150)');
  await act(async () => { root.unmount(); });
}

// ── Schreiben + Mehrfamilienhaus ──
const modal = txt(renderToString(<MieterhoeungModal mieter={{ name: 'Mieterin', kaltmiete: 1150 }} immobilie={{ name: 'ETW Erfurt' }} pruefung={K.naechsteErhoehung({ ...erfurt, heute: new Date() })} onClose={()=>{}} onSave={()=>{}} />));
ok(/ausgeschöpft/.test(modal) || new Date() >= new Date(2027, 10, 1), 'Mieterhöhungsschreiben warnt: Kappungsgrenze ausgeschöpft');
const mfh = { id: 'm', name: 'MFH Erfurt', immobilienTyp: 'mehrfamilienhaus', aktiv: true, kaufpreis: 600000, kaufdatum: '2019-01-01', plz: '99084', finanzierungsphasen: [],
  wohnungen: [{ id: 'EG', name: 'EG', kaltmiete: 1150, wohnflaeche: 70, mieterName: 'Anna', mietbeginn: '2020-01-01', letzteMieterhoehung: vor(21), mietAnpassungen: [{ datum: vor(21), kaltmiete: 1150, vorher: 1000, grund: 'Mieterhöhung' }], mietEingaenge: [], kosten: {} }] };
const wohn = txt(renderToString(<ImmobilienDetail immobilie={mfh} initialTab="wohnungen" onClose={()=>{}} onSave={()=>{}} onSaveMieter={()=>{}} portfolio={[mfh]} mieterListe={[]} aufgaben={[]} />));
ok(/Kappungsgrenze voll bis \d\d\/\d{4}/.test(wohn) && /Erfurt: 15 %/.test(wohn), 'MFH-Wohnungskarte: „Kappungsgrenze voll bis …“ + Erfurt-Hinweis');
ok(!ids(generiereAufgaben([mfh], [], [])).includes('mieterhoehung-m'), 'MFH „Was steht an“: keine Erhöhung vorgeschlagen');

console.log(fehler ? `${fehler} Fehler` : 'Kappungsgrenze: alles grün');
process.exit(fehler ? 1 : 0);
