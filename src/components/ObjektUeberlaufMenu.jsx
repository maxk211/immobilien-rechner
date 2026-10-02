import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Check, Trash2 } from 'lucide-react';

// Abschnitt 6 + 7.2 (UX-Umbau): "Verkauft oder abgegeben" nicht als Primärbutton,
// sondern im Überlaufmenü, mit Bestätigungsdialog, Escape, Klick daneben und
// Abbrechen. Gemeinsam genutzt von Mehrfamilienhaus- und Mietimmobilie-Detail
// (die Kaufimmobilie hat dieselbe Logik inline).
const ObjektUeberlaufMenu = ({ aktiv, onAufgeben, onReaktivieren, onLoeschen, bestaetigenText = 'Daten bleiben für den Steuerexport erhalten.' }) => {
  const [menuOffen, setMenuOffen] = useState(false);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [datum, setDatum] = useState('');
  const menuRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!menuOffen && !dialogOffen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') { setMenuOffen(false); setDialogOffen(false); } };
    const onClickOutside = (e) => {
      if (menuOffen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOffen(false);
      if (dialogOffen && dialogRef.current && !dialogRef.current.contains(e.target)) setDialogOffen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [menuOffen, dialogOffen]);

  if (aktiv === false) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={onReaktivieren}
          className="px-3 py-1.5 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-1">
          <Check size={14}/> Reaktivieren
        </button>
        {onLoeschen && (
          <button onClick={onLoeschen} title="Immobilie löschen" aria-label="Immobilie löschen"
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-red-500/80 text-white border border-white/30 rounded-xl transition-colors">
            <Trash2 size={15}/>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setMenuOffen(v => !v)} title="Weitere Aktionen"
        className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl transition-colors">
        <MoreVertical size={16}/>
      </button>
      {menuOffen && (
        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-20 w-56">
          <button
            onClick={() => { setDatum(new Date().toISOString().split('T')[0]); setMenuOffen(false); setDialogOffen(true); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium">
            Verkauft oder abgegeben
          </button>
          {onLoeschen && (
            <button onClick={() => { setMenuOffen(false); onLoeschen(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 font-medium flex items-center gap-2 border-t border-gray-100">
              <Trash2 size={14}/> Immobilie löschen…
            </button>
          )}
        </div>
      )}
      {dialogOffen && (
        <div ref={dialogRef} className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-20 w-72 text-left">
          <p className="text-sm font-bold text-gray-800 mb-1">Als verkauft oder abgegeben markieren</p>
          <p className="text-xs text-gray-400 mb-3">{bestaetigenText}</p>
          <label className="block text-xs font-medium text-gray-600 mb-1">Datum</label>
          <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
            className="w-full px-2 py-1.5 border rounded-xl text-sm mb-3 text-gray-800 focus:ring-2 focus:ring-red-400" />
          <div className="flex gap-2">
            <button onClick={() => setDialogOffen(false)}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold">
              Abbrechen
            </button>
            <button onClick={() => { onAufgeben(datum); setDialogOffen(false); }}
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold">
              Bestätigen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjektUeberlaufMenu;
