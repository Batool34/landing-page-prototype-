-- PASTE into Lovable → Cloud → Database → SQL editor → Run
-- Fixes: "Could not find the function public.upsert_lead(... p_is_test ...)"
-- Your app expects upsert_lead with p_is_test; this updates the DB to match.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.next_waitlist_position()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(87201419);
  next_pos := COALESCE(
    (SELECT MAX(waitlist_position) FROM public.leads WHERE COALESCE(is_test, false) = false),
    118
  ) + 1;
  IF next_pos < 119 THEN
    next_pos := 119;
  END IF;
  RETURN next_pos;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_lead(
  p_visitor_id TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL,
  p_referred_by TEXT DEFAULT NULL,
  p_waitlist_position INTEGER DEFAULT NULL,
  p_prefs JSONB DEFAULT '{}'::jsonb,
  p_saved_meals JSONB DEFAULT '[]'::jsonb,
  p_user_agent TEXT DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_id UUID;
  assigned_pos INTEGER;
  existing_pos INTEGER;
  existing_is_test BOOLEAN;
  want_test BOOLEAN := COALESCE(p_is_test, false);
BEGIN
  IF p_visitor_id IS NULL OR length(trim(p_visitor_id)) = 0 THEN
    RAISE EXCEPTION 'visitor_id required';
  END IF;

  SELECT waitlist_position, COALESCE(is_test, false)
  INTO existing_pos, existing_is_test
  FROM public.leads
  WHERE visitor_id = p_visitor_id;

  IF existing_pos IS NOT NULL AND existing_is_test = want_test THEN
    assigned_pos := existing_pos;
  ELSIF want_test THEN
    PERFORM pg_advisory_xact_lock(87201419);
    assigned_pos := COALESCE(
      (SELECT MAX(waitlist_position) FROM public.leads WHERE COALESCE(is_test, false) = true),
      9000
    ) + 1;
  ELSE
    assigned_pos := public.next_waitlist_position();
  END IF;

  INSERT INTO public.leads (
    visitor_id, phone, email, referral_code, referred_by,
    waitlist_position, prefs, saved_meals, user_agent, is_test, updated_at
  )
  VALUES (
    p_visitor_id,
    NULLIF(trim(p_phone), ''),
    NULLIF(lower(trim(p_email)), ''),
    p_referral_code,
    p_referred_by,
    assigned_pos,
    COALESCE(p_prefs, '{}'::jsonb),
    COALESCE(p_saved_meals, '[]'::jsonb),
    p_user_agent,
    want_test,
    now()
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, public.leads.phone),
    email = COALESCE(EXCLUDED.email, public.leads.email),
    referral_code = COALESCE(EXCLUDED.referral_code, public.leads.referral_code),
    referred_by = COALESCE(EXCLUDED.referred_by, public.leads.referred_by),
    waitlist_position = COALESCE(public.leads.waitlist_position, EXCLUDED.waitlist_position),
    prefs = CASE
      WHEN EXCLUDED.prefs IS NULL OR EXCLUDED.prefs = '{}'::jsonb THEN public.leads.prefs
      ELSE public.leads.prefs || EXCLUDED.prefs
    END,
    saved_meals = COALESCE(EXCLUDED.saved_meals, public.leads.saved_meals),
    user_agent = COALESCE(EXCLUDED.user_agent, public.leads.user_agent),
    is_test = public.leads.is_test OR EXCLUDED.is_test,
    updated_at = now()
  RETURNING id INTO lead_id;

  RETURN lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_lead TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.next_waitlist_position() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_waitlist_position() TO anon, authenticated, service_role;

-- Mark your founder account as test (so you can re-join while developing)
UPDATE public.leads
SET is_test = true
WHERE lower(email) = 'batoolin34@gmail.com'
   OR phone_digits = public.normalize_phone_digits('0540535190')
   OR phone_digits = public.normalize_phone_digits('+966540535190');

-- Notify PostgREST to reload schema (clears "schema cache" errors)
NOTIFY pgrst, 'reload schema';
