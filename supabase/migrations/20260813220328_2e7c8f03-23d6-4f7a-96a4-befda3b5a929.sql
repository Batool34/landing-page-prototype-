CREATE OR REPLACE FUNCTION public.get_waitlist_position(p_visitor_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pos integer;
  vid text;
BEGIN
  vid := NULLIF(trim(coalesce(p_visitor_id, '')), '');
  IF vid IS NULL OR length(vid) > 128 THEN
    RETURN NULL;
  END IF;

  SELECT waitlist_position INTO pos
  FROM public.leads
  WHERE visitor_id = vid
  LIMIT 1;

  RETURN pos;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_waitlist_position(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_waitlist_position(text) TO anon, authenticated, service_role;