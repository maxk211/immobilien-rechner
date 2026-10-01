// Bündelt einen JSX-Test mit esbuild und führt ihn in Node aus.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const datei = process.argv[2];
mkdirSync('node_modules/.cache', { recursive: true });
const out = `node_modules/.cache/${datei.replace(/[^a-z0-9]/gi, '_')}.cjs`;
await build({
  entryPoints: [datei], bundle: true, platform: 'node', jsx: 'automatic', loader: { '.js': 'jsx' },
  define: { 'import.meta.env': JSON.stringify({ VITE_SUPABASE_URL: 'http://test.local', VITE_SUPABASE_ANON_KEY: 'test' }) },
  external: ['jsdom'], format: 'esm', banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
  outfile: out.replace(/\.cjs$/, '.mjs'), logLevel: 'error',
});
execFileSync('node', [out.replace(/\.cjs$/, '.mjs')], { stdio: 'inherit' });
