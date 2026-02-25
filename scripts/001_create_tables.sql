-- Create theses table
CREATE TABLE IF NOT EXISTS public.theses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  size_range TEXT,
  funding_stage TEXT,
  geography TEXT,
  technologies TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create targets table
CREATE TABLE IF NOT EXISTS public.targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  one_liner TEXT,
  stage TEXT,
  headcount TEXT,
  signal_score INTEGER DEFAULT 0,
  top_signal TEXT,
  fit_rating TEXT DEFAULT 'Moderate',
  last_updated TIMESTAMPTZ DEFAULT now(),
  is_pinned INTEGER DEFAULT 0,
  is_dismissed INTEGER DEFAULT 0,
  client_overlap_current TEXT,
  client_overlap_potential TEXT,
  product_rating TEXT,
  product_score INTEGER,
  valuation TEXT,
  funding_stage_detail TEXT,
  current_investors TEXT
);

-- Create signals_history table
CREATE TABLE IF NOT EXISTS public.signals_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES public.targets(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  signal_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create deep_dives table
CREATE TABLE IF NOT EXISTS public.deep_dives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES public.targets(id) ON DELETE CASCADE,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for these tables (no auth in this app - single-user tool)
ALTER TABLE public.theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_dives ENABLE ROW LEVEL SECURITY;

-- Allow all access (this is a single-user tool, no auth)
CREATE POLICY "Allow all access on theses" ON public.theses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on targets" ON public.targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on signals_history" ON public.signals_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on deep_dives" ON public.deep_dives FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_targets_thesis_id ON public.targets(thesis_id);
CREATE INDEX IF NOT EXISTS idx_targets_signal_score ON public.targets(signal_score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_history_target_id ON public.signals_history(target_id);
CREATE INDEX IF NOT EXISTS idx_deep_dives_target_id ON public.deep_dives(target_id);
