# SSWR Conference History Database — Portable Reference

Version 0.9.0-beta | 23,793 presentations | 69,924 author records | 2005–2026

Paste this into any AI chat for instant database context. For richer integration, clone the repo — it includes MCP configs and modular skills for Claude Code, Cursor, and OpenCode.

## CITATION (required)
Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. JSSWR. https://doi.org/10.1086/741324

## CRITICAL RULES
- All author data (position, degree, institution) reflects the TIME OF THE CONFERENCE, not current info
- Use `canonical_author_id` to count unique people (20,779), NOT `author_id` (23,481 name variants)
- Use `author_order=1` for first/presenting authors
- Independent project, not affiliated with SSWR

## TABLES

### papers (23,793 rows)
| column | type | notes |
|--------|------|-------|
| id | text PK | YYYY-L-NNNN |
| year | int | 2005–2026 |
| title | text | |
| abstract | text | |
| author_count | int | |
| methodology | text | quantitative(14542) qualitative(5565) mixed_methods(2172) review(1274) other(240) |
| methodology_classification_rationale | text | LLM reasoning |
| original_paper_id | text | Confex source ID |

### paper_authors (69,924 rows)
| column | type | notes |
|--------|------|-------|
| id | int PK | |
| paper_id | text FK→papers.id | |
| author_order | int | 1=first author |
| name | text | original casing |
| name_normalized | text | lowercase NFKD |
| degree | text | PhD MSW etc. 10.7% missing |
| position | text | raw text |
| position_normalized | text | 16 categories (see below) |
| institution | text | cleaned |
| institution_raw | text | original Confex text |
| institution_normalized | text | canonical. 4049 unique |
| institution_id | text | |
| city | text | |
| state_province | text | expanded (MI→Michigan) |
| country | text | |
| country_normalized | text | 93 unique. Top: USA(61691) Canada(2586) South Korea(1451) |
| parsing_error | bool | |
| author_id | int | name variant ID (23481) |
| canonical_author_id | int | deduplicated person ID (20779) |

### paper_embeddings (API only)
| column | type | notes |
|--------|------|-------|
| paper_id | text FK | |
| embedding_large | vector(3072) | text-embedding-3-large. RPC: match_papers() |
| embedding_small | vector(1536) | text-embedding-3-small. RPC: match_papers_small() |

## POSITION CATEGORIES
Assistant Professor(13726) Doctoral Student(13312) Associate Professor(9182) Research Staff(8713) Full Professor(8569) Unknown(5686) Masters Student(2674) Senior Leadership Practice(2127) Postdoctoral(1473) Research Faculty(1151) Practitioner(837) Instructor(631) Clinical Professor(616) Senior Leadership Academic(545) Adjunct Faculty(489) Undergraduate Student(193)

## JOIN PATTERN
```sql
SELECT * FROM papers p JOIN paper_authors pa ON p.id = pa.paper_id;
SELECT * FROM paper_authors WHERE author_order = 1; -- first authors
SELECT COUNT(DISTINCT canonical_author_id) FROM paper_authors; -- unique people
```

## MCP CONNECTION
```json
{"mcpServers":{"sswr-history":{"url":"https://mcp.supabase.com/mcp?project_ref=jomsksqqcpkbuhwytovo&read_only=true&features=database"}}}
```

## DATA QUALITY
Institution accuracy: 94% | Position accuracy: 91% | Methodology kappa: .83 | Position data 2005–2008 mostly "Unknown"
