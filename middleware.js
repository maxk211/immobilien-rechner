// ─── Vercel Edge Middleware: Markdown-Content-Negotiation ──────────────────
//
// Implementiert das von acceptmarkdown.com veröffentlichte Protokoll für
// dieses (Vite/statische) Deployment: fragt ein Client per
// `Accept: text/markdown` an, wird — sofern vorhanden — die passende
// `public/<pfad>.md`-Geschwisterdatei mit `Content-Type: text/markdown` und
// korrektem `Vary: Accept`-Header ausgeliefert. Andernfalls läuft die
// Anfrage unverändert durch die normale Vercel-Static-/Rewrite-Auflösung
// (index.html, andere Seiten, 404.html) — mit demselben Vary-Header ergänzt,
// damit CDN-Caches HTML- und Markdown-Varianten nie verwechseln.
//
// Referenzen:
// - https://acceptmarkdown.com/recipes/cloudflare-workers (Negotiation-Algorithmus)
// - https://acceptmarkdown.com/recipes/nextjs (Vercel-Hosting-Hinweise)
// - https://vercel.com/docs/routing-middleware/api (Middleware-API, "other" Framework)
//
// Bewusste Design-Entscheidung: KEIN `fetch(request)`/Self-Fetch der
// eigentlichen HTML-Antwort innerhalb der Middleware, um jedes Risiko einer
// Middleware-Selbst-Rekursion auszuschließen (Vercel dokumentiert für
// Nicht-Next.js-Projekte kein zu Cloudflares `env.ASSETS.fetch()`
// äquivalentes Origin-Binding, das eine erneute Middleware-Invocation
// nachweislich umgeht). Stattdessen wird zur Build-Zeit ein Manifest aller
// real existierenden Routen erzeugt (siehe scripts/generate-markdown.js,
// Quelle: sitemap.xml) und hier ohne Netzwerk-Roundtrip nachgeschlagen, um
// zwischen "Seite existiert, aber (noch) kein Markdown" (→ HTML-Fallback
// bzw. 406) und "Seite existiert gar nicht" (→ agentenfreundlicher
// Markdown-404, Fix 2) zu unterscheiden. Das einzige `fetch()` in dieser
// Datei lädt eine `.md`-Datei — ein Pfad, der per STATIC_EXT sofort und
// unbedingt durchgereicht wird, falls er die Middleware erneut durchläuft.

import { next } from '@vercel/functions';
import { preferredType, appendVaryAccept, markdownPath, STATIC_EXT } from './lib/accept-negotiation.mjs';
import { MARKDOWN_ROUTES, ALL_ROUTES } from './lib/markdown-manifest.generated.mjs';

export const config = {
  // Alles außer: Vercel-interne Pfade und die eingeloggte App (/app —
  // verhält sich wie eine reine SPA, ist bereits per robots.txt von
  // Crawlern ausgeschlossen und braucht keine Markdown-Negotiation).
  matcher: ['/((?!_vercel|app).*)'],
};

const MARKDOWN_ROUTE_SET = new Set(MARKDOWN_ROUTES);
const ALL_ROUTE_SET = new Set(ALL_ROUTES);

function normalizedPathname(pathname) {
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = normalizedPathname(url.pathname);

  // Statische Assets (Bilder, CSS, JS, bereits maschinenlesbare Dateien wie
  // .xml/.json/.md selbst) unangetastet durchreichen — keine Negotiation nötig.
  if (STATIC_EXT.test(pathname)) {
    return next();
  }

  const accept = request.headers.get('accept');
  const chosen = preferredType(accept, ['text/html', 'text/markdown']);

  // Client lehnt sowohl HTML als auch Markdown explizit ab (z. B. strikter
  // "Accept: application/json"-Header ohne Wildcard) → 406 Not Acceptable.
  if (chosen === null) {
    const headers = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
    appendVaryAccept(headers);
    return new Response(
      'Not Acceptable: dieser Server liefert text/html oder text/markdown aus.\n',
      { status: 406, headers }
    );
  }

  if (chosen === 'text/markdown') {
    if (MARKDOWN_ROUTE_SET.has(pathname)) {
      // Markdown-Geschwisterdatei existiert nachweislich (Build-Zeit-Manifest)
      // → laden und mit korrektem Content-Type + Vary ausliefern.
      const mdUrl = new URL(markdownPath(pathname), url.origin);
      const mdResponse = await fetch(mdUrl);
      if (mdResponse.ok) {
        const headers = new Headers(mdResponse.headers);
        headers.set('Content-Type', 'text/markdown; charset=utf-8');
        appendVaryAccept(headers);
        return new Response(mdResponse.body, { status: 200, headers });
      }
      // Unerwarteter Fall (Manifest sagt "vorhanden", Datei nicht abrufbar) —
      // auf die normale 404/Fallback-Logik unten weiterlaufen lassen.
    }

    if (!ALL_ROUTE_SET.has(pathname)) {
      // Pfad existiert nachweislich nicht (siehe ALL_ROUTES-Manifest, Quelle
      // sitemap.xml) → agentenfreundliche Markdown-404 (Fix 2) statt einer
      // mit "text/markdown" unvereinbaren HTML-Fehlerseite.
      let body;
      try {
        const md404 = await fetch(new URL('/404.md', url.origin));
        body = md404.ok
          ? await md404.text()
          : '# 404 – Seite nicht gefunden\n\nSiehe [/sitemap.xml](/sitemap.xml) und [/llms.txt](/llms.txt).\n';
      } catch {
        body = '# 404 – Seite nicht gefunden\n\nSiehe [/sitemap.xml](/sitemap.xml) und [/llms.txt](/llms.txt).\n';
      }
      const headers = new Headers({ 'Content-Type': 'text/markdown; charset=utf-8' });
      appendVaryAccept(headers);
      return new Response(body, { status: 404, headers });
    }

    // Seite existiert als HTML, aber (noch) nicht als Markdown. Nur per
    // HTML ausliefern, wenn der Accept-Header text/html überhaupt zulässt.
    const htmlStillAcceptable = preferredType(accept, ['text/html']) === 'text/html';
    if (!htmlStillAcceptable) {
      const headers = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
      appendVaryAccept(headers);
      return new Response('Not Acceptable: für diesen Pfad ist aktuell nur text/html verfügbar.\n', {
        status: 406,
        headers,
      });
    }
    return next({ headers: { Vary: 'Accept, Accept-Encoding' } });
  }

  // Standardfall: text/html (explizit gewünscht, oder kein/leerer Accept-
  // Header). Normale Vercel-Routing-Kette fortsetzen (next()) und dabei den
  // Vary-Header ergänzen, damit CDN-Caches HTML/Markdown nie verwechseln —
  // sowie, falls eine Markdown-Variante existiert, sie per Link-Header
  // bewerben (RFC 8288 alternate-Relation, von acceptmarkdown.com empfohlen).
  const extraHeaders = { Vary: 'Accept, Accept-Encoding' };
  if (MARKDOWN_ROUTE_SET.has(pathname)) {
    extraHeaders.Link = `<${markdownPath(pathname)}>; rel="alternate"; type="text/markdown"`;
  }
  return next({ headers: extraHeaders });
}
