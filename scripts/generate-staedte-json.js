#!/usr/bin/env node
// Generiert public/daten/staedte.json: maschinenlesbarer Datenfeed der 18 Städte-
// Kennzahlen, damit KI-Agents/Skripte strukturierte Daten direkt abfragen können,
// statt HTML-Seiten zu parsen. Quelle ist STAEDTE_LISTE — bleibt automatisch
// konsistent mit den Städte-Seiten, dem Report und llms-full.txt.

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STAEDTE_LISTE } from '../src/staedte/staedteDaten.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE_URL = 'https://www.renditly.de';

const payload = {
  quelle: 'renditly.de',
  stand: '2026-08',
  hinweis: 'Tier-1-Städte (Berlin bis Essen): Engel & Völkers Marktbericht, Stand Juni 2026. Tier-2-Städte: aggregiert aus mehreren Immobilienportalen, Stand August 2026. Werte sind Durchschnittswerte (Angebotspreise) und können je nach Lage stark abweichen.',
  lizenz: 'Freie Nutzung mit Quellenangabe (Link auf renditly.de)',
  staedte: STAEDTE_LISTE.map((s) => ({
    name: s.name,
    slug: s.slug,
    url: `${BASE_URL}/mietrendite-${s.slug}`,
    kaufpreisProM2Eur: s.kaufpreisM2,
    kaltmieteProM2Eur: s.mieteM2,
    bruttomietrenditeProzent: s.bruttorendite,
  })),
};

mkdirSync(resolve(ROOT, 'public/daten'), { recursive: true });
writeFileSync(resolve(ROOT, 'public/daten/staedte.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`public/daten/staedte.json geschrieben: ${payload.staedte.length} Städte.`);
