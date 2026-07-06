import { useState } from 'react';

const LandingPage = ({ onGetStarted, onLogin }) => {
  const [billingOpen, setBillingOpen] = useState(null);

  const features = [
    {
      icon: '📊',
      title: 'Portfolio-Übersicht',
      desc: 'Alle Immobilien auf einen Blick — Rendite, Cashflow und Vermögen in Echtzeit.',
      color: 'blue',
    },
    {
      icon: '💰',
      title: 'Cashflow-Analyse',
      desc: 'Monatliche und jährliche Liquidität berechnen — inkl. Zinsen, Tilgung und Nebenkosten.',
      color: 'emerald',
    },
    {
      icon: '🧾',
      title: 'Steuervorbereitung',
      desc: 'AfA, Werbungskosten, Fahrtkosten — alle Posten für dein Finanzamt automatisch erfasst.',
      color: 'amber',
    },
    {
      icon: '👥',
      title: 'Mieterverwaltung',
      desc: 'Mieter anlegen, Kautionen tracken, NK-Abrechnungen erstellen — digital und ordentlich.',
      color: 'violet',
    },
    {
      icon: '📈',
      title: 'Wertsteigerung tracken',
      desc: 'Immobilienwert, Restschuld und aufgebautes Eigenkapital über die Jahre verfolgen.',
      color: 'blue',
    },
    {
      icon: '🏢',
      title: 'Mehrfamilienhäuser',
      desc: 'Wohnungsmanagement für MFH-Eigentümer — jede Einheit einzeln im Blick.',
      color: 'emerald',
    },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };

  const faqs = [
    {
      q: 'Kann ich die App kostenlos testen?',
      a: 'Ja — der Free-Tier ist dauerhaft kostenlos. Du kannst eine Immobilie mit allen Features anlegen und verwalten, ohne Kreditkarte.',
    },
    {
      q: 'Was passiert wenn ich kündige?',
      a: 'Du kannst jederzeit kündigen. Deine Daten bleiben erhalten und du kannst weiterhin eine Immobilie im Free-Tier verwalten.',
    },
    {
      q: 'Sind meine Daten sicher?',
      a: 'Alle Daten werden verschlüsselt in der EU gespeichert (Supabase / PostgreSQL). Deine Daten gehören dir.',
    },
    {
      q: 'Gibt es eine mobile App?',
      a: 'Die Web-App ist vollständig mobiloptimiert und funktioniert auf iPhone und Android wie eine native App.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">🏠</span>
            <span className="font-bold text-gray-900 text-base sm:text-lg truncate">
              Immobilien<span className="text-blue-600">Portfolio</span>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onLogin}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2.5 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              Einloggen
            </button>
            <button
              onClick={onGetStarted}
              className="text-xs sm:text-sm font-semibold bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">Kostenlos starten</span>
              <span className="sm:hidden">Starten</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-blue-200 mb-5 sm:mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></span>
              Kostenlos starten — keine Kreditkarte nötig
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4 sm:mb-6">
              Dein Immobilien&shy;portfolio.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Endlich im Griff.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 max-w-xl leading-relaxed">
              Rendite, Cashflow, Steuer und Mieter — alles an einem Ort.
              Für Einsteiger mit einer Wohnung bis zum Profi mit mehreren Objekten.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold text-base sm:text-lg rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 text-center"
              >
                Jetzt kostenlos starten →
              </button>
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-base sm:text-lg rounded-2xl border border-white/20 transition-all text-center"
              >
                Einloggen
              </button>
            </div>

            {/* Social proof — stacked on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 mt-4 text-sm text-slate-400">
              <span>✓ 1 Immobilie dauerhaft kostenlos</span>
              <span className="hidden sm:inline">&nbsp;·&nbsp;</span>
              <span>✓ Alle Features inklusive</span>
              <span className="hidden sm:inline">&nbsp;·&nbsp;</span>
              <span>✓ Jederzeit kündbar</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: '6+', label: 'Immobilientypen' },
              { value: '100%', label: 'Cloudbasiert' },
              { value: '0€', label: 'Einstieg' },
              { value: '9,99€', label: 'Pro / Monat' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-3xl font-black text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mb-3 sm:mb-4">
            Kennst du das?
          </h2>
          <p className="text-slate-500 text-base sm:text-lg mb-8 sm:mb-10">Die häufigsten Probleme von Immobilienbesitzern</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '📊', text: 'Excel-Tabellen die niemand mehr versteht — Rendite, Cashflow und Steuer alles durcheinander.' },
              { icon: '😩', text: 'Kein Überblick über Mieter, Kautionen und offene Zahlungen. Alles verteilt auf Mails und Zettel.' },
              { icon: '💸', text: 'Beim Steuerberater fehlen immer Belege — AfA, Fahrtkosten, Werbungskosten unklar.' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-red-100 rounded-2xl p-5 sm:p-6 text-left shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-slate-600 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 sm:mt-10 text-lg sm:text-xl font-bold text-slate-800">
            Es gibt einen besseren Weg. 👇
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mb-3">
              Alles was du brauchst — nichts was du nicht brauchst
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">
              Gebaut von Immobilieninvestoren für Immobilieninvestoren. Kein unnötiger Ballast.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 hover:shadow-md transition-all hover:-translate-y-0.5 flex gap-4 sm:block">
                <div className={`inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl border text-xl sm:text-2xl flex-shrink-0 sm:mb-4 ${colorMap[f.color]}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 sm:mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3">In 3 Minuten startklar</h2>
            <p className="text-blue-200 text-base sm:text-lg">Keine Einrichtung, kein Onboarding-Call, keine Kreditkarte</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { step: '1', icon: '✉️', title: 'Kostenlos registrieren', desc: 'Account mit E-Mail anlegen. Dauert 30 Sekunden.' },
              { step: '2', icon: '🏠', title: 'Erste Immobilie anlegen', desc: 'Kaufpreis, Miete, Finanzierung eingeben — Rendite wird sofort berechnet.' },
              { step: '3', icon: '📊', title: 'Portfolio im Blick behalten', desc: 'Cashflow, Steuer, Mieter — alles jederzeit griffbereit.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-white/10 border border-white/20 rounded-2xl p-5 sm:p-6 flex sm:block items-start gap-4 sm:gap-0 sm:text-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-base sm:text-lg flex-shrink-0 sm:mx-auto sm:mb-4">
                  {item.step}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-3">{item.icon}</div>
                  <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-blue-200 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-blue-700 font-bold text-base sm:text-lg rounded-2xl hover:bg-blue-50 transition-all shadow-lg"
            >
              Jetzt kostenlos starten →
            </button>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-12 sm:py-16 lg:py-24" id="pricing">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mb-3">
              Einfache, transparente Preise
            </h2>
            <p className="text-slate-500 text-base sm:text-lg">Kein verstecktes Kleingedrucktes. Kein Abo-Durcheinander.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 sm:p-8">
              <div className="mb-5 sm:mb-6">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Free</div>
                <div className="text-4xl sm:text-5xl font-black text-slate-900">0€</div>
                <div className="text-gray-400 text-sm mt-1">dauerhaft kostenlos</div>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  '1 Immobilie',
                  'Alle Berechnungs-Features',
                  'Cashflow & Rendite',
                  'Steuervorbereitung',
                  'Mieterverwaltung',
                  'Cloud-Speicherung',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-emerald-500 font-bold flex-shrink-0">✓</span> {item}
                  </li>
                ))}
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="text-gray-300 flex-shrink-0">✗</span> Mehr als 1 Immobilie
                </li>
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Kostenlos starten
              </button>
            </div>

            {/* Pro */}
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/30 mt-4 sm:mt-0">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow whitespace-nowrap">
                EMPFOHLEN
              </div>
              <div className="mb-5 sm:mb-6">
                <div className="text-sm font-bold text-blue-200 uppercase tracking-wide mb-1">Pro</div>
                <div className="flex items-end gap-1">
                  <div className="text-4xl sm:text-5xl font-black">9,99€</div>
                  <div className="text-blue-300 text-sm mb-1.5">/ Monat</div>
                </div>
                <div className="text-blue-300 text-sm mt-1">jederzeit kündbar</div>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  'Unlimitierte Immobilien',
                  'Alle Berechnungs-Features',
                  'Cashflow & Rendite',
                  'Steuervorbereitung',
                  'Mieterverwaltung',
                  'Cloud-Speicherung',
                  'Mehrfamilienhaus-Management',
                  'Stellplatz-Verwaltung',
                  'Prioritäts-Support',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all shadow"
              >
                Pro freischalten →
              </button>
            </div>
          </div>

          <p className="text-center text-slate-400 text-xs sm:text-sm mt-5 sm:mt-6 px-2">
            Alle Preise inkl. MwSt. · Monatlich kündbar · Sichere Zahlung via Stripe
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-8 sm:mb-10">Häufige Fragen</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  className="w-full text-left px-4 sm:px-6 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-all"
                  onClick={() => setBillingOpen(billingOpen === i ? null : i)}
                >
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">{faq.q}</span>
                  <span className={`text-gray-400 text-xl flex-shrink-0 transition-transform ${billingOpen === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {billingOpen === i && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-slate-600 text-sm leading-relaxed border-t border-gray-100 pt-3 sm:pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-slate-900 to-blue-950 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-4xl sm:text-5xl mb-4">🏠</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4">
            Bereit, dein Portfolio zu optimieren?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-6 sm:mb-8">
            Starte kostenlos. Upgrade wenn du bereit bist. Kündige wann du willst.
          </p>
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg sm:text-xl rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
          >
            Jetzt kostenlos starten →
          </button>
          <p className="text-slate-500 text-xs sm:text-sm mt-4">
            Keine Kreditkarte · Keine Mindestlaufzeit · Sofort loslegen
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-slate-500 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span className="font-semibold text-slate-400">ImmobilienPortfolio</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={onLogin} className="hover:text-slate-300 transition-colors">Einloggen</button>
            <button onClick={onGetStarted} className="hover:text-slate-300 transition-colors">Registrieren</button>
          </div>
          <div className="text-xs sm:text-sm">© {new Date().getFullYear()} ImmobilienPortfolio</div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
