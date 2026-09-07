import { useState } from 'react';
import { Rocket, CreditCard, Calculator, Receipt, Users, ShieldCheck, Search } from 'lucide-react';
import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz';

const KATEGORIEN = [
  {
    id: 'erste-schritte',
    icon: Rocket,
    titel: 'Erste Schritte',
    fragen: [
      {
        q: 'Wie starte ich mit renditly?',
        a: 'Registriere dich kostenlos ohne Kreditkarte, lege deine erste Immobilie an (Kaufpreis, Kaltmiete, laufende Kosten) und renditly berechnet sofort Rendite und Cashflow. Die Testphase läuft 90 Tage mit vollem Funktionsumfang für eine Immobilie.',
      },
      {
        q: 'Für wen ist renditly geeignet?',
        a: 'Für deutsche Vermieter und Immobilien-Investoren — vom Einsteiger mit einer Eigentumswohnung bis zum Profi mit mehreren Mehrfamilienhäusern. Der Starter-Plan eignet sich für 1 Objekt, Standard für bis zu 10 Immobilien, Pro für unlimitierte Portfolios.',
      },
      {
        q: 'Brauche ich Vorkenntnisse in Immobilienrechnung?',
        a: 'Nein. Du gibst die bekannten Eckdaten deiner Immobilie ein (Kaufpreis, Miete, Kosten) — renditly übernimmt die Formeln für Rendite, Cashflow, AfA und Grunderwerbsteuer automatisch nach deutschem Recht.',
      },
      {
        q: 'Gibt es eine mobile App?',
        a: 'Die Web-App ist vollständig mobiloptimiert und funktioniert auf iPhone und Android wie eine native App — ohne Download aus dem App Store.',
      },
    ],
  },
  {
    id: 'preise',
    icon: CreditCard,
    titel: 'Preise & Tarife',
    fragen: [
      {
        q: 'Was kostet renditly?',
        a: 'Starter ab 4,99 €/Monat für 1 Immobilie, Standard ab 12,49 €/Monat für bis zu 10 Immobilien, Pro ab 24,99 €/Monat für unlimitierte Immobilien inklusive Priorität-Support. Alle Tarife enthalten alle Features — der einzige Unterschied ist die Anzahl der Immobilien.',
      },
      {
        q: 'Kann ich renditly kostenlos testen?',
        a: 'Ja — 90 Tage lang, mit einer Immobilie und allen Features, ohne Kreditkarte bei der Anmeldung. Du entscheidest danach, ob du upgraden möchtest.',
      },
      {
        q: 'Kann ich jederzeit kündigen?',
        a: 'Ja, alle Tarife sind monatlich kündbar, keine Mindestlaufzeit. Bei jährlicher Zahlung sparst du zusätzlich 20 %.',
      },
      {
        q: 'Was passiert mit meinen Daten, wenn ich kündige?',
        a: 'Deine Daten bleiben erhalten. Nach einer Kündigung kannst du weiterhin eine Immobilie im kostenlosen Umfang verwalten, statt Zugriff komplett zu verlieren.',
      },
      {
        q: 'Kann ich zwischen den Tarifen wechseln?',
        a: 'Ja, ein Upgrade oder Downgrade ist jederzeit im Account-Bereich möglich. Bei einem Downgrade musst du dein Portfolio ggf. vorher auf die neue Immobilien-Obergrenze reduzieren.',
      },
    ],
  },
  {
    id: 'rendite-cashflow',
    icon: Calculator,
    titel: 'Rendite & Cashflow',
    fragen: [
      {
        q: 'Wie berechnet renditly die Mietrendite?',
        a: 'Du gibst Kaufpreis, Kaufnebenkosten, Kaltmiete und laufende Kosten ein — renditly berechnet sofort Bruttomietrendite, Nettomietrendite und Cash-on-Cash-Rendite. Alle Werte aktualisieren sich automatisch, wenn sich Miete oder Kosten ändern.',
      },
      {
        q: 'Was ist ein guter Cashflow bei Immobilien?',
        a: 'Als Faustregel gilt: ein positiver monatlicher Cashflow nach allen Kosten (Rate, Instandhaltung, Verwaltung, Hausgeld) ist das Ziel. renditly zeigt den Cashflow monatsgenau — inklusive Prognose über die Zinsbindung hinaus mit Anschlussfinanzierung.',
      },
      {
        q: 'Berücksichtigt renditly Mietanpassungen und Kostenänderungen über die Jahre?',
        a: 'Ja. Mieterhöhungen und Kostenänderungen werden mit Datum erfasst — Cashflow und Rendite werden dadurch für jedes Jahr mit den zum jeweiligen Zeitpunkt tatsächlich gültigen Werten berechnet, nicht nur mit dem aktuellen Stand.',
      },
      {
        q: 'Kann ich mehrere Immobilien im Portfolio vergleichen?',
        a: 'Ja, das Portfolio-Dashboard zeigt Rendite, Cashflow und Wertentwicklung aller Immobilien im Überblick sowie aggregiert für das Gesamtportfolio.',
      },
    ],
  },
  {
    id: 'steuern',
    icon: Receipt,
    titel: 'Steuern',
    fragen: [
      {
        q: 'Welche Steuerdaten kann renditly exportieren?',
        a: 'renditly exportiert alle steuerlich relevanten Posten als Excel und PDF: Mieteinnahmen, Schuldzinsen (annuitätisch korrekt je Finanzierungsphase), Instandhaltung, Hausgeld, Verwaltungskosten, Fahrtkosten nach km-Pauschale und Erhaltungsaufwand. AfA-Daten werden als Grundlage für deinen Steuerberater mitgeliefert.',
      },
      {
        q: 'Berechnet renditly die AfA automatisch?',
        a: 'Ja, nach § 7 EStG inklusive Sonder-AfA § 7b für begünstigte Neubau-Mietwohnungen. Der kostenlose AfA-Rechner steht auch ohne Account zur Verfügung.',
      },
      {
        q: 'Ersetzt renditly meinen Steuerberater?',
        a: 'Nein. renditly bereitet die relevanten Zahlen (AfA, Werbungskosten, Cashflow) sauber auf und exportiert sie als Excel oder PDF für deinen Steuerberater — die steuerliche Beratung selbst bleibt bei einem Steuerberater.',
      },
      {
        q: 'Berechnet renditly, ab wann ein Verkauf steuerfrei ist?',
        a: 'Ja, über den kostenlosen Spekulationsfrist-Rechner — inklusive Sonderfall Schenkung/Erbschaft und der Eigennutzungs-Ausnahme.',
      },
    ],
  },
  {
    id: 'mieterverwaltung',
    icon: Users,
    titel: 'Mieterverwaltung',
    fragen: [
      {
        q: 'Kann ich Kautionen in renditly verwalten?',
        a: 'Ja, das Kautionsmanagement trackt Betrag, Zahlungseingang und Verzinsung je Mieter — inklusive Hinweis auf die gesetzliche Höchstgrenze von 3 Nettokaltmieten.',
      },
      {
        q: 'Kann ich Nebenkostenabrechnungen erstellen?',
        a: 'Ja, über den Nebenkostenabrechnungs-Tab je Immobilie, inklusive Umlageschlüssel und Fristenkontrolle für die gesetzliche 12-Monats-Abrechnungsfrist.',
      },
      {
        q: 'Erinnert renditly mich an Fristen bei Mieterhöhungen?',
        a: 'Ja, renditly erfasst die letzte Mieterhöhung je Mietverhältnis und weist auf die Sperrfrist sowie die Kappungsgrenze hin, sobald eine neue Mieterhöhung wieder möglich ist.',
      },
      {
        q: 'Kann ich ein Mehrfamilienhaus mit mehreren Wohnungen verwalten?',
        a: 'Ja, der Immobilientyp „Mehrfamilienhaus" erlaubt die separate Verwaltung einzelner Wohnungen inklusive jeweils eigener Mieter, Mieten und Kosten innerhalb eines Objekts.',
      },
    ],
  },
  {
    id: 'daten-sicherheit',
    icon: ShieldCheck,
    titel: 'Daten & Sicherheit',
    fragen: [
      {
        q: 'Kann jemand mein Vermögen oder meine Immobilien sehen?',
        a: 'Nein. Jeder Account ist vollständig isoliert. Weder andere Nutzer noch der Betreiber können sehen, welche Immobilien du hast, was sie wert sind oder wie dein Cashflow aussieht — das wird technisch über Row Level Security in der Datenbank erzwungen.',
      },
      {
        q: 'Wo werden meine Daten gespeichert?',
        a: 'In der EU, DSGVO-konform (PostgreSQL via Supabase). Die Verbindung ist immer TLS-verschlüsselt. Details dazu in der Datenschutzerklärung.',
      },
      {
        q: 'Werden meine Daten verkauft oder für Werbung genutzt?',
        a: 'Nein. Deine Finanz- und Immobiliendaten werden nicht verkauft und nicht für Werbezwecke verwendet.',
      },
      {
        q: 'Kann ich meine Daten exportieren oder löschen lassen?',
        a: 'Ja, alle Kernberechnungen lassen sich als Excel/PDF exportieren. Für eine vollständige Löschung deines Accounts wende dich an den Support.',
      },
    ],
  },
];

export default function HilfeCenter() {
  const [suche, setSuche] = useState('');
  const q = suche.trim().toLowerCase();

  const gefiltert = KATEGORIEN.map((k) => ({
    ...k,
    fragen: k.fragen.filter(
      (f) => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    ),
  })).filter((k) => k.fragen.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
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

      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-4">
            Hilfe-Center
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Wie können wir helfen?
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-7 max-w-xl mx-auto">
            Alle Antworten zu Erste Schritte, Preisen, Rendite, Steuern, Mieterverwaltung und Sicherheit an einem Ort.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Frage durchsuchen…"
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        {!suche && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
            {KATEGORIEN.map((k) => {
              const Icon = k.icon;
              return (
                <a
                  key={k.id}
                  href={`#${k.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col items-center text-center gap-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon size={17} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">{k.titel}</span>
                </a>
              );
            })}
          </div>
        )}

        {gefiltert.length === 0 && (
          <p className="text-center text-slate-400 py-16">Keine Treffer für „{suche}" — versuch es mit einem anderen Begriff oder schreib uns direkt.</p>
        )}

        <div className="space-y-12">
          {gefiltert.map((k) => {
            const Icon = k.icon;
            return (
              <section key={k.id} id={k.id} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{k.titel}</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  {k.fragen.map((f) => (
                    <details key={f.q} className="group p-4 sm:p-5">
                      <summary className="font-bold text-slate-900 cursor-pointer list-none flex items-center justify-between gap-3">
                        {f.q}
                        <span className="text-slate-300 group-open:rotate-45 transition-transform text-xl leading-none shrink-0">+</span>
                      </summary>
                      <p className="text-sm text-slate-600 leading-relaxed mt-3">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-14 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-10 text-white text-center">
          <h2 className="text-xl sm:text-2xl font-black mb-2">Frage nicht dabei?</h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-md mx-auto">
            Schreib uns direkt — wir antworten in der Regel innerhalb eines Werktags.
          </p>
          <a href="mailto:hallo@renditly.de" className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">
            hallo@renditly.de
          </a>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
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
