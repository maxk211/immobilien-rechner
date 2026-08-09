#!/usr/bin/env node
/**
 * Sitemap-Generator für renditly.de
 *
 * Läuft automatisch vor jedem Build (prebuild in package.json).
 *
 * WICHTIG — lastmod ist inhaltsbasiert, nicht deploy-basiert:
 * Für jede URL wird ein Hash über die tatsächlich inhaltsrelevanten
 * Quell-Dateien/-Blöcke gebildet (Texte, Berechnungsdaten, FAQ, interne
 * Verlinkung). Reine Nav-/Footer-Chrome wird vor dem Hashen entfernt
 * (stripChrome). Der Hash wird zusammen mit dem lastmod-Datum in
 * scripts/sitemap-lastmod-state.json festgehalten (Teil des Repos).
 * Ändert sich der Hash einer URL nicht, bleibt ihr lastmod unverändert —
 * unabhängig davon, wie oft zwischendurch gebaut/deployed wird oder was
 * sich an Layout, Footer oder anderen Seiten ändert.
 *
 * Neue Seiten hier in ROUTES eintragen (siehe unten) — der Rest läuft
 * automatisch.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { STAEDTE_LISTE } from '../src/staedte/staedteDaten.js';
import { VERGLEICHE } from '../src/staedte/vergleichDaten.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = 'https://www.renditly.de';
const STATE_PATH = resolve(__dirname, 'sitemap-lastmod-state.json');

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────

const readSrc = (relPath) => readFileSync(resolve(ROOT, relPath), 'utf-8');

// Entfernt die Site-Nav ("Chrome": Logo, Login-/CTA-Buttons) und den Footer
// aus einer Komponente. Damit lösen reine Layout-/Footer-Änderungen KEIN
// lastmod-Update aus (Anforderung: nur inhaltliche Änderungen zählen).
function stripChrome(source) {
  return source
    .replace(/<nav className="sticky top-0 z-50[\s\S]*?<\/nav>\n/, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>\n/, '');
}

// Extrahiert ein balanciertes {...}-Objekt, beginnend bei der öffnenden
// Klammer an startBraceIndex — robust gegenüber beliebig verschachtelten
// Arrays/Objekten (z.B. FAQ-Listen), unabhängig von Formatierung/Einrückung.
function extractBalanced(source, startBraceIndex) {
  let depth = 0;
  for (let i = startBraceIndex; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(startBraceIndex, i + 1);
    }
  }
  throw new Error(`Unbalancierte Klammer ab Index ${startBraceIndex}`);
}

function extractStadtBlock(slug) {
  const source = readSrc('src/staedte/staedteDaten.js');
  const anchor = `${slug}: berechneStadt({`;
  const idx = source.indexOf(anchor);
  if (idx === -1) throw new Error(`Stadt-Block "${slug}" nicht in staedteDaten.js gefunden`);
  return extractBalanced(source, idx + anchor.length - 1);
}

function extractVergleichBlock(slugA, slugB) {
  const source = readSrc('src/staedte/vergleichDaten.js');
  const anchor = `slugA: '${slugA}',\n    slugB: '${slugB}',`;
  const idx = source.indexOf(anchor);
  if (idx === -1) throw new Error(`Vergleichs-Block "${slugA}-vs-${slugB}" nicht in vergleichDaten.js gefunden`);
  const braceStart = source.lastIndexOf('{', idx);
  return extractBalanced(source, braceStart);
}

const sha256 = (str) => createHash('sha256').update(str, 'utf-8').digest('hex').slice(0, 16);

// Bootstrap-Fallback für URLs ohne bisherigen State-Eintrag: nimmt das
// jüngste Git-Commit-Datum unter den beteiligten Quelldateien als
// plausibles initiales lastmod (statt pauschal "heute").
function gitBootstrapDate(paths) {
  let latest = null;
  for (const p of paths) {
    try {
      const out = execSync(`git log -1 --format=%cd --date=short -- "${p}"`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString().trim();
      if (out && (!latest || out > latest)) latest = out;
    } catch { /* Datei evtl. nicht getrackt — ignorieren, Fallback unten greift */ }
  }
  return latest;
}

// ── State laden ──────────────────────────────────────────────────────────────
let state = {};
if (existsSync(STATE_PATH)) {
  try { state = JSON.parse(readFileSync(STATE_PATH, 'utf-8')); } catch { state = {}; }
}

const today = new Date().toISOString().split('T')[0];

function resolveLastmod(url, contentParts, gitPaths) {
  const hash = sha256(contentParts.join('\n—\n'));
  const prev = state[url];
  if (prev && prev.hash === hash) return prev.lastmod; // Inhalt unverändert
  const lastmod = prev ? today : (gitBootstrapDate(gitPaths) || today);
  state[url] = { hash, lastmod };
  return lastmod;
}

// ── Routen-Definition ─────────────────────────────────────────────────────────
// Jede Route: welche Quellen bestimmen ihren Inhalt (parts = wird gehasht,
// gitPaths = Dateien für die Bootstrap-Datumsermittlung beim allerersten Lauf)
const routes = [];

routes.push({
  url: '/',
  parts: [stripChrome(readSrc('src/LandingPage.jsx')), readSrc('src/config/payments.js')],
  gitPaths: ['src/LandingPage.jsx', 'src/config/payments.js'],
});

routes.push({
  url: '/mietrendite-rechner',
  parts: [stripChrome(readSrc('src/rechner/MietrenditeRechner.jsx'))],
  gitPaths: ['src/rechner/MietrenditeRechner.jsx'],
});

routes.push({
  url: '/afa-rechner',
  parts: [stripChrome(readSrc('src/rechner/AfaRechner.jsx'))],
  gitPaths: ['src/rechner/AfaRechner.jsx'],
});

routes.push({
  url: '/ratgeber/mietrendite-berechnen',
  parts: [readSrc('src/ratgeber/MietrenditeGuide.jsx')],
  gitPaths: ['src/ratgeber/MietrenditeGuide.jsx'],
});

routes.push({
  url: '/ratgeber/cashflow-bei-immobilien',
  parts: [readSrc('src/ratgeber/CashflowGuide.jsx')],
  gitPaths: ['src/ratgeber/CashflowGuide.jsx'],
});

routes.push({
  url: '/ratgeber/afa-und-steuern-vermietung',
  parts: [readSrc('src/ratgeber/AfaSteuerGuide.jsx')],
  gitPaths: ['src/ratgeber/AfaSteuerGuide.jsx'],
});

routes.push({
  url: '/ratgeber/nebenkostenabrechnung-vermieter',
  parts: [readSrc('src/ratgeber/NebenkostenGuide.jsx')],
  gitPaths: ['src/ratgeber/NebenkostenGuide.jsx'],
});

routes.push({
  url: '/ratgeber/mietspiegel-verstehen',
  parts: [readSrc('src/ratgeber/MietspiegelGuide.jsx')],
  gitPaths: ['src/ratgeber/MietspiegelGuide.jsx'],
});

routes.push({
  url: '/ratgeber/grunderwerbsteuer-bundeslaender',
  parts: [readSrc('src/ratgeber/GrunderwerbsteuerGuide.jsx')],
  gitPaths: ['src/ratgeber/GrunderwerbsteuerGuide.jsx'],
});

routes.push({
  url: '/ratgeber/spekulationssteuer-immobilienverkauf',
  parts: [readSrc('src/ratgeber/SpekulationssteuerGuide.jsx')],
  gitPaths: ['src/ratgeber/SpekulationssteuerGuide.jsx'],
});

routes.push({
  url: '/ratgeber/mieterhoehung-modernisierung',
  parts: [readSrc('src/ratgeber/MieterhoehungModernisierungGuide.jsx')],
  gitPaths: ['src/ratgeber/MieterhoehungModernisierungGuide.jsx'],
});

routes.push({
  url: '/ratgeber/eigenbedarfskuendigung',
  parts: [readSrc('src/ratgeber/EigenbedarfskuendigungGuide.jsx')],
  gitPaths: ['src/ratgeber/EigenbedarfskuendigungGuide.jsx'],
});

routes.push({
  url: '/ratgeber/immobilienfinanzierung',
  parts: [readSrc('src/ratgeber/ImmobilienfinanzierungGuide.jsx')],
  gitPaths: ['src/ratgeber/ImmobilienfinanzierungGuide.jsx'],
});

routes.push({
  url: '/ratgeber/erbschaftsteuer-immobilie',
  parts: [readSrc('src/ratgeber/ErbschaftsteuerImmobilieGuide.jsx')],
  gitPaths: ['src/ratgeber/ErbschaftsteuerImmobilieGuide.jsx'],
});

routes.push({
  url: '/ratgeber',
  parts: [readSrc('src/ratgeber/RatgeberUebersicht.jsx')],
  gitPaths: ['src/ratgeber/RatgeberUebersicht.jsx'],
});

routes.push({
  url: '/mietrendite-staedte',
  parts: [
    stripChrome(readSrc('src/staedte/StaedteVergleich.jsx')),
    readSrc('src/staedte/staedteDaten.js'),
    readSrc('src/staedte/vergleichDaten.js'),
  ],
  gitPaths: ['src/staedte/StaedteVergleich.jsx', 'src/staedte/staedteDaten.js', 'src/staedte/vergleichDaten.js'],
});

const stadtSeiteSource = stripChrome(readSrc('src/staedte/StadtSeite.jsx'));
for (const s of STAEDTE_LISTE) {
  routes.push({
    url: `/mietrendite-${s.slug}`,
    // Städte-Seite = gemeinsame Rendering-/Rechenlogik + nur der Datenblock
    // dieser einen Stadt (nicht die kompletten staedteDaten.js) — so bumpt
    // eine Textänderung bei München nicht das lastmod von Berlin.
    parts: [stadtSeiteSource, extractStadtBlock(s.slug)],
    gitPaths: ['src/staedte/StadtSeite.jsx', 'src/staedte/staedteDaten.js'],
  });
}

const vergleichSeiteSource = stripChrome(readSrc('src/staedte/StaedtVergleichSeite.jsx'));
for (const v of VERGLEICHE) {
  routes.push({
    url: `/mietrendite-${v.slugA}-vs-${v.slugB}`,
    parts: [
      vergleichSeiteSource,
      extractVergleichBlock(v.slugA, v.slugB),
      extractStadtBlock(v.slugA),
      extractStadtBlock(v.slugB),
    ],
    gitPaths: ['src/staedte/StaedtVergleichSeite.jsx', 'src/staedte/vergleichDaten.js', 'src/staedte/staedteDaten.js'],
  });
}

// ── Sitemap generieren ────────────────────────────────────────────────────────
const urlEntries = routes.map(({ url, parts, gitPaths }) => {
  const lastmod = resolveLastmod(url, parts, gitPaths);
  return `  <url>\n    <loc>${BASE_URL}${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

writeFileSync(resolve(ROOT, 'public/sitemap.xml'), sitemap, 'utf-8');
writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8');

console.log(`✓ sitemap.xml generiert (${routes.length} URLs, lastmod inhaltsbasiert — keine changefreq/priority)`);
