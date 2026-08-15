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

const SAETZE = [
  ['Baden-Württemberg', '5,0 %'],
  ['Bayern', '3,5 %'],
  ['Berlin', '6,0 %'],
  ['Brandenburg', '6,5 %'],
  ['Bremen', '5,5 %'],
  ['Hamburg', '5,5 %'],
  ['Hessen', '6,0 %'],
  ['Mecklenburg-Vorpommern', '6,0 %'],
  ['Niedersachsen', '5,0 %'],
  ['Nordrhein-Westfalen', '6,5 %'],
  ['Rheinland-Pfalz', '5,0 %'],
  ['Saarland', '6,5 %'],
  ['Sachsen', '5,5 %'],
  ['Sachsen-Anhalt', '5,0 %'],
  ['Schleswig-Holstein', '6,5 %'],
  ['Thüringen', '5,0 %'],
];

export default function GrunderwerbsteuerGuide() {
  return (
    <ArticleLayout
      kategorie="Ratgeber"
      titel="Grunderwerbsteuer nach Bundesland: Sätze, Fälligkeit und Berechnung"
      untertitel="Die Grunderwerbsteuer liegt je nach Bundesland zwischen 3,5 % und 6,5 % des Kaufpreises — mit einer Übersicht aller 16 Bundesländer, wer sie zahlt und wann sie fällig wird."
      lesezeit="5"
      related={[
        { href: '/ratgeber/mietrendite-berechnen', titel: 'Mietrendite berechnen: Der komplette Guide' },
        { href: '/ratgeber/spekulationssteuer-immobilienverkauf', titel: 'Spekulationssteuer bei Immobilienverkauf' },
        { href: '/mietrendite-rechner', titel: 'Mietrendite-Rechner', kategorie: 'Rechner' },
        { href: '/grunderwerbsteuer-rechner', titel: 'Grunderwerbsteuer-Rechner', kategorie: 'Rechner' },
        { href: '/kaufnebenkosten-rechner', titel: 'Kaufnebenkosten-Rechner', kategorie: 'Rechner' },
      ]}
    >
      <section>
        <H2>Was ist die Grunderwerbsteuer?</H2>
        <P>
          Die <strong>Grunderwerbsteuer</strong> fällt beim Kauf eines Grundstücks oder einer Immobilie in Deutschland an und wird auf den vollständigen Kaufpreis (inklusive Grundstück) berechnet. Sie ist Teil der <strong>Kaufnebenkosten</strong> und damit ein direkter Faktor für die Nettomietrendite — wer sie bei der Kalkulation vergisst, überschätzt die tatsächliche Rendite eines Investments spürbar.
        </P>
      </section>

      <section>
        <H2>Grunderwerbsteuer nach Bundesland: Die Übersicht</H2>
        <P>
          Seit der Föderalismusreform 2006 legen die Bundesländer den Steuersatz selbst fest. Die Sätze reichen aktuell von 3,5 % bis 6,5 % — bei einem Kaufpreis von 500.000 € entspricht das einer Differenz von 15.000 € allein durch den Standort.
        </P>
        <Box title="Grunderwerbsteuersätze aller 16 Bundesländer (Stand: August 2026)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {SAETZE.map(([land, satz]) => (
              <div key={land} className="flex justify-between border-b border-gray-100 py-1">
                <span>{land}</span>
                <span className="font-bold text-slate-900">{satz}</span>
              </div>
            ))}
          </div>
        </Box>
        <P className="text-xs text-slate-400">
          Steuersätze können sich per Landesgesetz ändern (zuletzt z. B. Bremen zum 1. Juli 2025 von 5,0 % auf 5,5 % erhöht, Thüringen zum 1. Januar 2024 von 6,5 % auf 5,0 % gesenkt). Vor einem Kauf immer den aktuell gültigen Satz beim zuständigen Finanzamt oder Notar verifizieren.
        </P>
      </section>

      <section>
        <H2>Wer zahlt die Grunderwerbsteuer?</H2>
        <P>
          Gesetzlich schulden Käufer und Verkäufer die Grunderwerbsteuer gemeinsam (§ 13 GrEStG) — in der Praxis wird im Kaufvertrag aber so gut wie immer vereinbart, dass der <strong>Käufer</strong> die Steuer allein trägt. Das Finanzamt kann sich im Zweifel dennoch an beide Parteien halten, falls die Steuer nicht gezahlt wird.
        </P>
      </section>

      <section>
        <H2>Wann ist die Grunderwerbsteuer fällig?</H2>
        <P>
          Nach notarieller Beurkundung des Kaufvertrags meldet der Notar den Kauf automatisch dem zuständigen Finanzamt. Dieses versendet daraufhin den Steuerbescheid, üblicherweise vier bis acht Wochen nach Beurkundung. Die Zahlungsfrist beträgt in der Regel <strong>einen Monat</strong> nach Zugang des Bescheids. Erst nach vollständiger Zahlung stellt das Finanzamt die <strong>Unbedenklichkeitsbescheinigung</strong> aus — ohne diese erfolgt keine Grundbuchumschreibung, der Käufer wird also erst dann formal Eigentümer.
        </P>
      </section>

      <section>
        <H2>Grunderwerbsteuer sparen: Legale Gestaltungsmöglichkeiten</H2>
        <H3>Trennung von beweglichem Inventar</H3>
        <P>
          Bewegliche Gegenstände wie Einbauküche, Markise oder ein mitverkaufter Gartenschuppen unterliegen nicht der Grunderwerbsteuer, wenn sie im Kaufvertrag separat und mit einem realistischen, nachvollziehbaren Wert ausgewiesen werden. Bei unrealistisch hohen Ansätzen (reine Steuersparkonstrukte) kann das Finanzamt die Aufteilung anzweifeln.
        </P>
        <H3>Share Deals bei größeren Objekten</H3>
        <P>
          Bei größeren gewerblichen Immobilientransaktionen wird die Grunderwerbsteuer teils durch den Kauf von Gesellschaftsanteilen (statt der Immobilie direkt) umgangen — diese sogenannten Share Deals sind gesetzlich stark reguliert (§ 1 Abs. 2a/3/3a GrEStG) und für private Kapitalanleger in der Regel nicht relevant.
        </P>
      </section>

      <section>
        <H2>Grunderwerbsteuer in der Renditerechnung</H2>
        <P>
          Für die Nettomietrendite zählt die Grunderwerbsteuer zu den Kaufnebenkosten neben Notar- und Maklerkosten — zusammen liegen diese Nebenkosten je nach Bundesland und Maklerprovision häufig bei 8 bis 15 % des Kaufpreises. Wer nur mit der Bruttomietrendite plant und diese Kosten ignoriert, überschätzt die tatsächliche Rendite oft um einen ganzen Prozentpunkt oder mehr — besonders in Bundesländern mit hohem Steuersatz wie NRW oder Brandenburg.
        </P>
      </section>

      <section>
        <H2>Fazit</H2>
        <P>
          Die Grunderwerbsteuer unterscheidet sich je nach Bundesland um bis zu drei Prozentpunkte und sollte bei jedem Immobilienkauf von Anfang an in die Kalkulation einfließen — nicht erst beim Notartermin. Wer in mehreren Bundesländern investiert, sollte die jeweils aktuellen Sätze für jedes einzelne Objekt separat prüfen.
        </P>
        <P>
          Mit dem <a href="/mietrendite-rechner" className="text-indigo-600 font-semibold hover:underline">kostenlosen Mietrendite-Rechner</a> lässt sich die Nettomietrendite inklusive Kaufnebenkosten direkt berechnen.
        </P>
        <P className="text-xs text-slate-400">
          Dieser Artikel dient der allgemeinen Information und ersetzt keine individuelle steuerliche Beratung.
        </P>
      </section>
    </ArticleLayout>
  );
}
