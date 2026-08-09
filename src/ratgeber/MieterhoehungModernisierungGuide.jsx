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

export default function MieterhoehungModernisierungGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Mieterhöhung nach Modernisierung: § 559 BGB einfach erklärt"
      untertitel="8 % der Modernisierungskosten dürfen jährlich auf die Miete umgelegt werden — begrenzt durch eine Kappungsgrenze von 3 €/m² in sechs Jahren. Formel, Fristen und Fehler, die die Umlage unwirksam machen."
      lesezeit="7"
      related={[
        { href: '/ratgeber/mietspiegel-verstehen', titel: 'Mietspiegel verstehen und für Mieterhöhungen nutzen' },
        { href: '/ratgeber/nebenkostenabrechnung-vermieter', titel: 'Nebenkostenabrechnung für Vermieter' },
        { href: '/mietrendite-rechner', titel: 'Mietrendite-Rechner', kategorie: 'Rechner' },
      ]}
    >
      <section>
        <H2>Modernisierung vs. Instandhaltung: Der entscheidende Unterschied</H2>
        <P>
          Nur <strong>Modernisierungsmaßnahmen</strong> berechtigen zur Mieterhöhung nach § 559 BGB — nicht jede Baumaßnahme zählt dazu. Eine Modernisierung verbessert den Gebrauchswert der Wohnung nachhaltig, spart Energie oder Wasser ein, oder passt die Wohnung dauerhaft an veränderte Wohnverhältnisse an (z. B. altersgerechter Umbau). Reine <strong>Instandhaltung</strong> — der Ersatz einer defekten, aber technisch gleichwertigen Heizung etwa — stellt lediglich den ursprünglichen Zustand wieder her und berechtigt nicht zur Umlage.
        </P>
        <P>
          In der Praxis sind Maßnahmen oft eine Mischung aus beidem (Erhaltung + Modernisierung). In diesem Fall darf nur der modernisierende Mehraufwand umgelegt werden — der reine Erhaltungsanteil muss vom Vermieter selbst getragen werden und aus der Kostenaufstellung herausgerechnet werden.
        </P>
      </section>

      <section>
        <H2>Die 8-%-Umlage: So wird die neue Miete berechnet</H2>
        <Box title="Formel Modernisierungsumlage">
          Jährliche Mieterhöhung = 8 % der aufgewendeten Modernisierungskosten (abzüglich Instandhaltungsanteil und ggf. Fördermittel)
        </Box>
        <P>
          <strong>Beispiel:</strong> Eine energetische Fassadensanierung kostet 40.000 € für ein Haus mit vier gleich großen Wohnungen. Pro Wohnung entfallen 10.000 € Modernisierungskosten. 8 % davon sind 800 € pro Jahr — das entspricht einer Mieterhöhung von 66,67 € im Monat für diese eine Wohnung.
        </P>
        <P>
          Erhaltene Fördermittel (z. B. KfW-Zuschüsse) müssen von den umlagefähigen Kosten abgezogen werden — der Vermieter darf nicht doppelt profitieren, weder von der staatlichen Förderung noch von der vollen Mieterhöhung auf denselben Betrag.
        </P>
      </section>

      <section>
        <H2>Die Kappungsgrenze: Deckel für die Mieterhöhung</H2>
        <Box title="Kappungsgrenze nach § 559 Abs. 3a BGB">
          Die Miete darf durch Modernisierung innerhalb von sechs Jahren um maximal <strong>3 €/m² Wohnfläche</strong> steigen. Lag die Miete vor der Modernisierung unter 7 €/m², gilt eine abgesenkte Kappungsgrenze von <strong>2 €/m²</strong> innerhalb von sechs Jahren.
        </Box>
        <P>
          Diese Grenze gilt zusätzlich zur 8-%-Regel und unabhängig von ihr — es zählt der jeweils niedrigere Wert. Läge die rechnerische Umlage nach der 8-%-Formel höher als die Kappungsgrenze zulässt, ist der übersteigende Teil <strong>dauerhaft ausgeschlossen</strong>. Er kann auch nach Ablauf der sechs Jahre nicht nachträglich geltend gemacht werden.
        </P>
      </section>

      <section>
        <H2>Ankündigungsfrist und Formvorschriften</H2>
        <P>
          Eine Modernisierung muss dem Mieter grundsätzlich <strong>spätestens drei Monate vor Beginn</strong> in Textform angekündigt werden (§ 555c BGB). Die Ankündigung muss Art, Umfang und voraussichtlichen Beginn sowie voraussichtliche Dauer der Maßnahme enthalten, außerdem eine Erläuterung der zu erwartenden Mieterhöhung und der künftigen Betriebskosten (z. B. bei energetischen Maßnahmen).
        </P>
        <Box title="Wichtig">
          Fehlt die ordnungsgemäße Ankündigung oder wird sie zu kurzfristig verschickt, verschiebt sich die Mieterhöhung um die Zeit der Verzögerung — im schlimmsten Fall ist die Umlage für die betroffene Maßnahme formal angreifbar.
        </Box>
      </section>

      <section>
        <H2>Das Härteeinwand-Recht des Mieters</H2>
        <P>
          Mieter können der Modernisierung unter bestimmten Voraussetzungen widersprechen (§ 555d BGB) — etwa bei hohem Alter, Krankheit, Schwangerschaft oder einer finanziellen Härte durch die zu erwartende Mieterhöhung. Der Härteeinwand muss dem Vermieter spätestens bis zum Ablauf des Monats vor Beginn der Maßnahme mitgeteilt werden. Bei energetischen Modernisierungen zur Einsparung von Endenergie ist der Härteeinwand gegen die Durchführung selbst allerdings ausgeschlossen — er wirkt hier nur gegenüber der Mieterhöhung.
        </P>
      </section>

      <section>
        <H2>Modernisierungsumlage vs. Mieterhöhung nach Mietspiegel</H2>
        <P>
          Beide Wege führen zu höherer Miete, funktionieren aber grundverschieden: Die Mieterhöhung nach <a href="/ratgeber/mietspiegel-verstehen" className="text-indigo-600 font-semibold hover:underline">Mietspiegel (§ 558 BGB)</a> passt die Bestandsmiete an die bereits am Markt übliche Vergleichsmiete an. Die Modernisierungsumlage nach § 559 BGB erlaubt dagegen eine Erhöhung <strong>über</strong> die ortsübliche Vergleichsmiete hinaus, weil der Vermieter durch die Investition tatsächlich einen höheren Wohnwert geschaffen hat. Beide Mechanismen können nacheinander, aber nicht auf denselben Betrag doppelt angewendet werden.
        </P>
      </section>

      <section>
        <H2>Häufige Fehler bei der Modernisierungsumlage</H2>
        <H3>Instandhaltungsanteil nicht herausgerechnet</H3>
        <P>
          Wird beispielsweise eine alte Heizung durch eine neue, effizientere ersetzt, ist ein Teil der Kosten ohnehin für den reinen Austausch angefallen (Instandhaltung) — nur der Mehraufwand für die höhere Effizienz ist umlagefähig. Wird das nicht sauber getrennt, kann die gesamte Umlage angreifbar sein.
        </P>
        <H3>Kappungsgrenze bei mehreren Maßnahmen übersehen</H3>
        <P>
          Werden innerhalb von sechs Jahren mehrere Modernisierungen durchgeführt, addieren sich deren Mieterhöhungen — die 3-€/m²-Grenze gilt für die Summe aller Maßnahmen in diesem Zeitraum, nicht für jede Maßnahme einzeln.
        </P>
        <H3>Fördermittel nicht abgezogen</H3>
        <P>
          Wer KfW-Zuschüsse oder andere Förderungen erhält, muss diese von den umlagefähigen Kosten abziehen — sonst ist die Umlage in Höhe des geförderten Anteils unwirksam.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Die Modernisierungsumlage ist ein mächtiges Instrument, um Investitionen in die Wohnqualität und Energieeffizienz über die Miete zu refinanzieren — aber nur bei sauberer Trennung von Instandhaltung und Modernisierung, korrekter Ankündigung und Einhaltung der Kappungsgrenze rechtssicher durchsetzbar.
        </P>
        <P>
          renditly trackt Modernisierungsmaßnahmen und die daraus resultierenden Mieterhöhungen pro Immobilie — <a href="/app" className="text-indigo-600 font-semibold hover:underline">jetzt kostenlos testen</a>.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle Rechtsberatung. Bitte lass deine konkrete Situation im Zweifel von einem Fachanwalt für Mietrecht prüfen.
        </P>
      </section>
    </ArticleLayout>
  );
}
