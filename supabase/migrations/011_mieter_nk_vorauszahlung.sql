-- Migration 011: Mieter-Felder für NK-Vorauszahlung und Gesamtüberweisung
-- Ausführen in: Supabase Dashboard → SQL Editor
-- Abschnitt Phase 8f: fehlten bisher explizit als per-Mieter-Felder
-- (NK-Vorauszahlung gab es nur auf Immobilien-Ebene, Gesamtüberweisung gar nicht).

ALTER TABLE mieter ADD COLUMN IF NOT EXISTS nk_vorauszahlung NUMERIC;
ALTER TABLE mieter ADD COLUMN IF NOT EXISTS gesamtueberweisung NUMERIC;
