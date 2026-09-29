import { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { setzeFeld, bestaetige, zaehle } from '../utils/plausibilitaet.js';

// Sammelansicht der Plausibilitätsprüfung (UX-Paket Teil 3, Abschnitt 8):
// gruppiert nach Stufe, jede Zeile mit dem Feld direkt bearbeitbar.
// Blockiert nie das Speichern; "Später" schließt einfach.

const STUFEN = {
  rot: { label: 'Widerspruch', rahmen: 'border-red-300 bg-red-50', chip: 'bg-red-600 text-white' },
  gelb: { label: 'Ungewöhnlich', rahmen: 'border-amber-300 bg-amber-50', chip: 'bg-amber-500 text-white' },
  grau: { label: 'Geschätzt', rahmen: 'border-gray-200 bg-gray-50', chip: 'bg-gray-400 text-white' },
};

const feldWert = (params, feld) => {
  if (!feld) return '';
  if (feld.startsWith('phase:')) {
    const [, idx, key] = feld.split(':');
    return params.finanzierungsphasen?.[Number(idx)]?.[key] ?? '';
  }
  return params[feld] ?? '';
};

function Zeile({ h, params, updateParams }) {
  const [entwurf, setEntwurf] = useState(() => String(feldWert(params, h.feld) ?? ''));
  const st = STUFEN[h.stufe];
  const uebernehmen = (wert) => {
    const v = h.feldTyp === 'date' ? wert : (wert === '' ? null : parseFloat(String(wert).replace(',', '.')));
    updateParams(setzeFeld(params, h.feld, v));
  };
  return (
    <div className={`rounded-xl border p-3 ${st.rahmen}`}>
      <div className="flex items-start gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${st.chip}`}>{st.label}</span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900">{h.titel}</div>
          <div className="text-xs text-gray-600 mt-0.5">{h.text}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        {h.feld && (
          <label className="text-[11px] text-gray-500">{h.feldLabel}
            <input type={h.feldTyp === 'date' ? 'date' : 'number'} step="any" value={entwurf}
              onChange={e => setEntwurf(e.target.value)}
              className="block mt-0.5 w-40 px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm bg-white" />
          </label>
        )}
        {h.feld && entwurf !== String(feldWert(params, h.feld) ?? '') && (
          <button onClick={() => uebernehmen(entwurf)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-700">Korrigieren</button>
        )}
        {h.vorschlag && (
          <button onClick={() => { setEntwurf(h.vorschlag); uebernehmen(h.vorschlag); }}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-500" title={h.vorschlagText}>
            Vorschlag übernehmen
          </button>
        )}
        {h.stufe !== 'rot' && (
          <button onClick={() => updateParams(bestaetige(params, h))}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50">
            Stimmt so
          </button>
        )}
      </div>
      {h.vorschlagText && <div className="text-[11px] text-gray-500 mt-1">{h.vorschlagText}</div>}
    </div>
  );
}

export default function PlausiPruefung({ hinweise, params, updateParams, onClose }) {
  const z = zaehle(hinweise);
  const offen = z.rot + z.gelb;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">{offen > 0 ? `${offen} Zahl${offen !== 1 ? 'en' : ''} sehen ungewöhnlich aus` : 'Alles plausibel'}</div>
            <div className="text-lg font-black text-gray-900">Kurz prüfen, dann rechnen wir richtig</div>
            <div className="text-xs text-gray-500">Wir vergleichen deine Eingaben mit typischen Werten. Auffällig heißt nicht falsch — du bestätigst oder korrigierst.</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 shrink-0"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {hinweise.length === 0 && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm"><CheckCircle2 size={16}/> Keine auffälligen Werte.</div>
          )}
          {['rot', 'gelb', 'grau'].map(stufe => hinweise.filter(h => h.stufe === stufe).map(h => (
            <Zeile key={`${h.id}-${h.fingerprint}`} h={h} params={params} updateParams={updateParams} />
          )))}
          <p className="text-[11px] text-gray-400 pt-2">
            Bestätigte Werte verlieren die Markierung dauerhaft und tauchen erst wieder auf, wenn sich die Zahl ändert.
            Widersprüche bleiben rot, bis sie aufgelöst sind — sie lassen sich nicht wegbestätigen.
          </p>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-400">Du kannst das jederzeit überspringen — die Hinweise bleiben im Cockpit sichtbar.</span>
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">{offen > 0 ? 'Später' : 'Fertig'}</button>
        </div>
      </div>
    </div>
  );
}

// Hinweis direkt am Feld: gelber/roter Rahmen darunter eine Zeile mit Vergleichswert und "Stimmt so".
export function PlausiFeldHinweis({ hinweise = [], feld, params, updateParams }) {
  const h = hinweise.find(x => x.feld === feld && x.stufe !== 'grau');
  if (!h) return null;
  return (
    <div className={`mt-1 flex items-start gap-1.5 text-[11px] ${h.stufe === 'rot' ? 'text-red-700' : 'text-amber-700'}`}>
      <AlertTriangle size={12} className="shrink-0 mt-0.5"/>
      <span className="flex-1">{h.titel}. {h.stufe === 'rot' ? 'Das kann nicht stimmen.' : 'Sicher?'}</span>
      {h.stufe !== 'rot' && updateParams && (
        <button type="button" onClick={() => updateParams(bestaetige(params, h))} className="font-bold underline shrink-0">Stimmt so</button>
      )}
    </div>
  );
}
