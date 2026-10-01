import { useMemo, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { cashflowMonat } from '../utils/berechnung.js';
import { getAktuelleMiete } from '../utils/miete.js';

// Mietanpassung mit Cashflow-Wirkung (UX-Gesamtpaket A.5).
// Die Mieterhöhung ist der einzige Hebel, den ein Vermieter kurzfristig selbst in der Hand
// hat. Dieses Werkzeug zeigt in Sekunden, was eine Erhöhung mit Cashflow und Rendite macht,
// wo die Kappungsgrenze liegt und wie viel im ersten Jahr wirklich ankommt.

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const vz = (v) => (v > 0 ? '+' : v < 0 ? '−' : '');
const eur = (v) => `${vz(Math.round(v))}${formatCurrency(Math.abs(Math.round(v)))}`;
const pct = (v) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

// Kaltmiete zu einem Stichtag (Basis + Anpassungen bis dahin)
export function mieteAm(params, datum) {
  const t = new Date(datum).getTime();
  let m = Number(params.kaltmiete) || 0;
  [...(params.mietAnpassungen || [])].filter(a => a.kaltmiete != null && a.datum)
    .sort((a, b) => new Date(a.datum) - new Date(b.datum))
    .forEach(a => { if (new Date(a.datum).getTime() <= t) m = Number(a.kaltmiete) || m; });
  return m;
}

// Cashflow (vor/nach Tilgung) des heutigen Monats bei einer anderen Kaltmiete
export function cashflowBeiMiete(immo, miete) {
  const cf = cashflowMonat({ ...immo, kaltmiete: miete, mietAnpassungen: [] });
  return { vor: cf.vor, nach: cf.nach };
}

// Früheste Wirksamkeit: Beginn des dritten Monats nach Zugang (§ 558b BGB) → Monatserster in drei Monaten
const fruehesterStichtag = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth() + 3, 1)); };

function Kachel({ label, alt, neu, format = eur, gut = (a, b) => b >= a }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        {alt != null && <span className="text-xs text-gray-400 line-through tabular-nums">{format(alt)}</span>}
        <span className={`text-base font-extrabold tabular-nums ${gut(alt ?? 0, neu) ? 'text-emerald-700' : 'text-red-600'}`}>{format(neu)}</span>
      </div>
    </div>
  );
}

export default function MietanpassungWirkung({ params, immobilie, onAdd, onSchreiben, onKappungChange }) {
  const immo = useMemo(() => ({ ...immobilie, ...params }), [immobilie, params]);
  const heute = getAktuelleMiete(immo) || 0;
  const [stichtag, setStichtag] = useState(fruehesterStichtag);
  const [neu, setNeu] = useState(heute);
  const [eingetragen, setEingetragen] = useState(false);

  const kappungProzent = Number(params.kappungsgrenze) === 15 ? 15 : 20;
  const basisVor3J = (() => { const d = new Date(stichtag); d.setFullYear(d.getFullYear() - 3); return mieteAm(params, d); })();
  const kappung = Math.floor((basisVor3J || heute) * (1 + kappungProzent / 100));
  const flaeche = Number(params.wohnflaeche) || 0;
  const kaufpreis = Number(params.kaufpreis) || 0;

  const cfAlt = cashflowBeiMiete(immo, heute);
  const cfNeu = cashflowBeiMiete(immo, neu);
  const nullpunkt = Math.max(0, Math.ceil(heute - cfAlt.nach)); // Miete, bei der der Cashflow nach Tilgung 0 ist
  const max = Math.max(Math.ceil(heute * 1.4), kappung + 50, nullpunkt + 50, flaeche > 0 ? Math.ceil(flaeche * 10.5) : 0);
  const sprung = [
    ['+5 %', Math.round(heute * 1.05)],
    ['bis Kappungsgrenze', kappung],
    ['bis Cashflow bei 0', nullpunkt],
    ...(flaeche > 0 ? [['auf 10 €/m²', Math.round(flaeche * 10)]] : []),
  ].filter(([, v]) => v > heute); // nur Ziele über der heutigen Miete

  const diff = neu - heute;
  const s = new Date(stichtag);
  const monateErstesJahr = 12 - s.getMonth();
  const prozent = heute > 0 ? diff / heute * 100 : 0;
  const ueberKappung = neu > kappung;
  const posMarke = (v) => `${Math.min(100, Math.max(0, (v - heute) / Math.max(1, max - heute) * 100))}%`;

  if (!(heute > 0)) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-800">Was wäre, wenn?</p>
          <p className="text-xs text-gray-400">Schieb die Kaltmiete und sieh sofort, was sie mit deinem Cashflow macht. Nichts wird gespeichert, bis du übernimmst.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Neue Kaltmiete</div>
          <div className="text-xl font-extrabold text-gray-900 tabular-nums">{formatCurrency(neu)}</div>
          <div className={`text-xs font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{eur(diff)} · {vz(prozent)}{Math.abs(prozent).toLocaleString('de-DE', { maximumFractionDigits: 1 })} % gegenüber heute</div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-3">
        {/* Regler mit Marken: heute + Kappungsgrenze */}
        <div className="relative">
          <input type="range" aria-label="Neue Kaltmiete" min={heute} max={max} step={1} value={neu}
            onChange={e => { setNeu(Number(e.target.value)); setEingetragen(false); }} className="w-full accent-indigo-600" />
          <div className="relative h-5 text-[10px] text-gray-500">
            <span className="absolute left-0">{formatCurrency(heute)} heute</span>
            <span className="absolute -translate-x-1/2 text-amber-700 font-semibold whitespace-nowrap" style={{ left: posMarke(kappung) }}>▲ {formatCurrency(kappung)} Kappungsgrenze</span>
            <span className="absolute right-0">{formatCurrency(max)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {sprung.map(([l, v]) => (
            <button key={l} type="button" onClick={() => { setNeu(Math.max(heute, v)); setEingetragen(false); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${neu === Math.max(heute, v) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 hover:border-indigo-300'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Kachel label="Cashflow nach Tilgung" alt={cfAlt.nach} neu={cfNeu.nach} gut={(a, b) => b >= 0} />
        <Kachel label="Cashflow vor Tilgung" alt={cfAlt.vor} neu={cfNeu.vor} gut={(a, b) => b >= 0} />
        <Kachel label="Bruttomietrendite" alt={kaufpreis > 0 ? heute * 12 / kaufpreis * 100 : null} neu={kaufpreis > 0 ? neu * 12 / kaufpreis * 100 : 0} format={pct} />
        <Kachel label="Mehr pro Jahr" alt={null} neu={diff * 12} />
      </div>

      {/* Kappungsgrenze — Hinweis statt Sperre */}
      <div className={`mx-4 mt-3 rounded-xl px-3 py-2.5 text-xs ${ueberKappung ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
        <div className="flex gap-1.5">
          {ueberKappung ? <AlertTriangle size={14} className="shrink-0 mt-0.5" /> : <Check size={14} className="shrink-0 mt-0.5 text-emerald-600" />}
          <span>
            {ueberKappung
              ? `${formatCurrency(neu)} liegen über der Kappungsgrenze: ${kappungProzent} % in drei Jahren auf ${formatCurrency(basisVor3J)} sind ${formatCurrency(kappung)}. `
              : `${formatCurrency(neu)} liegen innerhalb der Kappungsgrenze (${kappungProzent} % in drei Jahren = ${formatCurrency(kappung)}). `}
            Zusätzlich darfst du die ortsübliche Vergleichsmiete nicht überschreiten — die kennt renditly nicht, dafür brauchst du den Mietspiegel.
          </span>
        </div>
        <label className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-600">
          <input type="checkbox" checked={kappungProzent === 15} onChange={e => onKappungChange?.(e.target.checked ? 15 : 20)} className="accent-indigo-600" />
          Angespannter Wohnungsmarkt — Kappungsgrenze 15 % statt 20 %
        </label>
      </div>

      {/* Ab wann gilt was */}
      <div className="px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-bold text-gray-700">Ab wann gilt was?</p>
          <label className="text-xs text-gray-500 flex items-center gap-1.5">Gültig ab
            <input type="date" value={stichtag} onChange={e => setStichtag(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md text-base sm:text-xs" />
          </label>
        </div>
        <div className="flex h-9 rounded-lg overflow-hidden text-[11px] font-semibold">
          <div className="flex-1 bg-gray-100 text-gray-600 px-2 flex items-center">{formatCurrency(heute)} · Cashflow {eur(cfAlt.nach)}</div>
          <div className="flex-1 bg-indigo-50 text-indigo-800 px-2 flex items-center border-l-2 border-indigo-500">{formatCurrency(neu)} · Cashflow {eur(cfNeu.nach)}</div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>heute</span><span>{s.toLocaleDateString('de-DE')} · Erhöhung wirksam</span><span>{s.getFullYear() + 2}</span></div>
        {diff > 0 && (
          <p className="text-xs text-gray-600 mt-2">
            {monateErstesJahr < 12
              ? `Im Jahr ${s.getFullYear()} wirkt die Erhöhung nur ${monateErstesJahr === 1 ? 'einen Monat' : `${monateErstesJahr} Monate`} — das Jahresergebnis steigt deshalb um ${formatCurrency(diff * monateErstesJahr)} statt um ${formatCurrency(diff * 12)}. Ab ${s.getFullYear() + 1} zählt der volle Betrag.`
              : `Ab ${s.getFullYear()} zählt der volle Betrag: ${formatCurrency(diff * 12)} mehr im Jahr.`}
            {' '}Cashflow, Rendite und Steuer rechnen ab dem Stichtag automatisch mit der neuen Miete.
          </p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">Keine Rechtsberatung. Prüfe Kappungsgrenze und Mietspiegel vor dem Erhöhungsschreiben.</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setNeu(heute); setEingetragen(false); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100">Nur durchgespielt</button>
          <button type="button" disabled={diff === 0 || eingetragen} onClick={() => { onAdd?.({ datum: stichtag, kaltmiete: neu, grund: diff > 0 ? 'Mieterhöhung' : 'Mietsenkung' }); setEingetragen(true); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-800 hover:border-gray-500 disabled:opacity-40">
            {eingetragen ? 'Eingetragen ✓' : 'Als Anpassung eintragen'}
          </button>
          {onSchreiben && (
            <button type="button" disabled={diff <= 0} onClick={() => onSchreiben({ neueKaltmiete: neu, wirksamkeitsDatum: stichtag })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40">Erhöhungsschreiben erstellen</button>
          )}
        </div>
      </div>
    </div>
  );
}
