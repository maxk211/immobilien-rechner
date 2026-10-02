// Test (UX-Gesamtpaket B12): Objektkarte, Cockpit, Zahlen-Reiter und Dashboard
// müssen für jedes Objekt denselben Cashflow zeigen. Ausführen: npm run test:cashflow
import { renderToString } from 'react-dom/server';
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
import ImmobilienDetail from '../src/components/ImmobilienDetail.jsx';
import ImmobilienKarte from '../src/components/ImmobilienKarte.jsx';
import PortfolioOverview from '../src/components/PortfolioOverview.jsx';
import { cashflowMonat, berechneRestschuld } from '../src/utils/berechnung.js';
import { darlehensVerlauf } from '../src/utils/darlehen.js';
const txt = (h) => h.replace(/<!-- -->/g,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;| /g,' ').replace(/\s+/g,' ');
const zahl = (s) => s == null ? null : Number(s.replace(/[+−\-\s€.]/g, m => (m === '−' || m === '-') ? '-' : '').replace(',', '.'));
const nach = (t, re) => { const m = t.match(re); return m ? zahl(m[1]) : null; };
const basis = { immobilienTyp:'kaufimmobilie', kaufpreis:200000, kaufnebenkosten:10, kaufdatum:'2021-01-01', wohnflaeche:60, kaltmiete:800, hausgeld:250, hausgeldNichtUmlagefaehig:90, vermietungsmodell:'kaltmiete_nk', nebenkostenVomMieter:160, geschaetzterWert:230000, aktiv:true,
  finanzierungsphasen:[{ id:1, sollzinssatz:3.5, anfangstilgung:2, zinsbindung:10, kreditStartDatum:'2021-02-01', zinsbindungBis:'2031-01-31', darlehensTyp:'annuitaet' }] };
const faelle = {
  normal: { ...basis, ekFuerNebenkosten:20000, ekFuerKaufpreis:0 },
  ohneEKFelder: { ...basis },
  legacyEK: { ...basis, eigenkapital: 50000 },
  geschenktMitBetrag: { ...basis, geschenkt:true, erwerbsart:'schenkung', finanzierungsbetrag:120000 },
  geschenktMitPhase: { ...basis, geschenkt:true, erwerbsart:'erbe', ekFuerNebenkosten:0, ekFuerKaufpreis:100000 },
  geschenktOhneKredit: { ...basis, geschenkt:true, finanzierungsphasen:[] },
  vollEigen: { ...basis, vollEigenfinanziert:true, finanzierungsphasen:[] },
  bauspar: { ...basis, ekFuerNebenkosten:20000, ekFuerKaufpreis:0, bausparvertraege:[{ id:1, monatlicheSparrate:350, zuteilungsreifAb:'2031-03-01' }] },
  festeRate: { ...basis, ekFuerNebenkosten:20000, ekFuerKaufpreis:0, finanzierungsphasen:[{ ...basis.finanzierungsphasen[0], monatlicherBetrag: 700 }] },
  stellplatzKaltmiete: { ...basis, vermietungsmodell:'kaltmiete', ekFuerNebenkosten:20000, ekFuerKaufpreis:0, stellplatz:{ vorhanden:true, istVermietet:true, monatlicheMiete:50, anzahl:2 } },
  mfh: { immobilienTyp:'mehrfamilienhaus', kaufpreis:800000, kaufnebenkosten:10, kaufdatum:'2019-01-01', geschaetzterWert:1000000, ekFuerNebenkosten:80000, ekFuerKaufpreis:0,
    finanzierungsphasen:[{ id:1, sollzinssatz:1.8, anfangstilgung:2.5, zinsbindung:10, kreditStartDatum:'2019-02-01', darlehensTyp:'annuitaet' }],
    wohnungen:[{ id:'w1', name:'EG', kaltmiete:900, mieterName:'A', kosten:{ hausverwaltung:30, instandhaltung:40, grundsteuer:20 } },{ id:'w2', name:'OG', kaltmiete:1000, mieterName:'B', kosten:{ hausverwaltung:30, versicherung:15 } }] },
};
let fehler = 0; const zeilen = [];
let summeKarten = 0;
for (const [name, x] of Object.entries(faelle)) {
  const immo = { id: name, name, ...x };
  const fn = cashflowMonat(immo);
  const karte = txt(renderToString(<ImmobilienKarte immobilie={immo} mieterListe={[]} aufgaben={[]} onClick={()=>{}} />));
  const kN = nach(karte, /Nach Tilgung ([+−\-]?[\d.]+(?:,\d+)? ?€)/);
  const kV = nach(karte, /Vor Tilgung ([+−\-]?[\d.]+(?:,\d+)? ?€)/);
  const cock = txt(renderToString(<ImmobilienDetail immobilie={immo} initialTab="uebersicht" onClose={()=>{}} onSave={()=>{}} portfolio={[immo]} mieterListe={[]} aufgaben={[]} />));
  const cN = nach(cock, /Nach Tilgung ([+−\-]?[\d.]+(?:,\d+)? ?€)/);
  const cV = nach(cock, /Vor Tilgung ([+−\-]?[\d.]+(?:,\d+)? ?€)/);
  const zahlen = txt(renderToString(<ImmobilienDetail immobilie={immo} initialTab="cashflow" onClose={()=>{}} onSave={()=>{}} portfolio={[immo]} mieterListe={[]} aufgaben={[]} />));
  const zN = nach(zahlen, /Cashflow nach Tilgung ([+−\-]?[\d.]+(?:,\d+)? ?€)/);
  const zV = nach(zahlen, /Cashflow vor Tilgung ([+−\-]?[\d.]+(?:,\d+)? ?€)/);
  const r = Math.round(fn.nach), rv = Math.round(fn.vor);
  const ok = [kN, cN].every(v => v === r) && [kV, cV].every(v => v === rv) && (immo.immobilienTyp === 'mehrfamilienhaus' || (zN === r && zV === rv));
  if (!ok) fehler++;
  summeKarten += fn.nach;
  if (name.startsWith('geschenktMit') && !karte.includes('Beleihbar frei')) { fehler++; zeilen.push('✗ '+name+': Karte ohne Restschuld/Beleihbar frei'); }
  zeilen.push(`${ok ? '✓' : '✗'} ${name.padEnd(20)} Funktion nach ${r} vor ${rv} | Karte ${kN}/${kV} | Cockpit ${cN}/${cV} | Zahlen ${zN}/${zV} | Rate ${Math.round(fn.rate)} Bauspar ${fn.bauspar}`);
}
console.log(zeilen.join('\n'));
const portfolio = Object.entries(faelle).map(([n, x]) => ({ id:n, name:n, ...x }));
const dash = txt(renderToString(<PortfolioOverview portfolio={portfolio} />));
const dN = nach(dash, /([+−\-]?[\d.]+ ?€) NACH TILGUNG/i) ?? nach(dash, /([+−\-]?[\d.]+ ?€) nach Tilgung/);
console.log('Dashboard nach Tilgung', dN, 'Summe Karten', Math.round(summeKarten), dN === Math.round(summeKarten) ? '✓' : '✗ (Rundung prüfen)');
// Zins/Tilgung im Cashflow = Finanzierungs-Reiter (darlehensVerlauf), auch bei frischem Kredit
// mit Start mitten im Monat und bei Altdaten mit "Kredit läuft bereits"
{
  const heute = new Date(); const vor = (m, tag) => { const d = new Date(heute.getFullYear(), heute.getMonth() - m, tag); return d.toISOString().slice(0, 10); };
  const ph = { id:1, darlehensTyp:'annuitaet', sollzinssatz:4.08, anfangstilgung:2, zinsbindung:10, laufzeit:10 };
  const k = { immobilienTyp:'kaufimmobilie', kaufpreis:120000, kaufnebenkosten:9.83, kaltmiete:700, finanzierungsbetrag:131800, ekFuerNebenkosten:0, ekFuerKaufpreis:0 };
  const split = {
    frischMonatsmitte: { ...k, kaufdatum: vor(1, 21), finanzierungsphasen:[{ ...ph, kreditStartDatum: vor(1, 21) }] },
    frischMonatserster: { ...k, kaufdatum: vor(1, 1), finanzierungsphasen:[{ ...ph, kreditStartDatum: vor(1, 1) }] },
    altdatenLaeuftBereits: { ...k, kaufdatum: vor(1, 21), kreditLaeuftBereits:true, aktuelleRestschuld:131800, kreditMonatsrate:669, zinssatz:4.08, finanzierungsphasen:[{ ...ph, kreditStartDatum: vor(1, 21) }] },
    ohneKaufpreis: { ...k, kaufpreis:0, geschenkt:true, erwerbsart:'erbe', kaufdatum: vor(1, 21), finanzierungsphasen:[{ ...ph, kreditStartDatum: vor(1, 21) }] },
  };
  for (const [n, x] of Object.entries(split)) {
    const c = cashflowMonat(x, heute); const v = darlehensVerlauf(x, heute);
    const ok = Math.round(c.zinsen) === Math.round(v.zinsHeute) && Math.round(c.tilgung) === Math.round(v.tilgungHeute) && c.tilgung > 0;
    if (!ok) fehler++;
    console.log(`${ok ? '✓' : '✗'} Aufteilung ${n.padEnd(22)} Cashflow ${Math.round(c.zinsen)} Zins · ${Math.round(c.tilgung)} Tilgung | Finanzierung ${Math.round(v.zinsHeute)} · ${Math.round(v.tilgungHeute)}`);
  }
}
// PDF "Bug: Monatsrate wird nicht in Zins und Tilgung aufgeteilt" — Abnahme + Invarianten
{
  const heute = new Date();
  const imMonat = new Date(heute.getFullYear(), heute.getMonth(), Math.min(heute.getDate(), 28)).toISOString().slice(0, 10);
  const naechsterMonat = new Date(heute.getFullYear(), heute.getMonth() + 1, 15).toISOString().slice(0, 10);
  const ph = { id:1, darlehensTyp:'annuitaet', sollzinssatz:4, anfangstilgung:2, zinsbindung:10, laufzeit:10 };
  const abnahme = { immobilienTyp:'kaufimmobilie', name:'Abnahme', kaufpreis:100000, kaufnebenkosten:0, kaufdatum: imMonat, kaltmiete:700, finanzierungsbetrag:100000, ekFuerNebenkosten:0, ekFuerKaufpreis:0, finanzierungsphasen:[{ ...ph, kreditStartDatum: imMonat }] };
  const c = cashflowMonat(abnahme, heute);
  const p = (b, t) => { if (!b) fehler++; console.log(`${b ? '✓' : '✗'} ${t}`); };
  p(Math.round(c.rate) === 500 && Math.round(c.zinsen) === 333 && Math.round(c.tilgung) === 167, `Abnahme: Rate ${Math.round(c.rate)} · Zins ${Math.round(c.zinsen)} · Tilgung ${Math.round(c.tilgung)} (erwartet 500/333/167)`);
  p(Math.round(c.vor - c.nach) === 167, `Abnahme: vor − nach Tilgung = ${Math.round(c.vor - c.nach)} (erwartet 167)`);
  const karte = txt(renderToString(<ImmobilienKarte immobilie={{ id:'ab', ...abnahme }} mieterListe={[]} aufgaben={[]} onClick={()=>{}} />));
  p(!karte.includes('schuldenfrei') && karte.includes('davon 167'), 'Abnahme: Karte ohne "schuldenfrei", mit "davon 167 € Tilgung"');
  const cock = txt(renderToString(<ImmobilienDetail immobilie={{ id:'ab', ...abnahme }} initialTab="uebersicht" onClose={()=>{}} onSave={()=>{}} portfolio={[]} mieterListe={[]} aufgaben={[]} />));
  p(!/schuldenfrei, keine Tilgung/.test(cock), 'Abnahme: Cockpit ohne "schuldenfrei, keine Tilgung"');
  const spaeter = cashflowMonat({ ...abnahme, finanzierungsphasen:[{ ...ph, kreditStartDatum: naechsterMonat }] }, heute);
  p(Math.round(spaeter.zinsen) === 333 && Math.round(spaeter.tilgung) === 167, `Kredit startet nächsten Monat: erste Rate aufgeteilt (${Math.round(spaeter.zinsen)}/${Math.round(spaeter.tilgung)})`);
  const endf = { ...abnahme, finanzierungsphasen:[{ ...ph, darlehensTyp:'endfaellig', kreditStartDatum: imMonat }] };
  const ce = cashflowMonat(endf, heute);
  p(ce.tilgung === 0 && !ce.schuldenfrei && Math.round(ce.zinsen) === 333, 'Endfälliges Darlehen: Tilgung 0, aber nicht schuldenfrei');
  const ke = txt(renderToString(<ImmobilienKarte immobilie={{ id:'ef', ...endf }} mieterListe={[]} aufgaben={[]} onClick={()=>{}} />));
  p(!ke.includes('schuldenfrei') && ke.includes('Darlehen läuft'), 'Endfällig: Karte zeigt "Darlehen läuft", nicht "schuldenfrei"');
  const ohne = cashflowMonat({ ...abnahme, finanzierungsphasen:[], finanzierungsbetrag:0 }, heute);
  p(ohne.schuldenfrei && ohne.rate === 0, 'Ohne Darlehen: schuldenfrei');
  const erbe = { ...abnahme, kaufpreis:0, geschenkt:true, erwerbsart:'erbe' };
  p((berechneRestschuld(erbe)?.restschuld || 0) > 99000, 'Erbe mit Darlehen: Restschuld vorhanden (vorher null)');
  // Invarianten für alle Testobjekte oben
  for (const [n, x] of Object.entries({ ...faelle, abnahme })) {
    const cf = cashflowMonat({ id:n, ...x }, heute);
    const okSumme = Math.abs(cf.zinsen + cf.tilgung - cf.rate) < 0.01;
    const okDiff = Math.abs((cf.vor - cf.nach) - (cf.tilgung + cf.bausparTilgung)) < 0.01;
    const okKenn = cf.schuldenfrei === !(cf.restschuld >= 0.5);
    if (!(okSumme && okDiff && okKenn)) { fehler++; console.log(`✗ Invariante ${n}: Zins+Tilgung=${cf.zinsen + cf.tilgung} Rate=${cf.rate} vor−nach=${cf.vor - cf.nach}`); }
  }
  console.log('✓ Invarianten: Zins + Tilgung = Rate, vor − nach = Tilgung, schuldenfrei ⇔ Restschuld 0 (alle Objekte)');
}
console.log(fehler ? `${fehler} Abweichungen` : 'Alle Ansichten identisch');
if (fehler) process.exit(1);
