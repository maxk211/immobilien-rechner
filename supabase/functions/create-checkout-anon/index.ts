// ─── Supabase Edge Function: create-checkout-anon ────────────────────────────
// Erstellt eine Stripe Checkout Session OHNE eingeloggten User.
// Stripe sammelt E-Mail und Zahlung — der Webhook erstellt danach den Account.
//
// Kein Authorization-Header nötig (öffentlich aufrufbar).
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { priceId, planKey } = body;

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'priceId fehlt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stripe Checkout Session erstellen — kein Customer, Stripe sammelt E-Mail
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
      custom_fields: [{
        key: 'company_name',
        label: { type: 'custom', custom: 'Firmenname (optional)' },
        type: 'text',
        optional: true,
      }],
      success_url: 'https://renditly.de?checkout=success',
      cancel_url:  'https://renditly.de?checkout=cancel',
      locale: 'de',
      subscription_data: {
        metadata: { plan: planKey ?? 'starter' },
      },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('create-checkout-anon Fehler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
