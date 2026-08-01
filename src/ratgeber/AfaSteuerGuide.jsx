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

export default function AfaSteuerGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="AfA und Steuern bei Vermietung: Der Leitfaden für Vermieter"
      untertitel="Die AfA (Abschreibung für Abnutzung) erlaubt Vermietern, den Wertverlust einer Immobilie über Jahre steuerlich abzusetzen — mit AfA-Sätzen nach Baujahr, Sonder-AfA und den wichtigsten absetzbaren Werbungskosten."
      lesezeit="8"
      related={[
        { href: '/ratgeber/mietrendite-berechnen', titel: 'Mietrendite berechnen: Der komplette Guide' },
        { href: '/ratgeber/cashflow-bei-immobilien', titel: 'Cashflow bei Immobilien: Was Vermieter wissen müssen' },
      ]}
    >
      <section>
        <H2>Warum Steuern bei der Immobilienrendite mitentscheiden</H2>
        <P>
          Viele Investoren berechnen Mietrendite und Cashflow, vergessen dabei aber den steuerlichen Effekt der <strong>AfA (Absetzung für Abnutzung)</strong>. Dabei kann die AfA die tatsächliche Rendite spürbar erhöhen, weil sie das zu versteuernde Einkommen aus Vermietung und Verpachtung senkt — ohne dass tatsächlich Geld das Konto verlässt.
        </P>
      </section>

      <section>
        <H2>Was ist die AfA?</H2>
        <P>
          Die AfA bildet steuerlich ab, dass ein Gebäude über die Jahre an Wert verliert (Abnutzung). Vermieter dürfen deshalb jedes Jahr einen festen Prozentsatz des Gebäudewerts von den Mieteinnahmen abziehen — unabhängig davon, ob tatsächlich Reparaturen anfallen.
        </P>
        <Box title="Formel AfA">
          Jährliche AfA = Gebäudewert (Kaufpreis + Nebenkosten − Grundstücksanteil) × AfA-Satz
        </Box>
        <P>
          Wichtig: Nur der <strong>Gebäudeanteil</strong> ist abschreibbar, nicht der Grundstücksanteil. Grund und Boden nutzt sich steuerlich nicht ab. Fehlt eine vertragliche Aufteilung, orientiert sich das Finanzamt am Bodenrichtwert der Gemeinde — ein üblicher Grundstücksanteil liegt bei 15 bis 30 % des Kaufpreises, in Ballungsräumen auch höher.
        </P>
      </section>

      <section>
        <H2>Der AfA-Satz nach Baujahr</H2>
        <P>
          Der gesetzliche AfA-Satz (§ 7 Abs. 4 EStG) hängt vom Baujahr des Gebäudes ab:
        </P>
        <Box>
          <div className="space-y-2">
            <div><strong>3 % pro Jahr</strong> — für Neubauten mit Fertigstellung ab 2023 (rund 33 Jahre Abschreibungsdauer)</div>
            <div><strong>2 % pro Jahr</strong> — für Gebäude mit Baujahr ab 1925 (50 Jahre Abschreibungsdauer)</div>
            <div><strong>2,5 % pro Jahr</strong> — für Altbauten vor 1925 (40 Jahre Abschreibungsdauer)</div>
          </div>
        </Box>
        <P>
          <strong>Beispiel:</strong> Eine Wohnung mit Baujahr 2010 kostet 300.000 € zzgl. 10 % Kaufnebenkosten (330.000 € Gesamtkosten). Der Grundstücksanteil beträgt 20 %, der Gebäudeanteil also 80 % — das entspricht 264.000 €. Bei 2 % AfA ergibt sich eine jährliche Abschreibung von 5.280 €.
        </P>
      </section>

      <section>
        <H2>Sonder-AfA § 7b EStG für Neubau-Mietwohnungen</H2>
        <P>
          Für neu gebaute Mietwohnungen mit Bauantrag oder Bauanzeige ab 2023 gibt es zusätzlich zur linearen AfA eine <strong>Sonder-AfA von 5 % pro Jahr</strong> über die ersten vier Jahre — vorausgesetzt bestimmte Grenzen bei Baukosten (max. 5.200 €/m² Wohnfläche) und energetischer Effizienz (mindestens Effizienzhaus 55) werden eingehalten.
        </P>
        <P>
          In den ersten vier Jahren summiert sich die Abschreibung dann auf 3 % (linear) + 5 % (Sonder-AfA) = 8 % pro Jahr — ein erheblicher steuerlicher Vorteil, der die Rendite in der Anfangsphase deutlich verbessert.
        </P>
      </section>

      <section>
        <H2>Welche Werbungskosten kann ich als Vermieter absetzen?</H2>
        <P>
          Neben der AfA lassen sich weitere Kosten steuerlich als <strong>Werbungskosten</strong> geltend machen und mindern das zu versteuernde Einkommen:
        </P>
        <Box>
          <div className="space-y-2">
            <div><strong>Schuldzinsen</strong> — nur der Zinsanteil der Kreditrate, nicht die Tilgung</div>
            <div><strong>Erhaltungsaufwand</strong> — Reparaturen und Instandhaltung, die den ursprünglichen Zustand wiederherstellen (sofort in voller Höhe absetzbar)</div>
            <div><strong>Verwaltungskosten</strong> — Hausverwaltung, Steuerberater für die Immobilie</div>
            <div><strong>Fahrtkosten</strong> — Fahrten zur Immobilie mit der Kilometerpauschale</div>
            <div><strong>Hausgeld-Anteile</strong> — der nicht umlagefähige Teil des Hausgelds bei Eigentumswohnungen</div>
          </div>
        </Box>
        <H3>Erhaltungsaufwand vs. Herstellungskosten</H3>
        <P>
          Diese Unterscheidung ist steuerlich entscheidend: <strong>Erhaltungsaufwand</strong> (z. B. Austausch einer defekten Heizung) ist sofort in voller Höhe absetzbar. <strong>Herstellungskosten</strong> (z. B. eine grundlegende Modernisierung, die den Standard der Wohnung deutlich anhebt) müssen über die AfA verteilt über die Nutzungsdauer abgeschrieben werden. Bei größeren Sanierungen lohnt sich vorab eine steuerliche Einordnung durch den Steuerberater.
        </P>
      </section>

      <section>
        <H2>Steuerersparnis durch AfA berechnen</H2>
        <Box title="Formel Steuerersparnis">
          Steuerersparnis pro Jahr = jährliche AfA × persönlicher Grenzsteuersatz
        </Box>
        <P>
          <strong>Beispiel:</strong> Bei einer jährlichen AfA von 5.280 € und einem Grenzsteuersatz von 42 % ergibt sich eine Steuerersparnis von 2.218 € pro Jahr — Geld, das den Cashflow der Immobilie effektiv verbessert, ohne dass tatsächlich Kosten anfallen.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Die AfA ist einer der am meisten unterschätzten Hebel bei der Immobilienrendite. Wer Gebäudewert, AfA-Satz und persönlichen Steuersatz kennt, kann die tatsächliche Rendite nach Steuern realistisch einschätzen — und trifft bessere Kaufentscheidungen als jemand, der nur auf Mietrendite und Cashflow schaut.
        </P>
        <P>
          Mit dem <a href="/afa-rechner" className="text-indigo-600 font-semibold hover:underline">kostenlosen AfA-Rechner</a> lassen sich jährliche Abschreibung und Steuerersparnis in Sekunden berechnen.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle steuerliche Beratung. Bitte lass deine konkrete Situation von einem Steuerberater prüfen.
        </P>
      </section>
    </ArticleLayout>
  );
}
