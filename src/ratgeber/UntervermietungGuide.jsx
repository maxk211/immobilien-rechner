import ArticleLayout from './ArticleLayout';

const H2 = ({ children }) => <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-3">{children}</h2>;
const P = ({ children }) => <p className="text-slate-600 leading-relaxed">{children}</p>;
const Box = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 my-4">
    {title && <div className="font-bold text-slate-900 mb-2">{title}</div>}
    <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
  </div>
);

export default function UntervermietungGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Untervermietung erlauben oder verbieten: Was Vermieter wissen müssen"
      untertitel="Mieter haben unter bestimmten Voraussetzungen einen gesetzlichen Anspruch auf Erlaubnis zur Untervermietung. Wann Vermieter ablehnen dürfen, wann ein Zuschlag zulässig ist — und was bei unerlaubter Untervermietung droht."
      lesezeit="6"
      related={[
        { href: '/ratgeber/eigenbedarfskuendigung', titel: 'Kündigung wegen Eigenbedarf' },
        { href: '/ratgeber/mietspiegel-verstehen', titel: 'Mietspiegel verstehen und für Mieterhöhungen nutzen' },
        { href: '/ratgeber/mieterhoehung-modernisierung', titel: 'Mieterhöhung nach Modernisierung' },
      ]}
    >
      <section>
        <H2>Grundsatz: Erlaubnispflicht des Vermieters</H2>
        <P>
          Will ein Mieter einen Teil seiner Wohnung an einen Dritten untervermieten, braucht er dafür grundsätzlich die <strong>Erlaubnis des Vermieters</strong>. Untervermietet er ohne Erlaubnis, kann der Vermieter abmahnen und im Wiederholungsfall sogar fristlos kündigen. Der Mieter hat aber unter bestimmten Voraussetzungen einen gesetzlichen Anspruch darauf, dass der Vermieter die Erlaubnis erteilen muss.
        </P>
      </section>

      <section>
        <H2>Wann besteht ein Anspruch auf Erlaubnis?</H2>
        <P>
          Nach § 553 BGB muss der Vermieter die Erlaubnis erteilen, wenn der Mieter ein <strong>berechtigtes Interesse</strong> an der Untervermietung hat, das nach Abschluss des Mietvertrags entstanden ist. Ein berechtigtes Interesse liegt vor, wenn der Mieter vernünftige und nachvollziehbare wirtschaftliche oder persönliche Gründe anführen kann.
        </P>
        <Box title="Typische berechtigte Interessen">
          <div className="space-y-2">
            <div>Finanzielle Entlastung, z. B. nach Einkommensverlust oder gestiegenen Lebenshaltungskosten</div>
            <div>Der Lebenspartner oder eine nahestehende Person zieht ein</div>
            <div>Längere berufliche oder private Abwesenheit (Auslandsaufenthalt, Pflege von Angehörigen)</div>
          </div>
        </Box>
      </section>

      <section>
        <H2>Wann darf der Vermieter ablehnen?</H2>
        <P>
          Das Erlaubnisrecht des Mieters ist kein Freifahrtschein. Der Vermieter darf die Zustimmung verweigern, wenn in der Person des Untermieters ein wichtiger Grund liegt, wenn die Wohnung durch die Untervermietung übermäßig belegt würde, oder wenn ihm die Untervermietung aus sonstigen Gründen nicht zuzumuten ist. Bei möblierten Einzelzimmern innerhalb der vom Vermieter selbst bewohnten Wohnung gilt zudem eine Sonderregelung — hier besteht kein Anspruch auf Erlaubnis.
        </P>
      </section>

      <section>
        <H2>Der Untermietzuschlag: Nur die Ausnahme</H2>
        <P>
          Ein Untermietzuschlag ist gesetzlich nur als Ausnahmefall vorgesehen — nämlich dann, wenn dem Vermieter die Untervermietung nur bei einer Erhöhung der Miete zuzumuten wäre (§ 553 Abs. 2 BGB). Eine feste gesetzliche Obergrenze für die Höhe des Zuschlags gibt es nicht. In der Praxis wird ein Zuschlag jedoch häufig pauschal verlangt, ohne dass die besonderen Voraussetzungen tatsächlich vorliegen — hier trägt der Vermieter die Darlegungs- und Beweislast.
        </P>
      </section>

      <section>
        <H2>Sonderfall: Kurzzeitvermietung über Airbnb & Co.</H2>
        <P>
          Die tageweise Untervermietung über Plattformen wie Airbnb wird von Gerichten strenger beurteilt als die klassische Untervermietung an eine bekannte Person. Ein berechtigtes Interesse im Sinne des § 553 BGB ist bei rein gewerblich anmutender Kurzzeitvermietung oft fraglich, insbesondere wenn sie regelmäßig und mit Gewinnerzielungsabsicht erfolgt. Vermieter sollten hier besonders genau prüfen und sich im Zweifel eine ausdrückliche, auf den Einzelfall bezogene Zustimmung vorbehalten.
        </P>
      </section>

      <section>
        <H2>Praxistipps für Vermieter</H2>
        <Box title="So bleibt es sauber">
          <div className="space-y-2">
            <div>Erlaubnis immer schriftlich erteilen — mit Namen des Untermieters und ggf. Befristung</div>
            <div>Identität und grundlegende Zuverlässigkeit des Untermieters erfragen</div>
            <div>Bei Kurzzeitvermietungen ausdrücklich regeln, ob und in welchem Umfang diese erlaubt ist</div>
            <div>Unerlaubte Untervermietung nicht stillschweigend dulden — sonst wird sie unter Umständen konkludent genehmigt</div>
          </div>
        </Box>
      </section>

      <section>
        <H2>Risiken bei unerlaubter Untervermietung</H2>
        <P>
          Vermietet der Mieter ohne Erlaubnis unter, kann der Vermieter zunächst abmahnen und die Beendigung der Untervermietung verlangen. Setzt sich der Mieter darüber hinweg, ist eine fristlose Kündigung des Hauptmietverhältnisses möglich. Umgekehrt gilt: Verweigert der Vermieter die Erlaubnis unberechtigt, kann der Mieter unter bestimmten Voraussetzungen sogar außerordentlich kündigen.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Untervermietung ist kein reines Vermieter-Verbotsrecht, sondern ein austariertes System aus Mieteranspruch und begrenzten Ablehnungsgründen. Wer als Vermieter Anfragen sachlich prüft, Erlaubnisse dokumentiert und bei Kurzzeitvermietungen genau hinschaut, vermeidet die meisten Streitfälle.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle Rechtsberatung.
        </P>
      </section>
    </ArticleLayout>
  );
}
