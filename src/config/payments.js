// ─── Payments Konfiguration ───────────────────────────────────────────────────
//
// PAYMENTS_LIVE = false  →  Alle User haben Pro, keine Einschränkungen
// PAYMENTS_LIVE = true   →  3-Tier aktiv (Trial → Starter → Standard → Pro)
//
// Zum Aktivieren: PAYMENTS_LIVE auf `true` + Vercel Env Vars setzen
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENTS_LIVE = true;

// Trial: 90 Tage kostenlos, 1 Immobilie (kein Kreditkarte nötig)
export const TRIAL_DAYS = 90;

// ─── Founder-Zugang ───────────────────────────────────────────────────────────
// Diese E-Mails bekommen dauerhaft den Pro-Plan, ohne Trial-Limit und ohne
// Stripe-Checkout — geprüft in useSubscription.js, noch bevor die
// Trial/Subscription-Logik überhaupt greift. Vergleich case-insensitive.
export const FOUNDER_EMAILS = [
  'maxkammel21@gmail.com',
  'kammelmax@icloud.com',
  'david@davidschmidbauer.com',
];

export function isFounderEmail(email) {
  return !!email && FOUNDER_EMAILS.includes(email.toLowerCase());
}

// ─── Plan-Definitionen ────────────────────────────────────────────────────────
// plan-Key muss mit price.metadata.plan in Stripe übereinstimmen
// maxImmobilien: Infinity = unlimitiert
export const PLANS = {
  free: {
    label:           'Kostenlos',
    maxImmobilien:   1,
    color:           'gray',
  },
  trial: {
    label:           'Kostenlos testen',
    maxImmobilien:   1,
    color:           'gray',
  },
  starter: {
    label:           'Starter',
    maxImmobilien:   1,
    color:           'indigo',
    prices: {
      monthly: {
        id:      import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || 'price_1TrO4kAgxhdShtqv66hFPJL9',
        display: '4,99 €',
        amount:  499,
      },
      yearly: {
        id:         import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY || 'price_1TrO4tAgxhdShtqv3GY2EPsO',
        display:    '47,88 €',
        perMonth:   '3,99 €',
        amount:     4788,
        saveLabel:  '20 % Rabatt',
      },
    },
  },
  standard: {
    label:           'Standard',
    maxImmobilien:   10,
    color:           'indigo',
    popular:         true,
    prices: {
      monthly: {
        id:      import.meta.env.VITE_STRIPE_PRICE_STANDARD_MONTHLY || 'price_1TrO51AgxhdShtqvT6Ap9FLZ',
        display: '12,49 €',
        amount:  1249,
      },
      yearly: {
        id:         import.meta.env.VITE_STRIPE_PRICE_STANDARD_YEARLY || 'price_1TrO57AgxhdShtqvSGMPwSPQ',
        display:    '119,88 €',
        perMonth:   '9,99 €',
        amount:     11988,
        saveLabel:  '20 % Rabatt',
      },
    },
  },
  pro: {
    label:           'Pro',
    maxImmobilien:   Infinity,
    color:           'amber',
    prices: {
      monthly: {
        id:      import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_1TrO5DAgxhdShtqvULJ8EUHi',
        display: '24,99 €',
        amount:  2499,
      },
      yearly: {
        id:         import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || 'price_1TrO5MAgxhdShtqvWWC3AQAa',
        display:    '239,88 €',
        perMonth:   '19,99 €',
        amount:     23988,
        saveLabel:  '20 % Rabatt',
      },
    },
  },
};

// Hilfsfunktion: Max-Immobilien für einen Plan
export function getMaxImmobilien(planKey) {
  return PLANS[planKey]?.maxImmobilien ?? 1;
}

// Hilfsfunktion: Ist der Plan ein bezahlter Plan?
export function isPaidPlan(planKey) {
  return ['starter', 'standard', 'pro'].includes(planKey);
}
