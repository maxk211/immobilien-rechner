import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Home, Building2, ArrowLeftRight, MapPin, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2, Upload } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { berechneMtlCashflow } from '../utils/berechnung.js';
import { cashflowVorNach } from '../utils/kapital.js';
import { darlehensVerlauf } from '../utils/darlehen.js';
import { GREST_HISTORIE, grestSatz, bundeslandAusName, bundeslandAusPlz } from '../config/grunderwerbsteuer.js';

// Anlage-Wizard (UX-Paket Teil 2): vier Schritte statt einer Maske.
//  1 Was besitzt du? · 2 Das Objekt · 3 Kaufpreis, Eigenkapital, Kredit · 4 Miete rein, Kosten raus
// Entwurf wird nach jeder Änderung lokal gesichert. Rechts füllt sich die Vorschau-Karte;
// in Schritt 4 steht die erste Zahl, bevor "Anlegen" geklickt wird. Danach Abschluss mit
// Vollständigkeitsring und bis zu drei Nachtrag-Aufgaben.
// Pflicht: Objekttyp, Adresse (PLZ), Eigentumsdatum, Wohnfläche. Alles andere darf leer bleiben.

const ENTWURF_KEY = 'renditly-anlage-entwurf';
const NOTAR_GRUNDBUCH = 1.9; // Vorschlag lt. Konzept, sichtbar und änderbar
const MAKLER = 3.0;

const LEER = {
  typ: '', strasse: '', plz: '', ort: '', bundesland: '', name: '', nameGeaendert: false, eigentumMonat: '',
  wohnflaeche: '', objektart: 'eigentumswohnung', zustand: '', qmPreis: '', marktwertManuell: '',
  baujahr: '', zimmer: '', stockwerk: '', energieeffizienz: '', balkon: false, keller: false, garage: false, grundstueck: '',
  wohnungen: [],
  erwerbsart: 'kauf', kaufpreis: '', verkehrswert: '', knkNotar: NOTAR_GRUNDBUCH, mitMakler: true, knkManuell: '',
  zahlweise: '', zusatzEK: '', kreditBeiErbe: false, darlehenManuell: '', sollzins: 4, kreditSeit: '', zinsbindungBis: '', zbBestaetigt: false,
  kenne: 'tilgung', tilgung: 2, rate: '', sondertilgungProzent: '',
  mietstatus: '', vermietungsmodell: 'kaltmiete_nk', kaltmiete: '', nkVz: '', mieterName: '', mieterSeit: '', faelligTag: 3,
  letzteErhoehung: '', nieErhoeht: false,
  hausgeld: '', nuHG: '', nuGeschaetzt: false, ruecklage: '', grundsteuerJahr: '', versicherung: '', sev: '',
  chips: [], strom: '', internet: '', kontofuehrung: '', sonstige: '',
  // Arbitrage
  eigeneWarmmiete: '', mietvertragEnde: '', zimmerVermietet: '', untermieteProZimmer: '', gez: false,
  gestartetAm: null,
};

const n = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : 0; };
const leer = (v) => v === '' || v === null || v === undefined;
const monatZuDatum = (m) => (m ? `${m}-01` : '');
const addJahreIso = (iso, j) => { const d = new Date(iso); d.setFullYear(d.getFullYear() + j); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
const jahreZwischen = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24 * 365.25)));

// ── Aus dem Entwurf ein Immobilien-Objekt bauen (für Vorschau und Speichern) ──
export function baueImmobilie(d) {
  const kaufdatum = monatZuDatum(d.eigentumMonat);
  const basis = {
    name: d.name || [d.strasse].filter(Boolean).join(' ') || 'Neue Immobilie',
    adresse: d.strasse, plz: d.plz, ort: d.ort, bundesland: d.bundesland || '',
    kaufdatum, aktiv: true, mietAnpassungen: [], eigentumsform: 'allein', userAnteil: 100,
    feldHerkunft: {},
  };
  if (d.typ === 'mietimmobilie') {
    return {
      ...basis, immobilienTyp: 'mietimmobilie', objektart: 'wohnung',
      wohnflaeche: n(d.wohnflaeche), zimmer: n(d.zimmer),
      kaufpreis: 0, mietvertragStart: kaufdatum, mietvertragEnde: d.mietvertragEnde || '',
      eigeneWarmmiete: n(d.eigeneWarmmiete), anzahlZimmerVermietet: n(d.zimmerVermietet), untermieteProZimmer: n(d.untermieteProZimmer),
      arbitrageStrom: n(d.strom), arbitrageInternet: n(d.internet), arbitrageGEZ: d.gez ? 18.36 : 0,
      finanzierungsphasen: [],
    };
  }
  const istMFH = d.typ === 'mehrfamilienhaus';
  const wohnungen = istMFH ? d.wohnungen.map((w, i) => ({
    id: w.id || Date.now() + i, name: w.name || `WE ${i + 1}`, wohnflaeche: n(w.wohnflaeche), kaltmiete: n(w.kaltmiete),
    mieterName: w.mieterName || '', mietbeginn: w.mietbeginn || '', mietEingaenge: [], kosten: {},
  })) : [];
  const flaeche = istMFH ? wohnungen.reduce((s, w) => s + w.wohnflaeche, 0) : n(d.wohnflaeche);
  const geerbt = d.erwerbsart !== 'kauf';
  const kaufpreis = geerbt ? 0 : n(d.kaufpreis);
  const grest = !geerbt && d.bundesland ? (grestSatz(d.bundesland, kaufdatum || new Date())?.satz ?? 0) : 0;
  const knkProzent = geerbt ? 0 : (!leer(d.knkManuell) ? n(d.knkManuell) : grest + n(d.knkNotar) + (d.mitMakler ? MAKLER : 0));
  const nk = kaufpreis * knkProzent / 100;
  const marktwert = !leer(d.marktwertManuell) ? n(d.marktwertManuell) : (n(d.qmPreis) > 0 && flaeche > 0 ? n(d.qmPreis) * flaeche : (geerbt ? n(d.verkehrswert) : 0));

  // Finanzierungsstruktur (4 Varianten) → Darlehen und Eigenkapital
  let darlehen = 0, ekNK = 0, ekKP = 0, ohneKredit = false;
  if (geerbt) {
    ohneKredit = !d.kreditBeiErbe;
    darlehen = d.kreditBeiErbe ? n(d.darlehenManuell) : 0;
  } else if (d.zahlweise === 'alles') { darlehen = kaufpreis + nk; }
  else if (d.zahlweise === 'kaufpreis') { darlehen = kaufpreis; ekNK = nk; }
  else if (d.zahlweise === 'zusatzEK') { const e = n(d.zusatzEK); ekNK = Math.min(e, nk); ekKP = Math.max(0, e - nk); darlehen = Math.max(0, kaufpreis + nk - e); }
  else if (d.zahlweise === 'ohne') { ohneKredit = true; ekNK = nk; ekKP = kaufpreis; }
  if (!geerbt && !leer(d.darlehenManuell) && d.zahlweise !== 'ohne') darlehen = n(d.darlehenManuell);

  const kreditSeit = d.kreditSeit || kaufdatum;
  const zbBis = d.zinsbindungBis || (kreditSeit ? addJahreIso(kreditSeit, 10) : '');
  const phasen = (!ohneKredit && darlehen > 0) ? [{
    id: 1, name: 'Erstfinanzierung', darlehensTyp: 'annuitaet',
    sollzinssatz: n(d.sollzins),
    anfangstilgung: d.kenne === 'tilgung' ? n(d.tilgung) : (darlehen > 0 ? Math.max(0, (n(d.rate) * 12 / darlehen) * 100 - n(d.sollzins)) : 0),
    monatlicherBetrag: d.kenne === 'rate' && n(d.rate) > 0 ? n(d.rate) : null,
    zinsbindung: kreditSeit && zbBis ? jahreZwischen(kreditSeit, zbBis) : 10,
    zinsbindungBis: zbBis || null, zinsbindungBisBestaetigt: !!d.zbBestaetigt,
    kreditStartDatum: kreditSeit || null,
    sondertilgungErlaubtProzent: leer(d.sondertilgungProzent) ? null : n(d.sondertilgungProzent),
    laufzeit: 10, monatlicheTilgung: null, sondertilgungJaehrlich: 0, restschuldOverride: null,
  }] : [];

  const vermietet = d.mietstatus === 'vermietet';
  const nkVz = vermietet && d.vermietungsmodell === 'kaltmiete_nk' ? n(d.nkVz) : 0;
  const herkunft = {};
  if (d.nuGeschaetzt) herkunft.hausgeldNichtUmlagefaehig = 'geschaetzt';
  else if (!leer(d.nuHG)) herkunft.hausgeldNichtUmlagefaehig = 'manuell';
  const chip = (k) => d.chips.includes(k);

  return {
    ...basis,
    immobilienTyp: istMFH ? 'mehrfamilienhaus' : 'kaufimmobilie',
    objektart: istMFH ? 'mehrfamilienhaus' : (d.objektart || 'eigentumswohnung'),
    zustand: d.zustand || null,
    wohnflaeche: flaeche, zimmer: istMFH ? wohnungen.length : n(d.zimmer),
    baujahr: leer(d.baujahr) ? null : n(d.baujahr), stockwerk: n(d.stockwerk), energieeffizienz: d.energieeffizienz || '',
    balkon: !!d.balkon, keller: !!d.keller, garage: !!d.garage, grundstueck: n(d.grundstueck),
    wohnungen,
    erwerbsart: d.erwerbsart, geschenkt: geerbt,
    kaufpreis, kaufnebenkosten: knkProzent, kaufnebenkostenModus: 'prozent',
    geschaetzterWert: marktwert, geschaetzterWertDatum: marktwert > 0 ? new Date().toISOString().slice(0, 10) : null,
    vollEigenfinanziert: !geerbt && ohneKredit,
    finanzierungsbetrag: ohneKredit ? 0 : darlehen,
    ekFuerNebenkosten: ekNK, ekFuerKaufpreis: ekKP, eigenkapital: ekNK + ekKP,
    zinssatz: n(d.sollzins) || 4, tilgung: n(d.tilgung) || 2,
    finanzierungsphasen: phasen,
    kaltmiete: istMFH ? wohnungen.reduce((s, w) => s + w.kaltmiete, 0) : (vermietet ? n(d.kaltmiete) : 0),
    vermietungsmodell: vermietet ? d.vermietungsmodell : 'kaltmiete',
    nebenkostenVomMieter: nkVz,
    mieteFaelligkeitstag: n(d.faelligTag) || 3,
    mietstatus: istMFH ? undefined : d.mietstatus,
    hausgeld: n(d.hausgeld),
    hausgeldNichtUmlagefaehig: leer(d.nuHG) ? null : n(d.nuHG),
    instandhaltung: n(d.ruecklage),
    grundsteuerMonat: n(d.grundsteuerJahr) / 12,
    versicherungMonat: n(d.versicherung),
    verwaltung: n(d.sev),
    strom: chip('strom') ? n(d.strom) : 0, internet: chip('internet') ? n(d.internet) : 0,
    kontofuehrung: chip('kontofuehrung') ? n(d.kontofuehrung) : 0, nebenkosten: chip('sonstige') ? n(d.sonstige) : 0,
    weitereKostenAktiv: n(d.ruecklage) > 0 || n(d.versicherung) > 0 || d.chips.length > 0,
    weitereKostenChips: d.chips.map(c => (c === 'sonstige' ? 'nebenkosten' : c)),
    feldHerkunft: herkunft,
  };
}

// ── Vollständigkeit: gewichtet, Erinnerungs-Felder zählen dreifach ──────────
export function vollstaendigkeit(d) {
  const f = [];
  const add = (ok, w = 1) => f.push({ ok: !!ok, w });
  add(d.typ, 1); add(d.plz, 1); add(d.eigentumMonat, 3);
  if (d.typ === 'mietimmobilie') {
    add(n(d.wohnflaeche) > 0, 1); add(n(d.eigeneWarmmiete) > 0, 3); add(n(d.untermieteProZimmer) > 0, 3); add(d.mietvertragEnde, 1); add(n(d.zimmer) > 0, 1);
  } else {
    add(d.typ === 'mehrfamilienhaus' ? d.wohnungen.some(w => n(w.wohnflaeche) > 0) : n(d.wohnflaeche) > 0, 1);
    add(d.erwerbsart !== 'kauf' || n(d.kaufpreis) > 0, 1);
    add(n(d.qmPreis) > 0 || n(d.marktwertManuell) > 0, 1);
    add(d.baujahr, 1); add(d.zimmer || d.typ === 'mehrfamilienhaus', 1); add(d.stockwerk || d.typ === 'mehrfamilienhaus', 1);
    const kredit = d.erwerbsart === 'kauf' ? (d.zahlweise && d.zahlweise !== 'ohne') : d.kreditBeiErbe;
    if (kredit) add(d.zinsbindungBis && d.zbBestaetigt, 3);
    if (d.typ !== 'mehrfamilienhaus') {
      add(d.mietstatus, 1);
      if (d.mietstatus === 'vermietet') { add(n(d.kaltmiete) > 0, 1); add(d.letzteErhoehung || d.nieErhoeht, 3); add(d.mieterSeit, 1); add(false, 3); /* Kaution: nie im Wizard */ }
      add(!leer(d.hausgeld), 1); add(!leer(d.nuHG) && !d.nuGeschaetzt, 3); add(!leer(d.grundsteuerJahr), 1);
    } else {
      add(d.wohnungen.some(w => n(w.kaltmiete) > 0), 1);
    }
  }
  const ges = f.reduce((s, x) => s + x.w, 0);
  return Math.round(f.reduce((s, x) => s + (x.ok ? x.w : 0), 0) / ges * 100);
}

// ── Adresse mit Autocomplete (OpenStreetMap / Photon, frei, ohne Schlüssel) ──
function AdressSuche({ wert, onWaehle }) {
  const [q, setQ] = useState(wert || '');
  const [treffer, setTreffer] = useState([]);
  const [offen, setOffen] = useState(false);
  const timer = useRef(null);
  useEffect(() => { setQ(wert || ''); }, [wert]);
  const suche = (text) => {
    setQ(text);
    clearTimeout(timer.current);
    if (text.trim().length < 4) { setTreffer([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lang=de&limit=6&bbox=5.8,47.2,15.1,55.1`);
        const j = await r.json();
        const t = (j.features || []).map(f => f.properties).filter(p => p.countrycode === 'DE' && (p.street || p.name) && p.postcode)
          .map(p => ({
            strasse: [p.street || p.name, p.housenumber].filter(Boolean).join(' '),
            plz: p.postcode, ort: p.city || p.town || p.village || p.district || '', bundesland: bundeslandAusName(p.state) || bundeslandAusPlz(p.postcode) || '',
          }));
        setTreffer(t); setOffen(true);
      } catch { setTreffer([]); }
    }, 300);
  };
  return (
    <div className="relative">
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => suche(e.target.value)} onFocus={() => treffer.length && setOffen(true)}
          placeholder="Straße, Hausnummer, Ort"
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-indigo-500" />
      </div>
      {offen && treffer.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {treffer.map((t, i) => (
            <button key={i} type="button" onClick={() => { onWaehle(t); setQ(`${t.strasse}, ${t.plz} ${t.ort}`); setOffen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b border-gray-50 last:border-0">
              <span className="font-semibold text-gray-800">{t.strasse}</span> <span className="text-gray-500">{t.plz} {t.ort}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Kleine, modul-weite Bausteine (keine Inline-Komponenten → kein Fokusverlust) ──
function Feld({ label, hint, children, pflicht }) {
  return (
    <label className="block text-xs font-semibold text-gray-600">
      {label}{pflicht && <span className="text-indigo-600"> *</span>}
      <div className="mt-1">{children}</div>
      {hint && <span className="block text-[11px] font-normal text-gray-400 mt-0.5">{hint}</span>}
    </label>
  );
}
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-indigo-500';
function Karte({ aktiv, onClick, titel, sub, icon, badge }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${aktiv ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <div className="flex items-center gap-2">
        {icon}<span className="text-sm font-bold text-gray-900">{titel}</span>
        {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{badge}</span>}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </button>
  );
}
function Pille({ aktiv, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${aktiv ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
      {children}
    </button>
  );
}

export default function AnlageWizard({ onSave, onSaveMieter, onClose, onOpenDetail, portfolio = [], vorbelegung = null }) {
  const [d, setD] = useState(() => {
    if (vorbelegung) return { ...LEER, ...vorbelegung, gestartetAm: Date.now() };
    return { ...LEER, gestartetAm: Date.now() };
  });
  const [schritt, setSchritt] = useState(1);
  const [entwurfAngebot, setEntwurfAngebot] = useState(() => {
    if (vorbelegung) return null;
    try { const e = JSON.parse(localStorage.getItem(ENTWURF_KEY) || 'null'); return e?.d?.typ ? e : null; } catch { return null; }
  });
  const [mehrOffen, setMehrOffen] = useState(false);
  const [fehler, setFehler] = useState('');
  const [speichert, setSpeichert] = useState(false);
  const [fertig, setFertig] = useState(null); // gespeicherte Immobilie → Abschluss

  const set = (upd) => setD(x => ({ ...x, ...upd }));
  // Entwurf nach jeder Änderung sichern (nicht, solange ein alter Entwurf angeboten wird)
  useEffect(() => {
    if (entwurfAngebot || fertig || !d.typ) return;
    try { localStorage.setItem(ENTWURF_KEY, JSON.stringify({ d, schritt, am: new Date().toISOString() })); } catch { /* voll */ }
  }, [d, schritt, entwurfAngebot, fertig]);

  const immo = useMemo(() => baueImmobilie(d), [d]);
  const cf = useMemo(() => (d.typ ? cashflowVorNach(immo) : null), [immo, d.typ]);
  const verlauf = useMemo(() => (immo.finanzierungsphasen?.length ? darlehensVerlauf(immo) : null), [immo]);
  const quote = vollstaendigkeit(d);
  const istArb = d.typ === 'mietimmobilie';
  const istMFH = d.typ === 'mehrfamilienhaus';
  const geerbt = d.erwerbsart !== 'kauf';
  const blName = d.bundesland ? GREST_HISTORIE[d.bundesland]?.name : null;
  const grest = !geerbt && d.bundesland ? grestSatz(d.bundesland, monatZuDatum(d.eigentumMonat) || new Date()) : null;

  const pruefe = (s) => {
    if (s === 1) {
      if (!d.typ) return 'Bitte wähle, um was für ein Objekt es geht.';
      if (!/^\d{5}$/.test(d.plz || '')) return 'Bitte gib die Adresse mit Postleitzahl an.';
      if (!d.eigentumMonat) return istArb ? 'Seit wann mietest du es an?' : 'Seit wann gehört es dir? Monat und Jahr reichen.';
    }
    if (s === 2) {
      if (istMFH) { if (!d.wohnungen.some(w => n(w.wohnflaeche) > 0)) return 'Bitte mindestens eine Wohneinheit mit Wohnfläche anlegen.'; }
      else if (!(n(d.wohnflaeche) > 0)) return 'Die Wohnfläche ist hier das einzige Pflichtfeld.';
    }
    if (s === 3 && !istArb) {
      if (!geerbt && !(n(d.kaufpreis) > 0)) return 'Bitte den Kaufpreis eintragen.';
      if (!geerbt && !d.zahlweise) return 'Wie hast du bezahlt? Bitte eine der vier Varianten wählen.';
      const kredit = geerbt ? d.kreditBeiErbe : d.zahlweise !== 'ohne';
      if (kredit && !(n(d.sollzins) > 0)) return 'Bitte den Sollzins aus dem Kreditvertrag eintragen.';
      if (kredit && d.kenne === 'rate' && !(n(d.rate) > 0)) return 'Bitte die Monatsrate eintragen — oder auf Tilgungssatz umschalten.';
    }
    if (s === 4) {
      if (istArb && !(n(d.eigeneWarmmiete) > 0)) return 'Was zahlst du selbst an Miete?';
      if (!istArb && !istMFH && !d.mietstatus) return 'Ist die Wohnung gerade vermietet?';
      if (!istArb && !istMFH && d.mietstatus === 'vermietet' && !(n(d.kaltmiete) > 0)) return 'Bitte die Kaltmiete eintragen.';
    }
    return '';
  };
  const weiter = () => { const f = pruefe(schritt); setFehler(f); if (!f) setSchritt(s => Math.min(4, s + 1)); };
  const zurueck = () => { setFehler(''); setSchritt(s => Math.max(1, s - 1)); };

  const anlegen = async () => {
    for (const s of [1, 2, 3, 4]) { const f = pruefe(s); if (f) { setSchritt(s); setFehler(f); return; } }
    setSpeichert(true);
    try {
      const daten = baueImmobilie(d);
      const saved = await onSave(daten);
      if (!saved) { setSpeichert(false); return; }
      if (!istArb && !istMFH && d.mietstatus === 'vermietet' && onSaveMieter) {
        const kalt = n(d.kaltmiete), nk = d.vermietungsmodell === 'kaltmiete_nk' ? n(d.nkVz) : 0;
        await onSaveMieter({
          immobilieId: saved.id, name: d.mieterName || 'Mieter', aktiv: true,
          mietbeginn: d.mieterSeit ? monatZuDatum(d.mieterSeit) : null,
          kaltmiete: kalt, nkVorauszahlung: nk || null, gesamtueberweisung: kalt + nk,
          letzteMieterhoehung: d.letzteErhoehung ? monatZuDatum(d.letzteErhoehung) : (d.nieErhoeht && d.mieterSeit ? monatZuDatum(d.mieterSeit) : null),
        });
      }
      try { localStorage.removeItem(ENTWURF_KEY); } catch { /* egal */ }
      setFertig(saved);
    } finally {
      setSpeichert(false);
    }
  };

  // ── Abschluss ──────────────────────────────────────────────────────────────
  if (fertig) {
    const sek = Math.max(1, Math.round((Date.now() - (d.gestartetAm || Date.now())) / 1000));
    const aufgaben = [];
    if (!istArb && !istMFH && d.mietstatus === 'vermietet' && !d.letzteErhoehung && !d.nieErhoeht)
      aufgaben.push({ t: 'Wann hast du die Miete zuletzt erhöht?', s: 'Schaltet die Erinnerung frei, sobald wieder eine Erhöhung möglich ist', tab: 'mieter' });
    if (!istArb && !istMFH && d.mietstatus === 'vermietet')
      aufgaben.push({ t: 'Wie hoch ist die Kaution und wo liegt sie?', s: 'Brauchst du beim Auszug, sonst wird die Abrechnung zur Sucherei', tab: 'mieter' });
    if (!istArb && !istMFH && n(d.hausgeld) > 0 && (leer(d.nuHG) || d.nuGeschaetzt))
      aufgaben.push({ t: 'Nicht umlagefähigen Hausgeld-Anteil nachtragen', s: 'Steht in der Hausgeldabrechnung — statt mit 35 % zu schätzen', tab: 'cashflow' });
    if (immo.finanzierungsphasen?.length && !d.zbBestaetigt)
      aufgaben.push({ t: 'Zinsbindungsende aus dem Kreditvertrag bestätigen', s: 'Daran hängt die wichtigste Erinnerung — heute ist es nur geschätzt', tab: 'finanzierung' });
    const r = 34, u = 2 * Math.PI * r;
    return (
      <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
          <div className="bg-ink text-white p-5 flex items-center gap-4">
            <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
              <circle cx="42" cy="42" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
              <circle cx="42" cy="42" r={r} stroke="rgb(var(--c-indigo-500))" strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={u} strokeDashoffset={u * (1 - quote / 100)} transform="rotate(-90 42 42)" />
              <text x="42" y="47" textAnchor="middle" fontSize="18" fontWeight="800" fill="white">{quote} %</text>
            </svg>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">{fertig.name} ist angelegt</div>
              <div className="text-lg font-black">Fertig in {Math.floor(sek / 60)} Minuten {sek % 60}.</div>
              <div className="text-xs text-white/60">{aufgaben.length ? `${Math.min(3, aufgaben.length)} Angaben fehlen noch. Jede davon schaltet eine Erinnerung frei.` : 'Alles Wichtige ist drin.'}</div>
            </div>
            {cf && (
              <div className="text-right shrink-0">
                <div className="text-[10px] text-white/50">Cashflow {istArb ? '' : 'nach Tilgung'}</div>
                <div className={`text-xl font-black ${cf.nach >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{cf.nach >= 0 ? '+' : ''}{formatCurrency(cf.nach)}</div>
                <div className="text-[10px] text-white/50">pro Monat</div>
              </div>
            )}
          </div>
          <div className="p-5 space-y-2">
            {aufgaben.length > 0 && <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Das fehlt noch — je unter 30 Sekunden</p>}
            {aufgaben.slice(0, 3).map((a, i) => (
              <div key={a.t} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800">{a.t}</div>
                  <div className="text-xs text-gray-400">{a.s}</div>
                </div>
                <button onClick={() => onOpenDetail(fertig, a.tab)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-700 shrink-0">Nachtragen</button>
              </div>
            ))}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-800">Noch eine Immobilie?</div>
                <div className="text-xs text-gray-400">Adresse, Kaufpreis und Kredit sind jetzt Routine — die zweite dauert keine zwei Minuten.</div>
              </div>
              <button onClick={() => { setFertig(null); setD({ ...LEER, gestartetAm: Date.now() }); setSchritt(1); }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 text-gray-700 hover:border-gray-500 shrink-0">Nächste anlegen</button>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-400">Alles Fehlende findest du jederzeit im Cockpit unter „Jetzt dran“.</span>
            <button onClick={() => onOpenDetail(fertig, 'uebersicht')} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Zum Cockpit</button>
          </div>
        </div>
      </div>
    );
  }

  const restZeit = ['noch ca. 2 Minuten', 'noch ca. 90 Sekunden', 'gleich kommt deine erste Zahl', 'letzter Schritt'][schritt - 1];
  const titel = istArb
    ? ['Was besitzt du?', 'Die Wohnung', 'Was du selbst zahlst', 'Untervermietung'][schritt - 1]
    : ['Was besitzt du?', istMFH ? 'Erzähl uns vom Haus' : 'Erzähl uns von der Wohnung', 'Was hat sie gekostet, wie hast du bezahlt?', 'Miete rein, Kosten raus'][schritt - 1];

  // ── Schritt-Inhalte als Funktionen (keine Inline-Komponenten) ───────────────
  const schritt1 = () => (
    <div className="space-y-5">
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 flex items-center gap-3">
        <Upload size={18} className="text-indigo-600 shrink-0" />
        <div className="text-xs text-indigo-900 flex-1">
          <strong>Unterlagen zur Hand?</strong> Das Auslesen von Exposé, Kauf- und Kreditvertrag kommt in einer späteren Version. Bis dahin: einfach eintippen, dauert keine vier Minuten.
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Um was für ein Objekt geht es? <span className="text-indigo-600">*</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Karte aktiv={d.typ === 'kaufimmobilie'} onClick={() => set({ typ: 'kaufimmobilie' })} icon={<Home size={16} className="text-indigo-600" />} titel="Eigentumswohnung" sub="Gehört dir, du vermietest sie" />
          <Karte aktiv={istMFH} onClick={() => set({ typ: 'mehrfamilienhaus', wohnungen: d.wohnungen.length ? d.wohnungen : [{ name: 'WE 1', wohnflaeche: '', kaltmiete: '' }] })} icon={<Building2 size={16} className="text-indigo-600" />} titel="Mehrfamilienhaus" sub="Gehört dir, mehrere Wohneinheiten" />
          <Karte aktiv={istArb} onClick={() => set({ typ: 'mietimmobilie' })} icon={<ArrowLeftRight size={16} className="text-indigo-600" />} titel="Anmieten und untervermieten" sub="Gehört dir nicht — auch Arbitrage genannt" />
        </div>
      </div>
      <Feld label="Wo steht es?" pflicht hint={blName ? `Bundesland: ${blName} — daraus kommt die Grunderwerbsteuer in Schritt 3.` : 'Tippen genügt — Straße, Hausnummer und Ort kommen als Vorschlag. Daraus leiten wir auch dein Bundesland ab.'}>
        <AdressSuche wert={d.strasse ? `${d.strasse}${d.plz ? `, ${d.plz} ${d.ort}` : ''}` : ''}
          onWaehle={(t) => set({ strasse: t.strasse, plz: t.plz, ort: t.ort, bundesland: t.bundesland, ...(d.nameGeaendert ? {} : { name: t.strasse }) })} />
      </Feld>
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer">Adresse wird nicht gefunden? Von Hand eintragen</summary>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <input className={`${inputCls} col-span-3`} placeholder="Straße und Hausnummer" value={d.strasse} onChange={e => set({ strasse: e.target.value, ...(d.nameGeaendert ? {} : { name: e.target.value }) })} />
          <input className={inputCls} placeholder="PLZ" inputMode="numeric" value={d.plz} onChange={e => set({ plz: e.target.value.trim(), bundesland: bundeslandAusPlz(e.target.value.trim()) || d.bundesland })} />
          <input className={`${inputCls} col-span-2`} placeholder="Ort" value={d.ort} onChange={e => set({ ort: e.target.value })} />
          <select className={`${inputCls} col-span-3`} value={d.bundesland} onChange={e => set({ bundesland: e.target.value })}>
            <option value="">Bundesland wählen</option>
            {Object.entries(GREST_HISTORIE).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </details>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Feld label="Wie willst du es nennen?" hint="Aus der Adresse übernommen, änderbar.">
          <input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value, nameGeaendert: true })} />
        </Feld>
        <Feld label={istArb ? 'Seit wann mietest du es an?' : 'Seit wann gehört es dir?'} pflicht hint={istArb ? 'Beginn deines Hauptmietvertrags. Monat reicht.' : 'Monat der Übergabe. Tag brauchen wir nicht.'}>
          <input type="month" className={inputCls} value={d.eigentumMonat} onChange={e => set({ eigentumMonat: e.target.value, ...(d.kreditSeit ? {} : {}) })} />
        </Feld>
      </div>
    </div>
  );

  const flaecheMFH = d.wohnungen.reduce((s, w) => s + n(w.wohnflaeche), 0);
  const flaecheWert = istMFH ? flaecheMFH : n(d.wohnflaeche);
  const schritt2 = () => (
    <div className="space-y-5">
      {!istMFH && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {!istArb && (
            <Feld label="Objektart">
              <select className={inputCls} value={d.objektart} onChange={e => set({ objektart: e.target.value })}>
                <option value="eigentumswohnung">Eigentumswohnung</option>
                <option value="einfamilienhaus">Einfamilienhaus</option>
                <option value="doppelhaushaelfte">Doppelhaushälfte</option>
                <option value="reihenhaus">Reihenhaus</option>
              </select>
            </Feld>
          )}
          <Feld label="Wohnfläche" pflicht hint={istArb ? undefined : 'Das einzige Pflichtfeld hier — aus ihr rechnen wir den Quadratmeterpreis.'}>
            <div className="relative"><input type="number" min="0" className={`${inputCls} pr-10`} value={d.wohnflaeche} onChange={e => set({ wohnflaeche: e.target.value })} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span></div>
          </Feld>
          {istArb ? (
            <Feld label="Zimmer"><input type="number" min="0" className={inputCls} value={d.zimmer} onChange={e => set({ zimmer: e.target.value })} /></Feld>
          ) : (
            <Feld label="Zustand">
              <select className={inputCls} value={d.zustand} onChange={e => set({ zustand: e.target.value })}>
                <option value="">weiß ich nicht</option><option value="neuwertig">Neuwertig</option><option value="gut">Gut</option><option value="renovierungsbeduerftig">Renovierungsbedürftig</option>
              </select>
            </Feld>
          )}
        </div>
      )}

      {istMFH && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">Wohneinheiten — jede einzeln, mit eigener Fläche und Miete <span className="text-indigo-600">*</span></p>
          {d.wohnungen.map((w, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 border border-gray-100 rounded-xl p-2">
              <input className={`${inputCls} col-span-3`} placeholder={`WE ${i + 1}`} value={w.name} onChange={e => set({ wohnungen: d.wohnungen.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
              <input type="number" min="0" className={`${inputCls} col-span-2`} placeholder="m²" value={w.wohnflaeche} onChange={e => set({ wohnungen: d.wohnungen.map((x, j) => j === i ? { ...x, wohnflaeche: e.target.value } : x) })} />
              <input type="number" min="0" className={`${inputCls} col-span-3`} placeholder="Kaltmiete €" value={w.kaltmiete} onChange={e => set({ wohnungen: d.wohnungen.map((x, j) => j === i ? { ...x, kaltmiete: e.target.value } : x) })} />
              <input className={`${inputCls} col-span-3`} placeholder="Mieter (optional)" value={w.mieterName || ''} onChange={e => set({ wohnungen: d.wohnungen.map((x, j) => j === i ? { ...x, mieterName: e.target.value } : x) })} />
              <button type="button" onClick={() => set({ wohnungen: d.wohnungen.filter((_, j) => j !== i) })} className="col-span-1 text-gray-300 hover:text-red-500 flex justify-center py-2" title="Entfernen"><Trash2 size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={() => set({ wohnungen: [...d.wohnungen, { name: `WE ${d.wohnungen.length + 1}`, wohnflaeche: '', kaltmiete: '' }] })}
            className="text-xs font-semibold text-indigo-600 flex items-center gap-1"><Plus size={14} /> Wohneinheit hinzufügen</button>
          <p className="text-[11px] text-gray-400">{d.wohnungen.length} Einheiten · {flaecheMFH} m² · {formatCurrency(d.wohnungen.reduce((s, w) => s + n(w.kaltmiete), 0))} Kaltmiete</p>
        </div>
      )}

      {!istArb && (
        <div className="rounded-xl border border-gray-200 p-3 space-y-2">
          <p className="text-sm font-bold text-gray-800">Was ist {istMFH ? 'das Haus' : 'die Wohnung'} heute wert?</p>
          <p className="text-xs text-gray-500">Du brauchst nur den Quadratmeterpreis. Den Rest rechnen wir.</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input type="number" min="0" className={`${inputCls} w-32`} placeholder="€/m²" value={d.qmPreis} onChange={e => set({ qmPreis: e.target.value, marktwertManuell: '' })} />
            <span className="text-gray-400">× {flaecheWert || '—'} m² =</span>
            <input type="number" min="0" className={`${inputCls} w-36`} placeholder="Wert €" value={!leer(d.marktwertManuell) ? d.marktwertManuell : (n(d.qmPreis) > 0 && flaecheWert > 0 ? Math.round(n(d.qmPreis) * flaecheWert) : '')}
              onChange={e => set({ marktwertManuell: e.target.value })} />
            <a href={`https://www.homeday.de/de/preisatlas/${encodeURIComponent((d.ort || '').toLowerCase())}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 hover:underline">m²-Preis bei Homeday suchen ↗</a>
          </div>
        </div>
      )}

      {!istArb && !istMFH && (
        <div className="rounded-xl border border-gray-200">
          <button type="button" onClick={() => setMehrOffen(o => !o)} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <span><span className="text-sm font-bold text-gray-800">Weitere Angaben</span> <span className="text-xs text-gray-400">· alles freiwillig</span></span>
            {mehrOffen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {mehrOffen && (
            <div className="px-3 pb-3 space-y-3">
              <p className="text-[11px] text-gray-400">Was du nicht weißt, trägst du später im Objekt nach.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Feld label="Baujahr"><input type="number" className={inputCls} placeholder="weiß ich nicht" value={d.baujahr} onChange={e => set({ baujahr: e.target.value })} /></Feld>
                <Feld label="Zimmer"><input type="number" className={inputCls} placeholder="weiß ich nicht" value={d.zimmer} onChange={e => set({ zimmer: e.target.value })} /></Feld>
                <Feld label="Stockwerk"><input type="number" className={inputCls} placeholder="weiß ich nicht" value={d.stockwerk} onChange={e => set({ stockwerk: e.target.value })} /></Feld>
                <Feld label="Energieeffizienz">
                  <select className={inputCls} value={d.energieeffizienz} onChange={e => set({ energieeffizienz: e.target.value })}>
                    <option value="">weiß ich nicht</option>{['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(k => <option key={k}>{k}</option>)}
                  </select>
                </Feld>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[['balkon', 'Balkon oder Terrasse'], ['keller', 'Keller'], ['garage', 'Garage oder Stellplatz']].map(([k, l]) => (
                  <Pille key={k} aktiv={d[k]} onClick={() => set({ [k]: !d[k] })}>{d[k] ? '✓ ' : ''}{l}</Pille>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const knkProzentAnzeige = immo.kaufnebenkosten || 0;
  const schritt3Kauf = () => {
    const kp = n(d.kaufpreis);
    const nk = kp * knkProzentAnzeige / 100;
    const gesamt = kp + nk;
    const darlehen = immo.finanzierungsbetrag || 0;
    const ek = (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0);
    const kredit = geerbt ? d.kreditBeiErbe : (d.zahlweise && d.zahlweise !== 'ohne');
    const phase = immo.finanzierungsphasen?.[0];
    const vp = verlauf?.phasen?.[0];
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Wie ist {istMFH ? 'das Haus' : 'die Wohnung'} zu dir gekommen?</p>
          <div className="flex flex-wrap gap-1.5">
            {[['kauf', 'Gekauft'], ['erbe', 'Geerbt'], ['schenkung', 'Geschenkt bekommen']].map(([k, l]) => <Pille key={k} aktiv={d.erwerbsart === k} onClick={() => set({ erwerbsart: k })}>{l}</Pille>)}
          </div>
        </div>
        {geerbt ? (
          <div className="space-y-3">
            <Feld label="Verkehrswert beim Übergang" hint="Keine Grunderwerbsteuer bei Erbe oder Schenkung (§ 3 Nr. 2 GrEStG). Für die Abschreibung führst du die Werte des Vorbesitzers fort — die trägst du später unter Steuern ein.">
              <input type="number" min="0" className={inputCls} value={d.verkehrswert} onChange={e => set({ verkehrswert: e.target.value })} />
            </Feld>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={d.kreditBeiErbe} onChange={e => set({ kreditBeiErbe: e.target.checked })} /> Es läuft ein Kredit auf dem Objekt (übernommen oder neu)
            </label>
            {d.kreditBeiErbe && (
              <Feld label="Darlehensbetrag"><input type="number" min="0" className={inputCls} value={d.darlehenManuell} onChange={e => set({ darlehenManuell: e.target.value })} /></Feld>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Feld label="Kaufpreis" pflicht><input type="number" min="0" className={inputCls} value={d.kaufpreis} onChange={e => set({ kaufpreis: e.target.value })} /></Feld>
              <Feld label="Kaufnebenkosten" hint={grest
                ? `${String(grest.satz).replace('.', ',')} % Grunderwerbsteuer für ${blName} — der Satz, der zu deinem Kaufdatum galt. Dazu ${String(d.knkNotar).replace('.', ',')} % Notar und Grundbuch${d.mitMakler ? ', 3,0 % Makler' : ''}. Alles änderbar.`
                : 'Ohne Bundesland fehlt die Grunderwerbsteuer — in Schritt 1 die Adresse wählen.'}>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" min="0" className={`${inputCls} w-24`} value={!leer(d.knkManuell) ? d.knkManuell : Math.round(knkProzentAnzeige * 10) / 10} onChange={e => set({ knkManuell: e.target.value })} />
                  <span className="text-sm text-gray-500">% = {formatCurrency(nk)}</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-normal">
                  <input type="checkbox" checked={!d.mitMakler} onChange={e => set({ mitMakler: !e.target.checked, knkManuell: '' })} /> ohne Makler gekauft
                </label>
              </Feld>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Wie hast du bezahlt? <span className="text-indigo-600">*</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Karte aktiv={d.zahlweise === 'alles'} onClick={() => set({ zahlweise: 'alles', darlehenManuell: '' })} titel="Alles finanziert" sub="Der Kredit deckt Kaufpreis und Nebenkosten. Du hast nichts eingebracht." />
                <Karte aktiv={d.zahlweise === 'kaufpreis'} onClick={() => set({ zahlweise: 'kaufpreis', darlehenManuell: '' })} titel="Nur den Kaufpreis finanziert" badge="HÄUFIGSTER FALL" sub="Die Nebenkosten hast du aus eigener Tasche gezahlt." />
                <Karte aktiv={d.zahlweise === 'zusatzEK'} onClick={() => set({ zahlweise: 'zusatzEK', darlehenManuell: '' })} titel="Mit zusätzlichem Eigenkapital" sub="Nebenkosten plus ein Teil des Kaufpreises kamen von dir." />
                <Karte aktiv={d.zahlweise === 'ohne'} onClick={() => set({ zahlweise: 'ohne', darlehenManuell: '' })} titel="Ohne Kredit" sub="Komplett aus eigenen Mitteln bezahlt." />
              </div>
              {d.zahlweise === 'zusatzEK' && (
                <div className="mt-2 max-w-xs"><Feld label="Dein Eigenkapital insgesamt"><input type="number" min="0" className={inputCls} value={d.zusatzEK} onChange={e => set({ zusatzEK: e.target.value })} /></Feld></div>
              )}
            </div>
            {d.zahlweise && gesamt > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>So teilt sich deine Gesamtinvestition auf</span><strong className="text-gray-800">{formatCurrency(gesamt)}</strong></div>
                <div className="h-6 rounded-full overflow-hidden flex text-[10px] font-bold text-white">
                  {darlehen > 0 && <div className="bg-indigo-600 flex items-center px-2 truncate" style={{ width: `${Math.min(100, darlehen / gesamt * 100)}%` }}>Darlehen {formatCurrency(darlehen)}</div>}
                  {ek > 0 && <div className="bg-emerald-500 flex items-center px-2 truncate flex-1">EK {formatCurrency(ek)}</div>}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Kaufpreis {formatCurrency(kp)} + Nebenkosten {formatCurrency(nk)} · Beleihung {kp > 0 ? Math.round(darlehen / kp * 100) : 0} % vom Kaufpreis · {gesamt > 0 ? (darlehen / gesamt * 100).toFixed(1).replace('.', ',') : 0} % der Gesamtinvestition</p>
              </div>
            )}
          </>
        )}

        {kredit && (
          <div className="rounded-xl border border-gray-200 p-3 space-y-3">
            <p className="text-sm font-bold text-gray-800">Dein Kredit</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {!geerbt && <Feld label="Darlehensbetrag"><input type="number" min="0" className={inputCls} value={!leer(d.darlehenManuell) ? d.darlehenManuell : Math.round(darlehen)} onChange={e => set({ darlehenManuell: e.target.value })} /></Feld>}
              <Feld label="Sollzins p. a." pflicht><input type="number" step="0.01" min="0" className={inputCls} value={d.sollzins} onChange={e => set({ sollzins: e.target.value })} /></Feld>
              <Feld label="Kredit läuft seit"><input type="month" className={inputCls} value={(d.kreditSeit || monatZuDatum(d.eigentumMonat)).slice(0, 7)} onChange={e => set({ kreditSeit: monatZuDatum(e.target.value) })} /></Feld>
              <Feld label="Zinsbindung bis" hint={d.zbBestaetigt ? 'bestätigt' : 'geschätzt — bitte aus dem Vertrag'}>
                <input type="date" className={`${inputCls} ${!d.zbBestaetigt ? 'border-amber-400 bg-amber-50' : ''}`} value={phase?.zinsbindungBis || ''} onChange={e => set({ zinsbindungBis: e.target.value, zbBestaetigt: !!e.target.value })} />
              </Feld>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Was kennst du auswendig?</p>
                <div className="flex gap-1.5">
                  <Pille aktiv={d.kenne === 'rate'} onClick={() => set({ kenne: 'rate' })}>Meine Rate</Pille>
                  <Pille aktiv={d.kenne === 'tilgung'} onClick={() => set({ kenne: 'tilgung' })}>Mein Tilgungssatz</Pille>
                </div>
              </div>
              {d.kenne === 'rate' ? (
                <div className="w-32"><Feld label="Monatsrate"><input type="number" min="0" className={inputCls} value={d.rate} onChange={e => set({ rate: e.target.value })} /></Feld></div>
              ) : (
                <div className="w-32"><Feld label="Tilgung p. a. %"><input type="number" step="0.1" min="0" className={inputCls} value={d.tilgung} onChange={e => set({ tilgung: e.target.value })} /></Feld></div>
              )}
              <p className="text-xs text-indigo-700 font-semibold pb-2">
                {d.kenne === 'rate' ? `Daraus ergibt sich ein Tilgungssatz von ${(phase?.anfangstilgung || 0).toFixed(2).replace('.', ',')} %.` : `Ergibt eine Monatsrate von ${formatCurrency(vp?.rate || 0)}.`} Den musst du nicht nachschlagen.
              </p>
              <div className="w-36"><Feld label="Sondertilgung % p. a." hint="optional"><input type="number" step="0.5" min="0" className={inputCls} value={d.sondertilgungProzent} onChange={e => set({ sondertilgungProzent: e.target.value })} /></Feld></div>
            </div>
            {verlauf && (
              <div className="rounded-xl bg-ink text-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/50 mb-2">Das mussten wir dich nicht fragen — wir rechnen es aus</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><div className="text-[10px] text-white/50">Restschuld heute</div><div className="font-black">{formatCurrency(verlauf.restschuldHeute)}</div></div>
                  <div><div className="text-[10px] text-white/50">Restschuld {vp?.ende ? vp.ende.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }) : ''}</div><div className="font-black">{formatCurrency(vp?.restschuldBeiZinsbindung || 0)}</div></div>
                  <div><div className="text-[10px] text-white/50">Schuldenfrei ca.</div><div className="font-black">{verlauf.schuldenfrei ? verlauf.schuldenfrei.getFullYear() : '—'}</div></div>
                  <div><div className="text-[10px] text-white/50">Zinsanteil heute</div><div className="font-black">{formatCurrency(verlauf.zinsHeute)}</div></div>
                </div>
                <p className="text-[10px] text-white/40 mt-2">Liefen schon Sondertilgungen, korrigierst du das später im Reiter Finanzierung.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const schritt3Arb = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Feld label="Was zahlst du selbst im Monat (warm)?" pflicht><input type="number" min="0" className={inputCls} value={d.eigeneWarmmiete} onChange={e => set({ eigeneWarmmiete: e.target.value })} /></Feld>
      <Feld label="Hauptmietvertrag endet am" hint="Leer lassen, wenn unbefristet"><input type="date" className={inputCls} value={d.mietvertragEnde} onChange={e => set({ mietvertragEnde: e.target.value })} /></Feld>
      <p className="sm:col-span-2 text-[11px] text-gray-400">Kein Kaufpreis, kein Kredit, keine Abschreibung — der Pfad für Arbitrage ist bewusst kurz.</p>
    </div>
  );

  const schritt4Arb = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Feld label="Wie viele Zimmer vermietest du unter?"><input type="number" min="0" className={inputCls} value={d.zimmerVermietet} onChange={e => set({ zimmerVermietet: e.target.value })} /></Feld>
        <Feld label="Untermiete pro Zimmer (warm)"><input type="number" min="0" className={inputCls} value={d.untermieteProZimmer} onChange={e => set({ untermieteProZimmer: e.target.value })} /></Feld>
        <Feld label="Strom im Monat" hint="Wenn du ihn trägst"><input type="number" min="0" className={inputCls} value={d.strom} onChange={e => set({ strom: e.target.value })} /></Feld>
        <Feld label="Internet im Monat"><input type="number" min="0" className={inputCls} value={d.internet} onChange={e => set({ internet: e.target.value })} /></Feld>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={d.gez} onChange={e => set({ gez: e.target.checked })} /> Ich zahle den Rundfunkbeitrag für die Wohnung (18,36 €)</label>
    </div>
  );

  const schritt4Kauf = () => (
    <div className="space-y-5">
      {!istMFH && (
        <>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Ist die Wohnung gerade vermietet? <span className="text-indigo-600">*</span></p>
            <div className="flex flex-wrap gap-1.5">
              {[['vermietet', 'Ja'], ['leer', 'Nein, steht leer'], ['selbst', 'Ich nutze sie selbst']].map(([k, l]) => <Pille key={k} aktiv={d.mietstatus === k} onClick={() => set({ mietstatus: k })}>{l}</Pille>)}
            </div>
          </div>
          {d.mietstatus === 'vermietet' && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Was überweist dein Mieter jeden Monat?</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Karte aktiv={d.vermietungsmodell === 'kaltmiete_nk'} onClick={() => set({ vermietungsmodell: 'kaltmiete_nk' })} titel="Miete + Nebenkosten" sub="Kaltmiete plus monatliche Vorauszahlung, einmal im Jahr rechnest du ab." />
                  <Karte aktiv={d.vermietungsmodell === 'kaltmiete'} onClick={() => set({ vermietungsmodell: 'kaltmiete' })} titel="Nur Kaltmiete" sub="Betriebskosten trägst du und holst sie über die Abrechnung zurück." />
                  <Karte aktiv={d.vermietungsmodell === 'warmmiete'} onClick={() => set({ vermietungsmodell: 'warmmiete' })} titel="Pauschalmiete" sub="Ein Betrag, alles inklusive, keine Jahresabrechnung." />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Feld label={d.vermietungsmodell === 'warmmiete' ? 'Pauschalmiete' : 'Kaltmiete pro Monat'} pflicht><input type="number" min="0" className={inputCls} value={d.kaltmiete} onChange={e => set({ kaltmiete: e.target.value })} /></Feld>
                {d.vermietungsmodell === 'kaltmiete_nk' && <Feld label="NK-Vorauszahlung"><input type="number" min="0" className={inputCls} value={d.nkVz} onChange={e => set({ nkVz: e.target.value })} /></Feld>}
                <Feld label="Mieter seit"><input type="month" className={inputCls} value={d.mieterSeit} onChange={e => set({ mieterSeit: e.target.value })} /></Feld>
                <Feld label="Miete fällig am"><select className={inputCls} value={d.faelligTag} onChange={e => set({ faelligTag: e.target.value })}>{[1, 3, 5, 10, 15].map(t => <option key={t} value={t}>{t}. des Monats</option>)}</select></Feld>
                <Feld label="Name des Mieters" hint="optional"><input className={inputCls} value={d.mieterName} onChange={e => set({ mieterName: e.target.value })} /></Feld>
              </div>
              <div className={`rounded-xl p-3 border ${d.letzteErhoehung || d.nieErhoeht ? 'border-gray-200' : 'border-amber-300 bg-amber-50'}`}>
                <p className="text-sm font-semibold text-gray-800">Wann hast du die Miete zuletzt erhöht?</p>
                <p className="text-xs text-gray-500 mb-2">Ohne dieses Datum können wir dich nicht erinnern, sobald wieder eine Erhöhung möglich wäre.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="month" className={`${inputCls} w-44`} value={d.letzteErhoehung} disabled={d.nieErhoeht} onChange={e => set({ letzteErhoehung: e.target.value })} />
                  <Pille aktiv={d.nieErhoeht} onClick={() => set({ nieErhoeht: !d.nieErhoeht, letzteErhoehung: '' })}>Nie erhöht</Pille>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="rounded-xl border border-gray-200 p-3 space-y-3">
        <p className="text-sm font-bold text-gray-800">Was du monatlich zahlst</p>
        <p className="text-xs text-gray-500">Hier entscheidet sich, ob dein Cashflow stimmt.{istMFH ? '' : ' Zwei Zahlen reichen.'}</p>
        {!istMFH && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Feld label="Hausgeld an die WEG"><input type="number" min="0" className={inputCls} value={d.hausgeld} onChange={e => set({ hausgeld: e.target.value })} /></Feld>
            <Feld label="davon nicht umlagefähig" hint="Verwaltervergütung und Zuführung zur Instandhaltungsrücklage — diesen Teil bekommst du nie vom Mieter zurück.">
              <input type="number" min="0" className={`${inputCls} border-indigo-300 bg-indigo-50/50`} value={d.nuHG} onChange={e => set({ nuHG: e.target.value, nuGeschaetzt: false })} />
              {n(d.hausgeld) > 0 && leer(d.nuHG) && (
                <button type="button" onClick={() => set({ nuHG: String(Math.round(n(d.hausgeld) * 0.35)), nuGeschaetzt: true })} className="mt-1 text-[11px] font-semibold text-indigo-700 hover:underline">Weiß ich nicht, nimm 35 %</button>
              )}
            </Feld>
            <Feld label="Eigene Reparaturrücklage" hint="optional · üblich 0,80–1,00 € pro m²"><input type="number" min="0" className={inputCls} value={d.ruecklage} onChange={e => set({ ruecklage: e.target.value })} /></Feld>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Feld label="Grundsteuer pro Jahr" hint="aus dem Bescheid"><input type="number" min="0" className={inputCls} value={d.grundsteuerJahr} onChange={e => set({ grundsteuerJahr: e.target.value })} /></Feld>
          <Feld label="Versicherung / Monat"><input type="number" min="0" className={inputCls} value={d.versicherung} onChange={e => set({ versicherung: e.target.value })} /></Feld>
          <Feld label={istMFH ? 'Hausverwaltung / Monat' : 'Sondereigentumsverwaltung'}><input type="number" min="0" className={inputCls} value={d.sev} onChange={e => set({ sev: e.target.value })} /></Feld>
          {istMFH && <Feld label="Instandhaltungsrücklage"><input type="number" min="0" className={inputCls} value={d.ruecklage} onChange={e => set({ ruecklage: e.target.value })} /></Feld>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[['strom', 'Strom'], ['internet', 'Internet'], ['kontofuehrung', 'Kontoführung'], ['sonstige', 'Weitere Position']].map(([k, l]) => (
            <Pille key={k} aktiv={d.chips.includes(k)} onClick={() => set({ chips: d.chips.includes(k) ? d.chips.filter(c => c !== k) : [...d.chips, k] })}>{d.chips.includes(k) ? '✓ ' : '+ '}{l}</Pille>
          ))}
        </div>
        {d.chips.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {d.chips.map(k => (
              <Feld key={k} label={{ strom: 'Strom', internet: 'Internet', kontofuehrung: 'Kontoführung', sonstige: 'Weitere Position' }[k]}>
                <input type="number" min="0" className={inputCls} value={d[k]} onChange={e => set({ [k]: e.target.value })} />
              </Feld>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ersteZahl = () => {
    if (!cf || schritt < 4) return null;
    const einnahmen = istArb ? n(d.zimmerVermietet) * n(d.untermieteProZimmer) : (immo.kaltmiete || 0) + (immo.nebenkostenVomMieter || 0);
    const rate = verlauf ? verlauf.rateHeute : 0;
    const kosten = einnahmen - cf.nach - rate;
    return (
      <div className={`rounded-xl p-3 border ${cf.nach >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-gray-900">Deine erste Zahl steht</div>
            <div className="text-xs text-gray-600">{formatCurrency(einnahmen)} Einnahmen − {formatCurrency(Math.max(0, kosten))} Kosten{rate > 0 ? ` − ${formatCurrency(rate)} Kreditrate` : ''}</div>
          </div>
          <div className="flex gap-4 text-right">
            {!istArb && <div><div className="text-[10px] text-gray-500">vor Tilgung</div><div className={`font-black ${cf.vor >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{cf.vor >= 0 ? '+' : ''}{formatCurrency(cf.vor)}</div></div>}
            <div><div className="text-[10px] text-gray-500">{istArb ? 'Cashflow' : 'nach Tilgung'}</div><div className={`text-lg font-black ${cf.nach >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{cf.nach >= 0 ? '+' : ''}{formatCurrency(cf.nach)}</div></div>
          </div>
        </div>
      </div>
    );
  };

  // Vorschau-Karte (füllt sich mit jedem Schritt)
  const vorschau = () => (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
      <div className="bg-ink text-white p-4">
        <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Deine Karte entsteht</div>
        <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10">{d.typ ? { kaufimmobilie: 'Eigentumswohnung', mehrfamilienhaus: `Mehrfamilienhaus${d.wohnungen.length ? ` · ${d.wohnungen.length} WE` : ''}`, mietimmobilie: 'Angemietet · untervermietet' }[d.typ] : 'Objekttyp —'}</span>
        <div className="text-base font-bold mt-1 truncate">{d.name || d.strasse || 'Noch ohne Namen'}</div>
        <div className="text-xs text-white/60 truncate">{[d.plz, d.ort].filter(Boolean).join(' ') || '—'}{flaecheWert ? ` · ${flaecheWert} m²` : ''}</div>
      </div>
      <div className="p-4 space-y-1.5 text-sm">
        {!istArb && <div className="flex justify-between"><span className="text-gray-500">Aktueller Wert</span><strong>{immo.geschaetzterWert ? formatCurrency(immo.geschaetzterWert) : '—'}</strong></div>}
        {!istArb && <div className="flex justify-between"><span className="text-gray-500">{geerbt ? 'Erwerb' : 'Kaufpreis'}</span><strong>{geerbt ? (d.erwerbsart === 'erbe' ? 'geerbt' : 'geschenkt') : (n(d.kaufpreis) ? formatCurrency(n(d.kaufpreis)) : '—')}</strong></div>}
        {istArb && <div className="flex justify-between"><span className="text-gray-500">Eigene Miete</span><strong>{n(d.eigeneWarmmiete) ? formatCurrency(n(d.eigeneWarmmiete)) : '—'}</strong></div>}
        <div className="flex justify-between"><span className="text-gray-500">Cashflow</span>
          <strong className={cf && schritt >= 3 ? (cf.nach >= 0 ? 'text-emerald-600' : 'text-red-600') : ''}>{cf && schritt >= 3 ? `${cf.nach >= 0 ? '+' : ''}${formatCurrency(cf.nach)}` : '—'}</strong></div>
        <div className="pt-2">
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${quote}%` }} /></div>
          <div className="text-[10px] text-gray-400 mt-1">{quote} % ausgefüllt · Mit jedem Schritt füllt sich die Karte. Nach Schritt 3 steht deine erste Zahl.</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-canvas w-full sm:max-w-5xl h-[95vh] sm:h-[92vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-white px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Schritt {schritt} von 4 · {restZeit}</div>
            <div className="text-lg font-black text-gray-900">{titel}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-1">{[1, 2, 3, 4].map(s => <span key={s} className={`w-8 h-1.5 rounded-full ${s <= schritt ? 'bg-indigo-600' : 'bg-gray-200'}`} />)}</div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700" title="Schließen — der Entwurf bleibt gespeichert"><X size={20} /></button>
          </div>
        </div>

        {entwurfAngebot ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 max-w-md w-full text-center space-y-3">
              <p className="text-lg font-black text-gray-900">Weitermachen, wo du aufgehört hast?</p>
              <p className="text-sm text-gray-500">Du hast am {new Date(entwurfAngebot.am).toLocaleDateString('de-DE')} {entwurfAngebot.d.name ? `„${entwurfAngebot.d.name}“` : 'eine Immobilie'} angefangen (Schritt {entwurfAngebot.schritt} von 4).</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => { try { localStorage.removeItem(ENTWURF_KEY); } catch { /* egal */ } setEntwurfAngebot(null); }} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50">Neu beginnen</button>
                <button onClick={() => { setD({ ...LEER, ...entwurfAngebot.d }); setSchritt(entwurfAngebot.schritt || 1); setEntwurfAngebot(null); }} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Entwurf fortsetzen</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
                {schritt === 1 && schritt1()}
                {schritt === 2 && schritt2()}
                {schritt === 3 && (istArb ? schritt3Arb() : schritt3Kauf())}
                {schritt === 4 && (istArb ? schritt4Arb() : schritt4Kauf())}
                {ersteZahl()}
                {fehler && <p className="text-sm text-red-600 font-semibold">{fehler}</p>}
              </div>
              <div className="lg:sticky lg:top-0 h-fit">{vorschau()}</div>
            </div>
          </div>
        )}

        {!entwurfAngebot && (
          <div className="bg-white px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-400 flex items-center gap-1"><CheckCircle2 size={12} /> Entwurf wird automatisch gesichert</span>
            <div className="flex gap-2">
              {schritt > 1 ? <button onClick={zurueck} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50">Zurück</button>
                : <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50">Abbrechen</button>}
              {schritt < 4
                ? <button onClick={weiter} className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Weiter</button>
                : <button onClick={anlegen} disabled={speichert} className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">{speichert ? 'Wird angelegt…' : 'Immobilie anlegen'}</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
