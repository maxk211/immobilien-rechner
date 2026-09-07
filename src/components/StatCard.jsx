import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// Atomare, einzeln zitierbare Statistik-Karte — eine Kennzahl pro Karte,
// mit Konfidenz-Label (woher stammt die Zahl) und Kopier-Button für den
// fertigen Satz. Ziel: jede Zahl soll für Journalisten/Blogger/KI-Systeme
// als eigenständiges, sofort verwendbares Zitat funktionieren.

const KONFIDENZ = {
  verifiziert: { label: 'Verifiziert', className: 'bg-emerald-100 text-emerald-700' },
  aggregiert: { label: 'Aggregiert aus mehreren Quellen', className: 'bg-amber-100 text-amber-700' },
  berechnet: { label: 'Berechnet aus renditly-Daten', className: 'bg-indigo-100 text-indigo-700' },
};

export default function StatCard({ label, value, sub, konfidenz, accent, copyText }) {
  const [kopiert, setKopiert] = useState(false);
  const k = konfidenz && KONFIDENZ[konfidenz];

  const kopiere = () => {
    if (!copyText) return;
    navigator.clipboard?.writeText(copyText).then(() => {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    });
  };

  return (
    <div className={`rounded-2xl p-4 border relative ${accent ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-gray-100'}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</div>
      <div className={`text-xl sm:text-2xl font-black ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className={`text-xs mt-0.5 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</div>}
      {(k || copyText) && (
        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-dashed border-white/20 empty:hidden" style={!accent ? { borderColor: '#f1f5f9' } : undefined}>
          {k ? (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${accent ? 'bg-white/15 text-white' : k.className}`}>{k.label}</span>
          ) : <span />}
          {copyText && (
            <button
              onClick={kopiere}
              title="Statistik kopieren"
              className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${accent ? 'text-indigo-200 hover:text-white' : 'text-slate-300 hover:text-indigo-600'}`}
            >
              {kopiert ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
