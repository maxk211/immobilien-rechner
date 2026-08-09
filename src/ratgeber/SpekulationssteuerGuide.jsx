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

export default function SpekulationssteuerGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Spekulationssteuer bei Immobilienverkauf: Die 10-Jahres-Frist erklärt"
      untertitel="Wer eine vermietete Immobilie innerhalb von zehn Jahren nach dem Kauf verkauft, zahlt auf den Gewinn Einkommensteuer — mit Ausnahmen bei Eigennutzung und der korrekten Berechnung des Veräußerungsgewinns."
      lesezeit="6"
      related={[
        { href: '/ratgeber/afa-und-steuern-vermietung', titel: 'AfA und Steuern bei Vermietung: Der Leitfaden' },
        { href: '/ratgeber/erbschaftsteuer-immobilie', titel: 'Erbschaftsteuer und Schenkungsteuer bei Immobilien' },
        { href: '/afa-rechner', titel: 'AfA-Rechner', kategorie: 'Rechner' },
      ]}
    >
      <section>
        <H2>Was ist die Spekulationssteuer?</H2>
        <P>
          Die umgangssprachlich als <strong>Spekulationssteuer</strong> bezeichnete Steuer ist rechtlich gesehen keine eigene Steuerart, sondern die Besteuerung eines <strong>privaten Veräußerungsgeschäfts</strong> nach § 23 EStG. Verkauft ein Vermieter eine Immobilie mit Gewinn innerhalb bestimmter Fristen nach dem Kauf, muss dieser Gewinn als Einkommen versteuert werden — zusätzlich zu den laufenden Einkünften aus Vermietung und Verpachtung.
        </P>
      </section>

      <section>
        <H2>Die 10-Jahres-Frist</H2>
        <P>
          Bei vermieteten Immobilien beträgt die Spekulationsfrist <strong>zehn Jahre</strong>. Maßgeblich ist dabei nicht der Grundbucheintrag, sondern das Datum des <strong>notariellen Kaufvertrags</strong> — sowohl beim Ankauf als auch beim Verkauf. Wird die Immobilie erst nach Ablauf dieser zehn Jahre verkauft, ist der Gewinn vollständig steuerfrei, unabhängig von der Höhe.
        </P>
        <Box title="Beispiel">
          Kaufvertrag am 15. März 2016 unterschrieben, Verkauf frühestens ab dem 16. März 2026 steuerfrei möglich. Ein Verkauf am 10. März 2026 — nur wenige Tage früher — würde die Frist noch verpassen und den vollen Gewinn steuerpflichtig machen.
        </Box>
      </section>

      <section>
        <H2>Die Ausnahme: Eigennutzung</H2>
        <P>
          Unabhängig von der 10-Jahres-Frist bleibt der Verkauf steuerfrei, wenn die Immobilie
        </P>
        <Box>
          <div className="space-y-2">
            <div><strong>im Verkaufsjahr und den beiden vorangegangenen Kalenderjahren</strong> durchgehend zu eigenen Wohnzwecken genutzt wurde, oder</div>
            <div><strong>im gesamten Zeitraum zwischen Anschaffung und Veräußerung</strong> ausschließlich zu eigenen Wohnzwecken genutzt wurde.</div>
          </div>
        </Box>
        <P>
          Wichtig für Vermieter: Die "zwei vorangegangenen Kalenderjahre" müssen nicht volle Kalenderjahre sein — es reicht ein zusammenhängender Nutzungszeitraum, der sich über drei Kalenderjahre erstreckt (z. B. Dezember Jahr 1 bis Januar Jahr 3). Diese Ausnahme betrifft in der Praxis vor allem Eigentümer, die zunächst selbst eingezogen sind und später verkaufen — bei durchgehend vermieteten Objekten greift sie nicht.
        </P>
      </section>

      <section>
        <H2>Wie wird der Veräußerungsgewinn berechnet?</H2>
        <Box title="Formel Veräußerungsgewinn">
          Veräußerungsgewinn = Verkaufspreis − Anschaffungskosten − Veräußerungskosten + in Anspruch genommene AfA
        </Box>
        <P>
          Der letzte Punkt überrascht viele Vermieter: Die in den Vorjahren geltend gemachte <strong>AfA erhöht den steuerpflichtigen Gewinn</strong>, weil sie den Buchwert der Immobilie mindert. Wer über Jahre AfA abgesetzt hat, muss diesen steuerlichen Vorteil beim Verkauf also anteilig wieder "zurückgeben" — ökonomisch ist das kein Nachteil (die AfA hat in der Vergangenheit die Steuerlast gesenkt), sollte aber bei der Verkaufsplanung nicht übersehen werden.
        </P>
        <Box title="Beispielrechnung">
          Kaufpreis 2016: 250.000 € (Anschaffungskosten inkl. Nebenkosten). AfA über 9 Jahre à 2 % auf 200.000 € Gebäudeanteil = 36.000 € kumulierte AfA. Verkaufspreis 2026 (nach Ablauf der Frist wäre es steuerfrei — als Beispiel für einen Verkauf innerhalb der Frist): 320.000 €, Veräußerungskosten (Makler, Notar) 12.000 €. Veräußerungsgewinn = 320.000 − 250.000 − 12.000 + 36.000 = 94.000 €.
        </Box>
      </section>

      <section>
        <H2>Wie hoch ist die Steuer auf den Veräußerungsgewinn?</H2>
        <P>
          Anders als bei Aktien gibt es <strong>keinen pauschalen Abgeltungssteuersatz</strong> von 25 % — der Veräußerungsgewinn wird dem übrigen zu versteuernden Einkommen hinzugerechnet und mit dem <strong>persönlichen Einkommensteuersatz</strong> (bis zu 45 % zzgl. Solidaritätszuschlag) versteuert. Bei hohen Gewinnen und einem bereits hohen Grenzsteuersatz kann das eine erhebliche Steuerlast im Verkaufsjahr bedeuten — eine vorausschauende Verkaufsplanung (z. B. Timing über den Jahreswechsel) kann sich lohnen.
        </P>
      </section>

      <section>
        <H2>Freigrenze und Verlustverrechnung</H2>
        <P>
          Seit 2024 gilt eine <strong>Freigrenze von 1.000 € pro Person und Jahr</strong> für den Gesamtgewinn aus allen privaten Veräußerungsgeschäften eines Jahres (§ 23 Abs. 3 EStG) — wichtig: eine <strong>Freigrenze</strong>, kein Freibetrag. Liegt der Gesamtgewinn auch nur einen Euro darüber, ist der gesamte Betrag steuerpflichtig, nicht nur der übersteigende Teil. Verluste aus privaten Veräußerungsgeschäften können ausschließlich mit Gewinnen aus anderen privaten Veräußerungsgeschäften verrechnet werden (auch aus anderen Jahren, per Verlustvor- oder -rücktrag) — nicht mit Einkünften aus Vermietung oder anderen Einkunftsarten.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Wer den Verkauf einer vermieteten Immobilie plant, sollte das exakte Datum des ursprünglichen Kaufvertrags kennen und die 10-Jahres-Frist im Kalender markieren — wenige Tage können über eine erhebliche Steuerlast entscheiden. Bei geplanter Eigennutzung vor dem Verkauf lohnt sich eine frühzeitige, sauber dokumentierte Umsetzung der Drei-Jahres-Regel.
        </P>
        <P>
          Mit dem <a href="/afa-rechner" className="text-indigo-600 font-semibold hover:underline">kostenlosen AfA-Rechner</a> siehst du, wie viel AfA du bislang geltend gemacht hast — als Ausgangspunkt für die Berechnung eines möglichen Veräußerungsgewinns.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle steuerliche Beratung. Bitte lass deine konkrete Verkaufsplanung von einem Steuerberater prüfen.
        </P>
      </section>
    </ArticleLayout>
  );
}
