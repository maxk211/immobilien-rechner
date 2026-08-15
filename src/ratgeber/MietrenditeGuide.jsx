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

export default function MietrenditeGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Mietrendite berechnen: Der komplette Guide für Immobilien-Investoren"
      untertitel="Die Mietrendite ist das Verhältnis von Jahresmiete zu Kaufpreis einer Immobilie und die zentrale Kennzahl zur Bewertung von Anlageimmobilien — mit Formeln für Brutto-, Netto- und Cash-on-Cash-Rendite sowie Richtwerten für den deutschen Markt."
      lesezeit="7"
      related={[
        { href: '/ratgeber/cashflow-bei-immobilien', titel: 'Cashflow bei Immobilien: Was Vermieter wissen müssen' },
        { href: '/ratgeber/immobilienfinanzierung', titel: 'Immobilienfinanzierung für Kapitalanleger' },
        { href: '/mietrendite-staedte', titel: 'Mietrendite Deutschland: Die 18 größten Städte im Vergleich', kategorie: 'Städtevergleich' },
        { href: '/kaufnebenkosten-rechner', titel: 'Kaufnebenkosten-Rechner', kategorie: 'Rechner' },
        { href: '/mietrendite-report-2026', titel: 'Mietrendite-Report Deutschland 2026', kategorie: 'Datenstudie' },
      ]}
    >
      <section>
        <H2>Warum die Mietrendite die wichtigste Kennzahl für Vermieter ist</H2>
        <P>
          Die <strong>Mietrendite</strong> zeigt, wie profitabel eine Immobilie im Verhältnis zu ihrem Kaufpreis ist. Sie ist die zentrale Kennzahl, um verschiedene Objekte objektiv zu vergleichen — unabhängig davon, ob es sich um eine Eigentumswohnung in München oder ein Mehrfamilienhaus in Leipzig handelt. Wer eine Immobilie als Kapitalanlage kauft, sollte die Mietrendite kennen, bevor er unterschreibt.
        </P>
        <P>
          Dabei gibt es nicht die eine Mietrendite, sondern mehrere Kennzahlen, die unterschiedliche Fragen beantworten: Wie hoch ist die Rendite auf den Kaufpreis? Wie hoch ist sie nach Abzug aller Kosten? Und wie effizient arbeitet das eingesetzte Eigenkapital? Dieser Guide erklärt alle drei.
        </P>
      </section>

      <section>
        <H2>Bruttomietrendite: Die schnelle erste Einschätzung</H2>
        <P>
          Die <strong>Bruttomietrendite</strong> setzt die jährliche Kaltmiete ins Verhältnis zum Kaufpreis — ohne Kaufnebenkosten, Finanzierung oder laufende Kosten zu berücksichtigen.
        </P>
        <Box title="Formel Bruttomietrendite">
          Bruttomietrendite (%) = (Kaltmiete pro Monat × 12) / Kaufpreis × 100
        </Box>
        <P>
          <strong>Beispiel:</strong> Eine Wohnung kostet 300.000 €, die Kaltmiete beträgt 900 € im Monat. Die Bruttomietrendite liegt dann bei (900 × 12) / 300.000 × 100 = 3,6 %.
        </P>
        <P>
          Der Vorteil der Bruttomietrendite: Sie lässt sich in Sekunden berechnen und eignet sich hervorragend, um beim Scrollen durch Immobilienportale schnell eine Vorauswahl zu treffen. Der Nachteil: Sie ignoriert Kaufnebenkosten, Instandhaltung, Verwaltung und Finanzierungskosten — und die können erheblich sein.
        </P>
      </section>

      <section>
        <H2>Nettomietrendite: Die realistischere Kennzahl</H2>
        <P>
          Die <strong>Nettomietrendite</strong> berücksichtigt zusätzlich die Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler) sowie die laufenden, nicht umlagefähigen Kosten wie Hausgeld, Instandhaltungsrücklage und Verwaltung.
        </P>
        <Box title="Formel Nettomietrendite">
          Nettomietrendite (%) = ((Kaltmiete − laufende Kosten) × 12) / (Kaufpreis + Kaufnebenkosten) × 100
        </Box>
        <P>
          <strong>Beispiel:</strong> Gleiche Wohnung für 300.000 €, Kaufnebenkosten von 10 % (30.000 €), laufende Kosten von 150 € im Monat. Die Nettomietrendite beträgt dann ((900 − 150) × 12) / 330.000 × 100 = 2,7 %.
        </P>
        <P>
          Der Unterschied zwischen brutto und netto ist in diesem Beispiel fast ein ganzer Prozentpunkt — ein Unterschied, der über die Rentabilität einer Investition entscheiden kann.
        </P>
      </section>

      <section>
        <H2>Was ist eine gute Mietrendite?</H2>
        <P>
          Als grobe Orientierung gilt für die Nettomietrendite in Deutschland:
        </P>
        <Box>
          <div className="space-y-2">
            <div><strong>Ab 4 % netto:</strong> gilt als rentabel, häufig in B- und C-Lagen oder ländlichen Regionen erreichbar.</div>
            <div><strong>2–4 % netto:</strong> Durchschnitt in vielen deutschen Großstädten, besonders in gefragten A-Lagen.</div>
            <div><strong>Unter 2 % netto:</strong> in Toplagen wie München oder Hamburg keine Seltenheit — hier steht meist die Wertsteigerung im Vordergrund, nicht der laufende Ertrag.</div>
          </div>
        </Box>
        <P>
          Wichtig: Die Mietrendite allein sagt nichts über die Gesamtrendite einer Immobilie aus. Wertsteigerung, Steuervorteile durch AfA und Tilgungseffekte (Vermögensaufbau durch Kreditrückzahlung) kommen hinzu und werden oft unterschätzt.
        </P>
      </section>

      <section>
        <H2>Cash-on-Cash-Rendite: Die Rendite auf dein eingesetztes Kapital</H2>
        <P>
          Wer eine Immobilie fremdfinanziert, sollte zusätzlich die <strong>Cash-on-Cash-Rendite</strong> (auch Eigenkapitalrendite) betrachten. Sie zeigt, wie viel der jährliche Cashflow im Verhältnis zum eingesetzten Eigenkapital abwirft — und damit, wie effizient der Leverage-Effekt der Fremdfinanzierung wirkt.
        </P>
        <Box title="Formel Cash-on-Cash-Rendite">
          Cash-on-Cash-Rendite (%) = (Jahres-Cashflow / eingesetztes Eigenkapital) × 100
        </Box>
        <P>
          Diese Kennzahl kann deutlich höher liegen als die Nettomietrendite, wenn ein großer Teil des Kaufpreises fremdfinanziert wird — sie kann aber bei ungünstiger Finanzierung auch negativ werden, wenn die Kreditrate die Mieteinnahmen übersteigt.
        </P>
      </section>

      <section>
        <H2>Mietrendite in der Praxis: Was oft vergessen wird</H2>
        <H3>Leerstandsrisiko einkalkulieren</H3>
        <P>
          Die Formel rechnet mit 12 Monaten Vollvermietung. In der Realität kommt es zu Mieterwechseln, Renovierungen und gelegentlichem Leerstand. Erfahrene Investoren kalkulieren konservativ mit 1 Monat Leerstand pro Jahr.
        </P>
        <H3>Instandhaltungsrücklage realistisch ansetzen</H3>
        <P>
          Gerade bei älteren Gebäuden reicht eine pauschale Instandhaltungsrücklage von 1 €/m² oft nicht aus. Ein Blick in die letzten Eigentümerversammlungsprotokolle (bei ETW) oder eine technische Objektprüfung schützt vor bösen Überraschungen.
        </P>
        <H3>Regionale Unterschiede</H3>
        <P>
          Die erzielbare Mietrendite unterscheidet sich stark zwischen Metropole und Umland. Wer ausschließlich auf Rendite optimiert, findet oft in B-Lagen mit stabiler Nachfrage attraktivere Werte als in den gefragtesten A-Lagen.
        </P>
      </section>

      <section>
        <H2>Mietrendite vs. Gesamtrendite: Das große Bild</H2>
        <P>
          Die Mietrendite betrachtet nur den laufenden Ertrag — sie ignoriert zwei weitere Renditequellen, die bei Immobilien oft einen größeren Anteil am Vermögensaufbau haben als die Miete selbst.
        </P>
        <H3>Tilgung als erzwungenes Sparen</H3>
        <P>
          Bei fremdfinanzierten Immobilien zahlt der Mieter über die Kaltmiete indirekt einen Teil der Kredittilgung mit. Jeder getilgte Euro erhöht das Eigenkapital des Vermieters, unabhängig vom Cashflow. Über 20 Jahre Laufzeit kann die Tilgung den Vermögenszuwachs stärker treiben als die laufende Rendite.
        </P>
        <H3>Wertsteigerung</H3>
        <P>
          Historisch sind Immobilienpreise in deutschen Groß- und Mittelstädten über lange Zeiträume gestiegen, wenn auch nicht linear und nicht garantiert. Wer die Mietrendite isoliert betrachtet, unterschätzt in wertstabilen Lagen häufig die tatsächliche Gesamtrendite.
        </P>
        <Box title="Formel Gesamtrendite (vereinfacht)">
          Gesamtrendite ≈ Nettomietrendite + jährliche Tilgungsquote + erwartete Wertsteigerung p. a.
        </Box>
        <P>
          Diese Formel ist eine grobe Näherung, kein exakter Wert — Wertsteigerung lässt sich nicht seriös vorhersagen. Sie zeigt aber, warum eine Immobilie mit niedriger Mietrendite in einer stabilen A-Lage trotzdem eine attraktive Gesamtinvestition sein kann.
        </P>
      </section>

      <section>
        <H2>Mietrendite im Vergleich zu anderen Anlageformen</H2>
        <P>
          Ein häufiger Fehler ist, die Mietrendite direkt mit der Rendite eines ETF-Sparplans zu vergleichen. Das ist nur bedingt sinnvoll, weil beide Anlageformen unterschiedliche Risiko- und Ertragsprofile haben:
        </P>
        <Box>
          <div className="space-y-2">
            <div><strong>Immobilie:</strong> Leverage-Effekt durch Fremdfinanzierung möglich, laufender Cashflow, Steuervorteile (AfA), aber illiquide, klumpenrisikobehaftet und mit Instandhaltungsaufwand verbunden.</div>
            <div><strong>ETF/Aktien:</strong> hochliquide, breit diversifiziert, keine Instandhaltung — aber i. d. R. ohne Leverage zu vergleichbaren Konditionen wie bei einer Immobilienfinanzierung, keine laufenden Mieteinnahmen.</div>
          </div>
        </Box>
        <P>
          Die Mietrendite ist deshalb vor allem sinnvoll, um <strong>Immobilien untereinander</strong> zu vergleichen — als Vergleichsgröße zu anderen Anlageklassen taugt sie nur mit Einschränkungen.
        </P>
      </section>

      <section>
        <H2>Mietrendite bei möblierter Vermietung und WGs</H2>
        <P>
          Möblierte Wohnungen oder Zimmer in Wohngemeinschaften erzielen oft eine höhere Bruttomiete pro Quadratmeter als klassische Vermietung — teils 20–40 % mehr. Das erhöht die Mietrendite auf dem Papier deutlich. Dabei sollten zusätzliche Kosten und Aufwände nicht vergessen werden: höherer Verwaltungsaufwand durch häufigeren Mieterwechsel, Möblierungskosten inkl. Ersatzbeschaffung, sowie ein tendenziell höheres Leerstandsrisiko bei kürzeren Mietverhältnissen. Wer diese Faktoren realistisch einpreist, kommt oft auf eine Nettorendite, die näher an der klassischen Vermietung liegt als der erste Bruttoblick vermuten lässt.
        </P>
      </section>

      <section>
        <H2>Häufige Rechenfehler bei der Mietrendite</H2>
        <H3>Warmmiete statt Kaltmiete verwenden</H3>
        <P>
          Die Warmmiete enthält Betriebskosten, die im Regelfall an den Mieter durchgereicht werden und dem Vermieter nicht als Ertrag zufließen. In die Rendite-Formel gehört ausschließlich die Kaltmiete.
        </P>
        <H3>Kaufnebenkosten bei der Bruttomietrendite vergessen einzuordnen</H3>
        <P>
          Die Bruttomietrendite ist bewusst ohne Kaufnebenkosten definiert — das ist kein Fehler, sondern ihr Zweck als Schnellcheck. Der Fehler passiert, wenn die Bruttomietrendite als alleinige Entscheidungsgrundlage für den Kauf verwendet wird, ohne im nächsten Schritt die Nettomietrendite zu berechnen.
        </P>
        <H3>Sanierungsstau nicht in die Kaufpreis-Betrachtung einrechnen</H3>
        <P>
          Bei älteren Objekten mit anstehender Sanierung (Dach, Heizung, Fassade) sollte der voraussichtliche Sanierungsaufwand wie ein zusätzlicher Kaufpreisbestandteil behandelt werden — sonst wird die Rendite systematisch zu hoch ausgewiesen.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Die Bruttomietrendite eignet sich für die schnelle Vorauswahl, die Nettomietrendite für die realistische Einschätzung und die Cash-on-Cash-Rendite für die Bewertung der Finanzierungsstrategie. Wer zusätzlich Tilgung und Wertsteigerung im Blick behält, bekommt ein vollständigeres Bild der Gesamtrendite als jemand, der sich nur auf eine einzelne Zahl aus dem Exposé verlässt.
        </P>
        <P>
          Mit dem <a href="/mietrendite-rechner" className="text-indigo-600 font-semibold hover:underline">kostenlosen Mietrendite-Rechner</a> lassen sich alle drei Werte in Sekunden berechnen — inklusive Cashflow und Bewertung.
        </P>
      </section>
    </ArticleLayout>
  );
}
