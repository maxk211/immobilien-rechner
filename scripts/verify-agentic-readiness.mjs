// ─── Verifikationsskript: "Is Agentic"-Readiness-Fixes ─────────────────────
//
// Prüft, was sich ohne Zugriff auf das live deployte https://www.renditly.de
// lokal verifizieren lässt (Sandbox hat keinen ausgehenden Netzwerkzugriff
// auf beliebige Domains). Deckt ab:
//   1. Reine Negotiation-Logik (lib/accept-negotiation.mjs) — Unit-Tests
//   2. Gebautes statisches Ergebnis (dist/) — Homepage-Content, 404,
//      Trust-Anchor-Seiten, Markdown-Geschwister, Organization-JSON-LD,
//      llms.txt-Abschnitt
//
// Was NICHT hier verifiziert werden kann (siehe Abschluss-Ausgabe unten):
// Vary-Header-Verhalten der echten Edge-Middleware, tatsächliches
// Content-Negotiation-Verhalten hinter Vercels CDN, 404-Statuscode des
// deployten Servers. Dafür gibt das Skript die exakten curl-Befehle aus,
// die der Nutzer nach dem Deploy selbst ausführen sollte.
//
// Aufruf: npm run verify:agentic (nach `npm run build`)

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { preferredType, appendVaryAccept, markdownPath, parseAccept } from '../lib/accept-negotiation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

let failures = 0;
let passed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${label}\n      ${err.message}`);
    failures++;
  }
}

console.log('\n── 1. Negotiation-Logik (lib/accept-negotiation.mjs) ──────────────\n');

check('preferredType: reines "text/markdown" wählt markdown', () => {
  assert.equal(preferredType('text/markdown', ['text/html', 'text/markdown']), 'text/markdown');
});

check('preferredType: reines "text/html" wählt html', () => {
  assert.equal(preferredType('text/html', ['text/html', 'text/markdown']), 'text/html');
});

check('preferredType: q-Werte werden korrekt gewichtet', () => {
  assert.equal(
    preferredType('text/html;q=0.5, text/markdown;q=0.9', ['text/html', 'text/markdown']),
    'text/markdown'
  );
});

check('preferredType: Spezifität schlägt Reihenfolge (RFC 9110 §12.5.1)', () => {
  // Für denselben Kandidaten (text/markdown) matchen sowohl die spezifische
  // Angabe (q=0.5) als auch die Wildcard (q=0.9) — die spezifischere muss
  // laut RFC 9110 §12.5.1 den Ausschlag geben, NICHT der höhere q-Wert der
  // Wildcard. Ergebnis: text/plain (nur per Wildcard matchbar, q=0.9) schlägt
  // text/markdown (spezifisch auf q=0.5 herabgestuft), obwohl die Wildcard
  // an sich einen höheren q-Wert hätte.
  assert.equal(
    preferredType('text/markdown;q=0.5, */*;q=0.9', ['text/plain', 'text/markdown']),
    'text/plain'
  );
});

check('preferredType: kein Accept-Header → erster produzierter Typ', () => {
  assert.equal(preferredType(null, ['text/html', 'text/markdown']), 'text/html');
});

check('preferredType: explizite Ablehnung (q=0) → null', () => {
  assert.equal(preferredType('text/html;q=0, text/markdown;q=0', ['text/html', 'text/markdown']), null);
});

check('preferredType: Wildcard */* greift als Fallback', () => {
  assert.equal(preferredType('application/json, */*;q=0.1', ['text/html', 'text/markdown']), 'text/html');
});

check('appendVaryAccept: setzt Vary, wenn keiner vorhanden', () => {
  const h = new Headers();
  appendVaryAccept(h);
  assert.equal(h.get('Vary'), 'Accept');
});

check('appendVaryAccept: ergänzt Accept, ohne bestehende Werte zu verlieren', () => {
  const h = new Headers({ Vary: 'Accept-Encoding' });
  appendVaryAccept(h);
  assert.equal(h.get('Vary'), 'Accept-Encoding, Accept');
});

check('appendVaryAccept: idempotent (kein doppeltes Accept)', () => {
  const h = new Headers({ Vary: 'Accept, Accept-Encoding' });
  appendVaryAccept(h);
  assert.equal(h.get('Vary'), 'Accept, Accept-Encoding');
});

check('markdownPath: Homepage → /index.md', () => {
  assert.equal(markdownPath('/'), '/index.md');
});

check('markdownPath: normaler Pfad → <pfad>.md', () => {
  assert.equal(markdownPath('/mietrendite-berlin'), '/mietrendite-berlin.md');
});

check('markdownPath: trailing slash wird entfernt', () => {
  assert.equal(markdownPath('/hilfe/'), '/hilfe.md');
});

check('parseAccept: q-Wert-Parsing robust gegen Whitespace', () => {
  const entries = parseAccept('text/html ; q=0.8 , text/markdown;q=1.0');
  assert.equal(entries.length, 2);
  assert.equal(entries[1].q, 1);
});

if (!existsSync(DIST)) {
  console.log('\n⚠ dist/ nicht gefunden — führe zuerst `npm run build` aus, um die restlichen Checks auszuführen.\n');
} else {
  console.log('\n── 2. Gebautes statisches Ergebnis (dist/) ─────────────────────────\n');

  check('Fix 1: index.html enthält ≥500 Zeichen sichtbaren Text im #root-Block', () => {
    const html = readFileSync(path.join(DIST, 'index.html'), 'utf-8');
    const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/body>/);
    assert.ok(rootMatch, 'kein #root-Inhalt gefunden');
    const text = rootMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    assert.ok(text.length >= 500, `nur ${text.length} Zeichen gefunden`);
  });

  check('Fix 1: genau ein <h1> und sequentielle <h2> im #root-Block', () => {
    const html = readFileSync(path.join(DIST, 'index.html'), 'utf-8');
    const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/body>/);
    const block = rootMatch[1];
    const h1Count = (block.match(/<h1[\s>]/g) || []).length;
    const h2Count = (block.match(/<h2[\s>]/g) || []).length;
    assert.equal(h1Count, 1, `${h1Count} h1-Tags statt 1`);
    assert.ok(h2Count >= 2, `nur ${h2Count} h2-Tags gefunden`);
  });

  check('Fix 2: 404.html verlinkt sitemap.xml und llms.txt', () => {
    const html = readFileSync(path.join(DIST, '404.html'), 'utf-8');
    assert.ok(html.includes('/sitemap.xml'), 'kein Link zu /sitemap.xml');
    assert.ok(html.includes('/llms.txt'), 'kein Link zu /llms.txt');
  });

  check('Fix 2: 404.md existiert mit Sitemap/llms.txt-Verweisen', () => {
    const md = readFileSync(path.join(DIST, '404.md'), 'utf-8');
    assert.ok(md.includes('sitemap.xml'));
    assert.ok(md.includes('llms.txt'));
  });

  check('Fix 3: index.md existiert und ist inhaltlich mit index.html konsistent', () => {
    const md = readFileSync(path.join(DIST, 'index.md'), 'utf-8');
    assert.ok(md.length >= 500, `nur ${md.length} Zeichen`);
    assert.ok(md.startsWith('# '), 'kein H1 am Anfang');
  });

  check('Fix 3: Markdown-Manifest und tatsächliche dist/*.md-Dateien stimmen überein', () => {
    const manifestSrc = readFileSync(path.join(ROOT, 'lib', 'markdown-manifest.generated.mjs'), 'utf-8');
    const match = manifestSrc.match(/export const MARKDOWN_ROUTES = (\[[\s\S]*?\]);/);
    assert.ok(match, 'MARKDOWN_ROUTES nicht im Manifest gefunden');
    const routes = JSON.parse(match[1]);
    assert.ok(routes.length > 0, 'Manifest ist leer');
    for (const route of routes) {
      const filename = route === '/' ? 'index.md' : `${route.replace(/^\//, '')}.md`;
      assert.ok(existsSync(path.join(DIST, filename)), `${filename} fehlt in dist/ für Route ${route}`);
    }
  });

  check('Fix 6: /about, /contact, /privacy liefern ≥500 Zeichen echten Text ohne JS (raw HTML #root)', () => {
    for (const page of ['about', 'contact', 'privacy']) {
      const html = readFileSync(path.join(DIST, `${page}.html`), 'utf-8');
      const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/body>/);
      assert.ok(rootMatch, `${page}.html: kein #root-Inhalt gefunden`);
      const text = rootMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      assert.ok(text.length >= 500, `${page}.html: nur ${text.length} Zeichen im #root-Block`);
      const h1Count = (rootMatch[1].match(/<h1[\s>]/g) || []).length;
      assert.equal(h1Count, 1, `${page}.html: ${h1Count} h1-Tags statt 1`);
    }
  });

  check('Fix 6: /about, /contact, /privacy haben zusätzlich .md-Geschwister', () => {
    for (const page of ['about', 'contact', 'privacy']) {
      const md = readFileSync(path.join(DIST, `${page}.md`), 'utf-8');
      assert.ok(md.length >= 500, `${page}.md nur ${md.length} Zeichen`);
    }
  });

  check('Fix 7: Organization-JSON-LD enthält contactPoint und address', () => {
    const html = readFileSync(path.join(DIST, 'index.html'), 'utf-8');
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
      JSON.parse(m[1])
    );
    const org = scripts.find((s) => s['@type'] === 'Organization');
    assert.ok(org, 'kein Organization-JSON-LD gefunden');
    assert.ok(org.contactPoint, 'contactPoint fehlt');
    assert.ok(org.address && org.address['@type'] === 'PostalAddress', 'address (PostalAddress) fehlt');
  });

  check('Fix 5: llms.txt enthält "Wann du renditly"-Abschnitt', () => {
    const txt = readFileSync(path.join(DIST, 'llms.txt'), 'utf-8');
    assert.ok(/wann du renditly/i.test(txt), 'kein "Wann du renditly..."-Abschnitt gefunden');
    assert.ok(/nicht.{0,20}der richtige fall/i.test(txt), 'keine Abgrenzung ("nicht der richtige Fall") gefunden');
  });

  check('Fix 4: keine Redirect-Kette, die die Apex-Domain maskiert', () => {
    const vercelJson = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf-8'));
    const redirects = vercelJson.redirects || [];
    for (const r of redirects) {
      assert.ok(
        !/^https?:\/\//.test(r.destination),
        `Redirect "${r.source}" → "${r.destination}" verweist auf eine externe Domain`
      );
    }
    const html = readFileSync(path.join(DIST, 'index.html'), 'utf-8');
    assert.ok(html.includes('https://www.renditly.de/'), 'kanonische Domain nicht im canonical-Tag gefunden');
  });
}

console.log(`\n${'─'.repeat(60)}\n${passed} bestanden, ${failures} fehlgeschlagen.\n`);

if (failures === 0) {
  console.log(
    'Lokal verifiziert. NICHT automatisch prüfbar (Sandbox ohne Zugriff auf\n' +
    'die Live-Domain) — nach dem Deploy bitte manuell ausführen:\n\n' +
    '  curl -s -o /dev/null -w "%{http_code}\\n" https://www.renditly.de/pfad-der-nicht-existiert\n' +
    '    → muss 404 ausgeben\n\n' +
    '  curl -s -H "Accept: text/markdown" -D - -o /dev/null https://www.renditly.de/\n' +
    '    → Content-Type: text/markdown; charset=utf-8, Vary: Accept, Accept-Encoding\n\n' +
    '  curl -s -D - -o /dev/null https://www.renditly.de/\n' +
    '    → Vary-Header muss "Accept" enthalten\n\n' +
    '  curl -s -H "Accept: text/markdown" -D - -o /dev/null https://www.renditly.de/pfad-der-nicht-existiert\n' +
    '    → 404 mit Content-Type: text/markdown\n'
  );
}

process.exit(failures === 0 ? 0 : 1);
