import { useState } from 'react';
import { X } from 'lucide-react';
import { zahltIchAm, ZAHLER_LABEL } from '../utils/miete.js';

// "Wer zahlt?" für eine Kostenposition — mit Datum, auch rückwirkend.
// Beispiel: Rundfunkbeitrag zahlt ab 01.03. die Firma, Strom zahle weiter ich.
// Speichert in params.kostenZahler[feld] = [{ ab, zahler }].
const monatsErster = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };

export default function KostenZahler({ params, feld, onChange }) {
  const liste = [...((params.kostenZahler || {})[feld] || [])].sort((a, b) => new Date(a.ab) - new Date(b.ab));
  const ichHeute = zahltIchAm(params, feld);
  const [offen, setOffen] = useState(false);
  const [ab, setAb] = useState(monatsErster());
  const [wer, setWer] = useState(ichHeute ? 'mieter' : 'ich');

  const speichere = (neu) => onChange({ ...(params.kostenZahler || {}), [feld]: neu });
  const hinzufuegen = () => {
    if (!ab) return;
    const ohneGleiches = liste.filter(e => e.ab !== ab);
    speichere([...ohneGleiches, { ab, zahler: wer }].sort((a, b) => new Date(a.ab) - new Date(b.ab)));
    setOffen(false);
  };

  return (
    <div className="mt-1 text-[11px]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-gray-500">Wer zahlt?</span>
        <span className={`font-semibold ${ichHeute ? 'text-gray-800' : 'text-emerald-700'}`}>{ichHeute ? 'Ich' : ZAHLER_LABEL.mieter}</span>
        {!ichHeute && <span className="text-gray-400">— zählt nicht als deine Kosten</span>}
        <button type="button" onClick={() => setOffen(o => !o)} className="font-semibold text-indigo-600 hover:underline">
          {offen ? 'Abbrechen' : 'Wechsel eintragen'}
        </button>
      </div>
      {liste.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {liste.map(e => (
            <span key={e.ab} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              ab {new Date(e.ab).toLocaleDateString('de-DE')}: {e.zahler === 'ich' ? 'ich' : 'Mieter/Firma'}
              <button type="button" onClick={() => speichere(liste.filter(x => x.ab !== e.ab))} className="text-gray-400 hover:text-red-500" title="Wechsel löschen"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      {offen && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-gray-500">ab</span>
          <input type="date" value={ab} onChange={e => setAb(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md text-base sm:text-xs bg-white" />
          <select value={wer} onChange={e => setWer(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md text-base sm:text-xs bg-white">
            <option value="ich">zahle ich</option>
            <option value="mieter">zahlt Mieter / Firma direkt</option>
          </select>
          <button type="button" onClick={hinzufuegen} className="px-2.5 py-1 rounded-md bg-gray-900 text-white font-bold">Übernehmen</button>
          <span className="text-gray-400 w-full">Auch rückwirkend möglich — Cashflow, Steuer und Verlauf rechnen ab diesem Datum neu.</span>
        </div>
      )}
    </div>
  );
}
