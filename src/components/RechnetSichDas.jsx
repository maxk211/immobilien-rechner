import { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Bookmark, FileDown, ArrowRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/format.js';
import { kostenStruktur, berechneMtlCashflow } from '../utils/berechnung.js';
import { getAktuelleMiete } from '../utils/miete.js';
import { portfolioMieteProQm } from '../utils/plausibilitaet.js';
import { GREST_HISTORIE, grestSatz, bundeslandAusPlz } from '../config/grunderwerbsteuer.js';
import { getJsPDF } from '../utils/lazyLibs.js';
import { loadKalkulationen, saveKalkulation, deleteKalkulation } from '../supabaseClient';

// "Rechnet sich das?" (UX-Paket Teil 3, Abschnitt 2): ein Objekt durchspielen, das dir noch
// nicht gehört. Links die Annahmen, rechts das Urteil in einem Satz, Cashflow vor/nach Tilgung,
// Kennzahlen und die vier Grenzwerte, ab denen das Objekt kippt. Nichts wird gespeichert,
// bis du es als Szenario merkst oder als Immobilie übernimmst.
// Rechenregeln wie im Bestand (Teil 2, Abschnitt 5): Bewirtschaftung = nicht umlagefähiger
// Hausgeldanteil + Rücklage + Grundsteuer + Versicherung + SEV (+ weitere). Rate = Darlehen × (Zins + Tilgung) ÷ 12.

const NOTAR_GRUNDBUCH = 1.9;
const MAKLER = 3.0;
const START = {
  kaufpreis: '', wohnflaeche: '', plz: '', bundesland: '', mitMakler: true, knkManuell: '',
  kaltmiete: '', hausgeld: '', nuHG: '', grundsteuerJahr: '', ruecklage: '', sev: '', sonstige: '',
  sanierung: '',
  eigenkapital: '', sollzins: 4, tilgung: 2, // Zins/Tilgung: vereinbarte Startannahmen
};

const n = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : 0; };
const leer = (v) => v === '' || v === null || v === undefined;
const pct = (v, d = 2) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
const vz = (v) => (v >= 0 ? '+' : '−');

// ── Kernrechnung ────────────────────────────────────────────────────────────
export function rechne(e) {
  const kp = n(e.kaufpreis);
  const grest = e.bundesland ? (grestSatz(e.bundesland)?.satz ?? 0) : 0;
  const knkProzent = !leer(e.knkManuell) ? n(e.knkManuell) : grest + NOTAR_GRUNDBUCH + (e.mitMakler ? MAKLER : 0);
  const nk = kp * knkProzent / 100;
  const san = n(e.sanierung);
  const invest = kp + nk + san;
  const ek = Math.min(n(e.eigenkapital), invest);
  const darlehen = Math.max(0, invest - ek);
  const z = n(e.sollzins), t = n(e.tilgung);
  const rate = darlehen * (z + t) / 100 / 12;
  const zinsMonat = darlehen * z / 100 / 12;
  const hausgeld = n(e.hausgeld);
  const nuGeschaetzt = leer(e.nuHG) && hausgeld > 0;
  const nu = leer(e.nuHG) ? hausgeld * 0.35 : n(e.nuHG);
  const ks = kostenStruktur({
    immobilienTyp: 'kaufimmobilie', vermietungsmodell: 'kaltmiete_nk',
    hausgeld, hausgeldNichtUmlagefaehig: nu, verwaltung: n(e.sev), instandhaltung: n(e.ruecklage),
    grundsteuerMonat: n(e.grundsteuerJahr) / 12, nebenkosten: n(e.sonstige),
  });
  const kalt = n(e.kaltmiete);
  const nach = kalt - ks.bewirtschaftung - rate;
  const vor = kalt - ks.bewirtschaftung - zinsMonat;
  return {
    kp, grest, knkProzent, nk, san, invest, ek, darlehen, rate, zinsMonat, nu, nuGeschaetzt,
    bewirtschaftung: ks.bewirtschaftung, kalt, nach, vor,
    brutto: kp > 0 ? kalt * 12 / kp * 100 : 0,
    netto: kp > 0 ? (kalt - ks.bewirtschaftung) * 12 / kp * 100 : 0,
    auslauf: kp > 0 ? darlehen / kp * 100 : 0,
    faktor: kalt > 0 ? kp / (kalt * 12) : null,
    qm: n(e.wohnflaeche) > 0 ? kalt / n(e.wohnflaeche) : null,
  };
}

// Grenzwert per Bisektion: der Wert, bei dem der Cashflow nach Tilgung genau 0 ist
function grenze(e, feld, lo, hi, steigend) {
  const f = (x) => rechne({ ...e, [feld]: x }).nach;
  if (steigend ? f(hi) < 0 : f(lo) < 0) return null; // selbst im besten Fall nicht erreichbar
  if (steigend ? f(lo) >= 0 : f(hi) >= 0) return steigend ? lo : hi;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if ((f(m) >= 0) === steigend) hi = m; else lo = m;
  }
  return steigend ? hi : lo;
}

export function grenzwerte(e) {
  const r = rechne(e);
  if (!(r.kp > 0) || !(r.kalt > 0)) return null;
  return {
    miete: grenze(e, 'kaltmiete', 0, r.kalt * 5 + 5000, true),
    kaufpreis: grenze(e, 'kaufpreis', 0, r.kp * 3, false),
    eigenkapital: grenze(e, 'eigenkapital', 0, r.invest, true),
    zins: grenze(e, 'sollzins', 0, 15, false),
  };
}

// Schnitt des eigenen Portfolios (nur Kaufimmobilien mit Kaufpreis)
function portfolioSchnitt(portfolio) {
  const k = portfolio.filter(i => i.aktiv !== false && i.immobilienTyp !== 'mietimmobilie' && (i.kaufpreis || 0) > 0);
  if (!k.length) return null;
  const brutto = k.reduce((s, i) => s + (getAktuelleMiete(i) || 0) * 12 / i.kaufpreis * 100, 0) / k.length;
  const cf = k.reduce((s, i) => s + berechneMtlCashflow(i), 0) / k.length;
  return { anzahl: k.length, brutto, cf };
}

// Übergabe an den Anlage-Wizard ("Gekauft — als Immobilie übernehmen")
export function alsWizardVorbelegung(e) {
  const r = rechne(e);
  const monat = new Date().toISOString().slice(0, 7);
  let zahlweise = 'kaufpreis', zusatzEK = '';
  if (r.ek <= 1) zahlweise = 'alles';
  else if (r.ek >= r.kp + r.nk - 1) zahlweise = 'ohne';
  else if (Math.abs(r.ek - r.nk) > 1) { zahlweise = 'zusatzEK'; zusatzEK = String(Math.round(r.ek)); }
  return {
    typ: 'kaufimmobilie', plz: e.plz || '', bundesland: e.bundesland || '', eigentumMonat: monat,
    wohnflaeche: e.wohnflaeche || '', erwerbsart: 'kauf', kaufpreis: e.kaufpreis || '',
    mitMakler: e.mitMakler, knkManuell: e.knkManuell || '',
    zahlweise, zusatzEK, sollzins: e.sollzins, tilgung: e.tilgung, kenne: 'tilgung',
    mietstatus: n(e.kaltmiete) > 0 ? 'vermietet' : '', vermietungsmodell: 'kaltmiete_nk', kaltmiete: e.kaltmiete || '',
    hausgeld: e.hausgeld || '', nuHG: leer(e.nuHG) ? (n(e.hausgeld) > 0 ? String(Math.round(n(e.hausgeld) * 0.35)) : '') : e.nuHG,
    nuGeschaetzt: leer(e.nuHG) && n(e.hausgeld) > 0,
    grundsteuerJahr: e.grundsteuerJahr || '', ruecklage: e.ruecklage || '', sev: e.sev || '',
    chips: n(e.sonstige) > 0 ? ['sonstige'] : [], sonstige: e.sonstige || '',
  };
}

// Alte Kalkulationen (vor Phase J) in die neuen Felder übertragen
function ausGespeichert(p) {
  if (p.rsd) return { ...START, ...p.rsd };
  const flaeche = p.wohnflaecheKalk ?? '';
  const kalt = p.mietmodus === 'qm' ? n(p.wohnflaecheKalk) * n(p.mietPreisProQm)
    : p.mietmodus === 'zimmer' ? n(p.anzahlZimmerKauf) * n(p.mietPreisProZimmer) : p.kaltmiete;
  return {
    ...START, kaufpreis: p.kaufpreis ?? '', wohnflaeche: flaeche, knkManuell: p.nebenkosten ?? '',
    eigenkapital: p.eigenkapital ?? '', sollzins: p.zinssatz ?? 4, tilgung: p.tilgung ?? 2,
    kaltmiete: kalt ?? '', sonstige: p.betriebskosten ?? '',
    sanierung: p.sanierung ? Object.values(p.sanierung).reduce((s, v) => s + n(v), 0) || '' : '',
  };
}

async function erstelleBankPdf(e, r, g, name) {
  const jsPDF = await getJsPDF();
  const pdf = new jsPDF('p', 'mm', 'a4');
  const eur = (v) => formatCurrency(v).replace(/ /g, ' ');
  pdf.setFontSize(16); pdf.setFont(undefined, 'bold');
  pdf.text('Objektkalkulation', 14, 20);
  pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(110);
  pdf.text(`${name || 'Kaufobjekt'} · erstellt am ${new Date().toLocaleDateString('de-DE')} mit renditly`, 14, 27);
  pdf.setTextColor(0);
  const zeilen = (titel, rows, y) => {
    pdf.autoTable({ startY: y, head: [[titel, '']], body: rows, theme: 'striped', styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 22, 28] }, columnStyles: { 1: { halign: 'right' } }, margin: { left: 14, right: 14 } });
    return pdf.lastAutoTable.finalY + 6;
  };
  let y = zeilen('Objekt und Investition', [
    ['Kaufpreis', eur(r.kp)], ['Wohnfläche', e.wohnflaeche ? `${e.wohnflaeche} m²` : '—'],
    ['Bundesland', e.bundesland ? GREST_HISTORIE[e.bundesland].name : '—'],
    ['Kaufnebenkosten', `${eur(r.nk)} (${pct(r.knkProzent, 2)})`],
    ...(r.san > 0 ? [['Sanierung', eur(r.san)]] : []),
    ['Gesamtinvestition', eur(r.invest)], ['Eigenkapital', eur(r.ek)], ['Darlehen', eur(r.darlehen)],
  ], 34);
  y = zeilen('Finanzierung und Ertrag (monatlich)', [
    ['Sollzins / anfängliche Tilgung', `${pct(n(e.sollzins))} / ${pct(n(e.tilgung))}`],
    ['Kreditrate', eur(r.rate)], ['davon Zinsen (Monat 1)', eur(r.zinsMonat)],
    ['Kaltmiete', eur(r.kalt)], ['Nicht umlagefähige Kosten', eur(r.bewirtschaftung)],
    ['Cashflow vor Tilgung', eur(r.vor)], ['Cashflow nach Tilgung', eur(r.nach)],
  ], y);
  y = zeilen('Kennzahlen', [
    ['Bruttomietrendite', pct(r.brutto)], ['Nettomietrendite', pct(r.netto)],
    ['Beleihungsauslauf (Darlehen ÷ Kaufpreis)', pct(r.auslauf, 0)], ['Kaufpreisfaktor', r.faktor ? r.faktor.toFixed(1).replace('.', ',') : '—'],
  ], y);
  if (g) {
    y = zeilen('Grenzwerte (Cashflow nach Tilgung = 0, übrige Werte unverändert)', [
      ['Kaltmiete mindestens', g.miete != null ? eur(Math.ceil(g.miete)) : 'nicht erreichbar'],
      ['Kaufpreis höchstens', g.kaufpreis != null ? eur(Math.floor(g.kaufpreis / 100) * 100) : 'nicht erreichbar'],
      ['Eigenkapital mindestens', g.eigenkapital != null ? eur(Math.ceil(g.eigenkapital / 100) * 100) : 'auch ohne Kredit nicht'],
      ['Sollzins höchstens', g.zins != null ? pct(Math.floor(g.zins * 100) / 100) : 'auch bei 0 % nicht'],
    ], y);
  }
  pdf.setFontSize(8); pdf.setTextColor(120);
  pdf.text('Alle Werte sind Annahmen des Erstellers. Keine Anlage- oder Finanzierungsberatung.', 14, Math.min(y + 4, 285));
  pdf.save(`Kalkulation_${(name || 'Objekt').replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`);
}

function Feld({ label, hint, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-600">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <span className="block text-[11px] font-normal text-gray-400 mt-0.5">{hint}</span>}
    </label>
  );
}
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-indigo-500';

export default function RechnetSichDas({ onClose, portfolio = [], onUebernehmen }) {
  const [e, setE] = useState(START);
  const [mehr, setMehr] = useState(false);
  const [szenarien, setSzenarien] = useState([]);
  const [listeOffen, setListeOffen] = useState(false);
  const [aktuellId, setAktuellId] = useState(null);
  const [name, setName] = useState('');
  const set = (u) => setE(x => ({ ...x, ...u }));

  useEffect(() => { loadKalkulationen().then(setSzenarien).catch(() => {}); }, []);

  const r = useMemo(() => rechne(e), [e]);
  const g = useMemo(() => grenzwerte(e), [e]);
  const pf = useMemo(() => portfolioSchnitt(portfolio), [portfolio]);
  const pfQm = useMemo(() => portfolioMieteProQm(portfolio), [portfolio]);
  const bereit = r.kp > 0 && r.kalt > 0;
  const blName = e.bundesland ? GREST_HISTORIE[e.bundesland]?.name : null;

  const urteil = !bereit ? null
    : r.nach >= 100 ? { ton: 'gruen', titel: 'Trägt sich', text: `Nach allen Kosten und der vollen Kreditrate bleiben dir monatlich ${formatCurrency(r.nach)}.` }
    : r.nach >= 0 ? { ton: 'gruen', titel: 'Trägt sich knapp', text: `Nach allen Kosten und der vollen Kreditrate bleiben ${formatCurrency(r.nach)} im Monat — wenig Puffer für Leerstand oder Reparaturen.` }
    : r.vor >= 0 ? { ton: 'gelb', titel: 'Trägt sich knapp nicht', text: `Nach Kosten und voller Kreditrate fehlen dir monatlich ${formatCurrency(-r.nach)}. Vor Tilgung bleibt es positiv — die Wohnung trägt ihre laufenden Kosten und Zinsen also aus eigener Kraft, du legst nur für den Vermögensaufbau drauf.` }
    : { ton: 'rot', titel: 'Trägt sich nicht', text: `Selbst vor Tilgung fehlen ${formatCurrency(-r.vor)} im Monat — die Miete deckt Kosten und Zinsen nicht. Du legst jeden Monat ${formatCurrency(-r.nach)} dazu.` };
  const tonKlasse = { gruen: 'bg-emerald-50 border-emerald-200 text-emerald-800', gelb: 'bg-amber-50 border-amber-200 text-amber-900', rot: 'bg-red-50 border-red-200 text-red-800' };

  const merken = async () => {
    const titel = name.trim() || `Szenario ${new Date().toLocaleDateString('de-DE')}`;
    try {
      const saved = await saveKalkulation({ id: aktuellId || undefined, name: titel, typ: 'kauf', rsd: e,
        // für ältere Ansichten lesbar mitspeichern
        kaufpreis: n(e.kaufpreis), eigenkapital: n(e.eigenkapital), zinssatz: n(e.sollzins), tilgung: n(e.tilgung), kaltmiete: n(e.kaltmiete) });
      setAktuellId(saved.id); setName(saved.name);
      setSzenarien(prev => [saved, ...prev.filter(s => s.id !== saved.id)]);
      toast.success('Szenario gemerkt ✓');
    } catch (err) { toast.error('Konnte nicht gespeichert werden: ' + err.message); }
  };

  const zeileGrenze = (label, aktuell, wert, fmt, leerText) => (
    <div className="flex justify-between gap-3 py-1.5 border-b border-white/10 last:border-0">
      <span className="text-white/70">{label} <span className="text-white/40">statt {aktuell}</span></span>
      <strong className="text-white">{wert == null ? leerText : fmt(wert)}</strong>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-canvas w-full sm:max-w-6xl h-[95vh] sm:h-[92vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-white px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Vor dem Kauf durchrechnen</div>
            <div className="text-lg font-black text-gray-900 flex items-center gap-2"><Calculator size={18} /> Rechnet sich das?</div>
            <div className="text-xs text-gray-500">Ein Objekt durchspielen, das dir noch nicht gehört. Nichts wird gespeichert, bis du es übernimmst.</div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button onClick={() => setListeOffen(o => !o)} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <Bookmark size={13} /> Gemerkte Szenarien ({szenarien.length})
            </button>
            {listeOffen && (
              <div className="absolute right-8 top-9 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-80 overflow-y-auto">
                {szenarien.length === 0 && <p className="p-3 text-xs text-gray-400">Noch keine Szenarien gemerkt.</p>}
                {szenarien.map(s => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 hover:bg-gray-50">
                    <button className="flex-1 text-left min-w-0" onClick={() => { setE(ausGespeichert(s)); setAktuellId(s.id); setName(s.name); setListeOffen(false); }}>
                      <div className="text-sm font-semibold text-gray-800 truncate">{s.name}</div>
                      <div className="text-[10px] text-gray-400">{s.savedAt ? new Date(s.savedAt).toLocaleDateString('de-DE') : ''}</div>
                    </button>
                    <button onClick={async () => { setSzenarien(p => p.filter(x => x.id !== s.id)); try { await deleteKalkulation(s.id); } catch { /* egal */ } }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 p-5">
            {/* Annahmen */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Das Objekt</p>
                <div className="grid grid-cols-2 gap-3">
                  <Feld label="Kaufpreis"><input type="number" min="0" className={inputCls} value={e.kaufpreis} onChange={x => set({ kaufpreis: x.target.value })} /></Feld>
                  <Feld label="Wohnfläche m²"><input type="number" min="0" className={inputCls} value={e.wohnflaeche} onChange={x => set({ wohnflaeche: x.target.value })} /></Feld>
                  <Feld label="PLZ" hint="optional — für das Bundesland">
                    <input className={inputCls} inputMode="numeric" value={e.plz} onChange={x => { const p = x.target.value.trim(); set({ plz: p, bundesland: bundeslandAusPlz(p) || e.bundesland }); }} />
                  </Feld>
                  <Feld label="Bundesland">
                    <select className={inputCls} value={e.bundesland} onChange={x => set({ bundesland: x.target.value })}>
                      <option value="">wählen</option>
                      {Object.entries(GREST_HISTORIE).map(([k, v]) => <option key={k} value={k}>{v.name} · {String(grestSatz(k).satz).replace('.', ',')} %</option>)}
                    </select>
                  </Feld>
                </div>
                <Feld label="Kaufnebenkosten" hint={blName ? `${pct(r.grest, 1)} Grunderwerbsteuer ${blName} + ${pct(NOTAR_GRUNDBUCH, 1)} Notar und Grundbuch${e.mitMakler ? ` + ${pct(MAKLER, 1)} Makler` : ''}. Änderbar.` : 'Ohne Bundesland fehlt die Grunderwerbsteuer.'}>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" min="0" className={`${inputCls} w-24`} value={!leer(e.knkManuell) ? e.knkManuell : Math.round(r.knkProzent * 100) / 100} onChange={x => set({ knkManuell: x.target.value })} />
                    <span className="text-sm text-gray-500">% = {formatCurrency(r.nk)}</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-normal text-gray-500 mt-1"><input type="checkbox" checked={!e.mitMakler} onChange={x => set({ mitMakler: !x.target.checked, knkManuell: '' })} /> ohne Makler</label>
                </Feld>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Miete und Kosten</p>
                <div className="grid grid-cols-2 gap-3">
                  <Feld label="Erwartete Kaltmiete" hint={r.qm ? `${formatCurrency(r.qm)}/m²${pfQm ? ` — in deinem Portfolio liegt der Schnitt bei ${formatCurrency(pfQm.schnitt)}` : ''}` : undefined}>
                    <input type="number" min="0" className={inputCls} value={e.kaltmiete} onChange={x => set({ kaltmiete: x.target.value })} />
                  </Feld>
                  <Feld label="Hausgeld" hint={n(e.hausgeld) > 0 ? `davon nicht umlagefähig: ${formatCurrency(r.nu)}${r.nuGeschaetzt ? ' · geschätzt 35 %' : ''}` : undefined}>
                    <input type="number" min="0" className={inputCls} value={e.hausgeld} onChange={x => set({ hausgeld: x.target.value })} />
                  </Feld>
                </div>
                <button type="button" onClick={() => setMehr(m => !m)} className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  {mehr ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Weitere Kosten und Sanierung
                </button>
                {mehr && (
                  <div className="grid grid-cols-2 gap-3">
                    <Feld label="davon nicht umlagefähig" hint="leer = 35 % geschätzt"><input type="number" min="0" className={inputCls} value={e.nuHG} onChange={x => set({ nuHG: x.target.value })} /></Feld>
                    <Feld label="Grundsteuer / Jahr"><input type="number" min="0" className={inputCls} value={e.grundsteuerJahr} onChange={x => set({ grundsteuerJahr: x.target.value })} /></Feld>
                    <Feld label="Eigene Rücklage / Monat"><input type="number" min="0" className={inputCls} value={e.ruecklage} onChange={x => set({ ruecklage: x.target.value })} /></Feld>
                    <Feld label="Sondereigentumsverwaltung"><input type="number" min="0" className={inputCls} value={e.sev} onChange={x => set({ sev: x.target.value })} /></Feld>
                    <Feld label="Weitere laufende Kosten"><input type="number" min="0" className={inputCls} value={e.sonstige} onChange={x => set({ sonstige: x.target.value })} /></Feld>
                    <Feld label="Sanierung vor Vermietung" hint="einmalig, erhöht die Gesamtinvestition">
                      <input type="number" min="0" className={inputCls} value={e.sanierung} onChange={x => set({ sanierung: x.target.value })} />
                    </Feld>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">So würdest du finanzieren</p>
                <div className="grid grid-cols-3 gap-3">
                  <Feld label="Eigenkapital"><input type="number" min="0" className={inputCls} value={e.eigenkapital} onChange={x => set({ eigenkapital: x.target.value })} /></Feld>
                  <Feld label="Sollzins %"><input type="number" step="0.01" min="0" className={inputCls} value={e.sollzins} onChange={x => set({ sollzins: x.target.value })} /></Feld>
                  <Feld label="Tilgung %"><input type="number" step="0.1" min="0" className={inputCls} value={e.tilgung} onChange={x => set({ tilgung: x.target.value })} /></Feld>
                </div>
                <p className="text-xs text-gray-500">Darlehen {formatCurrency(r.darlehen)} · Rate {formatCurrency(r.rate)}/Monat · Beleihungsauslauf {pct(r.auslauf, 0)} vom Kaufpreis</p>
              </div>
            </div>

            {/* Urteil */}
            <div className="lg:col-span-3 space-y-4">
              {!bereit ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                  Kaufpreis und erwartete Kaltmiete eintragen — dann steht hier das Urteil.
                </div>
              ) : (
                <>
                  <div className={`rounded-2xl border p-4 ${tonKlasse[urteil.ton]}`}>
                    <div className="text-xl font-black">{urteil.titel}</div>
                    <p className="text-sm mt-1">{urteil.text}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Cashflow vor Tilgung', r.vor], ['Cashflow nach Tilgung', r.nach]].map(([l, v]) => (
                      <div key={l} className="bg-white rounded-2xl border border-gray-200 p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{l}</div>
                        <div className={`text-2xl font-black ${v >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{vz(v)}{formatCurrency(Math.abs(v))}</div>
                        <div className="text-xs text-gray-400">pro Monat · {vz(v)}{formatCurrency(Math.abs(v * 12))} im Jahr</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[['Bruttorendite', pct(r.brutto)], ['Nettorendite', pct(r.netto)], ['Beleihungsauslauf', pct(r.auslauf, 0)], ['Kaufpreisfaktor', r.faktor ? r.faktor.toFixed(1).replace('.', ',') : '—']].map(([l, v]) => (
                      <div key={l} className="bg-white rounded-xl border border-gray-200 p-3"><div className="text-[10px] text-gray-400">{l}</div><div className="font-black text-gray-900">{v}</div></div>
                    ))}
                  </div>
                  {g && (
                    <div className="rounded-2xl bg-indigo-700 text-white p-4 text-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/60 mb-2">{r.nach >= 0 ? 'So viel Puffer hast du' : 'Was sich ändern müsste, damit es aufgeht'}</p>
                      {zeileGrenze(r.nach >= 0 ? 'Kaltmiete darf sinken auf' : 'Kaltmiete', formatCurrency(r.kalt), g.miete, v => `${r.nach >= 0 ? '' : 'ab '}${formatCurrency(Math.ceil(v))}`, 'nicht erreichbar')}
                      {zeileGrenze('Kaufpreis', formatCurrency(r.kp), g.kaufpreis, v => `höchstens ${formatCurrency(Math.floor(v / 100) * 100)}`, 'nicht erreichbar')}
                      {zeileGrenze('Eigenkapital', formatCurrency(r.ek), g.eigenkapital, v => (v <= 0 ? 'auch ohne Eigenkapital' : `ab ${formatCurrency(Math.ceil(v / 100) * 100)}`), 'auch ohne Kredit nicht')}
                      {zeileGrenze('Sollzins', pct(n(e.sollzins)), g.zins, v => (v >= 15 ? 'über 15 %' : `unter ${pct(Math.floor(v * 100) / 100)}`), 'auch bei 0 % nicht')}
                      <p className="text-[11px] text-white/60 mt-2">Jede Zeile zeigt, wo genau die Grenze liegt, wenn alles andere gleich bleibt. Das ist deine Verhandlungsbasis.</p>
                    </div>
                  )}
                  {pf && (
                    <p className="text-sm text-gray-600">
                      Im Vergleich zu deinen {pf.anzahl} Objekten: Bruttorendite {r.brutto >= pf.brutto ? 'über' : 'unter'} deinem Schnitt von {pct(pf.brutto, 1)},
                      Cashflow {r.nach >= pf.cf ? 'über' : 'unter'} deinem Schnitt von {vz(pf.cf)}{formatCurrency(Math.abs(pf.cf))}.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white px-5 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-gray-400">Keine Anlageberatung. Alle Werte sind deine Annahmen.</span>
          <div className="flex flex-wrap items-center gap-2">
            <input className="px-3 py-1.5 border border-gray-200 rounded-lg text-base sm:text-sm w-44" placeholder="Name des Szenarios" value={name} onChange={x => setName(x.target.value)} />
            <button disabled={!bereit} onClick={merken} className="px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl text-gray-700 hover:border-gray-500 disabled:opacity-40 flex items-center gap-1"><Bookmark size={14} /> Als Szenario merken</button>
            <button disabled={!bereit} onClick={() => erstelleBankPdf(e, r, g, name)} className="px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl text-gray-700 hover:border-gray-500 disabled:opacity-40 flex items-center gap-1"><FileDown size={14} /> Als PDF für die Bank</button>
            {onUebernehmen && (
              <button disabled={!bereit} onClick={() => onUebernehmen(alsWizardVorbelegung(e))} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1">
                Gekauft — als Immobilie übernehmen <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
