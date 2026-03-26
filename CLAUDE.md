# SSWR Conference History Database

**Version 0.9.0-beta** — 23,793 presentations, 69,924 author records, 2005–2026.

## Citation (required)
Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. *JSSWR*. https://doi.org/10.1086/741324

## MCP
The database is connected via `.claude/mcp.json`. Query it directly with SQL through the MCP tools.

## Skills
This project includes four skills in `.claude/skills/`:

- **sswr-codebook** — schema, field definitions, categorical values, relationships
- **sswr-query** — SQL patterns for analysis (by year, institution, methodology, etc.)
- **sswr-semantic-search** — embedding-based similarity search via OpenRouter
- **sswr-about** — citation, provenance, limitations, error reporting

## Critical Rules
- Use `canonical_author_id` to count unique people (20,779), NOT `author_id` (23,481 name variants)
- Use `author_order = 1` for first/presenting authors
- Methodology values: `quantitative`, `qualitative`, `mixed_methods`, `review`, `other`
- All affiliation data reflects the **time of the conference**, not current positions
- This project is independent of SSWR; data from publicly available Confex archives only
