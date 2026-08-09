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

export default function ErbschaftsteuerImmobilieGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Erbschaftsteuer und Schenkungsteuer bei Immobilien"
      untertitel="Freibeträge zwischen 20.000 € und 500.000 €, die Bewertung vermieteter Immobilien mit 10 % Abschlag und die Steuerbefreiung fürs Familienheim — was beim Vererben oder Verschenken einer Immobilie steuerlich zu beachten ist."
      lesezeit="7"
      related={[
        { href: '/ratgeber/spekulationssteuer-immobilienverkauf', titel: 'Spekulationssteuer bei Immobilienverkauf' },
        { href: '/ratgeber/afa-und-steuern-vermietung', titel: 'AfA und Steuern bei Vermietung: Der Leitfaden' },
        { href: '/ratgeber/grunderwerbsteuer-bundeslaender', titel: 'Grunderwerbsteuer nach Bundesland' },
      ]}
    >
      <section>
        <H2>Erbschaftsteuer und Schenkungsteuer: Dieselben Regeln, unterschiedlicher Anlass</H2>
        <P>
          Erbschaftsteuer und Schenkungsteuer folgen im Wesentlichen denselben Regeln — Freibeträge, Steuerklassen und Steuersätze sind identisch, nur der Anlass unterscheidet sich (Erbfall vs. Übertragung zu Lebzeiten). Bei einer Immobilie ist vor allem die <strong>Bewertung</strong> entscheidend, da sie unmittelbar die Höhe des steuerpflichtigen Vermögens bestimmt.
        </P>
      </section>

      <section>
        <H2>Persönliche Freibeträge nach Verwandtschaftsgrad</H2>
        <Box title="Freibeträge nach § 16 ErbStG">
          <div className="space-y-2">
            <div><strong>Ehepartner / eingetragene Lebenspartner:</strong> 500.000 €</div>
            <div><strong>Kinder (je Elternteil):</strong> 400.000 €</div>
            <div><strong>Enkel:</strong> 200.000 €</div>
            <div><strong>Eltern und Großeltern (bei Erbschaft):</strong> 100.000 €</div>
            <div><strong>Alle übrigen Personen (Steuerklasse II/III, z. B. Geschwister, Nichten, Neffen, nicht verwandte Dritte):</strong> 20.000 €</div>
          </div>
        </Box>
        <P>
          Diese Freibeträge gelten <strong>pro Person und pro Schenker bzw. Erblasser</strong> und leben alle zehn Jahre neu auf — wer frühzeitig plant, kann durch gestaffelte Schenkungen im 10-Jahres-Rhythmus einen erheblichen Teil einer Immobilie steuerfrei übertragen.
        </P>
        <P>
          Zusätzlich zum allgemeinen Freibetrag steht Ehepartnern nach § 17 ErbStG ein besonderer Versorgungsfreibetrag von bis zu 256.000 € zu, der allerdings um Versorgungsbezüge wie eine Witwenrente gekürzt wird.
        </P>
      </section>

      <section>
        <H2>Steuerklassen und Steuersätze</H2>
        <P>
          Der anwendbare Steuersatz hängt vom Verwandtschaftsgrad (Steuerklasse I, II oder III) und der Höhe des steuerpflichtigen Erwerbs nach Abzug des Freibetrags ab. Er ist progressiv gestaffelt und reicht von 7 % bei nahen Angehörigen und kleinen Beträgen bis zu 50 % bei entfernten oder familienfremden Personen und hohen Beträgen.
        </P>
        <Box title="Beispielrechnung">
          Ein Kind erbt eine vermietete Immobilie im Steuerwert von 550.000 € ohne weiteres relevantes Vermögen. Nach Abzug des Freibetrags von 400.000 € verbleiben 150.000 € steuerpflichtiges Vermögen. In Steuerklasse I entspricht das einem Steuersatz von 11 % — die Erbschaftsteuer beträgt damit 16.500 €.
        </Box>
      </section>

      <section>
        <H2>Wie wird eine Immobilie für die Erbschaftsteuer bewertet?</H2>
        <P>
          Das Finanzamt setzt nicht automatisch den Verkehrswert an, sondern ermittelt den Wert nach dem <strong>Bedarfswertverfahren</strong> gemäß Bewertungsgesetz. Je nach Immobilientyp kommt das Vergleichswertverfahren (v. a. Eigentumswohnungen und Einfamilienhäuser mit ausreichend Vergleichsdaten), das Ertragswertverfahren (v. a. vermietete Mehrfamilienhäuser) oder das Sachwertverfahren (Sonderfälle ohne Vergleichswerte) zur Anwendung.
        </P>
        <Box title="Bewertungsabschlag für vermietete Immobilien">
          Für <strong>zu Wohnzwecken vermietete</strong> bebaute Grundstücke gewährt § 13d ErbStG einen pauschalen Abschlag von <strong>10 %</strong> auf den ermittelten Steuerwert — unabhängig vom gewählten Bewertungsverfahren. Das reduziert die Bemessungsgrundlage und damit die Steuerlast direkt.
        </Box>
      </section>

      <section>
        <H2>Steuerbefreiung für das selbst genutzte Familienheim</H2>
        <P>
          Erbt der Ehepartner eine selbst genutzte Immobilie (Familienheim) und nutzt sie unverzüglich mindestens zehn weitere Jahre selbst zu Wohnzwecken, bleibt der Erwerb <strong>vollständig steuerfrei</strong> — unabhängig vom Wert der Immobilie. Für Kinder gilt dieselbe Befreiung, allerdings begrenzt auf eine Wohnfläche von <strong>200 m²</strong>; darüber hinausgehende Flächen werden anteilig versteuert. Wird die Selbstnutzung innerhalb der Zehnjahresfrist aus anderen als zwingenden Gründen (z. B. Pflegebedürftigkeit) aufgegeben, entfällt die Steuerbefreiung rückwirkend.
        </P>
      </section>

      <section>
        <H2>Schenkung zu Lebzeiten: Vorteile gegenüber dem Erbfall</H2>
        <P>
          Eine frühzeitige Schenkung erlaubt es, die Freibeträge <strong>mehrfach im 10-Jahres-Rhythmus</strong> zu nutzen — bei größerem Immobilienvermögen lässt sich dadurch über zwei oder drei Schenkungszeitpunkte hinweg ein deutlich größerer Teil steuerfrei übertragen als bei einer einmaligen Vererbung. Zusätzlich kann bei Schenkungen ein lebenslanges Nießbrauchrecht oder Wohnrecht für den Schenker vereinbart werden, das den steuerlichen Wert der Schenkung weiter mindert, da es kapitalisiert vom Steuerwert abgezogen wird.
        </P>
      </section>

      <section>
        <H2>Häufige Fehler bei der Nachlassplanung mit Immobilien</H2>
        <H3>Freibeträge nicht rechtzeitig genutzt</H3>
        <P>
          Wer erst im Erbfall überträgt, verschenkt die Möglichkeit, Freibeträge über mehrere 10-Jahres-Zyklen mehrfach auszuschöpfen.
        </P>
        <H3>Bewertungsverfahren nicht geprüft</H3>
        <P>
          Das vom Finanzamt automatisch angewandte Bewertungsverfahren führt nicht immer zum niedrigsten zulässigen Wert. Erben oder Beschenkte haben das Recht, einen niedrigeren tatsächlichen Verkehrswert per Gutachten nachzuweisen (§ 198 BewG) — das lohnt sich, wenn der pauschal ermittelte Bedarfswert über dem realistischen Marktwert liegt.
        </P>
        <H3>Zehnjahresfrist beim Familienheim übersehen</H3>
        <P>
          Ein zu früher Auszug aus dem geerbten Familienheim (ohne zwingenden Grund) innerhalb von zehn Jahren lässt die Steuerbefreiung rückwirkend entfallen.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Bei Immobilienvermögen entscheidet häufig nicht die Höhe der Erbschaft, sondern die <strong>Planung</strong> über die tatsächliche Steuerlast: rechtzeitige Schenkungen im 10-Jahres-Rhythmus, die korrekte Bewertung inklusive des 10-%-Abschlags für vermietete Objekte und die gezielte Nutzung der Familienheim-Befreiung können die Steuerlast erheblich senken.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle steuerliche oder rechtliche Beratung. Bitte lass deine konkrete Nachlass- oder Schenkungsplanung von einem Steuerberater oder Notar prüfen.
        </P>
      </section>
    </ArticleLayout>
  );
}
