# SSWR Query Patterns

Use this skill when asked to analyze the SSWR database — writing SQL, exploring trends, comparing institutions, or answering research questions. The database is accessible via the `sswr-history` MCP connection.

## Key Rules

- Always use `canonical_author_id` (not `author_id`) when counting unique researchers
- Use `author_order = 1` to filter to first/presenting authors
- Join tables on `papers.id = paper_authors.paper_id`
- Methodology values: `quantitative`, `qualitative`, `mixed_methods`, `review`, `other`
- All affiliation data reflects the conference date, not current positions

## Common Queries

### Presentations per year
```sql
SELECT year, COUNT(*) as n FROM papers GROUP BY year ORDER BY year;
```

### Methodology distribution by year
```sql
SELECT year, methodology, COUNT(*) as n
FROM papers GROUP BY year, methodology ORDER BY year, methodology;
```

### Methodology percentages by year
```sql
SELECT year, methodology,
  COUNT(*) as n,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY year), 1) as pct
FROM papers GROUP BY year, methodology ORDER BY year, methodology;
```

### Top institutions by first-authored presentations
```sql
SELECT pa.institution_normalized, COUNT(DISTINCT pa.paper_id) as presentations
FROM paper_authors pa
WHERE pa.author_order = 1 AND pa.institution_normalized IS NOT NULL
GROUP BY pa.institution_normalized
ORDER BY presentations DESC LIMIT 20;
```

### International participation rate by year
```sql
SELECT p.year,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE pa.country_normalized != 'USA') as international,
  ROUND(100.0 * COUNT(*) FILTER (WHERE pa.country_normalized != 'USA') / COUNT(*), 1) as pct_intl
FROM paper_authors pa JOIN papers p ON pa.paper_id = p.id
WHERE pa.author_order = 1
GROUP BY p.year ORDER BY p.year;
```

### Most prolific researchers
```sql
SELECT pa.name, COUNT(DISTINCT pa.paper_id) as presentations
FROM paper_authors pa
WHERE pa.author_order = 1
GROUP BY pa.canonical_author_id, pa.name
ORDER BY presentations DESC LIMIT 20;
```

### Collaboration trends
```sql
SELECT year, ROUND(AVG(author_count), 2) as mean_authors,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY author_count) as median_authors
FROM papers GROUP BY year ORDER BY year;
```

### Position distribution (first authors)
```sql
SELECT pa.position_normalized, COUNT(*) as n,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM paper_authors pa
WHERE pa.author_order = 1
GROUP BY pa.position_normalized
ORDER BY n DESC;
```

### Search abstracts by keyword
```sql
SELECT id, title, year, methodology
FROM papers
WHERE abstract ILIKE '%machine learning%'
ORDER BY year DESC;
```

### Compare two institutions
```sql
SELECT p.methodology,
  COUNT(*) FILTER (WHERE pa.institution_normalized = 'University of Michigan') as umich,
  COUNT(*) FILTER (WHERE pa.institution_normalized = 'Columbia University') as columbia
FROM paper_authors pa JOIN papers p ON pa.paper_id = p.id
WHERE pa.author_order = 1
  AND pa.institution_normalized IN ('University of Michigan', 'Columbia University')
GROUP BY p.methodology ORDER BY umich + columbia DESC;
```

### Country representation by year
```sql
SELECT p.year, COUNT(DISTINCT pa.country_normalized) as countries
FROM paper_authors pa JOIN papers p ON pa.paper_id = p.id
WHERE pa.country_normalized IS NOT NULL
GROUP BY p.year ORDER BY p.year;
```
