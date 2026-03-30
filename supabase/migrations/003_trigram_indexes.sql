-- Trigram indexes for fuzzy name/institution search
-- Requires pg_trgm extension (migration 001)

CREATE INDEX idx_authors_name_trgm
  ON public.authors USING gin (name gin_trgm_ops);

CREATE INDEX idx_inst_map_canonical_trgm
  ON public.institution_mappings USING gin (canonical_name gin_trgm_ops);
