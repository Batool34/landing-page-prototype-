-- PASTE into Lovable → Cloud → Database → SQL editor → Run
-- Marks founder/test signups so they don't trip duplicate validation or pollute ranks.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_leads_is_test ON public.leads (is_test);

-- Unique phone/email only among REAL (non-test) leads.
DROP INDEX IF EXISTS leads_phone_digits_unique;
CREATE UNIQUE INDEX leads_phone_digits_unique
  ON public.leads (phone_digits)
  WHERE phone_digits IS NOT NULL AND COALESCE(is_test, false) = false;

DROP INDEX IF EXISTS leads_email_unique;
CREATE UNIQUE INDEX leads_email_unique
  ON public.leads (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0 AND COALESCE(is_test, false) = false;

-- Soft-unique for test rows: at most one active test lead per phone/email.
DROP INDEX IF EXISTS leads_phone_digits_test_unique;
CREATE UNIQUE INDEX leads_phone_digits_test_unique
  ON public.leads (phone_digits)
  WHERE phone_digits IS NOT NULL AND COALESCE(is_test, false) = true;

DROP INDEX IF EXISTS leads_email_test_unique;
CREATE UNIQUE INDEX leads_email_test_unique
  ON public.leads (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0 AND COALESCE(is_test, false) = true;

-- Delete prior TEST leads for this phone/email so the founder can re-join.
CREATE OR REPLACE FUNCTION public.dev_reset_test_lead(
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d text;
  em text;
  deleted_count integer := 0;
BEGIN
  d := public.normalize_phone_digits(p_phone);
  em := NULLIF(lower(trim(coalesce(p_email, ''))), '');

  IF d IS NULL AND em IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'phone or email required');
  END IF;

  WITH doomed AS (
    SELECT id
    FROM public.leads
    WHERE COALESCE(is_test, false) = true
      AND (
        (d IS NOT NULL AND phone_digits = d)
        OR (em IS NOT NULL AND email IS NOT NULL AND lower(email) = em)
      )
  )
  DELETE FROM public.leads l
  USING doomed
  WHERE l.id = doomed.id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object('ok', true, 'deleted', deleted_count);
END;
$$;

REVOKE ALL ON FUNCTION public.dev_reset_test_lead(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dev_reset_test_lead(text, text) TO anon, authenticated, service_role;

-- Duplicate check ignores test leads (so allowlisted founder contacts can rejoin).
CREATE OR REPLACE FUNCTION public.check_waitlist_subscription(
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d text;
  em text;
  r RECORD;
BEGIN
  d := public.normalize_phone_digits(p_phone);
  em := NULLIF(lower(trim(coalesce(p_email, ''))), '');

  IF d IS NOT NULL THEN
    SELECT visitor_id, phone, email, waitlist_position, prefs, is_test
    INTO r
    FROM public.leads
    WHERE phone_digits = d
      AND COALESCE(is_test, false) = false
    LIMIT 1;
  END IF;

  IF NOT FOUND AND em IS NOT NULL THEN
    SELECT visitor_id, phone, email, waitlist_position, prefs, is_test
    INTO r
    FROM public.leads
    WHERE email IS NOT NULL
      AND lower(email) = em
      AND COALESCE(is_test, false) = false
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN json_build_object('subscribed', false);
  END IF;

  RETURN json_build_object(
    'subscribed', true,
    'visitor_id', r.visitor_id,
    'phone', r.phone,
    'email', r.email,
    'waitlist_position', r.waitlist_position,
    'has_prefs', (r.prefs IS NOT NULL AND r.prefs <> '{}'::jsonb),
    'is_test', COALESCE(r.is_test, false)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_waitlist_subscription(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_waitlist_subscription(text, text) TO anon, authenticated, service_role;

-- Real waitlist ranks ignore test leads.
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
    -- Test rows get a rank too, but from their own lane so they don't steal real numbers.
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

-- ONE-TIME (edit to YOUR email/phone): convert your existing real signup into a test lead
-- so duplicate checks stop blocking you. Then re-join from the app.
--
-- UPDATE public.leads
-- SET is_test = true
-- WHERE lower(email) = 'you@email.com'
--    OR phone_digits = public.normalize_phone_digits('+9665xxxxxxxx');
