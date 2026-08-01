import { STAEDTE_LISTE } from './staedteDaten';

const fmt = (n, decimals = 1) => isFinite(n) ? n.toFixed(decimals).replace('.', ',') : '–';
const fmtEur = (n) => isFinite(n) ? Math.round(n).toLocaleString('de-DE') + ' €' : '–';

export default function StaedteVergleich() {
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
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Marktdaten Juni 2026 · Engel &amp; Völkers
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Mietrendite Deutschland: Die 10 größten Städte im Vergleich
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
            Essen und Dortmund bieten mit rund 4,5–4,6 % aktuell die höchste Bruttomietrendite unter den zehn größten deutschen Städten, München mit rund 3,1 % die niedrigste — der vollständige Vergleich von Kaufpreisen, Mieten und Rendite auf Basis aktueller Marktdaten.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Vergleichstabelle */}
        <div className="overflow-x-auto mb-10 bg-white rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-3 pl-5 pr-3 font-semibold">Stadt</th>
                <th className="py-3 px-3 font-semibold text-right">Ø Kaufpreis/m²</th>
                <th className="py-3 px-3 font-semibold text-right">Ø Kaltmiete/m²</th>
                <th className="py-3 pr-5 pl-3 font-semibold text-right">Bruttomietrendite</th>
              </tr>
            </thead>
            <tbody>
              {STAEDTE_LISTE.map((s, i) => (
                <tr key={s.slug} className={i !== STAEDTE_LISTE.length - 1 ? 'border-b border-gray-50' : ''}>
                  <td className="py-3 pl-5 pr-3">
                    <a href={`/mietrendite-${s.slug}`} className="font-semibold text-indigo-600 hover:underline">{s.name}</a>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">{fmtEur(s.kaufpreisM2)}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{fmt(s.mieteM2, 2)} €</td>
                  <td className="py-3 pr-5 pl-3 text-right font-bold text-slate-900">{fmt(s.bruttorendite)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Einordnung */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-3">Wo ist die Mietrendite in Deutschland am höchsten?</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Die Bruttomietrendite unterscheidet sich zwischen deutschen Großstädten teils erheblich — von rund 3,1 % in München bis über 4,5 % in Essen und Dortmund. Grundsätzlich gilt: Je teurer die Stadt im Einkauf, desto niedriger fällt die Rendite im Verhältnis aus, da die Mieten nicht proportional mit den Kaufpreisen steigen.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Ruhrgebietsstädte wie Essen und Dortmund sowie ostdeutsche Standorte wie Leipzig bieten aktuell die höchsten Renditen unter den Tier-1-Städten, während die teuersten Metropolen München, Hamburg und Frankfurt eher für wertsteigerungsorientierte Strategien mit langfristigem Anlagehorizont geeignet sind. Für eine fundierte Entscheidung lohnt sich immer der Blick auf die konkrete Lage innerhalb der Stadt — die Unterschiede zwischen einzelnen Stadtteilen sind oft größer als die zwischen den Städten selbst.
          </p>
        </section>

        {/* Städte-Grid */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-4">Alle Städte im Detail</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STAEDTE_LISTE.map((s) => (
              <a key={s.slug} href={`/mietrendite-${s.slug}`} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="text-sm font-bold text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Ø {fmt(s.bruttorendite)} % Bruttorendite</div>
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
            renditly trackt Cashflow, Mieter, Steuern und Wertsteigerung für alle deine Immobilien — dauerhaft, automatisch und sicher.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/app" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
            <a href="/#pricing" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Preise ansehen</a>
          </div>
          <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Datenquelle: Engel &amp; Völkers Marktbericht Deutschland, Stand Juni 2026 (Angebotspreise). Werte sind Durchschnittswerte und können je nach Lage und Objekt stark abweichen.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span className="font-black text-slate-700" style={{letterSpacing:'-0.02em'}}>renditly</span>
          <div className="flex gap-4">
            <a href="/" className="hover:text-slate-700 transition-colors">Startseite</a>
            <a href="/#pricing" className="hover:text-slate-700 transition-colors">Preise</a>
          </div>
          <span>© {new Date().getFullYear()} renditly</span>
        </div>
      </footer>
    </div>
  );
}
