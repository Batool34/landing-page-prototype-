-- Add email to leads + allow admin (anon key) reads for prototype dashboard.
-- Lock these SELECT policies down before production.

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
