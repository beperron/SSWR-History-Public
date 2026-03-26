<div align="center">

# SSWR Conference History Database

**Two Decades of Scholarship at the Society for Social Work and Research**

`2005 — 2026`

---

23,793 presentations · 69,924 author records · 20,779 unique researchers · 4,049 institutions · 93 countries

---

[**Explore the Data**](https://beperron.github.io/SSWR-History/) · [**Download**](https://beperron.github.io/SSWR-History/download.html) · [**Codebook**](https://beperron.github.io/SSWR-History/codebook.html) · [**Report an Error**](https://github.com/beperron/SSWR-History/issues/new?template=data-error-report.yml)

</div>

---

## What This Is

A comprehensive, structured database of every publicly available presentation abstract from the SSWR Annual Conference over 22 years. Built with AI-assisted curation — small language models parsed unstructured conference records into analyzable metadata, with human review at each stage.

This dataset transforms what was previously an informational archive into research infrastructure for the social work research community.

> **Read the paper:** Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship: Compiling, structuring, and analyzing two decades of presentations at the Society for Social Work and Research (2005–2026). *Journal of the Society for Social Work and Research*.
>
> [arXiv:2603.06814](https://arxiv.org/abs/2603.06814)

> **Related work:** Perron, B. E., & Qi, Z. (2025). Theoretical and methodological shifts in social work research: An AI-driven analysis of postmodern and critical theory at the SSWR Annual Conference. *Research on Social Work Practice*.
>
> [DOI: 10.1177/10497315251352838](https://journals.sagepub.com/doi/10.1177/10497315251352838)

---

## Quick Start

### CSV (simplest)

```python
import pandas as pd

papers  = pd.read_csv("data/csv/papers.csv")
authors = pd.read_csv("data/csv/paper_authors.csv")
```

### REST API (no download required)

Query the live database directly via the Supabase PostgREST API:

```bash
# Get all 2026 presentations
curl "https://jomsksqqcpkbuhwytovo.supabase.co/rest/v1/papers?year=eq.2026&select=id,title,methodology" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNrc3FxY3BrYnVod3l0b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgwODksImV4cCI6MjA1OTc4NDA4OX0.9Vxp6gB03H0MKxrX1ltSCKCumlT-ba5GszWqAAw1Aqg"
```

```python
from supabase import create_client

db = create_client(
    "https://jomsksqqcpkbuhwytovo.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNrc3FxY3BrYnVod3l0b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgwODksImV4cCI6MjA1OTc4NDA4OX0.9Vxp6gB03H0MKxrX1ltSCKCumlT-ba5GszWqAAw1Aqg"
)

# Qualitative presentations from 2020 onward
result = db.table("papers") \
    .select("id, title, year") \
    .eq("methodology", "qualitative") \
    .gte("year", 2020) \
    .execute()
```

---

## MCP: AI-Native Data Access

This database is available as a **Model Context Protocol (MCP)** resource, enabling AI assistants like Claude to query and analyze the data directly through natural conversation.

### Why This Matters

MCP represents a shift in how researchers can interact with structured datasets. Instead of writing queries, downloading files, or building dashboards, you can ask questions in plain language:

- *"What percentage of SSWR presentations used qualitative methods in 2025?"*
- *"Which institutions had the most first-authored presentations?"*
- *"How has international participation changed since 2015?"*

The AI formulates the SQL, executes it against the live database, and returns interpreted results — collapsing the pipeline from question to answer.

### Connect via MCP

Add this to your Claude Desktop or Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic-ai/mcp-supabase@latest",
        "--supabase-url", "https://jomsksqqcpkbuhwytovo.supabase.co",
        "--supabase-key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNrc3FxY3BrYnVod3l0b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgwODksImV4cCI6MjA1OTc4NDA4OX0.9Vxp6gB03H0MKxrX1ltSCKCumlT-ba5GszWqAAw1Aqg",
        "--read-only"
      ]
    }
  }
}
```

Once connected, ask Claude anything about SSWR conference history. The database includes full abstracts, author affiliations, methodology classifications, institutional data, and geographic information — all queryable through conversation.

> This is an early demonstration of how scholarly datasets can be made AI-accessible. We believe this pattern — structured data + MCP + natural language — will become a standard interface for research infrastructure.

---

## Data Structure

```
papers (23,793 rows)
├── id                              unique identifier (YYYY-L-NNNN)
├── year                            conference year (2005–2026)
├── title                           presentation title
├── abstract                        full abstract text
├── author_count                    number of authors
├── methodology                     quantitative | qualitative | mixed_methods | review | other
├── methodology_evidence_gpt-oss-20b   classification rationale
└── original_paper_id               source reference ID

paper_authors (69,924 rows)
├── id                              record identifier
├── paper_id                → papers.id
├── author_order                    position in author list (1 = first)
├── name / name_normalized          original and normalized name
├── degree                          academic credentials
├── position / position_normalized  raw and standardized position
├── institution / institution_raw / institution_normalized / institution_id
├── city / state_province
├── country / country_normalized
├── country_fixed / country_fix_from   correction flags (reserved)
├── parsing_error                   LLM parsing error flag
├── author_id                       entity resolution ID (23,481 variants)
└── canonical_author_id             deduplicated ID (20,779 identities)
```

---

## Data Quality

| Metric | Value |
|--------|-------|
| Institution extraction accuracy | 94% (200-record manual review) |
| Position extraction accuracy | 91% (200-record manual review) |
| Methodology classification agreement | Cohen's kappa = .83 |
| Entity resolution | 23,481 → 20,779 canonical identities |
| Human review stages | 4 (after scraping, parsing, resolution, classification) |

Despite extensive quality assurance, errors will exist in a dataset of this scale. **[Report errors here](https://github.com/beperron/SSWR-History/issues/new?template=data-error-report.yml)** — corrections with evidence are especially valuable.

---

## License

**CC BY 4.0** — free to share and adapt for any purpose with attribution.

---

## Citation

```
Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of
conference scholarship: Compiling, structuring, and analyzing two decades
of presentations at the Society for Social Work and Research (2005–2026).
Journal of the Society for Social Work and Research.
https://doi.org/10.48550/arXiv.2603.06814
```

---

<div align="center">

**Brian E. Perron** · University of Michigan · [beperron@umich.edu](mailto:beperron@umich.edu)

**Bryan G. Victor** · Wayne State University

**Zia Qi** · University of Michigan

---

<sub>This is an independent research project. It is not affiliated with, endorsed by, or conducted on behalf of the Society for Social Work and Research. The views expressed here do not represent those of SSWR. All data were compiled exclusively from publicly available information in the SSWR Confex conference archive.</sub>

</div>
