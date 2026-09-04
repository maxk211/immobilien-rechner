import { useState } from 'react';
import { CheckCircle2, Circle, X, Sparkles } from 'lucide-react';

const LS_DISMISSED_KEY = 'renditly-erste-schritte-dismissed';

/**
 * Kurze Fortschritts-Checkliste für neue Accounts.
 * Zeigt die ersten 3 sinnvollen Schritte und blendet sich automatisch aus,
 * sobald der Nutzer schon mehrere Immobilien hat oder die Checkliste
 * manuell geschlossen wurde. Kein neues "Feature" im Sinne von Logik,
 * sondern reine Wahrnehmungs-/Motivationshilfe (siehe Usability-Analyse #4).
 */
export default function ErsteSchritte({ portfolio, mieterListe }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(LS_DISMISSED_KEY) === 'true'; }
    catch { return false; }
  });

  // Nur für Accounts relevant, die noch am Anfang stehen. Erfahrene Nutzer
  // mit größerem Portfolio sollen hierdurch nicht dauerhaft Platz verlieren.
  if (dismissed || (portfolio || []).length > 3) return null;

  const hatImmobilie = (portfolio || []).length > 0;
  const hatDokument = (portfolio || []).some(immo => (immo.dokumente || []).length > 0);
  const hatMieter = (mieterListe || []).length > 0;

  const schritte = [
    { id: 'immo', label: 'Erste Immobilie angelegt', erledigt: hatImmobilie },
    { id: 'dokument', label: 'Erstes Dokument hochgeladen (z. B. Kaufvertrag)', erledigt: hatDokument },
    { id: 'mieter', label: 'Ersten Mieter erfasst', erledigt: hatMieter },
  ];

  const erledigtCount = schritte.filter(s => s.erledigt).length;
  const alleErledigt = erledigtCount === schritte.length;

  const schliessen = () => {
    setDismissed(true);
    try { localStorage.setItem(LS_DISMISSED_KEY, 'true'); } catch {}
  };

  return (
    <div className="mb-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 relative">
      <button
        onClick={schliessen}
        className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition-colors"
        aria-label="Checkliste schließen"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 mb-3 pr-6">
        {alleErledigt ? <Sparkles size={16} className="text-indigo-500" /> : null}
        <h3 className="text-sm font-semibold text-slate-800">
          {alleErledigt ? 'Startklar — alle ersten Schritte erledigt!' : 'Erste Schritte'}
        </h3>
        <span className="text-xs text-slate-400 font-medium">{erledigtCount}/{schritte.length}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
        {schritte.map(s => (
          <div key={s.id} className="flex items-center gap-1.5">
            {s.erledigt
              ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              : <Circle size={16} className="text-slate-300 flex-shrink-0" />}
            <span className={`text-xs sm:text-[13px] ${s.erledigt ? 'text-slate-400 line-through' : 'text-slate-600 font-medium'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
