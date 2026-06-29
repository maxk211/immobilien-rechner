-- ─── Subscriptions Tabelle ───────────────────────────────────────────────────
-- Wird von Stripe Webhook befüllt und von useSubscription gelesen.
-- Diese Migration ausführen sobald Payments live gehen sollen.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status                 text NOT NULL DEFAULT 'inactive',
  -- Mögliche Status: active, trialing, past_due, canceled, inactive
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean DEFAULT false,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- Index für schnelle User-Lookups
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- RLS aktivieren
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- User darf nur eigene Subscription lesen
CREATE POLICY "User sieht eigene Subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Nur Service Role (Webhook) darf schreiben
CREATE POLICY "Service Role schreibt Subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Updated_at automatisch setzen
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();
