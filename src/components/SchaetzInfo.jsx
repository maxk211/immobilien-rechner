import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';

// Schätzung sieht aus wie Schätzung (UX-Gesamtpaket A.2).
// Zwei Signale: grauer Hinweis unter dem Betrag (<SchaetzZeile>) und ein Info-Zeichen
// am Label (<SchaetzInfo>), das die Rechnung im Klartext, die Unsicherheiten und
// passende Aktionen zeigt. Eine Regel für alle geschätzten Zahlen.

export function SchaetzZeile({ children = 'Schätzung', className = '' }) {
  return <span className={`block text-[10px] font-medium text-gray-400 ${className}`}>{children}</span>;
}

export default function SchaetzInfo({ titel, rechnung, gruende = [], fazit, aktionen = [], ausrichtung = 'links' }) {
  const [offen, setOffen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!offen) return;
    const esc = (e) => { if (e.key === 'Escape') setOffen(false); };
    const weg = (e) => { if (ref.current && !ref.current.contains(e.target)) setOffen(false); };
    document.addEventListener('keydown', esc);
    document.addEventListener('mousedown', weg);
    return () => { document.removeEventListener('keydown', esc); document.removeEventListener('mousedown', weg); };
  }, [offen]);
  return (
    <span ref={ref} className="relative inline-flex align-middle" onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label={`Warum ${titel} nur eine Schätzung ist`} aria-expanded={offen}
        onClick={(e) => { e.stopPropagation(); setOffen(o => !o); }}
        className="ml-1 text-gray-400 hover:text-indigo-600">
        <Info size={12} />
      </button>
      {offen && (
        <span role="dialog" className={`absolute z-50 top-5 ${ausrichtung === 'rechts' ? 'right-0' : 'left-0'} w-72 sm:w-80 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xl text-left normal-case tracking-normal font-normal`}>
          <span className="flex items-start justify-between gap-2">
            <span className="text-sm font-extrabold text-gray-900">{titel}</span>
            <button type="button" onClick={() => setOffen(false)} className="text-gray-400 hover:text-gray-700" aria-label="Schließen"><X size={14} /></button>
          </span>
          {rechnung && <span className="block mt-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-800 tabular-nums">{rechnung}</span>}
          {gruende.length > 0 && (
            <>
              <span className="block mt-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Warum das nur eine Schätzung ist</span>
              <span className="block mt-1 space-y-1">
                {gruende.map((g, i) => <span key={i} className="flex gap-1.5 text-xs text-gray-600"><span className="text-gray-300">·</span><span>{g}</span></span>)}
              </span>
            </>
          )}
          {fazit && <span className="block mt-2.5 text-xs text-gray-700 border-l-2 border-indigo-300 pl-2">{fazit}</span>}
          {aktionen.length > 0 && (
            <span className="flex flex-wrap gap-1.5 mt-3">
              {aktionen.map(a => (
                <button key={a.label} type="button" onClick={() => { setOffen(false); a.onClick(); }}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:border-indigo-300 hover:text-indigo-700">{a.label}</button>
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

// Fertige Inhalte je Schätzwert — eine Stelle, damit überall derselbe Text steht
export const beleihbarFreiInfo = ({ grenze, marktwert, restschuld, onGrenze, onMarktwert }) => ({
  titel: `Beleihbar frei: ${formatCurrency(Math.max(0, grenze / 100 * marktwert - restschuld))}`,
  rechnung: `${grenze} % × ${formatCurrency(marktwert)} Marktwert − ${formatCurrency(restschuld)} Restschuld`,
  gruende: [
    `Die ${grenze} % sind unsere Annahme, keine Zusage. Banken gehen je nach Lage, Zustand und Bonität von 60 bis 90 %.`,
    'Der Marktwert ist dein eigener Schätzwert. Die Bank bewertet selbst und liegt fast immer darunter.',
    'Einkommen, Haushaltsrechnung und bestehende Kredite kennt renditly nicht.',
    'Noch eingetragene Grundschulden sind nicht berücksichtigt.',
  ],
  fazit: 'Nimm die Zahl als Richtwert für die Frage, ob es ungefähr für die nächste Wohnung reicht — nicht als Zusage. Belastbar ist nur ein Angebot deiner Bank.',
  aktionen: [
    ...(onGrenze ? [{ label: 'Beleihungsgrenze ändern', onClick: onGrenze }] : []),
    ...(onMarktwert ? [{ label: 'Marktwert aktualisieren', onClick: onMarktwert }] : []),
  ],
});

export const nuGeschaetztInfo = ({ hausgeld, nu }) => ({
  titel: 'Nicht umlagefähig: mit 35 % geschätzt',
  rechnung: hausgeld ? `35 % × ${formatCurrency(hausgeld)} Hausgeld = ${formatCurrency(nu)}` : null,
  gruende: [
    'Steht so in keiner Abrechnung — der echte Anteil liegt meist zwischen 20 und 50 %.',
    'Er besteht vor allem aus Verwaltervergütung und Zuführung zur Instandhaltungsrücklage.',
  ],
  fazit: 'Den echten Wert findest du in der Hausgeldabrechnung oder im Wirtschaftsplan. Trag ihn ein, dann verschwindet die Schätzung.',
});

export const zinsbindungInfo = ({ jahre }) => ({
  titel: 'Zinsbindungsende ist abgeleitet',
  rechnung: jahre ? `Kreditstart + ${jahre} Jahre` : null,
  gruende: [
    'Die Zinsbindung läuft ab Vertragsunterschrift oder Auszahlung, nicht ab Kaufdatum — dazwischen liegen oft Wochen bis Monate.',
    'An diesem Datum hängt die wichtigste Erinnerung: die Anschlussfinanzierung.',
  ],
  fazit: 'Trag das Datum aus dem Kreditvertrag ein (Konditionen bearbeiten) — dann gilt es als geprüft.',
});

export const marktwertInfo = ({ qmPreis, flaeche, wert }) => ({
  titel: 'Marktwert aus dem m²-Preis',
  rechnung: qmPreis && flaeche ? `${formatCurrency(qmPreis)} × ${flaeche} m² = ${formatCurrency(wert)}` : null,
  gruende: [
    'Portalpreise sind Angebotspreise, keine Verkaufspreise.',
    'Lage im Haus, Zustand und Ausstattung verschieben den Wert deutlich.',
  ],
  fazit: 'Gut genug für Überblick und Beleihungsspielraum. Für einen Verkauf oder die Bank zählt ein Gutachten.',
});

export const restschuldZbInfo = () => ({
  titel: 'Restschuld zum Zinsbindungsende',
  gruende: [
    'Gerechnet ohne Sondertilgungen, die du noch nicht erfasst hast.',
    'Weicht die Rate durch Zinsänderungen oder Gebühren ab, verschiebt sich der Betrag.',
  ],
  fazit: 'Die Bank schickt jedes Jahr einen Kontoauszug zum Darlehen — der ist die Wahrheit.',
});
