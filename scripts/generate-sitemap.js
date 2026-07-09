#!/usr/bin/env node
/**
 * Sitemap-Generator für renditly.de
 *
 * Wird automatisch vor jedem Build ausgeführt (prebuild in package.json).
 * Neue öffentliche Seiten hier in ROUTES eintragen — der Rest passiert automatisch.
 *
 * Priorität: 1.0 = wichtigste Seite, 0.5 = Standard, 0.3 = Hilfseiten
 * Changefreq: always | hourly | daily | weekly | monthly | yearly | never
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://renditly.de';
const today = new Date().toISOString().split('T')[0];

// ── Öffentliche Routen ────────────────────────────────────────────────────────
// Neue Seiten hier eintragen (z.B. Blog, Pricing, Features)
const ROUTES = [
  {
    url: '/',
    priority: '1.0',
    changefreq: 'weekly',
    lastmod: today,
  },
  // Beispiel für spätere Erweiterung:
  // { url: '/preise', priority: '0.9', changefreq: 'monthly', lastmod: today },
  // { url: '/features', priority: '0.8', changefreq: 'monthly', lastmod: today },
  // { url: '/blog', priority: '0.7', changefreq: 'weekly', lastmod: today },
];
// ─────────────────────────────────────────────────────────────────────────────

const urlEntries = ROUTES.map(
  ({ url, priority, changefreq, lastmod }) => `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join('');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const outPath = resolve(__dirname, '../public/sitemap.xml');
writeFileSync(outPath, sitemap.trim(), 'utf-8');
console.log(`✓ sitemap.xml generiert (${ROUTES.length} URLs, Stand: ${today})`);
