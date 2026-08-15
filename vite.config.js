import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Städte-Seiten (programmatic SEO) automatisch einsammeln, damit neue Städte
// nur in staedteDaten.js + generate-staedte-pages.js ergänzt werden müssen.
const staedteInputs = {};
for (const file of readdirSync(resolve(__dirname, 'staedte'))) {
  if (file.endsWith('.html')) {
    const key = 'staedte-' + file.replace('.html', '');
    staedteInputs[key] = resolve(__dirname, 'staedte', file);
  }
}

// Städte-Vergleichsseiten (programmatic SEO Stufe 2) automatisch einsammeln —
// neue Paare nur in vergleichDaten.js + generate-vergleich-pages.js ergänzen.
const vergleichInputs = {};
for (const file of readdirSync(resolve(__dirname, 'vergleich'))) {
  if (file.endsWith('.html')) {
    const key = 'vergleich-' + file.replace('.html', '');
    vergleichInputs[key] = resolve(__dirname, 'vergleich', file);
  }
}

// Ratgeber-Artikel automatisch einsammeln — neue Artikel nur als HTML-Entry
// in ratgeber/ ablegen, kein manueller Eintrag hier mehr nötig (Quelle für
// den früheren Vercel-Rewrite-Drift-Bug: manuell gepflegte Listen werden
// vergessen).
const ratgeberInputs = {};
for (const file of readdirSync(resolve(__dirname, 'ratgeber'))) {
  if (file.endsWith('.html')) {
    const key = 'ratgeber-' + file.replace('.html', '');
    ratgeberInputs[key] = resolve(__dirname, 'ratgeber', file);
  }
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mietrenditeRechner: resolve(__dirname, 'mietrendite-rechner.html'),
        afaRechner: resolve(__dirname, 'afa-rechner.html'),
        grunderwerbsteuerRechner: resolve(__dirname, 'grunderwerbsteuer-rechner.html'),
        kaufnebenkostenRechner: resolve(__dirname, 'kaufnebenkosten-rechner.html'),
        tilgungsplanRechner: resolve(__dirname, 'tilgungsplan-rechner.html'),
        immobilienLexikon: resolve(__dirname, 'immobilien-lexikon.html'),
        mietrenditeReport: resolve(__dirname, 'mietrendite-report-2026.html'),
        vermieterSoftware: resolve(__dirname, 'vermieter-software.html'),
        mietrenditeStaedte: resolve(__dirname, 'mietrendite-staedte.html'),
        ...staedteInputs,
        ...vergleichInputs,
        ...ratgeberInputs,
      },
    },
  },
});
