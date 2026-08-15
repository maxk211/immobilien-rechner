import { useState, useMemo } from 'react';
import { GLOSSAR } from './glossarDaten';
import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz';

const sortiert = [...GLOSSAR].sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'));

export default function ImmobilienLexikon() {
  const [suche, setSuche] = useState('');

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return sortiert;
    return sortiert.filter(
      (e) => e.begriff.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q)
    );
  }, [suche]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1.5 text-slate-900 hover:text-indigo-600 transition-colors">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span className="font-black text-base" style={{letterSpacing:'-0.02em'}}>renditly</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/app" className="text-xs sm:text-sm font-medium text-slate-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">Login</a>
            <a href="/app" className="text-xs sm:text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all">Kostenlos testen</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-4">
            {GLOSSAR.length} Begriffe · Rendite, Steuern, Recht & Finanzierung
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Immobilien-Lexikon für Vermieter
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
            Die wichtigsten Begriffe rund um Mietrendite, Steuern, Mietrecht und Finanzierung — kurz erklärt, mit Verweis auf ausführliche Ratgeber und Rechner.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <input
            type="text"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Begriff suchen, z. B. Mietrendite, AfA, Kaution…"
            className="w-full border border-gray-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white shadow-sm"
          />
        </div>

        {gefiltert.length === 0 && (
          <p className="text-slate-500 text-sm">Kein Begriff gefunden für „{suche}“.</p>
        )}

        <div className="space-y-3">
          {gefiltert.map((eintrag) => (
            <div key={eintrag.begriff} id={eintrag.begriff.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 scroll-mt-20">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{eintrag.begriff}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{eintrag.definition}</p>
              {eintrag.verweisHref && (
                <a href={eintrag.verweisHref} className="text-sm text-indigo-600 font-semibold hover:underline">
                  {eintrag.verweisText} →
                </a>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center mt-12">
          <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur nachschlagen</h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
            renditly wendet all diese Begriffe automatisch auf dein echtes Portfolio an — Rendite, Steuern und Cashflow in einer App.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
            <a href="/ratgeber" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Alle Ratgeber-Artikel</a>
          </div>
          <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span className="font-black text-slate-700" style={{letterSpacing:'-0.02em'}}>renditly</span>
          <div className="flex gap-4 flex-wrap justify-center">
            <a href="/" className="hover:text-slate-700 transition-colors">Startseite</a>
            <a href="/ratgeber" className="hover:text-slate-700 transition-colors">Ratgeber</a>
            <a href="/#pricing" className="hover:text-slate-700 transition-colors">Preise</a>
          </div>
          <ImpressumDatenschutzLinks className="text-slate-400 hover:text-slate-700" />
          <span>© {new Date().getFullYear()} renditly</span>
        </div>
      </footer>
    </div>
  );
}
