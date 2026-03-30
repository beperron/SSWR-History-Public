-- Search query logging table
CREATE TABLE public.search_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  search_type text NOT NULL,        -- keyword, semantic, hybrid, author, institution
  query_text text NOT NULL,
  filters jsonb,                    -- {min_year, max_year, methodology}
  results_count int,
  session_hash text,                -- hashed session token (not raw)
  duration_ms int
);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Anon role can insert only (no read/update/delete)
CREATE POLICY "anon_insert" ON public.search_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE INDEX idx_search_logs_created ON public.search_logs (created_at);
CREATE INDEX idx_search_logs_type ON public.search_logs (search_type);
