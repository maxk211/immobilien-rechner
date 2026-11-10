import { useState } from 'react';

// Schließen mit ungespeicherten Änderungen: fragen statt still verwerfen.
export function useSchliessenMitRueckfrage({ hatAenderungen, onSpeichern, onSchliessen }) {
  const [offen, setOffen] = useState(false);
  const schliessen = () => { if (hatAenderungen) setOffen(true); else onSchliessen(); };
  const dialog = offen ? (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Ungespeicherte Änderungen">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-3">
        <p className="text-base font-bold text-gray-900">Ungespeicherte Änderungen</p>
        <p className="text-sm text-gray-600">Du hast hier etwas geändert, das noch nicht gespeichert ist. Was soll damit passieren?</p>
        <div className="flex flex-col gap-2 pt-1">
          <button type="button" onClick={async () => { setOffen(false); await onSpeichern(); onSchliessen(); }}
            className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700">Speichern und schließen</button>
          <button type="button" onClick={() => { setOffen(false); onSchliessen(); }}
            className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50">Verwerfen</button>
          <button type="button" onClick={() => setOffen(false)}
            className="w-full py-2 rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-100">Weiter bearbeiten</button>
        </div>
      </div>
    </div>
  ) : null;
  return { schliessen, dialog };
}
