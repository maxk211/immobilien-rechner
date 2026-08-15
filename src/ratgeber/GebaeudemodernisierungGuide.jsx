import ArticleLayout from './ArticleLayout';

const H2 = ({ children }) => <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-3">{children}</h2>;
const P = ({ children }) => <p className="text-slate-600 leading-relaxed">{children}</p>;
const Box = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 my-4">
    {title && <div className="font-bold text-slate-900 mb-2">{title}</div>}
    <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
  </div>
);

export default function GebaeudemodernisierungGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Vom GEG zum Gebäudemodernisierungsgesetz: Was sich 2026 für Vermieter ändert"
      untertitel="Mitte Juli 2026 hat der Gesetzgeber das Gebäudeenergiegesetz durch das neue Gebäudemodernisierungsgesetz (GModG) ersetzt. Die starre 65-Prozent-Regel fällt weg — was das für Vermieter mit anstehendem Heizungstausch bedeutet."
      lesezeit="7"
      related={[
        { href: '/ratgeber/mieterhoehung-modernisierung', titel: 'Mieterhöhung nach Modernisierung' },
        { href: '/ratgeber/afa-und-steuern-vermietung', titel: 'AfA und Steuern bei Vermietung' },
        { href: '/ratgeber/immobilienfinanzierung', titel: 'Immobilienfinanzierung für Kapitalanleger' },
      ]}
    >
      <section>
        <H2>Das GEG hat einen Nachfolger</H2>
        <P>
          Bundestag und Bundesrat haben Mitte Juli 2026 das <strong>Gebäudemodernisierungsgesetz (GModG)</strong> beschlossen, verkündet wurde es am 28. Juli 2026, die wesentlichen neuen Regelungen gelten seit dem <strong>29. Juli 2026</strong>. Es ersetzt das bisherige Gebäudeenergiegesetz (GEG), das im Volksmund als "Heizungsgesetz" bekannt war. Der Name ist neu, aber vor allem die Grundausrichtung hat sich verschoben.
        </P>
      </section>

      <section>
        <H2>Der Kernwandel: weg von der starren Technologie-Vorgabe</H2>
        <P>
          Die bisherige Pflicht, dass neu eingebaute Heizungen zu mindestens <strong>65 Prozent mit erneuerbaren Energien</strong> betrieben werden müssen, entfällt. Statt einer engen technischen Einzelvorgabe setzt das GModG auf einen technologieoffeneren Rahmen mit neuen Regeln für Brennstoffe, Quoten und Mieterschutz. Für Vermieter heißt das: Beim Austausch einer Heizung gibt es wieder mehr Spielraum bei der Wahl der Technik als es die vorherige Rechtslage vorsah.
        </P>
      </section>

      <section>
        <H2>Neue Pflichten für fossile Heizungen</H2>
        <Box title="Was ab 2028/2029 kommt">
          <div className="space-y-2">
            <div><strong>Ab 2028:</strong> Vermieter, die weiterhin auf eine fossile Heizung setzen, sollen sich hälftig an Netzentgelten und dem CO₂-Preis beteiligen.</div>
            <div><strong>Ab 2029:</strong> Ein sogenanntes Bio-Stufenmodell verpflichtet schrittweise zu einer Beimischung biogener Anteile bei Gas- und Ölheizungen.</div>
          </div>
        </Box>
        <P>
          Wer also plant, eine bestehende fossile Heizung noch länger zu betreiben statt sie jetzt zu ersetzen, sollte diese künftigen Zusatzkosten in die eigene Kalkulation einpreisen.
        </P>
      </section>

      <section>
        <H2>Sanierungspflichten gelten unabhängig von Eigennutzung</H2>
        <P>
          Ein Grundsatz bleibt unverändert: Energetische Nachrüst- und Sanierungspflichten für Bestandsgebäude gelten unabhängig davon, ob das Gebäude selbst genutzt oder vermietet wird. Als Vermieter ist man von diesen Pflichten also immer betroffen — anders als bei manchen freiwilligen Modernisierungen gibt es hier keinen Unterschied zur Eigennutzung.
        </P>
      </section>

      <section>
        <H2>Modernisierungsumlage bei Heizungstausch bleibt wichtig</H2>
        <P>
          Unabhängig von der GEG/GModG-Reform gilt seit 2024 die Sonderregelung des § 559e BGB für den Heizungstausch: Vermieter können <strong>10 % der umlagefähigen Kosten</strong> jährlich auf die Miete umlegen, wenn eine Förderung in Anspruch genommen und von den Kosten abgezogen wurde — statt der sonst üblichen 8 % nach § 559 BGB. Die monatliche Mieterhöhung ist dabei auf <strong>maximal 50 Cent pro Quadratmeter</strong> über einen Zeitraum von sechs Jahren gedeckelt, deutlich strenger als die allgemeine Kappungsgrenze von 3 €/m² bei sonstigen Modernisierungen.
        </P>
      </section>

      <section>
        <H2>Was Vermieter jetzt konkret tun sollten</H2>
        <Box title="Praxis-Checkliste">
          <div className="space-y-2">
            <div>Bestehende Heizungsanlage und deren Restlaufzeit realistisch einschätzen</div>
            <div>Fördermöglichkeiten (BEG) vor einem Heizungstausch prüfen, um vom höheren Umlagesatz nach § 559e BGB profitieren zu können</div>
            <div>Keine überstürzten Entscheidungen allein wegen des Wegfalls der 65-Prozent-Pflicht treffen — langfristige Betriebskosten und künftige CO₂-Kosten mitdenken</div>
            <div>Bei größeren Sanierungsvorhaben aktuellen Rechtsstand prüfen, da die Umsetzungsverordnungen zum GModG teilweise noch folgen</div>
          </div>
        </Box>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Das Gebäudemodernisierungsgesetz löst das bisherige Heizungsgesetz mit einem spürbar flexibleren Ansatz ab, verschiebt aber einen Teil der Verantwortung — etwa über CO₂-Preis und Netzentgelte — in Richtung Vermieter fossil betriebener Gebäude. Da die Materie noch sehr jung ist und weitere Verordnungen folgen können, lohnt sich vor größeren Investitionsentscheidungen eine aktuelle Prüfung der Rechtslage.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information zum Stand August 2026 und ersetzt keine individuelle rechtliche oder energetische Beratung. Da sich die Gesetzeslage kurz nach Inkrafttreten noch weiterentwickeln kann, empfiehlt sich vor konkreten Maßnahmen eine aktuelle Prüfung.
        </P>
      </section>
    </ArticleLayout>
  );
}
