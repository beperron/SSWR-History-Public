<div align="center">

# SSWR Conference History Database

**Two Decades of Scholarship at the Society for Social Work and Research**

`2005 — 2026` · `v0.9.0-beta`

---

23,793 presentations · 20,779 unique researchers · 4,049 institutions · 93 countries

---

[**Quick Start**](https://beperron.github.io/SSWR-History-Public/quickstart.html) · [**Codebook**](https://beperron.github.io/SSWR-History-Public/codebook.html) · [**Download**](https://beperron.github.io/SSWR-History-Public/download.html) · [**Report an Error**](https://github.com/beperron/SSWR-History-Public/issues/new?template=data-error-report.yml)

</div>

---

## What This Is

A comprehensive, structured database of every publicly available presentation abstract from the SSWR Annual Conference over 22 years. Built with AI-assisted curation — small language models parsed unstructured conference records into analyzable metadata, with human review at each stage.

> **Read the paper:** Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. *Journal of the Society for Social Work and Research*. [arXiv:2603.06814](https://arxiv.org/abs/2603.06814)
>
> **Related work:** Perron, B. E., & Qi, Z. (2025). Theoretical and methodological shifts in social work research. *Research on Social Work Practice*. [DOI: 10.1177/10497315251352838](https://journals.sagepub.com/doi/10.1177/10497315251352838)

---

## AI-First Access

This database is designed to be queried through conversation, not code. We are building a lightweight AI layer to facilitate access and analysis, with integrations for agentic workflows. The goal: focus on your research questions, not on writing boilerplate.

### :electric_plug: MCP — Query through conversation

Connect any MCP-compatible AI assistant (Claude, Cursor, OpenCode) to the live database. Ask questions in plain language — the AI writes the query, runs it, and interprets the results.

**[Quick Start guide](https://beperron.github.io/SSWR-History-Public/quickstart.html)** — two copy-paste prompts, no code required.

> *"What percentage of presentations used qualitative methods in 2025?"*
> *"Which institutions had the most first-authored presentations?"*
> *"How has international participation changed since 2010?"*

### :brain: Skill Files — Give AI full context

Skill files provide the AI with complete database schema, query patterns, data quality notes, and semantic search instructions. They're read automatically by AI coding tools.

| File | For | Purpose |
|------|-----|---------|
| `CLAUDE.md` | Claude Code | Full schema, queries, embeddings |
| `AGENTS.md` | OpenCode | Same content for OpenCode |
| `CODEBOOK_LLM.md` | Any LLM | Compact reference for any AI chat |

### :mag: Vector Embeddings — Semantic search

Pre-computed embeddings for all 23,793 presentations enable similarity search across two decades of scholarship. Available via the REST API using `text-embedding-3-large` (3,072 dims) or `text-embedding-3-small` (1,536 dims).

> :construction: MCP integration and skill files are under active development. We welcome feedback via [GitHub Issues](https://github.com/beperron/SSWR-History-Public/issues/new?template=general-feedback.yml).

---

## Downloads

| Format | Description | Size |
|--------|-------------|------|
| :package: [SQLite](https://github.com/beperron/SSWR-History-Public/raw/main/data/sswr_history_0.9.0-beta.db.gz) | Complete database, indexed | 33 MB |
| :page_facing_up: [Papers CSV](https://github.com/beperron/SSWR-History-Public/raw/main/data/csv/sswr_papers_0.9.0-beta.csv) | 23,793 presentations | 83 MB |
| :busts_in_silhouette: [Authors CSV](https://github.com/beperron/SSWR-History-Public/raw/main/data/csv/sswr_paper_authors_0.9.0-beta.csv) | 69,924 author records | 15 MB |

All files are versioned (`v0.9.0-beta`). [Full download options](https://beperron.github.io/SSWR-History-Public/download.html) including JSON and REST API.

---

## Data Quality

| Metric | Value |
|--------|-------|
| Institution extraction accuracy | 94% |
| Position extraction accuracy | 91% |
| Methodology classification (kappa) | .83 |
| Entity resolution | 23,481 → 20,779 identities |
| Human review stages | 4 |

:warning: Despite extensive quality assurance, errors will exist at this scale. **[Report errors here](https://github.com/beperron/SSWR-History-Public/issues/new?template=data-error-report.yml)**.

---

## Release Status

**v0.9.0-beta** — Data and documentation under active review. Error reports and feedback welcome via [GitHub Issues](https://github.com/beperron/SSWR-History-Public/issues/new?template=data-error-report.yml). The `v1.0.0` release will follow community review.

**License:** CC BY 4.0

**Citation:** Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. *Journal of the Society for Social Work and Research*. https://doi.org/10.48550/arXiv.2603.06814

---

<div align="center">

**Brian E. Perron** · University of Michigan · [beperron@umich.edu](mailto:beperron@umich.edu)

**Bryan G. Victor** · Wayne State University

**Zia Qi** · University of Michigan

---

<sub>This is an independent research project. It is not affiliated with, endorsed by, or conducted on behalf of the Society for Social Work and Research. The views expressed here do not represent those of SSWR. All data were compiled exclusively from publicly available information in the SSWR Confex conference archive.</sub>

</div>
