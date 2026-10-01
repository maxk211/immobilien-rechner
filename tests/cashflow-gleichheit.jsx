// Test (UX-Gesamtpaket B12): Objektkarte, Cockpit, Zahlen-Reiter und Dashboard
// müssen für jedes Objekt denselben Cashflow zeigen. Ausführen: npm run test:cashflow
import { renderToString } from 'react-dom/server';
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
import ImmobilienDetail from '../src/components/ImmobilienDetail.jsx';
import ImmobilienKarte from '../src/components/ImmobilienKarte.jsx';
import PortfolioOverview from '../src/components/PortfolioOverview.jsx';
import { cashflowMonat } from '../src/utils/berechnung.js';
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
console.log(fehler ? `${fehler} Abweichungen` : 'Alle Ansichten identisch');
if (fehler) process.exit(1);
