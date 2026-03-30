-- Fuzzy institution search: find papers by institution name
-- Uses pg_trgm on institution_mappings.canonical_name

CREATE OR REPLACE FUNCTION search_papers_by_institution(
  query_text text,
  match_count int DEFAULT 20,
  min_year int DEFAULT 2005,
  max_year int DEFAULT 2026
)
RETURNS TABLE (
  id text,
  title text,
  year int,
  abstract text,
  methodology text,
  institution_name text,
  authors jsonb
)
LANGUAGE sql STABLE
AS $$
  WITH matched_inst AS (
    SELECT DISTINCT canonical_name,
           similarity(canonical_name, query_text) AS sim
    FROM institution_mappings
    WHERE canonical_name % query_text
    ORDER BY sim DESC
    LIMIT 5
  )
  SELECT
    p.id,
    p.title,
    p.year,
    p.abstract,
    p.methodology,
    mi.canonical_name AS institution_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', pa.name,
          'institution', pa.institution,
          'rank', pa.author_order
        ) ORDER BY pa.author_order
      )
      FROM paper_authors pa
      WHERE pa.paper_id = p.id
    ) AS authors
  FROM matched_inst mi
  JOIN paper_authors pa2
    ON pa2.institution_normalized = mi.canonical_name
    AND pa2.author_order = 1
  JOIN papers p ON p.id = pa2.paper_id
  WHERE p.year BETWEEN min_year AND max_year
  ORDER BY mi.sim DESC, p.year DESC
  LIMIT match_count;
$$;


-- Autocomplete for institution names (prefix match)
CREATE OR REPLACE FUNCTION autocomplete_institutions(
  prefix text,
  limit_count int DEFAULT 10
)
RETURNS TABLE (name text)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT canonical_name
  FROM institution_mappings
  WHERE canonical_name ILIKE prefix || '%'
  ORDER BY canonical_name
  LIMIT limit_count;
$$;
