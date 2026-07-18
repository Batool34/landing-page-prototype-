-- Run in Lovable SQL editor: block duplicate waitlist phone/email signups.

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
BEGIN
  d := regexp_replace(coalesce(p, ''), '\D', '', 'g');
  IF d LIKE '00%' THEN
    d := substring(d FROM 3);
  END IF;
  IF length(d) = 10 AND left(d, 1) = '0' THEN
    d := '966' || substring(d FROM 2);
  END IF;
  IF length(d) = 9 AND left(d, 1) = '5' THEN
    d := '966' || d;
  END IF;
  IF length(d) < 8 THEN
    RETURN NULL;
  END IF;
  RETURN d;
END;
$$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_digits TEXT;

UPDATE public.leads
SET phone_digits = public.normalize_phone_digits(phone)
WHERE phone IS NOT NULL
  AND (phone_digits IS NULL OR phone_digits = '');

CREATE OR REPLACE FUNCTION public.leads_set_phone_digits()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.phone_digits := public.normalize_phone_digits(NEW.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_phone_digits_trg ON public.leads;
CREATE TRIGGER leads_phone_digits_trg
  BEFORE INSERT OR UPDATE OF phone ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_set_phone_digits();

-- Keep oldest lead per phone/email so unique indexes can apply.
WITH ranked_phone AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY phone_digits ORDER BY created_at ASC, id ASC) AS rn
  FROM public.leads
  WHERE phone_digits IS NOT NULL
)
UPDATE public.leads l
SET phone = NULL, phone_digits = NULL
FROM ranked_phone r
WHERE l.id = r.id AND r.rn > 1;

WITH ranked_email AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY created_at ASC, id ASC) AS rn
  FROM public.leads
  WHERE email IS NOT NULL AND length(trim(email)) > 0
)
UPDATE public.leads l
SET email = NULL
FROM ranked_email r
WHERE l.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS leads_phone_digits_unique
  ON public.leads (phone_digits)
  WHERE phone_digits IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique
  ON public.leads (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0;

-- Returns whether phone or email is already on the waitlist.
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
    SELECT visitor_id, phone, email, waitlist_position, prefs
    INTO r
    FROM public.leads
    WHERE phone_digits = d
    LIMIT 1;
  END IF;

  IF NOT FOUND AND em IS NOT NULL THEN
    SELECT visitor_id, phone, email, waitlist_position, prefs
    INTO r
    FROM public.leads
    WHERE email IS NOT NULL AND lower(email) = em
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
    'has_prefs', (r.prefs IS NOT NULL AND r.prefs <> '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_waitlist_subscription(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_waitlist_subscription(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.normalize_phone_digits(text) TO anon, authenticated, service_role;
