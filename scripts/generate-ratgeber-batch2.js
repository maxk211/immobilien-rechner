#!/usr/bin/env node
// Einmaliger Generator für die 5 neuen Ratgeber-Artikel (Batch 2, August 2026).
// Erzeugt pro Artikel: ratgeber/{slug}.html mit Article+FAQPage+BreadcrumbList JSON-LD.

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = 'https://www.renditly.de';
const DATUM = '2026-08-15';

const escapeJson = (str) => str.replace(/"/g, '\\"');

const ARTIKEL = [
  {
    slug: 'kaution-richtig-anlegen',
    entry: 'kaution-richtig-anlegen-main.jsx',
    title: 'Mietkaution richtig anlegen: Pflichten für Vermieter nach § 551 BGB | renditly Ratgeber',
    description: 'Die Kaution muss getrennt vom Vermieter-Vermögen und verzinst angelegt werden — Anlageformen, Höchstgrenzen, Verzinsung und Haftungsrisiken bei Verstößen nach § 551 BGB.',
    keywords: 'Mietkaution anlegen, § 551 BGB, Kaution getrennt anlegen, Kautionskonto, Kaution verzinsen',
    ogDescription: 'Anlageformen, Höchstgrenzen und Haftungsrisiken bei der Mietkaution nach § 551 BGB.',
    articleBody: 'Warum die Kaution getrennt angelegt werden muss\\nNach § 551 Abs. 3 BGB muss die Mietsicherheit getrennt vom übrigen Vermögen des Vermieters angelegt werden. Diese Pflicht kann nicht durch Vereinbarung umgangen werden. Die Kaution soll als Sondervermögen geschützt sein, damit sie bei einer Insolvenz des Vermieters nicht in die Insolvenzmasse fällt.\\n\\nWelche Anlageformen zulässig sind\\nÜblich ist ein offen als Mietkaution gekennzeichnetes Konto, meist ein Kautionssparbuch. Auch ein klar gekennzeichnetes Sammelkonto ist zulässig. Nicht zulässig ist die Kaution auf dem eigenen Girokonto zu parken oder mit eigenem Vermögen zu vermischen. Alternativen sind Kautionsbürgschaft oder Kautionsversicherung.\\n\\nHöhe und Zahlungsweise\\nDie Kaution darf maximal 3 Nettokaltmieten betragen. Der Mieter hat das gesetzliche Recht auf Ratenzahlung in bis zu 3 gleichen monatlichen Raten, unabhängig von abweichenden Vertragsklauseln.\\n\\nVerzinsung\\nDie Kaution ist zum üblichen Zinssatz für Spareinlagen mit dreimonatiger Kündigungsfrist zu verzinsen. Die Zinsen stehen wirtschaftlich dem Mieter zu und werden bei Rückzahlung hinzugerechnet.\\n\\nWas bei Verstößen droht\\nLegt ein Vermieter die Kaution nicht getrennt an, kann der Mieter die gesetzeskonforme Anlage verlangen. Geht die Kaution durch Insolvenz verloren, haftet der Vermieter persönlich auf Schadensersatz.\\n\\nRückzahlung nach Mietende\\nEs gibt keine gesetzliche Frist, in der Rechtsprechung hat sich aber eine Prüf- und Überlegungsfrist von bis zu sechs Monaten etabliert, insbesondere wenn eine Nebenkostenabrechnung noch aussteht. Der Vermieter darf mit unstrittigen eigenen Forderungen aufrechnen.\\n\\nFazit\\nDie getrennte, verzinste Anlage der Kaution ist eine zwingende gesetzliche Pflicht mit realem Haftungsrisiko für Vermieter.',
    faq: [
      { q: 'Wie hoch darf die Mietkaution maximal sein?', a: 'Maximal 3 Nettokaltmieten nach § 551 Abs. 1 BGB. Der Mieter kann die Kaution in bis zu 3 gleichen monatlichen Raten zahlen.' },
      { q: 'Muss die Kaution verzinst werden?', a: 'Ja, zum üblichen Zinssatz für Spareinlagen mit dreimonatiger Kündigungsfrist. Die Zinsen stehen wirtschaftlich dem Mieter zu.' },
      { q: 'Was passiert, wenn der Vermieter die Kaution nicht getrennt anlegt?', a: 'Der Mieter kann die gesetzeskonforme Anlage verlangen. Geht die Kaution durch Insolvenz des Vermieters verloren, haftet dieser persönlich auf Schadensersatz.' },
      { q: 'Wie lange darf der Vermieter die Kaution nach Auszug einbehalten?', a: 'Eine feste gesetzliche Frist gibt es nicht, in der Praxis hat sich aber ein Richtwert von bis zu sechs Monaten etabliert, insbesondere bis eine Nebenkostenabrechnung vorliegt.' },
    ],
  },
  {
    slug: 'untervermietung-erlauben-verbieten',
    entry: 'untervermietung-guide-main.jsx',
    title: 'Untervermietung erlauben oder verbieten: Rechte und Pflichten für Vermieter | renditly Ratgeber',
    description: 'Wann Mieter ein Recht auf Erlaubnis zur Untervermietung haben, wann Vermieter ablehnen dürfen, und was zum Untermietzuschlag nach § 553 BGB gilt.',
    keywords: 'Untervermietung Erlaubnis, § 553 BGB, Untermietzuschlag, Untervermietung Airbnb, berechtigtes Interesse Untervermietung',
    ogDescription: 'Anspruch auf Erlaubnis, Ablehnungsgründe und Untermietzuschlag nach § 553 BGB im Überblick.',
    articleBody: 'Grundsatz: Erlaubnispflicht des Vermieters\\nWill ein Mieter einen Teil seiner Wohnung untervermieten, braucht er grundsätzlich die Erlaubnis des Vermieters. Ohne Erlaubnis drohen Abmahnung und im Wiederholungsfall fristlose Kündigung.\\n\\nWann besteht ein Anspruch auf Erlaubnis?\\nNach § 553 BGB muss der Vermieter die Erlaubnis erteilen, wenn der Mieter ein berechtigtes Interesse hat, das nach Vertragsschluss entstanden ist — etwa finanzielle Gründe, ein einziehender Lebenspartner oder längere Abwesenheit.\\n\\nWann darf der Vermieter ablehnen?\\nDer Vermieter darf ablehnen, wenn ein wichtiger Grund in der Person des Untermieters liegt, die Wohnung übermäßig belegt würde, oder ihm die Untervermietung sonst nicht zuzumuten ist. Bei möblierten Zimmern in der vom Vermieter selbst bewohnten Wohnung besteht kein Anspruch.\\n\\nDer Untermietzuschlag\\nEin Zuschlag ist nur zulässig, wenn dem Vermieter die Untervermietung nur bei einer Mieterhöhung zuzumuten wäre (§ 553 Abs. 2 BGB). Eine gesetzliche Obergrenze gibt es nicht, der Vermieter trägt aber die Beweislast für die Voraussetzungen.\\n\\nSonderfall Kurzzeitvermietung über Airbnb\\nDie tageweise Untervermietung wird strenger beurteilt. Ein berechtigtes Interesse ist bei regelmäßiger, gewerblich anmutender Kurzzeitvermietung oft fraglich.\\n\\nRisiken bei unerlaubter Untervermietung\\nOhne Erlaubnis kann der Vermieter abmahnen und bei Fortsetzung fristlos kündigen. Verweigert der Vermieter die Erlaubnis unberechtigt, kann der Mieter unter Umständen außerordentlich kündigen.\\n\\nFazit\\nUntervermietung ist ein austariertes System aus Mieteranspruch und begrenzten Ablehnungsgründen.',
    faq: [
      { q: 'Braucht der Mieter für jede Untervermietung eine Erlaubnis?', a: 'Ja, grundsätzlich ist die Zustimmung des Vermieters erforderlich. Unerlaubte Untervermietung kann zur Abmahnung und im Wiederholungsfall zur fristlosen Kündigung führen.' },
      { q: 'Wann muss der Vermieter die Erlaubnis erteilen?', a: 'Wenn der Mieter ein berechtigtes Interesse hat, das nach Vertragsschluss entstanden ist, etwa finanzielle Gründe oder ein einziehender Lebenspartner (§ 553 BGB).' },
      { q: 'Darf der Vermieter einen Untermietzuschlag verlangen?', a: 'Nur ausnahmsweise, wenn ihm die Untervermietung sonst nicht zuzumuten wäre. Eine feste gesetzliche Obergrenze für die Höhe gibt es nicht.' },
      { q: 'Ist Untervermietung über Airbnb rechtlich anders zu bewerten?', a: 'Ja, kurzzeitige, gewerblich anmutende Vermietung wird von Gerichten strenger beurteilt als klassische Untervermietung an eine bekannte Person.' },
    ],
  },
  {
    slug: 'grundsteuerreform-2025-vermieter',
    entry: 'grundsteuerreform-guide-main.jsx',
    title: 'Grundsteuerreform 2025: Was sich für Vermieter ändert | renditly Ratgeber',
    description: 'Seit 1. Januar 2025 gilt ein neues Bewertungsrecht für die Grundsteuer. Bewertungsmodelle nach Bundesland, Umlage auf Mieter und was in der Nebenkostenabrechnung 2025 sichtbar wird.',
    keywords: 'Grundsteuerreform 2025, Grundsteuerwert, Grundsteuer umlegen, Bundesmodell Grundsteuer, Hebesatz Grundsteuer',
    ogDescription: 'Neues Bewertungsrecht, Bewertungsmodelle je Bundesland und Umlage auf Mieter im Überblick.',
    articleBody: 'Warum es die Reform gibt\\nDas Bundesverfassungsgericht erklärte 2018 die bisherige Bewertung für verfassungswidrig, da sie auf veralteten Einheitswerten aus 1964 bzw. 1935 basierte. Das neue System gilt bundesweit seit 1. Januar 2025.\\n\\nDas neue Bewertungssystem\\nStatt des Einheitswerts wird der Grundsteuerwert anhand von Grundstücksgröße, Bodenrichtwert, Gebäudenutzfläche und Baujahr ermittelt. Es gibt mehrere Modelle: das wertabhängige Bundesmodell in der Mehrheit der Länder, das reine Flächenmodell in Bayern, das modifizierte Bodenwertmodell in Baden-Württemberg und das Flächen-Lage-Modell in weiteren Ländern wie Hessen und Niedersachsen.\\n\\nBerechnung\\nGrundsteuerwert mal Steuermesszahl mal Hebesatz der Gemeinde ergibt die Grundsteuer. Der Hebesatz der Kommune ist der entscheidende Hebel für die tatsächliche Belastung.\\n\\nWann Vermieter die Änderung spüren\\nSichtbar wird die Änderung erstmals in der Nebenkostenabrechnung für 2025, die üblicherweise erst 2026 verschickt wird.\\n\\nUmlage auf Mieter\\nDie Grundsteuer bleibt nach § 556 BGB und BetrKV zu 100 Prozent umlagefähig, sofern im Mietvertrag vereinbart.\\n\\nWas Vermieter prüfen sollten\\nNeuen Bescheid mit altem vergleichen, bei Fehlern fristgerecht Einspruch einlegen, aktuellen Hebesatz der Kommune recherchieren, Mietverträge auf Umlagefähigkeit prüfen.\\n\\nFazit\\nDie Reform ändert nicht ob, sondern wie hoch die Grundsteuer ausfällt — abhängig von Bewertungsmodell und kommunalem Hebesatz.',
    faq: [
      { q: 'Seit wann gilt die neue Grundsteuer?', a: 'Das neue Bewertungsrecht gilt bundesweit seit dem 1. Januar 2025. Sichtbar für Mieter wird es erstmals in der Nebenkostenabrechnung für 2025, die 2026 verschickt wird.' },
      { q: 'Darf die Grundsteuer weiterhin auf Mieter umgelegt werden?', a: 'Ja, sie ist weiterhin zu 100 Prozent umlagefähig nach § 556 BGB und BetrKV, sofern im Mietvertrag als umlagefähige Betriebskostenart vereinbart.' },
      { q: 'Welches Bewertungsmodell gilt für mein Bundesland?', a: 'Die Mehrheit der Länder nutzt das wertabhängige Bundesmodell, Bayern ein reines Flächenmodell, Baden-Württemberg ein modifiziertes Bodenwertmodell, einige weitere Länder ein Flächen-Lage-Modell.' },
      { q: 'Was beeinflusst die tatsächliche Grundsteuerhöhe am stärksten?', a: 'Neben dem Grundsteuerwert vor allem der Hebesatz, den jede Kommune individuell festlegt.' },
    ],
  },
  {
    slug: 'maklerprovision-immobilienkauf',
    entry: 'maklerprovision-kauf-guide-main.jsx',
    title: 'Maklerprovision beim Immobilienkauf: Wer zahlt was? | renditly Ratgeber',
    description: 'Beim Immobilienkauf gilt der Halbteilungsgrundsatz nach § 656c BGB, nicht das Bestellerprinzip der Miete. Was das für Käufer und Verkäufer von Anlageimmobilien bedeutet.',
    keywords: 'Maklerprovision Kauf, Halbteilungsgrundsatz, § 656c BGB, Bestellerprinzip Immobilienkauf, Maklerkosten Käufer',
    ogDescription: 'Halbteilungsgrundsatz statt Bestellerprinzip: Wer beim Immobilienkauf die Maklerprovision zahlt.',
    articleBody: 'Bestellerprinzip bei Miete, Halbteilung beim Kauf\\nBei der Miete gilt seit 2015 das Bestellerprinzip: Wer den Makler beauftragt, zahlt ihn. Beim Immobilienkauf gilt seit Ende 2020 stattdessen der Halbteilungsgrundsatz nach § 656c BGB.\\n\\nDer Halbteilungsgrundsatz\\nFür den Kauf von Einfamilienhäusern und Eigentumswohnungen durch Verbraucher gilt: Ist der Makler für beide Parteien tätig, muss die Provision hälftig geteilt werden. Abweichende Vereinbarungen sind unwirksam.\\n\\nWenn der Makler nur für eine Seite tätig war\\nWar der Makler nur vom Verkäufer beauftragt, greift § 656d BGB: Der Käuferanteil darf nicht höher sein als der Verkäuferanteil. Der Verkäufer muss die Zahlung seines Anteils nachweisen, bevor der Käufer zahlen muss.\\n\\nÜbliche Provisionshöhe\\nDie Gesamtprovision liegt je nach Region zwischen etwa 3 und 7 Prozent des Kaufpreises zuzüglich Umsatzsteuer, durch die Halbteilung entfallen oft rund 3,57 Prozent brutto auf jede Seite.\\n\\nRelevanz für Kapitalanleger\\nBeim Zukauf von Anlageimmobilien sollte die Provision als Teil der Kaufnebenkosten von Anfang an in die Renditekalkulation einfließen.\\n\\nFazit\\nBeim Immobilienkauf gilt der Halbteilungsgrundsatz: Der Käuferanteil darf den Verkäuferanteil nicht übersteigen. Das ist zwingendes Recht.',
    faq: [
      { q: 'Gilt beim Immobilienkauf das Bestellerprinzip?', a: 'Nein, beim Kauf gilt der Halbteilungsgrundsatz nach § 656c BGB, nicht das Bestellerprinzip, das nur bei Mietverträgen greift.' },
      { q: 'Wie wird die Maklerprovision beim Kauf aufgeteilt?', a: 'Ist der Makler für beide Parteien tätig, muss die Provision hälftig zwischen Käufer und Verkäufer geteilt werden. Der Käuferanteil darf nicht höher sein als der Verkäuferanteil.' },
      { q: 'Muss der Käufer in Vorleistung gehen?', a: 'Nein, der Verkäufer muss die Zahlung seines Anteils nachweisen, bevor der Käufer seinen Anteil zahlen muss.' },
      { q: 'Wie hoch ist die übliche Maklerprovision beim Kauf?', a: 'Insgesamt meist zwischen 3 und 7 Prozent des Kaufpreises zuzüglich Umsatzsteuer, je nach Region und Aufteilung.' },
    ],
  },
  {
    slug: 'geg-gmodg-vermieter-2026',
    entry: 'gebaeudemodernisierung-guide-main.jsx',
    title: 'Vom GEG zum Gebäudemodernisierungsgesetz: Was sich 2026 für Vermieter ändert | renditly Ratgeber',
    description: 'Das Gebäudemodernisierungsgesetz (GModG) ersetzt seit Juli 2026 das bisherige GEG. Die 65-Prozent-Regel fällt weg — was Vermieter zu neuen Pflichten und der Modernisierungsumlage wissen müssen.',
    keywords: 'GModG, Gebäudemodernisierungsgesetz, GEG 2026, Heizungsgesetz, Sanierungspflicht Vermieter, Modernisierungsumlage Heizung',
    ogDescription: 'Die 65-Prozent-Regel fällt, neue Pflichten kommen: Das GModG 2026 im Überblick für Vermieter.',
    articleBody: 'Das GEG hat einen Nachfolger\\nBundestag und Bundesrat haben Mitte Juli 2026 das Gebäudemodernisierungsgesetz (GModG) beschlossen, verkündet am 28. Juli 2026, wesentliche Regelungen gelten seit 29. Juli 2026. Es ersetzt das bisherige Gebäudeenergiegesetz.\\n\\nDer Kernwandel\\nDie Pflicht, dass neue Heizungen zu mindestens 65 Prozent mit erneuerbaren Energien betrieben werden müssen, entfällt zugunsten eines technologieoffeneren Rahmens.\\n\\nNeue Pflichten für fossile Heizungen\\nAb 2028 sollen Vermieter mit fossiler Heizung sich hälftig an Netzentgelten und CO2-Preis beteiligen. Ab 2029 gilt ein Bio-Stufenmodell mit schrittweiser Beimischungspflicht für Gas- und Ölheizungen.\\n\\nSanierungspflichten unabhängig von Eigennutzung\\nEnergetische Nachrüstpflichten gelten unabhängig davon, ob vermietet oder selbst genutzt wird.\\n\\nModernisierungsumlage bei Heizungstausch\\nSeit 2024 gilt § 559e BGB: 10 Prozent der Kosten sind umlegbar bei erhaltener Förderung, gedeckelt auf 50 Cent pro Quadratmeter über sechs Jahre, statt der sonst üblichen 8 Prozent nach § 559 BGB.\\n\\nWas Vermieter tun sollten\\nBestehende Heizung und Restlaufzeit einschätzen, Fördermöglichkeiten prüfen, keine überstürzten Entscheidungen treffen, aktuellen Rechtsstand im Blick behalten.\\n\\nFazit\\nDas GModG bringt mehr technologische Flexibilität, verschiebt aber Kostenverantwortung Richtung Vermieter fossil betriebener Gebäude.',
    faq: [
      { q: 'Was ist das Gebäudemodernisierungsgesetz (GModG)?', a: 'Das GModG ersetzt seit Juli 2026 das bisherige Gebäudeenergiegesetz (GEG) und ersetzt die starre 65-Prozent-Erneuerbare-Pflicht durch einen technologieoffeneren Rahmen.' },
      { q: 'Gilt die 65-Prozent-Regel für neue Heizungen noch?', a: 'Nein, die Pflicht zu mindestens 65 Prozent erneuerbaren Energien bei neuen Heizungen wurde mit dem GModG abgeschafft.' },
      { q: 'Welche neuen Kosten kommen ab 2028 auf Vermieter mit fossiler Heizung zu?', a: 'Ab 2028 sollen sie sich hälftig an Netzentgelten und dem CO2-Preis beteiligen, ab 2029 greift zusätzlich ein Bio-Stufenmodell für Gas- und Ölheizungen.' },
      { q: 'Wie viel der Heizungskosten dürfen nach Heizungstausch umgelegt werden?', a: 'Nach § 559e BGB bis zu 10 Prozent jährlich bei erhaltener Förderung, gedeckelt auf 50 Cent pro Quadratmeter über sechs Jahre.' },
    ],
  },
];

for (const a of ARTIKEL) {
  const url = `${BASE_URL}/ratgeber/${a.slug}`;

  const faqSchema = a.faq.map(f => `        {
          "@type": "Question",
          "name": "${escapeJson(f.q)}",
          "acceptedAnswer": { "@type": "Answer", "text": "${escapeJson(f.a)}" }
        }`).join(',\n');

  const html = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="preconnect" href="https://www.googletagmanager.com" />
    <!-- Google tag (gtag.js) + Consent Mode v2 -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'wait_for_update': 500
      });
      gtag('js', new Date());
      gtag('config', 'G-K3VNNVZPS7');
    </script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-K3VNNVZPS7"></script>
    <link rel="stylesheet" href="/consent-banner.css" />
    <script defer src="/consent-banner.js"></script>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${a.title}</title>
    <meta name="description" content="${a.description}" />
    <meta name="keywords" content="${a.keywords}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${a.title}" />
    <meta property="og:description" content="${a.ogDescription}" />
    <meta property="og:image" content="${BASE_URL}/og-image.png" />
    <meta property="og:locale" content="de_DE" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${a.title}" />
    <meta name="twitter:description" content="${a.ogDescription}" />
    <meta name="twitter:image" content="${BASE_URL}/og-image.png" />

    <meta name="theme-color" content="#0f172a" />

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${escapeJson(a.title.replace(' | renditly Ratgeber', ''))}",
      "description": "${escapeJson(a.description)}",
      "articleBody": "${a.articleBody}",
      "author": { "@type": "Organization", "name": "renditly" },
      "publisher": {
        "@type": "Organization",
        "name": "renditly",
        "logo": { "@type": "ImageObject", "url": "${BASE_URL}/og-image.png" }
      },
      "datePublished": "${DATUM}",
      "dateModified": "${DATUM}",
      "mainEntityOfPage": "${url}",
      "inLanguage": "de-DE"
    }
    </script>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
${faqSchema}
      ]
    }
    </script>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "renditly", "item": "${BASE_URL}" },
        { "@type": "ListItem", "position": 2, "name": "Ratgeber", "item": "${BASE_URL}/ratgeber" },
        { "@type": "ListItem", "position": 3, "name": "${escapeJson(a.title.replace(' | renditly Ratgeber', ''))}", "item": "${url}" }
      ]
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/ratgeber/${a.entry}"></script>
  </body>
</html>
`;

  writeFileSync(resolve(ROOT, `ratgeber/${a.slug}.html`), html, 'utf-8');
}

console.log(`✓ ${ARTIKEL.length} neue Ratgeber-Artikel (Batch 2) generiert`);
