-- Migration 002: Mehrfamilienhaus-Wohnungen + Eigenfinanzierungs-Flags
-- Führe dieses SQL im Supabase Dashboard unter SQL Editor aus.

-- Wohnungen-Array für Mehrfamilienhäuser (JSONB)
ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS wohnungen JSONB DEFAULT '[]';

-- 100% Eigenkapital-Flag (kein Kredit)
ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS voll_eigenfinanziert BOOLEAN DEFAULT FALSE;

-- Schenkung/Erbschaft-Flag
ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS geschenkt BOOLEAN DEFAULT FALSE;
