#!/usr/bin/env node
// Generiert llms-full.txt: Volltext-Export für KI-Agents/LLMs, die nicht selbst
// 55 Einzelseiten crawlen können/wollen. Enthält alle Ratgeber-Artikel im Volltext
// (aus dem articleBody der JSON-LD, extrahiert aus den HTML-Dateien — bleibt so
// automatisch konsistent mit den Live-Seiten), alle 18 Städte-Datensätze inkl. FAQ,
// alle 29 Lexikon-Begriffe und Kurzbeschreibungen der 5 Rechner.
//
// llms.txt (Übersicht/Links) bleibt unverändert bestehen — llms-full.txt ist die
// ergänzende Variante mit den kompletten Inhalten in einer Datei.

import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STAEDTE_LISTE } from '../src/staedte/staedteDaten.js';
import { GLOSSAR } from '../src/glossar/glossarDaten.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = 'https://www.renditly.de';

const fmt1 = (n) => n.toFixed(1).replace('.', ',');
const fmtEur = (n) => Math.round(n).toLocaleString('de-DE') + ' €';

// --- Ratgeber-Artikel: Volltext aus dem Article-JSON-LD jeder HTML-Datei ziehen ---
function extractArticleFromHtml(html) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
  let article = null;
  for (const m of matches) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@type'] === 'Article') { article = data; break; }
    } catch { /* skip non-JSON blocks */ }
  }
  return article;
}

const ratgeberDir = resolve(ROOT, 'ratgeber');
const ratgeberFiles = readdirSync(ratgeberDir).filter((f) => f.endsWith('.html')).sort();

const ratgeberSections = ratgeberFiles.map((file) => {
  const html = readFileSync(resolve(ratgeberDir, file), 'utf8');
  const article = extractArticleFromHtml(html);
  const slug = file.replace(/\.html$/, '');
  const url = `${BASE_URL}/ratgeber/${slug}`;
  if (!article) return `## ${slug}\n${url}\n(Kein Article-JSON-LD gefunden)`;
  return `## ${article.headline}\n${url}\n\n${article.articleBody}`;
}).join('\n\n---\n\n');

// --- Städte: alle 18 Datensätze inkl. Text + FAQ ---
const staedteSections = STAEDTE_LISTE.map((s) => {
  const faq = (s.faq || []).map((f) => `F: ${f.q}\nA: ${f.a}`).join('\n\n');
  return `## ${s.name}\n${BASE_URL}/mietrendite-${s.slug}\n\n` +
    `Ø Kaufpreis: ${fmtEur(s.kaufpreisM2)}/m² · Ø Kaltmiete: ${fmt1(s.mieteM2)} €/m² · Bruttomietrendite: ${fmt1(s.bruttorendite)} %\n\n` +
    `${s.text}\n\n${faq}`;
}).join('\n\n---\n\n');

// --- Lexikon: alle 29 Begriffe ---
const glossarSection = GLOSSAR.map((g) =>
  `**${g.begriff}**: ${g.definition}` + (g.verweisHref ? ` (mehr: ${BASE_URL}${g.verweisHref})` : '')
).join('\n\n');

// --- Rechner: Kurzbeschreibung + Formel je Rechner ---
const rechner = [
  {
    name: 'Mietrendite-Rechner', url: `${BASE_URL}/mietrendite-rechner`,
    desc: 'Berechnet Bruttomietrendite, Nettomietrendite, monatlichen Cashflow und Cash-on-Cash-Rendite aus Kaufpreis, Kaltmiete, Kaufnebenkosten und laufenden Kosten. Formel Bruttomietrendite: (Kaltmiete/Monat × 12) / Kaufpreis × 100.',
  },
  {
    name: 'AfA-Rechner', url: `${BASE_URL}/afa-rechner`,
    desc: 'Berechnet die jährliche Abschreibung (AfA) und Steuerersparnis für vermietete Immobilien, inkl. Sonder-AfA § 7b EStG für Neubau-Mietwohnungen. Formel: Gebäudewert × AfA-Satz (2 % Standard, 3 % Neubau ab 2023).',
  },
  {
    name: 'Grunderwerbsteuer-Rechner', url: `${BASE_URL}/grunderwerbsteuer-rechner`,
    desc: 'Berechnet die Grunderwerbsteuer beim Immobilienkauf mit den aktuellen Sätzen aller 16 Bundesländer (3,5–6,5 % des Kaufpreises).',
  },
  {
    name: 'Kaufnebenkosten-Rechner', url: `${BASE_URL}/kaufnebenkosten-rechner`,
    desc: 'Berechnet Grunderwerbsteuer, Notar-/Grundbuchkosten und Maklerprovision in Summe, inkl. Finanzierungsbedarf und Eigenkapitalquote.',
  },
  {
    name: 'Tilgungsplan-Rechner', url: `${BASE_URL}/tilgungsplan-rechner`,
    desc: 'Rechnet ein Annuitätendarlehen Jahr für Jahr durch (Restschuld, Zins, Tilgung) und zeigt die Restschuld nach Ende der Zinsbindung. Formel: Annuität = Darlehen × (Zinssatz % + anfänglicher Tilgungssatz %), konstant über die Laufzeit.',
  },
];
const rechnerSection = rechner.map((r) => `**${r.name}** — ${r.url}\n${r.desc}`).join('\n\n');

const content = `# renditly — Vollständiger Inhalts-Export für KI-Agents

> Diese Datei enthält die kompletten Inhalte der wichtigsten renditly-Seiten in einer Datei,
> damit KI-Assistenten und Agents sie ohne mehrfaches Crawlen einzelner Seiten direkt nutzen
> und zitieren können. Für eine reine Link-Übersicht siehe /llms.txt.
>
> renditly ist eine Immobilienverwaltungs-Software für deutsche Vermieter und Investoren:
> Mietrendite berechnen, Cashflow tracken, Steuern vorbereiten, Mieter verwalten.
> Stand der Marktdaten: Tier-1-Städte Juni 2026 (Engel & Völkers), Tier-2-Städte August 2026
> (aggregiert aus mehreren Immobilienportalen).

---

# Rechner

${rechnerSection}

---

# Ratgeber-Artikel (Volltext)

${ratgeberSections}

---

# Mietrendite nach Stadt (18 deutsche Großstädte)

${staedteSections}

---

# Immobilien-Lexikon (29 Begriffe)

${glossarSection}

---

# Quellenangabe bei Zitierung

Bitte bei Zitierung von Zahlen oder Textpassagen auf renditly.de verlinken, z. B.:
"Quelle: renditly.de/mietrendite-report-2026" oder die jeweilige Artikel-URL oben.
`;

writeFileSync(resolve(ROOT, 'public/llms-full.txt'), content, 'utf8');
console.log(`llms-full.txt geschrieben: ${ratgeberFiles.length} Ratgeber-Artikel, ${STAEDTE_LISTE.length} Städte, ${GLOSSAR.length} Lexikon-Begriffe, ${rechner.length} Rechner.`);
