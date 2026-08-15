#!/usr/bin/env node
// Einmaliger Generator für die programmatic-SEO Städte-Seiten.
// Erzeugt pro Stadt: /mietrendite-{slug}.html + src/staedte/{slug}-main.jsx
// Datenquelle: src/staedte/staedteDaten.js

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STAEDTE_LISTE } from '../src/staedte/staedteDaten.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const BASE_URL = 'https://www.renditly.de';
const heute = '2026-08-10';

mkdirSync(resolve(ROOT, 'staedte'), { recursive: true });

const escapeJson = (str) => str.replace(/"/g, '\\"');

for (const stadt of STAEDTE_LISTE) {
  const { slug, name, faq } = stadt;
  const url = `${BASE_URL}/mietrendite-${slug}`;
  const title = `Mietrendite ${name} 2026: Kaufpreise, Mieten & Rechner | renditly`;
  const description = `Aktuelle Kaufpreise, Mieten und Bruttomietrendite für ${name} im Überblick — plus kostenloser Rechner für deine konkrete Immobilie.`;

  const faqSchema = faq.map(f => `        {
          "@type": "Question",
          "name": "${escapeJson(f.q)}",
          "acceptedAnswer": { "@type": "Answer", "text": "${escapeJson(f.a)}" }
        }`).join(',\n');

  const html = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="preconnect" href="https://www.googletagmanager.com" />
    <!-- Google tag (gtag.js) + Consent Mode v2 — analytics_storage standardmäßig
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
      gtag('config', 'G-K3VNNVZPS7');
    </script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-K3VNNVZPS7"></script>
    <link rel="stylesheet" href="/consent-banner.css" />
    <script defer src="/consent-banner.js"></script>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="Mietrendite ${name}, Immobilienpreise ${name}, Kaufpreise ${name}, Mietspiegel ${name}, Kapitalanlage ${name}" />
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
      "name": "Mietrendite ${escapeJson(name)}",
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
        { "@type": "ListItem", "position": 3, "name": "${escapeJson(name)}", "item": "${url}" }
      ]
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/staedte/${slug}-main.jsx"></script>
  </body>
</html>
`;

  const entry = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import StadtSeite from './StadtSeite.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StadtSeite slug="${slug}" />
  </StrictMode>
);
`;

  writeFileSync(resolve(ROOT, `staedte/mietrendite-${slug}.html`), html, 'utf-8');
  writeFileSync(resolve(ROOT, `src/staedte/${slug}-main.jsx`), entry, 'utf-8');
}

console.log(`✓ ${STAEDTE_LISTE.length} Städte-Seiten generiert (HTML + Entry-Dateien)`);
