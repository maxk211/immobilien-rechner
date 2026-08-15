import ArticleLayout from './ArticleLayout';

const H2 = ({ children }) => <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-3">{children}</h2>;
const P = ({ children }) => <p className="text-slate-600 leading-relaxed">{children}</p>;
const Box = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 my-4">
    {title && <div className="font-bold text-slate-900 mb-2">{title}</div>}
    <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
  </div>
);

export default function KautionAnlageGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Mietkaution richtig anlegen: Pflichten für Vermieter nach § 551 BGB"
      untertitel="Die Kaution gehört nicht auf ein normales Konto — § 551 BGB schreibt eine getrennte, verzinste Anlage vor. Wer dagegen verstößt, haftet im Zweifel persönlich."
      lesezeit="6"
      related={[
        { href: '/ratgeber/eigenbedarfskuendigung', titel: 'Kündigung wegen Eigenbedarf' },
        { href: '/ratgeber/nebenkostenabrechnung-vermieter', titel: 'Nebenkostenabrechnung für Vermieter' },
        { href: '/ratgeber/mietspiegel-verstehen', titel: 'Mietspiegel verstehen und für Mieterhöhungen nutzen' },
      ]}
    >
      <section>
        <H2>Warum die Kaution getrennt angelegt werden muss</H2>
        <P>
          Nach § 551 Abs. 3 BGB muss die Mietsicherheit <strong>getrennt vom übrigen Vermögen des Vermieters</strong> angelegt werden. Diese Pflicht kann auch nicht durch eine abweichende Vereinbarung im Mietvertrag umgangen werden — § 551 Abs. 1 S. 3 BGB stellt das ausdrücklich klar. Der Grund: Die Kaution soll als "Sondervermögen" geschützt sein, damit sie im Fall einer Insolvenz des Vermieters nicht in die Insolvenzmasse fällt und dem Mieter tatsächlich zur Verfügung steht, wenn er sie braucht.
        </P>
      </section>

      <section>
        <H2>Welche Anlageformen zulässig sind</H2>
        <P>
          Üblich und rechtssicher ist ein offen als Mietkaution gekennzeichnetes Konto — meist ein Kautionssparbuch oder ein separates Kautionskonto mit gesetzlicher Verzinsung. Auch ein Sammelkonto für mehrere Mietkautionen ist zulässig, solange es klar als Treuhandkonto ausgewiesen ist und kein eigenes Vermögen des Vermieters darauf liegt.
        </P>
        <Box title="Nicht zulässig">
          Die Kaution auf dem eigenen Girokonto zu parken, mit dem privaten oder geschäftlichen Vermögen zu vermischen, oder sie einfach als Bargeld aufzubewahren, erfüllt die gesetzliche Trennungspflicht nicht.
        </Box>
        <P>
          Als Alternative zur klassischen Bareinlage sind auch eine Kautionsbürgschaft oder eine Kautionsversicherung möglich — hier zahlt der Mieter keine Summe direkt ein, sondern eine (meist deutlich geringere) laufende Gebühr an einen Bürgen bzw. Versicherer. Für Vermieter bedeutet das: keine eigene Anlagepflicht, aber im Schadensfall muss zunächst der Bürge in Anspruch genommen werden.
        </P>
      </section>

      <section>
        <H2>Höhe und Zahlungsweise der Kaution</H2>
        <Box title="Gesetzliche Grenzen">
          <div className="space-y-2">
            <div><strong>Maximal 3 Nettokaltmieten</strong> als Kautionshöhe (§ 551 Abs. 1 BGB)</div>
            <div><strong>Ratenzahlung in bis zu 3 gleichen monatlichen Raten</strong> ist das gesetzliche Recht des Mieters, unabhängig davon, was im Mietvertrag steht</div>
            <div>Die erste Rate ist mit Beginn des Mietverhältnisses fällig, die weiteren mit den folgenden Mietzahlungen</div>
          </div>
        </Box>
      </section>

      <section>
        <H2>Verzinsung: Die Zinsen gehören dem Mieter</H2>
        <P>
          Die Kaution ist zum <strong>üblichen Zinssatz für Spareinlagen mit dreimonatiger Kündigungsfrist</strong> zu verzinsen, sofern nichts anderes vereinbart ist. Die Zinsen erhöhen die Sicherheit und stehen wirtschaftlich dem Mieter zu — sie werden bei der Rückzahlung zur Kaution hinzugerechnet, nicht dem Vermieter gutgeschrieben.
        </P>
      </section>

      <section>
        <H2>Was bei Verstößen droht</H2>
        <P>
          Legt ein Vermieter die Kaution nicht getrennt an, kann der Mieter die gesetzeskonforme Anlage verlangen. Geht die Kaution durch eine Insolvenz des Vermieters verloren, weil sie nicht als Sondervermögen geschützt war, haftet der Vermieter dem Mieter gegenüber persönlich auf Schadensersatz in Höhe der verlorenen Kaution.
        </P>
      </section>

      <section>
        <H2>Rückzahlung nach Mietende</H2>
        <P>
          Eine gesetzliche Frist für die Rückzahlung gibt es nicht, in der Rechtsprechung hat sich aber eine <strong>Prüf- und Überlegungsfrist von bis zu sechs Monaten</strong> als Richtwert etabliert — insbesondere wenn noch eine Nebenkostenabrechnung aussteht, aus der sich Nachforderungen ergeben könnten. Sind keine offenen Ansprüche zu erwarten, muss die Kaution deutlich früher zurückgezahlt werden. Der Vermieter darf mit unstrittigen eigenen Forderungen (z. B. Mietrückstände, Schönheitsreparaturen) gegen den Rückzahlungsanspruch aufrechnen.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Die getrennte, verzinste Anlage der Kaution ist keine Kür, sondern eine zwingende gesetzliche Pflicht mit realem Haftungsrisiko. Ein separat gekennzeichnetes Kautionskonto ist der einfachste Weg, rechtssicher zu bleiben — und schützt im Zweifel auch den Vermieter selbst vor Streit und Nachzahlungsforderungen.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle Rechtsberatung.
        </P>
      </section>
    </ArticleLayout>
  );
}
