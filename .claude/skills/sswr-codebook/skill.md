# SSWR Database Codebook

Use this skill when asked about the database schema, field definitions, data types, categorical values, or table relationships.

## Tables

### papers (23,793 rows)

| Field | Type | Description |
|-------|------|-------------|
| `id` | text PK | Unique ID, format `YYYY-L-NNNN` |
| `year` | integer | Conference year (2005–2026) |
| `title` | text | Presentation title |
| `abstract` | text | Full abstract text |
| `author_count` | integer | Number of authors |
| `methodology` | text | See methodology values below |
| `methodology_classification_rationale` | text | LLM reasoning for the classification |
| `original_paper_id` | text | Source reference ID from Confex |

### paper_authors (69,924 rows)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer PK | Record identifier |
| `paper_id` | text FK→papers.id | Links to presentation |
| `author_order` | integer | Position in author list (1 = first/presenting author) |
| `name` | text | Author name (original casing) |
| `name_normalized` | text | Lowercased, NFKD-normalized name |
| `degree` | text | Academic credentials (PhD, MSW, LCSW, etc.). 10.7% missing |
| `position` | text | Raw position/title text |
| `position_normalized` | text | Standardized category (see below) |
| `institution` | text | Cleaned institution name |
| `institution_raw` | text | Original affiliation text from Confex |
| `institution_normalized` | text | Canonical institution name. 4,049 unique |
| `institution_id` | text | Institution identifier |
| `city` | text | City of institution |
| `state_province` | text | State/province (expanded: MI→Michigan) |
| `country` | text | Country as extracted |
| `country_normalized` | text | Standardized country. 93 unique |
| `parsing_error` | boolean | True if LLM parsing failed |
| `author_id` | integer | Entity resolution ID (23,481 unique name variants) |
| `canonical_author_id` | integer | Deduplicated person ID (20,779 unique researchers) |

### paper_embeddings (23,793 rows, API only)

| Field | Type | Description |
|-------|------|-------------|
| `paper_id` | text FK→papers.id | Links to presentation |
| `embedding_large` | vector(3072) | OpenAI text-embedding-3-large |
| `embedding_small` | vector(1536) | OpenAI text-embedding-3-small |
| `created_at` | timestamptz | Generation timestamp |

## Categorical Values

### methodology (5 categories)
- `quantitative` (14,542 / 61.1%) — statistical analysis of numeric data
- `qualitative` (5,565 / 23.4%) — interpretive analysis of textual, visual, or observational data
- `mixed_methods` (2,172 / 9.1%) — explicitly integrates both approaches
- `review` (1,274 / 5.4%) — systematic reviews, scoping reviews, meta-analyses
- `other` (240 / 1.0%) — theoretical, conceptual, program descriptions

### position_normalized (16 categories)
- `Assistant Professor` (13,726), `Doctoral Student` (13,312), `Associate Professor` (9,182)
- `Research Staff` (8,713), `Full Professor` (8,569), `Unknown` (5,686)
- `Masters Student` (2,674), `Senior Leadership Practice` (2,127), `Postdoctoral` (1,473)
- `Research Faculty` (1,151), `Practitioner` (837), `Instructor` (631)
- `Clinical Professor` (616), `Senior Leadership Academic` (545)
- `Adjunct Faculty` (489), `Undergraduate Student` (193)

### Top countries (country_normalized)
USA (61,691), Canada (2,586), South Korea (1,451), Israel (613), Hong Kong (490), China (452), United Kingdom (242), Uganda (236), Taiwan (203), Kazakhstan (114)

## Relationships

- `papers.id` → `paper_authors.paper_id` (one-to-many)
- `papers.id` → `paper_embeddings.paper_id` (one-to-one)
- Use `author_order = 1` to isolate first/presenting authors
- Use `canonical_author_id` (NOT `author_id`) for counting unique researchers
- `author_id` = 23,481 name variants; `canonical_author_id` = 20,779 deduplicated people

## Data Quality

- Institution extraction accuracy: 94% (200-record manual review)
- Position extraction accuracy: 91%
- Methodology classification: Cohen's kappa = .83
- Position data for 2005–2008 is mostly "Unknown" (>99%)
- All affiliation data reflects the time of the conference, not current positions
