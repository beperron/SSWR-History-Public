# SSWR Database — About & Citation

Use this skill when asked about the dataset's provenance, citation, limitations, or error reporting.

## Citation (required when using this data)

Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship: Compiling, structuring, and analyzing two decades of presentations at the Society for Social Work and Research (2005–2026). *Journal of the Society for Social Work and Research*. https://doi.org/10.1086/741324

### BibTeX
```bibtex
@article{perron2026sswr,
  author  = {Perron, Brian E. and Victor, Bryan G. and Qi, Zia},
  title   = {AI-Assisted Curation of Conference Scholarship},
  journal = {Journal of the Society for Social Work and Research},
  year    = {2026},
  note    = {In press},
  doi     = {10.1086/741324}
}
```

## Related Work

Perron, B. E., & Qi, Z. (2025). Theoretical and methodological shifts in social work research: An AI-driven analysis of postmodern and critical theory at the SSWR Annual Conference. *Research on Social Work Practice*. https://doi.org/10.1177/10497315251352838

## Independence

This is an independent research project. It is NOT affiliated with, endorsed by, or conducted on behalf of the Society for Social Work and Research. All data were compiled exclusively from publicly available information in the SSWR Confex conference archive.

## Temporal Note

All author information (position, degree, institution, affiliation) reflects what was reported at the time of the conference, not current information. This database preserves the original SSWR conference record. A researcher listed as a doctoral student in 2012 may now hold a faculty position — this is not an error.

## Known Limitations

1. Author disambiguation is imperfect — blocking by first initial/last name may miss matches with different initials
2. Methodology classification is based on abstract content only
3. Database captures accepted presentations, not submitted proposals
4. Presentation formats varied across years (especially virtual 2020/2021)
5. Limited to abstracts publicly available through Confex archive
6. No pre-2005 data available
7. Some withdrawn presentations may be included

## Data Quality

- Institution extraction: 94% accuracy (200-record manual review)
- Position extraction: 91% accuracy
- Methodology classification: Cohen's kappa = .83
- Entity resolution: 23,481 name variants → 20,779 canonical identities
- Human review at 4 stages (scraping, parsing, resolution, classification)

## Report Errors

https://github.com/beperron/SSWR-History-Public/issues/new?template=data-error-report.yml

## Version

v0.9.0-beta (2026-03-25) — Data and documentation under active review.

## Authors

- Brian E. Perron, School of Social Work, University of Michigan (beperron@umich.edu)
- Bryan G. Victor, School of Social Work, Wayne State University
- Zia Qi, School of Social Work, University of Michigan
