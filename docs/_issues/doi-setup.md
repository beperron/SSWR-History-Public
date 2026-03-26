# Obtain DOI via Zenodo + plan ICPSR deposit

## Summary

The dataset needs a persistent DOI for citation in the companion paper and by downstream users. Two-phase approach: Zenodo now (beta), ICPSR later (formal v1.0.0 release).

---

## Phase 1: Zenodo (immediate — beta DOI)

Zenodo is free, run by CERN, and integrates directly with GitHub. Every GitHub release automatically mints a DOI.

### Steps

1. **Go to [zenodo.org/login](https://zenodo.org/login)** and log in with your GitHub account.

2. **Enable the repository.** Navigate to [zenodo.org/account/settings/github](https://zenodo.org/account/settings/github/). Find `beperron/SSWR-History-Public` in the list and flip the toggle to **ON**.

3. **Create a GitHub release.** Go to [github.com/beperron/SSWR-History-Public/releases/new](https://github.com/beperron/SSWR-History-Public/releases/new):
   - **Tag:** `v0.9.0-beta`
   - **Title:** `SSWR Conference History Database v0.9.0-beta`
   - **Description:**
     ```
     Beta release of the SSWR Conference History Database (2005–2026).

     - 23,793 presentations with methodology classifications
     - 69,924 author records with affiliations, positions, and geographic data
     - 20,779 unique researchers across 4,049 institutions in 93 countries
     - Vector embeddings via text-embedding-3-large and text-embedding-3-small
     - REST API and MCP access for AI-native querying

     Data and documentation are under active review. Report errors via GitHub Issues.

     Companion paper: Perron, B. E., Victor, B. G., & Qi, Z. (in press). Journal of the Society for Social Work and Research. https://doi.org/10.48550/arXiv.2603.06814
     ```
   - Check **Set as a pre-release**
   - Click **Publish release**

4. **Wait ~1 minute.** Zenodo will automatically archive the release and mint a DOI.

5. **Get your DOI.** Go to [zenodo.org/account/settings/github](https://zenodo.org/account/settings/github/) — click the badge next to SSWR-History to see your DOI. You'll get two DOIs:
   - A **version-specific DOI** (points to v0.9.0-beta forever)
   - A **concept DOI** (always resolves to the latest version — use this in the paper)

6. **Update the repository.** Add the Zenodo DOI badge to the README, update CITATION.cff with the DOI, and update the site's citation blocks.

### Zenodo metadata to configure

After the first release, go to your Zenodo record and edit the metadata:
- **Title:** SSWR Conference History Database, 2005–2026
- **Authors:** Brian E. Perron, Bryan G. Victor, Zia Qi
- **Description:** Copy from the release description above
- **License:** Creative Commons Attribution 4.0 International
- **Keywords:** bibliometric analysis, conference abstracts, social work research, SSWR, scientometrics
- **Related identifiers:** Link to the arXiv paper (DOI: 10.48550/arXiv.2603.06814) as "is supplement to"
- **Communities:** Consider adding to relevant Zenodo communities (Social Sciences, Bibliometrics)

---

## Phase 2: ICPSR (for v1.0.0 formal release)

ICPSR (Inter-university Consortium for Political and Social Research) is the gold standard for social science data archival. It's run by the University of Michigan and would carry significant weight with the SSWR audience.

### Why ICPSR

- Most recognized data archive in social science
- Curated review process adds credibility
- Persistent infrastructure (funded, institutional backing)
- The SSWR audience will recognize and trust it
- University of Michigan affiliation makes this a natural fit

### Steps (after community review of v0.9.0-beta)

1. **Prepare the deposit.** ICPSR requires:
   - Data files (CSV format preferred)
   - Codebook/documentation (PDF or machine-readable)
   - Study-level metadata (abstract, geographic coverage, time period, methodology)

2. **Submit via [deposit.icpsr.umich.edu](https://deposit.icpsr.umich.edu).** U-M affiliates can self-deposit.

3. **ICPSR curation.** Their team reviews the data, checks for disclosure risk, standardizes metadata, and assigns a persistent DOI. This process takes 2–6 weeks.

4. **Update citations.** Once the ICPSR DOI is minted, update the paper, README, CITATION.cff, and site with the ICPSR DOI as the primary dataset citation.

### Timeline

- v0.9.0-beta + Zenodo DOI: **now**
- Community review period: **1–2 months**
- Incorporate corrections → v1.0.0
- ICPSR deposit: **after v1.0.0**
- ICPSR DOI available: **2–6 weeks after deposit**

---

## Checklist

- [ ] Log in to Zenodo with GitHub
- [ ] Enable SSWR-History repo on Zenodo
- [ ] Create GitHub release v0.9.0-beta
- [ ] Verify Zenodo minted the DOI
- [ ] Edit Zenodo metadata (authors, keywords, related identifiers)
- [ ] Add Zenodo DOI badge to README
- [ ] Update CITATION.cff with Zenodo DOI
- [ ] Update site citation blocks with DOI
- [ ] (Later) Submit to ICPSR for v1.0.0
