import { ChevronDown } from 'lucide-react';

// Einheitliche Kopfzeile für alle einklappbaren Blöcke (Prüfbericht N-4).
// Regel: Symbol links in der Farbe des Zustands · Titel · höchstens zwei Plaketten (nie
// Fließtext) — die erste trägt Zustand und Farbe, die zweite den Kontext in Grau · Pfeil
// immer rechts als 32-px-Knopf, die ganze Zeile ist zusätzlich klickbar · ist alles
// erledigt, wird die erste Plakette grün.

const TON = {
  gruen: { icon: 'text-emerald-500', plakette: 'bg-emerald-100 text-emerald-700' },
  gelb: { icon: 'text-amber-500', plakette: 'bg-amber-100 text-amber-700' },
  rot: { icon: 'text-red-500', plakette: 'bg-red-100 text-red-700' },
  grau: { icon: 'text-gray-400', plakette: 'bg-gray-100 text-gray-600' },
};

export default function KlappKopf({ icon: Icon, titel, status, kontext, offen, onToggle, rechts, id }) {
  const ton = TON[status?.ton] || TON.grau;
  return (
    <div
      role="button" tabIndex={0} aria-expanded={offen} aria-controls={id}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      className={`flex items-center gap-3 px-4 sm:px-5 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors ${offen ? 'border-b border-gray-100' : ''}`}
    >
      {Icon && <Icon size={18} className={`shrink-0 ${ton.icon}`} aria-hidden="true" />}
      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
        <span className="font-bold text-gray-800">{titel}</span>
        {status?.text && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ton.plakette}`}>{status.text}</span>}
        {kontext && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{kontext}</span>}
      </div>
      {rechts && <div className="shrink-0" onClick={(e) => e.stopPropagation()}>{rechts}</div>}
      <span className="shrink-0 w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500" aria-hidden="true">
        <ChevronDown size={16} className={`transition-transform ${offen ? 'rotate-180' : ''}`} />
      </span>
    </div>
  );
}
