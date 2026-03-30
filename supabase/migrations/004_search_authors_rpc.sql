-- Fuzzy author search using pg_trgm similarity
-- Returns matching canonical authors with their metadata

CREATE OR REPLACE FUNCTION search_authors_by_name(
  query_text text,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  author_id int,
  author_name text,
  name_similarity real,
  total_papers int,
  institutions jsonb,
  years jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    name,
    similarity(name, query_text),
    total_papers,
    institutions,
    years
  FROM authors
  WHERE name % query_text
    AND is_canonical = true
  ORDER BY similarity(name, query_text) DESC
  LIMIT match_count;
$$;
