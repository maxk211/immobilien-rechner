-- Fix: "record new has no field updatet_at" beim Speichern von Mietanpassungen
-- (Tab "Mieter"). Ursache: Auf der Live-DB hängt am public.mieter-Trigger
-- offenbar eine Funktion mit Tippfehler (updatet_at statt updated_at), die nicht
-- aus den Migrationsdateien in diesem Repo stammt. Dieses Skript räumt auf:
-- 1) stellt sicher, dass die Spalte "updated_at" existiert
-- 2) entfernt ALLE bestehenden Trigger auf public.mieter (nur der eine,
--    fehlerhafte "updated_at"-Trigger ist dort vorgesehen)
-- 3) legt Funktion + Trigger sauber und korrekt geschrieben neu an
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → Run.
-- Idempotent, kann gefahrlos mehrfach ausgeführt werden.

ALTER TABLE public.mieter
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'public.mieter'::regclass AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.mieter', r.tgname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION update_mieter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mieter_updated_at
  BEFORE UPDATE ON public.mieter
  FOR EACH ROW
  EXECUTE FUNCTION update_mieter_updated_at();
