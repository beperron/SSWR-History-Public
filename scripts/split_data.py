#!/usr/bin/env python3
"""Split the monolithic SSWR JSON into GitHub-compatible CSV and per-year JSON files."""

import csv
import json
import os
import sys

VERSION = "0.9.0-beta"
RELEASE_DATE = "2026-03-25"

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(REPO_ROOT, "sswr_complete_2005_2026.json")
DATA_DIR = os.path.join(REPO_ROOT, "data")


METHODOLOGY_REMAP = {
    "review_systematic": "review",
    "review_scoping": "review",
    "review_meta_analysis": "review",
    "review_other": "review",
    "historical_qualitative": "other",
    "theoretical": "other",
}

# Fields to exclude from public release (under quality review)
EXCLUDE_PAPER_FIELDS = {"format"}


def normalize_methodology(value):
    """Collapse review subtypes into 'review' and historical_qualitative into 'other'."""
    if value is None:
        return value
    return METHODOLOGY_REMAP.get(value, value)


def main():
    print(f"Reading {SOURCE} ...")
    with open(SOURCE, "r", encoding="utf-8") as f:
        data = json.load(f)

    metadata = data["metadata"]
    papers = data["papers"]
    authors = data["paper_authors"]

    # Normalize methodology fields and remove excluded fields
    # Fields to remove from public release
    drop_fields = EXCLUDE_PAPER_FIELDS | {
        "methodology_qwen3-32b", "methodology_confidence_qwen3-32b",
        "methodology_gpt-oss-20b",  # identical to methodology; redundant
    }
    meth_fields = ["methodology", "methodology_evidence_gpt-oss-20b"]
    for p in papers:
        for field in ["methodology", "methodology_gpt-oss-20b", "methodology_qwen3-32b"]:
            if field in p:
                p[field] = normalize_methodology(p[field])
        for field in drop_fields:
            p.pop(field, None)
        # Rename evidence field to model-agnostic name
        if "methodology_evidence_gpt-oss-20b" in p:
            p["methodology_classification_rationale"] = p.pop("methodology_evidence_gpt-oss-20b")

    print(f"  Papers:  {len(papers):,}")
    print(f"  Authors: {len(authors):,}")

    # Version envelope for all JSON output
    version_info = {
        "version": VERSION,
        "release_date": RELEASE_DATE,
        "status": "beta",
        "citation": "Perron, B. E., Victor, B. G., & Qi, Z. (in press). AI-assisted curation of conference scholarship. Journal of the Society for Social Work and Research. https://doi.org/10.48550/arXiv.2603.06814",
    }

    # --- metadata.json ---
    metadata["version"] = version_info
    meta_path = os.path.join(DATA_DIR, "json", "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Wrote {meta_path}")

    # --- Per-year paper JSON files ---
    papers_by_year = {}
    for p in papers:
        yr = p["year"]
        papers_by_year.setdefault(yr, []).append(p)

    for yr in sorted(papers_by_year):
        path = os.path.join(DATA_DIR, "json", "papers", f"papers_{yr}.json")
        envelope = {**version_info, "year": yr, "count": len(papers_by_year[yr]), "data": papers_by_year[yr]}
        with open(path, "w", encoding="utf-8") as f:
            json.dump(envelope, f, indent=2, ensure_ascii=False)
        print(f"  {path}  ({len(papers_by_year[yr]):,} records)")

    # --- paper_authors.json ---
    authors_path = os.path.join(DATA_DIR, "json", "paper_authors.json")
    envelope = {**version_info, "count": len(authors), "data": authors}
    with open(authors_path, "w", encoding="utf-8") as f:
        json.dump(envelope, f, indent=2, ensure_ascii=False)
    print(f"Wrote {authors_path}")

    # --- VERSION.json (standalone version file for CSV users) ---
    version_path = os.path.join(DATA_DIR, "VERSION.json")
    with open(version_path, "w", encoding="utf-8") as f:
        json.dump(version_info, f, indent=2, ensure_ascii=False)
    print(f"Wrote {version_path}")

    # --- papers.csv ---
    paper_fields = [
        "id", "year", "title", "abstract", "author_count",
        "methodology", "methodology_classification_rationale",
        "original_paper_id",
    ]
    papers_csv = os.path.join(DATA_DIR, "csv", "papers.csv")
    with open(papers_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=paper_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(papers)
    print(f"Wrote {papers_csv}  ({len(papers):,} rows)")

    # --- paper_authors.csv ---
    author_fields = [
        "id", "paper_id", "author_order", "name", "name_normalized",
        "degree", "position", "institution", "institution_raw",
        "institution_id", "city", "state_province", "country",
        "country_normalized",
        "parsing_error", "author_id", "position_normalized",
        "canonical_author_id", "institution_normalized",
    ]
    authors_csv = os.path.join(DATA_DIR, "csv", "paper_authors.csv")
    with open(authors_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=author_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(authors)
    print(f"Wrote {authors_csv}  ({len(authors):,} rows)")

    # --- Verify ---
    total_per_year = sum(len(v) for v in papers_by_year.values())
    assert total_per_year == len(papers), "Per-year split mismatch!"
    print(f"\nVerification passed: {len(papers):,} papers, {len(authors):,} authors")


if __name__ == "__main__":
    main()
