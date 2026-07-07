import { useState } from 'react';

// ─── Impressum & Datenschutz Modals ─────────────────────────────────────────
// § 5 TMG + DSGVO-konforme Datenschutzerklärung
// Gesellschaft: ImmoBros GbR

const FIRMA = 'ImmoBros GbR';
const ADRESSE = 'An der Hülling 6, 93047 Regensburg';
const GESELLSCHAFTER = 'David Schmidbauer, Maximilian Kammel';
const EMAIL = 'info@immobilienportfolio.app'; // ggf. anpassen

const Modal = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
      <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div />
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg font-bold transition-colors"
        >
          ×
        </button>
      </div>
      <div className="px-6 pb-8 pt-4 prose prose-sm max-w-none text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
    <div className="text-sm text-gray-600 space-y-1">{children}</div>
  </div>
);

export const ImpressumModal = ({ onClose }) => (
  <Modal onClose={onClose}>
    <h2 className="text-xl font-black text-gray-900 mb-6">Impressum</h2>

    <Section title="Angaben gemäß § 5 TMG">
      <p className="font-semibold text-gray-800">{FIRMA}</p>
      <p>{ADRESSE}</p>
      <p className="mt-1">Vertretungsberechtigte Gesellschafter: {GESELLSCHAFTER}</p>
    </Section>

    <Section title="Kontakt">
      <p>E-Mail: <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a></p>
    </Section>

    <Section title="Umsatzsteuer">
      <p>Als GbR ohne gewerbliche Tätigkeit im Sinne des UStG derzeit nicht umsatzsteuerpflichtig. Eine USt-IdNr. wird nachgetragen, sobald diese beantragt und erteilt wurde.</p>
    </Section>

    <Section title="Haftung für Inhalte">
      <p>Die Inhalte dieser Anwendung wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Die Berechnungen und Auswertungen in dieser App dienen ausschließlich der persönlichen Orientierung und stellen keine steuerliche, rechtliche oder finanzielle Beratung dar. Bitte konsultieren Sie für verbindliche Auskünfte einen Steuerberater, Rechtsanwalt oder Finanzberater.</p>
    </Section>

    <Section title="Haftung für Links">
      <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.</p>
    </Section>

    <Section title="Urheberrecht">
      <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
    </Section>
  </Modal>
);

export const DatenschutzModal = ({ onClose }) => (
  <Modal onClose={onClose}>
    <h2 className="text-xl font-black text-gray-900 mb-1">Datenschutzerklärung</h2>
    <p className="text-xs text-gray-400 mb-6">Gemäß DSGVO (EU) 2016/679</p>

    <Section title="1. Verantwortlicher">
      <p className="font-semibold text-gray-800">{FIRMA}</p>
      <p>{ADRESSE}</p>
      <p>E-Mail: <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a></p>
    </Section>

    <Section title="2. Welche Daten wir verarbeiten">
      <p><strong>Kontodaten:</strong> Bei der Registrierung erfassen wir Ihre E-Mail-Adresse. Passwörter werden ausschließlich als gehashter Wert gespeichert und sind für uns nicht einsehbar.</p>
      <p className="mt-1"><strong>Immobilien- und Mieterdaten:</strong> Alle Daten, die Sie in der App eingeben (Immobilien, Mieter, Cashflow-Werte usw.), werden in Ihrer persönlichen Datenbank gespeichert und sind nur für Ihr Konto zugänglich.</p>
      <p className="mt-1"><strong>Technische Daten:</strong> Beim Aufruf der Anwendung werden automatisch allgemeine technische Informationen übermittelt (IP-Adresse, Browser-Typ, Zeitpunkt des Zugriffs). Diese werden nicht personenbezogen ausgewertet.</p>
    </Section>

    <Section title="3. Rechtsgrundlage der Verarbeitung">
      <p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) für die Bereitstellung der App-Funktionen sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) für den technischen Betrieb des Dienstes.</p>
    </Section>

    <Section title="4. Auftragsverarbeiter: Supabase">
      <p>Wir nutzen <strong>Supabase, Inc.</strong> (San Francisco, USA) als Backend-Dienstleister für Authentifizierung und Datenbankbetrieb. Supabase bietet EU-Regionen an; unsere Datenbank ist in der EU-West-Region gehostet. Die Datenübertragung in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln (SCC) gemäß Art. 46 DSGVO.</p>
      <p className="mt-1">Datenschutzrichtlinie Supabase: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/privacy</a></p>
    </Section>

    <Section title="5. Cookies & lokaler Speicher">
      <p>Wir verwenden keine Tracking-Cookies oder Analyse-Tools. Für die Aufrechterhaltung Ihrer Anmeldesitzung setzt Supabase einen technisch notwendigen Session-Token (localStorage). Einige App-Einstellungen werden ebenfalls im localStorage Ihres Browsers gespeichert und verlassen Ihr Gerät nicht.</p>
    </Section>

    <Section title="6. Speicherdauer">
      <p>Ihre Daten werden so lange gespeichert, wie Ihr Konto aktiv ist. Bei Konto-Löschung werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht. Technische Protokolldaten werden nach spätestens 90 Tagen gelöscht.</p>
    </Section>

    <Section title="7. Ihre Rechte">
      <p>Sie haben nach der DSGVO folgende Rechte gegenüber uns:</p>
      <ul className="list-disc list-inside mt-1 space-y-0.5">
        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
        <li>Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
      </ul>
      <p className="mt-1">Zuständige Aufsichtsbehörde: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.</p>
      <p className="mt-1">Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a></p>
    </Section>

    <Section title="8. Datensicherheit">
      <p>Alle Datenübertragungen erfolgen verschlüsselt via HTTPS/TLS. Der Zugriff auf Ihre Daten ist durch Authentifizierung und Row-Level-Security (RLS) in der Datenbank geschützt — d.h. jeder Nutzer kann ausschließlich seine eigenen Daten lesen und schreiben.</p>
    </Section>

    <Section title="9. Änderungen dieser Erklärung">
      <p>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die jeweils aktuelle Version ist in der Anwendung abrufbar. Stand: Juli 2026.</p>
    </Section>
  </Modal>
);

// ─── Wiederverwendbare Link-Gruppe für Footer ────────────────────────────────
export const ImpressumDatenschutzLinks = ({ className = '' }) => {
  const [showImpressum, setShowImpressum] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);

  return (
    <>
      <div className={`flex items-center gap-3 text-xs ${className}`}>
        <button onClick={() => setShowImpressum(true)} className="hover:underline transition-colors">
          Impressum
        </button>
        <span className="opacity-40">·</span>
        <button onClick={() => setShowDatenschutz(true)} className="hover:underline transition-colors">
          Datenschutz
        </button>
      </div>
      {showImpressum && <ImpressumModal onClose={() => setShowImpressum(false)} />}
      {showDatenschutz && <DatenschutzModal onClose={() => setShowDatenschutz(false)} />}
    </>
  );
};
