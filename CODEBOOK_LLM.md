# SSWR Conference History Database — LLM-Optimized Codebook

Version: 0.9.0-beta | 23,793 presentations | 69,924 author records | 2005–2026

## CITATION (required)
Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. JSSWR. https://doi.org/10.48550/arXiv.2603.06814

## CRITICAL CONTEXT
- All author data (position, degree, institution) reflects the time of the conference, NOT current information
- This project is independent of SSWR; data from public Confex archive only
- Methodology classified by gpt-oss-20b with human review (kappa=.83)
- Use `canonical_author_id` to count unique people (20,779), not `author_id` (23,481 name variants)
- Use `author_order=1` to filter to first/presenting authors

## TABLES

### papers
| column | type | values/notes |
|--------|------|-------------|
| id | text PK | format: YYYY-L-NNNN |
| year | int | 2005–2026 |
| title | text | never null |
| abstract | text | never null |
| author_count | int | 1–20+ |
| methodology | text | quantitative(14542) qualitative(5565) mixed_methods(2172) review(1274) other(240) |
| methodology_classification_rationale | text | LLM reasoning for classification |
| original_paper_id | text | Confex source ID |

### paper_authors
| column | type | values/notes |
|--------|------|-------------|
| id | int PK | |
| paper_id | text FK→papers.id | |
| author_order | int | 1=first author |
| name | text | original casing |
| name_normalized | text | lowercase NFKD |
| degree | text | PhD MSW LCSW etc. 10.7% missing |
| position | text | raw text |
| position_normalized | text | 16 categories: Assistant Professor(13726) Doctoral Student(13312) Associate Professor(9182) Research Staff(8713) Full Professor(8569) Unknown(5686) Masters Student(2674) Senior Leadership Practice(2127) Postdoctoral(1473) Research Faculty(1151) Practitioner(837) Instructor(631) Clinical Professor(616) Senior Leadership Academic(545) Adjunct Faculty(489) Undergraduate Student(193) |
| institution | text | cleaned name |
| institution_raw | text | original Confex text |
| institution_normalized | text | canonical form. 4049 unique |
| institution_id | text | normalized ID |
| city | text | |
| state_province | text | expanded (MI→Michigan) |
| country | text | as extracted |
| country_normalized | text | standardized. 93 unique. Top: USA(61691) Canada(2586) South Korea(1451) Israel(613) Hong Kong(490) |
| parsing_error | bool | true if LLM parsing failed |
| author_id | int | name variant ID (23481 unique) |
| canonical_author_id | int | deduplicated person ID (20779 unique) |

### paper_embeddings (API only)
| column | type | notes |
|--------|------|-------|
| paper_id | text FK→papers.id | |
| embedding_large | vector(3072) | model: text-embedding-3-large. RPC: match_papers() |
| embedding_small | vector(1536) | model: text-embedding-3-small. RPC: match_papers_small() |
| created_at | timestamptz | |

EMBEDDING RULE: query vectors MUST use the exact same model as the column searched.

## JOIN PATTERN
```sql
-- Basic join
SELECT * FROM papers p JOIN paper_authors pa ON p.id = pa.paper_id;

-- First authors only
SELECT * FROM paper_authors WHERE author_order = 1;

-- Unique researchers (use canonical_author_id, not author_id)
SELECT COUNT(DISTINCT canonical_author_id) FROM paper_authors;
```

## COMMON QUERIES
```sql
-- Presentations per year
SELECT year, COUNT(*) FROM papers GROUP BY year ORDER BY year;

-- Methodology by year
SELECT year, methodology, COUNT(*) FROM papers GROUP BY year, methodology ORDER BY year;

-- Top institutions (first authors)
SELECT institution_normalized, COUNT(DISTINCT paper_id) as n
FROM paper_authors WHERE author_order = 1 AND institution_normalized IS NOT NULL
GROUP BY institution_normalized ORDER BY n DESC LIMIT 20;

-- International participation rate
SELECT year,
  ROUND(100.0 * COUNT(*) FILTER (WHERE country_normalized != 'USA') / COUNT(*), 1) as pct_intl
FROM paper_authors pa JOIN papers p ON pa.paper_id = p.id
WHERE pa.author_order = 1
GROUP BY year ORDER BY year;

-- Collaboration trend
SELECT year, ROUND(AVG(author_count),2) as mean_authors FROM papers GROUP BY year ORDER BY year;

-- Search abstracts
SELECT id, title, year FROM papers WHERE abstract ILIKE '%machine learning%';
```

## CONNECTION
- MCP: `{"url": "https://mcp.supabase.com/mcp?project_ref=jomsksqqcpkbuhwytovo&read_only=true&features=database"}`
- REST API: https://jomsksqqcpkbuhwytovo.supabase.co
- Access: read-only (papers, paper_authors, paper_embeddings)

## DATA QUALITY
- Institution accuracy: 94% (200-sample review)
- Position accuracy: 91%
- Methodology kappa: .83
- Position data 2005–2008 mostly "Unknown" (>99%)
- Author disambiguation may miss different-initial matches
