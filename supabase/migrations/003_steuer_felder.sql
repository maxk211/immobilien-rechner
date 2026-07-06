-- Migration 003: AfA-Anpassungen und Steuer-Felder persistieren
-- Ausführen im Supabase SQL Editor: https://app.supabase.com -> SQL Editor

ALTER TABLE immobilien ADD COLUMN IF NOT EXISTS afa_anpassungen JSONB DEFAULT '[]';
ALTER TABLE immobilien ADD COLUMN IF NOT EXISTS grundsteuer_monat NUMERIC(10,2) DEFAULT 0;
ALTER TABLE immobilien ADD COLUMN IF NOT EXISTS versicherung_monat NUMERIC(10,2) DEFAULT 0;
