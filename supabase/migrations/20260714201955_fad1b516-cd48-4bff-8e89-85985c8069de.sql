
-- LEADS: one row per anonymous visitor
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  referral_code TEXT,
  referred_by TEXT,
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  saved_meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  waitlist_position INTEGER,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_phone ON public.leads(phone);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anonymous prototype: anyone can insert/update their own record. No public reads.
CREATE POLICY "Anyone can create a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update a lead"
  ON public.leads FOR UPDATE
  USING (true) WITH CHECK (true);

-- EVENTS: activity log
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  phone TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_visitor ON public.events(visitor_id);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);

GRANT SELECT, INSERT ON public.events TO anon;
GRANT SELECT, INSERT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log an event"
  ON public.events FOR INSERT
  WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
