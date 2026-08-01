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

export default function CashflowGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Cashflow bei Immobilien: Was Vermieter wissen müssen"
      untertitel="Der Cashflow ist die monatliche Differenz zwischen Mieteinnahmen und allen Kosten inklusive Finanzierung — die Kennzahl, die zeigt, ob eine Immobilie tatsächlich Geld einbringt oder Geld kostet, mit Formel und Beispielrechnung."
      lesezeit="6"
      related={[
        { href: '/ratgeber/mietrendite-berechnen', titel: 'Mietrendite berechnen: Der komplette Guide' },
        { href: '/ratgeber/afa-und-steuern-vermietung', titel: 'AfA und Steuern bei Vermietung: Der Leitfaden' },
      ]}
    >
      <section>
        <H2>Was ist Cashflow bei Immobilien?</H2>
        <P>
          Der <strong>Cashflow</strong> ist der Betrag, der monatlich tatsächlich auf dem Konto ankommt, nachdem alle laufenden Kosten und die Finanzierungsrate von den Mieteinnahmen abgezogen wurden. Anders als die Mietrendite, die eine prozentuale Kennzahl auf dem Papier ist, ist der Cashflow die konkrete, liquide Größe — und damit für viele Vermieter die entscheidende Frage: Trägt sich die Immobilie selbst, oder muss ich jeden Monat Geld nachschießen?
        </P>
      </section>

      <section>
        <H2>Cashflow berechnen: Die Formel</H2>
        <Box title="Formel monatlicher Cashflow">
          Cashflow = Kaltmiete − laufende Kosten − Finanzierungsrate (Zins + Tilgung)
        </Box>
        <P>
          <strong>Beispiel:</strong> Eine Wohnung bringt 900 € Kaltmiete im Monat. Laufende, nicht umlagefähige Kosten (Instandhaltungsrücklage, Verwaltung) betragen 150 €. Die monatliche Kreditrate liegt bei 620 €. Der Cashflow beträgt dann 900 − 150 − 620 = 130 € im Monat.
        </P>
        <P>
          Wichtig ist der Unterschied zwischen <strong>Zins-Cashflow</strong> (nur die Zinsen werden abgezogen, Tilgung zählt als Vermögensaufbau) und <strong>Voll-Cashflow</strong> (die gesamte Kreditrate inklusive Tilgung wird abgezogen, wie im Beispiel oben). Für die reine Liquiditätsbetrachtung — kann ich die Rate bezahlen? — ist der Voll-Cashflow die relevante Größe.
        </P>
      </section>

      <section>
        <H2>Positiver vs. negativer Cashflow</H2>
        <P>
          Ein <strong>positiver Cashflow</strong> bedeutet, dass die Immobilie sich selbst trägt und zusätzlich Überschuss abwirft. Das ist besonders für Investoren attraktiv, die planen, mit den Mieteinnahmen weitere Immobilien zu finanzieren oder ein passives Einkommen aufzubauen.
        </P>
        <P>
          Ein <strong>negativer Cashflow</strong> bedeutet, dass monatlich Eigenkapital nachgeschossen werden muss. Das ist nicht automatisch ein Fehler — viele Investoren akzeptieren einen leicht negativen Cashflow bewusst, wenn sie mit überdurchschnittlicher Wertsteigerung oder steuerlichen Vorteilen (AfA) rechnen. Entscheidend ist, dass der negative Betrag dauerhaft tragbar ist und nicht die eigene finanzielle Belastbarkeit übersteigt.
        </P>
        <Box title="Faustregel">
          Als Zielwert gilt für die meisten Vermieter: mindestens kostendeckend (Cashflow ≥ 0 €/Monat), idealerweise ein Sicherheitspuffer von 100–200 € pro Objekt für unerwartete Reparaturen oder Leerstandsmonate.
        </Box>
      </section>

      <section>
        <H2>Die häufigsten Fehler bei der Cashflow-Kalkulation</H2>
        <H3>Instandhaltungsrücklage vergessen oder unterschätzen</H3>
        <P>
          Viele Erstinvestoren rechnen nur mit Hausgeld und Kreditrate — die Instandhaltungsrücklage für Dach, Fassade, Heizung oder Fenster wird oft komplett vergessen. Bei älteren Gebäuden sollte man mindestens 1–1,50 €/m² monatlich einplanen.
        </P>
        <H3>Leerstand nicht einkalkulieren</H3>
        <P>
          Die Beispielrechnung geht von 12 Monaten Vollvermietung aus. Realistischer ist es, mit 11 bis 11,5 Monaten Mieteinnahmen pro Jahr zu kalkulieren, um Mieterwechsel und Renovierungszeiten abzufedern.
        </P>
        <H3>Nur die Zinsen statt der vollen Rate abziehen</H3>
        <P>
          Steuerlich zählt nur der Zinsanteil als Werbungskosten — für die tatsächliche Liquiditätsplanung muss aber die volle Kreditrate (Zins + Tilgung) vom Konto abgehen. Wer hier nur die Zinsen rechnet, überschätzt seinen Cashflow systematisch.
        </P>
        <H3>Anschlussfinanzierung ignorieren</H3>
        <P>
          Nach Ablauf der Zinsbindung (meist 10–15 Jahre) kann sich die Kreditrate durch veränderte Zinssätze deutlich verändern. Ein Cashflow, der heute komfortabel positiv ist, kann nach der Anschlussfinanzierung knapper werden — besonders bei hohem Fremdkapitalanteil.
        </P>
      </section>

      <section>
        <H2>Cashflow vs. Rendite: Was ist wichtiger?</H2>
        <P>
          Beide Kennzahlen beantworten unterschiedliche Fragen. Die <strong>Mietrendite</strong> zeigt, wie profitabel eine Immobilie im Verhältnis zum Kaufpreis ist — unabhängig von der Finanzierung. Der <strong>Cashflow</strong> zeigt, ob die konkrete Finanzierungsstruktur zu einer positiven oder negativen monatlichen Liquidität führt.
        </P>
        <P>
          Zwei Immobilien mit identischer Nettomietrendite können völlig unterschiedliche Cashflows haben — abhängig vom Eigenkapitalanteil, Zinssatz und Tilgungssatz. Wer sein Portfolio langfristig ausbauen will, sollte beide Kennzahlen gemeinsam betrachten: die Rendite als Qualitätsmaßstab der Immobilie, den Cashflow als Maßstab für die eigene finanzielle Tragfähigkeit.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Der Cashflow ist die Kennzahl, die im Alltag zählt: Sie entscheidet, ob eine Immobilie finanziell tragbar ist oder zur Belastung wird. Eine realistische Kalkulation berücksichtigt Instandhaltung, Leerstand und die volle Kreditrate — nicht nur die Zinsen.
        </P>
        <P>
          Mit dem <a href="/mietrendite-rechner" className="text-indigo-600 font-semibold hover:underline">kostenlosen Mietrendite-Rechner</a> lässt sich der monatliche Cashflow inklusive Finanzierungsrate direkt berechnen.
        </P>
      </section>
    </ArticleLayout>
  );
}
