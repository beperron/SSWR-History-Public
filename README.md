<div align="center">

<img src="docs/assets/seal.png" alt="" width="64">

# SSWR Conference History Database

**Two Decades of Scholarship at the Society for Social Work and Research**

2005 — 2026

[![Beta](https://img.shields.io/badge/release-v0.9.0--beta-d4726b)](https://beperron.github.io/SSWR-History-Public/)
[![License](https://img.shields.io/badge/license-CC%20BY%204.0-555)](https://creativecommons.org/licenses/by/4.0/)
[![Data](https://img.shields.io/badge/presentations-23%2C793-111)](https://beperron.github.io/SSWR-History-Public/codebook.html)
[![Researchers](https://img.shields.io/badge/researchers-20%2C779-111)](https://beperron.github.io/SSWR-History-Public/codebook.html)

[Website](https://beperron.github.io/SSWR-History-Public/) · [Quick Start](https://beperron.github.io/SSWR-History-Public/quickstart.html) · [Codebook](https://beperron.github.io/SSWR-History-Public/codebook.html) · [Download](https://beperron.github.io/SSWR-History-Public/download.html)

</div>

---

A comprehensive, structured database of every publicly available presentation abstract from the SSWR Annual Conference over 22 years — 23,793 presentations, 20,779 unique researchers, 4,049 institutions, 93 countries.

> Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. *Journal of the Society for Social Work and Research*. [DOI: 10.1086/741324](https://www.journals.uchicago.edu/doi/10.1086/741324)
>
> Perron, B. E., & Qi, Z. (2025). Theoretical and methodological shifts in social work research. *Research on Social Work Practice*. [DOI: 10.1177/10497315251352838](https://journals.sagepub.com/doi/10.1177/10497315251352838)

---

### :zap: AI-First

There is no scholarly contribution in writing `pd.read_csv()`. We built this database to be queried through conversation — freeing you from routine code so you can focus on formulating questions, verifying results, and interpreting what they mean. **[Quick Start](https://beperron.github.io/SSWR-History-Public/quickstart.html)** — two copy-paste prompts, no code.

### :electric_plug: MCP — Auto-configured

Clone the repo and the MCP connection is ready. `.claude/mcp.json` and `.cursor/mcp.json` are auto-discovered by Claude Code and Cursor. OpenCode uses `opencode.jsonc`. All connect to the same live Supabase database, read-only.

### :brain: Four Skills — Modular, specialized

Skills in `.claude/skills/` give AI assistants specialized capabilities beyond raw data access:

| | Skill | What it does |
|---|-------|-------------|
| :book: | **sswr-codebook** | Schema, field definitions, categorical values, relationships |
| :bar_chart: | **sswr-query** | 12 SQL query templates (trends, institutions, methodology, collaboration) |
| :mag: | **sswr-semantic-search** | Embedding similarity search via OpenRouter (text-embedding-3-large + small) |
| :bookmark: | **sswr-about** | Citation, provenance, limitations, error reporting |

### :page_facing_up: Portable Context

For tools without skill support (ChatGPT, Claude Desktop without MCP), download [`CODEBOOK_LLM.md`](https://github.com/beperron/SSWR-History-Public/raw/main/CODEBOOK_LLM.md) and paste it into your first message.

> :construction: Skills and MCP integrations are under active development.

---

### :open_file_folder: Downloads

| | Format | Size |
|---|--------|------|
| :floppy_disk: | [**SQLite**](https://github.com/beperron/SSWR-History-Public/raw/main/data/sswr_history_0.9.0-beta.db.gz) — complete database, indexed | 33 MB |
| :page_facing_up: | [**Papers CSV**](https://github.com/beperron/SSWR-History-Public/raw/main/data/csv/sswr_papers_0.9.0-beta.csv) — 23,793 presentations | 83 MB |
| :busts_in_silhouette: | [**Authors CSV**](https://github.com/beperron/SSWR-History-Public/raw/main/data/csv/sswr_paper_authors_0.9.0-beta.csv) — 69,924 records | 15 MB |

All files versioned `v0.9.0-beta`. [Full options](https://beperron.github.io/SSWR-History-Public/download.html) including JSON, REST API, and MCP.

---

### :bar_chart: Data Quality

| | |
|---|---|
| Institution accuracy | **94%** |
| Position accuracy | **91%** |
| Methodology kappa | **.83** |
| Entity resolution | 23,481 → **20,779** identities |
| Human review stages | **4** |

:warning: [Report errors](https://github.com/beperron/SSWR-History-Public/issues/new?template=data-error-report.yml) — corrections with evidence are especially valuable.

---

### :bookmark: Citation

Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. *Journal of the Society for Social Work and Research*. https://doi.org/10.1086/741324

**License:** CC BY 4.0

---

<div align="center">

**Brian E. Perron** · University of Michigan · [beperron@umich.edu](mailto:beperron@umich.edu)

**Bryan G. Victor** · Wayne State University · **Zia Qi** · University of Michigan

<sub>Independent research project. Not affiliated with or endorsed by the Society for Social Work and Research. All data compiled from publicly available Confex conference archives.</sub>

</div>
