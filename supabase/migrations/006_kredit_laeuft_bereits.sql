-- Migration 006: Felder für "Kredit läuft bereits"-Modus
-- Für Immobilien, bei denen die ursprüngliche Finanzierung bereits läuft
-- und der User nur Restschuld + Rate kennt.
-- → Im Supabase Dashboard unter SQL Editor ausführen.

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS kredit_laeuft_bereits BOOLEAN DEFAULT FALSE;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS aktuelle_restschuld NUMERIC DEFAULT 0;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS kredit_monatsrate NUMERIC DEFAULT 0;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS zinsbindung_bis INTEGER DEFAULT NULL;
