// Mehrfamilienhaus wie Eigentumswohnung: Mieterhöhung je Wohnung, Sammelbuchung der Mieteingänge,
// Dauerauftrag je Wohnung. Ausführen: npm run test:mfh
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
const M = await import('../src/utils/mfh.js');
const B = await import('../src/utils/berechnung.js');
const { getJahresDurchschnittFuerFeld } = await import('../src/utils/miete.js');
const { generiereAufgaben } = await import('../src/components/VermieterTodos.jsx');
const { mieterAusWohnungen } = await import('../src/utils/belegung.js');
const { default: ImmobilienDetail } = await import('../src/components/ImmobilienDetail.jsx');
const { default: MieteingaengeMonat } = await import('../src/components/MieteingaengeMonat.jsx');

let fehler = 0;
const ok = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
const txt = (h) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const H = new Date(), J = H.getFullYear(), MO = H.getMonth() + 1;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const vorMonaten = (n) => iso(new Date(J, H.getMonth() - n, 1));
const we = (name, mieterName, extra = {}) => ({ id: name, name, kaltmiete: 700, wohnflaeche: 60, mieterName, mietbeginn: mieterName ? '2021-01-01' : '', mietEingaenge: [], kosten: {}, ...extra });
const mfh = (wohnungen, x = {}) => ({ id: 'm', name: 'MFH David', immobilienTyp: 'mehrfamilienhaus', aktiv: true, kaufpreis: 600000, kaufdatum: '2020-01-01', mieteFaelligkeitstag: 1, wertsteigerung: 2, finanzierungsphasen: [], wohnungen, ...x });

// ── Miete je Wohnung inkl. Mieterhöhung ──
const erh = M.weMieterhoehung(we('EG', 'Anna'), vorMonaten(2), 750);
ok(M.weMieteAm(erh) === 750 && M.weMieteAm(erh, new Date(J - 2, 0, 15)) === 700 && erh.letzteMieterhoehung === vorMonaten(2), 'Mieterhöhung: neue Miete ab Datum, vorher alte Miete, letzte Erhöhung gesetzt');
const haus = mfh([erh, we('OG', 'Ben'), we('DG', 'Cem')]);
ok(B.cashflowMonat(haus, H).kaltmiete === 2150, 'Cashflow: Summe der aktuellen Mieten (750 + 700 + 700)');
const agg = M.mfhMietAggregat(haus.wohnungen);
ok(agg.kaltmiete === 2100 && agg.mietAnpassungen.length === 1 && agg.mietAnpassungen[0].kaltmiete === 2150, 'Objektebene: Ausgangsmiete 2.100 + Anpassung auf 2.150');
const steuerHaus = { kaltmiete: agg.kaltmiete, mietAnpassungen: agg.mietAnpassungen };
const erhDatum = new Date(vorMonaten(2));
ok(Math.round(getJahresDurchschnittFuerFeld(steuerHaus, J - 2, 'kaltmiete')) === 2100 && Math.round(getJahresDurchschnittFuerFeld(steuerHaus, J + 1, 'kaltmiete')) === 2150, `Steuer: Jahre vor der Erhöhung 2.100 €, danach 2.150 € (Erhöhung ${erhDatum.toLocaleDateString('de-DE')})`);

// ── Letzte Mieterhöhung → „Was steht an“ je Wohnung ──
// Erhöhungen mit Betrag (+5 %), sonst lässt sich die Kappungsgrenze nicht prüfen
const mitErh = (w, n) => M.weMieterhoehung(w, vorMonaten(n), 735, { vorher: 700 });
const alt = mfh([mitErh(we('EG', 'Anna'), 20), mitErh(we('OG', 'Ben'), 11), we('DG', 'Cem')]);
const t = generiereAufgaben([alt], [], []);
const moegl = t.find(a => a.id === 'mieterhoehung-m'), bald = t.find(a => a.id === 'mieterhoehung-bald-m'), fehlt = t.find(a => a.id === 'mieterhoehung-datum-m');
ok(moegl && /1 Wohnung/.test(moegl.titel) && /EG/.test(moegl.sub) && moegl.targetTab === 'wohnungen', '„Was steht an“: Mieterhöhung möglich bei EG (20 Monate her)');
ok(bald && /OG/.test(bald.sub), '„Was steht an“: OG bald möglich (11 Monate her, Schreiben in ≤ 1 Monat) — Erinnerung einen Monat vor Versand');
ok(fehlt && /DG/.test(fehlt.sub) && !/EG/.test(fehlt.sub), '„Was steht an“: bei DG fehlt das Datum (nur dort)');
const angek = mfh([M.weMieterhoehung(we('EG', 'Anna', { letzteMieterhoehung: vorMonaten(30) }), iso(new Date(J, H.getMonth() + 2, 1)), 780)]);
ok(!generiereAufgaben([angek], [], []).some(a => a.id === 'mieterhoehung-m'), 'Angekündigte Erhöhung: keine zweite Erhöhung vorgeschlagen');
const mitDatensatz = mfh([we('EG', 'Anna')]);
ok(generiereAufgaben([mitDatensatz], [{ id: 'r1', immobilie_id: 'm', name: 'Anna', zimmer_bezeichnung: 'EG', aktiv: true, letzte_mieterhoehung: vorMonaten(24) }], []).some(a => a.id === 'mieterhoehung-betrag-m'), 'Datum aus dem Mieterdatensatz zählt — ohne Betrag: „um wie viel?“ statt Spielraum erfinden');
ok(!generiereAufgaben([alt], [], []).some(a => /^mieterhoehung-datum-r/.test(a.id)), 'Keine doppelte „nicht hinterlegt“-Meldung je Mieter');
ok(mieterAusWohnungen(mfh([we('EG', 'Anna', { letzteMieterhoehung: '2024-05-01' })]), [])[0].letzteMieterhoehung === '2024-05-01', 'Mieter übernehmen: letzte Erhöhung kommt mit');

// ── Sammelbuchung ──
const teil = mfh([we('EG', 'Anna'), we('OG', 'Ben', { mietEingaenge: [{ id: 1, datum: `${J}-${String(MO).padStart(2, '0')}-02`, betrag: 300, typ: 'kaltmiete' }] }), we('DG', 'Cem'), we('Laden', '', { leer: true })]);
const r = M.alleMietenBuchen(teil.wohnungen, J, MO);
ok(r.gebucht.length === 2 && r.summe === 1400 && r.uebrig.length === 1, 'Alle als eingegangen: 2 offene gebucht, Teilzahlung OG bleibt, Leerstand ignoriert');
const st = M.mfhMonatsStatus(r.wohnungen, J, MO);
ok(st[0].status === 'bezahlt' && st[2].status === 'bezahlt' && st[1].status === 'teilweise' && st[3].status === 'keine', 'Danach: EG/DG bezahlt, OG teilweise');
ok(M.alleMietenBuchen(r.wohnungen, J, MO).gebucht.length === 0, 'Zweimal klicken bucht nichts doppelt');
const zurueck = M.sammelbuchungZurueck(r.wohnungen, r.gebucht.map(g => g.id));
ok(M.mfhMonatsStatus(zurueck, J, MO).filter(x => x.status === 'offen').length === 2 && zurueck[1].mietEingaenge.length === 1, 'Rückgängig entfernt genau die Sammelbuchung');
const mitErhBuch = M.alleMietenBuchen([erh], J, MO);
ok(mitErhBuch.summe === 750, 'Sammelbuchung nutzt die Miete nach Erhöhung');
const da = mfh([we('EG', 'Anna', { dauerauftrag: true }), we('OG', 'Ben')]);
ok(M.mfhMonatsStatus(da.wohnungen, J, MO)[0].status === 'bezahlt' && M.alleMietenBuchen(da.wohnungen, J, MO).gebucht.length === 1, 'Dauerauftrag je Wohnung: gilt als eingegangen, wird nicht doppelt gebucht');
const tm = generiereAufgaben([teil], [], []).find(a => a.id === 'miete-ausstehend-m');
ok(tm && tm.felder?.wohnungen && M.mfhMonatsStatus(tm.felder.wohnungen, J, MO).filter(x => x.status === 'offen').length === 0, '„Was steht an“: „Eingegangen“ bucht alle offenen Wohnungen');

// ── Oberflächen ──
const dash = txt(renderToString(<MieteingaengeMonat portfolio={[teil]} mieterListe={[]} onBuchen={()=>{}} onOpenImmobilie={()=>{}} />));
ok(/0 von 3 Wohnungen eingegangen/.test(dash) && /2 Wohnungen als eingegangen buchen/.test(dash), 'Dashboard: MFH-Kachel mit „2 Wohnungen als eingegangen buchen“');
const wohn = txt(renderToString(<ImmobilienDetail immobilie={alt} initialTab="wohnungen" onClose={()=>{}} onSave={()=>{}} onSaveMieter={()=>{}} portfolio={[alt]} mieterListe={[]} aufgaben={[]} />));
ok(/Erhöhung möglich · bis \+105/.test(wohn) && /letzte Erhöhung fehlt/.test(wohn) && /Mieterhöhung/.test(wohn), 'Wohnungen: letzte Erhöhung je Wohnung + Knopf „Mieterhöhung“');
{
  let gespeichert = null;
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(<ImmobilienDetail immobilie={teil} initialTab="mieteinnahmen" onClose={()=>{}} onSave={(p) => { gespeichert = p; }} onSaveMieter={()=>{}} portfolio={[teil]} mieterListe={[]} aufgaben={[]} />); });
  const btn = (re) => [...document.querySelectorAll('button')].find(b => re.test(b.textContent));
  ok(!!btn(/Alle 2 offenen als eingegangen markieren/), 'Mieteingänge: Gesamtansicht mit „Alle 2 offenen als eingegangen markieren“');
  await act(async () => { btn(/Alle 2 offenen als eingegangen markieren/).click(); });
  ok(gespeichert && M.mfhMonatsStatus(gespeichert.wohnungen, J, MO).filter(x => x.status === 'bezahlt').length === 2 && /2 Mieten für .* gebucht/.test(document.body.textContent), 'Klick: gespeichert, Bestätigung „2 Mieten gebucht“');
  await act(async () => { btn(/^Rückgängig$/).click(); });
  ok(M.mfhMonatsStatus(gespeichert.wohnungen, J, MO).filter(x => x.status === 'offen').length === 2, 'Rückgängig speichert den alten Stand');
  await act(async () => { btn(/Vormonat|‹/).click(); });
  ok(/Alle als eingegangen markieren/.test(document.body.textContent) || /Alle \d offenen/.test(document.body.textContent), 'Vormonat wählbar, dort ebenfalls sammeln');
  await act(async () => { root.unmount(); });
}
{
  let gespeichert = null; const mieterCalls = [];
  const root = createRoot(document.getElementById('root'));
  const mieter = [{ id: 'r1', immobilie_id: 'm', name: 'Anna', zimmer_bezeichnung: 'EG', aktiv: true }];
  await act(async () => { root.render(<ImmobilienDetail immobilie={mfh([we('EG', 'Anna'), we('OG', 'Ben')])} initialTab="wohnungen" onClose={()=>{}} onSave={(p) => { gespeichert = p; }} onSaveMieter={async (m) => { mieterCalls.push(m); return m; }} portfolio={[]} mieterListe={mieter} aufgaben={[]} />); });
  const karte = [...document.querySelectorAll('p')].find(p => p.textContent === 'EG').closest('div.rounded-2xl');
  await act(async () => { karte.click(); });
  const setze = async (el, v) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new w.Event('input', { bubbles: true })); }); };
  // Letzte Mieterhöhung nach § 558: Datum + Betrag → Prozent, gespeichert im Mietverlauf der Wohnung
  const amber = [...document.querySelectorAll('p')].find(p => /Letzte Mieterhöhung nach § 558/.test(p.textContent))?.parentElement;
  ok(!!amber, 'Wohnungsformular: Block „Letzte Mieterhöhung nach § 558“');
  await setze(amber.querySelector('input[type="date"]'), '2024-03-01');
  const neuFeld = [...amber.querySelectorAll('label')].find(l => /Neue Kaltmiete/.test(l.textContent)).querySelector('input');
  await setze(neuFeld, '735');
  ok(/Alt 700\s?€ → Neu 735\s?€ \(\+5 %\)/.test(amber.textContent.replace(/\u00a0/g, ' ')), 'Vorschau: Alt 700 € → Neu 735 € (+5 %)');
  await act(async () => { [...amber.querySelectorAll('button')].find(b => b.textContent === 'Übernehmen').click(); });
  await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Speichern').click(); });
  ok(gespeichert?.wohnungen?.[0]?.letzteMieterhoehung === '2024-03-01' && gespeichert.wohnungen[0].mietAnpassungen.some(a => a.datum === '2024-03-01' && a.kaltmiete === 735), 'Gespeichert an der Wohnung — Datum UND Betrag im Mietverlauf');
  ok(mieterCalls.some(m => m.id === 'r1' && m.letzteMieterhoehung === '2024-03-01'), 'Und am Mieterdatensatz gespiegelt (wie bei der Eigentumswohnung)');
  // Mieterhöhungsschreiben aus der Wohnungskarte → neue Miete an der Wohnung + am Mieter
  const mhKnopf = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Mieterhöhung');
  await act(async () => { mhKnopf.click(); });
  ok(/Mieterhöhung/.test(document.body.textContent) && /MFH David · EG/.test(document.body.textContent), 'Mieterhöhungsschreiben öffnet sich für „MFH David · EG“');
  const speichern = [...document.querySelectorAll('button')].find(b => b.className.includes('bg-emerald-500') && b.className.includes('flex-1'));
  await act(async () => { speichern.click(); });
  const egNeu = gespeichert?.wohnungen?.[0];
  ok(egNeu?.mietAnpassungen?.length === 2 && egNeu.mietAnpassungen[1].kaltmiete === 772, 'Erhöhung aus dem Schreiben gespeichert: Wohnung 735 → 772 € (zweite Anpassung)');
  ok(mieterCalls.some(m => m.id === 'r1' && m.kaltmiete === 772), 'Mieterdatensatz: neue Kaltmiete + Datum');
  await act(async () => { root.unmount(); });
}

console.log(fehler ? `${fehler} Fehler` : 'MFH-Abgleich: alles grün');
process.exit(fehler ? 1 : 0);
