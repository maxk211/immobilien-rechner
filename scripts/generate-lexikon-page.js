#!/usr/bin/env node
// Generiert immobilien-lexikon.html mit DefinedTermSet-JSON-LD aus glossarDaten.js.

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GLOSSAR } from '../src/glossar/glossarDaten.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = 'https://www.renditly.de';
const url = `${BASE_URL}/immobilien-lexikon`;

const escapeJson = (str) => str.replace(/"/g, '\\"');

const terms = [...GLOSSAR]
  .sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'))
  .map((e) => `        {
          "@type": "DefinedTerm",
          "name": "${escapeJson(e.begriff)}",
          "description": "${escapeJson(e.definition)}",
          "url": "${url}#${e.begriff.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"
        }`)
  .join(',\n');

const title = 'Immobilien-Lexikon für Vermieter: Alle Begriffe erklärt | renditly';
const description = `${GLOSSAR.length} zentrale Begriffe rund um Mietrendite, Steuern, Mietrecht und Finanzierung für deutsche Vermieter — kurz erklärt, mit Verweis auf vertiefende Ratgeber und Rechner.`;

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
    <meta name="keywords" content="Immobilien Lexikon, Immobilien Glossar, Vermieter Begriffe, Mietrendite Begriffe, Immobilien Fachbegriffe" />
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
      "@type": "DefinedTermSet",
      "name": "Immobilien-Lexikon für Vermieter",
      "description": "${description}",
      "url": "${url}",
      "inLanguage": "de-DE",
      "hasDefinedTerm": [
${terms}
      ]
    }
    </script>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "renditly", "item": "${BASE_URL}" },
        { "@type": "ListItem", "position": 2, "name": "Immobilien-Lexikon", "item": "${url}" }
      ]
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/glossar/lexikon-main.jsx"></script>
  </body>
</html>
`;

writeFileSync(resolve(ROOT, 'immobilien-lexikon.html'), html, 'utf-8');
console.log(`✓ immobilien-lexikon.html generiert (${GLOSSAR.length} Begriffe)`);
