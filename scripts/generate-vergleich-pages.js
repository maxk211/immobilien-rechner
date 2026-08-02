#!/usr/bin/env node
// Einmaliger Generator für die programmatic-SEO Städte-Vergleichsseiten (Stufe 2).
// Erzeugt pro Paar: /vergleich/mietrendite-{a}-vs-{b}.html + src/staedte/vergleich-{a}-vs-{b}-main.jsx
// Datenquelle: src/staedte/vergleichDaten.js + src/staedte/staedteDaten.js

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VERGLEICHE, getVergleich } from '../src/staedte/vergleichDaten.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const BASE_URL = 'https://www.renditly.de';
const GA_ID = 'G-K3VNNVZPS7';

mkdirSync(resolve(ROOT, 'vergleich'), { recursive: true });

const escapeJson = (str) => str.replace(/"/g, '\\"');

const gaSnippet = `    <!-- Google tag (gtag.js) + Consent Mode v2 — analytics_storage standardmäßig
         verweigert, bis Nutzer im Cookie-Banner zustimmt (siehe consent-banner.js) -->
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
      gtag('config', '${GA_ID}');
    </script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <link rel="stylesheet" href="/consent-banner.css" />
    <script defer src="/consent-banner.js"></script>`;

for (const paar of VERGLEICHE) {
  const { slugA, slugB } = paar;
  const daten = getVergleich(slugA, slugB);
  const { a, b, faq } = daten;
  const slugPaar = `${slugA}-vs-${slugB}`;
  const url = `${BASE_URL}/mietrendite-${slugPaar}`;
  const title = `Mietrendite ${a.name} vs. ${b.name}: Der Vergleich 2026 | renditly`;
  const description = `${a.name} oder ${b.name}: Kaufpreise, Mieten und Bruttomietrendite im direkten Vergleich — welche Stadt ist die bessere Kapitalanlage?`;

  const faqSchema = faq.map(f => `        {
          "@type": "Question",
          "name": "${escapeJson(f.q)}",
          "acceptedAnswer": { "@type": "Answer", "text": "${escapeJson(f.a)}" }
        }`).join(',\n');

  const html = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
${gaSnippet}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="Mietrendite ${a.name} vs ${b.name}, ${a.name} oder ${b.name} Immobilien, Immobilien Vergleich ${a.name} ${b.name}, Kapitalanlage ${a.name} ${b.name}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type" content="website" />
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
      "@type": "WebPage",
      "name": "Mietrendite ${escapeJson(a.name)} vs. ${escapeJson(b.name)}",
      "url": "${url}",
      "description": "${description}",
      "inLanguage": "de-DE",
      "isPartOf": { "@type": "WebSite", "name": "renditly", "url": "${BASE_URL}" }
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
        { "@type": "ListItem", "position": 2, "name": "Mietrendite Städte", "item": "${BASE_URL}/mietrendite-staedte" },
        { "@type": "ListItem", "position": 3, "name": "${escapeJson(a.name)} vs. ${escapeJson(b.name)}", "item": "${url}" }
      ]
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/staedte/vergleich-${slugPaar}-main.jsx"></script>
  </body>
</html>
`;

  const entry = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import StaedtVergleichSeite from './StaedtVergleichSeite.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StaedtVergleichSeite slugA="${slugA}" slugB="${slugB}" />
  </StrictMode>
);
`;

  writeFileSync(resolve(ROOT, `vergleich/mietrendite-${slugPaar}.html`), html, 'utf-8');
  writeFileSync(resolve(ROOT, `src/staedte/vergleich-${slugPaar}-main.jsx`), entry, 'utf-8');
}

console.log(`✓ ${VERGLEICHE.length} Städte-Vergleichsseiten generiert (HTML + Entry-Dateien)`);
