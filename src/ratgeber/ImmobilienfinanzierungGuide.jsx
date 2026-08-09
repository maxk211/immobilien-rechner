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

export default function ImmobilienfinanzierungGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Immobilienfinanzierung für Kapitalanleger: Die Grundlagen"
      untertitel="Eigenkapitalquote, Zinsbindung, Tilgungssatz und Beleihungsauslauf entscheiden über Cashflow und Risiko einer Anlageimmobilie mehr als der Kaufpreis selbst — die wichtigsten Stellschrauben im Überblick."
      lesezeit="8"
      related={[
        { href: '/ratgeber/cashflow-bei-immobilien', titel: 'Cashflow bei Immobilien: Was Vermieter wissen müssen' },
        { href: '/ratgeber/mietrendite-berechnen', titel: 'Mietrendite berechnen: Der komplette Guide' },
        { href: '/mietrendite-rechner', titel: 'Mietrendite-Rechner', kategorie: 'Rechner' },
      ]}
    >
      <section>
        <H2>Warum die Finanzierung die Rendite stärker beeinflusst als der Kaufpreis</H2>
        <P>
          Zwei identische Immobilien mit demselben Kaufpreis und derselben Miete können völlig unterschiedliche Cashflows und Eigenkapitalrenditen liefern — abhängig davon, wie sie finanziert sind. Eigenkapitalquote, Zinssatz, Zinsbindung und Tilgungssatz sind deshalb für Kapitalanleger mindestens so wichtig wie die Objektauswahl selbst.
        </P>
      </section>

      <section>
        <H2>Eigenkapitalquote: Wie viel Eigenkapital ist sinnvoll?</H2>
        <P>
          Banken verlangen bei Kapitalanlage-Immobilien in der Regel eine höhere Eigenkapitalquote als bei selbst genutztem Wohneigentum — üblich sind <strong>20 bis 30 % des Kaufpreises</strong> zuzüglich der vollständigen Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler), die meist nicht mitfinanziert werden. Eine <strong>Vollfinanzierung</strong> (100 % oder mehr des Kaufpreises als Kredit) ist möglich, aber mit spürbaren Zinsaufschlägen und strengeren Bonitätsanforderungen verbunden — sie erhöht zugleich den Leverage-Effekt und damit sowohl Renditechance als auch Risiko.
        </P>
      </section>

      <section>
        <H2>Zinsbindung: Wie lange sollte der Zins fest sein?</H2>
        <P>
          Die Zinsbindung legt fest, für wie viele Jahre der vereinbarte Zinssatz garantiert gilt. Übliche Laufzeiten sind 5, 10, 15 oder 20 Jahre.
        </P>
        <Box>
          <div className="space-y-2">
            <div><strong>Kurze Zinsbindung (5 Jahre):</strong> niedrigerer Zinssatz, aber Zinsänderungsrisiko bei der Anschlussfinanzierung</div>
            <div><strong>Lange Zinsbindung (15–20 Jahre):</strong> höherer Zinssatz, aber volle Planungssicherheit über die gesamte übliche Haltedauer</div>
            <div><strong>10 Jahre</strong> gilt als üblicher Mittelweg für Kapitalanlage-Immobilien in Deutschland</div>
          </div>
        </Box>
        <P className="text-xs text-slate-400">
          Zur Einordnung: Im August 2026 liegen die Bauzinsen für eine 10-jährige Zinsbindung je nach Bonität, Beleihungsauslauf und Anbieter grob zwischen 3,6 % und 4,1 % effektiv — Zinssätze schwanken laufend und sollten vor jeder Finanzierungsentscheidung aktuell verglichen werden.
        </P>
      </section>

      <section>
        <H2>Tilgungssatz: Direkter Hebel für den Cashflow</H2>
        <P>
          Der anfängliche Tilgungssatz bestimmt zusammen mit dem Zinssatz die monatliche Kreditrate. Ein niedrigerer Tilgungssatz (z. B. 1 % statt 3 %) senkt die Rate und verbessert den monatlichen <a href="/ratgeber/cashflow-bei-immobilien" className="text-indigo-600 font-semibold hover:underline">Cashflow</a> sofort — auf Kosten einer deutlich längeren Gesamtlaufzeit und höherer Zinskosten über die Kreditlaufzeit. Investoren, die auf laufenden Cashflow priorisieren, wählen häufig niedrigere Tilgungssätze; wer schneller entschulden und Vermögen aufbauen will, wählt höhere.
        </P>
        <Box title="Faustregel">
          Bei einer Zinsbindung von 10 Jahren sollte die Restschuld am Ende der Zinsbindung realistisch eingeschätzt werden — je niedriger die anfängliche Tilgung, desto höher das Zinsänderungsrisiko bei der Anschlussfinanzierung, weil ein größerer Kreditbetrag zum dann geltenden (unbekannten) Zinssatz weiterfinanziert werden muss.
        </Box>
      </section>

      <section>
        <H2>Beleihungsauslauf und Beleihungswert</H2>
        <P>
          Der <strong>Beleihungswert</strong> ist der von der Bank konservativ ermittelte Wert der Immobilie — er liegt häufig unter dem tatsächlichen Kaufpreis, da Banken Sicherheitsabschläge einkalkulieren. Der <strong>Beleihungsauslauf</strong> beschreibt den Kreditbetrag im Verhältnis zum Beleihungswert. Liegt der Beleihungsauslauf über 60 %, verlangen viele Banken einen Zinsaufschlag; über 80 % steigt dieser Aufschlag meist deutlich. Ein hoher Beleihungsauslauf verringert somit tendenziell die Rendite durch höhere Finanzierungskosten.
        </P>
      </section>

      <section>
        <H2>Bereitstellungszinsen und Forward-Darlehen</H2>
        <P>
          Wird ein Kredit nicht sofort vollständig abgerufen (z. B. bei Bauvorhaben oder gestaffelten Kaufpreiszahlungen), berechnen Banken nach einer meist kostenfreien Frist von 6 bis 12 Monaten <strong>Bereitstellungszinsen</strong> auf den noch nicht abgerufenen Kreditbetrag — üblich sind etwa 0,25 % pro Monat. Für die Anschlussfinanzierung nach Ablauf der Zinsbindung lässt sich mit einem <strong>Forward-Darlehen</strong> der aktuelle Zinssatz bereits bis zu 5 Jahre im Voraus sichern — gegen einen geringen Zinsaufschlag, der mit der Vorlaufzeit steigt. Das lohnt sich vor allem, wenn mit steigenden Zinsen gerechnet wird.
        </P>
      </section>

      <section>
        <H2>Sondertilgung und Flexibilität einplanen</H2>
        <P>
          Ein <strong>Sondertilgungsrecht</strong> (üblich sind 5 bis 10 % der Darlehenssumme pro Jahr kostenfrei) erlaubt es, bei Liquiditätsüberschuss die Restschuld zu senken, ohne die vertragliche Rate dauerhaft zu erhöhen. Wer plant, mehrere Immobilien nacheinander zu finanzieren, sollte dieses Recht nicht überbewerten — häufig ist es sinnvoller, freie Liquidität für das nächste Eigenkapital zurückzuhalten, statt sie in eine bereits laufende, günstig finanzierte Immobilie zu stecken.
        </P>
      </section>

      <section>
        <H2>Förderungen: KfW und regionale Programme</H2>
        <P>
          Für energieeffiziente Neubauten oder Sanierungen bietet die KfW zinsvergünstigte Darlehen und teilweise Tilgungszuschüsse an, an bestimmte energetische Standards (z. B. Effizienzhaus-Stufen) geknüpft. Diese Programme lassen sich häufig mit der klassischen Bankfinanzierung kombinieren und sollten vor Kreditabschluss aktiv geprüft werden — die Konditionen und Fördersätze ändern sich regelmäßig.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Bei der Immobilienfinanzierung entscheidet nicht nur der Zinssatz über die Rendite, sondern das Zusammenspiel aus Eigenkapitalquote, Zinsbindung, Tilgungssatz und Beleihungsauslauf. Wer diese Stellschrauben bewusst auf die eigene Strategie — Cashflow-Fokus oder schnelle Entschuldung — abstimmt, holt aus derselben Immobilie eine spürbar andere Rendite heraus als jemand, der nur auf den nominalen Zinssatz schaut.
        </P>
        <P>
          Mit dem <a href="/mietrendite-rechner" className="text-indigo-600 font-semibold hover:underline">kostenlosen Mietrendite-Rechner</a> lässt sich der Effekt von Eigenkapital, Zins und Tilgung auf Cashflow und Rendite direkt durchspielen.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle Finanzierungsberatung. Zinssätze und Förderkonditionen ändern sich laufend — bitte aktuelle Angebote vor einer Finanzierungsentscheidung vergleichen.
        </P>
      </section>
    </ArticleLayout>
  );
}
