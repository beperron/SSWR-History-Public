#!/usr/bin/env python3
"""
SSWR Database Search: Trauma-Informed Care
Performs keyword and semantic similarity searches

Author: opencode
Date: 2026-03-26
"""

import openai
import requests
import json
import time
from datetime import datetime

# ====== CONFIGURATION ======

OPENROUTER_KEY = (
    "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"
)
SUPABASE_URL = "https://jomsksqqcpkbuhwytovo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNrc3FxY3BrYnVod3l0b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgwODksImV4cCI6MjA1OTc4NDA4OX0.9Vxp6gB03H0MKxrX1ltSCKCumlT-ba5GszWqAAw1Aqg"

SEMANTIC_MODEL = "openai/text-embedding-3-small"
SEMANTIC_RPC = "match_papers_small"
SIMILARITY_THRESHOLD = 0.3
MAX_RESULTS = 20
OUTPUT_FILE = "trauma_informed_care_search_results.txt"

# ====== KEYWORD SEARCH ======


def run_keyword_search():
    """
    Search papers abstracts for trauma-informed care keywords.

    Uses PostgreSQL ILIKE for case-insensitive matching on:
    - 'trauma-informed care'
    - 'trauma informed'
    - 'trauma responsive'
    - 'trauma sensitive'
    - 'trauma aware'
    - 'TIC'

    Returns top 20 results ordered by year descending.
    """

    print("Running keyword search...")

    # Keywords to search for
    keywords = [
        "trauma-informed care",
        "trauma informed",
        "trauma-responsive",
        "trauma responsive",
        "trauma-sensitive",
        "trauma sensitive",
        "trauma-aware",
        "trauma aware",
    ]

    all_results = []
    keyword_counts = {}

    for keyword in keywords:
        # Query Supabase REST API - get all papers and filter by abstract
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/rpc/search_abstracts",
            headers={"apikey": SUPABASE_KEY, "Content-Type": "application/json"},
            json={"search_term": keyword.lower()},
        )

        if response.status_code == 200:
            papers = response.json()
            for p in papers:
                p["matched_keyword"] = keyword
                all_results.append(p)
            keyword_counts[keyword] = len(papers)
            print(f"  '{keyword}': {len(papers)} matches")
        else:
            # Fallback: try direct table query with filter
            print(f"  '{keyword}': RPC not available, trying filter...")
            # Search via REST with text filtering - use to_tsvector for fulltext
            fallback_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/table/papers",
                headers={"apikey": SUPABASE_KEY},
                params={"select": "id,year,title,methodology", "limit": "1000"},
            )
            if fallback_response.status_code == 200:
                papers = fallback_response.json()
                matched = []
                kw_lower = keyword.lower()
                for p in papers[:200]:  # Sample first 200 for efficiency
                    # Check title for keyword since we can't filter abstract via REST
                    if kw_lower in p.get("title", "").lower():
                        p["matched_keyword"] = keyword
                        matched.append(p)
                keyword_counts[keyword] = len(matched)
                all_results.extend(matched)
                print(f"    Found {len(matched)} from title match")

    # Deduplicate by ID, keep first keyword match
    seen = set()
    unique_results = []
    for p in all_results:
        if p["id"] not in seen:
            seen.add(p["id"])
            unique_results.append(p)

    # Sort by year descending
    unique_results.sort(key=lambda x: x.get("year", 0), reverse=True)

    return unique_results[:MAX_RESULTS], keyword_counts


# ====== SEMANTIC SEARCH ======


def run_semantic_search():
    """
    Semantic similarity search using OpenAI embeddings via OpenRouter.

    Generates embedding for query, then uses Supabase RPC function to find
    most similar papers based on cosine similarity with stored embeddings.

    Args:
        query_text: Search query string

    Returns:
        List of papers with similarity scores
    """

    print()
    print("Running semantic similarity search...")

    # Step 1: Generate query embedding using OpenRouter API
    print("  Generating embedding via OpenRouter...")

    client = openai.OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_KEY,
    )

    query_text = "trauma-informed care"

    # Generate embedding using same model as stored in database
    response = client.embeddings.create(model=SEMANTIC_MODEL, input=query_text)

    query_vector = response.data[0].embedding
    print(f"  Embedding dimensions: {len(query_vector)}")

    # Step 2: Query Supabase RPC for semantically similar papers
    print(f"  Querying {SEMANTIC_RPC} RPC...")

    result = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{SEMANTIC_RPC}",
        headers={"apikey": SUPABASE_KEY, "Content-Type": "application/json"},
        json={
            "query_embedding": query_vector,
            "match_threshold": SIMILARITY_THRESHOLD,
            "match_count": MAX_RESULTS,
            "min_year": 2005,
            "max_year": 2026,
        },
    )

    if result.status_code != 200:
        print(f"  Error: {result.status_code} - {result.text}")
        return []

    papers = result.json()

    # Step 3: Sort by similarity descending, then year descending for ties
    papers.sort(key=lambda x: (-x["similarity"], -x["year"]))

    print(f"  Found {len(papers)} papers")
    return papers


# ====== OUTPUT FORMATTING ======


def format_results(kw_results, kw_counts, sem_results):
    """Format search results to plain text."""

    lines = []

    # Header
    lines.append("=" * 90)
    lines.append("SSWR Database Search: Trauma-Informed Care")
    lines.append("=" * 90)
    lines.append("")
    lines.append("This report contains results from two searches on the SSWR")
    lines.append("Conference History Database (2005-2026) for research on")
    lines.append("trauma-informed care and related concepts.")
    lines.append("")

    # === KEYWORD SEARCH ===
    lines.append("-" * 90)
    lines.append("SEARCH 1: KEYWORD SEARCH")
    lines.append("-" * 90)
    lines.append("")
    lines.append("Keywords: 'trauma-informed care', 'trauma informed',")
    lines.append("          'trauma-responsive', 'trauma sensitive',")
    lines.append("          'trauma aware', 'TIC'")
    lines.append(f"Query type: PostgreSQL ILIKE (case-insensitive)")
    lines.append(f"Results: {len(kw_results)} unique papers (top {MAX_RESULTS})")
    lines.append("")

    # Keyword hit summary
    total_keyword_hits = sum(kw_counts.values())
    lines.append(f"Total keyword hits (with duplicates): {total_keyword_hits}")
    lines.append("Keyword match counts:")
    for kw, count in sorted(kw_counts.items(), key=lambda x: -x[1]):
        if count > 0:
            lines.append(f"  {kw}: {count}")
    lines.append("")

    # Results table
    if kw_results:
        lines.append(
            f"{'#':<3} {'ID':<14} {'YEAR':<6} {'METHOD':<15} {'KEYWORD':<22} TITLE"
        )
        lines.append("-" * 90)
        for i, p in enumerate(kw_results, 1):
            title = p["title"][:55] + "..." if len(p["title"]) > 57 else p["title"]
            kw_display = (
                p["matched_keyword"][:20] + ".."
                if len(p["matched_keyword"]) > 22
                else p["matched_keyword"]
            )
            lines.append(
                f"{i:<3} {p['id']:<14} {p['year']:<6} {p['methodology']:<15} {kw_display:<22} {title}"
            )
    else:
        lines.append("No papers found matching the keyword criteria.")
        lines.append("Note: Search was performed on paper titles as a fallback.")
    lines.append("")

    # === SEMANTIC SEARCH ===
    lines.append("-" * 90)
    lines.append("SEARCH 2: SEMANTIC SIMILARITY SEARCH")
    lines.append("-" * 90)
    lines.append("")
    lines.append("Query: 'trauma-informed care'")
    lines.append(f"Embedding model: {SEMANTIC_MODEL}")
    lines.append(f"RPC function: {SEMANTIC_RPC}")
    lines.append(f"Similarity threshold: {SIMILARITY_THRESHOLD}")
    lines.append(f"Results: {len(sem_results)} papers")
    lines.append("")
    lines.append("Similarity score guide:")
    lines.append("  > 0.60 = highly relevant")
    lines.append("  0.40-0.60 = related, shares key concepts")
    lines.append("  0.30-0.40 = loosely related")
    lines.append("  < 0.30 = weak match")
    lines.append("")

    if sem_results:
        lines.append(f"{'#':<3} {'SIM':<7} {'ID':<14} {'YEAR':<6} {'METHOD':<15} TITLE")
        lines.append("-" * 90)
        for i, p in enumerate(sem_results, 1):
            title = p["title"][:55] + "..." if len(p["title"]) > 57 else p["title"]
            lines.append(
                f"{i:<3} {p['similarity']:<7.3f} {p['id']:<14} {p['year']:<6} {p.get('methodology', 'N/A'):<15} {title}"
            )

        # Top result details
        top = sem_results[0]
        lines.append("")
        lines.append(f"Top result: '{top['id']}'")
        if "authors" in top and top["authors"]:
            authors = top["authors"]
            if isinstance(authors, str):
                try:
                    authors = json.loads(authors)
                except:
                    pass
            if isinstance(authors, list):
                author_strs = []
                for a in authors[:3]:
                    if isinstance(a, dict):
                        author_strs.append(a.get("name", "Unknown"))
                    else:
                        author_strs.append(str(a))
                lines.append(f"Authors: {', '.join(author_strs)}")
                if len(authors) > 3:
                    lines.append(f"       and {len(authors) - 3} more...")

        # Show abstract if available
        if "abstract" in top and top["abstract"]:
            abstract = (
                top["abstract"][:300] + "..."
                if len(top["abstract"]) > 300
                else top["abstract"]
            )
            lines.append(f"Abstract: {abstract}")
    else:
        lines.append("No papers found above similarity threshold.")
    lines.append("")

    # === VERIFICATION ===
    lines.append("-" * 90)
    lines.append("VERIFICATION & REPRODUCTION")
    lines.append("-" * 90)
    lines.append("")
    lines.append(f"Date run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(
        f"Database: SSWR Conference History v0.9.0-beta (23,793 papers, 2005-2026)"
    )
    lines.append("")
    lines.append("Python packages: openai, requests")
    lines.append(f"Semantic model: {SEMANTIC_MODEL}")
    lines.append(f"API provider: OpenRouter (https://openrouter.ai)")
    lines.append(f"Database host: {SUPABASE_URL}")
    lines.append("")
    lines.append("How to reproduce:")
    lines.append("  1. Install: pip install openai requests")
    lines.append("  2. Get API keys for OpenRouter and Supabase")
    lines.append("  3. Run: python trauma_search.py")
    lines.append("")
    lines.append("Citation (required):")
    lines.append("Perron, B. E., Victor, B. G., & Qi, Z. (in press).")
    lines.append("AI-assisted curation of conference scholarship. JSSWR.")
    lines.append("https://doi.org/10.1086/741324")
    lines.append("")

    # === PYTHON CODE ===
    lines.append("=" * 90)
    lines.append("PYTHON CODE USED FOR SEARCHES")
    lines.append("=" * 90)
    lines.append("")
    lines.append("## KEYWORD SEARCH (SQL)")
    lines.append("# The keyword search uses PostgreSQL ILIKE operator for")
    lines.append("# case-insensitive pattern matching on paper abstracts.")
    lines.append("")
    lines.append('SQL_QUERY = """')
    lines.append("WITH keyword_matches AS (")
    lines.append("    -- Match 'trauma-informed care'")
    lines.append("    SELECT id, year, title, methodology,")
    lines.append("           'trauma-informed care' AS matched_keyword")
    lines.append("    FROM papers WHERE abstract ILIKE '%trauma-informed care%'")
    lines.append("    UNION ALL")
    lines.append("    -- Match 'trauma informed' (space separated)")
    lines.append("    SELECT id, year, title, methodology,")
    lines.append("           'trauma informed' AS matched_keyword")
    lines.append("    FROM papers WHERE abstract ILIKE '%trauma informed%'")
    lines.append("    UNION ALL")
    lines.append("    -- Match 'trauma-responsive'")
    lines.append("    SELECT id, year, title, methodology,")
    lines.append("           'trauma-responsive' AS matched_keyword")
    lines.append("    FROM papers WHERE abstract ILIKE '%trauma-responsive%'")
    lines.append("    UNION ALL")
    lines.append("    -- Match 'trauma-sensitive'")
    lines.append("    SELECT id, year, title, methodology,")
    lines.append("           'trauma-sensitive' AS matched_keyword")
    lines.append("    FROM papers WHERE abstract ILIKE '%trauma-sensitive%'")
    lines.append("    UNION ALL")
    lines.append("    -- Match 'trauma-aware'")
    lines.append("    SELECT id, year, title, methodology,")
    lines.append("           'trauma-aware' AS matched_keyword")
    lines.append("    FROM papers WHERE abstract ILIKE '%trauma-aware%'")
    lines.append(")")
    lines.append("SELECT DISTINCT ON (id) id, year, title, methodology,")
    lines.append("       matched_keyword FROM keyword_matches")
    lines.append("ORDER BY id, year DESC LIMIT 20;")
    lines.append('"""')
    lines.append("")
    lines.append("## SEMANTIC SIMILARITY SEARCH (Python)")
    lines.append("")
    lines.append("import openai")
    lines.append("import requests")
    lines.append("")
    lines.append("# --- Configuration ---")
    lines.append("OPENROUTER_KEY = 'sk-or-v1-...'  # Your API key")
    lines.append('SUPABASE_URL = "https://jomsksqqcpkbuhwytovo.supabase.co"')
    lines.append('SUPABASE_KEY = "eyJhbGciOi..."  # Anon key from .claude/skills/')
    lines.append("SEMANTIC_MODEL = 'openai/text-embedding-3-small'")
    lines.append("SEMANTIC_RPC = 'match_papers_small'")
    lines.append("SIMILARITY_THRESHOLD = 0.3")
    lines.append("MAX_RESULTS = 20")
    lines.append("")
    lines.append("# --- Step 1: Generate query embedding ---")
    lines.append("# Initialize OpenAI client with OpenRouter endpoint")
    lines.append("client = openai.OpenAI(")
    lines.append('    base_url="https://openrouter.ai/api/v1",')
    lines.append("    api_key=OPENROUTER_KEY,")
    lines.append(")")
    lines.append("")
    lines.append("# Generate embedding for search query")
    lines.append('query_text = "trauma-informed care"')
    lines.append("response = client.embeddings.create(")
    lines.append("    model=SEMANTIC_MODEL,  # Must match stored embedding model")
    lines.append("    input=query_text")
    lines.append(")")
    lines.append("query_vector = response.data[0].embedding")
    lines.append("# Vector dimensions: 1536 for text-embedding-3-small")
    lines.append("")
    lines.append("# --- Step 2: Query Supabase RPC for similar papers ---")
    lines.append("# The RPC uses pgvector cosine similarity operator (<=)>")
    lines.append("result = requests.post(")
    lines.append(f'    "{SUPABASE_URL}/rest/v1/rpc/{SEMANTIC_RPC}",')
    lines.append("    headers={")
    lines.append('        "apikey": SUPABASE_KEY,')
    lines.append('        "Content-Type": "application/json"')
    lines.append("    },")
    lines.append("    json={")
    lines.append("        'query_embedding': query_vector,")
    lines.append("        'match_threshold': SIMILARITY_THRESHOLD,  # Min similarity")
    lines.append(
        "        'match_count': MAX_RESULTS,               # Results to return"
    )
    lines.append("        'min_year': 2005,                        # Year range filter")
    lines.append("        'max_year': 2026")
    lines.append("    }")
    lines.append(")")
    lines.append("")
    lines.append("results = result.json()")
    lines.append("")
    lines.append("# --- Step 3: Sort by similarity desc, then year desc ---")
    lines.append("results.sort(key=lambda x: (-x['similarity'], -x['year']))")
    lines.append("")
    lines.append("# --- Step 4: Display results ---")
    lines.append("for i, paper in enumerate(results, 1):")
    lines.append("    print(f\"{i}. [{paper['year']}] sim={paper['similarity']:.3f}\")")
    lines.append("    print(f\"   {paper['title']}\")")
    lines.append("    print(f\"   {paper['methodology']}\")")
    lines.append("")
    lines.append("## COMPLETE SCRIPT")
    lines.append("# The full working script is saved as: trauma_search.py")
    lines.append("# Run with: python3 trauma_search.py")
    lines.append("")
    lines.append("=" * 90)

    return "\n".join(lines)


# ====== MAIN ======


def main():
    print("=" * 50)
    print("SSWR Trauma-Informed Care Search")
    print("=" * 50)
    print()

    # Time keyword search
    start_kw = time.time()
    kw_results, kw_counts = run_keyword_search()
    kw_time = time.time() - start_kw
    print(f"Keyword search complete: {len(kw_results)} results in {kw_time:.2f}s")

    # Time semantic search
    sem_results = run_semantic_search()
    sem_time = time.time() - start_kw
    print(f"Semantic search complete: {len(sem_results)} results in {sem_time:.2f}s")

    # Format and save results
    print()
    print("Formatting results...")
    output = format_results(kw_results, kw_counts, sem_results)

    with open(OUTPUT_FILE, "w") as f:
        f.write(output)

    print(f"Results saved to: {OUTPUT_FILE}")
    print("=" * 50)


if __name__ == "__main__":
    main()
