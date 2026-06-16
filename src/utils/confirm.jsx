import { useState, useEffect } from 'react';

// ─── Imperatives Confirm-Dialog (Ersatz für window.confirm) ─────────────────
let _showConfirmDialog = null;
export const showConfirm = (message, opts = {}) =>
  new Promise((resolve) => {
    if (_showConfirmDialog) _showConfirmDialog({ message, resolve, ...opts });
    else resolve(window.confirm(message)); // Fallback falls Komponente noch nicht gemountet
  });

export const ConfirmDialog = () => {
  const [state, setState] = useState({ open: false, message: '', resolve: null, danger: true });
  useEffect(() => {
    _showConfirmDialog = ({ message, resolve, danger = true }) =>
      setState({ open: true, message, resolve, danger });
    return () => { _showConfirmDialog = null; };
  }, []);
  const handle = (result) => {
    state.resolve?.(result);
    setState(s => ({ ...s, open: false }));
  };
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={() => handle(false)}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}>
        <p className="text-slate-800 font-medium text-center mb-6">{state.message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => handle(false)}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors">
            Abbrechen
          </button>
          <button onClick={() => handle(true)}
            className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition-colors ${
              state.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}>
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
};
