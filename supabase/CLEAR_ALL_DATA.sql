-- PASTE into Lovable → Cloud → Database → SQL editor → Run
-- Wipes ALL waitlist + analytics data so you can start from scratch before launch.
-- WARNING: irreversible. Only do this if you have not launched / advertised yet.

-- Remove analytics events first (no FK required, but order is safe).
TRUNCATE TABLE public.events RESTART IDENTITY CASCADE;

-- Remove all leads (waitlist signups, ranks, prefs).
TRUNCATE TABLE public.leads RESTART IDENTITY CASCADE;

-- Optional sanity check (should both return 0):
-- SELECT count(*) AS leads FROM public.leads;
-- SELECT count(*) AS events FROM public.events;
