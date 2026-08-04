-- ─── Migration 008: Trial-Reminder-Tracking + täglicher Cron-Job ─────────────
--
-- Fügt trial_reminders_sent hinzu (welche Erinnerungs-Schwellen — 10/3/1 Tage
-- vor Trial-Ende — bereits verschickt wurden, damit keine Mail doppelt geht).
-- Richtet einen täglichen pg_cron-Job ein, der die Edge Function
-- trial-reminder-emails aufruft.
--
-- WICHTIG — manueller Schritt vor dem ersten Lauf des Cron-Jobs nötig:
-- Der Service-Role-Key darf aus Sicherheitsgründen NICHT im Klartext in
-- dieser (git-versionierten) Migration stehen. Einmalig im Supabase
-- SQL-Editor ausführen (NICHT als Migration committen):
--
--   select vault.create_secret('<dein-service-role-key>', 'service_role_key');
--
-- Den Service-Role-Key findest du unter Project Settings → API → service_role.
-- Ohne diesen Schritt schlägt der Cron-Aufruf mit 401 fehl (kein Datenverlust,
-- die Funktion tut dann einfach nichts).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_reminders_sent jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'trial-reminder-emails-daily',
  '0 8 * * *', -- täglich 08:00 UTC
  $$
  SELECT net.http_post(
    url     := 'https://gjuevmfacphhxiholonz.supabase.co/functions/v1/trial-reminder-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
