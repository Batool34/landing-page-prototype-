-- PASTE into Lovable → Cloud → Database → SQL editor → Run
-- Makes waitlist rank unique and incrementing (no more #119 for everyone).

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
  next_pos := COALESCE((SELECT MAX(waitlist_position) FROM public.leads), 118) + 1;
  IF next_pos < 119 THEN
    next_pos := 119;
  END IF;
  RETURN next_pos;
END;
$$;

REVOKE ALL ON FUNCTION public.next_waitlist_position() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_waitlist_position() TO anon, authenticated, service_role;

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
  assigned_pos INTEGER;
  existing_pos INTEGER;
BEGIN
  IF p_visitor_id IS NULL OR length(trim(p_visitor_id)) = 0 THEN
    RAISE EXCEPTION 'visitor_id required';
  END IF;

  SELECT waitlist_position INTO existing_pos
  FROM public.leads
  WHERE visitor_id = p_visitor_id;

  IF existing_pos IS NOT NULL THEN
    assigned_pos := existing_pos;
  ELSE
    assigned_pos := public.next_waitlist_position();
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
    assigned_pos,
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
    waitlist_position = COALESCE(public.leads.waitlist_position, EXCLUDED.waitlist_position),
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

-- Give every existing lead a unique rank by signup order (starts at #119).
WITH ordered AS (
  SELECT
    id,
    118 + ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM public.leads
)
UPDATE public.leads l
SET waitlist_position = o.rn
FROM ordered o
WHERE l.id = o.id;
