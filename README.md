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

> Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. *Journal of the Society for Social Work and Research*. [arXiv:2603.06814](https://arxiv.org/abs/2603.06814)
>
> Perron, B. E., & Qi, Z. (2025). Theoretical and methodological shifts in social work research. *Research on Social Work Practice*. [DOI: 10.1177/10497315251352838](https://journals.sagepub.com/doi/10.1177/10497315251352838)

---

### :zap: AI-First

This database is built for AI-native access. Query through conversation, not code. We are actively building a lightweight AI layer for agentic analysis — the goal is to free you from boilerplate so you can focus on thinking about your research.

### :electric_plug: MCP — Natural language queries

Connect any MCP-compatible assistant (Claude, Cursor, OpenCode) to the live database. Two copy-paste prompts, no code. **[Quick Start](https://beperron.github.io/SSWR-History-Public/quickstart.html)**

### :brain: Skill Files — Full database context

AI assistants read these automatically for schema, query patterns, and semantic search instructions.

| | File | For |
|---|------|-----|
| :clipboard: | `CLAUDE.md` | Claude Code |
| :clipboard: | `AGENTS.md` | OpenCode |
| :clipboard: | `CODEBOOK_LLM.md` | Any LLM (paste into chat) |

### :mag: Embeddings — Semantic search

Pre-computed vectors for all 23,793 presentations. `text-embedding-3-large` (3,072d) and `text-embedding-3-small` (1,536d) via OpenRouter or OpenAI.

> :construction: MCP and skill file integrations are under active development.

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

Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. *Journal of the Society for Social Work and Research*. https://doi.org/10.48550/arXiv.2603.06814

**License:** CC BY 4.0

---

<div align="center">

**Brian E. Perron** · University of Michigan · [beperron@umich.edu](mailto:beperron@umich.edu)

**Bryan G. Victor** · Wayne State University · **Zia Qi** · University of Michigan

<sub>Independent research project. Not affiliated with or endorsed by the Society for Social Work and Research. All data compiled from publicly available Confex conference archives.</sub>

</div>
