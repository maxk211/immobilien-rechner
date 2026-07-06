-- Migration 004: Mieter-Felder für Vertragstyp, Mietanpassungen, Mieterhöhungs-Tracking
-- Ausführen in: Supabase Dashboard → SQL Editor

ALTER TABLE mieter ADD COLUMN IF NOT EXISTS vertragstyp TEXT DEFAULT 'unbefristet';
ALTER TABLE mieter ADD COLUMN IF NOT EXISTS kuendigungsfrist TEXT DEFAULT '3 Monate';
ALTER TABLE mieter ADD COLUMN IF NOT EXISTS naechste_anpassung_datum DATE;
ALTER TABLE mieter ADD COLUMN IF NOT EXISTS mietanpassungen_mieter JSONB DEFAULT '[]';
ALTER TABLE mieter ADD COLUMN IF NOT EXISTS letzte_mieterhoehung DATE;
