-- Atomically ensure a lead row exists for this visitor and return its waitlist rank.
-- Used by the in-app waitlist after 3 friend invites unlock the leaderboard.

CREATE OR REPLACE FUNCTION public.ensure_visitor_waitlist_rank(p_visitor_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vid text;
  pos integer;
  lead_id uuid;
BEGIN
  vid := NULLIF(trim(coalesce(p_visitor_id, '')), '');
  IF vid IS NULL OR length(vid) > 128 THEN
    RETURN NULL;
  END IF;

  SELECT waitlist_position INTO pos
  FROM public.leads
  WHERE visitor_id = vid
  LIMIT 1;

  IF pos IS NOT NULL THEN
    RETURN pos;
  END IF;

  -- Create / update the lead; upsert_lead allocates next_waitlist_position when missing.
  lead_id := public.upsert_lead(
    p_visitor_id => vid,
    p_prefs => jsonb_build_object('waitlistUnlocked', true),
    p_user_agent => 'ensure_visitor_waitlist_rank'
  );

  SELECT waitlist_position INTO pos
  FROM public.leads
  WHERE visitor_id = vid
  LIMIT 1;

  -- If the row existed with a NULL rank, force-assign one.
  IF pos IS NULL THEN
    pos := public.next_waitlist_position();
    UPDATE public.leads
    SET waitlist_position = pos,
        updated_at = now()
    WHERE visitor_id = vid
      AND waitlist_position IS NULL;
  END IF;

  RETURN pos;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_visitor_waitlist_rank(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_visitor_waitlist_rank(text) TO anon, authenticated, service_role;
