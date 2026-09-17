import { useState, useMemo } from 'react';
import { Wallet, Home, TrendingUp, BarChart3, Target, ChevronDown, Check, CheckCircle2, Trophy } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { berechneMtlCashflow, berechneImmoVermoegenswerte } from '../utils/berechnung.js';
import { getAktuelleMiete, getAktuelleUntermiete, getAktuelleWarmmiete } from '../utils/miete.js';

const STORAGE_KEY = 'portfolioZiele';

const ZIEL_TYPEN = [
  {
    id: 'cashflow',
    label: 'Monatlicher Cashflow',
    icon: <Wallet size={16}/>,
    unit: '€/Mo',
    color: 'emerald',
    defaultZiel: 2000,
    step: 100,
    format: (v) => `${v >= 0 ? '+' : ''}${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)}`,
  },
  {
    id: 'anzahl',
    label: 'Anzahl Immobilien',
    icon: <Home size={16}/>,
    unit: 'Objekte',
    color: 'blue',
    defaultZiel: 5,
    step: 1,
    format: (v) => `${v}`,
  },
  {
    id: 'vermoegen',
    label: 'Aufgebautes Vermögen',
    icon: <TrendingUp size={16}/>,
    unit: '€',
    color: 'amber',
    defaultZiel: 250000,
    step: 10000,
    format: (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v),
  },
  {
    id: 'rendite',
    label: 'Ø Brutto-Rendite',
    icon: <BarChart3 size={16}/>,
    unit: '%',
    color: 'violet',
    defaultZiel: 5,
    step: 0.5,
    format: (v) => `${v.toFixed(1)}%`,
  },
];

const COLOR_MAP = {
  emerald: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' },
  blue: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600' },
  amber: { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600' },
  violet: { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600' },
};

function ladeZiele() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function berechnePortfolioStats(portfolio) {
  let gesamtCashflowMonat = 0;
  let gesamtVermoegen = 0;
  let gesamtBruttoMieteJahr = 0;
  let gesamtKaufpreis = 0;

  portfolio.forEach(immo => {
    const isMiet = immo.immobilienTyp === 'mietimmobilie';

    if (isMiet) {
      const vertragsEnde = immo.mietvertragEnde ? new Date(immo.mietvertragEnde) : null;
      const vertragsLaeuft = !vertragsEnde || vertragsEnde >= new Date();
      if (vertragsLaeuft) {
        const einnahmen = (immo.anzahlZimmerVermietet || 0) * getAktuelleUntermiete(immo);
        const ausgaben = getAktuelleWarmmiete(immo) + (immo.arbitrageStrom || 0) + (immo.arbitrageInternet || 0) + (immo.arbitrageGEZ ?? 18.36);
        gesamtCashflowMonat += einnahmen - ausgaben;
      }
    } else {
      gesamtCashflowMonat += berechneMtlCashflow(immo);
      const vw = berechneImmoVermoegenswerte(immo);
      if (vw) gesamtVermoegen += vw.freiVermoegen;

      const bruttoMiete = getAktuelleMiete(immo) * 12;
      const kaufpreis = immo.kaufpreis || 0;
      gesamtBruttoMieteJahr += bruttoMiete;
      gesamtKaufpreis += kaufpreis;
    }
  });

  const bruttoRendite = gesamtKaufpreis > 0 ? (gesamtBruttoMieteJahr / gesamtKaufpreis) * 100 : 0;

  return {
    cashflow: gesamtCashflowMonat,
    anzahl: portfolio.length,
    vermoegen: gesamtVermoegen,
    rendite: bruttoRendite,
  };
}

const PortfolioZiele = ({ portfolio, inline = false }) => {
  const [ziele, setZiele] = useState(ladeZiele);
  const [editMode, setEditMode] = useState(false);
  const [editZiele, setEditZiele] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  const stats = useMemo(() => berechnePortfolioStats(portfolio), [portfolio]);

  const hatZiele = ZIEL_TYPEN.some(t => ziele[t.id] != null);

  const startEdit = () => {
    const init = {};
    // Bereits gespeicherter Zustand wird respektiert (null = deaktiviert, Wert = aktiv)
    // Ziele die noch nie berührt wurden, bekommen den Defaultwert (= aktiv beim ersten Öffnen)
    ZIEL_TYPEN.forEach(t => {
      init[t.id] = t.id in ziele ? ziele[t.id] : t.defaultZiel;
    });
    setEditZiele(init);
    setEditMode(true);
  };

  const saveEdit = () => {
    // editZiele enthält alle 4 Keys (aktiv = Zahl, deaktiviert = null)
    setZiele(editZiele);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editZiele));
    setEditMode(false);
  };

  // ── INLINE MODE (eingebettet in PortfolioOverview) ────────────────────────
  if (inline) {
    if (!hatZiele && !editMode) {
      return (
        <div className="h-full rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-4 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="text-white font-bold text-sm mb-0.5 flex items-center gap-1"><Target size={14}/>Portfolio-Ziele</div>
            <div className="text-slate-400 text-xs">Cashflow, Immobilien, Vermögen & Rendite tracken</div>
          </div>
          <button onClick={startEdit} className="flex-shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all">
            Ziele setzen
          </button>
        </div>
      );
    }

    if (editMode) {
      return (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-800 text-sm flex items-center gap-1"><Target size={14}/>Ziele bearbeiten</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ZIEL_TYPEN.map(typ => {
              const c = COLOR_MAP[typ.color];
              return (
                <div key={typ.id} className={`p-3 rounded-xl border ${c.border} ${c.bg}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">{typ.icon} {typ.label}</span>
                    <button
                      onClick={() => {
                        const u = { ...editZiele };
                        if (u[typ.id] != null) u[typ.id] = null;
                        else u[typ.id] = typ.defaultZiel;
                        setEditZiele(u);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-all flex items-center gap-0.5 ${editZiele[typ.id] != null ? `${c.text} bg-white border ${c.border}` : 'text-gray-400 bg-gray-100'}`}
                    >
                      {editZiele[typ.id] != null ? <Check size={10}/> : '○'}
                    </button>
                  </div>
                  {editZiele[typ.id] != null && (
                    <input type="number" value={editZiele[typ.id]} step={typ.step}
                      onChange={e => setEditZiele({ ...editZiele, [typ.id]: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-right focus:ring-1 focus:ring-indigo-400"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setEditMode(false)} className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Abbrechen</button>
            <button onClick={saveEdit} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Speichern</button>
          </div>
        </div>
      );
    }

    // Inline Ziele-Anzeige
    const aktiveZiele = ZIEL_TYPEN.filter(t => ziele[t.id] != null);
    return (
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-3 sm:p-4 h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Target size={12}/>Portfolio-Ziele</span>
          <button onClick={startEdit} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">Bearbeiten</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {aktiveZiele.map(typ => {
            const zielWert = ziele[typ.id];
            const istWert = stats[typ.id];
            const prozent = Math.min(100, Math.max(0, (istWert / zielWert) * 100));
            const erreicht = istWert >= zielWert;
            const c = COLOR_MAP[typ.color];
            return (
              <div key={typ.id} className={`p-2.5 rounded-xl border ${c.border} ${c.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500 font-medium truncate">{typ.label}</span>
                  <span className={`text-[10px] font-black ml-1 ${erreicht ? 'text-emerald-600' : c.text}`}>{prozent.toFixed(0)}%</span>
                </div>
                <div className={`text-sm font-black ${c.text}`}>{typ.format(istWert)}</div>
                <div className="text-[10px] text-gray-400">/ {typ.format(zielWert)}</div>
                <div className="w-full bg-white/70 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${erreicht ? 'bg-emerald-500' : c.bar}`} style={{ width: `${prozent}%` }} />
                </div>
              </div>
            );
          })}
          {aktiveZiele.length === 0 && (
            <div className="col-span-4 text-xs text-gray-400 py-2">Keine Ziele gesetzt — klicke "Bearbeiten"</div>
          )}
        </div>
      </div>
    );
  }

  // ── STANDALONE MODE (separates Widget) ───────────────────────────────────
  if (!hatZiele && !editMode) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 mb-4 flex items-center justify-between gap-4 shadow">
        <div>
          <div className="text-white font-bold text-base mb-0.5 flex items-center gap-1"><Target size={16}/>Portfolio-Ziele</div>
          <div className="text-slate-400 text-sm">Setze dir Ziele — Cashflow, Immobilien-Anzahl, Vermögen & Rendite.</div>
        </div>
        <button onClick={startEdit} className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
          Ziele setzen
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 transition-all select-none" onClick={() => !editMode && setCollapsed(c => !c)}>
        <div className="flex items-center gap-2">
          <Target size={16} className="text-gray-500"/>
          <span className="font-bold text-gray-800">Portfolio-Ziele</span>
          {hatZiele && !editMode && <span className="text-xs text-gray-400 ml-1">{ZIEL_TYPEN.filter(t => ziele[t.id] != null).length} aktive Ziele</span>}
        </div>
        <div className="flex items-center gap-2">
          {!editMode && <button onClick={e => { e.stopPropagation(); startEdit(); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all">Bearbeiten</button>}
          {!editMode && <span className={`text-gray-400 text-sm transition-transform ${collapsed ? '' : 'rotate-180'}`}><ChevronDown size={14}/></span>}
        </div>
      </div>

      {editMode && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4">Setze deine Zielwerte. Nur aktivierte Ziele werden angezeigt.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ZIEL_TYPEN.map(typ => {
              const c = COLOR_MAP[typ.color];
              return (
                <div key={typ.id} className={`p-4 rounded-xl border ${c.border} ${c.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">{typ.icon}<span className={`font-semibold text-sm ${c.text}`}>{typ.label}</span></div>
                    <button onClick={() => { const u = { ...editZiele }; if (u[typ.id] != null) u[typ.id] = null; else u[typ.id] = typ.defaultZiel; setEditZiele(u); }}
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all flex items-center gap-1 ${editZiele[typ.id] != null ? `${c.text} bg-white border ${c.border}` : 'text-gray-400 bg-gray-100'}`}>
                      {editZiele[typ.id] != null ? <><Check size={10}/>Aktiv</> : 'Inaktiv'}
                    </button>
                  </div>
                  {editZiele[typ.id] != null && (
                    <div className="flex items-center gap-2 mt-2">
                      <input type="number" value={editZiele[typ.id]} step={typ.step} onChange={e => setEditZiele({ ...editZiele, [typ.id]: parseFloat(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm font-bold text-right focus:ring-2 focus:ring-indigo-400" />
                      <span className="text-sm text-gray-500 whitespace-nowrap">{typ.unit}</span>
                    </div>
                  )}
                  {editZiele[typ.id] == null && <div className="text-xs text-gray-400 mt-1">Klicke auf "Inaktiv" um das Ziel zu aktivieren</div>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setEditMode(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Abbrechen</button>
            <button onClick={saveEdit} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">Speichern</button>
          </div>
        </div>
      )}

      {!editMode && !collapsed && hatZiele && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            {ZIEL_TYPEN.filter(t => ziele[t.id] != null).map(typ => {
              const zielWert = ziele[typ.id];
              const istWert = stats[typ.id];
              const prozent = Math.min(100, Math.max(0, (istWert / zielWert) * 100));
              const erreicht = istWert >= zielWert;
              const c = COLOR_MAP[typ.color];
              return (
                <div key={typ.id} className={`p-4 rounded-xl border ${c.border} ${c.bg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`w-8 h-8 rounded-lg ${c.icon} flex items-center justify-center`}>
                      {erreicht ? <CheckCircle2 size={16} className="text-emerald-500"/> : typ.icon}
                    </div>
                    <span className={`text-xs font-bold ${erreicht ? 'text-emerald-600' : c.text}`}>{prozent.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 mb-1">
                    <div className="text-xs text-gray-500 mb-0.5">{typ.label}</div>
                    <div className={`text-lg font-black ${c.text}`}>{typ.format(istWert)}</div>
                    <div className="text-xs text-gray-400">Ziel: {typ.format(zielWert)}</div>
                  </div>
                  <div className="w-full bg-white/70 rounded-full h-2 mt-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-700 ${erreicht ? 'bg-emerald-500' : c.bar}`} style={{ width: `${prozent}%` }} />
                  </div>
                  {erreicht && <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1"><Trophy size={12}/>Ziel erreicht!</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioZiele;
