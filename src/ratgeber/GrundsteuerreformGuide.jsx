import ArticleLayout from './ArticleLayout';

const H2 = ({ children }) => <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-3">{children}</h2>;
const P = ({ children }) => <p className="text-slate-600 leading-relaxed">{children}</p>;
const Box = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 my-4">
    {title && <div className="font-bold text-slate-900 mb-2">{title}</div>}
    <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
  </div>
);

export default function GrundsteuerreformGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Grundsteuerreform 2025: Was sich für Vermieter ändert"
      untertitel="Seit 1. Januar 2025 gilt bundesweit ein neues Bewertungsrecht für die Grundsteuer. Was sich für Vermieter bei Berechnung, Umlage und Nebenkostenabrechnung ändert."
      lesezeit="6"
      related={[
        { href: '/ratgeber/nebenkostenabrechnung-vermieter', titel: 'Nebenkostenabrechnung für Vermieter' },
        { href: '/ratgeber/grunderwerbsteuer-bundeslaender', titel: 'Grunderwerbsteuer nach Bundesland' },
        { href: '/ratgeber/mietrendite-berechnen', titel: 'Mietrendite berechnen: Der komplette Guide' },
      ]}
    >
      <section>
        <H2>Warum es die Reform überhaupt gibt</H2>
        <P>
          Das Bundesverfassungsgericht erklärte 2018 die bisherige Bewertung der Grundsteuer für verfassungswidrig — sie basierte auf völlig veralteten Einheitswerten aus dem Jahr 1964 (Westdeutschland) bzw. 1935 (Ostdeutschland). Der Gesetzgeber musste ein neues, verfassungskonformes Bewertungssystem schaffen. Es gilt bundesweit seit dem <strong>1. Januar 2025</strong>.
        </P>
      </section>

      <section>
        <H2>Das neue Bewertungssystem</H2>
        <P>
          Statt des alten Einheitswerts wird nun der <strong>Grundsteuerwert</strong> ermittelt — anhand von Grundstücksgröße, Bodenrichtwert, Gebäudenutzfläche und Baujahr. Weil die Bundesländer im Gesetzgebungsverfahren eine Öffnungsklausel durchgesetzt haben, gibt es kein einheitliches Modell, sondern mehrere parallele Bewertungssysteme:
        </P>
        <Box title="Bewertungsmodelle im Überblick">
          <div className="space-y-2">
            <div><strong>Bundesmodell (wertabhängig):</strong> in der Mehrheit der Bundesländer, berücksichtigt Bodenrichtwert und Nettokaltmiete</div>
            <div><strong>Reines Flächenmodell:</strong> in Bayern, unabhängig vom Immobilienwert, nur Fläche zählt</div>
            <div><strong>Modifiziertes Bodenwertmodell:</strong> in Baden-Württemberg</div>
            <div><strong>Flächen-Lage-Modell:</strong> in mehreren weiteren Ländern wie Hessen und Niedersachsen, kombiniert Fläche mit einem Lagefaktor</div>
          </div>
        </Box>
        <P>
          Für Vermieter mit Objekten in mehreren Bundesländern bedeutet das: Die Berechnungslogik kann sich von Objekt zu Objekt unterscheiden.
        </P>
      </section>

      <section>
        <H2>Wie die Grundsteuer berechnet wird</H2>
        <P>
          Vereinfacht gilt: <strong>Grundsteuerwert × Steuermesszahl × Hebesatz der Gemeinde = Grundsteuer.</strong> Die Steuermesszahl wurde im Zuge der Reform deutlich gesenkt, um die gestiegenen Grundsteuerwerte auszugleichen. Der entscheidende Hebel bleibt aber der <strong>Hebesatz</strong>, den jede Kommune selbst festlegt — und der über die tatsächliche Belastung im Einzelfall entscheidet, deutlich mehr als das neue Bewertungsmodell selbst.
        </P>
      </section>

      <section>
        <H2>Wann Vermieter die Änderung tatsächlich spüren</H2>
        <P>
          Die neuen Werte gelten steuerlich zwar bereits seit 2025, sichtbar werden sie für Mieter aber erst in der <strong>Nebenkostenabrechnung für das Jahr 2025</strong>, die üblicherweise erst 2026 verschickt wird. Je nach Region, neuem Grundsteuerwert und kommunalem Hebesatz kann sich die Position "Grundsteuer" in dieser Abrechnung deutlich vom Vorjahr unterscheiden — nach oben wie nach unten.
        </P>
      </section>

      <section>
        <H2>Umlage auf Mieter bleibt möglich</H2>
        <P>
          An der rechtlichen Grundlage für die Umlage ändert die Reform nichts: Die Grundsteuer ist weiterhin nach § 556 BGB in Verbindung mit der Betriebskostenverordnung <strong>zu 100 % auf die Mieter umlagefähig</strong> — vorausgesetzt, dies ist im Mietvertrag als umlagefähige Betriebskostenart vereinbart. Ohne entsprechende Vereinbarung bleibt der Vermieter auf den Kosten sitzen.
        </P>
      </section>

      <section>
        <H2>Was Vermieter jetzt konkret prüfen sollten</H2>
        <Box title="Checkliste">
          <div className="space-y-2">
            <div>Neuen Grundsteuerbescheid mit dem alten Bescheid vergleichen und die Abweichung nachvollziehen</div>
            <div>Bei offensichtlichen Fehlern (falsche Fläche, falsches Baujahr) fristgerecht Einspruch einlegen</div>
            <div>Aktuellen Hebesatz der jeweiligen Kommune für das Abrechnungsjahr recherchieren</div>
            <div>Mietverträge daraufhin prüfen, ob die Grundsteuer überhaupt als umlagefähige Nebenkostenposition vereinbart ist</div>
          </div>
        </Box>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Die Grundsteuerreform ändert nicht, ob und wie die Grundsteuer umgelegt werden darf — sie ändert nur, wie hoch sie ausfällt. Wie stark sich das für ein konkretes Objekt auswirkt, hängt fast ausschließlich vom Bewertungsmodell des jeweiligen Bundeslands und dem Hebesatz der Kommune ab, nicht von einer bundeseinheitlichen Regel.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle steuerliche oder rechtliche Beratung.
        </P>
      </section>
    </ArticleLayout>
  );
}
