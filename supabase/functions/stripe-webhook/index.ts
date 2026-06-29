// ─── Supabase Edge Function: stripe-webhook ──────────────────────────────────
// Empfängt Events von Stripe und aktualisiert die subscriptions-Tabelle.
//
// Deployment (wenn Payments live gehen):
//   supabase functions deploy stripe-webhook
//
// Benötigte Secrets:
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// In Stripe Dashboard eintragen:
//   Webhook URL: https://<project>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, customer.subscription.*
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature ?? '',
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    );
  } catch (err) {
    console.error('Webhook Signatur ungültig:', err.message);
    return new Response(`Webhook Fehler: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.supabase_user_id
          ?? session.subscription_data?.metadata?.supabase_user_id;

        if (!userId) {
          console.error('Kein supabase_user_id in Session-Metadata');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await upsertSubscription(userId, session.customer as string, subscription);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await upsertSubscription(userId, subscription.customer as string, subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      default:
        console.log(`Unbehandeltes Event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Webhook Verarbeitungsfehler:', err);
    return new Response(`Server Fehler: ${err.message}`, { status: 500 });
  }
});

async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  subscription: Stripe.Subscription
) {
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) console.error('Supabase upsert Fehler:', error);
}
