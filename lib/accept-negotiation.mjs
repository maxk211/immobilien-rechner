// ─── Accept-Header-Content-Negotiation (RFC 9110) ──────────────────────────
//
// Reine, framework-unabhängige Implementierung des von acceptmarkdown.com
// veröffentlichten Referenz-Algorithmus (siehe deren Cloudflare-Workers- und
// Next.js-Rezepte) — korrekte q-Value-Auswertung, Spezifitäts-Tiebreak nach
// RFC 9110 §12.5.1 (spezifischere Media-Ranges schlagen unspezifischere,
// unabhängig vom q-Wert), Client-Reihenfolge als letzter Tiebreak.
//
// Bewusst getrennt von middleware.js gehalten, damit die Logik ohne
// Vercel-/Edge-Runtime in einem einfachen Node-Skript testbar ist
// (siehe scripts/verify-agentic-readiness.mjs).

/**
 * @typedef {{ type: string, q: number, specificity: number }} AcceptEntry
 */

/** @param {string} header @returns {AcceptEntry[]} */
export function parseAccept(header) {
  return header
    .split(',')
    .map((raw) => {
      const parts = raw.trim().split(';').map((s) => s.trim());
      const type = parts[0].toLowerCase();
      if (!type) return null;
      let q = 1;
      for (const param of parts.slice(1)) {
        const [name, value] = param.split('=').map((s) => s.trim());
        if (name === 'q') {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
        }
      }
      const specificity = type === '*/*' ? 0 : type.endsWith('/*') ? 1 : 2;
      return { type, q, specificity };
    })
    .filter((e) => e !== null);
}

/** @param {AcceptEntry} entry @param {string} candidate */
export function matches(entry, candidate) {
  if (entry.type === '*/*') return true;
  if (entry.type.endsWith('/*')) return candidate.startsWith(entry.type.slice(0, -1));
  return entry.type === candidate;
}

/**
 * Ermittelt den bevorzugten Content-Type aus einem Accept-Header, gegeben
 * eine Liste der Typen, die der Server produzieren kann (in Prioritäts-
 * reihenfolge als Fallback bei fehlendem/leerem Accept-Header).
 * @param {string|null} header
 * @param {string[]} produces
 * @returns {string|null} gewählter Typ, oder null bei expliziter Ablehnung aller produzierten Typen
 */
export function preferredType(header, produces) {
  if (!header) return produces[0] ?? null;
  const entries = parseAccept(header);
  if (entries.length === 0) return produces[0] ?? null;

  let bestType = null;
  let bestQ = -1;
  let bestPosition = Infinity;

  for (const candidate of produces) {
    let matched = null;
    let matchedPosition = Infinity;
    for (let idx = 0; idx < entries.length; idx++) {
      const e = entries[idx];
      if (!matches(e, candidate)) continue;
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = e;
        matchedPosition = idx;
      }
    }
    if (matched === null) continue;
    if (matched.q <= 0) continue; // explizite Ablehnung (q=0)

    if (matched.q > bestQ || (matched.q === bestQ && matchedPosition < bestPosition)) {
      bestQ = matched.q;
      bestPosition = matchedPosition;
      bestType = candidate;
    }
  }

  return bestType;
}

/** Ergänzt den Vary-Header um "Accept", ohne bestehende Werte zu verlieren. @param {Headers} headers */
export function appendVaryAccept(headers) {
  const existing = headers.get('Vary');
  if (!existing) {
    headers.set('Vary', 'Accept');
    return;
  }
  const tokens = existing.split(',').map((s) => s.trim().toLowerCase());
  if (!tokens.includes('accept')) {
    headers.set('Vary', `${existing}, Accept`);
  }
}

/**
 * Bildet eine URL-Pfad auf ihr Markdown-Pendant ab. renditly nutzt flache,
 * "pretty" URLs (kein /pfad/index.html-Muster) — daher flaches `<pfad>.md`
 * statt des `<pfad>/index.md`-Musters aus dem Cloudflare-Rezept.
 * @param {string} pathname
 */
export function markdownPath(pathname) {
  const clean = pathname.replace(/\/+$/, '');
  if (clean === '' || clean === '/') return '/index.md';
  return `${clean}.md`;
}

// Dateiendungen, die nie negotiated werden (Assets, bereits maschinenlesbare
// Formate, u.ä.) — direkt durchreichen, Negotiation-Logik nicht anwenden.
export const STATIC_EXT = /\.(?:css|js|mjs|map|png|jpe?g|webp|gif|svg|avif|ico|woff2?|ttf|otf|eot|xml|txt|md|json|pdf|mp4|webm|mp3|wav|ogg|zip)$/i;
