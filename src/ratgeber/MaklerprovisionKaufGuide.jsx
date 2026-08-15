import ArticleLayout from './ArticleLayout';

const H2 = ({ children }) => <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-3">{children}</h2>;
const P = ({ children }) => <p className="text-slate-600 leading-relaxed">{children}</p>;
const Box = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 my-4">
    {title && <div className="font-bold text-slate-900 mb-2">{title}</div>}
    <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
  </div>
);

export default function MaklerprovisionKaufGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Maklerprovision beim Immobilienkauf: Wer zahlt was?"
      untertitel="Anders als bei der Miete gilt beim Kauf nicht das Bestellerprinzip, sondern der Halbteilungsgrundsatz. Was das für Käufer und Verkäufer von Anlageimmobilien konkret bedeutet."
      lesezeit="5"
      related={[
        { href: '/ratgeber/grunderwerbsteuer-bundeslaender', titel: 'Grunderwerbsteuer nach Bundesland' },
        { href: '/ratgeber/immobilienfinanzierung', titel: 'Immobilienfinanzierung für Kapitalanleger' },
        { href: '/ratgeber/mietrendite-berechnen', titel: 'Mietrendite berechnen: Der komplette Guide' },
      ]}
    >
      <section>
        <H2>Bestellerprinzip bei Miete, Halbteilung beim Kauf</H2>
        <P>
          Beim Mietvertrag gilt seit 2015 das Bestellerprinzip: Wer den Makler beauftragt, zahlt ihn — meist also der Vermieter. Bei Immobilienkäufen gilt seit einer Gesetzesreform Ende 2020 eine andere Regel: der <strong>Halbteilungsgrundsatz</strong> nach § 656c BGB. Die Begriffe werden umgangssprachlich oft vermischt, rechtlich sind es aber unterschiedliche Prinzipien.
        </P>
      </section>

      <section>
        <H2>Der Halbteilungsgrundsatz nach § 656c BGB</H2>
        <P>
          Für den Kauf von Einfamilienhäusern und Eigentumswohnungen durch Verbraucher gilt: Ist der Makler sowohl für den Verkäufer als auch für den Käufer tätig, muss die Provision <strong>hälftig zwischen beiden Parteien geteilt</strong> werden. Eine abweichende Vereinbarung ist unwirksam — die Regelung ist zwingendes Recht und kann nicht vertraglich umgangen werden.
        </P>
      </section>

      <section>
        <H2>Wenn der Makler nur für eine Seite tätig war</H2>
        <P>
          War der Makler ursprünglich nur vom Verkäufer beauftragt und wird trotzdem vom Käufer eine Provision verlangt, greift § 656d BGB: Der Anteil des Käufers darf <strong>nicht höher sein als der Anteil, den der Verkäufer zahlt</strong>. In der Praxis bedeutet das faktisch ebenfalls eine Deckelung auf maximal die Hälfte der Gesamtprovision.
        </P>
        <Box title="Nachweispflicht">
          Bevor der Käufer seinen Anteil zahlen muss, muss der Verkäufer nachweisen, dass er seinen eigenen Anteil bereits gezahlt hat oder zumindest fällig gestellt hat. Diese Reihenfolge schützt Käufer davor, in Vorleistung zu gehen.
        </Box>
      </section>

      <section>
        <H2>Übliche Provisionshöhe</H2>
        <P>
          Die Gesamtprovision liegt je nach Region typischerweise zwischen etwa 3 % und 7 % des Kaufpreises zuzüglich Umsatzsteuer. Durch die hälftige Teilung entfällt in vielen Bundesländern auf jede Seite ein Anteil von rund 3,57 % brutto — die genaue Aufteilung und Gesamthöhe variiert aber je nach Bundesland und individueller Vereinbarung mit dem Makler.
        </P>
      </section>

      <section>
        <H2>Relevanz für Kapitalanleger</H2>
        <P>
          Wer als Vermieter oder Investor eine Bestandsimmobilie zukauft, sollte die Maklerprovision von Anfang an korrekt in die <strong>Kaufnebenkosten</strong> einkalkulieren — neben Grunderwerbsteuer, Notar- und Grundbuchkosten ist sie oft der größte einzelne Nebenkostenposten und wirkt sich direkt auf die Anfangsrendite aus. Da der Käuferanteil gedeckelt ist, lohnt sich vor Vertragsunterschrift ein Blick darauf, wer den Makler ursprünglich beauftragt hat und wie die Provision vertraglich aufgeteilt wird.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Beim Immobilienkauf gilt nicht das Bestellerprinzip der Miete, sondern der Halbteilungsgrundsatz: Der Käuferanteil an der Maklerprovision darf den Verkäuferanteil nicht übersteigen, und bei einem für beide Seiten tätigen Makler wird grundsätzlich hälftig geteilt. Das ist zwingendes Recht — Vereinbarungen, die davon abweichen, sind unwirksam.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle Rechtsberatung.
        </P>
      </section>
    </ArticleLayout>
  );
}
