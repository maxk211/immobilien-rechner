// ─── Supabase Edge Function: create-checkout ─────────────────────────────────
// Erstellt eine Stripe Checkout Session für den eingeloggten User.
//
// Deployment (wenn Payments live gehen):
//   supabase functions deploy create-checkout
//
// Benötigte Secrets:
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//   supabase secrets set STRIPE_PRICE_ID=price_...
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // User aus Auth-Header ermitteln
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Nicht eingeloggt' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prüfen ob bereits ein Stripe Customer existiert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    // Neuen Stripe Customer anlegen falls noch keiner existiert
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Customer ID in Supabase speichern
      await supabaseAdmin.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'inactive',
      }, { onConflict: 'user_id' });
    }

    // Stripe Checkout Session erstellen
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{
        price: Deno.env.get('STRIPE_PRICE_ID'),
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin') ?? 'https://renditly.de'}?checkout=success`,
      cancel_url: `${req.headers.get('origin') ?? 'https://renditly.de'}?checkout=cancel`,
      locale: 'de',
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
