import ArticleLayout from './ArticleLayout';

const H2 = ({ children }) => <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-3">{children}</h2>;
const H3 = ({ children }) => <h3 className="text-base font-bold text-slate-900 mt-6 mb-2">{children}</h3>;
const P = ({ children }) => <p className="text-slate-600 leading-relaxed">{children}</p>;
const Box = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 my-4">
    {title && <div className="font-bold text-slate-900 mb-2">{title}</div>}
    <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
  </div>
);

export default function NebenkostenGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Nebenkostenabrechnung für Vermieter: Der komplette Leitfaden"
      untertitel="Welche Kosten umlagefähig sind, welcher Umlageschlüssel gilt und welche Frist zwingend einzuhalten ist — sonst verfällt der Anspruch auf Nachzahlung."
      lesezeit="7"
      related={[
        { href: '/ratgeber/cashflow-bei-immobilien', titel: 'Cashflow bei Immobilien: Was Vermieter wissen müssen' },
        { href: '/ratgeber/mietspiegel-verstehen', titel: 'Mietspiegel verstehen und nutzen' },
        { href: '/mietrendite-rechner', titel: 'Mietrendite-Rechner', kategorie: 'Rechner' },
      ]}
    >
      <section>
        <H2>Warum die Nebenkostenabrechnung für Vermieter wichtig ist</H2>
        <P>
          Die <strong>Nebenkostenabrechnung</strong> (rechtlich korrekt: Betriebskostenabrechnung) ist die jährliche Abrechnung der umlagefähigen Betriebskosten einer Immobilie gegenüber den Mietern. Sie entscheidet direkt über den Cashflow: Wer Kosten übersieht, die eigentlich umlagefähig wären, trägt sie faktisch selbst. Wer die Frist verpasst, verliert den Nachzahlungsanspruch komplett — unabhängig davon, wie berechtigt die Forderung ist.
        </P>
      </section>

      <section>
        <H2>Umlagefähige Betriebskosten: Was darf auf Mieter umgelegt werden?</H2>
        <P>
          Welche Kosten umlagefähig sind, regelt die <strong>Betriebskostenverordnung (BetrKV)</strong>, konkret der Katalog in § 2 BetrKV. Nur Kosten, die dort aufgeführt sind — und die im Mietvertrag als umlagefähig vereinbart wurden — dürfen abgerechnet werden.
        </P>
        <Box title="Umlagefähig (Auswahl)">
          <div className="space-y-2">
            <div><strong>Grundsteuer</strong> — wird vollständig auf Mieter umgelegt</div>
            <div><strong>Wasser & Abwasser</strong> — meist nach Verbrauch</div>
            <div><strong>Heizung & Warmwasser</strong> — mind. 50–70 % nach Verbrauch (HeizkostenV)</div>
            <div><strong>Müllabfuhr, Straßenreinigung, Gebäudereinigung</strong></div>
            <div><strong>Gartenpflege, Hausmeister, Aufzug</strong></div>
            <div><strong>Sach- und Haftpflichtversicherung des Gebäudes</strong></div>
            <div><strong>Kabel-/Breitband-Grundgebühr</strong> (falls vertraglich vereinbart)</div>
          </div>
        </Box>
        <Box title="NICHT umlagefähig">
          <div className="space-y-2">
            <div><strong>Verwaltungskosten</strong> (Hausverwaltung, Buchhaltung)</div>
            <div><strong>Instandhaltungsrücklage & Reparaturen</strong></div>
            <div><strong>Bankgebühren, Finanzierungskosten</strong></div>
            <div><strong>Kosten für Leerstand</strong> (der Vermieter trägt den Anteil leerstehender Einheiten selbst)</div>
          </div>
        </Box>
        <P>
          Ein häufiger Fehler ist, Verwaltungs- oder Instandhaltungskosten versehentlich in die Abrechnung zu mischen — das führt bei einem Widerspruch des Mieters schnell zur (teilweisen) Unwirksamkeit der Abrechnung.
        </P>
      </section>

      <section>
        <H2>Der Umlageschlüssel: Wie werden Kosten verteilt?</H2>
        <P>
          Ist im Mietvertrag kein Umlageschlüssel vereinbart, gilt gesetzlich der <strong>Wohnflächenschlüssel</strong> (§ 556a BGB): Jede Einheit trägt Kosten im Verhältnis ihrer Wohnfläche zur Gesamtwohnfläche des Gebäudes.
        </P>
        <Box>
          <div className="space-y-2">
            <div><strong>Wohnfläche (m²):</strong> Standard-Umlageschlüssel, wenn nichts anderes vereinbart ist</div>
            <div><strong>Verbrauch:</strong> zwingend vorgeschrieben für Heizung/Warmwasser (mind. 50 %), ansonsten frei vereinbar für Wasser/Strom mit Zwischenzählern</div>
            <div><strong>Personenzahl:</strong> häufig bei Müll- oder Wasserkosten, muss vertraglich vereinbart sein</div>
            <div><strong>Miteigentumsanteil (MEA):</strong> bei Eigentumswohnungen oft identisch mit dem Verteilerschlüssel der WEG-Abrechnung</div>
          </div>
        </Box>
        <P>
          Bei Mehrfamilienhäusern mit Gewerbeeinheiten im Erdgeschoss (z. B. Ladenlokal) muss der erhöhte Verbrauch dieser Einheiten (etwa bei Wasser oder Müll) angemessen berücksichtigt werden — sonst drohen berechtigte Einwände der Wohnungsmieter.
        </P>
      </section>

      <section>
        <H2>Die Abrechnungsfrist: Zwölf Monate — keine Ausnahme</H2>
        <P>
          Nach § 556 Abs. 3 BGB muss die Nebenkostenabrechnung dem Mieter <strong>spätestens zwölf Monate nach Ende des Abrechnungszeitraums</strong> zugehen. Bei einem Abrechnungszeitraum vom 1. Januar bis 31. Dezember 2025 muss die Abrechnung also spätestens am 31. Dezember 2026 beim Mieter angekommen sein.
        </P>
        <Box title="Wichtig">
          Verpasst der Vermieter diese Frist, verfällt der Anspruch auf eine Nachzahlung vollständig — es sei denn, der Vermieter hat die Verspätung nachweislich nicht zu vertreten (z. B. weil die Grundsteuerbescheide der Gemeinde verspätet eintrafen). Guthaben des Mieters bleiben davon unberührt und müssen auch nach Fristablauf ausgezahlt werden.
        </Box>
      </section>

      <section>
        <H2>Nachzahlung, Guthaben und Vorauszahlungsanpassung</H2>
        <P>
          Ergibt die Abrechnung eine <strong>Nachzahlung</strong>, ist diese in der Regel binnen 30 Tagen nach Zugang der Abrechnung fällig. Ergibt sich ein <strong>Guthaben</strong> für den Mieter, muss es zeitnah erstattet werden. In beiden Fällen kann der Vermieter die monatlichen Nebenkostenvorauszahlungen für die Zukunft anpassen — bei signifikanten Abweichungen zwischen Vorauszahlung und tatsächlichen Kosten ist das sogar sinnvoll, um künftige Nachzahlungen (und das damit verbundene Liquiditätsrisiko) zu vermeiden.
        </P>
      </section>

      <section>
        <H2>Häufige Fehler in der Praxis</H2>
        <H3>Vorjahreswerte unreflektiert übernehmen</H3>
        <P>
          Energiepreise und kommunale Gebühren schwanken. Wer die Vorauszahlungen nicht regelmäßig an die tatsächlichen Kosten anpasst, produziert entweder große Nachzahlungen (schlecht fürs Verhältnis zum Mieter) oder zu hohe Vorauszahlungen (rechtlich unproblematisch, aber unnötig).
        </P>
        <H3>Leerstandskosten falsch umgelegt</H3>
        <P>
          Verbrauchsunabhängige Kosten (z. B. Grundsteuer, Versicherung) werden anteilig auch auf leerstehende Einheiten berechnet — dieser Anteil verbleibt beim Vermieter und darf nicht auf die übrigen Mieter verteilt werden.
        </P>
        <H3>Belege nicht vollständig vorhalten</H3>
        <P>
          Mieter haben ein Recht auf Einsicht in die Abrechnungsbelege. Wer Rechnungen nicht geordnet über das Jahr sammelt, gerät bei Rückfragen schnell in Erklärungsnot — und riskiert im Streitfall eine für unwirksam erklärte Abrechnung.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Eine korrekte Nebenkostenabrechnung ist Pflicht und direkter Cashflow-Hebel zugleich: Nur was sauber, fristgerecht und mit dem richtigen Umlageschlüssel abgerechnet wird, kommt auch tatsächlich beim Vermieter an. Wer die Fristen und den Betriebskostenkatalog kennt, vermeidet die häufigsten — und teuersten — Fehler.
        </P>
        <P>
          renditly trackt Nebenkostenabrechnungen pro Immobilie inklusive Nachzahlung/Erstattung und Ratenzahlungsoptionen — <a href="/app" className="text-indigo-600 font-semibold hover:underline">jetzt kostenlos testen</a>.
        </P>
      </section>
    </ArticleLayout>
  );
}
