// Daten für die Städte-Vergleichsseiten (programmatic SEO, Stufe 2)
// Baut auf src/staedte/staedteDaten.js auf (gleiche Quelle: Engel & Völkers
// Marktbericht Deutschland, Stand Juni 2026). Kuratierte Auswahl statt aller
// 45 möglichen Städtepaare — nur Kombinationen mit echtem Vergleichs-
// Suchinteresse, jede mit eigenem, redaktionellem Text und eigenen FAQ.

import { STAEDTE } from './staedteDaten.js';

export const VERGLEICHE = [
  {
    slugA: 'berlin',
    slugB: 'leipzig',
    text: 'Berlin und Leipzig werden von Kapitalanlegern häufig gegeneinander abgewogen — die Hauptstadt mit hoher Liquidität und stabiler Nachfrage gegen die deutlich günstigere ostdeutsche Metropole. Beim Kaufpreis liegt Leipzig mit rund 3.858 €/m² erheblich unter Berlin (rund 5.300 €/m²), während die Bruttomietrendite in beiden Städten mit etwa 3,8–4,2 % nah beieinander liegt. Wer mit begrenztem Eigenkapital einsteigen will, kommt in Leipzig für den gleichen Betrag deutlich weiter. Berlin punktet dagegen mit größerer Marktliquidität, einem breiteren Angebot und aus Investorensicht geringerem Klumpenrisiko, da die Stadt wirtschaftlich diversifizierter aufgestellt ist als Leipzig.',
    faq: [
      { q: 'Ist Berlin oder Leipzig die bessere Kapitalanlage?', a: 'Das hängt vom verfügbaren Kapital ab: Leipzig ermöglicht mit rund 3.858 €/m² einen deutlich günstigeren Einstieg bei ähnlicher Bruttomietrendite. Berlin bietet dafür mehr Marktliquidität und eine breiter diversifizierte Wirtschaft.' },
      { q: 'Wie unterscheiden sich die Mietrenditen zwischen Berlin und Leipzig?', a: 'Berlin liegt bei rund 4,2 % Bruttomietrendite, Leipzig bei rund 3,8 % — die Differenz ist gering, der große Unterschied liegt beim absoluten Kapitaleinsatz pro Quadratmeter.' },
    ],
  },
  {
    slugA: 'berlin',
    slugB: 'hamburg',
    text: 'Berlin und Hamburg sind die beiden größten und liquidesten Immobilienmärkte im Norden und Osten Deutschlands. Die Kaufpreise liegen mit rund 5.300 €/m² in Berlin und rund 5.720 €/m² in Hamburg nah beieinander, ebenso die Kaltmieten (18,53 € bzw. 18,32 € pro m²). Die Bruttomietrendite fällt in Berlin mit rund 4,2 % etwas höher aus als in Hamburg mit rund 3,8 %, da Hamburgs begrenztes Bauland die Kaufpreise stärker treibt als die Mieten. Für Kapitalanleger ist Berlin damit tendenziell die etwas ertragsstärkere, Hamburg die wertstabilere Wahl — geprägt von der wirtschaftlich robusten Hafenstadt-Ökonomie.',
    faq: [
      { q: 'Welche Stadt hat die höhere Mietrendite: Berlin oder Hamburg?', a: 'Berlin, mit rund 4,2 % gegenüber rund 3,8 % in Hamburg. Der Unterschied ergibt sich vor allem aus Hamburgs begrenztem Bauland, das die Kaufpreise stärker antreibt als die Mieten.' },
      { q: 'Sind die Kaufpreise in Berlin und Hamburg vergleichbar?', a: 'Ja, mit rund 5.300 €/m² in Berlin und rund 5.720 €/m² in Hamburg liegen beide Städte in einer ähnlichen Preisklasse, deutlich unter München, aber über den meisten anderen deutschen Großstädten.' },
    ],
  },
  {
    slugA: 'muenchen',
    slugB: 'frankfurt',
    text: 'München und Frankfurt zählen zu den teuersten Immobilienmärkten Deutschlands, unterscheiden sich aber deutlich in der Preisklasse: München liegt mit rund 8.398 €/m² mit Abstand an der Spitze aller deutschen Großstädte, Frankfurt mit rund 5.919 €/m² spürbar darunter. Die Bruttomietrendite fällt entsprechend aus — München mit rund 3,1 % die niedrigste unter allen Tier-1-Städten, Frankfurt mit rund 3,5 % etwas darüber. Frankfurt profitiert von seiner Rolle als Finanzmetropole mit zahlungskräftiger, aber auch mobiler Mieterschaft, während München historisch die wertstabilste deutsche Großstadt ist. Für reine Renditeinvestoren sind beide Märkte anspruchsvoll, für wertsteigerungsorientierte Strategien attraktiv.',
    faq: [
      { q: 'Warum ist München teurer als Frankfurt?', a: 'München hat mit rund 8.398 €/m² die höchsten Kaufpreise aller deutschen Großstädte, deutlich über Frankfurt (rund 5.919 €/m²). Das begrenzte Bauland und die anhaltend hohe Nachfrage treiben die Preise in München stärker als in Frankfurt.' },
      { q: 'Welche Stadt eignet sich besser für Kapitalanleger: München oder Frankfurt?', a: 'Frankfurt bietet mit rund 3,5 % eine etwas höhere Bruttomietrendite als München mit rund 3,1 %. Beide Städte eignen sich eher für wertsteigerungsorientierte Investoren als für reine Cashflow-Strategien.' },
    ],
  },
  {
    slugA: 'koeln',
    slugB: 'duesseldorf',
    text: 'Köln und Düsseldorf liegen als benachbarte NRW-Metropolen naturgemäß im direkten Vergleich. Köln ist mit rund 4.632 €/m² spürbar günstiger im Einkauf als Düsseldorf mit rund 5.641 €/m², während die Kaltmieten mit 15,94 € bzw. 17,71 € pro m² ebenfalls zugunsten Kölns ausfallen. In der Bruttomietrendite liegt Köln mit rund 4,1 % leicht vor Düsseldorf mit rund 3,8 %. Düsseldorf punktet dafür mit seiner Rolle als internationaler Wirtschaftsstandort mit Mode-, Werbe- und Finanzbranche sowie einer besonders zahlungskräftigen Mieterschaft, während Köln von Medienbranche, Universität und einer jungen, wachsenden Bevölkerung profitiert.',
    faq: [
      { q: 'Ist Köln oder Düsseldorf die rentablere Kapitalanlage?', a: 'Köln liegt mit rund 4,1 % Bruttomietrendite leicht vor Düsseldorf mit rund 3,8 % — bei gleichzeitig niedrigeren Kaufpreisen (Ø 4.632 €/m² vs. Ø 5.641 €/m²).' },
      { q: 'Was macht Düsseldorf als Investmentstandort attraktiv, obwohl die Rendite niedriger ist?', a: 'Düsseldorf profitiert von einer besonders zahlungskräftigen, international geprägten Mieterschaft durch Mode-, Werbe- und Finanzbranche, was für stabile Vermietbarkeit und Wertsteigerung spricht.' },
    ],
  },
  {
    slugA: 'dortmund',
    slugB: 'essen',
    text: 'Dortmund und Essen sind die beiden renditestärksten unter den zehn größten deutschen Städten — beide profitieren vom Strukturwandel des Ruhrgebiets weg von der Montanindustrie hin zu Dienstleistung, Logistik und Wissenschaft. Essen liegt mit rund 4,6 % Bruttomietrendite hauchdünn vor Dortmund mit rund 4,5 %, bei ähnlich niedrigen Kaufpreisen (Ø 3.647 €/m² bzw. Ø 3.314 €/m²). Essen profitiert zusätzlich von seinem Grüngürtel und mehreren DAX-Unternehmenssitzen, Dortmund von der TU Dortmund und einer wachsenden IT-Branche. Für Cashflow-orientierte Kapitalanleger zählen beide Städte zu den attraktivsten Tier-1-Standorten in Deutschland, erfordern aber eine sorgfältige Lageauswahl innerhalb der Stadt.',
    faq: [
      { q: 'Welche Stadt hat die höhere Mietrendite: Dortmund oder Essen?', a: 'Essen liegt mit rund 4,6 % hauchdünn vor Dortmund mit rund 4,5 % — beide Städte haben die höchste Bruttomietrendite unter den zehn größten deutschen Städten.' },
      { q: 'Warum sind die Mietrenditen im Ruhrgebiet so hoch?', a: 'Die Kaufpreise liegen in Dortmund und Essen deutlich unter dem Bundesdurchschnitt, während das Mietniveau im Verhältnis dazu vergleichsweise hoch ist — ein Erbe der industriellen Vergangenheit und des anschließenden Strukturwandels.' },
    ],
  },
  {
    slugA: 'stuttgart',
    slugB: 'muenchen',
    text: 'Stuttgart und München stehen beide für wirtschaftlich starke süddeutsche Regionen, unterscheiden sich aber deutlich im Preisniveau. München liegt mit rund 8.398 €/m² mit weitem Abstand über Stuttgart (rund 5.346 €/m²), während die Bruttomietrendite in Stuttgart mit rund 3,8 % spürbar über der Münchens mit rund 3,1 % liegt. Stuttgart profitiert von einer der stärksten Industrieregionen Europas — Automobilbau und Maschinenbau sichern hohe Kaufkraft und stabile Mietnachfrage, bei deutlich moderateren Einstiegspreisen als in München. Für Kapitalanleger, die süddeutsche Wirtschaftsstärke suchen, aber nicht die höchsten Kaufpreise Deutschlands zahlen wollen, ist Stuttgart oft die bessere Wahl.',
    faq: [
      { q: 'Ist Stuttgart eine günstigere Alternative zu München?', a: 'Ja, deutlich: Stuttgart liegt mit rund 5.346 €/m² klar unter München (rund 8.398 €/m²), bei gleichzeitig höherer Bruttomietrendite von rund 3,8 % gegenüber rund 3,1 % in München.' },
      { q: 'Welche Stadt hat die stärkere Wirtschaft: Stuttgart oder München?', a: 'Beide Städte gehören zu den wirtschaftsstärksten Deutschlands. Stuttgart ist stark auf Automobilbau und Maschinenbau fokussiert, München breiter diversifiziert mit Technologie, Versicherungen und Medien.' },
    ],
  },
  {
    slugA: 'leipzig',
    slugB: 'dortmund',
    text: 'Leipzig und Dortmund zählen beide zu den günstigeren, renditestärkeren deutschen Großstädten — allerdings mit unterschiedlichem Profil. Dortmund bietet mit rund 4,5 % die höhere Bruttomietrendite bei niedrigeren Kaufpreisen (Ø 3.314 €/m²) als Leipzig (Ø 3.858 €/m², rund 3,8 % Rendite). Leipzig punktet dafür mit einem florierenden Kreativ- und Startup-Ökosystem sowie stärkerem Bevölkerungswachstum der letzten Jahre, während Dortmund vom Strukturwandel des Ruhrgebiets und der TU Dortmund profitiert. Für reine Cashflow-Strategien liegt Dortmund vorn, für Wertsteigerungspotenzial durch anhaltenden Zuzug spricht einiges für Leipzig.',
    faq: [
      { q: 'Ist Leipzig oder Dortmund die bessere Wahl für Kapitalanleger?', a: 'Dortmund bietet mit rund 4,5 % die höhere Bruttomietrendite bei niedrigeren Kaufpreisen. Leipzig punktet dafür mit stärkerem Bevölkerungswachstum und einem wachsenden Kreativ- und Startup-Sektor, was für zusätzliches Wertsteigerungspotenzial spricht.' },
      { q: 'Wie unterscheiden sich die Kaufpreise zwischen Leipzig und Dortmund?', a: 'Dortmund ist mit rund 3.314 €/m² günstiger als Leipzig mit rund 3.858 €/m² — beide liegen aber deutlich unter dem Niveau westdeutscher Metropolen wie Hamburg oder München.' },
    ],
  },
  {
    slugA: 'hamburg',
    slugB: 'muenchen',
    text: 'Hamburg und München sind neben Frankfurt die teuersten deutschen Großstädte, München dabei mit deutlichem Abstand die teuerste (Ø 8.398 €/m²) vor Hamburg (Ø 5.720 €/m²). Bei der Bruttomietrendite liegt Hamburg mit rund 3,8 % über München mit rund 3,1 % — in beiden Städten begrenzt jedoch knappes Bauland das Angebot und treibt die Kaufpreise stärker als die Mieten. Hamburg profitiert von seiner Hafenstadt-Ökonomie mit diversifizierter Wirtschaft, München von einer besonders wertstabilen Marktlage mit Technologie-, Versicherungs- und Medienunternehmen. Beide Städte eignen sich vor allem für langfristig orientierte Investoren mit Fokus auf Kapitalerhalt statt schnellem Cashflow.',
    faq: [
      { q: 'Welche Stadt ist teurer: Hamburg oder München?', a: 'München, mit rund 8.398 €/m² deutlich über Hamburg (rund 5.720 €/m²) — München ist die teuerste deutsche Großstadt überhaupt.' },
      { q: 'Wo ist die Mietrendite höher: Hamburg oder München?', a: 'In Hamburg, mit rund 3,8 % gegenüber rund 3,1 % in München. Beide Werte liegen im unteren Bereich des deutschen Städtevergleichs, da knappes Bauland die Kaufpreise in beiden Metropolen stark treibt.' },
    ],
  },
  {
    slugA: 'berlin',
    slugB: 'muenchen',
    text: 'Berlin und München sind die beiden bekanntesten deutschen Städte, unterscheiden sich als Investmentstandort aber grundlegend. München ist mit rund 8.398 €/m² die teuerste deutsche Großstadt, Berlin mit rund 5.300 €/m² deutlich günstiger im Einkauf. Die Bruttomietrendite liegt in Berlin mit rund 4,2 % spürbar über München mit rund 3,1 % — dem niedrigsten Wert aller Tier-1-Städte. München gilt dafür historisch als besonders wertstabil und fiel selbst in Abschwungphasen moderater als andere Metropolen. Berlin bietet Kapitalanlegern das bessere Verhältnis aus Einstiegspreis und laufendem Ertrag, München eher eine Strategie des langfristigen Kapitalerhalts mit hohem Eigenkapitalanteil.',
    faq: [
      { q: 'Ist Berlin oder München die bessere Kapitalanlage?', a: 'Für laufenden Cashflow spricht mehr für Berlin (rund 4,2 % Bruttomietrendite bei Ø 5.300 €/m²). München (rund 3,1 % Rendite bei Ø 8.398 €/m²) eignet sich eher für wertsteigerungsorientierte Strategien mit hohem Eigenkapitalanteil.' },
      { q: 'Warum ist die Mietrendite in München niedriger als in Berlin?', a: 'Weil die Kaufpreise in München im Verhältnis zu den Mieten besonders hoch sind — die Stadt ist mit Abstand die teuerste in Deutschland, während die Mieten zwar ebenfalls hoch, aber nicht proportional mitgezogen sind.' },
    ],
  },
  {
    slugA: 'frankfurt',
    slugB: 'duesseldorf',
    text: 'Frankfurt und Düsseldorf sind beide internationale Wirtschafts-Hubs mit überdurchschnittlich zahlungskräftiger Mieterschaft — Frankfurt geprägt vom Bankensektor, Düsseldorf von Mode-, Werbe- und internationalen Unternehmen, insbesondere aus Japan. Die Kaufpreise liegen mit rund 5.919 €/m² in Frankfurt und rund 5.641 €/m² in Düsseldorf nah beieinander, ebenso die Bruttomietrendite mit rund 3,5 % bzw. rund 3,8 %. Düsseldorf liegt damit leicht vor Frankfurt. Beide Städte profitieren von kompakter Größe, guter internationaler Anbindung und hoher Vermietbarkeit bei ÖPNV-naher Lage, eignen sich aber wegen der hohen Einstiegspreise eher für Investoren mit Fokus auf stabile Vermietbarkeit als für maximale Rendite.',
    faq: [
      { q: 'Welche Stadt hat die höhere Mietrendite: Frankfurt oder Düsseldorf?', a: 'Düsseldorf liegt mit rund 3,8 % leicht vor Frankfurt mit rund 3,5 % — beide Werte liegen im unteren Mittelfeld des deutschen Städtevergleichs.' },
      { q: 'Was haben Frankfurt und Düsseldorf als Investmentstandort gemeinsam?', a: 'Beide sind kompakte, international ausgerichtete Wirtschafts-Hubs mit zahlungskräftiger Mieterschaft — Frankfurt geprägt vom Bankensektor, Düsseldorf von Mode-, Werbe- und internationalen Unternehmen.' },
    ],
  },
];

export function getVergleich(slugA, slugB) {
  const pair = VERGLEICHE.find(
    (v) => (v.slugA === slugA && v.slugB === slugB) || (v.slugA === slugB && v.slugB === slugA)
  );
  if (!pair) return null;
  const a = STAEDTE[pair.slugA];
  const b = STAEDTE[pair.slugB];
  if (!a || !b) return null;
  return { ...pair, a, b };
}
