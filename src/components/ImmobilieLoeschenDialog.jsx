import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, X, Archive, Loader2 } from 'lucide-react';

// Endgültiges Löschen einer Immobilie — nur nach Abtippen des Namens.
// Gedacht für doppelt oder falsch angelegte Objekte. Für verkaufte Objekte
// bietet der Dialog "Verkauft oder abgegeben" als sichere Alternative an.

export const bestaetigungsText = (immo) =>
  (immo?.name || '').trim() || (immo?.adresse || '').trim() || 'LÖSCHEN';

// Vergleich tolerant bei Groß-/Kleinschreibung und doppelten Leerzeichen, sonst exakt
const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE');
export const namePasst = (eingabe, immo) => norm(eingabe) !== '' && norm(eingabe) === norm(bestaetigungsText(immo));

export default function ImmobilieLoeschenDialog({ immobilie, mieterAnzahl = 0, nkAnzahl = 0, onAbbrechen, onLoeschen, onAlsVerkauft }) {
  const [eingabe, setEingabe] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [hinweisEinfuegen, setHinweisEinfuegen] = useState(false);
  const inputRef = useRef(null);
  const soll = bestaetigungsText(immobilie);
  const ok = namePasst(eingabe, immobilie);
  const dokAnzahl = (immobilie?.dokumente || []).length;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape' && !laeuft) onAbbrechen(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [laeuft, onAbbrechen]);

  const loeschen = async () => {
    if (!ok || laeuft) return;
    setLaeuft(true);
    try { await onLoeschen(); } finally { setLaeuft(false); }
  };

  const mitGeloescht = [
    'Stammdaten, Kauf und Finanzierung',
    'Mieteingänge, Kosten und Steuerdaten',
    mieterAnzahl > 0 && `${mieterAnzahl} Mieter${mieterAnzahl === 1 ? '' : ' (mit Kaution und Historie)'}`,
    nkAnzahl > 0 && `${nkAnzahl} Nebenkostenabrechnung${nkAnzahl === 1 ? '' : 'en'}`,
    dokAnzahl > 0 && `${dokAnzahl} hochgeladene${dokAnzahl === 1 ? 's Dokument' : ' Dokumente'}`,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !laeuft) onAbbrechen(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="loeschen-titel"
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden font-app">
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><AlertTriangle size={20} /></span>
          <div className="flex-1 min-w-0">
            <h2 id="loeschen-titel" className="font-extrabold text-gray-900">Immobilie endgültig löschen?</h2>
            <p className="text-sm text-red-700 mt-0.5 truncate">{immobilie?.name || immobilie?.adresse || 'Ohne Namen'}</p>
          </div>
          <button onClick={onAbbrechen} disabled={laeuft} aria-label="Schließen" className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-gray-700">Das lässt sich <strong>nicht rückgängig machen</strong>. Mit gelöscht werden:</p>
          <ul className="mt-2 space-y-1">
            {mitGeloescht.map(t => (
              <li key={t} className="flex gap-2 text-sm text-gray-600"><span className="text-red-400">•</span>{t}</li>
            ))}
          </ul>

          {onAlsVerkauft && immobilie?.aktiv !== false && (
            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm text-gray-600 flex gap-2.5">
              <Archive size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                Verkauft oder abgegeben? Dann lieber archivieren — die Zahlen bleiben für die Steuer erhalten.
                <button onClick={onAlsVerkauft} disabled={laeuft} className="block mt-1 font-bold text-indigo-600 hover:text-indigo-800">Stattdessen als verkauft markieren</button>
              </div>
            </div>
          )}

          <label className="block mt-4">
            <span className="text-sm text-gray-700">Tippe zur Bestätigung <strong className="font-extrabold text-gray-900 select-none">{soll}</strong> ein:</span>
            <input ref={inputRef} value={eingabe} onChange={e => setEingabe(e.target.value)}
              onPaste={(e) => { e.preventDefault(); setHinweisEinfuegen(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter') loeschen(); }}
              autoComplete="off" spellCheck={false} aria-label="Name der Immobilie zur Bestätigung"
              className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-base focus:outline-none focus:ring-2 ${ok ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-300'}`} />
            {hinweisEinfuegen && <span className="block text-xs text-gray-400 mt-1">Bitte abtippen statt einfügen — so löscht niemand aus Versehen.</span>}
          </label>
        </div>

        <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row gap-2">
          <button onClick={onAbbrechen} disabled={laeuft} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">Abbrechen</button>
          <button onClick={loeschen} disabled={!ok || laeuft}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
            {laeuft ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Endgültig löschen
          </button>
        </div>
      </div>
    </div>
  );
}
