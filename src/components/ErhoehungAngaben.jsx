import { erhoehungAusAngaben } from '../utils/kappung.js';
import { formatCurrency } from '../utils/format.js';

// „Um wie viel wurde zuletzt erhöht?“ — Miete davor ODER Prozent. Ohne diese Angabe kann
// renditly die Kappungsgrenze nicht prüfen (Loom: 15 % im Feb. 2025 → bis Feb. 2028 nichts mehr).
// wert: { vorher, prozent } als Text; nachher: Miete nach der Erhöhung (meist die heutige).
export default function ErhoehungAngaben({ wert = {}, onChange, nachher, kompakt = false, cls = '' }) {
  const r = erhoehungAusAngaben({ vorher: wert.vorher, nachher, prozent: wert.prozent });
  const input = `w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm bg-white text-right ${cls}`;
  return (
    <div className={kompakt ? 'space-y-1' : 'space-y-1.5'}>
      <p className="text-xs text-gray-600">Um wie viel wurde erhöht? <span className="text-gray-400">Eins von beiden reicht.</span></p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-gray-500">Miete davor (€)
          <input type="text" inputMode="decimal" value={wert.vorher ?? ''} onChange={e => onChange({ vorher: e.target.value, prozent: '' })} className={input} />
        </label>
        <label className="text-[11px] text-gray-500">oder Erhöhung in %
          <input type="text" inputMode="decimal" value={wert.prozent ?? ''} onChange={e => onChange({ prozent: e.target.value, vorher: '' })} className={input} />
        </label>
      </div>
      {r && Number(nachher) > 0 ? (
        <p className="text-[11px] text-gray-600">{formatCurrency(r.vorher)} → {formatCurrency(r.nachher)} ({r.prozent > 0 ? '+' : ''}{r.prozent.toLocaleString('de-DE')} %)</p>
      ) : !(Number(nachher) > 0) ? (
        <p className="text-[11px] text-amber-600">Erst die heutige Kaltmiete eintragen.</p>
      ) : null}
    </div>
  );
}

// Aus den Angaben die Anpassung bauen (oder null, wenn nichts Brauchbares eingegeben ist)
export function anpassungAusAngaben(datum, nachher, wert) {
  const r = erhoehungAusAngaben({ vorher: wert?.vorher, nachher, prozent: wert?.prozent });
  if (!datum || !r || !(r.vorher > 0) || !(r.nachher > 0)) return null;
  return { datum, kaltmiete: r.nachher, vorher: r.vorher, grund: 'Mieterhöhung' };
}
