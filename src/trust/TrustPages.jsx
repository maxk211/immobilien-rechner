import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz.jsx';

// ─── Trust-Anchor-Seiten (Fix 6: "Is Agentic"-Audit) ────────────────────────
// Reale, statisch ausgelieferte /about-, /contact- und /privacy-Seiten mit
// jeweils ≥500 Zeichen echtem Inhalt — die englischen Pfade sind bewusst
// gewählt, da genau diese vom Audit geprüft werden. Nutzt ausschließlich
// verifizierte Fakten aus src/components/ImpressumDatenschutz.jsx (keine
// erfundenen Personas/Adressen). Die deutschen Impressum-/Datenschutz-Modals
// bleiben zusätzlich über den Footer erreichbar; /privacy übernimmt densel­ben
// rechtlich geprüften Text als eigenständige, crawlbare Seite.

const FIRMA = 'ImmoBros GbR';
const ADRESSE = 'An der Hülling 6, 93047 Regensburg';
const GESELLSCHAFTER = 'David Schmidbauer und Maximilian Kammel';
const EMAIL = 'hallo@renditly.de';

const Nav = () => (
  <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
    <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/" className="flex items-center gap-1.5 text-slate-900 hover:text-indigo-600 transition-colors">
        <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </span>
        <span className="font-black text-base" style={{ letterSpacing: '-0.02em' }}>renditly</span>
      </a>
      <div className="flex items-center gap-2">
        <a href="/app" className="text-xs sm:text-sm font-medium text-slate-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">Login</a>
        <a href="/app" className="text-xs sm:text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all">Kostenlos testen</a>
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="border-t border-gray-100 py-8">
    <div className="max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
      <a href="/" className="hover:text-indigo-600">Zur Startseite</a>
      <ImpressumDatenschutzLinks />
    </div>
  </footer>
);

const Shell = ({ eyebrow, title, intro, children }) => (
  <div className="min-h-screen bg-slate-50 font-sans">
    <Nav />
    <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-4">
          {eyebrow}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">{title}</h1>
        {intro && <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">{intro}</p>}
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14 prose prose-slate max-w-none">
      {children}
    </main>
    <Footer />
  </div>
);

export function AboutPage() {
  return (
    <Shell eyebrow="Über uns" title="Über renditly" intro="Wer hinter renditly steht und warum wir es gebaut haben.">
      <h2>Was renditly ist</h2>
      <p>
        renditly ist eine Software für deutsche Vermieter und Immobilien-Investoren, die Rendite, Cashflow, Steuerdaten
        und Mieterverwaltung an einem Ort bündelt — statt in verstreuten Excel-Tabellen und Papierordnern. Mit renditly
        legst du deine Immobilien an, trägst Kaufpreis, Miete und laufende Kosten ein, und die Software berechnet
        automatisch Bruttomietrendite, Nettomietrendite, monatlichen Cashflow und die relevanten Steuerkennzahlen nach
        deutschem Recht.
      </p>
      <h2>Warum wir renditly gebaut haben</h2>
      <p>
        Die meisten privaten Vermieter verwalten ihre Immobilien über Jahre hinweg in selbstgebauten Excel-Tabellen, die
        mit jedem weiteren Objekt unübersichtlicher werden — Mieterhöhungen, Nebenkostenabrechnungen, Kautionen und
        AfA-Berechnungen laufen an mehreren Stellen gleichzeitig und geraten leicht durcheinander. renditly wurde
        gegründet, um genau dieses Problem zu lösen: eine spezialisierte, auf deutsches Mietrecht und Steuerrecht
        zugeschnittene Software statt einer generischen Tabelle.
      </p>
      <h2>Wer wir sind</h2>
      <p>
        renditly wird betrieben von der <strong>{FIRMA}</strong> mit Sitz in Regensburg, vertreten durch die
        Gesellschafter {GESELLSCHAFTER}. Vollständige Angaben findest du im Impressum (Link im Footer dieser Seite).
      </p>
      <h2>Für wen renditly gebaut ist</h2>
      <p>
        Für Einsteiger mit einer einzelnen Eigentumswohnung ebenso wie für Profis mit mehreren Mehrfamilienhäusern. Der
        Starter-Plan eignet sich für ein Objekt, Standard für bis zu zehn Immobilien, Pro für unlimitierte Portfolios.
        Alle Tarife enthalten denselben vollen Funktionsumfang — der einzige Unterschied ist die Anzahl der Immobilien.
      </p>
      <h2>Kontakt</h2>
      <p>
        Fragen, Feedback oder Presseanfragen erreichen uns unter{' '}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Weitere Details auf der{' '}
        <a href="/contact">Kontaktseite</a>.
      </p>
    </Shell>
  );
}

export function ContactPage() {
  return (
    <Shell eyebrow="Kontakt" title="Kontakt" intro="So erreichst du uns.">
      <h2>E-Mail</h2>
      <p>
        Für Fragen zu deinem Account, zu Tarifen oder für allgemeines Feedback schreib uns jederzeit an{' '}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Wir antworten in der Regel innerhalb von 1–2 Werktagen.
      </p>
      <h2>Postanschrift</h2>
      <p>
        {FIRMA}
        <br />
        {ADRESSE}
        <br />
        Deutschland
      </p>
      <h2>Vertretungsberechtigt</h2>
      <p>{GESELLSCHAFTER}</p>
      <h2>Weitere Anlaufstellen</h2>
      <p>
        Häufige Fragen zu Preisen, Rendite-Berechnung, Steuern und Datensicherheit beantwortet unser{' '}
        <a href="/hilfe">Hilfe-Center</a> — oft schneller als eine E-Mail. Vollständige rechtliche Angaben findest du im
        Impressum und in der Datenschutzerklärung (Links im Footer dieser Seite).
      </p>
    </Shell>
  );
}

export function PrivacyPage() {
  return (
    <Shell eyebrow="Datenschutz" title="Privacy Policy / Datenschutzerklärung" intro="Gemäß DSGVO (EU) 2016/679 · Stand: 4. August 2026">
      <h2>1. Verantwortlicher</h2>
      <p>
        {FIRMA}
        <br />
        {ADRESSE}
        <br />
        E-Mail: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </p>

      <h2>2. Welche Daten wir verarbeiten</h2>
      <p>
        <strong>Kontodaten:</strong> Bei der Registrierung erfassen wir deine E-Mail-Adresse. Passwörter werden
        ausschließlich als gehashter Wert gespeichert und sind für uns nicht einsehbar.
      </p>
      <p>
        <strong>Immobilien- und Mieterdaten:</strong> Alle Daten, die du in der App eingibst (Immobilien, Mieter,
        Cashflow-Werte usw.), werden in deiner persönlichen Datenbank gespeichert und sind nur für dein Konto
        zugänglich.
      </p>
      <p>
        <strong>Technische Daten:</strong> Beim Aufruf der Anwendung werden automatisch allgemeine technische
        Informationen übermittelt (IP-Adresse, Browser-Typ, Zeitpunkt des Zugriffs). Diese werden nicht
        personenbezogen ausgewertet.
      </p>

      <h2>3. Rechtsgrundlage der Verarbeitung</h2>
      <p>
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) für die
        Bereitstellung der App-Funktionen sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) für den
        technischen Betrieb des Dienstes.
      </p>

      <h2>4. Auftragsverarbeiter</h2>
      <p>
        <strong>Supabase, Inc.</strong> (Authentifizierung &amp; Datenbank, San Francisco, USA; Datenbank gehostet in
        der EU-West-Region Frankfurt; Datenübertragung auf Grundlage der EU-Standardvertragsklauseln gemäß Art. 46
        DSGVO). Datenschutzrichtlinie: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
      </p>
      <p>
        <strong>Vercel Inc.</strong> (Hosting &amp; Content Delivery, San Francisco, USA; Datenübertragung auf
        Grundlage der EU-Standardvertragsklauseln gemäß Art. 46 DSGVO). Datenschutzrichtlinie:{' '}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>
      </p>
      <p>
        <strong>neue Medien Münnich</strong> (Hauptstraße 68, 02742 Friedersdorf, Deutschland) für transaktionalen
        E-Mail-Versand — die Daten verbleiben auf deutschen Servern. Datenschutzrichtlinie:{' '}
        <a href="https://all-inkl.com/datenschutzerklaerung/" target="_blank" rel="noopener noreferrer">all-inkl.com/datenschutzerklaerung</a>
      </p>

      <h2>5. Cookies, lokaler Speicher &amp; Google Analytics</h2>
      <p>
        Für die Aufrechterhaltung deiner Anmeldesitzung setzt Supabase einen technisch notwendigen Session-Token
        (localStorage). Zusätzlich nutzen wir Google Analytics 4 (Google Ireland Limited) zur statistischen Auswertung
        der Websitenutzung — aktiviert erst nach deiner Zustimmung im Cookie-Banner (Google Consent Mode v2),
        Rechtsgrundlage Art. 6 Abs. 1 lit. a DSGVO. Datenschutzrichtlinie:{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>6. Speicherdauer</h2>
      <p>
        Deine Daten werden so lange gespeichert, wie dein Konto aktiv ist. Bei Konto-Löschung werden alle
        personenbezogenen Daten innerhalb von 30 Tagen gelöscht. Technische Protokolldaten werden nach spätestens 90
        Tagen gelöscht.
      </p>

      <h2>7. Deine Rechte</h2>
      <p>Du hast nach der DSGVO folgende Rechte: Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21) und Beschwerde bei einer Aufsichtsbehörde (Art. 77).</p>
      <p>
        Zuständige Aufsichtsbehörde: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522
        Ansbach. Zur Ausübung deiner Rechte wende dich an: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </p>

      <h2>8. Datensicherheit</h2>
      <p>
        Alle Datenübertragungen erfolgen verschlüsselt via HTTPS/TLS. Der Zugriff auf deine Daten ist durch
        Authentifizierung und Row-Level-Security (RLS) in der Datenbank geschützt — jeder Nutzer kann ausschließlich
        seine eigenen Daten lesen und schreiben.
      </p>

      <h2>9. Änderungen dieser Erklärung</h2>
      <p>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Stand: 4. August 2026.</p>
    </Shell>
  );
}
