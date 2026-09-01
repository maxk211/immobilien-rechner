# renditly — Projekt-Übersicht

SaaS-Tool zur Immobilienportfolio-Verwaltung (Mietrendite, Cashflow, Steuer,
Mieterverwaltung) für deutsche Vermieter/Investoren.

## Stack

- **Frontend**: React 18 + Vite 5, Tailwind CSS, lucide-react (Icons),
  recharts (Charts), react-hot-toast. Kein React Router — Multi-Page-Setup
  über Vite `rollupOptions.input` (siehe `vite.config.js`), jede Marketing-/
  SEO-Seite (Rechner, Städte, Vergleiche, Ratgeber) ist eine eigene
  HTML-Entry-Datei mit eigenem JS-Bundle. Nur `/app` (Dashboard) ist eine
  echte SPA (`src/main.jsx` liest `window.location.pathname` und rendert
  passend, kein clientseitiges Routing zwischen Seiten).

- **Hosting**: **Vercel** — NICHT Netlify. `vercel.json` enthält alle
  Rewrites (dedizierte Seiten-URLs → jeweilige `.html`-Datei + `/app` →
  `index.html`). Kein `netlify.toml` mehr im Repo (wurde entfernt, nachdem
  eine frühere Session fälschlicherweise davon ausging, die Seite liefe auf
  Netlify, und Wochen an SEO/Routing-Arbeit in die falsche Config-Datei
  steckte — die war nie live). **Wichtig: Bei neuen Seiten/Routen IMMER
  `vercel.json` aktualisieren, sonst landet die neue URL nur im
  client-seitigen SPA-Fallback (main.jsx `ROUTES`), nie in der dedizierten
  HTML-Datei mit korrektem Title/Description/JSON-LD für Crawler.**
  Auto-Deploy bei Push nach `main` über Vercels GitHub-Integration.

- **Backend**: Supabase (Postgres, Auth, Edge Functions/Deno, pg_cron +
  pg_net für geplante Jobs, Vault für Secrets in Migrationen). Deploy via
  GitHub Actions (`.github/workflows/supabase-deploy.yml`) bei Push auf
  `supabase/**`.

- **Payments**: Stripe (Checkout, Webhooks). Plan-Zuordnung serverseitig via
  `PRICE_PLAN_MAP`/Preis-Metadata — Client-Metadata wird nie vertraut
  (Sicherheitsfix, siehe Git-Historie `stripe-webhook`).

- **E-Mail**: Transaktionale Mails (Trial-Reminder etc.) über bestehende
  all-inkl.com/neue Medien Münnich SMTP-Infrastruktur via denomailer aus
  Supabase Edge Functions — kein separater E-Mail-Anbieter.

- **Analytics**: GA4 (`G-K3VNNVZPS7`) mit Google Consent Mode v2, eigener
  vanilla-JS Cookie-Consent-Banner (`public/consent-banner.js`), Consent
  standardmäßig verweigert bis Nutzer zustimmt.

## Rechtliches

`src/components/ImpressumDatenschutz.jsx` listet die Auftragsverarbeiter
(aktuell: Supabase, Vercel, all-inkl.com). Bei Änderung des Stacks
(Hosting-Wechsel, neuer Dienstleister) dieses Dokument UND das Stand-Datum
mit aktualisieren — es ist ein rechtlich relevantes Dokument (DSGVO).

## SEO-Infrastruktur

- `public/sitemap.xml` wird per `scripts/generate-sitemap.js` (läuft als
  `prebuild`) aus Content-Hashes generiert — `lastmod` ändert sich nur, wenn
  sich der tatsächliche Seiteninhalt ändert, nicht bei jedem Deploy.
  Zustand liegt in `scripts/sitemap-lastmod-state.json` (git-getrackt).
- `public/404.html` — eigene 404-Seite, wird von Vercel automatisch für
  nicht gematchte Pfade mit echtem 404-Status ausgeliefert (kein Rewrite
  dafür nötig/gewünscht).
- Neue programmatic-SEO-Seiten (Städte, Vergleiche o.ä.) brauchen: HTML-Entry
  + Route in `vite.config.js` + Eintrag in `vercel.json` + Eintrag in
  `scripts/generate-sitemap.js` + Route in `src/main.jsx` `ROUTES` (SPA-
  Fallback) + interner Link von einer bestehenden Seite aus (Startseite hat
  eine "Kostenlose Tools & Ratgeber"-Sektion dafür).

## Lokale Umgebung (Max' Mac)

- Projektordner liegt immer unter `/Users/maximiliankammel/immobilien-rechner`.
  Bei Git-Bundle-Handoffs (wenn die Sandbox keinen Netzwerkzugriff auf GitHub
  hat) diesen Pfad direkt in die `cd`-Anweisung einsetzen, nicht raten oder
  Platzhalter wie `~/pfad/zu/...` verwenden.

## Deploy-Log
- 2026-08-09: Manueller Redeploy getriggert, um Vercel Edge-Cache für
  `/mietrendite-rechner` und `/ratgeber/afa-und-steuern-vermietung` zu
  invalidieren (lieferten trotz korrektem Build noch alten Cache-Inhalt aus).
