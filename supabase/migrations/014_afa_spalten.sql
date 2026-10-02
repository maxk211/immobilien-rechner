-- Migration 014: AfA-Spalten nachziehen
--
-- Seit der degressiven AfA (Juli 2026) schreibt die App afa_modus und
-- afa_degressiv_wechseljahr, eine Migration dafür fehlte im Repo. Fehlen die
-- Spalten, konnte das Speichern Felder verlieren. IF NOT EXISTS: in Datenbanken,
-- in denen die Spalten schon (von Hand) angelegt wurden, passiert nichts.

ALTER TABLE public.immobilien ADD COLUMN IF NOT EXISTS afa_modus TEXT DEFAULT 'linear';
ALTER TABLE public.immobilien ADD COLUMN IF NOT EXISTS afa_degressiv_wechseljahr INTEGER DEFAULT NULL;
