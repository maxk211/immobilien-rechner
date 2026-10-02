// Robustheits-Test: Leere Felder, Zahlen als Text, deutsche Schreibweise und Unsinn
// dürfen nie zu NaN, Text-Verkettung ("800"+160="800160") oder Abstürzen führen.
// Ausführen: npm run test:robust
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) }); // PLZ-Daten im Test nicht laden
import { cashflowMonat, berechneRendite, berechneRestschuld, berechneJahresZinsenFuerSteuer, berechneImmoVermoegenswerte, schaetzeImmobilienwert, berechneZinsUndTilgung, kostenStruktur } from '../src/utils/berechnung.js';
import { darlehensVerlauf, anfangsFremdkapital } from '../src/utils/darlehen.js';
import { kapitalWerte } from '../src/utils/kapital.js';
import { bausparMonat } from '../src/utils/bauspar.js';
import { getAktuelleMiete, getAktuellerWert } from '../src/utils/miete.js';
import { zahlAusText } from '../src/utils/zahlen.js';
import { zahlenBereinigen, fehlendeSpalte, saveImmobilie, saveNKAbrechnung, saveMieter, supabase } from '../src/supabaseClient.js';

let fehler = 0;
const ok = (b, t) => { if (!b) { fehler++; console.log('✗', t); } };
const H = new Date(2026, 9, 2);
const ph = { id:1, darlehensTyp:'annuitaet', sollzinssatz:3.5, anfangstilgung:2, zinsbindung:10, kreditStartDatum:'2021-02-01', zinsbindungBis:'2031-01-31', laufzeit:10, monatlicherBetrag:null };
const basis = { wertsteigerung:2, mietsteigerung:1.5, immobilienTyp:'kaufimmobilie', kaufpreis:200000, kaufnebenkosten:10, kaufdatum:'2021-01-01', wohnflaeche:60, kaltmiete:800, hausgeld:250, hausgeldNichtUmlagefaehig:90, vermietungsmodell:'kaltmiete_nk', nebenkostenVomMieter:160, geschaetzterWert:230000, ekFuerNebenkosten:20000, ekFuerKaufpreis:0, eigenkapital:20000, finanzierungsbetrag:null, zinssatz:3.5, gebaeudeAnteilProzent:80, afaSatz:2, steuersatz:42, instandhaltung:30, verwaltung:25, grundsteuerMonat:20, versicherungMonat:10, finanzierungsphasen:[ph], bausparvertraege:[{ id:1, monatlicheSparrate:100, bausparsumme:30000, vertragSeit:'2022-01-01', rolle:'tilgungsersatz' }] };
const felder = ['kaufpreis','kaufnebenkosten','kaufdatum','wohnflaeche','kaltmiete','hausgeld','hausgeldNichtUmlagefaehig','nebenkostenVomMieter','geschaetzterWert','ekFuerNebenkosten','ekFuerKaufpreis','eigenkapital','finanzierungsbetrag','zinssatz','gebaeudeAnteilProzent','afaSatz','steuersatz','instandhaltung','verwaltung','grundsteuerMonat','versicherungMonat','wertsteigerung'];
const phFelder = ['sollzinssatz','anfangstilgung','zinsbindung','kreditStartDatum','zinsbindungBis','monatlicherBetrag','laufzeit'];
const bsFelder = ['monatlicheSparrate','bausparsumme','vertragSeit'];
const werte = ['', '45', '1.200', '3,5', ' 800 ', 'abc', null, undefined, NaN];

const pruefe = (immo, wo) => {
  const out = {};
  const run = (n, f) => { try { out[n] = f(); } catch (e) { fehler++; console.log('✗ CRASH', wo, n, e.message); } };
  run('cf', () => cashflowMonat(immo, H));
  run('rendite', () => berechneRendite(immo));
  run('restschuld', () => berechneRestschuld(immo));
  run('steuerZins', () => berechneJahresZinsenFuerSteuer(immo, 2025));
  run('verm', () => berechneImmoVermoegenswerte(immo));
  run('wert', () => schaetzeImmobilienwert(immo));
  run('zt', () => berechneZinsUndTilgung(immo, 2025));
  run('verlauf', () => { const v = darlehensVerlauf(immo, H); return v && { rs: v.restschuldHeute, rate: v.rateHeute, z: v.zinsHeute }; });
  run('fk', () => anfangsFremdkapital(immo));
  run('kapital', () => kapitalWerte(immo, 80));
  run('bauspar', () => bausparMonat(immo, H));
  run('ks', () => kostenStruktur(immo));
  const scan = (pfad, v, tiefe = 0) => {
    if (tiefe > 2 || v === null || v === undefined) return;
    if (typeof v === 'number' && !Number.isFinite(v)) ok(false, `${wo}: ${pfad} = ${v}`);
    else if (typeof v === 'string' && /^-?\d/.test(v) && !/^\d{4}-\d{2}/.test(v)) ok(false, `${wo}: ${pfad} = "${v}" (Text statt Zahl)`);
    else if (typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) for (const [k, x] of Object.entries(v)) scan(`${pfad}.${k}`, x, tiefe + 1);
  };
  for (const [k, v] of Object.entries(out)) scan(k, v);
  return out;
};
let faelle = 0;
for (const f of felder) for (const w of werte) { faelle++; pruefe({ ...basis, [f]: w }, `${f}=${JSON.stringify(w)}`); }
for (const f of phFelder) for (const w of werte) { faelle++; pruefe({ ...basis, finanzierungsphasen: [{ ...ph, [f]: w }] }, `phase.${f}=${JSON.stringify(w)}`); }
for (const f of bsFelder) for (const w of werte) { faelle++; pruefe({ ...basis, bausparvertraege: [{ ...basis.bausparvertraege[0], [f]: w }] }, `bauspar.${f}=${JSON.stringify(w)}`); }

// Text-Zahlen müssen genauso rechnen wie echte Zahlen
const zahlen = cashflowMonat(basis, H);
const text = cashflowMonat({ ...basis, kaltmiete:'800', instandhaltung:'30', verwaltung:'25', hausgeld:'250', nebenkostenVomMieter:'160', hausgeldNichtUmlagefaehig:'90',
  finanzierungsphasen:[{ ...ph, sollzinssatz:'3,5', anfangstilgung:'2' }], bausparvertraege:[{ ...basis.bausparvertraege[0], monatlicheSparrate:'100' }] }, H);
ok(Math.round(text.nach) === Math.round(zahlen.nach) && Math.round(text.vor) === Math.round(zahlen.vor), `Text-Zahlen rechnen gleich (${Math.round(text.nach)} vs ${Math.round(zahlen.nach)})`);
const mfh = cashflowMonat({ immobilienTyp:'mehrfamilienhaus', kaufpreis:500000, wertsteigerung:2, wohnungen:[{ kaltmiete:'900', kosten:{ instandhaltung:'40' } },{ kaltmiete:'700' }], finanzierungsphasen:[] }, H);
ok(mfh.einnahmen === 1600 && mfh.betrieb === 40, `MFH-Wohnungen mit Text (${mfh.einnahmen}/${mfh.betrieb})`);
ok(getAktuelleMiete({ kaltmiete:'800', mietAnpassungen:[{ datum:'2025-01-01', kaltmiete:'' }] }) === 800, 'leere Mietanpassung ignoriert');
ok(getAktuellerWert({ instandhaltung:'30', mietHistorie:{} }, 'instandhaltung') === 30, 'getAktuellerWert liefert Zahl');

// Datenbank-Bereinigung
ok(zahlAusText('1.234,50') === 1234.5 && zahlAusText('1234.5') === 1234.5 && zahlAusText('') === null && zahlAusText('abc') === null && zahlAusText(' 800 € ') === 800, 'zahlAusText');
const r = zahlenBereinigen({ kaufpreis:'', zimmer:'2,5', baujahr:'1999', laufzeit:'25.4', kaufdatum:'', zinsbindung_bis:'2036-09-30', steuersatz:'  ', name:'' });
ok(r.kaufpreis === null && r.zimmer === 2.5 && r.baujahr === 1999 && r.laufzeit === 25 && r.kaufdatum === null && r.zinsbindung_bis === null && r.steuersatz === null && r.name === '', 'zahlenBereinigen');
ok(fehlendeSpalte({ message:"Could not find the 'afa_modus' column of 'immobilien' in the schema cache" }) === 'afa_modus', 'fehlende Spalte (PostgREST)');
ok(fehlendeSpalte({ message:'column "afa_degressiv_wechseljahr" of relation "immobilien" does not exist' }) === 'afa_degressiv_wechseljahr', 'fehlende Spalte (Postgres)');
ok(fehlendeSpalte({ message:'invalid input syntax for type numeric: ""' }) === null, 'Typfehler ist keine fehlende Spalte');

// Speichern: fehlende Spalte → nur diese weglassen, Rest bleibt; Typfehler nicht verschluckt
{
  const gesendet = [];
  let fehlt = new Set(['afa_modus', 'afa_degressiv_wechseljahr']);
  supabase.auth.getUser = async () => ({ data: { user: { id: 'u1' } } });
  supabase.from = () => {
    const q = { _d: null,
      update(d) { q._d = d; return q; }, insert(d) { q._d = d; return q; }, eq() { return q; }, select() { return q; },
      async single() {
        gesendet.push(q._d);
        for (const k of Object.keys(q._d)) if (fehlt.has(k)) return { data: null, error: { message: `Could not find the '${k}' column of 'immobilien' in the schema cache` } };
        for (const [k, v] of Object.entries(q._d)) if (v === '' && !['name','plz','adresse','mieter_name','immobilie_name','energieeffizienz','bundesland','objektart','zustand','fahrtkosten_modus','kaufnebenkosten_modus'].includes(k)) return { data: null, error: { message: `invalid input syntax for type numeric: "" (${k})` } };
        return { data: { id: 'x-1', ...q._d }, error: null };
      } };
    return q;
  };
  const gespeichert = await saveImmobilie({ id: 'a-1', ...basis, kaufpreis: '', eigenkapital: '', finanzierungsbetrag: '', zusatzdaten: undefined, nachforderungen: [{ id: 1 }], wohnungen: [{ kaltmiete: '900' }], afaModus: 'degressiv' });
  const letzte = gesendet[gesendet.length - 1];
  ok(gespeichert && gesendet.length === 3, `Speichern mit 2 fehlenden Spalten: 3 Versuche (${gesendet.length})`);
  ok(!('afa_modus' in letzte) && 'zusatzdaten' in letzte && 'wohnungen' in letzte && 'aktiv' in letzte, 'nur fehlende Spalten weggelassen, Zusatzdaten/Wohnungen bleiben');
  ok(letzte.kaufpreis === null && letzte.eigenkapital === null, 'leere Zahlenfelder als null gesendet');
  ok(gespeichert.wohnungen?.[0]?.kaltmiete === 900, 'geladene Wohnung: Text → Zahl');
  fehlt = new Set();
  let nkFehler = null;
  try { await saveNKAbrechnung({ abrechnungsjahr: '', mieterflaeche: '45,5' }); } catch (e) { nkFehler = e.message; }
  ok(nkFehler && nkFehler.includes('Abrechnungsjahr'), 'NK ohne Jahr: verständliche Meldung statt DB-Fehler');
  const nk = await saveNKAbrechnung({ abrechnungsjahr: '2025', mieterflaeche: '45,5', anzahlParteien: '2.6', vorauszahlungenGesamt: '' });
  ok(nk.abrechnungsjahr === 2025 && nk.mieterflaeche === 45.5 && nk.anzahl_parteien === 3 && nk.vorauszahlungen_gesamt === 0, 'NK-Zahlen bereinigt');
  const m = await saveMieter({ name: 'A', immobilieId: 'a-1', kaltmiete: 0, kautionBetrag: '', zaehlerstandStrom: '1.234,5', mahnstufe: '1' });
  ok(m.kaltmiete === 0 && m.kaution_betrag === null && m.zaehlerstand_strom === 1234.5 && m.mahnstufe === 1, `Mieter: 0 bleibt 0, Text → Zahl (${m.kaltmiete}/${m.zaehlerstand_strom})`);
}

console.log(`${faelle} Eingabe-Fälle geprüft`);
console.log(fehler ? `${fehler} Fehler` : 'Alles robust');
if (fehler) process.exit(1);
