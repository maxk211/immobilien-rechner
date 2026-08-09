import { Check, TrendingUp, Calculator, FileText, Users, LineChart, Building2, ShieldCheck } from 'lucide-react';
import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz';

const CLAIMS = [
  {
    icon: TrendingUp,
    title: 'Ein System statt Excel-Chaos',
    desc: 'Alle Immobilien an einem Ort — Rendite, Cashflow und Vermögen in Echtzeit, statt drei Tabellen zu pflegen, die nie synchron sind.',
  },
  {
    icon: FileText,
    title: 'Steuerangst nehmen',
    desc: 'AfA, Werbungskosten, Fahrtkosten — alle Posten für dein Finanzamt automatisch erfasst. Kein Beleg-Chaos mehr im März.',
  },
  {
    icon: Calculator,
    title: 'Cashflow-Klarheit statt Bauchgefühl',
    desc: 'Der monatliche Cashflow nach Zins, Tilgung und Nebenkosten — die Kennzahl, die wirklich entscheidet, ob eine Immobilie trägt.',
  },
  {
    icon: Users,
    title: 'Mieterverwaltung ohne Anwalt',
    desc: 'Kautionen tracken, Nebenkostenabrechnungen erstellen, Fristen für Mieterhöhungen im Blick — digital und rechtssicher.',
  },
  {
    icon: ShieldCheck,
    title: 'Für Deutschland gebaut',
    desc: 'AfA-Sätze nach § 7 EStG, Kappungsgrenze, Mietpreisbremse, Grunderwerbsteuer nach Bundesland — bereits eingebaut, nicht selbst nachschlagen.',
  },
  {
    icon: Building2,
    title: 'Wächst mit deinem Portfolio',
    desc: 'Von der ersten Wohnung bis zum Mehrfamilienhaus mit Wohnungsmanagement — kein Wechsel des Tools bei wachsendem Bestand.',
  },
];

const FAQ = [
  {
    q: 'Ist die Testphase wirklich kostenlos?',
    a: '90 Tage lang, mit einer Immobilie und allen Features — ohne Kreditkarte bei der Anmeldung. Du entscheidest danach, ob du upgraden möchtest.',
  },
  {
    q: 'Für wen ist renditly geeignet?',
    a: 'Für private Vermieter mit einer einzelnen Wohnung genauso wie für Investoren mit mehreren Objekten oder Mehrfamilienhäusern — die Tarife skalieren mit der Anzahl deiner Immobilien.',
  },
  {
    q: 'Was kostet renditly nach der Testphase?',
    a: 'Starter ab 4,99 €/Monat für 1 Immobilie, Standard ab 12,49 €/Monat für bis zu 10 Immobilien, Pro ab 24,99 €/Monat für unlimitierte Immobilien inklusive Priorität-Support. Alle Tarife enthalten alle Features.',
  },
  {
    q: 'Ersetzt renditly meinen Steuerberater?',
    a: 'Nein. renditly bereitet die relevanten Zahlen (AfA, Werbungskosten, Cashflow) sauber auf und exportiert sie als Excel oder PDF für deinen Steuerberater — die steuerliche Beratung selbst bleibt bei einem Steuerberater.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja, alle Tarife sind monatlich kündbar, keine Mindestlaufzeit.',
  },
  {
    q: 'Wo werden meine Daten gespeichert?',
    a: 'In der EU, DSGVO-konform. Details dazu in der Datenschutzerklärung.',
  },
];

function CTAButton({ children, className = '' }) {
  return (
    <a
      href="/app"
      className={`inline-flex items-center justify-center px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm sm:text-base ${className}`}
    >
      {children}
    </a>
  );
}

export default function VermieterSoftwareLanding() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1.5 text-slate-900">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span className="font-black text-base" style={{letterSpacing:'-0.02em'}}>renditly</span>
          </a>
          <CTAButton className="!px-4 !py-2 text-xs sm:text-sm">90 Tage kostenlos testen</CTAButton>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-5">
            Vermieter-Software für Deutschland
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Die Immobilienverwaltung, die dir zeigt, ob deine Immobilie wirklich Geld bringt
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Cashflow, Steuervorbereitung und Mieterverwaltung für deutsche Vermieter — in einem System statt drei Excel-Tabellen. 90 Tage kostenlos, keine Kreditkarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <CTAButton className="!bg-white !text-indigo-700 hover:!bg-indigo-50">90 Tage kostenlos testen →</CTAButton>
          </div>
          <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
        </div>
      </header>

      {/* Claims */}
      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <section className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-2">
            Warum sich Vermieter für renditly entscheiden
          </h2>
          <p className="text-slate-500 text-center mb-10 max-w-lg mx-auto">
            Sechs Gründe, die im Alltag tatsächlich einen Unterschied machen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {CLAIMS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-slate-50 rounded-2xl border border-gray-100 p-5 sm:p-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trust / Deutschland-Fokus */}
        <section className="mb-14 bg-slate-50 rounded-2xl border border-gray-100 p-6 sm:p-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <LineChart size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Gebaut für deutsches Miet- und Steuerrecht
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Andere Tools rechnen generisch. renditly kennt AfA-Sätze nach Baujahr (§ 7 Abs. 4 EStG), die Kappungsgrenze bei Mieterhöhungen, die Mietpreisbremse und die Grunderwerbsteuersätze aller 16 Bundesländer — direkt eingebaut, nicht als nachträgliche Anpassung. Wer tiefer einsteigen will, findet im{' '}
                <a href="/ratgeber" className="text-indigo-600 font-semibold hover:underline">kostenlosen Ratgeber</a>{' '}
                fundierte Guides zu Rendite, Steuern und Mietrecht.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="mb-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Ein Tarif für jede Portfolio-Größe</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">Alle Tarife mit allen Features — der Unterschied ist nur die Anzahl deiner Immobilien.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="border border-gray-100 rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-1">Starter</div>
              <div className="text-2xl font-black text-slate-900 mb-2">4,99 €<span className="text-sm font-medium text-slate-400">/Monat</span></div>
              <div className="text-sm text-slate-500">1 Immobilie · alle Features</div>
            </div>
            <div className="border-2 border-indigo-600 rounded-2xl p-5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">Beliebt</div>
              <div className="text-xs font-semibold text-slate-400 mb-1">Standard</div>
              <div className="text-2xl font-black text-slate-900 mb-2">12,49 €<span className="text-sm font-medium text-slate-400">/Monat</span></div>
              <div className="text-sm text-slate-500">Bis 10 Immobilien · alle Features</div>
            </div>
            <div className="border border-gray-100 rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-1">Pro</div>
              <div className="text-2xl font-black text-slate-900 mb-2">24,99 €<span className="text-sm font-medium text-slate-400">/Monat</span></div>
              <div className="text-sm text-slate-500">Unlimitiert · Priorität-Support</div>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-4">Monatlich kündbar · keine Mindestlaufzeit</p>
        </section>

        {/* FAQ */}
        <section className="mb-14 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-8">Häufige Fragen</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="border-b border-gray-100 pb-4">
                <h3 className="font-bold text-slate-900 mb-1.5">{f.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Finde in 5 Minuten heraus, ob deine Immobilie wirklich rentabel ist</h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-7 max-w-lg mx-auto">
            90 Tage kostenlos, 1 Immobilie, alle Features — ohne Kreditkarte.
          </p>
          <CTAButton className="!bg-white !text-indigo-700 hover:!bg-indigo-50">Jetzt kostenlos starten →</CTAButton>
          <p className="text-indigo-300 text-xs mt-4 flex items-center justify-center gap-1.5">
            <Check size={14} /> Keine Kreditkarte <span className="mx-1">·</span> <Check size={14} /> Jederzeit kündbar
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span className="font-black text-slate-700" style={{letterSpacing:'-0.02em'}}>renditly</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a href="/" className="hover:text-slate-700 transition-colors">Startseite</a>
            <a href="/ratgeber" className="hover:text-slate-700 transition-colors">Ratgeber</a>
            <ImpressumDatenschutzLinks className="text-slate-400" />
          </div>
          <span>© {new Date().getFullYear()} renditly</span>
        </div>
      </footer>
    </div>
  );
}
