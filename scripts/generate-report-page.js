#!/usr/bin/env node
// Generiert mietrendite-report-2026.html mit Article+Dataset+Breadcrumb JSON-LD.
// Stats werden aus STAEDTE_LISTE berechnet — bleibt automatisch konsistent mit
// der React-Komponente (src/report/MietrenditeReport.jsx), die dieselbe Quelle nutzt.

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STAEDTE_LISTE } from '../src/staedte/staedteDaten.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = 'https://www.renditly.de';
const url = `${BASE_URL}/mietrendite-report-2026`;

const fmt1 = (n) => n.toFixed(1).replace('.', ',');
const fmtEur = (n) => Math.round(n).toLocaleString('de-DE') + ' €';
const escapeJson = (str) => str.replace(/"/g, '\\"');

const n = STAEDTE_LISTE.length;
const avgRendite = STAEDTE_LISTE.reduce((s, o) => s + o.bruttorendite, 0) / n;
const avgKaufpreis = STAEDTE_LISTE.reduce((s, o) => s + o.kaufpreisM2, 0) / n;
const hoechste = STAEDTE_LISTE[0];
const niedrigste = STAEDTE_LISTE[n - 1];
const teuersteKP = [...STAEDTE_LISTE].sort((a, b) => b.kaufpreisM2 - a.kaufpreisM2)[0];
const guenstigsteKP = [...STAEDTE_LISTE].sort((a, b) => a.kaufpreisM2 - b.kaufpreisM2)[0];

const title = `Mietrendite-Report Deutschland 2026: ${n} Städte im Vergleich | renditly`;
const description = `Kaufpreise, Mieten und Bruttomietrendite der ${n} größten deutschen Städte im Vergleich. Ø ${fmt1(avgRendite)} % Bruttomietrendite, höchste Rendite in ${hoechste.name} (${fmt1(hoechste.bruttorendite)} %), niedrigste in ${niedrigste.name} (${fmt1(niedrigste.bruttorendite)} %).`;

const articleBody = `Die zentrale Erkenntnis: Kaufpreis schlägt Miete\\n${teuersteKP.name} hat mit ${fmtEur(teuersteKP.kaufpreisM2)} pro Quadratmeter den höchsten Kaufpreis aller ${n} untersuchten Städte, ${guenstigsteKP.name} mit ${fmtEur(guenstigsteKP.kaufpreisM2)} pro Quadratmeter den niedrigsten. Die höchste Bruttomietrendite erzielt ${hoechste.name} mit ${fmt1(hoechste.bruttorendite)} Prozent, die niedrigste ${niedrigste.name} mit ${fmt1(niedrigste.bruttorendite)} Prozent. Im Durchschnitt über alle ${n} Städte liegt die Bruttomietrendite bei ${fmt1(avgRendite)} Prozent, bei einem durchschnittlichen Kaufpreis von ${fmtEur(avgKaufpreis)} pro Quadratmeter.\\n\\nMethodik\\nDatenbasis sind die durchschnittlichen Kaufpreise und Kaltmieten pro Quadratmeter für ${n} deutsche Großstädte (Tier-1-Städte: Engel & Völkers Marktbericht Deutschland, Stand Juni 2026; Tier-2-Städte: aggregiert aus mehreren Immobilienportalen, Stand August 2026). Die Bruttomietrendite berechnet sich als Jahreskaltmiete pro Quadratmeter geteilt durch den Kaufpreis pro Quadratmeter, multipliziert mit 100.`;

const datasetItems = STAEDTE_LISTE.map((s) => `        {
          "@type": "Observation",
          "name": "Mietrendite ${escapeJson(s.name)}",
          "value": ${s.bruttorendite},
          "unitText": "Prozent"
        }`).join(',\n');

const html = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
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

    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="Mietrendite Deutschland, Mietrendite Report, Mietrendite Städte Vergleich, Immobilienpreise Deutschland 2026" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${BASE_URL}/og-image.png" />
    <meta property="og:locale" content="de_DE" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${BASE_URL}/og-image.png" />

    <meta name="theme-color" content="#0f172a" />

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Mietrendite-Report Deutschland 2026: ${n} Städte im Vergleich",
      "description": "${escapeJson(description)}",
      "articleBody": "${articleBody}",
      "author": { "@type": "Organization", "name": "renditly" },
      "publisher": {
        "@type": "Organization",
        "name": "renditly",
        "logo": { "@type": "ImageObject", "url": "${BASE_URL}/og-image.png" }
      },
      "datePublished": "2026-08-15",
      "dateModified": "2026-08-15",
      "mainEntityOfPage": "${url}",
      "inLanguage": "de-DE"
    }
    </script>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Mietrendite-Report Deutschland 2026",
      "description": "Bruttomietrendite von ${n} deutschen Großstädten, berechnet aus durchschnittlichem Kaufpreis und Kaltmiete pro Quadratmeter.",
      "url": "${url}",
      "license": "https://www.renditly.de/mietrendite-report-2026",
      "creator": { "@type": "Organization", "name": "renditly", "url": "${BASE_URL}" },
      "variableMeasured": [
${datasetItems}
      ]
    }
    </script>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "renditly", "item": "${BASE_URL}" },
        { "@type": "ListItem", "position": 2, "name": "Mietrendite-Report Deutschland 2026", "item": "${url}" }
      ]
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/report/report-main.jsx"></script>
  </body>
</html>
`;

writeFileSync(resolve(ROOT, 'mietrendite-report-2026.html'), html, 'utf-8');
console.log(`✓ mietrendite-report-2026.html generiert (${n} Städte, Ø ${fmt1(avgRendite)} % Bruttomietrendite)`);
