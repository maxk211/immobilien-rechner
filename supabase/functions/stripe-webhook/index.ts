// ─── Supabase Edge Function: stripe-webhook ──────────────────────────────────
// Empfängt Events von Stripe und aktualisiert die subscriptions-Tabelle.
// Bei anonymem Checkout: erstellt Supabase-User aus Stripe-E-Mail + sendet Magic Link.
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

// Price ID → Plan-Name Mapping (Fallback falls Stripe Metadata fehlt)
const PRICE_PLAN_MAP: Record<string, string> = {
  'price_1TrO4kAgxhdShtqv66hFPJL9': 'starter',
  'price_1TrO4tAgxhdShtqv3GY2EPsO': 'starter',
  'price_1TrO51AgxhdShtqvT6Ap9FLZ': 'standard',
  'price_1TrO57AgxhdShtqvSGMPwSPQ': 'standard',
  'price_1TrO5DAgxhdShtqvULJ8EUHi': 'pro',
  'price_1TrO5MAgxhdShtqvWWC3AQAa': 'pro',
};

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

        // User-ID aus Metadata (Auth-Checkout) oder E-Mail (Anon-Checkout)
        const metaUserId = session.metadata?.supabase_user_id
          ?? (session.subscription_data as any)?.metadata?.supabase_user_id;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
          { expand: ['items.data.price'] }
        );

        if (metaUserId) {
          // Eingeloggter User — direkt upserten
          await upsertSubscription(metaUserId, session.customer as string, subscription);
        } else {
          // Anon-Checkout: User aus Stripe-E-Mail erstellen oder finden
          const email = session.customer_details?.email;
          if (!email) {
            console.error('Kein E-Mail in checkout.session.completed');
            break;
          }
          const userId = await getOrCreateUser(email);
          if (userId) {
            await upsertSubscription(userId, session.customer as string, subscription);
            // Magic Link senden damit User sich einloggen kann
            await sendMagicLink(email);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const fullSub = await stripe.subscriptions.retrieve(
            subscription.id,
            { expand: ['items.data.price'] }
          );
          await upsertSubscription(userId, subscription.customer as string, fullSub);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', plan: 'free', updated_at: new Date().toISOString() })
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

// ─── Supabase User erstellen oder finden ─────────────────────────────────────
async function getOrCreateUser(email: string): Promise<string | null> {
  // Versuche User anzulegen (schlägt fehl wenn bereits vorhanden)
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true, // E-Mail direkt bestätigt (Stripe hat sie schon verifiziert)
  });

  if (!createError && createData?.user?.id) {
    console.log(`Neuer User erstellt: ${email} → ${createData.user.id}`);
    return createData.user.id;
  }

  // User existiert bereits — per listUsers suchen
  console.log(`User existiert bereits, suche: ${email}`);
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('listUsers Fehler:', listError);
    return null;
  }

  const existing = users?.find(u => u.email === email);
  if (existing) {
    console.log(`User gefunden: ${email} → ${existing.id}`);
    return existing.id;
  }

  console.error(`User nicht gefunden und nicht erstellbar: ${email}`);
  return null;
}

// ─── Magic Link senden ────────────────────────────────────────────────────────
async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: 'https://www.renditly.de/app?checkout=success',
    },
  });

  if (error) {
    console.error('Magic Link Fehler:', error);
  } else {
    console.log(`Magic Link gesendet an: ${email}`);
  }
}

// ─── Plan aus Subscription extrahieren ───────────────────────────────────────
function extractPlan(subscription: Stripe.Subscription): string {
  const priceItem = subscription.items?.data?.[0];
  if (!priceItem) return 'starter';
  const price = priceItem.price as Stripe.Price;
  if (price?.metadata?.plan) return price.metadata.plan;
  if (subscription.metadata?.plan) return subscription.metadata.plan;
  if (price?.id && PRICE_PLAN_MAP[price.id]) return PRICE_PLAN_MAP[price.id];
  return 'starter';
}

// ─── Subscription in Supabase upserten ───────────────────────────────────────
async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  subscription: Stripe.Subscription
) {
  const plan = extractPlan(subscription);

  const { error } = await supabase.from('subscriptions').upsert({
    user_id:                userId,
    stripe_customer_id:     stripeCustomerId,
    stripe_subscription_id: subscription.id,
    status:                 subscription.status,
    plan,
    current_period_start:   new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end:     new Date(subscription.current_period_end   * 1000).toISOString(),
    cancel_at_period_end:   subscription.cancel_at_period_end,
    updated_at:             new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) console.error('Supabase upsert Fehler:', error);
  else console.log(`Subscription aktualisiert: user=${userId} plan=${plan} status=${subscription.status}`);
}
