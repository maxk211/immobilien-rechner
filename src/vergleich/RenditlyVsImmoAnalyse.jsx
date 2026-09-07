import { Check, X, Minus } from 'lucide-react';
import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz';

const FEATURES = [
  { gruppe: 'Grundkonzept' },
  { label: 'Laufende Portfolio-Verwaltung nach dem Kauf', renditly: true, immo: false },
  { label: 'Einmalige Investitionsanalyse vor dem Kauf', renditly: true, immo: true },
  { label: 'Cashflow- & Renditeentwicklung über die Zeit (Historie)', renditly: true, immo: false },
  { gruppe: 'Mieterverwaltung' },
  { label: 'Mieterverwaltung (Stammdaten, Mietverhältnisse)', renditly: true, immo: false },
  { label: 'Kautionsmanagement', renditly: true, immo: false },
  { label: 'Nebenkostenabrechnung erstellen', renditly: true, immo: false },
  { label: 'Mieterhöhungs-Fristen & Kappungsgrenze', renditly: true, immo: false },
  { gruppe: 'Portfolio & Objekte' },
  { label: 'Mehrfamilienhaus mit Wohnungsverwaltung', renditly: true, immo: false },
  { label: 'Dokumenten-Ablage je Immobilie', renditly: true, immo: false },
  { label: 'Portfolio-Dashboard über alle Objekte', renditly: true, immo: true },
  { gruppe: 'Steuer & Berechnung' },
  { label: 'AfA-Berechnung nach § 7 EStG', renditly: true, immo: true },
  { label: 'Grunderwerbsteuer nach Bundesland', renditly: true, immo: true },
  { label: 'Spekulationsfrist-Berechnung (§ 23 EStG)', renditly: true, immo: false },
  { label: 'IRR-Berechnung', renditly: false, immo: true },
  { label: 'Sensitivitäts-/Szenario-Vergleich', renditly: false, immo: true },
  { gruppe: 'Zugang & Preis' },
  { label: 'Kostenloser Zugang', renditly: 'partial', immo: true, renditlyNote: '90 Tage voller Funktionsumfang, 1 Immobilie', immoNote: 'Dauerhaft, auf 3 Analysen begrenzt' },
  { label: 'Einstiegspreis', renditly: 'text', immo: 'text', renditlyNote: 'ab 4,99 €/Monat', immoNote: 'ab 7 €/Monat' },
];

const FeatureIcon = ({ v }) => {
  if (v === true) return <Check size={18} className="text-emerald-600" />;
  if (v === false) return <X size={18} className="text-slate-300" />;
  if (v === 'partial') return <Minus size={18} className="text-amber-500" />;
  return null;
};

const FAQ = [
  {
    q: 'Ist ImmoAnalyse eine gute Alternative zu renditly?',
    a: 'Kommt auf dein Ziel an. ImmoAnalyse ist ein starkes Werkzeug, um vor dem Kauf eine einzelne Immobilie zu analysieren — mit IRR-Berechnung und Sensitivitätsanalyse. Für die laufende Verwaltung nach dem Kauf (Mieter, Kaution, Nebenkostenabrechnung, Cashflow über mehrere Jahre) ist es laut eigener Feature-Übersicht nicht ausgelegt — dafür ist renditly gebaut.',
    id: 'alternative',
  },
  {
    q: 'Kann ich renditly und ImmoAnalyse parallel nutzen?',
    a: 'Ja, das schließt sich nicht aus. Manche Investoren nutzen ein Analyse-Tool wie ImmoAnalyse für die Kaufentscheidung und wechseln danach zu renditly, um das gekaufte Objekt laufend zu verwalten — Mieteinnahmen, Kosten, Steuerunterlagen und Mieterverwaltung an einem Ort.',
    id: 'parallel',
  },
  {
    q: 'Was kostet renditly im Vergleich zu ImmoAnalyse?',
    a: 'renditly startet bei 4,99 €/Monat für eine Immobilie mit allen Features, ImmoAnalyse bei 7 €/Monat für die Basic-Stufe mit begrenzter Analysenzahl. Beide bieten eine kostenlose Einstiegsstufe: renditly 90 Tage mit vollem Funktionsumfang, ImmoAnalyse dauerhaft mit 3 Analysen.',
    id: 'preis',
  },
  {
    q: 'Bietet renditly auch IRR-Berechnung und Sensitivitätsanalyse?',
    a: 'Aktuell nicht — das ist eine Stärke von ImmoAnalyse. renditly fokussiert sich auf laufenden Cashflow, Steuerdaten und Mieterverwaltung nach dem Kauf statt auf tiefe Vorab-Szenarienanalyse.',
    id: 'irr',
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

export default function RenditlyVsImmoAnalyse() {
  return (
    <div className="min-h-screen bg-white font-sans">
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

      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-5">
            Vergleich · Unabhängig recherchiert
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            renditly vs. ImmoAnalyse im Vergleich
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Zwei unterschiedliche Werkzeuge für zwei unterschiedliche Phasen: Kaufentscheidung vs. laufende Verwaltung. Hier siehst du, was jedes Tool wirklich kann.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <CTAButton className="!bg-white !text-indigo-700 hover:!bg-indigo-50">90 Tage kostenlos testen →</CTAButton>
          </div>
          <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <section className="mb-14 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Kurz gesagt</h2>
          <p className="text-slate-700 leading-relaxed">
            <strong>ImmoAnalyse</strong> ist ein Analyse-Tool für die Kaufentscheidung — mit IRR-Berechnung, Sensitivitätsanalyse und Szenario-Vergleich vor dem Immobilienkauf. <strong>renditly</strong> ist eine laufende Portfolio-Verwaltung für die Zeit nach dem Kauf — mit Mieterverwaltung, Kautionsmanagement, Nebenkostenabrechnung und Cashflow-Entwicklung über mehrere Jahre. Beide Tools lösen unterschiedliche Probleme; die Feature-Tabelle unten zeigt die Details.
          </p>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-2">Feature-Vergleich im Detail</h2>
          <p className="text-slate-500 text-center mb-8 max-w-lg mx-auto">
            Stand: Herbst 2026, Recherche auf Basis der öffentlichen Feature-Übersichten beider Anbieter.
          </p>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="text-left py-3 pr-2 font-bold text-slate-900">Feature</th>
                  <th className="py-3 px-2 font-bold text-indigo-600 text-center w-28">renditly</th>
                  <th className="py-3 px-2 font-bold text-slate-500 text-center w-28">ImmoAnalyse</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) =>
                  f.gruppe ? (
                    <tr key={`g-${i}`}>
                      <td colSpan={3} className="pt-6 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{f.gruppe}</td>
                    </tr>
                  ) : (
                    <tr key={f.label} className="border-b border-gray-100">
                      <td className="py-2.5 pr-2 text-slate-700">{f.label}</td>
                      <td className="py-2.5 px-2 text-center">
                        {f.renditly === 'text' ? <span className="text-xs font-semibold text-slate-700">{f.renditlyNote}</span> : (
                          <div className="flex flex-col items-center gap-0.5">
                            <FeatureIcon v={f.renditly} />
                            {f.renditlyNote && <span className="text-[10px] text-slate-400 leading-tight">{f.renditlyNote}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {f.immo === 'text' ? <span className="text-xs font-semibold text-slate-700">{f.immoNote}</span> : (
                          <div className="flex flex-col items-center gap-0.5">
                            <FeatureIcon v={f.immo} />
                            {f.immoNote && <span className="text-[10px] text-slate-400 leading-tight">{f.immoNote}</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-slate-50 rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-slate-900 mb-3">Wann ImmoAnalyse die bessere Wahl ist</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Du stehst vor einer Kaufentscheidung und willst mehrere Objekte oder Szenarien vorab durchrechnen — inklusive IRR und Sensitivitätsanalyse, bevor Geld fließt. Für diese eine Phase ist ImmoAnalyse spezialisiert.
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <h2 className="font-bold text-slate-900 mb-3">Wann renditly die bessere Wahl ist</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Du besitzt bereits eine oder mehrere Immobilien und willst sie laufend verwalten: Mieter, Kaution, Nebenkostenabrechnungen, Mieterhöhungsfristen, Dokumente und die tatsächliche Rendite über die Jahre — nicht nur eine Momentaufnahme vor dem Kauf.
            </p>
          </div>
        </section>

        <section className="mb-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Preise im Vergleich</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">Beide starten kostenlos, aber mit unterschiedlichem Modell.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
            <div className="border-2 border-indigo-600 rounded-2xl p-5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">renditly</div>
              <div className="text-2xl font-black text-slate-900 mb-1 mt-1">ab 4,99 €<span className="text-sm font-medium text-slate-400">/Monat</span></div>
              <div className="text-sm text-slate-500">90 Tage kostenlos testen, 1 Immobilie, alle Features</div>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-1">ImmoAnalyse</div>
              <div className="text-2xl font-black text-slate-900 mb-1">ab 7 €<span className="text-sm font-medium text-slate-400">/Monat</span></div>
              <div className="text-sm text-slate-500">Dauerhaft kostenlos mit 3 Analysen</div>
            </div>
          </div>
        </section>

        <section className="mb-14 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-8">Häufige Fragen</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.id} className="border-b border-gray-100 pb-4">
                <h3 className="font-bold text-slate-900 mb-1.5">{f.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Verwalte deine Immobilie, nicht nur eine Analyse davon</h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-7 max-w-lg mx-auto">
            90 Tage kostenlos, 1 Immobilie, alle Features — ohne Kreditkarte.
          </p>
          <CTAButton className="!bg-white !text-indigo-700 hover:!bg-indigo-50">Jetzt kostenlos starten →</CTAButton>
          <p className="text-indigo-300 text-xs mt-4 flex items-center justify-center gap-1.5">
            <Check size={14} /> Keine Kreditkarte <span className="mx-1">·</span> <Check size={14} /> Jederzeit kündbar
          </p>
        </div>

        <p className="text-xs text-slate-400 mt-8 text-center max-w-xl mx-auto">
          Angaben zu ImmoAnalyse basieren auf der öffentlich zugänglichen Preis- und Feature-Übersicht auf immoanalyse.info zum Zeitpunkt der Recherche und können sich seitdem geändert haben. Kein Auftrags- oder Kooperationsverhältnis zu ImmoAnalyse.
        </p>
      </main>

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
