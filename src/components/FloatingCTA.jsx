import { useState, useEffect } from 'react';

const SESSION_KEY = 'renditly-floating-cta-dismissed';

/**
 * Schlanke, sticky CTA-Leiste am unteren Bildschirmrand für Content-Seiten
 * (Ratgeber, Rechner, Städte). Erscheint erst nach etwas Scroll-Tiefe (damit
 * sie nicht sofort beim Laden stört), bleibt aber als zweiter, dauerhaft
 * sichtbarer Conversion-Punkt bestehen — statt sich nur auf die eine CTA
 * ganz unten am Seitenende zu verlassen. Dismiss gilt nur für die aktuelle
 * Session (sessionStorage), damit sie beim nächsten Besuch wieder da ist.
 */
export default function FloatingCTA({ text = 'Diese Zahlen dauerhaft tracken?' }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      if (window.scrollY > 500) setVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch {}
  };

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none">
      <div className="max-w-2xl mx-auto bg-slate-900/95 backdrop-blur border border-white/10 rounded-2xl shadow-xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3 pointer-events-auto">
        <span className="text-white text-xs sm:text-sm font-medium flex-1">{text}</span>
        <a
          href="/app"
          className="flex-shrink-0 px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
        >
          Kostenlos testen →
        </a>
        <button
          onClick={dismiss}
          aria-label="Schließen"
          className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
