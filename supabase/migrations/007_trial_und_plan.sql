-- ─── Migration 007: Trial-Tracking + Plan-Spalte ─────────────────────────────
--
-- Fügt trial_started_at und plan zur subscriptions-Tabelle hinzu.
-- Erlaubt Usern, sich selbst einen Trial-Eintrag zu erstellen (INSERT only).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan            text DEFAULT 'free';

-- Policy: User darf eigenen Trial-Record anlegen (INSERT, eigene user_id)
-- Update/Delete bleibt Service-Role vorbehalten (Webhook).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'subscriptions'
      AND policyname = 'User startet Trial'
  ) THEN
    CREATE POLICY "User startet Trial"
      ON public.subscriptions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
