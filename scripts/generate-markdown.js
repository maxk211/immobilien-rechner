// ─── Markdown-Geschwister-Generator (acceptmarkdown.com) ───────────────────
//
// Erzeugt für eine kuratierte, sicherheitsbewusst ausgewählte Menge an Seiten
// echte, saubere Markdown-Varianten (`public/<pfad>.md`), die die Edge-
// Middleware (middleware.js) per Accept-Content-Negotiation ausliefert.
//
// Bewusste Scope-Entscheidung: nur Seiten, deren Inhalt aus STRUKTURIERTEN
// JS-Datenobjekten stammt (STAEDTE, VERGLEICHE, HilfeCenter-Kategorien) oder
// von Hand sauber gepflegt wird (Startseite, Trust-Anchor-Seiten, 404).
// Bewusst NICHT automatisiert: Rechner- und Ratgeber-Seiten, deren Text als
// JSX-Prosa mit Inline-Markup vorliegt — ein Regex-Parser über 20+
// strukturell unterschiedliche Dateien riskiert kaputtes/verstümmeltes
// Markdown, was schlechter wäre als gar keine Markdown-Variante. Das bleibt
// als Folgearbeit dokumentiert (siehe Abschluss-Zusammenfassung).
//
// Läuft als Teil von `npm run prebuild`, direkt nach generate-sitemap.js.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STAEDTE, STAEDTE_LISTE } from '../src/staedte/staedteDaten.js';
import { VERGLEICHE } from '../src/staedte/vergleichDaten.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const fmt1 = (n) => (isFinite(n) ? n.toFixed(1).replace('.', ',') : '–');
const fmtEur = (n) => (isFinite(n) ? Math.round(n).toLocaleString('de-DE') + ' €' : '–');
const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

const manifest = []; // Liste aller Pfade (ohne .md-Endung), für die eine Markdown-Datei existiert

function write(routePath, markdown) {
  // routePath z.B. "/", "/hilfe", "/mietrendite-berlin"
  const filename = routePath === '/' ? 'index.md' : `${routePath.replace(/^\//, '')}.md`;
  const fullPath = path.join(PUBLIC_DIR, filename);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, markdown.trimEnd() + '\n', 'utf-8');
  manifest.push(routePath);
}

function frontLinks() {
  return `---\n\n*Quelle: [www.renditly.de${''}](https://www.renditly.de) · Maschinenlesbare Übersicht: [/llms.txt](https://www.renditly.de/llms.txt) · Sitemap: [/sitemap.xml](https://www.renditly.de/sitemap.xml)*\n`;
}

// ─── 1. Startseite ──────────────────────────────────────────────────────────
write(
  '/',
  `# Dein Immobilienportfolio. Endlich im Griff.

renditly ist die Software für deutsche Vermieter und Immobilien-Investoren, die Rendite, Cashflow, Steuer und Mieterverwaltung an einem Ort bündelt — statt in verstreuten Excel-Tabellen. 90 Tage kostenlos testen, keine Kreditkarte nötig.

## Was renditly kann

renditly berechnet automatisch Bruttomietrendite, Nettomietrendite und monatlichen Cashflow für jede Immobilie im Portfolio. Dazu kommen ein AfA-Rechner nach deutschem Steuerrecht, ein Grunderwerbsteuer-Rechner mit allen 16 Bundesland-Sätzen, ein Kaufnebenkosten-Rechner und ein Tilgungsplan-Rechner für Bankfinanzierungen. Alle Kennzahlen werden bei jeder Änderung automatisch neu berechnet.

## Für wen renditly gebaut ist

Für Einsteiger mit einer einzelnen Eigentumswohnung ebenso wie für Profis mit mehreren Mehrfamilienhäusern. Der Starter-Plan eignet sich für ein Objekt, Standard für bis zu zehn Immobilien, Pro für unlimitierte Portfolios inklusive Priorität-Support — alle Tarife enthalten denselben vollen Funktionsumfang.

## Kostenlose Rechner & Ratgeber

Neben der Portfolio-Software bietet renditly kostenlos nutzbare Einzelrechner (Mietrendite, AfA, Grunderwerbsteuer, Kaufnebenkosten, Tilgungsplan, Spekulationsfrist) sowie einen umfangreichen Ratgeber-Bereich mit Artikeln zu Mietrendite-Berechnung, Immobilien-Kapitalanlage und deutschem Immobiliensteuerrecht, dazu Marktdaten-Seiten für 18 deutsche Großstädte.

${frontLinks()}`
);

// ─── 2. Hilfe-Center ────────────────────────────────────────────────────────
{
  // Statisch reproduzierte Struktur (KATEGORIEN aus HilfeCenter.jsx) — bewusst
  // hier dupliziert statt importiert, da die Original-Datei React-JSX ist und
  // Icon-Komponenten enthält, die sich nicht sauber in ein reines Node-Skript
  // importieren lassen. Bei Änderungen an den FAQ muss diese Liste inhaltlich
  // synchron gehalten werden (kuratierte Kopie, kein automatischer Parser).
  const KATEGORIEN = [
    { titel: 'Erste Schritte', fragen: [
      { q: 'Wie starte ich mit renditly?', a: 'Registriere dich kostenlos ohne Kreditkarte, lege deine erste Immobilie an (Kaufpreis, Kaltmiete, laufende Kosten) und renditly berechnet sofort Rendite und Cashflow. Die Testphase läuft 90 Tage mit vollem Funktionsumfang für eine Immobilie.' },
      { q: 'Für wen ist renditly geeignet?', a: 'Für deutsche Vermieter und Immobilien-Investoren — vom Einsteiger mit einer Eigentumswohnung bis zum Profi mit mehreren Mehrfamilienhäusern. Der Starter-Plan eignet sich für 1 Objekt, Standard für bis zu 10 Immobilien, Pro für unlimitierte Portfolios.' },
      { q: 'Brauche ich Vorkenntnisse in Immobilienrechnung?', a: 'Nein. Du gibst die bekannten Eckdaten deiner Immobilie ein (Kaufpreis, Miete, Kosten) — renditly übernimmt die Formeln für Rendite, Cashflow, AfA und Grunderwerbsteuer automatisch nach deutschem Recht.' },
      { q: 'Gibt es eine mobile App?', a: 'Die Web-App ist vollständig mobiloptimiert und funktioniert auf iPhone und Android wie eine native App — ohne Download aus dem App Store.' },
    ]},
    { titel: 'Preise & Tarife', fragen: [
      { q: 'Was kostet renditly?', a: 'Starter ab 4,99 €/Monat für 1 Immobilie, Standard ab 12,49 €/Monat für bis zu 10 Immobilien, Pro ab 24,99 €/Monat für unlimitierte Immobilien inklusive Priorität-Support. Alle Tarife enthalten alle Features — der einzige Unterschied ist die Anzahl der Immobilien.' },
      { q: 'Kann ich renditly kostenlos testen?', a: 'Ja — 90 Tage lang, mit einer Immobilie und allen Features, ohne Kreditkarte bei der Anmeldung. Du entscheidest danach, ob du upgraden möchtest.' },
      { q: 'Kann ich jederzeit kündigen?', a: 'Ja, alle Tarife sind monatlich kündbar, keine Mindestlaufzeit. Bei jährlicher Zahlung sparst du zusätzlich 20 %.' },
      { q: 'Was passiert mit meinen Daten, wenn ich kündige?', a: 'Deine Daten bleiben erhalten. Nach einer Kündigung kannst du weiterhin eine Immobilie im kostenlosen Umfang verwalten, statt Zugriff komplett zu verlieren.' },
      { q: 'Kann ich zwischen den Tarifen wechseln?', a: 'Ja, ein Upgrade oder Downgrade ist jederzeit im Account-Bereich möglich. Bei einem Downgrade musst du dein Portfolio ggf. vorher auf die neue Immobilien-Obergrenze reduzieren.' },
    ]},
  ];

  const body = KATEGORIEN.map((kat) => {
    const fragen = kat.fragen.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n');
    return `## ${kat.titel}\n\n${fragen}`;
  }).join('\n\n');

  write(
    '/hilfe',
    `# Hilfe-Center

Antworten auf häufige Fragen zu renditly — Erste Schritte, Preise, Rendite-Berechnung und mehr. Für alles Weitere: hallo@renditly.de.

${body}

${frontLinks()}`
  );
}

// ─── 3. Städteseiten (aus STAEDTE, strukturierte Daten) ────────────────────
const TIER1_SLUGS = new Set(['berlin', 'hamburg', 'muenchen', 'koeln', 'frankfurt', 'stuttgart', 'duesseldorf', 'leipzig', 'dortmund', 'essen']);

for (const stadt of Object.values(STAEDTE)) {
  const istTier1 = TIER1_SLUGS.has(stadt.slug);
  const quelle = istTier1
    ? 'Engel & Völkers Marktbericht Deutschland, Stand Juni 2026'
    : 'aggregiert aus mehreren Immobilienportalen, Stand August 2026';

  const faq = stadt.faq.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n');

  write(
    `/mietrendite-${stadt.slug}`,
    `# Mietrendite ${stadt.name} 2026

## Kennzahlen im Überblick

- Ø Kaufpreis: ${fmtEur(stadt.kaufpreisM2)}/m²
- Ø Kaltmiete: ${fmt1(stadt.mieteM2)} €/m²
- Ø Bruttomietrendite: ${fmt1(stadt.bruttorendite)} %
- Quelle: ${quelle}

## Einordnung

${stadt.text}

## Häufige Fragen

${faq}

${frontLinks()}`
  );
}

// ─── 4. Vergleichsseiten (aus VERGLEICHE, strukturierte Daten) ────────────
for (const v of VERGLEICHE) {
  const a = STAEDTE[v.slugA];
  const b = STAEDTE[v.slugB];
  const faq = v.faq.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n');

  write(
    `/mietrendite-${v.slugA}-vs-${v.slugB}`,
    `# ${a.name} vs. ${b.name}: Mietrendite im Vergleich

## Kennzahlen im Überblick

| | ${a.name} | ${b.name} |
|---|---|---|
| Ø Kaufpreis | ${fmtEur(a.kaufpreisM2)}/m² | ${fmtEur(b.kaufpreisM2)}/m² |
| Ø Kaltmiete | ${fmt1(a.mieteM2)} €/m² | ${fmt1(b.mieteM2)} €/m² |
| Ø Bruttomietrendite | ${fmt1(a.bruttorendite)} % | ${fmt1(b.bruttorendite)} % |

## Einordnung

${v.text}

## Häufige Fragen

${faq}

${frontLinks()}`
  );
}

// ─── 5. Mietrendite-Report 2026 (aggregierte Statistik aus STAEDTE_LISTE) ─
{
  const liste = STAEDTE_LISTE;
  const n = liste.length;
  const avgRendite = liste.reduce((s, o) => s + o.bruttorendite, 0) / n;
  const avgKaufpreis = liste.reduce((s, o) => s + o.kaufpreisM2, 0) / n;
  const avgMiete = liste.reduce((s, o) => s + o.mieteM2, 0) / n;
  const teuerste = [...liste].sort((a, b) => b.kaufpreisM2 - a.kaufpreisM2)[0];
  const guenstigste = [...liste].sort((a, b) => a.kaufpreisM2 - b.kaufpreisM2)[0];
  const hoechsteRendite = liste[0];
  const niedrigsteRendite = liste[n - 1];

  const tabelle = liste
    .map((o) => `| ${o.name} | ${fmtEur(o.kaufpreisM2)}/m² | ${fmt1(o.mieteM2)} €/m² | ${fmt1(o.bruttorendite)} % |`)
    .join('\n');

  write(
    '/mietrendite-report-2026',
    `# Mietrendite-Report Deutschland 2026

Datenbasis: ${n} deutsche Großstädte. Ø Bruttomietrendite ${fmt1(avgRendite)} %, Ø Kaufpreis ${fmtEur(avgKaufpreis)}/m², Ø Kaltmiete ${fmt1(avgMiete)} €/m². Teuerste Stadt: ${teuerste.name} (${fmtEur(teuerste.kaufpreisM2)}/m²). Günstigste Stadt: ${guenstigste.name} (${fmtEur(guenstigste.kaufpreisM2)}/m²). Höchste Bruttomietrendite: ${hoechsteRendite.name} (${fmt1(hoechsteRendite.bruttorendite)} %). Niedrigste Bruttomietrendite: ${niedrigsteRendite.name} (${fmt1(niedrigsteRendite.bruttorendite)} %).

## Alle Städte im Überblick

| Stadt | Ø Kaufpreis | Ø Kaltmiete | Ø Bruttomietrendite |
|---|---|---|---|
${tabelle}

## Methodik

Kaufpreise und Kaltmieten stammen für die zehn größten Märkte (Berlin bis Essen) aus dem Engel & Völkers Marktbericht Deutschland (Stand Juni 2026), für acht weitere Städte aus einer Aggregation mehrerer Immobilienportale (Stand August 2026). Die Bruttomietrendite wird als (Ø Kaltmiete × 12 / Ø Kaufpreis) × 100 berechnet.

*Zitierbar als: renditly (2026). Mietrendite-Report Deutschland 2026. Abgerufen ${today} von https://www.renditly.de/mietrendite-report-2026*

${frontLinks()}`
  );
}

// ─── Trust-Anchor-Seiten (Fix 6, aus src/trust/TrustPages.jsx dupliziert) ──
// Gleicher Grund wie beim Hilfe-Center oben: Original ist React-JSX, hier
// von Hand synchron gehaltene reine Text-Fassung derselben verifizierten
// Fakten (ImmoBros GbR, hallo@renditly.de, An der Hülling 6, 93047 Regensburg).
write(
  '/about',
  `# Über renditly

renditly ist eine Software für deutsche Vermieter und Immobilien-Investoren, die Rendite, Cashflow, Steuerdaten und Mieterverwaltung an einem Ort bündelt — statt in verstreuten Excel-Tabellen und Papierordnern.

## Was renditly ist

Mit renditly legst du deine Immobilien an, trägst Kaufpreis, Miete und laufende Kosten ein, und die Software berechnet automatisch Bruttomietrendite, Nettomietrendite, monatlichen Cashflow und die relevanten Steuerkennzahlen nach deutschem Recht.

## Warum wir renditly gebaut haben

Die meisten privaten Vermieter verwalten ihre Immobilien über Jahre hinweg in selbstgebauten Excel-Tabellen, die mit jedem weiteren Objekt unübersichtlicher werden. renditly wurde gegründet, um eine spezialisierte, auf deutsches Mietrecht und Steuerrecht zugeschnittene Software statt einer generischen Tabelle anzubieten.

## Wer wir sind

renditly wird betrieben von der ImmoBros GbR mit Sitz in Regensburg (An der Hülling 6, 93047 Regensburg), vertreten durch die Gesellschafter David Schmidbauer und Maximilian Kammel.

## Für wen renditly gebaut ist

Für Einsteiger mit einer einzelnen Eigentumswohnung ebenso wie für Profis mit mehreren Mehrfamilienhäusern. Starter eignet sich für ein Objekt, Standard für bis zu zehn Immobilien, Pro für unlimitierte Portfolios.

## Kontakt

hallo@renditly.de — siehe auch [/contact](https://www.renditly.de/contact).

${frontLinks()}`
);

write(
  '/contact',
  `# Kontakt

## E-Mail

Für Fragen zu deinem Account, zu Tarifen oder für allgemeines Feedback: hallo@renditly.de. Antwortzeit in der Regel 1–2 Werktage.

## Postanschrift

ImmoBros GbR
An der Hülling 6
93047 Regensburg
Deutschland

## Vertretungsberechtigt

David Schmidbauer, Maximilian Kammel

## Weitere Anlaufstellen

Häufige Fragen beantwortet das [Hilfe-Center](https://www.renditly.de/hilfe). Rechtliche Angaben stehen im Impressum und in der [Datenschutzerklärung](https://www.renditly.de/privacy).

${frontLinks()}`
);

write(
  '/privacy',
  `# Datenschutzerklärung / Privacy Policy

Gemäß DSGVO (EU) 2016/679 · Stand: 4. August 2026

## 1. Verantwortlicher

ImmoBros GbR, An der Hülling 6, 93047 Regensburg. E-Mail: hallo@renditly.de

## 2. Welche Daten wir verarbeiten

Kontodaten (E-Mail-Adresse, Passwort ausschließlich gehasht gespeichert), Immobilien- und Mieterdaten (nur für dein Konto zugänglich) sowie technische Daten (IP-Adresse, Browser-Typ, Zugriffszeitpunkt, nicht personenbezogen ausgewertet).

## 3. Rechtsgrundlage

Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).

## 4. Auftragsverarbeiter

Supabase, Inc. (Authentifizierung & Datenbank, EU-West Frankfurt gehostet), Vercel Inc. (Hosting & CDN), neue Medien Münnich (transaktionaler E-Mail-Versand, Server in Deutschland). Datenübertragung in die USA jeweils auf Grundlage der EU-Standardvertragsklauseln gemäß Art. 46 DSGVO.

## 5. Cookies & Google Analytics

Technisch notwendiger Session-Token via Supabase (localStorage). Google Analytics 4 wird erst nach Zustimmung im Cookie-Banner aktiviert (Google Consent Mode v2, Rechtsgrundlage Art. 6 Abs. 1 lit. a DSGVO).

## 6. Speicherdauer

Daten bleiben gespeichert, solange das Konto aktiv ist. Nach Konto-Löschung: Löschung personenbezogener Daten innerhalb von 30 Tagen, technische Protokolldaten nach spätestens 90 Tagen.

## 7. Deine Rechte

Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21), Beschwerde bei einer Aufsichtsbehörde (Art. 77). Zuständig: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach. Kontakt zur Rechteausübung: hallo@renditly.de

## 8. Datensicherheit

HTTPS/TLS-Verschlüsselung, Row-Level-Security in der Datenbank — jeder Nutzer sieht ausschließlich eigene Daten.

${frontLinks()}`
);

// ─── 404-Markdown (Fix 2: agentenfreundliche 404) ──────────────────────────
// Bewusst NICHT über write()/manifest laufen lassen: "/404" ist keine echte
// Seite, sondern das Fehlerdokument, das middleware.js gezielt für
// nicht-existente Pfade ausliefert (siehe ALL_ROUTE_SET-Check dort).
writeFileSync(
  path.join(PUBLIC_DIR, '404.md'),
  `# 404 – Seite nicht gefunden

Die angeforderte Seite existiert nicht (mehr) unter dieser Adresse — der Link war vermutlich ein Tippfehler oder verweist auf eine entfernte Seite.

## Wo es weitergeht

- Startseite: https://www.renditly.de/
- Vollständige Sitemap (alle gültigen URLs): https://www.renditly.de/sitemap.xml
- Maschinenlesbare Seitenübersicht für Agenten: https://www.renditly.de/llms.txt
- Hilfe-Center: https://www.renditly.de/hilfe
- Kostenlose Rechner: https://www.renditly.de/mietrendite-rechner, https://www.renditly.de/afa-rechner, https://www.renditly.de/grunderwerbsteuer-rechner
- Marktdaten nach Stadt: https://www.renditly.de/mietrendite-staedte
`,
  'utf-8'
);

// ─── Alle gültigen Routen der Seite (aus der bereits erzeugten sitemap.xml) ─
// Wird von middleware.js genutzt, um zwischen "Seite existiert als HTML,
// aber (noch) nicht als Markdown" (→ 406 bzw. HTML-Fallback) und "Seite
// existiert überhaupt nicht" (→ agentenfreundlicher Markdown-404, Fix 2) zu
// unterscheiden — OHNE dafür zur Laufzeit die eigentliche Anfrage erneut
// intern anzufragen (self-fetch-Risiko in Edge-Middleware vermieden).
// Setzt voraus, dass `node scripts/generate-sitemap.js` bereits gelaufen ist
// (siehe "prebuild"-Skript in package.json: sitemap vor markdown).
const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
let allRoutes = [];
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, 'utf-8');
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  allRoutes = locs.map((loc) => {
    try {
      const p = new URL(loc).pathname;
      return p === '' ? '/' : p.replace(/\/+$/, '') || '/';
    } catch {
      return null;
    }
  }).filter(Boolean);
} else {
  console.warn('⚠ public/sitemap.xml nicht gefunden — ALL_ROUTES-Manifest bleibt leer. ' +
    'Stelle sicher, dass generate-sitemap.js vor generate-markdown.js läuft.');
}
// Handverwaltete Routen ergänzen, die (noch) nicht in der Sitemap stehen,
// aber real existieren bzw. in Kürze existieren (Trust-Anchor-Seiten, Fix 6).
for (const extra of ['/', '/hilfe', '/about', '/contact', '/privacy']) {
  if (!allRoutes.includes(extra)) allRoutes.push(extra);
}

// ─── Manifeste schreiben (von middleware.js zur Build-Zeit importiert) ────
const manifestModule = `// Automatisch generiert von scripts/generate-markdown.js — nicht von Hand editieren.
//
// MARKDOWN_ROUTES: Routen, für die public/<pfad>.md existiert.
// ALL_ROUTES: alle real existierenden Routen der Seite (aus sitemap.xml +
// handgepflegte Ergänzungen), genutzt um "Seite existiert, aber (noch) kein
// Markdown" von "Seite existiert gar nicht" zu unterscheiden — ohne
// Self-Fetch zur Laufzeit.
export const MARKDOWN_ROUTES = ${JSON.stringify(manifest, null, 2)};

export const ALL_ROUTES = ${JSON.stringify(allRoutes, null, 2)};
`;
mkdirSync(path.join(ROOT, 'lib'), { recursive: true });
writeFileSync(path.join(ROOT, 'lib', 'markdown-manifest.generated.mjs'), manifestModule, 'utf-8');

console.log(`✓ ${manifest.length} Markdown-Geschwister erzeugt (public/*.md), ${allRoutes.length} Routen im ALL_ROUTES-Manifest.`);
