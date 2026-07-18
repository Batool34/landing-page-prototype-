-- PASTE THIS into Lovable → Cloud → Database → SQL editor → Run
-- Fixes empty leads table + enables phone/email signups to save as leads.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
CREATE POLICY "Anyone can read leads"
  ON public.leads FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read events" ON public.events;
CREATE POLICY "Anyone can read events"
  ON public.events FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.upsert_lead(
  p_visitor_id TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL,
  p_referred_by TEXT DEFAULT NULL,
  p_waitlist_position INTEGER DEFAULT NULL,
  p_prefs JSONB DEFAULT '{}'::jsonb,
  p_saved_meals JSONB DEFAULT '[]'::jsonb,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_id UUID;
BEGIN
  IF p_visitor_id IS NULL OR length(trim(p_visitor_id)) = 0 THEN
    RAISE EXCEPTION 'visitor_id required';
  END IF;

  INSERT INTO public.leads (
    visitor_id, phone, email, referral_code, referred_by,
    waitlist_position, prefs, saved_meals, user_agent, updated_at
  )
  VALUES (
    p_visitor_id,
    NULLIF(trim(p_phone), ''),
    NULLIF(lower(trim(p_email)), ''),
    p_referral_code,
    p_referred_by,
    p_waitlist_position,
    COALESCE(p_prefs, '{}'::jsonb),
    COALESCE(p_saved_meals, '[]'::jsonb),
    p_user_agent,
    now()
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, public.leads.phone),
    email = COALESCE(EXCLUDED.email, public.leads.email),
    referral_code = COALESCE(EXCLUDED.referral_code, public.leads.referral_code),
    referred_by = COALESCE(EXCLUDED.referred_by, public.leads.referred_by),
    waitlist_position = COALESCE(EXCLUDED.waitlist_position, public.leads.waitlist_position),
    prefs = CASE
      WHEN EXCLUDED.prefs IS NULL OR EXCLUDED.prefs = '{}'::jsonb THEN public.leads.prefs
      ELSE public.leads.prefs || EXCLUDED.prefs
    END,
    saved_meals = COALESCE(EXCLUDED.saved_meals, public.leads.saved_meals),
    user_agent = COALESCE(EXCLUDED.user_agent, public.leads.user_agent),
    updated_at = now()
  RETURNING id INTO lead_id;

  RETURN lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_lead TO anon, authenticated, service_role;

-- Backfill leads from signup events that already exist
INSERT INTO public.leads (visitor_id, phone, email, prefs, created_at, updated_at)
SELECT DISTINCT ON (e.visitor_id)
  e.visitor_id,
  NULLIF(COALESCE(e.phone, e.payload->>'phone'), ''),
  NULLIF(lower(COALESCE(e.payload->>'email', '')), ''),
  '{}'::jsonb,
  e.created_at,
  e.created_at
FROM public.events e
WHERE e.event_type IN ('waitlist_signup', 'phone_captured', 'onboarding_completed')
  AND e.visitor_id IS NOT NULL
ORDER BY e.visitor_id, e.created_at DESC
ON CONFLICT (visitor_id) DO UPDATE SET
  phone = COALESCE(EXCLUDED.phone, public.leads.phone),
  email = COALESCE(EXCLUDED.email, public.leads.email),
  updated_at = GREATEST(public.leads.updated_at, EXCLUDED.updated_at);
