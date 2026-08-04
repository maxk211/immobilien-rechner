import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

// ─── TrialCountdownBanner ───────────────────────────────────────────────────
// Zeigt in den letzten 30 Trial-Tagen einen dezenten, aber wiederkehrenden
// Hinweis auf das Trial-Ende. Vorher war trialDaysLeft nirgends im Dashboard
// sichtbar — Nutzer bekamen erst beim Ablauf oder am Objekt-Limit überhaupt
// mit, dass ihr Trial endet. Der Banner ist pro Tag wegklickbar (nervt nicht),
// kommt am nächsten Tag aber wieder, solange der Trial noch aktiv ist.
const DISMISS_KEY = 'trialBannerDismissedOn';
const SHOW_FROM_DAYS_LEFT = 30;

export default function TrialCountdownBanner({ trialDaysLeft, onUpgradeClick }) {
  const [dismissedToday, setDismissedToday] = useState(false);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      setDismissedToday(localStorage.getItem(DISMISS_KEY) === today);
    } catch (e) { /* localStorage evtl. blockiert */ }
  }, []);

  if (trialDaysLeft == null || trialDaysLeft <= 0 || trialDaysLeft > SHOW_FROM_DAYS_LEFT) return null;
  if (dismissedToday) return null;

  const urgent = trialDaysLeft <= 7;
  const critical = trialDaysLeft <= 2;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString().slice(0, 10));
    } catch (e) { /* ignorieren */ }
    setDismissedToday(true);
  };

  const colorClasses = critical
    ? 'bg-red-50 border-red-200 text-red-800'
    : urgent
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-indigo-50 border-indigo-200 text-indigo-800';

  const buttonClasses = critical
    ? 'bg-red-600 hover:bg-red-700'
    : urgent
      ? 'bg-amber-600 hover:bg-amber-700'
      : 'bg-indigo-600 hover:bg-indigo-700';

  const text = trialDaysLeft === 1
    ? 'Dein kostenloser Test läuft morgen ab.'
    : `Noch ${trialDaysLeft} Tage in deinem kostenlosen Test.`;

  return (
    <div className={`border-b ${colorClasses}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Clock size={16} className="shrink-0" />
          <span className="font-medium truncate">{text}</span>
          <span className="hidden sm:inline opacity-80">Danach sind deine Daten weiterhin sicher, aber Funktionen sind eingeschränkt.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUpgradeClick}
            className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-colors ${buttonClasses}`}
          >
            Jetzt upgraden
          </button>
          <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-black/5 transition-colors" title="Für heute ausblenden">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
