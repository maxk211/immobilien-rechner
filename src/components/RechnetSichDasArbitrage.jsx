import { formatCurrency } from '../utils/format.js';
import { berechneMtlCashflow } from '../utils/berechnung.js';
import { getJsPDF } from '../utils/lazyLibs.js';

// "Rechnet sich das?" — Modus Anmieten und untervermieten (Arbitrage).
// Kein Kaufpreis, kein Kredit: Einnahmen aus der Untervermietung minus eigene Miete und
// laufende Kosten. Dazu, was eine einmalige Möblierung kostet und wann sie sich zurückverdient,
// wie viele leere Zimmer das Objekt verkraftet und die Grenzwerte, ab denen es kippt.

export const A_START = {
  wohnflaeche: '', eigeneWarmmiete: '', zimmer: '', proZimmer: '',
  strom: '', internet: '', gez: false, sonstige: '', einmal: '', steuersatz: '',
};
export const RUNDFUNK = 18.36;

const n = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : 0; };
const vz = (v) => (v >= 0 ? '+' : '−');

export function rechneArbitrage(a) {
  const zimmer = n(a.zimmer), pro = n(a.proZimmer);
  const einnahmen = zimmer * pro;
  const laufend = n(a.strom) + n(a.internet) + (a.gez ? RUNDFUNK : 0) + n(a.sonstige);
  const ausgaben = n(a.eigeneWarmmiete) + laufend;
  const cf = einnahmen - ausgaben;
  const einmal = n(a.einmal);
  const steuer = n(a.steuersatz) > 0 && cf > 0 ? cf * 12 * n(a.steuersatz) / 100 : 0;
  return {
    zimmer, pro, einnahmen, laufend, ausgaben, cf, einmal, steuer,
    nachSteuerJahr: cf * 12 - steuer,
    leereZimmerVerkraftbar: pro > 0 && cf > 0 ? Math.floor(cf / pro) : 0,
    amortisationMonate: einmal > 0 && cf > 0 ? Math.ceil(einmal / cf) : null,
    renditeEinmal: einmal > 0 ? cf * 12 / einmal * 100 : null,
    aufschlag: n(a.eigeneWarmmiete) > 0 ? einnahmen / n(a.eigeneWarmmiete) : null,
  };
}

// Grenzwerte (Cashflow = 0), jeweils bei sonst gleichen Werten
export function grenzwerteArbitrage(a) {
  const r = rechneArbitrage(a);
  if (!(r.zimmer > 0) || !(r.pro > 0) || !(n(a.eigeneWarmmiete) > 0)) return null;
  return {
    proZimmer: r.ausgaben / r.zimmer,                 // Untermiete pro Zimmer mindestens
    eigeneMiete: r.einnahmen - r.laufend,             // eigene Warmmiete höchstens
    zimmer: Math.ceil(r.ausgaben / r.pro),            // so viele Zimmer müssen belegt sein
  };
}

function portfolioSchnittArbitrage(portfolio) {
  const m = portfolio.filter(i => i.aktiv !== false && i.immobilienTyp === 'mietimmobilie');
  if (!m.length) return null;
  return { anzahl: m.length, cf: m.reduce((s, i) => s + berechneMtlCashflow(i), 0) / m.length };
}

export function arbitrageVorbelegung(a) {
  return {
    typ: 'mietimmobilie', eigentumMonat: new Date().toISOString().slice(0, 7),
    wohnflaeche: a.wohnflaeche || '', zimmer: '', eigeneWarmmiete: a.eigeneWarmmiete || '',
    zimmerVermietet: a.zimmer || '', untermieteProZimmer: a.proZimmer || '',
    strom: a.strom || '', internet: a.internet || '', gez: !!a.gez, sonstige: a.sonstige || '',
  };
}

// Alte Arbitrage-Kalkulationen (vor Phase J) übernehmen
export function arbitrageAusGespeichert(p) {
  if (p.rsdArb) return { ...A_START, ...p.rsdArb };
  return { ...A_START, eigeneWarmmiete: p.eigeneWarmmiete ?? '', zimmer: p.anzahlZimmer ?? '', proZimmer: p.mietProZimmer ?? '', sonstige: p.arbNebenkosten ?? '', steuersatz: p.steuersatz ?? '' };
}

export async function erstelleArbitragePdf(a, r, g, name) {
  const jsPDF = await getJsPDF();
  const pdf = new jsPDF('p', 'mm', 'a4');
  const eur = (v) => formatCurrency(v).replace(/ /g, ' ');
  pdf.setFontSize(16); pdf.setFont(undefined, 'bold');
  pdf.text('Kalkulation Untervermietung', 14, 20);
  pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(110);
  pdf.text(`${name || 'Wohnung'} · erstellt am ${new Date().toLocaleDateString('de-DE')} mit renditly`, 14, 27);
  pdf.setTextColor(0);
  const tabelle = (titel, rows, y) => {
    pdf.autoTable({ startY: y, head: [[titel, '']], body: rows, theme: 'striped', styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 22, 28] }, columnStyles: { 1: { halign: 'right' } }, margin: { left: 14, right: 14 } });
    return pdf.lastAutoTable.finalY + 6;
  };
  let y = tabelle('Monatlich', [
    ['Untermiete', `${r.zimmer} × ${eur(r.pro)} = ${eur(r.einnahmen)}`],
    ['Eigene Warmmiete', eur(n(a.eigeneWarmmiete))], ['Weitere laufende Kosten', eur(r.laufend)],
    ['Cashflow', eur(r.cf)], ['Cashflow im Jahr', eur(r.cf * 12)],
  ], 34);
  y = tabelle('Einordnung', [
    ['Leere Zimmer verkraftbar', String(r.leereZimmerVerkraftbar)],
    ['Einmalkosten (Möblierung u. Ä.)', eur(r.einmal)],
    ['Zurückverdient nach', r.amortisationMonate ? `${r.amortisationMonate} Monaten` : '—'],
    ...(r.steuer > 0 ? [['Steuer auf den Überschuss (Annahme)', eur(r.steuer)], ['Nach Steuer im Jahr', eur(r.nachSteuerJahr)]] : []),
  ], y);
  if (g) {
    y = tabelle('Grenzwerte (Cashflow = 0, übrige Werte unverändert)', [
      ['Untermiete pro Zimmer mindestens', eur(Math.ceil(g.proZimmer))],
      ['Eigene Warmmiete höchstens', eur(Math.floor(g.eigeneMiete))],
      ['Belegte Zimmer mindestens', String(g.zimmer)],
    ], y);
  }
  pdf.setFontSize(8); pdf.setTextColor(120);
  pdf.text('Annahmen des Erstellers. Untervermietung braucht die Erlaubnis des Vermieters (§ 540 BGB). Keine Beratung.', 14, Math.min(y + 4, 285));
  pdf.save(`Kalkulation_Untervermietung_${(name || 'Wohnung').replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`);
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

export function ArbitrageEingaben({ a, set }) {
  const r = rechneArbitrage(a);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Die Wohnung, die du anmietest</p>
        <div className="grid grid-cols-2 gap-3">
          <Feld label="Eigene Warmmiete" hint="Was du selbst an den Vermieter zahlst"><input type="number" min="0" className={inputCls} value={a.eigeneWarmmiete} onChange={x => set({ eigeneWarmmiete: x.target.value })} /></Feld>
          <Feld label="Wohnfläche m²" hint="optional"><input type="number" min="0" className={inputCls} value={a.wohnflaeche} onChange={x => set({ wohnflaeche: x.target.value })} /></Feld>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Untervermietung</p>
        <div className="grid grid-cols-2 gap-3">
          <Feld label="Zimmer zum Untervermieten"><input type="number" min="0" className={inputCls} value={a.zimmer} onChange={x => set({ zimmer: x.target.value })} /></Feld>
          <Feld label="Untermiete pro Zimmer (warm)" hint={r.einnahmen > 0 ? `= ${formatCurrency(r.einnahmen)} im Monat` : undefined}><input type="number" min="0" className={inputCls} value={a.proZimmer} onChange={x => set({ proZimmer: x.target.value })} /></Feld>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Was du zusätzlich trägst</p>
        <div className="grid grid-cols-3 gap-3">
          <Feld label="Strom / Monat"><input type="number" min="0" className={inputCls} value={a.strom} onChange={x => set({ strom: x.target.value })} /></Feld>
          <Feld label="Internet / Monat"><input type="number" min="0" className={inputCls} value={a.internet} onChange={x => set({ internet: x.target.value })} /></Feld>
          <Feld label="Weitere / Monat" hint="z. B. Reinigung, Verschleiß"><input type="number" min="0" className={inputCls} value={a.sonstige} onChange={x => set({ sonstige: x.target.value })} /></Feld>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={a.gez} onChange={x => set({ gez: x.target.checked })} /> Ich zahle den Rundfunkbeitrag für die Wohnung (18,36 €)</label>
        <div className="grid grid-cols-2 gap-3">
          <Feld label="Einmalkosten" hint="Möblierung, Ausstattung — ohne Kaution, die bekommst du zurück"><input type="number" min="0" className={inputCls} value={a.einmal} onChange={x => set({ einmal: x.target.value })} /></Feld>
          <Feld label="Dein Steuersatz %" hint="optional — der Überschuss ist steuerpflichtig"><input type="number" min="0" max="45" className={inputCls} value={a.steuersatz} onChange={x => set({ steuersatz: x.target.value })} /></Feld>
        </div>
      </div>
    </div>
  );
}

export function ArbitrageUrteil({ a, portfolio = [] }) {
  const r = rechneArbitrage(a);
  const g = grenzwerteArbitrage(a);
  const pf = portfolioSchnittArbitrage(portfolio);
  if (!(r.einnahmen > 0) || !(n(a.eigeneWarmmiete) > 0)) {
    return <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">Eigene Warmmiete, Zimmer und Untermiete eintragen — dann steht hier das Urteil.</div>;
  }
  const urteil = r.cf >= r.pro && r.pro > 0
    ? { ton: 'bg-emerald-50 border-emerald-200 text-emerald-800', titel: 'Trägt sich — auch mit einem leeren Zimmer', text: `Dir bleiben ${formatCurrency(r.cf)} im Monat. Selbst wenn ${r.leereZimmerVerkraftbar === 1 ? 'ein Zimmer' : `${r.leereZimmerVerkraftbar} Zimmer`} leer ${r.leereZimmerVerkraftbar === 1 ? 'steht' : 'stehen'}, zahlst du nicht drauf.` }
    : r.cf >= 0
      ? { ton: 'bg-amber-50 border-amber-200 text-amber-900', titel: 'Trägt sich knapp', text: `Dir bleiben ${formatCurrency(r.cf)} im Monat — aber schon ein leeres Zimmer und du legst drauf.` }
      : { ton: 'bg-red-50 border-red-200 text-red-800', titel: 'Trägt sich nicht', text: `Selbst bei voller Belegung fehlen dir ${formatCurrency(-r.cf)} im Monat. Du zahlst effektiv für dein Wohnen dazu.` };
  const kacheln = [
    ['Untermiete gesamt', formatCurrency(r.einnahmen)],
    ['Aufschlag auf deine Miete', r.aufschlag ? `${r.aufschlag.toFixed(2).replace('.', ',')}×` : '—'],
    ['Leere Zimmer verkraftbar', String(r.leereZimmerVerkraftbar)],
    ['Einmalkosten zurück nach', r.amortisationMonate ? `${r.amortisationMonate} Mon.` : (r.einmal > 0 ? 'nie' : '—')],
  ];
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${urteil.ton}`}>
        <div className="text-xl font-black">{urteil.titel}</div>
        <p className="text-sm mt-1">{urteil.text}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Cashflow pro Monat</div>
          <div className={`text-2xl font-black ${r.cf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{vz(r.cf)}{formatCurrency(Math.abs(r.cf))}</div>
          <div className="text-xs text-gray-400">{formatCurrency(r.einnahmen)} Untermiete − {formatCurrency(r.ausgaben)} Kosten</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{r.steuer > 0 ? 'Im Jahr nach Steuer' : 'Im Jahr'}</div>
          <div className={`text-2xl font-black ${r.nachSteuerJahr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{vz(r.nachSteuerJahr)}{formatCurrency(Math.abs(r.nachSteuerJahr))}</div>
          <div className="text-xs text-gray-400">{r.steuer > 0 ? `nach ${formatCurrency(r.steuer)} Steuer (Annahme ${a.steuersatz} %)` : 'vor Steuern'}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kacheln.map(([l, v]) => <div key={l} className="bg-white rounded-xl border border-gray-200 p-3"><div className="text-[10px] text-gray-400">{l}</div><div className="font-black text-gray-900">{v}</div></div>)}
      </div>
      {g && (
        <div className="rounded-2xl bg-indigo-700 text-white p-4 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/60 mb-2">{r.cf >= 0 ? 'So viel Puffer hast du' : 'Was sich ändern müsste, damit es aufgeht'}</p>
          {[
            ['Untermiete pro Zimmer', formatCurrency(r.pro), `${r.cf >= 0 ? 'darf sinken auf' : 'ab'} ${formatCurrency(Math.ceil(g.proZimmer))}`],
            ['Eigene Warmmiete', formatCurrency(n(a.eigeneWarmmiete)), g.eigeneMiete > 0 ? `höchstens ${formatCurrency(Math.floor(g.eigeneMiete))}` : 'nicht erreichbar'],
            ['Belegte Zimmer', String(r.zimmer), `mindestens ${g.zimmer}`],
          ].map(([l, akt, w]) => (
            <div key={l} className="flex justify-between gap-3 py-1.5 border-b border-white/10 last:border-0">
              <span className="text-white/70">{l} <span className="text-white/40">statt {akt}</span></span><strong>{w}</strong>
            </div>
          ))}
          <p className="text-[11px] text-white/60 mt-2">Jede Zeile gilt, wenn alles andere gleich bleibt.</p>
        </div>
      )}
      {pf && <p className="text-sm text-gray-600">Im Vergleich zu deinen {pf.anzahl} angemieteten Objekten: Cashflow {r.cf >= pf.cf ? 'über' : 'unter'} deinem Schnitt von {vz(pf.cf)}{formatCurrency(Math.abs(pf.cf))}.</p>}
      <p className="text-[11px] text-gray-500">Untervermietung braucht die Erlaubnis deines Vermieters (§ 540 BGB). Prüf deinen Mietvertrag und die Regeln deiner Stadt zur Zweckentfremdung.</p>
    </div>
  );
}
