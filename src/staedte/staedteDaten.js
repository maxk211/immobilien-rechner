// Marktdaten für die Städte-Seiten (programmatic SEO)
// Quelle: Engel & Völkers Marktbericht Deutschland, Stand Juni 2026 (Angebotspreise, 35 Mio. Immobiliendaten)
// kaufpreisM2 / mieteM2 = Ø Angebotspreis Eigentumswohnung bzw. Ø Angebots-Kaltmiete Neuvermietung

const fmt1 = (n) => n.toFixed(1).replace('.', ',');

function berechneStadt(daten) {
  const { kaufpreisM2, mieteM2 } = daten;
  const brutto = (mieteM2 * 12) / kaufpreisM2 * 100;
  return { ...daten, bruttorendite: Number(fmt1(brutto).replace(',', '.')) };
}

export const STAEDTE = {
  berlin: berechneStadt({
    slug: 'berlin',
    name: 'Berlin',
    kaufpreisM2: 5300,
    mieteM2: 18.53,
    text: 'Berlin bleibt der mit Abstand meistgehandelte Immobilienmarkt Deutschlands — hohe Liquidität, stabile Nachfrage durch stetigen Zuzug, aber auch ein politisch sensibles Pflaster: Mietendeckel-Debatten und Milieuschutz sorgen immer wieder für Unsicherheit bei Investoren. Die Bruttomietrendite liegt im Mittelfeld der deutschen Großstädte, was Berlin zu einem soliden, aber nicht spektakulären Renditeobjekt macht. Attraktiver wird die Stadt durch die Aussicht auf weitere Wertsteigerung: Berlin holt im europäischen Vergleich der Metropolen-Kaufpreise noch auf. Wer auf Cashflow aus ist, findet in Außenbezirken wie Marzahn-Hellersdorf oder Spandau deutlich bessere Renditen als in Prenzlauer Berg oder Mitte — dort dominiert die Wertsteigerungsstrategie.',
    faq: [
      { q: 'Ist Berlin 2026 noch für Kapitalanleger interessant?', a: 'Ja, aber eher für wertsteigerungsorientierte Investoren als für reine Cashflow-Strategien. Die Bruttomietrendite liegt bei rund 4,2 % — solide, aber nicht spektakulär. Wer höhere laufende Erträge sucht, sollte gezielt in Außenbezirke schauen.' },
      { q: 'In welchen Berliner Bezirken ist die Mietrendite am höchsten?', a: 'Tendenziell in östlichen und südöstlichen Außenbezirken wie Marzahn-Hellersdorf, Lichtenberg oder Spandau, wo die Kaufpreise deutlich niedriger sind als in Prenzlauer Berg, Mitte oder Charlottenburg, während die Mieten proportional weniger stark abfallen.' },
    ],
  }),
  hamburg: berechneStadt({
    slug: 'hamburg',
    name: 'Hamburg',
    kaufpreisM2: 5720,
    mieteM2: 18.32,
    text: 'Hamburg kombiniert eine wirtschaftlich robuste Hafenstadt-Ökonomie mit begrenztem Bauland — das treibt die Kaufpreise seit Jahren nach oben, während das Mietniveau ähnlich hoch wie in Berlin liegt. Die Bruttomietrendite bewegt sich im unteren Mittelfeld, typisch für eine gefragte Metropole mit stabiler, wohlhabender Mieterschaft. Besonders gefragt bei Kapitalanlegern sind die HafenCity und angrenzende Szeneviertel wie Altona oder Eimsbüttel, wo Wertsteigerung und Vermietbarkeit Hand in Hand gehen. Wer höhere Renditen sucht, wird eher im Hamburger Umland oder in Stadtteilen wie Wilhelmsburg fündig — dort sind Einstiegspreise deutlich niedriger bei vergleichsweise soliden Mieten.',
    faq: [
      { q: 'Lohnt sich der Kauf einer Eigentumswohnung in Hamburg als Kapitalanlage?', a: 'Für Wertsteigerung ja, für hohe laufende Rendite eher bedingt. Bei einer Bruttomietrendite von rund 3,8 % steht in Hamburg meist die langfristige Substanzsicherung im Vordergrund, nicht der schnelle Cashflow.' },
      { q: 'Wie unterscheiden sich die Mietrenditen zwischen Hamburger Stadtteilen?', a: 'In zentralen, etablierten Lagen wie Eimsbüttel oder Altona sind die Kaufpreise hoch und die Rendite entsprechend niedriger. Stadtteile wie Wilhelmsburg oder Harburg bieten günstigere Einstiegspreise und damit tendenziell höhere Renditen.' },
    ],
  }),
  muenchen: berechneStadt({
    slug: 'muenchen',
    name: 'München',
    kaufpreisM2: 8398,
    mieteM2: 21.71,
    text: 'München ist und bleibt die teuerste Großstadt Deutschlands — mit Abstand. Die Kaufpreise pro Quadratmeter liegen fast 60 % über dem Bundesdurchschnitt, während die Mieten zwar ebenfalls hoch, aber im Verhältnis zum Kaufpreis nicht proportional mitgezogen sind. Das drückt die Bruttomietrendite auf das niedrigste Niveau aller Tier-1-Städte. Wer in München kauft, tut das in der Regel nicht wegen des laufenden Cashflows, sondern wegen der außergewöhnlichen Wertstabilität: München fiel selbst in Abschwungphasen historisch moderater als andere Metropolen. Für Renditeinvestoren mit begrenztem Kapital ist München daher meist der falsche Markt — hier zählt eher der langfristige Vermögensaufbau als der monatliche Überschuss.',
    faq: [
      { q: 'Warum ist die Mietrendite in München so niedrig?', a: 'Weil die Kaufpreise (Ø 8.398 €/m²) im Verhältnis zu den Mieten (Ø 21,71 €/m²) besonders hoch sind. Mit rund 3,1 % Bruttomietrendite ist München die renditeschwächste der zehn größten deutschen Städte — dafür historisch besonders wertstabil.' },
      { q: 'Für wen eignet sich eine Immobilie in München als Investment?', a: 'Eher für Investoren mit Fokus auf Wertsteigerung und Kapitalerhalt als für Cashflow-orientierte Anleger. München eignet sich gut für langfristige Strategien mit hohem Eigenkapitalanteil.' },
    ],
  }),
  koeln: berechneStadt({
    slug: 'koeln',
    name: 'Köln',
    kaufpreisM2: 4632,
    mieteM2: 15.94,
    text: 'Köln zählt zu den attraktivsten Investmentstandorten unter den deutschen Millionenstädten: Die Kaufpreise liegen spürbar unter Düsseldorf oder Frankfurt, während die Mietnachfrage durch Universität, Medienbranche und eine junge, wachsende Bevölkerung konstant hoch bleibt. Das Ergebnis ist eine Bruttomietrendite im oberen Mittelfeld der Tier-1-Städte — ein gutes Verhältnis aus Sicherheit und Ertrag. Besonders gefragte Lagen wie das Belgische Viertel oder Ehrenfeld haben in den letzten Jahren stark an Wert gewonnen, bieten aber inzwischen geringere Einstiegsrenditen. Rechtsrheinische Stadtteile wie Kalk oder Mülheim sind für renditeorientierte Käufer oft der bessere Einstieg.',
    faq: [
      { q: 'Ist Köln ein guter Standort für Immobilieninvestments?', a: 'Ja — mit einer Bruttomietrendite von rund 4,1 % gehört Köln zu den rentableren deutschen Großstädten, bei gleichzeitig stabiler Nachfrage durch Studierende, Medienbranche und Zuzug.' },
      { q: 'Welche Kölner Stadtteile bieten die beste Mietrendite?', a: 'Rechtsrheinische Lagen wie Kalk, Mülheim oder Deutz sind meist günstiger im Einkauf als das Belgische Viertel oder die Südstadt und bieten dadurch oft höhere Renditen bei solider Mietnachfrage.' },
    ],
  }),
  frankfurt: berechneStadt({
    slug: 'frankfurt',
    name: 'Frankfurt am Main',
    kaufpreisM2: 5919,
    mieteM2: 17.17,
    text: 'Frankfurt lebt vom Finanzsektor: Banken, Versicherungen und internationale Konzerne sorgen für eine überdurchschnittlich zahlungskräftige, aber auch international mobile Mieterschaft. Das treibt sowohl Kauf- als auch Mietpreise nach oben, wobei die Bruttomietrendite im unteren Mittelfeld der Großstädte liegt. Die Nähe zum Flughafen und die kompakte Größe der Stadt sorgen für kurze Wege und hohe Vermietbarkeit, insbesondere bei Wohnungen mit guter ÖPNV-Anbindung. Stadtteile wie Bockenheim oder das Gallusviertel bieten Investoren ein gutes Verhältnis aus Nachfrage und Einstiegspreis, während das Westend und Sachsenhausen für Kapitalanleger meist zu teuer für attraktive Renditen sind.',
    faq: [
      { q: 'Wie hoch ist die durchschnittliche Mietrendite in Frankfurt?', a: 'Die Bruttomietrendite liegt bei rund 3,5 % — geprägt von hohen Kaufpreisen durch die starke Nachfrage aus dem Banken- und Finanzsektor.' },
      { q: 'Welche Frankfurter Stadtteile sind für Kapitalanleger interessant?', a: 'Bockenheim, das Gallusviertel und Teile von Bornheim bieten häufig ein besseres Preis-Miet-Verhältnis als die Premiumlagen Westend oder Sachsenhausen.' },
    ],
  }),
  stuttgart: berechneStadt({
    slug: 'stuttgart',
    name: 'Stuttgart',
    kaufpreisM2: 5346,
    mieteM2: 16.72,
    text: 'Stuttgart profitiert von einer der stärksten Industrieregionen Europas — Automobilbau und Maschinenbau sichern hohe Kaufkraft und stabile Beschäftigung, was sich in konstant hoher Mietnachfrage niederschlägt. Die Bruttomietrendite bewegt sich im Mittelfeld der deutschen Großstädte. Die Kessellage Stuttgarts begrenzt die Bauflächen strukturell, was Neubau erschwert und Bestandsimmobilien tendenziell stützt. Für Kapitalanleger sind vor allem die äußeren Stadtbezirke sowie das direkte Umland (Esslingen, Ludwigsburg, Waiblingen) interessant, wo die Kaufpreise deutlich niedriger liegen als in der Innenstadt, die Mietnachfrage durch Pendler aber ähnlich stabil bleibt.',
    faq: [
      { q: 'Ist Stuttgart eine gute Stadt für Immobilieninvestments?', a: 'Mit einer Bruttomietrendite von rund 3,8 % und einer sehr stabilen, industriegetriebenen Wirtschaft ist Stuttgart ein solider, wenig volatiler Investmentstandort.' },
      { q: 'Wo lohnt sich der Immobilienkauf rund um Stuttgart am meisten?', a: 'Das direkte Umland — etwa Esslingen, Ludwigsburg oder Waiblingen — bietet oft ein besseres Preis-Miet-Verhältnis als die Innenstadt, bei weiterhin stabiler Nachfrage durch Berufspendler.' },
    ],
  }),
  duesseldorf: berechneStadt({
    slug: 'duesseldorf',
    name: 'Düsseldorf',
    kaufpreisM2: 5641,
    mieteM2: 17.71,
    text: 'Düsseldorf ist als Landeshauptstadt von Nordrhein-Westfalen und internationaler Wirtschaftsstandort (Mode, Werbung, japanische Unternehmen) ein gefragter, aber auch teurer Markt. Die Bruttomietrendite liegt im Mittelfeld der Großstädte. Besonders die Altstadt, der Medienhafen und Stadtteile wie Pempelfort sind bei Käufern begehrt, was die Einstiegsrenditen dort drückt. Interessanter für renditeorientierte Investoren sind Stadtteile wie Gerresheim, Eller oder Garath, die von der guten Infrastruktur der Stadt profitieren, aber deutlich günstiger im Einkauf sind. Die Nähe zu Köln und dem Ruhrgebiet macht die gesamte Region für Investoren mit Diversifikationsstrategie interessant.',
    faq: [
      { q: 'Wie ist die Mietrendite in Düsseldorf im Städtevergleich einzuordnen?', a: 'Mit rund 3,8 % Bruttomietrendite liegt Düsseldorf im Mittelfeld der deutschen Großstädte — solide, aber durch die hohe Nachfrage aus der Wirtschaft nicht besonders günstig im Einkauf.' },
      { q: 'Welche Stadtteile eignen sich in Düsseldorf für Kapitalanleger?', a: 'Gerresheim, Eller und Garath bieten günstigere Einstiegspreise als die Altstadt oder Pempelfort, bei weiterhin guter Anbindung an die Innenstadt.' },
    ],
  }),
  leipzig: berechneStadt({
    slug: 'leipzig',
    name: 'Leipzig',
    kaufpreisM2: 3858,
    mieteM2: 12.21,
    text: 'Leipzig war über Jahre einer der beliebtesten Investmentstandorte Deutschlands — niedrige Einstiegspreise, wachsende Bevölkerung und ein florierendes Kreativ- und Startup-Ökosystem lockten viele Kapitalanleger an. Inzwischen sind die Preise deutlich gestiegen, liegen aber immer noch klar unter westdeutschen Metropolen, während das Mietniveau proportional mitgezogen hat. Die Bruttomietrendite bewegt sich im soliden Mittelfeld. Stadtteile wie Plagwitz oder Connewitz haben sich vom Geheimtipp zum etablierten Szeneviertel entwickelt, während Grünau oder Paunsdorf für Cashflow-orientierte Investoren weiterhin attraktive Einstiegspreise bieten.',
    faq: [
      { q: 'Ist Leipzig 2026 noch ein guter Investmentstandort?', a: 'Ja, mit einer Bruttomietrendite von rund 3,8 % bei vergleichsweise niedrigen Einstiegspreisen bleibt Leipzig attraktiv, auch wenn die Preise seit dem Immobilienboom der 2010er-Jahre deutlich gestiegen sind.' },
      { q: 'Welche Leipziger Stadtteile bieten noch günstige Einstiegspreise?', a: 'Grünau, Paunsdorf und Teile von Lindenau liegen preislich noch unter den etablierten Szenevierteln Plagwitz und Connewitz, bei solider Mietnachfrage.' },
    ],
  }),
  dortmund: berechneStadt({
    slug: 'dortmund',
    name: 'Dortmund',
    kaufpreisM2: 3314,
    mieteM2: 12.31,
    text: 'Dortmund gehört zu den Ruhrgebietsstädten, die sich vom Strukturwandel der Montanindustrie hin zu Logistik, IT und Wissenschaft (TU Dortmund) gewandelt haben. Die Kaufpreise liegen deutlich unter dem Bundesdurchschnitt, während die Mieten im Verhältnis dazu vergleichsweise hoch sind — das Ergebnis ist eine der höchsten Bruttomietrenditen unter den zehn größten deutschen Städten. Damit ist Dortmund für Cashflow-orientierte Kapitalanleger besonders interessant. Wichtig ist die genaue Lageauswahl: Stadtteile mit hohem Sanierungsbedarf oder sozialen Herausforderungen sollten kritisch geprüft werden, während Viertel wie die Nordstadt-Randlagen oder Hörde solide Vermietbarkeit bei attraktiven Renditen bieten.',
    faq: [
      { q: 'Warum ist die Mietrendite in Dortmund so hoch?', a: 'Die Kaufpreise (Ø 3.314 €/m²) liegen deutlich unter dem Bundesdurchschnitt, während das Mietniveau im Verhältnis dazu relativ hoch ist. Daraus ergibt sich eine Bruttomietrendite von rund 4,5 % — eine der höchsten unter den deutschen Großstädten.' },
      { q: 'Worauf sollte man bei einer Immobilie in Dortmund achten?', a: 'Die Lagequalität variiert innerhalb Dortmunds stark. Es lohnt sich, Bausubstanz, Mieterstruktur und Sozialstruktur des jeweiligen Stadtteils genau zu prüfen, bevor man in hoch verzinste Objekte investiert.' },
    ],
  }),
  essen: berechneStadt({
    slug: 'essen',
    name: 'Essen',
    kaufpreisM2: 3647,
    mieteM2: 13.89,
    text: 'Essen, ehemalige Kohle- und Stahlmetropole, hat sich zu einem Dienstleistungs- und Handelsstandort im Herzen des Ruhrgebiets entwickelt und ist Sitz mehrerer DAX-Unternehmen. Die Kaufpreise liegen niedrig, die Mietrendite dafür überdurchschnittlich hoch — die höchste unter den zehn größten deutschen Städten. Essen profitiert zudem vom Grüngürtel und der Nähe zum Baldeneysee, was die Wohnqualität in bestimmten Stadtteilen deutlich hebt. Für Kapitalanleger mit Fokus auf laufenden Cashflow ist Essen damit einer der interessantesten Tier-1-Standorte, erfordert aber wie im gesamten Ruhrgebiet eine sorgfältige Objekt- und Lageauswahl.',
    faq: [
      { q: 'Ist Essen eine gute Stadt für renditeorientierte Immobilieninvestoren?', a: 'Ja — mit einer Bruttomietrendite von rund 4,6 % ist Essen die renditestärkste der zehn größten deutschen Städte, bei gleichzeitig niedrigen Einstiegspreisen.' },
      { q: 'Welche Essener Stadtteile sind für Kapitalanleger empfehlenswert?', a: 'Stadtteile im Süden wie Bredeney oder Rüttenscheid bieten hohe Wohnqualität, während zentralere und nördliche Lagen oft günstigere Einstiegspreise bei solider Mietnachfrage ermöglichen.' },
    ],
  }),
};

export const STAEDTE_LISTE = Object.values(STAEDTE).sort((a, b) => b.bruttorendite - a.bruttorendite);
