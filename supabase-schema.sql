-- =====================================================
-- SUPABASE SCHEMA FÜR IMMOBILIEN-RECHNER
-- =====================================================
-- Führe dieses SQL im Supabase Dashboard aus:
-- 1. Gehe zu deinem Projekt auf supabase.com
-- 2. Klicke auf "SQL Editor" in der linken Sidebar
-- 3. Füge diesen gesamten Code ein und klicke "Run"
-- =====================================================

-- Tabelle für Immobilien
CREATE TABLE IF NOT EXISTS immobilien (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Grunddaten
  name TEXT,
  plz TEXT,
  adresse TEXT,
  immobilien_typ TEXT DEFAULT 'kaufimmobilie', -- 'kaufimmobilie' oder 'mietimmobilie'
  objektart TEXT DEFAULT 'eigentumswohnung',
  zustand TEXT DEFAULT 'gut',

  -- Objektdetails
  wohnflaeche NUMERIC DEFAULT 80,
  grundstueck NUMERIC DEFAULT 0,
  zimmer NUMERIC DEFAULT 3,
  baujahr INTEGER DEFAULT 2000,
  stockwerk INTEGER DEFAULT 1,
  energieeffizienz TEXT DEFAULT 'C',
  balkon BOOLEAN DEFAULT FALSE,
  garage BOOLEAN DEFAULT FALSE,
  keller BOOLEAN DEFAULT FALSE,

  -- Kaufimmobilie Finanzdaten
  kaufpreis NUMERIC DEFAULT 0,
  kaufdatum DATE,
  eigenkapital NUMERIC DEFAULT 0,
  ek_fuer_nebenkosten NUMERIC DEFAULT 0,
  ek_fuer_kaufpreis NUMERIC DEFAULT 0,
  kaltmiete NUMERIC DEFAULT 0,
  geschaetzter_wert NUMERIC DEFAULT 0,

  -- Finanzierung
  zinssatz NUMERIC DEFAULT 4.0,
  tilgung NUMERIC DEFAULT 2.0,
  laufzeit INTEGER DEFAULT 25,
  finanzierungsbetrag NUMERIC,
  kaufnebenkosten NUMERIC DEFAULT 10,
  kaufnebenkosten_modus TEXT DEFAULT 'prozent',
  bundesland TEXT DEFAULT 'bayern',

  -- Kosten
  nebenkosten NUMERIC DEFAULT 200,
  instandhaltung NUMERIC DEFAULT 100,
  verwaltung NUMERIC DEFAULT 30,
  hausgeld NUMERIC DEFAULT 0,
  strom NUMERIC DEFAULT 0,
  internet NUMERIC DEFAULT 0,

  -- Prognose
  wertsteigerung NUMERIC DEFAULT 2.0,
  mietsteigerung NUMERIC DEFAULT 1.5,

  -- Steuer
  steuersatz NUMERIC DEFAULT 42,
  gebaeude_anteil_prozent NUMERIC DEFAULT 80,
  afa_satz NUMERIC DEFAULT 2.0,
  fahrtkosten_modus TEXT DEFAULT 'pauschal',
  fahrten_pro_monat INTEGER DEFAULT 0,
  entfernung_km NUMERIC DEFAULT 0,
  km_pauschale NUMERIC DEFAULT 0.30,

  -- Mietimmobilie (Arbitrage)
  eigene_warmmiete NUMERIC DEFAULT 0,
  anzahl_zimmer_vermietet INTEGER DEFAULT 0,
  untermiete_pro_zimmer NUMERIC DEFAULT 0,
  arbitrage_strom NUMERIC DEFAULT 0,
  arbitrage_internet NUMERIC DEFAULT 0,
  arbitrage_gez NUMERIC DEFAULT 18.36,
  mietvertrag_start DATE,

  -- JSON Felder für komplexe Daten
  finanzierungsphasen JSONB DEFAULT '[]',
  miet_historie JSONB DEFAULT '{}',
  miet_eingaenge JSONB DEFAULT '[]',
  fahrten_liste JSONB DEFAULT '[]',
  investitionen JSONB DEFAULT '[]',
  kaufnebenkosten_positionen JSONB
);

-- Index für schnelle User-Abfragen
CREATE INDEX IF NOT EXISTS idx_immobilien_user_id ON immobilien(user_id);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_immobilien_updated_at ON immobilien;
CREATE TRIGGER update_immobilien_updated_at
  BEFORE UPDATE ON immobilien
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Jeder User sieht nur seine eigenen Immobilien
-- =====================================================

-- RLS aktivieren
ALTER TABLE immobilien ENABLE ROW LEVEL SECURITY;

-- Policy: Users können nur ihre eigenen Immobilien sehen
DROP POLICY IF EXISTS "Users can view own immobilien" ON immobilien;
CREATE POLICY "Users can view own immobilien" ON immobilien
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users können nur eigene Immobilien erstellen
DROP POLICY IF EXISTS "Users can insert own immobilien" ON immobilien;
CREATE POLICY "Users can insert own immobilien" ON immobilien
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users können nur eigene Immobilien updaten
DROP POLICY IF EXISTS "Users can update own immobilien" ON immobilien;
CREATE POLICY "Users can update own immobilien" ON immobilien
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users können nur eigene Immobilien löschen
DROP POLICY IF EXISTS "Users can delete own immobilien" ON immobilien;
CREATE POLICY "Users can delete own immobilien" ON immobilien
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FERTIG!
-- =====================================================
-- Nach dem Ausführen:
-- 1. Gehe zu "Authentication" -> "Providers"
-- 2. Aktiviere "Email" als Provider
-- 3. Optional: Deaktiviere "Confirm email" für schnelleres Testen
-- =====================================================
