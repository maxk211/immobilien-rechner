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
        { href: '/ratgeber/afa-und-steuern-vermietung', titel: 'AfA und Steuern bei Vermietung: Der Leitfaden' },
        { href: '/mietrendite-staedte', titel: 'Mietrendite Deutschland: Die 10 größten Städte im Vergleich', kategorie: 'Städtevergleich' },
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
        <H2>Fazit</H2>
        <P>
          Die Bruttomietrendite eignet sich für die schnelle Vorauswahl, die Nettomietrendite für die realistische Einschätzung und die Cash-on-Cash-Rendite für die Bewertung der Finanzierungsstrategie. Wer alle drei Kennzahlen kennt, trifft fundiertere Kaufentscheidungen als jemand, der sich nur auf eine einzelne Zahl aus dem Exposé verlässt.
        </P>
        <P>
          Mit dem <a href="/mietrendite-rechner" className="text-indigo-600 font-semibold hover:underline">kostenlosen Mietrendite-Rechner</a> lassen sich alle drei Werte in Sekunden berechnen — inklusive Cashflow und Bewertung.
        </P>
      </section>
    </ArticleLayout>
  );
}
