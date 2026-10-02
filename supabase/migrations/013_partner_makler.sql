-- ─── Migration 013: Partner-Programm (Makler-QR-Code) ───────────────────────
--
-- Makler bekommen Visitenkarten mit einem QR-Code auf renditly.de/partner.
-- Neue Nutzer wählen dort ihren Makler aus (Tippsuche), registrieren sich und
-- werden dem Makler zugeordnet. Die Pflege der Makler läuft über die Admin-Seite
-- in der App (nur Founder-E-Mails, siehe partner_ist_admin()).
--
-- Sicherheit:
--   • Öffentliche Besucher sehen NIE die Tabelle selbst, nur über
--     partner_makler_suche() Name/Firma/Ort von Maklern mit Status 'aufgenommen'.
--   • Zuordnungen legt nur der Signup-Trigger oder partner_zuordnen() für den
--     eingeloggten Nutzer selbst an — niemand kann fremde Konten zuordnen.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Founder = Admins des Partner-Programms (gleiche Liste wie FOUNDER_EMAILS in
-- src/config/payments.js — bei neuen Team-Mitgliedern beide Stellen pflegen)
CREATE OR REPLACE FUNCTION public.partner_ist_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'maxkammel21@gmail.com',
    'kammelmax@icloud.com',
    'david@davidschmidbauer.com'
  );
$$;

CREATE TABLE IF NOT EXISTS public.makler (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,                 -- Ansprechpartner (z. B. "Anna Berger")
  firma       text,                          -- z. B. "Berger Immobilien"
  ort         text,
  email       text,
  telefon     text,
  status      text NOT NULL DEFAULT 'angeschrieben'
              CHECK (status IN ('angeschrieben', 'aufgenommen', 'pausiert')),
  code        text UNIQUE,                   -- Kurzcode für den persönlichen QR-Code (?m=CODE)
  notiz       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS makler_name_idx  ON public.makler (lower(name));
CREATE INDEX IF NOT EXISTS makler_firma_idx ON public.makler (lower(firma));

CREATE TABLE IF NOT EXISTS public.partner_zuordnungen (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  email            text,
  makler_id        uuid REFERENCES public.makler (id) ON DELETE SET NULL,
  makler_freitext  text,                     -- "Mein Makler ist nicht in der Liste"
  quelle           text NOT NULL DEFAULT 'qr',
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_zuordnungen_makler_idx ON public.partner_zuordnungen (makler_id);

-- updated_at pflegen
CREATE OR REPLACE FUNCTION public.makler_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS makler_touch ON public.makler;
CREATE TRIGGER makler_touch BEFORE UPDATE ON public.makler
  FOR EACH ROW EXECUTE FUNCTION public.makler_touch();

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.makler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_zuordnungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS makler_admin_alles ON public.makler;
CREATE POLICY makler_admin_alles ON public.makler
  FOR ALL TO authenticated
  USING (public.partner_ist_admin()) WITH CHECK (public.partner_ist_admin());

DROP POLICY IF EXISTS zuordnung_admin_lesen ON public.partner_zuordnungen;
CREATE POLICY zuordnung_admin_lesen ON public.partner_zuordnungen
  FOR SELECT TO authenticated USING (public.partner_ist_admin());

DROP POLICY IF EXISTS zuordnung_admin_aendern ON public.partner_zuordnungen;
CREATE POLICY zuordnung_admin_aendern ON public.partner_zuordnungen
  FOR UPDATE TO authenticated
  USING (public.partner_ist_admin()) WITH CHECK (public.partner_ist_admin());

DROP POLICY IF EXISTS zuordnung_admin_loeschen ON public.partner_zuordnungen;
CREATE POLICY zuordnung_admin_loeschen ON public.partner_zuordnungen
  FOR DELETE TO authenticated USING (public.partner_ist_admin());

DROP POLICY IF EXISTS zuordnung_eigene_lesen ON public.partner_zuordnungen;
CREATE POLICY zuordnung_eigene_lesen ON public.partner_zuordnungen
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── Öffentliche Suche (Landingpage) ─────────────────────────────────────────
-- Trefferlogik: Anfangsbuchstaben von Vorname, Nachname, Firma oder Ort.
-- "be" findet "Anna Berger", "Berger Immobilien" und "Bernau".
CREATE OR REPLACE FUNCTION public.partner_makler_suche(q text DEFAULT '')
RETURNS TABLE (id uuid, name text, firma text, ort text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH s AS (SELECT lower(trim(coalesce(q, ''))) AS t)
  SELECT m.id, m.name, m.firma, m.ort
  FROM public.makler m, s
  WHERE m.status = 'aufgenommen'
    AND (
      s.t = ''
      OR lower(m.name)  LIKE s.t || '%'
      OR lower(m.name)  LIKE '% ' || s.t || '%'
      OR lower(coalesce(m.firma, '')) LIKE s.t || '%'
      OR lower(coalesce(m.firma, '')) LIKE '% ' || s.t || '%'
      OR lower(coalesce(m.ort, ''))   LIKE s.t || '%'
    )
  ORDER BY
    (lower(m.name) LIKE s.t || '%' OR lower(coalesce(m.firma, '')) LIKE s.t || '%') DESC,
    lower(m.name)
  LIMIT 8;
$$;

CREATE OR REPLACE FUNCTION public.partner_makler_per_code(c text)
RETURNS TABLE (id uuid, name text, firma text, ort text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.name, m.firma, m.ort FROM public.makler m
  WHERE m.status = 'aufgenommen' AND lower(m.code) = lower(trim(c))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.partner_makler_suche(text)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_makler_per_code(text) TO anon, authenticated;

-- ── Zuordnung für bereits eingeloggte Nutzer ────────────────────────────────
-- (z. B. wer schon ein Konto hatte und erst danach den QR-Code scannt).
-- Erste Zuordnung gewinnt — ein Nutzer gehört genau einem Makler.
CREATE OR REPLACE FUNCTION public.partner_zuordnen(p_makler_id uuid, p_freitext text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  IF p_makler_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.makler WHERE id = p_makler_id AND status = 'aufgenommen'
  ) THEN
    p_makler_id := NULL;
  END IF;
  IF p_makler_id IS NULL AND coalesce(trim(p_freitext), '') = '' THEN RETURN false; END IF;
  INSERT INTO public.partner_zuordnungen (user_id, email, makler_id, makler_freitext, quelle)
  VALUES (v_uid, auth.jwt() ->> 'email', p_makler_id, nullif(left(trim(p_freitext), 120), ''), 'qr-login')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.partner_zuordnen(uuid, text) TO authenticated;

-- ── Zuordnung direkt bei der Registrierung ──────────────────────────────────
-- Die Landingpage gibt partner_makler_id / partner_freitext als user_metadata
-- an signUp() mit. Fehler hier dürfen eine Registrierung NIE blockieren.
CREATE OR REPLACE FUNCTION public.partner_bei_registrierung()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id   uuid;
  v_frei text := nullif(left(trim(coalesce(NEW.raw_user_meta_data ->> 'partner_freitext', '')), 120), '');
BEGIN
  BEGIN
    v_id := nullif(NEW.raw_user_meta_data ->> 'partner_makler_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN v_id := NULL;
  END;
  IF v_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.makler WHERE id = v_id) THEN v_id := NULL; END IF;
  IF v_id IS NOT NULL OR v_frei IS NOT NULL THEN
    INSERT INTO public.partner_zuordnungen (user_id, email, makler_id, makler_freitext, quelle)
    VALUES (NEW.id, NEW.email, v_id, v_frei, 'qr')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'partner_bei_registrierung fehlgeschlagen: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_partner ON auth.users;
CREATE TRIGGER on_auth_user_created_partner
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.partner_bei_registrierung();

-- ── Übersicht für die Admin-Seite: Registrierungen + zahlende Nutzer je Makler ─
CREATE OR REPLACE FUNCTION public.partner_statistik()
RETURNS TABLE (makler_id uuid, registrierungen bigint, zahlend bigint, letzte timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT z.makler_id,
         count(*) AS registrierungen,
         count(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM public.subscriptions s
           WHERE s.user_id = z.user_id AND s.status IN ('active', 'trialing') AND s.stripe_subscription_id IS NOT NULL
         )) AS zahlend,
         max(z.created_at) AS letzte
  FROM public.partner_zuordnungen z
  WHERE public.partner_ist_admin() AND z.makler_id IS NOT NULL
  GROUP BY z.makler_id;
$$;
GRANT EXECUTE ON FUNCTION public.partner_statistik() TO authenticated;
