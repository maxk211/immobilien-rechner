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

export default function MietspiegelGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Mietspiegel verstehen und für Mieterhöhungen nutzen"
      untertitel="Was ein Mietspiegel ist, wie er sich auf Mieterhöhungen auswirkt und welche Grenzen Kappungsgrenze und Mietpreisbremse setzen — der Überblick für Vermieter."
      lesezeit="6"
      related={[
        { href: '/ratgeber/cashflow-bei-immobilien', titel: 'Cashflow bei Immobilien: Was Vermieter wissen müssen' },
        { href: '/ratgeber/nebenkostenabrechnung-vermieter', titel: 'Nebenkostenabrechnung für Vermieter' },
        { href: '/mietrendite-staedte', titel: 'Mietrendite Deutschland: Städtevergleich', kategorie: 'Städtevergleich' },
      ]}
    >
      <section>
        <H2>Was ist ein Mietspiegel?</H2>
        <P>
          Der <strong>Mietspiegel</strong> ist eine von Gemeinde oder Stadt erstellte Übersicht über die <strong>ortsübliche Vergleichsmiete</strong> — also die Nettokaltmiete, die in der jeweiligen Stadt für vergleichbare Wohnungen üblich ist, gestaffelt nach Wohnlage, Baujahr, Größe und Ausstattung. Er ist die zentrale Referenzgröße für Mieterhöhungen im laufenden Mietverhältnis und für die Mietpreisbremse bei Neuvermietungen.
        </P>
      </section>

      <section>
        <H2>Einfacher vs. qualifizierter Mietspiegel</H2>
        <Box>
          <div className="space-y-2">
            <div><strong>Einfacher Mietspiegel:</strong> von der Gemeinde erstellt oder anerkannt, dient als Orientierungshilfe. Vor Gericht ist er ein Indiz, aber kein zwingender Beweis.</div>
            <div><strong>Qualifizierter Mietspiegel (§ 558d BGB):</strong> nach anerkannten wissenschaftlichen Grundsätzen erstellt und von der Gemeinde als solcher anerkannt. Er wird vor Gericht als Beweis für die ortsübliche Vergleichsmiete vermutet — Mieterhöhungen, die sich darauf stützen, sind deutlich rechtssicherer.</div>
          </div>
        </Box>
        <P>
          Nicht jede Stadt hat einen qualifizierten Mietspiegel. Größere Städte (Berlin, München, Hamburg, Köln u. v. m.) verfügen in der Regel über einen, kleinere Gemeinden oft nur über einen einfachen oder gar keinen — dort können ersatzweise Vergleichswohnungen oder ein Sachverständigengutachten herangezogen werden.
        </P>
      </section>

      <section>
        <H2>Mieterhöhung nach Mietspiegel: Die Spielregeln</H2>
        <H3>Wartezeit zwischen Mieterhöhungen</H3>
        <P>
          Eine Mieterhöhung auf die ortsübliche Vergleichsmiete ist frühestens 15 Monate nach der letzten Mieterhöhung (oder dem Einzug) zulässig, und die neue Miete darf erst nach einer weiteren Wartezeit von drei Monaten seit Zugang des Erhöhungsverlangens gezahlt werden — in Summe muss der Vermieter also strategisch planen.
        </P>
        <H3>Die Kappungsgrenze</H3>
        <Box title="Kappungsgrenze">
          Die Miete darf innerhalb von drei Jahren um maximal <strong>20 %</strong> steigen — in Gebieten mit angespanntem Wohnungsmarkt, die die Länder per Verordnung ausweisen, gilt eine verschärfte Kappungsgrenze von <strong>15 %</strong>. Das gilt unabhängig davon, wie stark die ortsübliche Vergleichsmiete tatsächlich gestiegen ist.
        </Box>
        <P>
          Das bedeutet: Selbst wenn der Mietspiegel eine deutlich höhere ortsübliche Miete ausweist, begrenzt die Kappungsgrenze die zulässige Erhöhung zusätzlich. Beide Grenzen — ortsübliche Vergleichsmiete und Kappungsgrenze — gelten parallel, es zählt jeweils der niedrigere Wert.
        </P>
      </section>

      <section>
        <H2>Mietpreisbremse bei Neuvermietung</H2>
        <P>
          In Gebieten mit angespanntem Wohnungsmarkt (von den Bundesländern per Verordnung festgelegt) greift bei Neuvermietung die <strong>Mietpreisbremse</strong> (§ 556d BGB): Die vereinbarte Miete darf die ortsübliche Vergleichsmiete laut Mietspiegel um maximal <strong>10 %</strong> übersteigen. Ausnahmen gelten unter anderem für umfassend modernisierte Wohnungen, Neubauten (Erstbezug nach dem 1. Oktober 2014) sowie wenn die Vormiete bereits über diesem Wert lag (Bestandsschutz).
        </P>
      </section>

      <section>
        <H2>Wo finde ich den Mietspiegel meiner Stadt?</H2>
        <P>
          Qualifizierte und einfache Mietspiegel werden in der Regel von der jeweiligen Stadtverwaltung oder dem Bau-/Wohnungsamt veröffentlicht, oft kostenlos online abrufbar. Größere Städte aktualisieren ihren Mietspiegel meist alle zwei Jahre, dazwischen wird er mit dem Verbraucherpreisindex fortgeschrieben. Für eine Mieterhöhung sollte immer der zum Zeitpunkt des Erhöhungsverlangens aktuell gültige Mietspiegel herangezogen werden — ein veralteter Mietspiegel kann die Erhöhung unwirksam machen.
        </P>
      </section>

      <section>
        <H2>Praxistipp: Mieterhöhung korrekt begründen</H2>
        <P>
          Ein Erhöhungsverlangen muss in Textform erfolgen und die Erhöhung nachvollziehbar begründen — üblicherweise durch Bezug auf die konkrete Einordnung der Wohnung im Mietspiegel (Wohnwertmerkmale wie Baujahr, Ausstattung, Lage). Pauschale Erhöhungen ohne Begründung sind unwirksam. Bei Unsicherheiten lohnt sich vor der Erhöhung ein Blick in die Erläuterungen des jeweiligen Mietspiegels oder eine kurze Rücksprache mit einem Fachanwalt für Mietrecht, insbesondere bei höheren Erhöhungsbeträgen.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Der Mietspiegel ist die zentrale Referenz für rechtssichere Mieterhöhungen — aber nur in Kombination mit der Kappungsgrenze, den Wartefristen und einer sauberen Begründung. Wer diese drei Punkte kennt, kann Bestandsmieten realistisch an das Marktniveau anpassen, ohne rechtliche Risiken einzugehen.
        </P>
        <P>
          renditly erinnert dich automatisch, wenn die letzte Mieterhöhung länger als drei Jahre zurückliegt — <a href="/app" className="text-indigo-600 font-semibold hover:underline">jetzt kostenlos testen</a>.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle Rechtsberatung. Bitte lass deine konkrete Situation im Zweifel von einem Fachanwalt für Mietrecht prüfen.
        </P>
      </section>
    </ArticleLayout>
  );
}
