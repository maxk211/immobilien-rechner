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

export default function EigenbedarfskuendigungGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Kündigung wegen Eigenbedarf: Voraussetzungen, Fristen, Risiken"
      untertitel="Eigenbedarf ist der häufigste Kündigungsgrund im Mietrecht — aber auch einer der fehleranfälligsten. Was rechtlich zwingend hineingehört, welche Fristen gelten und welche Sperrfristen bei umgewandelten Eigentumswohnungen greifen."
      lesezeit="7"
      related={[
        { href: '/ratgeber/mietspiegel-verstehen', titel: 'Mietspiegel verstehen und für Mieterhöhungen nutzen' },
        { href: '/ratgeber/mieterhoehung-modernisierung', titel: 'Mieterhöhung nach Modernisierung' },
        { href: '/ratgeber/nebenkostenabrechnung-vermieter', titel: 'Nebenkostenabrechnung für Vermieter' },
      ]}
    >
      <section>
        <H2>Was bedeutet Eigenbedarf rechtlich?</H2>
        <P>
          Nach § 573 Abs. 2 Nr. 2 BGB darf ein Vermieter kündigen, wenn er die Wohnung <strong>für sich selbst, einen Familienangehörigen oder einen Angehörigen seines Haushalts</strong> als Wohnraum benötigt. Der Bedarf muss ernsthaft, konkret und nachvollziehbar sein — eine vage Absicht ("könnte irgendwann nützlich sein") reicht nicht aus. Zulässige Bedarfspersonen sind neben dem Vermieter selbst u. a. Kinder, Enkel, Eltern, Geschwister sowie in bestimmten Fällen auch Nichten, Neffen oder Haushaltsangehörige wie eine Pflegekraft.
        </P>
      </section>

      <section>
        <H2>Formale Anforderungen an das Kündigungsschreiben</H2>
        <P>
          Die Kündigung muss schriftlich erfolgen und konkret begründet werden — pauschale Formulierungen genügen nicht.
        </P>
        <Box title="Muss im Kündigungsschreiben stehen">
          <div className="space-y-2">
            <div><strong>Name und Verwandtschaftsverhältnis</strong> der Bedarfsperson</div>
            <div><strong>Konkreter Grund</strong>, warum genau diese Wohnung benötigt wird (nicht nur "möchte näher wohnen")</div>
            <div><strong>Hinweis auf das Widerspruchsrecht</strong> des Mieters nach §§ 574 ff. BGB</div>
            <div><strong>Korrekte Kündigungsfrist</strong> unter Angabe des Kündigungstermins</div>
          </div>
        </Box>
        <P>
          Fehlt die Begründung oder bleibt sie zu unbestimmt, ist die Kündigung formal unwirksam — unabhängig davon, ob der Eigenbedarf inhaltlich berechtigt wäre.
        </P>
      </section>

      <section>
        <H2>Kündigungsfristen nach Mietdauer</H2>
        <Box title="Gesetzliche Kündigungsfristen (§ 573c BGB)">
          <div className="space-y-2">
            <div><strong>Bis 5 Jahre Mietdauer:</strong> 3 Monate</div>
            <div><strong>5 bis 8 Jahre Mietdauer:</strong> 6 Monate</div>
            <div><strong>Über 8 Jahre Mietdauer:</strong> 9 Monate</div>
          </div>
        </Box>
        <P>
          Maßgeblich ist die Dauer des Mietverhältnisses zum Zeitpunkt des Zugangs der Kündigung. Die Kündigung muss zudem spätestens am dritten Werktag eines Kalendermonats zugehen, damit die Frist zum übernächsten Monatsende zu laufen beginnt.
        </P>
      </section>

      <section>
        <H2>Sperrfrist bei umgewandelten Eigentumswohnungen</H2>
        <P>
          Wird eine vermietete Wohnung in Eigentumswohnungen umgewandelt und anschließend verkauft, kann sich der neue Eigentümer nicht sofort auf Eigenbedarf berufen. Nach § 577a BGB gilt eine <strong>Sperrfrist von drei Jahren</strong> ab Eintragung des neuen Eigentümers ins Grundbuch. In Gebieten mit angespanntem Wohnungsmarkt können die Bundesländer diese Frist per Verordnung auf bis zu <strong>zehn Jahre</strong> verlängern — das betrifft insbesondere gefragte Großstädte.
        </P>
        <Box title="Wichtig">
          Die Sperrfrist beginnt mit dem ersten Verkauf nach der Umwandlung, nicht erst bei einem späteren Eigentümerwechsel. Ein Verstoß macht die Eigenbedarfskündigung unwirksam.
        </Box>
      </section>

      <section>
        <H2>Das Widerspruchsrecht des Mieters (Sozialklausel)</H2>
        <P>
          Mieter können der Kündigung nach § 574 BGB widersprechen, wenn die Beendigung des Mietverhältnisses für sie, ihre Familie oder einen Angehörigen des Haushalts eine <strong>nicht zu rechtfertigende Härte</strong> bedeuten würde — etwa bei hohem Alter, schwerer Krankheit, Schwangerschaft oder fehlendem angemessenem Ersatzwohnraum zu zumutbaren Bedingungen. Der Widerspruch muss spätestens zwei Monate vor Beendigung des Mietverhältnisses schriftlich erklärt werden. Kommt keine Einigung zustande, entscheidet im Streitfall das Gericht über eine Fortsetzung des Mietverhältnisses, ggf. auf Zeit.
        </P>
      </section>

      <section>
        <H2>Vorgetäuschter Eigenbedarf: Erhebliches Risiko für Vermieter</H2>
        <P>
          Zieht die Bedarfsperson nach Auszug des Mieters nicht oder nicht dauerhaft in die Wohnung ein, spricht viel für einen <strong>vorgetäuschten Eigenbedarf</strong> — mit erheblichen rechtlichen Konsequenzen. Der ehemalige Mieter kann Schadensersatz verlangen, der sämtliche Umzugskosten, die Differenz zur neuen (meist höheren) Miete über einen längeren Zeitraum sowie Maklerkosten umfassen kann. In der Praxis werden hier schnell fünfstellige Summen erreicht. Wer nicht sicher ist, ob der Bedarf tatsächlich dauerhaft besteht, sollte von einer Eigenbedarfskündigung absehen oder rechtlichen Rat einholen.
        </P>
      </section>

      <section>
        <H2>Alternative: Kündigung bei Hinderung angemessener wirtschaftlicher Verwertung</H2>
        <P>
          Neben dem Eigenbedarf erlaubt § 573 Abs. 2 Nr. 3 BGB eine Kündigung, wenn der Vermieter durch die Fortsetzung des Mietverhältnisses an einer angemessenen wirtschaftlichen Verwertung des Grundstücks gehindert wird und dadurch erhebliche Nachteile erleidet — etwa bei geplantem Abriss und Neubau. Die Anforderungen an diesen Kündigungsgrund sind in der Rechtsprechung noch strenger als beim klassischen Eigenbedarf und in der Praxis deutlich seltener erfolgreich.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Eine Eigenbedarfskündigung ist rechtlich zulässig, aber formal streng geregelt: konkrete Begründung, korrekte Frist, Beachtung der Sperrfrist bei umgewandelten Eigentumswohnungen und das Bewusstsein für das Härterisiko beim Mieter. Wer den Bedarf nicht zweifelsfrei belegen kann oder unsicher ist, ob die Bedarfsperson tatsächlich einzieht, geht ein erhebliches finanzielles Risiko ein.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle Rechtsberatung. Bitte lass eine geplante Eigenbedarfskündigung im Zweifel von einem Fachanwalt für Mietrecht prüfen.
        </P>
      </section>
    </ArticleLayout>
  );
}
