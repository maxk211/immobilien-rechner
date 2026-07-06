-- =====================================================
-- Migration 005: Alle fehlenden Spalten + fehlende Tabellen
-- =====================================================
-- Deckt folgende Lücken ab:
--   A) immobilien: Spalten die im Code existieren aber nie migriert wurden
--   B) mieter: Tabelle fehlt komplett (004 hat nur ALTER, kein CREATE)
--   C) nebenkostenabrechnungen: Tabelle fehlt komplett
--   D) kalkulationen: Tabelle fehlt komplett
-- Alle ADD COLUMN Statements nutzen IF NOT EXISTS → safe zum Wiederholen.
-- =====================================================


-- =====================================================
-- A) IMMOBILIEN – fehlende Spalten
-- =====================================================

-- Aus MIGRATION_FIELDS (explizit als "nachträglich" markiert,
-- aber noch nicht in einer eigenen Migration gelandet):

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS aktiv BOOLEAN DEFAULT TRUE;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS aufgabedatum DATE DEFAULT NULL;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS miet_anpassungen JSONB DEFAULT '[]';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS mietvertrag_ende DATE DEFAULT NULL;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS dauerauftrag BOOLEAN DEFAULT FALSE;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS dauerauftrag_betrag NUMERIC DEFAULT NULL;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS zaehler JSONB DEFAULT '[]';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS bausparvertraege JSONB DEFAULT '[]';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS stellplatz JSONB DEFAULT NULL;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS eigentumsform TEXT DEFAULT 'allein';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS user_anteil NUMERIC DEFAULT 100;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS gbr_partner JSONB DEFAULT '[]';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS dokumente JSONB DEFAULT '[]';

-- Nicht in MIGRATION_FIELDS, aber in appToDb() referenziert
-- und NICHT im originalen Schema (supabase-schema.sql) vorhanden:

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS vermietungsmodell TEXT DEFAULT 'kaltmiete';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS nebenkosten_vom_mieter NUMERIC DEFAULT 0;

-- Sicherheitshalber: Migration 002 + 003 Felder (falls DB älter als Schema)
-- wohnungen, voll_eigenfinanziert, geschenkt (002)
ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS wohnungen JSONB DEFAULT '[]';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS voll_eigenfinanziert BOOLEAN DEFAULT FALSE;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS geschenkt BOOLEAN DEFAULT FALSE;

-- afa_anpassungen, grundsteuer_monat, versicherung_monat (003)
ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS afa_anpassungen JSONB DEFAULT '[]';

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS grundsteuer_monat NUMERIC(10,2) DEFAULT 0;

ALTER TABLE immobilien
  ADD COLUMN IF NOT EXISTS versicherung_monat NUMERIC(10,2) DEFAULT 0;


-- =====================================================
-- B) MIETER – Tabelle + alle Spalten anlegen
-- =====================================================
-- Migration 004 hat "ALTER TABLE mieter ADD COLUMN" ausgeführt,
-- aber die Tabelle wurde nirgendwo erstellt.
-- CREATE TABLE IF NOT EXISTS ist sicher: existiert die Tabelle
-- bereits (z.B. manuell angelegt), passiert nichts.

CREATE TABLE IF NOT EXISTS public.mieter (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),

  -- Bezug zur Immobilie
  immobilie_id            UUID REFERENCES public.immobilien(id) ON DELETE CASCADE,

  -- Stammdaten
  name                    TEXT NOT NULL,
  email                   TEXT DEFAULT NULL,
  telefon                 TEXT DEFAULT NULL,
  zimmer_bezeichnung      TEXT DEFAULT NULL,

  -- Mietvertrag
  mietbeginn              DATE DEFAULT NULL,
  mietende                DATE DEFAULT NULL,
  kaltmiete               NUMERIC DEFAULT NULL,
  vertragstyp             TEXT DEFAULT 'unbefristet',
  kuendigungsfrist        TEXT DEFAULT '3 Monate',

  -- Kaution
  kaution_betrag          NUMERIC DEFAULT NULL,
  kaution_bezahlt         BOOLEAN DEFAULT FALSE,
  kaution_bezahlt_am      DATE DEFAULT NULL,
  kaution_zurueck         BOOLEAN DEFAULT FALSE,
  kaution_zurueck_am      DATE DEFAULT NULL,
  kaution_abzug           NUMERIC DEFAULT 0,
  kaution_abzug_grund     TEXT DEFAULT NULL,

  -- Auszug / Übergabe
  auszugsdatum            DATE DEFAULT NULL,
  zaehlerstand_strom      NUMERIC DEFAULT NULL,
  zaehlerstand_wasser     NUMERIC DEFAULT NULL,
  zaehlerstand_heizung    NUMERIC DEFAULT NULL,
  schluessel_zurueck      BOOLEAN DEFAULT FALSE,
  zustand_notizen         TEXT DEFAULT NULL,

  -- Mahnwesen
  mahnstufe               INTEGER DEFAULT 0,
  letzte_mahnung_am       DATE DEFAULT NULL,

  -- Status & Notizen
  aktiv                   BOOLEAN DEFAULT TRUE,
  notizen                 TEXT DEFAULT NULL,

  -- Mietanpassungen (Migration 004)
  naechste_anpassung_datum DATE DEFAULT NULL,
  mietanpassungen_mieter  JSONB DEFAULT '[]',
  letzte_mieterhoehung    DATE DEFAULT NULL
);

-- Index & Trigger für mieter
CREATE INDEX IF NOT EXISTS idx_mieter_user_id      ON public.mieter(user_id);
CREATE INDEX IF NOT EXISTS idx_mieter_immobilie_id ON public.mieter(immobilie_id);

CREATE OR REPLACE FUNCTION update_mieter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mieter_updated_at ON public.mieter;
CREATE TRIGGER update_mieter_updated_at
  BEFORE UPDATE ON public.mieter
  FOR EACH ROW
  EXECUTE FUNCTION update_mieter_updated_at();

-- RLS für mieter
ALTER TABLE public.mieter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mieter"   ON public.mieter;
DROP POLICY IF EXISTS "Users can insert own mieter" ON public.mieter;
DROP POLICY IF EXISTS "Users can update own mieter" ON public.mieter;
DROP POLICY IF EXISTS "Users can delete own mieter" ON public.mieter;

CREATE POLICY "Users can view own mieter"   ON public.mieter FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mieter" ON public.mieter FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mieter" ON public.mieter FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own mieter" ON public.mieter FOR DELETE USING (auth.uid() = user_id);

-- Falls Tabelle bereits existierte: Migration-004-Felder nachträglich ergänzen
ALTER TABLE public.mieter ADD COLUMN IF NOT EXISTS vertragstyp             TEXT DEFAULT 'unbefristet';
ALTER TABLE public.mieter ADD COLUMN IF NOT EXISTS kuendigungsfrist        TEXT DEFAULT '3 Monate';
ALTER TABLE public.mieter ADD COLUMN IF NOT EXISTS naechste_anpassung_datum DATE DEFAULT NULL;
ALTER TABLE public.mieter ADD COLUMN IF NOT EXISTS mietanpassungen_mieter  JSONB DEFAULT '[]';
ALTER TABLE public.mieter ADD COLUMN IF NOT EXISTS letzte_mieterhoehung    DATE DEFAULT NULL;


-- =====================================================
-- C) NEBENKOSTENABRECHNUNGEN – Tabelle anlegen
-- =====================================================

CREATE TABLE IF NOT EXISTS public.nebenkostenabrechnungen (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),

  -- Bezüge
  mieter_id               UUID REFERENCES public.mieter(id) ON DELETE SET NULL,
  immobilie_id            UUID REFERENCES public.immobilien(id) ON DELETE CASCADE,

  -- Abrechnungsdaten
  abrechnungsjahr         INTEGER NOT NULL,
  mieter_name             TEXT DEFAULT '',
  immobilie_name          TEXT DEFAULT '',
  mieterflaeche           NUMERIC DEFAULT 0,
  gesamtflaeche           NUMERIC DEFAULT 0,
  anzahl_parteien         INTEGER DEFAULT 1,

  -- Komplexe Daten
  kostenpositionen        JSONB DEFAULT '[]',
  vorauszahlungen_gesamt  NUMERIC DEFAULT 0,

  -- Status
  status                  TEXT DEFAULT 'entwurf',
  notizen                 TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_nka_user_id      ON public.nebenkostenabrechnungen(user_id);
CREATE INDEX IF NOT EXISTS idx_nka_immobilie_id ON public.nebenkostenabrechnungen(immobilie_id);
CREATE INDEX IF NOT EXISTS idx_nka_mieter_id    ON public.nebenkostenabrechnungen(mieter_id);

CREATE OR REPLACE FUNCTION update_nka_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_nka_updated_at ON public.nebenkostenabrechnungen;
CREATE TRIGGER update_nka_updated_at
  BEFORE UPDATE ON public.nebenkostenabrechnungen
  FOR EACH ROW
  EXECUTE FUNCTION update_nka_updated_at();

-- RLS für nebenkostenabrechnungen
ALTER TABLE public.nebenkostenabrechnungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own nka"   ON public.nebenkostenabrechnungen;
DROP POLICY IF EXISTS "Users can insert own nka" ON public.nebenkostenabrechnungen;
DROP POLICY IF EXISTS "Users can update own nka" ON public.nebenkostenabrechnungen;
DROP POLICY IF EXISTS "Users can delete own nka" ON public.nebenkostenabrechnungen;

CREATE POLICY "Users can view own nka"   ON public.nebenkostenabrechnungen FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nka" ON public.nebenkostenabrechnungen FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nka" ON public.nebenkostenabrechnungen FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own nka" ON public.nebenkostenabrechnungen FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- D) KALKULATIONEN – Tabelle anlegen
-- =====================================================

CREATE TABLE IF NOT EXISTS public.kalkulationen (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  name        TEXT DEFAULT 'Kalkulation',
  typ         TEXT DEFAULT 'kauf',
  params      JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_kalkulationen_user_id ON public.kalkulationen(user_id);

CREATE OR REPLACE FUNCTION update_kalkulationen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_kalkulationen_updated_at ON public.kalkulationen;
CREATE TRIGGER update_kalkulationen_updated_at
  BEFORE UPDATE ON public.kalkulationen
  FOR EACH ROW
  EXECUTE FUNCTION update_kalkulationen_updated_at();

-- RLS für kalkulationen
ALTER TABLE public.kalkulationen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own kalkulationen"   ON public.kalkulationen;
DROP POLICY IF EXISTS "Users can insert own kalkulationen" ON public.kalkulationen;
DROP POLICY IF EXISTS "Users can update own kalkulationen" ON public.kalkulationen;
DROP POLICY IF EXISTS "Users can delete own kalkulationen" ON public.kalkulationen;

CREATE POLICY "Users can view own kalkulationen"   ON public.kalkulationen FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kalkulationen" ON public.kalkulationen FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kalkulationen" ON public.kalkulationen FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own kalkulationen" ON public.kalkulationen FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- FERTIG – Migration 005 abgeschlossen
-- =====================================================
