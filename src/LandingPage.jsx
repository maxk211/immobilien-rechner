import { useState } from 'react';
import { ImpressumDatenschutzLinks } from './components/ImpressumDatenschutz';
import {
  Check, ArrowRight, Lock, Globe, ShieldCheck, Ban, Eye, Key, BellOff, Building2,
  LayoutDashboard, Wallet, Receipt, Users, FileText, Landmark, Home, Repeat, FileCheck2,
  Calculator, Percent, CalendarClock, Hourglass, MapPin, BarChart3, BookOpen, Scale, Plus, Minus,
} from 'lucide-react';
import {
  DashboardMockup, WasStehtAn, RechnetSichDasMockup, FinanzierungMockup, PlausiMockup,
  WerZahltMockup, Fenster, AppKopf,
} from './landing/AppMockups';
import Preise from './landing/Preise';

// Startseite renditly.de im Look der App (UX-Update): Plus Jakarta Sans + Violett
// über .font-app, dunkler Kopf (bg-ink), Karten auf hellem Grund (bg-canvas).
// Wichtig: Hero- und Feature-Aussagen müssen zum statischen Inhalt in index.html passen.

export const FAQS = [
  {
    q: 'Wie berechne ich die Mietrendite mit renditly?',
    a: 'Du gibst Kaufpreis, Kaufnebenkosten, Kaltmiete und laufende Kosten ein — renditly berechnet sofort Bruttomietrendite, Nettomietrendite und Cash-on-Cash-Rendite. Alle Werte werden automatisch aktualisiert wenn sich Miete oder Kosten ändern.',
  },
  {
    q: 'Was ist ein guter Cashflow bei Immobilien?',
    a: 'Als Faustregel gilt: ein positiver monatlicher Cashflow nach allen Kosten (Rate, Instandhaltung, Verwaltung, Hausgeld) ist das Ziel. renditly zeigt dir den Cashflow monatsgenau — vor und nach Tilgung, inklusive Prognose mit Anschlussfinanzierung.',
  },
  {
    q: 'Woran erinnert mich renditly?',
    a: 'Unter „Was steht an“ sammelt renditly alles, was gerade fällig ist: offene Mieten und Untermieten, mögliche Mieterhöhungen (Kappungsgrenze und 15-Monats-Frist), das Ende der Zinsbindung, fehlende Nebenkostenabrechnungen und fehlende Kautionen. Jede Zeile hat die passende Aktion, zum Beispiel „Eingegangen“ oder „Anschluss planen“.',
  },
  {
    q: 'Was passiert, wenn ich mich bei einer Zahl vertippe?',
    a: 'Die Plausibilitätsprüfung vergleicht deine Eingaben mit typischen Werten. Widersprüche wie eine Zinsbindung, die vor dem Kreditstart endet, werden rot markiert; ungewöhnliche Werte wie 38 % Sollzins gelb. Du korrigierst mit einem Klick oder bestätigst mit „Stimmt so“.',
  },
  {
    q: 'Kann ich die App kostenlos testen?',
    a: 'Ja — du kannst renditly 90 Tage kostenlos mit einer Immobilie testen, ohne Kreditkarte. Du bekommst Zugang zu allen Features: Cashflow-Analyse, Steuervorbereitung, Mieterverwaltung und mehr.',
  },
  {
    q: 'Für wen ist renditly geeignet?',
    a: 'renditly richtet sich an deutsche Vermieter und Immobilien-Investoren — vom Einsteiger mit einer Eigentumswohnung bis zum Profi mit mehreren Mehrfamilienhäusern. Der Starter-Plan eignet sich für 1 Objekt, Standard für bis zu 10 Immobilien, Pro für unlimitierte Portfolios.',
  },
  {
    q: 'Welche Steuer-Daten kann renditly exportieren?',
    a: 'renditly exportiert alle steuerlich relevanten Posten als Excel und PDF: Mieteinnahmen, Schuldzinsen (annuitätisch korrekt je Phase), Instandhaltung, Hausgeld, Verwaltungskosten, Fahrtkosten nach km-Pauschale und Erhaltungsaufwand. AfA-Daten werden als Grundlage für den Steuerberater mitgeliefert.',
  },
  {
    q: 'Kann jemand mein Vermögen oder meine Immobilien sehen?',
    a: 'Nein — absolut nicht. Jeder Account ist vollständig isoliert. Weder andere Nutzer noch wir als Betreiber können sehen, welche Immobilien du hast, was sie wert sind oder wie dein Cashflow aussieht. Die Datenbank erzwingt das technisch über Row Level Security.',
  },
  {
    q: 'Sind meine Finanzdaten sicher gespeichert?',
    a: 'Ja. Alle Daten liegen verschlüsselt auf Servern in der EU (PostgreSQL via Supabase). Die Verbindung ist immer TLS-verschlüsselt. Deine Daten werden nicht verkauft oder für Werbung genutzt.',
  },
  {
    q: 'Was passiert wenn ich kündige?',
    a: 'Du kannst jederzeit monatlich kündigen. Deine Daten bleiben erhalten und du kannst weiterhin eine Immobilie verwalten.',
  },
  {
    q: 'Gibt es eine mobile App?',
    a: 'Die Web-App ist vollständig mobiloptimiert und funktioniert auf iPhone und Android wie eine native App — ohne Download aus dem App Store.',
  },
];

const FUNKTIONEN = [
  { icon: LayoutDashboard, titel: 'Cockpit je Objekt', text: 'Kennzahlen, Mieteingänge und „Jetzt dran“ mit der passenden Aktion — auf einer Seite.' },
  { icon: Wallet, titel: 'Cashflow mit Rechenweg', text: 'Monat, Jahr und Prognose. Vor und nach Tilgung, jede Zeile nachvollziehbar.' },
  { icon: Receipt, titel: 'Steuern je Steuerjahr', text: 'AfA, Schuldzinsen, Werbungskosten und Überschuss — als PDF oder Excel für den Steuerberater.' },
  { icon: Users, titel: 'Mieter und Mieterhöhung', text: 'Mieteingänge abhaken, auch rückwirkend. Mieterhöhung mit Kappungsgrenze durchrechnen, Mahnschreiben als PDF.' },
  { icon: FileText, titel: 'Nebenkostenabrechnung', text: 'In vier Schritten zur Abrechnung, mit Anschreiben an den Mieter.' },
  { icon: Building2, titel: 'Mehrfamilienhäuser', text: 'Jede Wohnung mit eigener Miete, eigenem Mieter und eigenen Eingängen.' },
  { icon: Repeat, titel: 'Untervermietung', text: 'Wohnung anmieten und zimmerweise untervermieten — mit Untermieten und der Frage, wer welche Kosten zahlt.' },
  { icon: Landmark, titel: 'Beleihbar frei', text: 'Wie viel du für den nächsten Kauf beleihen könntest — und die Selbstauskunft als PDF für die Bank.' },
  { icon: Home, titel: 'Anlage in 4 Schritten', text: 'Adresse tippen, Grunderwerbsteuer kommt aus dem Bundesland. Die erste Zahl steht vor dem Speichern.' },
];

const SICHERHEIT = [
  { icon: ShieldCheck, titel: 'Vollständige Datenisolierung', text: 'Jeder Account ist technisch komplett getrennt — auf Datenbankebene erzwungen, nicht nur durch Passwörter.' },
  { icon: Building2, titel: 'Row Level Security', text: 'Der gleiche Mechanismus, den Banken für Kontentrennung nutzen. Ein fremder Link zeigt nur eine leere Seite.' },
  { icon: Globe, titel: 'EU-Server, verschlüsselt', text: 'Daten verschlüsselt in der EU (PostgreSQL), Verbindung immer per TLS.' },
  { icon: Eye, titel: 'Kein Einblick durch uns', text: 'Auch wir als Betreiber sehen nicht, welche Immobilien du hast oder was sie wert sind.' },
  { icon: Key, titel: 'Deine Daten gehören dir', text: 'Jederzeit exportieren oder den Account löschen — auf Wunsch werden alle Daten entfernt.' },
  { icon: BellOff, titel: 'Keine Werbung, kein Datenverkauf', text: 'Keine Weitergabe an Dritte, keine Verhaltensanalyse, kein Remarketing.' },
];

const TOOLS = [
  { icon: Calculator, title: 'Mietrendite-Rechner', href: '/mietrendite-rechner' },
  { icon: Receipt, title: 'AfA-Rechner', href: '/afa-rechner' },
  { icon: Landmark, title: 'Grunderwerbsteuer-Rechner', href: '/grunderwerbsteuer-rechner' },
  { icon: Percent, title: 'Kaufnebenkosten-Rechner', href: '/kaufnebenkosten-rechner' },
  { icon: CalendarClock, title: 'Tilgungsplan-Rechner', href: '/tilgungsplan-rechner' },
  { icon: Hourglass, title: 'Spekulationsfrist-Rechner', href: '/spekulationsfrist-rechner' },
  { icon: MapPin, title: 'Mietrendite nach Stadt', href: '/mietrendite-staedte' },
  { icon: BarChart3, title: 'Mietrendite-Report 2026', href: '/mietrendite-report-2026' },
  { icon: BookOpen, title: 'Mietrendite berechnen', href: '/ratgeber/mietrendite-berechnen' },
  { icon: Wallet, title: 'Cashflow bei Immobilien', href: '/ratgeber/cashflow-bei-immobilien' },
  { icon: Receipt, title: 'AfA & Steuern', href: '/ratgeber/afa-und-steuern-vermietung' },
  { icon: BookOpen, title: 'Immobilien-Lexikon', href: '/immobilien-lexikon' },
  { icon: BookOpen, title: 'Alle Ratgeber-Artikel', href: '/ratgeber' },
  { icon: Scale, title: 'renditly vs. ImmoAnalyse', href: '/renditly-vs-immoanalyse' },
  { icon: FileCheck2, title: 'Hilfe-Center', href: '/hilfe' },
];

export function Logo({ hell = false }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-base font-black flex items-center justify-center">r</span>
      <span className={`font-extrabold text-lg tracking-tight ${hell ? 'text-white' : 'text-gray-900'}`}>renditly</span>
    </span>
  );
}

// Abschnitt "Text links, App-Ausschnitt rechts" (abwechselnd gespiegelt)
function Vertiefung({ nr, eyebrow, titel, text, punkte, children, gespiegelt = false }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
      <div className={gespiegelt ? 'lg:order-2' : ''}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{nr}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">{eyebrow}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{titel}</h3>
        <p className="text-gray-600 mt-3 leading-relaxed">{text}</p>
        <ul className="mt-5 space-y-2">
          {punkte.map(p => (
            <li key={p} className="flex items-start gap-2 text-sm text-gray-700"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{p}</li>
          ))}
        </ul>
      </div>
      <div className={gespiegelt ? 'lg:order-1' : ''}>{children}</div>
    </div>
  );
}

const LandingPage = ({ onGetStarted, onLogin }) => {
  const [offen, setOffen] = useState(null);

  return (
    <div className="font-app min-h-screen bg-white text-gray-900 antialiased">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a href="/" aria-label="renditly Startseite"><Logo /></a>
          <div className="hidden md:flex items-center gap-1 text-sm font-semibold text-gray-600">
            <a href="#funktionen" className="px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-gray-900">Funktionen</a>
            <a href="#pricing" className="px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-gray-900">Preise</a>
            <a href="/mietrendite-rechner" className="px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-gray-900">Rechner</a>
            <a href="/ratgeber" className="px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-gray-900">Ratgeber</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="text-sm font-semibold text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100">Einloggen</button>
            <button onClick={onGetStarted} className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl whitespace-nowrap">
              <span className="hidden sm:inline">Kostenlos starten</span><span className="sm:hidden">Starten</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 right-0 w-[36rem] h-[36rem] bg-indigo-600/25 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs font-semibold text-indigo-200 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Für private Vermieter in Deutschland
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.1rem] font-extrabold leading-[1.08] tracking-tight">
              Dein Immobilien&shy;portfolio.<br />
              <span className="text-indigo-300">Endlich im Griff.</span>
            </h1>
            <p className="text-lg text-white/70 mt-6 max-w-xl leading-relaxed">
              Rendite, Cashflow, Steuer und Mieter an einem Ort — und jeden Monat auf einen Blick,
              was ansteht: offene Mieten, Mieterhöhungen, Zinsbindung, Nebenkostenabrechnung.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button onClick={onGetStarted} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40">
                90 Tage kostenlos testen <ArrowRight size={18} />
              </button>
              <a href="#funktionen" className="px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold rounded-xl text-center">
                So funktioniert’s
              </a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-sm text-white/60">
              {['Keine Kreditkarte', 'Alle Funktionen', 'Jederzeit kündbar'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><Check size={15} className="text-emerald-400" />{t}</span>
              ))}
            </div>
          </div>
          <div className="lg:pl-4">
            <DashboardMockup />
            <p className="text-center text-xs text-white/40 mt-3">So sieht dein Dashboard aus — mit Beispielzahlen</p>
          </div>
        </div>
      </header>

      {/* ── VERTRAUENSLEISTE ── */}
      <div className="bg-canvas border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            [Lock, 'TLS-verschlüsselt'], [Globe, 'Server in der EU'],
            [ShieldCheck, 'Row Level Security'], [Ban, 'Kein Datenverkauf'],
          ].map(([Icon, t]) => (
            <div key={t} className="flex items-center justify-center gap-2 text-gray-600 font-semibold"><Icon size={16} className="text-indigo-600" />{t}</div>
          ))}
        </div>
      </div>

      {/* ── VERTIEFUNG ── */}
      <section id="funktionen" className="py-16 sm:py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
            <div className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-2">Funktionen</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Weniger suchen, mehr wissen</h2>
            <p className="text-gray-500 mt-3">renditly rechnet nicht nur — es sagt dir, was zu tun ist, und prüft, ob deine Zahlen stimmen.</p>
          </div>

          <div className="space-y-20 sm:space-y-28">
            <Vertiefung nr="1" eyebrow="Was steht an"
              titel="Jeden Monat wissen, was dran ist"
              text="Alle offenen Punkte deines Portfolios in einer Liste, sortiert nach Dringlichkeit. Jede Zeile hat die passende Aktion — kein Suchen in Reitern."
              punkte={[
                'Miete eingegangen? Ein Klick, auch rückwirkend für vergangene Monate',
                'Mieterhöhung mit Kappungsgrenze und 15-Monats-Frist',
                'Zinsbindungsende mit Restschuld und Anschlussrate',
                'Nebenkostenabrechnung mit Frist, Mahnschreiben als PDF',
              ]}>
              <Fenster><AppKopf /><div className="p-3"><WasStehtAn /></div></Fenster>
            </Vertiefung>

            <Vertiefung nr="2" eyebrow="Rechnet sich das?" gespiegelt
              titel="Vor dem Kauf: ein Urteil in einem Satz"
              text="Kaufpreis, Miete und Finanzierung eingeben — renditly sagt dir, ob sich die Wohnung trägt, und nennt die Grenzwerte, ab denen sie kippt. Auch für Anmieten und Untervermieten."
              punkte={[
                'Cashflow vor und nach Tilgung, nicht nur eine Rendite',
                'Grunderwerbsteuer automatisch aus dem Bundesland',
                'Grenzwerte für Miete, Kaufpreis, Eigenkapital und Zins',
                'Gekauft? Mit einem Klick als Immobilie übernehmen',
              ]}>
              <RechnetSichDasMockup />
            </Vertiefung>

            <Vertiefung nr="3" eyebrow="Finanzierung"
              titel="Finanzierung, die mitdenkt"
              text="Mehrere Darlehensphasen, Sondertilgungen und Anschlussfinanzierung — monatsgenau gerechnet. Du siehst, was zum Ende der Zinsbindung noch offen ist und was die neue Rate kostet."
              punkte={[
                'Restschuld heute und am Zinsbindungsende',
                'Anschlussrate für deinen Wunschzins durchspielen',
                'Erinnerung, wenn ein Forward-Darlehen möglich wird',
              ]}>
              <FinanzierungMockup />
            </Vertiefung>

            <Vertiefung nr="4" eyebrow="Plausibilitätsprüfung" gespiegelt
              titel="Zahlen, denen du trauen kannst"
              text="Ein Komma an der falschen Stelle verfälscht jede Rendite. renditly prüft deine Eingaben gegen typische Werte und gegeneinander — und zeigt, was unauffällig ist."
              punkte={[
                'Widersprüche rot, ungewöhnliche Werte gelb — „Stimmt so“ bestätigt dauerhaft',
                '„Wer zahlt?“ je Kostenposition, mit Datum und auch rückwirkend',
                'Jahreswerte monatsgenau: zählt nur, was du wirklich gezahlt hast',
              ]}>
              <div className="space-y-3">
                <PlausiMockup />
                <WerZahltMockup />
              </div>
            </Vertiefung>
          </div>
        </div>
      </section>

      {/* ── ALLE FUNKTIONEN ── */}
      <section className="py-16 sm:py-24 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Und alles andere, was Vermieten braucht</h2>
            <p className="text-gray-500 mt-3">Von der ersten Eigentumswohnung bis zum Mehrfamilienhaus — ohne das Werkzeug zu wechseln.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FUNKTIONEN.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.titel} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><Icon size={19} /></div>
                  <h3 className="font-extrabold text-gray-900">{f.titel}</h3>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SO STARTEST DU ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">In wenigen Minuten startklar</h2>
            <p className="text-gray-500 mt-3">Keine Einrichtung, kein Onboarding-Call, keine Kreditkarte.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['1', 'Konto anlegen', 'Mit deiner E-Mail-Adresse. Dauert eine halbe Minute.'],
              ['2', 'Objekt in 4 Schritten', 'Was du besitzt, die Wohnung, Kauf und Finanzierung, Miete und Kosten. Die erste Zahl steht vor dem Speichern.'],
              ['3', 'Was steht an abarbeiten', 'Ab jetzt zeigt dir das Dashboard jeden Monat, was zu tun ist.'],
            ].map(([nr, t, x]) => (
              <div key={nr} className="rounded-2xl border border-gray-200 p-6">
                <div className="w-9 h-9 rounded-full bg-ink text-white font-extrabold flex items-center justify-center mb-4">{nr}</div>
                <h3 className="font-extrabold text-gray-900">{t}</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{x}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={onGetStarted} className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl inline-flex items-center gap-2">
              Jetzt kostenlos starten <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── PREISE ── */}
      <Preise onGetStarted={onGetStarted} />

      {/* ── SICHERHEIT ── */}
      <section className="py-16 sm:py-24 bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
              <Lock size={13} /> Deine Daten — nur für dich
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Niemand sieht dein Vermögen außer dir</h2>
            <p className="text-white/60 mt-3">Immobilienvermögen ist Privatsache. Kein anderer Nutzer — und auch wir als Betreiber nicht — bekommt Einblick in deine Daten.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SICHERHEIT.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.titel} className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6">
                  <Icon size={20} className="text-indigo-300 mb-3" />
                  <h3 className="font-bold">{s.titel}</h3>
                  <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-10">Häufige Fragen</h2>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button type="button" onClick={() => setOffen(offen === i ? null : i)} aria-expanded={offen === i}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left">
                  <span className="font-bold text-gray-900">{f.q}</span>
                  <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">{offen === i ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                {offen === i && <p className="pb-5 -mt-1 text-gray-600 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KOSTENLOSE TOOLS & RATGEBER ── */}
      <section className="py-16 sm:py-20 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Kostenlose Tools &amp; Ratgeber</h2>
            <p className="text-gray-500 mt-2">Auch ohne Account nutzbar — rechne und informiere dich, bevor du dich entscheidest.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOOLS.map(t => {
              const Icon = t.icon;
              return (
                <a key={t.href} href={t.href} className="group bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 hover:border-indigo-300 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Icon size={16} /></span>
                  <span className="font-semibold text-sm text-gray-800 flex-1">{t.title}</span>
                  <ArrowRight size={15} className="text-gray-300 group-hover:text-indigo-600" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SCHLUSS-CTA ── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-ink text-white px-6 py-12 sm:px-12 sm:py-16 text-center">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-72 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Bereit, dein Portfolio im Griff zu haben?</h2>
              <p className="text-white/60 mt-3 max-w-lg mx-auto">Starte kostenlos. Upgrade, wenn du bereit bist. Kündige, wann du willst.</p>
              <button onClick={onGetStarted} className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-xl inline-flex items-center gap-2">
                Jetzt kostenlos starten <ArrowRight size={20} />
              </button>
              <p className="text-white/40 text-sm mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · Sofort loslegen</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-ink text-white/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <Logo hell />
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap justify-center">
            <a href="/mietrendite-rechner" className="hover:text-white">Rechner</a>
            <a href="/mietrendite-staedte" className="hover:text-white">Städte</a>
            <a href="/ratgeber" className="hover:text-white">Ratgeber</a>
            <a href="/hilfe" className="hover:text-white">Hilfe</a>
            <a href="#pricing" className="hover:text-white">Preise</a>
            <button onClick={onLogin} className="hover:text-white">Einloggen</button>
            <button onClick={onGetStarted} className="hover:text-white">Registrieren</button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs">
            <ImpressumDatenschutzLinks className="text-white/50 hover:text-white" />
            <span className="hidden sm:inline opacity-40">·</span>
            <span>© {new Date().getFullYear()} renditly</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-center mt-6 pt-6 border-t border-white/10">
          <a href="https://www.producthunt.com/products/renditly-de/reviews/new?utm_source=badge-renditly-de&utm_medium=badge" target="_blank" rel="noopener noreferrer">
            <img src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1289958&theme=light"
              alt="renditly.de - Cashflow, Wertentwicklung & Mieter für deutsche Vermieter | Product Hunt"
              style={{ width: 250, height: 54 }} width="250" height="54" loading="lazy" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
