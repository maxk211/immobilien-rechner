// Marktdaten für die Städte-Seiten (programmatic SEO)
// Tier-1-Städte (Berlin bis Essen): Engel & Völkers Marktbericht Deutschland, Stand Juni 2026
// Tier-2-Städte (Bremen bis Karlsruhe): aggregiert aus mehreren Immobilienportalen
// (u.a. immowelt, Engel & Völkers), Stand August 2026
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
  bremen: berechneStadt({
    slug: 'bremen',
    name: 'Bremen',
    kaufpreisM2: 2930,
    mieteM2: 11.00,
    text: 'Bremen ist als Hafen- und Logistikstandort mit Airbus, Luft- und Raumfahrtindustrie sowie einer eigenständigen Universität wirtschaftlich breiter aufgestellt, als der bundesweite Ruf der Stadt oft vermuten lässt. Die Kaufpreise liegen deutlich unter dem Niveau vergleichbarer Großstädte, während die Mietnachfrage durch Beschäftigte in Industrie und Hafenwirtschaft konstant bleibt. Das ergibt eine überdurchschnittliche Bruttomietrendite unter den größeren deutschen Städten. Wie in vielen zweigeteilten Stadtstrukturen lohnt sich ein genauer Blick auf die Lage: Stadtteile wie die Neustadt oder Schwachhausen bieten solide Wohnqualität, während Bremen-Nord und östliche Stadtteile für Cashflow-orientierte Investoren mit niedrigeren Einstiegspreisen interessant sind.',
    faq: [
      { q: 'Lohnt sich eine Immobilie in Bremen als Kapitalanlage?', a: 'Mit einer Bruttomietrendite von rund 4,5 % und vergleichsweise niedrigen Kaufpreisen gehört Bremen zu den renditestärkeren deutschen Großstädten, getragen von einer stabilen, industriegeprägten Wirtschaft.' },
      { q: 'Welche Bremer Stadtteile sind für Investoren interessant?', a: 'Die Neustadt und Schwachhausen bieten gute Wohnqualität und stabile Nachfrage, während Bremen-Nord und östliche Stadtteile niedrigere Einstiegspreise bei solider Vermietbarkeit ermöglichen.' },
    ],
  }),
  hannover: berechneStadt({
    slug: 'hannover',
    name: 'Hannover',
    kaufpreisM2: 3560,
    mieteM2: 11.50,
    text: 'Hannover profitiert als niedersächsische Landeshauptstadt von einer breiten wirtschaftlichen Basis: Continental, VW-Nutzfahrzeuge und die Hannover Messe sorgen für stabile Beschäftigung und internationale Sichtbarkeit weit über die Messewochen hinaus. Die zentrale Lage in Norddeutschland mit sehr guter Bahn- und Autobahnanbindung macht die Stadt zusätzlich attraktiv für Pendler aus dem Umland. Die Kaufpreise liegen im soliden Mittelfeld der deutschen Großstädte, die Bruttomietrendite bewegt sich ähnlich moderat. Für Kapitalanleger sind neben der Innenstadt vor allem die List und Linden-Süd gefragt, während südliche und östliche Stadtteile wie Misburg oder Bothfeld günstigere Einstiegspreise bei stabiler Mietnachfrage bieten.',
    faq: [
      { q: 'Wie hoch ist die Mietrendite in Hannover?', a: 'Die Bruttomietrendite liegt bei rund 3,9 % — ein solides Mittelfeld, getragen von einer breiten Wirtschaftsbasis aus Automobilzulieferern, Messewirtschaft und öffentlicher Verwaltung als Landeshauptstadt.' },
      { q: 'Welche Stadtteile Hannovers eignen sich für Kapitalanleger?', a: 'Die List und Linden-Süd sind bei Mietern beliebt und entsprechend nachgefragt, während Misburg oder Bothfeld niedrigere Einstiegspreise bei solider Anbindung bieten.' },
    ],
  }),
  dresden: berechneStadt({
    slug: 'dresden',
    name: 'Dresden',
    kaufpreisM2: 3170,
    mieteM2: 10.80,
    text: 'Dresden hat sich als sächsische Landeshauptstadt zu einem der wichtigsten Hightech-Standorte Deutschlands entwickelt — die Halbleiterindustrie rund um "Silicon Saxony" sowie die TU Dresden ziehen kontinuierlich Fachkräfte und Studierende an. Die historische Altstadt und die Lage an der Elbe machen die Stadt zusätzlich touristisch attraktiv. Die Kaufpreise liegen trotz des wirtschaftlichen Aufschwungs noch unter westdeutschem Niveau, während die Mietnachfrage durch Zuzug stetig wächst — daraus ergibt sich eine überdurchschnittliche Bruttomietrendite. Gefragte Lagen wie Blasewitz oder Striesen haben in den letzten Jahren spürbar an Wert gewonnen, während Stadtteile wie Prohlis oder Gorbitz für renditeorientierte Investoren noch günstigere Einstiegspreise bieten.',
    faq: [
      { q: 'Ist Dresden 2026 ein attraktiver Standort für Immobilieninvestoren?', a: 'Ja — mit einer Bruttomietrendite von rund 4,1 % und weiterhin wachsender Nachfrage durch die Halbleiterindustrie und die TU Dresden gehört die Stadt zu den dynamischeren deutschen Großstadtmärkten.' },
      { q: 'Welche Dresdner Stadtteile bieten die beste Mietrendite?', a: 'Prohlis und Gorbitz bieten deutlich niedrigere Einstiegspreise als die etablierten Lagen Blasewitz oder Striesen, bei weiterhin solider Mietnachfrage.' },
    ],
  }),
  nuernberg: berechneStadt({
    slug: 'nuernberg',
    name: 'Nürnberg',
    kaufpreisM2: 3880,
    mieteM2: 12.50,
    text: 'Nürnberg ist die zweitgrößte Stadt Bayerns und ein bedeutender Industrie- und Logistikstandort mit enger wirtschaftlicher Verflechtung zum benachbarten Erlangen (Siemens) und Fürth. Die Messe Nürnberg und eine breite Mischung aus Maschinenbau, Elektrotechnik und IT sorgen für eine stabile, diversifizierte Wirtschaft. Die Kaufpreise liegen spürbar unter München, während das Mietniveau vergleichsweise hoch ist — das ergibt eine solide Bruttomietrendite im Mittelfeld der deutschen Großstädte. Für Kapitalanleger sind die Südstadt und Gostenhof als lebendige, gut angebundene Viertel gefragt, während St. Leonhard oder Langwasser günstigere Einstiegspreise bei stabiler Vermietbarkeit bieten.',
    faq: [
      { q: 'Wie steht Nürnberg im Vergleich zu München als Investmentstandort da?', a: 'Deutlich günstiger im Einkauf bei ähnlich hoher Mietnachfrage aus der Industrie- und Technologiebranche — die Bruttomietrendite liegt bei rund 3,9 %, spürbar über dem Münchner Niveau.' },
      { q: 'Welche Nürnberger Stadtteile eignen sich für Kapitalanleger?', a: 'Die Südstadt und Gostenhof sind bei jüngeren Mietern beliebt, während St. Leonhard und Langwasser niedrigere Einstiegspreise bei solider Nachfrage bieten.' },
    ],
  }),
  mannheim: berechneStadt({
    slug: 'mannheim',
    name: 'Mannheim',
    kaufpreisM2: 3900,
    mieteM2: 12.30,
    text: 'Mannheim bildet zusammen mit Ludwigshafen und Heidelberg die wirtschaftsstarke Metropolregion Rhein-Neckar, geprägt von Chemie- und Maschinenbauindustrie sowie einer renommierten Universität. Die als "Quadratestadt" bekannte, schachbrettartige Innenstadt und die zentrale Lage zwischen Rhein und Neckar machen Mannheim zu einem gefragten Wohnstandort für Berufspendler in der gesamten Region. Die Kaufpreise liegen im oberen Mittelfeld der deutschen Großstädte, die Bruttomietrendite bewegt sich entsprechend moderat. Kapitalanleger finden in der Neckarstadt-West oder Jungbusch aufstrebende, noch bezahlbare Lagen, während die Oststadt und Feudenheim als etablierte, aber teurere Wohnlagen gelten.',
    faq: [
      { q: 'Ist Mannheim ein guter Standort für Immobilieninvestments?', a: 'Mannheim bietet mit rund 3,8 % Bruttomietrendite eine solide, aber keine außergewöhnliche Rendite — getragen von der wirtschaftsstarken Metropolregion Rhein-Neckar mit Chemie- und Maschinenbauindustrie.' },
      { q: 'Welche Mannheimer Stadtteile sind für Kapitalanleger interessant?', a: 'Neckarstadt-West und Jungbusch gelten als aufstrebende, noch vergleichsweise günstige Lagen, während Oststadt und Feudenheim etablierter und entsprechend teurer sind.' },
    ],
  }),
  bonn: berechneStadt({
    slug: 'bonn',
    name: 'Bonn',
    kaufpreisM2: 4200,
    mieteM2: 13.00,
    text: 'Bonn ist als ehemalige Bundeshauptstadt und heutiger UN-Standort sowie Konzernsitz von Telekom und Deutscher Post ein außergewöhnlich stabiler, international geprägter Immobilienmarkt. Die vergleichsweise überschaubare Stadtgröße trifft auf konstant hohe Nachfrage durch internationale Organisationen, Bundesbehörden und die Universität Bonn — das treibt sowohl Kauf- als auch Mietpreise deutlich nach oben. Die Bruttomietrendite liegt entsprechend im unteren Bereich der deutschen Großstädte. Gefragte Lagen wie das Bonner Villenviertel Bad Godesberg oder die Innenstadt erzielen Spitzenpreise, während Stadtteile wie Tannenbusch oder Duisdorf für renditeorientierte Kapitalanleger ein besseres Preis-Miet-Verhältnis bieten.',
    faq: [
      { q: 'Warum sind die Immobilienpreise in Bonn trotz überschaubarer Stadtgröße so hoch?', a: 'Die Nachfrage durch UN-Organisationen, Bundesbehörden, DAX-Konzerne wie Telekom und Post sowie die Universität Bonn übersteigt das begrenzte Angebot deutlich, was Kauf- und Mietpreise strukturell hochhält.' },
      { q: 'Welche Bonner Stadtteile bieten bessere Renditechancen?', a: 'Tannenbusch und Duisdorf liegen preislich klar unter dem Bonner Villenviertel Bad Godesberg oder der Innenstadt und bieten dadurch tendenziell höhere Renditen.' },
    ],
  }),
  muenster: berechneStadt({
    slug: 'muenster',
    name: 'Münster',
    kaufpreisM2: 4400,
    mieteM2: 11.50,
    text: 'Münster gilt als eine der lebenswertesten Städte Deutschlands — geprägt von der großen Westfälischen Wilhelms-Universität mit über 40.000 Studierenden, einer historischen Altstadt und dem Ruf als Fahrradstadt Nummer eins. Diese hohe Lebensqualität sorgt für konstant hohe Nachfrage bei begrenztem Neubauangebot innerhalb der Stadtgrenzen, was die Kaufpreise spürbar nach oben treibt. Im Verhältnis dazu fällt die Bruttomietrendite eher niedrig aus — typisch für eine gefragte, wachstumsstarke Universitätsstadt mit begrenztem Angebot. Für Kapitalanleger sind studentisch geprägte Lagen rund um die Innenstadt besonders nachfragesicher, während Stadtteile wie Coerde oder Kinderhaus günstigere Einstiegspreise bieten.',
    faq: [
      { q: 'Warum ist die Mietrendite in Münster vergleichsweise niedrig?', a: 'Die hohe Lebensqualität und die große Universität mit über 40.000 Studierenden treiben die Kaufpreise stark nach oben, während die Mieten proportional weniger stark mitziehen — die Bruttomietrendite liegt bei rund 3,1 %.' },
      { q: 'Für wen eignet sich eine Immobilie in Münster als Investment?', a: 'Eher für wertstabilitätsorientierte Investoren mit Blick auf die konstant hohe Nachfrage durch Studierende und die insgesamt sehr geringe Leerstandsquote als für reine Cashflow-Strategien.' },
    ],
  }),
  karlsruhe: berechneStadt({
    slug: 'karlsruhe',
    name: 'Karlsruhe',
    kaufpreisM2: 4200,
    mieteM2: 15.30,
    text: 'Karlsruhe ist als Sitz des Karlsruher Instituts für Technologie (KIT), des Bundesgerichtshofs und des Bundesverfassungsgerichts sowohl Tech- als auch Justizstandort mit überdurchschnittlich hoher Akademikerdichte. Die Nähe zu zahlreichen IT- und Forschungseinrichtungen sorgt für eine besonders zahlungskräftige Mieterschaft, was sich in einem für süddeutsche Verhältnisse ungewöhnlich hohen Mietniveau im Verhältnis zu den Kaufpreisen niederschlägt. Das ergibt eine der höheren Bruttomietrenditen unter den größeren deutschen Städten. Die fächerförmig angelegte Innenstadt rund um das Schloss ist bei Mietern besonders gefragt, während Stadtteile wie Mühlburg oder Daxlanden günstigere Einstiegspreise bei guter Anbindung bieten.',
    faq: [
      { q: 'Warum ist die Mietrendite in Karlsruhe überdurchschnittlich hoch?', a: 'Die hohe Dichte an IT- und Forschungsarbeitsplätzen rund um das KIT sorgt für eine zahlungskräftige Mieterschaft und ein vergleichsweise hohes Mietniveau im Verhältnis zu den Kaufpreisen — die Bruttomietrendite liegt bei rund 4,4 %.' },
      { q: 'Welche Karlsruher Stadtteile sind für Kapitalanleger interessant?', a: 'Mühlburg und Daxlanden bieten niedrigere Einstiegspreise als die zentrale, fächerförmige Innenstadt rund um das Schloss, bei weiterhin guter Anbindung.' },
    ],
  }),
};

export const STAEDTE_LISTE = Object.values(STAEDTE).sort((a, b) => b.bruttorendite - a.bruttorendite);
