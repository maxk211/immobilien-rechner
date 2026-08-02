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

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mietrenditeRechner: resolve(__dirname, 'mietrendite-rechner.html'),
        afaRechner: resolve(__dirname, 'afa-rechner.html'),
        ratgeberMietrendite: resolve(__dirname, 'ratgeber/mietrendite-berechnen.html'),
        ratgeberCashflow: resolve(__dirname, 'ratgeber/cashflow-bei-immobilien.html'),
        ratgeberAfaSteuer: resolve(__dirname, 'ratgeber/afa-und-steuern-vermietung.html'),
        mietrenditeStaedte: resolve(__dirname, 'mietrendite-staedte.html'),
        ...staedteInputs,
        ...vergleichInputs,
      },
    },
  },
});
