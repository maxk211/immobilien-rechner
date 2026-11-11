-- ─── Migration 015: Sicherheit vor dem Launch ───────────────────────────────
--
-- 1) Trial-Eintrag: Nutzer durften bisher JEDEN Datensatz für sich anlegen — auch
--    status='active', plan='investor', current_period_end=2099 (= bezahlter Plan
--    ohne Zahlung) oder einen Trial mit Startdatum in der Zukunft. Jetzt nur noch
--    ein echter Trial: plan/status 'trial', keine Stripe-Daten, Start ≈ jetzt.
-- 2) Ein Abo-Datensatz je Nutzer (falls noch keine Doppelten existieren).
-- 3) immobilien: Row Level Security sicherstellen. Die Tabelle wurde ursprünglich
--    im Dashboard angelegt; hier wird nur ergänzt, was fehlt (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "User startet Trial" ON public.subscriptions;
CREATE POLICY "User startet Trial"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'trial'
    AND plan = 'trial'
    AND stripe_customer_id IS NULL
    AND stripe_subscription_id IS NULL
    AND current_period_end IS NULL
    AND trial_started_at IS NOT NULL
    AND trial_started_at BETWEEN now() - interval '1 day' AND now() + interval '1 day'
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'subscriptions' AND indexname = 'subscriptions_user_id_unique')
     AND NOT EXISTS (SELECT user_id FROM public.subscriptions GROUP BY user_id HAVING count(*) > 1) THEN
    CREATE UNIQUE INDEX subscriptions_user_id_unique ON public.subscriptions(user_id);
  END IF;
END $$;

-- immobilien: nur eigene Datensätze — Policies nur anlegen, wenn die Tabelle noch keine hat
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'immobilien') THEN
    CREATE POLICY "Eigene Immobilien lesen"     ON public.immobilien FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Eigene Immobilien anlegen"   ON public.immobilien FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Eigene Immobilien ändern"    ON public.immobilien FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Eigene Immobilien löschen"   ON public.immobilien FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
ALTER TABLE public.immobilien ENABLE ROW LEVEL SECURITY;
