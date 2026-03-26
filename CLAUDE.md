# SSWR Conference History Database — Analysis Guide

**Version: 0.9.0-beta** (2026-03-25) — Data and documentation under active review.

This file helps AI assistants and researchers work effectively with the SSWR Conference History Database, whether accessing data through MCP (Supabase), the REST API, or local CSV/JSON files.

## Dataset Overview

The database contains **23,793 presentations** and **69,924 author records** from the Society for Social Work and Research (SSWR) Annual Conference, spanning 2005–2026. It was constructed using AI-assisted curation with human review at each stage.

**Citation (required when using this data):**
Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship: Compiling, structuring, and analyzing two decades of presentations at the Society for Social Work and Research (2005–2026). *Journal of the Society for Social Work and Research*. https://doi.org/10.48550/arXiv.2603.06814

**Independence:** This project is independent of SSWR. All data were compiled from the publicly available Confex conference archive.

## Schema Reference

### papers (23,793 rows)

| Field | Type | Description |
|-------|------|-------------|
| `id` | text PK | Unique ID, format `YYYY-L-NNNN` |
| `year` | integer | Conference year (2005–2026) |
| `title` | text | Presentation title |
| `abstract` | text | Full abstract text |
| `author_count` | integer | Number of authors |
| `methodology` | text | Classification: `quantitative`, `qualitative`, `mixed_methods`, `review`, `other` |
| `methodology_classification_rationale` | text | Free-text rationale for the methodology classification |
| `original_paper_id` | text | Source reference ID from Confex |

### paper_authors (69,924 rows)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer PK | Record identifier |
| `paper_id` | text FK → papers.id | Links to presentation |
| `author_order` | integer | Position in author list (1 = first/presenting author) |
| `name` | text | Author name (original casing) |
| `name_normalized` | text | Lowercased, NFKD-normalized name |
| `degree` | text | Academic credentials (PhD, MSW, LCSW, etc.) |
| `position` | text | Raw position/title text |
| `position_normalized` | text | Standardized category (see below) |
| `institution` | text | Cleaned institution name |
| `institution_raw` | text | Original affiliation text from Confex |
| `institution_normalized` | text | Canonical institution name |
| `institution_id` | text | Institution identifier |
| `city` | text | City of institution |
| `state_province` | text | State/province (expanded from abbreviations) |
| `country` | text | Country as extracted |
| `country_normalized` | text | Standardized country (93 unique) |
| `parsing_error` | boolean | True if LLM parsing encountered errors |
| `author_id` | integer | Entity resolution ID (23,481 unique name variants) |
| `canonical_author_id` | integer | Deduplicated author ID (20,779 unique researchers) |

### paper_embeddings (23,793 rows, API only)

| Field | Type | Description |
|-------|------|-------------|
| `paper_id` | text FK → papers.id | Links to presentation |
| `embedding_large` | vector(3072) | text-embedding-3-large vector |
| `embedding_small` | vector(1536) | text-embedding-3-small vector |
| `created_at` | timestamptz | Generation timestamp |

**Two embedding models are available.** Query embeddings MUST use the exact same model as the column being searched. Mismatched models produce meaningless results.

| Model | Dimensions | RPC Function | OpenRouter Model ID |
|-------|-----------|--------------|---------------------|
| text-embedding-3-large | 3,072 | `match_papers` | `openai/text-embedding-3-large` |
| text-embedding-3-small | 1,536 | `match_papers_small` | `openai/text-embedding-3-small` |

**Generating query embeddings via OpenRouter (recommended):**
```python
import openai

client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-..."  # user provides their OpenRouter key
)

# For match_papers (large)
response = client.embeddings.create(
    model="openai/text-embedding-3-large",
    input="your search query"
)

# For match_papers_small (small)
# response = client.embeddings.create(
#     model="openai/text-embedding-3-small",
#     input="your search query"
# )

query_vector = response.data[0].embedding
```

OpenRouter provides access to both models alongside hundreds of others through a single API key. Users can sign up at https://openrouter.ai and generate a key from their dashboard.

## Categorical Values

### methodology (5 categories)
- `quantitative` (14,542 / 61.1%) — statistical analysis of numeric data
- `qualitative` (5,565 / 23.4%) — interpretive analysis of textual, visual, or observational data
- `mixed_methods` (2,172 / 9.1%) — explicitly integrates both quantitative and qualitative approaches
- `review` (1,274 / 5.4%) — systematic reviews, scoping reviews, meta-analyses
- `other` (240 / 1.0%) — theoretical/conceptual papers, program descriptions, policy analyses

### position_normalized (16 categories)
- `Assistant Professor` (13,726) — tenure-track assistant professors
- `Doctoral Student` (13,312) — PhD/DSW students and candidates
- `Associate Professor` (9,182) — tenured associate professors
- `Research Staff` (8,713) — research scientists, coordinators, associates
- `Full Professor` (8,569) — full professors
- `Unknown` (5,686) — position not parseable
- `Masters Student` (2,674) — MSW/MA students
- `Senior Leadership Practice` (2,127) — executive directors, program directors
- `Postdoctoral` (1,473) — postdoctoral fellows/scholars
- `Research Faculty` (1,151) — research professors
- `Practitioner` (837) — licensed practitioners, consultants
- `Instructor` (631) — lecturers, non-tenure-track teaching
- `Clinical Professor` (616) — clinical/practice/teaching professors
- `Senior Leadership Academic` (545) — deans, department chairs
- `Adjunct Faculty` (489) — part-time/adjunct
- `Undergraduate Student` (193) — BSW/undergraduate researchers

### Top countries (country_normalized)
USA (61,691), Canada (2,586), South Korea (1,451), Israel (613), Hong Kong (490), China (452), United Kingdom (242), Uganda (236), Taiwan (203), Kazakhstan (114)

## Common Query Patterns

### Supabase SQL (via MCP or execute_sql)

```sql
-- Presentations per year
SELECT year, COUNT(*) as n FROM papers GROUP BY year ORDER BY year;

-- Methodology distribution by year
SELECT year, methodology, COUNT(*) as n
FROM papers GROUP BY year, methodology ORDER BY year, methodology;

-- Top 20 institutions by presentations
SELECT pa.institution_normalized, COUNT(DISTINCT pa.paper_id) as presentations
FROM paper_authors pa
WHERE pa.author_order = 1 AND pa.institution_normalized IS NOT NULL
GROUP BY pa.institution_normalized
ORDER BY presentations DESC LIMIT 20;

-- International participation rate by year
SELECT p.year,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE pa.country_normalized != 'USA') as international,
  ROUND(100.0 * COUNT(*) FILTER (WHERE pa.country_normalized != 'USA') / COUNT(*), 1) as pct_international
FROM paper_authors pa JOIN papers p ON pa.paper_id = p.id
WHERE pa.author_order = 1
GROUP BY p.year ORDER BY p.year;

-- Most prolific researchers (by canonical_author_id)
SELECT pa.name, COUNT(DISTINCT pa.paper_id) as presentations
FROM paper_authors pa
WHERE pa.author_order = 1
GROUP BY pa.canonical_author_id, pa.name
ORDER BY presentations DESC LIMIT 20;

-- Collaboration trends (mean authors per paper by year)
SELECT year, ROUND(AVG(author_count), 2) as mean_authors
FROM papers GROUP BY year ORDER BY year;
```

### PostgREST API

```bash
# Filter by year and methodology
curl "https://jomsksqqcpkbuhwytovo.supabase.co/rest/v1/papers?year=eq.2025&methodology=eq.qualitative&select=id,title" \
  -H "apikey: YOUR_ANON_KEY"

# Join papers with authors
curl "https://jomsksqqcpkbuhwytovo.supabase.co/rest/v1/paper_authors?select=name,position_normalized,paper_id,papers(title,year,methodology)&author_order=eq.1&limit=10" \
  -H "apikey: YOUR_ANON_KEY"
```

### Python (local CSV files)

```python
import pandas as pd

papers = pd.read_csv("data/csv/papers.csv")
authors = pd.read_csv("data/csv/paper_authors.csv")

# Merge for combined analysis
df = authors.merge(papers, left_on="paper_id", right_on="id", suffixes=("_author", "_paper"))

# First authors only
first_authors = authors[authors.author_order == 1]
```

## Data Quality Notes

- **Institution accuracy:** 94% (200-record manual review)
- **Position accuracy:** 91% (200-record manual review)
- **Methodology agreement:** Cohen's kappa = .83 (human vs. model, 60 abstracts)
- **Entity resolution:** 23,481 name variants → 20,779 canonical identities
- Author disambiguation may miss matches when names use different initials across years
- Methodology classification is based on abstract content only
- Position data for 2005–2008 is mostly "Unknown" (>99%)
- Some withdrawn presentations may be included

## Key Relationships

- `papers.id` → `paper_authors.paper_id` (one-to-many)
- `papers.id` → `paper_embeddings.paper_id` (one-to-one)
- `paper_authors.author_id` identifies name variants (23,481 unique)
- `paper_authors.canonical_author_id` identifies deduplicated people (20,779 unique)
- Use `author_order = 1` to isolate first/presenting authors
- Use `canonical_author_id` (not `author_id`) for counting unique researchers
