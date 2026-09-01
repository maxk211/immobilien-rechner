-- ─── Migration 010: Benachrichtigung bei neuer User-Registrierung ────────────
--
-- Löst bei jedem INSERT auf auth.users (= neue Registrierung) einen Aufruf der
-- Edge Function new-user-notification aus, die eine Mail an die Founder
-- verschickt. Nutzt denselben pg_net/vault-Mechanismus wie Migration 008
-- (trial-reminder-emails) — der dortige "service_role_key"-Vault-Eintrag wird
-- hier wiederverwendet, keine zusätzliche Einrichtung nötig, sofern Migration
-- 008 bereits eingerichtet wurde.
--
-- WICHTIG: Die Trigger-Funktion fängt alle Fehler ab (EXCEPTION WHEN OTHERS)
-- und lässt den INSERT in jedem Fall durchlaufen — ein Ausfall der Mail-
-- Benachrichtigung darf niemals eine Registrierung blockieren.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://gjuevmfacphhxiholonz.supabase.co/functions/v1/new-user-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := jsonb_build_object('email', NEW.email, 'user_id', NEW.id, 'created_at', NEW.created_at)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Benachrichtigung fehlgeschlagen (z.B. Secret fehlt noch, Netzwerkproblem) —
  -- Registrierung darf davon nie betroffen sein, deshalb hier nur loggen.
  RAISE WARNING 'notify_new_user_signup fehlgeschlagen: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP TRIGGER IF EXISTS on_auth_user_created_notify ON auth.users;
CREATE TRIGGER on_auth_user_created_notify
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_signup();
