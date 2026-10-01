import { Check, ArrowRight, TrendingUp, Calculator, FileText, Users, Building2, ShieldCheck, Scale } from 'lucide-react';
import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz';
import { DashboardMockup, RechnetSichDasMockup, PlausiMockup, WasStehtAn, Fenster, AppKopf } from './AppMockups';
import Preise from './Preise';

// Ads-Landingpage /vermieter-software im Look der App (UX-Update).
// Eine Aufgabe: Besucher in die kostenlose Testphase bringen. Deshalb nur ein Ziel-Link (/app).

const zurApp = () => { window.location.href = '/app'; };

const GRUENDE = [
  { icon: TrendingUp, titel: 'Ein System statt Excel-Chaos', text: 'Alle Immobilien an einem Ort — Rendite, Cashflow und Vermögen immer aktuell, statt drei Tabellen, die nie zusammenpassen.' },
  { icon: Calculator, titel: 'Cashflow statt Bauchgefühl', text: 'Der monatliche Cashflow vor und nach Tilgung — die Zahl, die entscheidet, ob eine Immobilie trägt.' },
  { icon: FileText, titel: 'Steuer ohne Beleg-Chaos', text: 'AfA, Schuldzinsen und Werbungskosten je Steuerjahr, als PDF oder Excel für deinen Steuerberater.' },
  { icon: Users, titel: 'Mieter ohne Zettelwirtschaft', text: 'Mieteingänge abhaken, Kautionen, Mieterhöhung mit Kappungsgrenze, Nebenkostenabrechnung in vier Schritten.' },
  { icon: Scale, titel: 'Für Deutschland gebaut', text: 'AfA nach § 7 EStG, Kappungsgrenze, Grunderwerbsteuer aller 16 Bundesländer — eingebaut, nicht nachgeschlagen.' },
  { icon: Building2, titel: 'Wächst mit deinem Portfolio', text: 'Von der ersten Wohnung bis zum Mehrfamilienhaus oder der untervermieteten Wohnung — ohne Werkzeugwechsel.' },
];

const FAQ = [
  { q: 'Ist die Testphase wirklich kostenlos?', a: '90 Tage lang, mit einer Immobilie und allen Funktionen — ohne Kreditkarte bei der Anmeldung. Du entscheidest danach, ob du weitermachst.' },
  { q: 'Für wen ist renditly geeignet?', a: 'Für private Vermieter mit einer einzelnen Wohnung genauso wie für Investoren mit mehreren Objekten, Mehrfamilienhäusern oder untervermieteten Wohnungen. Die Tarife richten sich nur nach der Zahl deiner Immobilien.' },
  { q: 'Was kostet renditly nach der Testphase?', a: 'Starter 4,99 € im Monat für 1 Immobilie, Standard 12,49 € für bis zu 10 Immobilien, Pro 24,99 € für unbegrenzt viele inklusive Prioritäts-Support. Jährlich rund 20 % günstiger. Alle Tarife enthalten alle Funktionen.' },
  { q: 'Ersetzt renditly meinen Steuerberater?', a: 'Nein. renditly bereitet die Zahlen (AfA, Werbungskosten, Schuldzinsen) sauber auf und exportiert sie als PDF oder Excel für deinen Steuerberater — die steuerliche Beratung bleibt bei ihm.' },
  { q: 'Kann ich jederzeit kündigen?', a: 'Ja, alle Tarife sind monatlich kündbar, ohne Mindestlaufzeit.' },
  { q: 'Wo werden meine Daten gespeichert?', a: 'Verschlüsselt auf Servern in der EU, DSGVO-konform. Kein anderer Nutzer und auch wir als Betreiber sehen deine Immobilien nicht.' },
];

function CTA({ children = '90 Tage kostenlos testen', hell = false, className = '' }) {
  return (
    <a href="/app" className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold rounded-xl transition-colors ${hell ? 'bg-white text-gray-900 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-500'} ${className}`}>
      {children} <ArrowRight size={18} />
    </a>
  );
}

function Logo({ hell = false }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-base font-black flex items-center justify-center">r</span>
      <span className={`font-extrabold text-lg tracking-tight ${hell ? 'text-white' : 'text-gray-900'}`}>renditly</span>
    </span>
  );
}

export default function VermieterSoftwareLanding() {
  return (
    <div className="font-app min-h-screen bg-white text-gray-900 antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" aria-label="renditly Startseite"><Logo /></a>
          <a href="/app" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl whitespace-nowrap">
            <span className="hidden sm:inline">90 Tage kostenlos testen</span><span className="sm:hidden">Kostenlos testen</span>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 right-0 w-[36rem] h-[36rem] bg-indigo-600/25 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs font-semibold text-indigo-200 mb-6">
              Vermieter-Software für Deutschland
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.12] tracking-tight">
              Die Immobilienverwaltung, die dir zeigt, ob deine Immobilie <span className="text-indigo-300">wirklich Geld bringt</span>
            </h1>
            <p className="text-white/70 text-lg mt-5 max-w-xl leading-relaxed">
              Cashflow, Steuervorbereitung und Mieterverwaltung in einem System — und jeden Monat eine Liste mit dem, was ansteht.
            </p>
            <div className="mt-8"><CTA className="w-full sm:w-auto" /></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-sm text-white/60">
              {['Keine Kreditkarte', 'Keine Mindestlaufzeit', '1 Immobilie kostenlos'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><Check size={15} className="text-emerald-400" />{t}</span>
              ))}
            </div>
          </div>
          <div>
            <DashboardMockup />
            <p className="text-center text-xs text-white/40 mt-3">Dein Dashboard — mit Beispielzahlen</p>
          </div>
        </div>
      </header>

      <main>
        {/* Drei Momente */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Drei Momente, in denen renditly sich bezahlt macht</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { titel: 'Am Monatsanfang', text: 'Welche Miete fehlt, welche Mieterhöhung ist fällig, wann endet die Zinsbindung — eine Liste, ein Klick je Punkt.',
                  bild: <Fenster><AppKopf knopf={null} /><div className="p-2.5"><WasStehtAn kompakt /></div></Fenster> },
                { titel: 'Vor dem Kauf', text: '„Rechnet sich das?“ sagt in einem Satz, ob sich die Wohnung trägt, und ab welcher Miete oder welchem Preis.',
                  bild: <RechnetSichDasMockup kompakt /> },
                { titel: 'Beim Eintippen', text: 'Die Plausibilitätsprüfung findet Komma-Fehler und Widersprüche, bevor sie deine Rendite verfälschen.',
                  bild: <PlausiMockup /> },
              ].map(m => (
                <div key={m.titel} className="flex flex-col">
                  <h3 className="font-extrabold text-lg">{m.titel}</h3>
                  <p className="text-sm text-gray-600 mt-1.5 mb-5 leading-relaxed">{m.text}</p>
                  {m.bild}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gründe */}
        <section className="py-16 sm:py-24 bg-canvas">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Warum sich Vermieter für renditly entscheiden</h2>
              <p className="text-gray-500 mt-3">Sechs Gründe, die im Alltag einen Unterschied machen.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GRUENDE.map(g => {
                const Icon = g.icon;
                return (
                  <div key={g.titel} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><Icon size={19} /></div>
                    <h3 className="font-extrabold">{g.titel}</h3>
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{g.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex items-start gap-4">
              <ShieldCheck size={22} className="text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 leading-relaxed">
                Andere Tools rechnen generisch. renditly kennt AfA-Sätze nach Baujahr (§ 7 Abs. 4 EStG), die Kappungsgrenze bei Mieterhöhungen
                und die Grunderwerbsteuersätze aller 16 Bundesländer. Wer tiefer einsteigen will, findet im{' '}
                <a href="/ratgeber" className="text-indigo-600 font-semibold hover:underline">kostenlosen Ratgeber</a> Guides zu Rendite, Steuern und Mietrecht.
              </p>
            </div>
          </div>
        </section>

        {/* Preise */}
        <Preise onGetStarted={zurApp} id="preise" />

        {/* FAQ */}
        <section className="py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-10">Häufige Fragen</h2>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {FAQ.map(f => (
                <div key={f.q} className="py-5">
                  <h3 className="font-bold">{f.q}</h3>
                  <p className="text-gray-600 mt-1.5 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Schluss-CTA */}
        <section className="pb-16 sm:pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-ink text-white px-6 py-12 sm:px-12 sm:py-16 text-center">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-72 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
              <div className="relative">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Finde in 5 Minuten heraus, ob deine Immobilie wirklich rentabel ist</h2>
                <p className="text-white/60 mt-3 max-w-lg mx-auto">90 Tage kostenlos, 1 Immobilie, alle Funktionen — ohne Kreditkarte.</p>
                <div className="mt-8"><CTA>Jetzt kostenlos starten</CTA></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-ink text-white/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Logo hell />
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap justify-center">
            <a href="/" className="hover:text-white">Startseite</a>
            <a href="/ratgeber" className="hover:text-white">Ratgeber</a>
            <ImpressumDatenschutzLinks className="text-white/50 hover:text-white" />
          </div>
          <span>© {new Date().getFullYear()} renditly</span>
        </div>
      </footer>
    </div>
  );
}
