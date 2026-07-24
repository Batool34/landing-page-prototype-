
-- 1. Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can read events" ON public.events;
DROP POLICY IF EXISTS "Anyone can log an event" ON public.events;
DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create a lead" ON public.leads;
DROP POLICY IF EXISTS "Anyone can update a lead" ON public.leads;

-- 2. Revoke direct table access from anon and authenticated. Only service_role
--    (and SECURITY DEFINER functions) can touch these tables now.
REVOKE ALL ON public.events FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.leads  FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.leads  TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads  ENABLE ROW LEVEL SECURITY;

-- 3. normalize_phone_digits is pure — switch to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
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

-- 4. Sanctioned event-logging RPC (SECURITY DEFINER + strict input validation).
--    This replaces direct INSERTs into public.events from the client.
CREATE OR REPLACE FUNCTION public.log_event(
  p_visitor_id text,
  p_event_type text,
  p_phone text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  eid uuid;
  vid text;
  etype text;
  payload_size int;
BEGIN
  vid := NULLIF(trim(coalesce(p_visitor_id, '')), '');
  IF vid IS NULL OR length(vid) > 128 THEN
    RAISE EXCEPTION 'invalid visitor_id';
  END IF;

  etype := NULLIF(trim(coalesce(p_event_type, '')), '');
  IF etype IS NULL OR length(etype) > 64 OR etype !~ '^[a-zA-Z0-9_.:-]+$' THEN
    RAISE EXCEPTION 'invalid event_type';
  END IF;

  payload_size := octet_length(coalesce(p_payload, '{}'::jsonb)::text);
  IF payload_size > 16384 THEN
    RAISE EXCEPTION 'payload too large';
  END IF;

  INSERT INTO public.events (visitor_id, phone, event_type, payload)
  VALUES (
    vid,
    NULLIF(trim(coalesce(p_phone, '')), ''),
    etype,
    coalesce(p_payload, '{}'::jsonb)
  )
  RETURNING id INTO eid;

  RETURN eid;
END;
$$;

REVOKE ALL ON FUNCTION public.log_event(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_event(text, text, text, jsonb)
  TO anon, authenticated, service_role;
