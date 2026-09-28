-- Migration 012: Zusatzdaten der Immobilie dauerhaft speichern
-- Ausführen in: Supabase Dashboard → SQL Editor
--
-- Hintergrund (Gegencheck 2): Mehrere im UX-Umbau eingeführte Felder wurden bisher
-- nur im Browser gehalten und beim Speichern NICHT in die Datenbank geschrieben
-- (u.a. Nebenkostenabrechnungen, Kaution, WEG & Verwaltung, Fälligkeitstag der
-- Miete, Datum der letzten Marktwert-Pflege). Sie gehen jetzt gebündelt in eine
-- JSON-Spalte.

ALTER TABLE immobilien ADD COLUMN IF NOT EXISTS zusatzdaten JSONB DEFAULT '{}'::jsonb;
