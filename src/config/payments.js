// ─── Payments Konfiguration ───────────────────────────────────────────────────
//
// PAYMENTS_LIVE = false  →  Alle User haben Pro, keine Einschränkungen
// PAYMENTS_LIVE = true   →  Free Tier aktiv, Stripe Checkout greift
//
// Zum Aktivieren: diesen Wert auf `true` setzen + Stripe Keys in .env eintragen
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENTS_LIVE = false;

// Free Tier Limits (greifen nur wenn PAYMENTS_LIVE = true)
export const FREE_TIER = {
  maxImmobilien: 1,
};

// Stripe Produkt-Konfiguration
export const STRIPE_CONFIG = {
  priceId: import.meta.env.VITE_STRIPE_PRICE_ID || 'price_PLACEHOLDER',
  successUrl: `${window.location.origin}?checkout=success`,
  cancelUrl: `${window.location.origin}?checkout=cancel`,
};
