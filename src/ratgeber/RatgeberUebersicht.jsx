const ARTIKEL = [
  {
    href: '/ratgeber/mietrendite-berechnen',
    titel: 'Mietrendite berechnen: Der komplette Guide',
    excerpt: 'Brutto-, Netto- und Cash-on-Cash-Rendite verstehen — mit Formeln, Beispielrechnung und Richtwerten für den deutschen Markt.',
    lesezeit: '7',
  },
  {
    href: '/ratgeber/cashflow-bei-immobilien',
    titel: 'Cashflow bei Immobilien: Was Vermieter wissen müssen',
    excerpt: 'Warum der monatliche Cashflow oft wichtiger ist als die Rendite auf dem Papier — inklusive Stellhebeln zur Verbesserung.',
    lesezeit: '6',
  },
  {
    href: '/ratgeber/afa-und-steuern-vermietung',
    titel: 'AfA und Steuern bei Vermietung: Der Leitfaden',
    excerpt: 'AfA-Sätze nach Baujahr, Sonder-AfA, Denkmal-AfA und absetzbare Werbungskosten für Vermieter.',
    lesezeit: '8',
  },
  {
    href: '/ratgeber/nebenkostenabrechnung-vermieter',
    titel: 'Nebenkostenabrechnung für Vermieter',
    excerpt: 'Umlagefähige Betriebskosten, richtiger Umlageschlüssel und die 12-Monats-Frist, die zwingend einzuhalten ist.',
    lesezeit: '7',
  },
  {
    href: '/ratgeber/mietspiegel-verstehen',
    titel: 'Mietspiegel verstehen und für Mieterhöhungen nutzen',
    excerpt: 'Ortsübliche Vergleichsmiete, Kappungsgrenze und Mietpreisbremse — der Überblick für rechtssichere Mieterhöhungen.',
    lesezeit: '6',
  },
  {
    href: '/ratgeber/grunderwerbsteuer-bundeslaender',
    titel: 'Grunderwerbsteuer nach Bundesland',
    excerpt: 'Alle 16 Bundesländer im Überblick (3,5–6,5 %) — wer zahlt, wann sie fällig wird und wie sie die Rendite beeinflusst.',
    lesezeit: '5',
  },
  {
    href: '/ratgeber/spekulationssteuer-immobilienverkauf',
    titel: 'Spekulationssteuer bei Immobilienverkauf',
    excerpt: 'Die 10-Jahres-Frist, die Eigennutzungs-Ausnahme und die korrekte Berechnung des Veräußerungsgewinns.',
    lesezeit: '6',
  },
];

export default function RatgeberUebersicht() {
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
            {ARTIKEL.length} Artikel · Rendite, Cashflow, Steuern & Mietrecht
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Ratgeber für Immobilien-Vermieter
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
            Fundierte Guides zu Rendite, Cashflow, Steuern und Mietrecht — für Einsteiger mit der ersten Wohnung bis zum Profi mit mehreren Objekten.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {ARTIKEL.map((a) => (
            <a key={a.href} href={a.href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-2">Ratgeber · {a.lesezeit} Min. Lesezeit</div>
              <div className="font-bold text-slate-900 mb-1.5">{a.titel}</div>
              <p className="text-sm text-slate-500 leading-relaxed">{a.excerpt}</p>
            </a>
          ))}
        </div>

        {/* Weitere Ressourcen */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-4">Kostenlose Rechner</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="/mietrendite-rechner" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-sm font-bold text-slate-900">Mietrendite-Rechner</div>
              <div className="text-xs text-slate-400 mt-0.5">Brutto-, Netto- und Cash-on-Cash-Rendite in Sekunden</div>
            </a>
            <a href="/afa-rechner" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-sm font-bold text-slate-900">AfA-Rechner</div>
              <div className="text-xs text-slate-400 mt-0.5">Jährliche Abschreibung und Steuerersparnis berechnen</div>
            </a>
            <a href="/mietrendite-staedte" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all sm:col-span-2">
              <div className="text-sm font-bold text-slate-900">Mietrendite nach Stadt</div>
              <div className="text-xs text-slate-400 mt-0.5">Kaufpreise, Mieten und Renditen der 10 größten deutschen Städte im Vergleich</div>
            </a>
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
