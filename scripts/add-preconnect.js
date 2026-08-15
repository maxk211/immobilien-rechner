#!/usr/bin/env node
// Einmaliges Utility-Skript (Performance-Audit): fügt <link rel="preconnect">
// für Google Tag Manager in alle bestehenden HTML-Dateien ein, die den
// GA4-Snippet enthalten aber noch kein preconnect haben. Nicht Teil der
// regulären Build-Pipeline — die Generator-Skripte (generate-*.js) enthalten
// das preconnect bereits im Template für künftig generierte Seiten.

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const files = execSync(
  `grep -rl 'googletagmanager.com/gtag/js' --include="*.html" .`,
  { cwd: ROOT }
).toString().trim().split('\n')
  .filter((f) => f && !f.startsWith('./dist/') && !f.startsWith('./node_modules/'));

let changed = 0;
for (const rel of files) {
  const p = resolve(ROOT, rel);
  const content = readFileSync(p, 'utf-8');
  if (content.includes('rel="preconnect" href="https://www.googletagmanager.com"')) continue;
  const patched = content.replace(
    /(<meta charset="UTF-8" \/>\n)/,
    `$1    <link rel="preconnect" href="https://www.googletagmanager.com" />\n`
  );
  if (patched !== content) {
    writeFileSync(p, patched, 'utf-8');
    changed++;
  }
}

console.log(`✓ preconnect ergänzt in ${changed} von ${files.length} HTML-Dateien`);
