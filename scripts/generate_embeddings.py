#!/usr/bin/env python3
"""Generate embeddings for all papers using OpenRouter. Batch writes to Supabase.

Usage:
  python3 scripts/generate_embeddings.py --openrouter-key sk-or-...
"""

import argparse
import time
import openai
import requests

SUPABASE_URL = "https://jomsksqqcpkbuhwytovo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNrc3FxY3BrYnVod3l0b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgwODksImV4cCI6MjA1OTc4NDA4OX0.9Vxp6gB03H0MKxrX1ltSCKCumlT-ba5GszWqAAw1Aqg"

BATCH_SIZE = 100
HEADERS_UPSERT = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}
HEADERS_PATCH = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

MODELS = {
    "large": {"model": "openai/text-embedding-3-large", "dims": 3072, "col": "embedding_large"},
    "small": {"model": "openai/text-embedding-3-small", "dims": 1536, "col": "embedding_small"},
}


def fetch_papers():
    papers = []
    offset = 0
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/papers?select=id,title,abstract&order=id&offset={offset}&limit=1000",
            headers={"apikey": SUPABASE_KEY},
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        papers.extend(batch)
        offset += len(batch)
    return papers


def fetch_done(col):
    done = set()
    offset = 0
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/paper_embeddings?select=paper_id&{col}=not.is.null&offset={offset}&limit=1000",
            headers={"apikey": SUPABASE_KEY},
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        done.update(row["paper_id"] for row in batch)
        offset += len(batch)
    return done


def batch_update(paper_ids, col, vectors):
    """Update embeddings for a batch of papers using individual PATCHes in parallel-ish."""
    # PostgREST doesn't support batch PATCH, so use one PATCH per paper_id
    # but we can pipeline them without waiting
    session = requests.Session()
    session.headers.update(HEADERS_PATCH)
    for pid, vec in zip(paper_ids, vectors):
        r = session.patch(
            f"{SUPABASE_URL}/rest/v1/paper_embeddings?paper_id=eq.{pid}",
            json={col: vec},
        )
        r.raise_for_status()


def generate_and_store(client, papers, model_key):
    cfg = MODELS[model_key]
    col = cfg["col"]
    model_name = cfg["model"]

    done = fetch_done(col)
    todo = [p for p in papers if p["id"] not in done]

    print(f"\n{'='*60}")
    print(f"Model: {model_name} ({cfg['dims']} dims)")
    print(f"Total: {len(papers):,}  |  Done: {len(done):,}  |  Remaining: {len(todo):,}")
    print(f"{'='*60}")

    if not todo:
        print("  Complete!")
        return

    for i in range(0, len(todo), BATCH_SIZE):
        batch = todo[i:i + BATCH_SIZE]
        texts = [(p["title"] or "") + " " + (p["abstract"] or "") for p in batch]

        # Generate embeddings (with retry)
        for attempt in range(3):
            try:
                response = client.embeddings.create(model=model_name, input=texts)
                break
            except Exception as e:
                print(f"  Embed error (attempt {attempt+1}): {e}")
                time.sleep(5 * (attempt + 1))
        else:
            print(f"  SKIPPING batch {i//BATCH_SIZE + 1}")
            continue

        # Write embeddings — use persistent session for connection reuse
        ids = [b["id"] for b in batch]
        vecs = [e.embedding for e in response.data]

        for attempt in range(3):
            try:
                batch_update(ids, col, vecs)
                break
            except Exception as e:
                print(f"  Write error (attempt {attempt+1}): {e}")
                time.sleep(3 * (attempt + 1))
        else:
            print(f"  FAILED to write batch {i//BATCH_SIZE + 1}")

        n = min(i + BATCH_SIZE, len(todo))
        print(f"  [{n:>6,}/{len(todo):,}] {n/len(todo)*100:5.1f}%", flush=True)
        time.sleep(0.2)

    print(f"  Done: {model_name}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--openrouter-key", required=True)
    parser.add_argument("--model", choices=["large", "small", "both"], default="both")
    args = parser.parse_args()

    client = openai.OpenAI(base_url="https://openrouter.ai/api/v1", api_key=args.openrouter_key)

    print("Fetching papers...")
    papers = fetch_papers()
    print(f"  {len(papers):,} papers")

    for m in (["large", "small"] if args.model == "both" else [args.model]):
        generate_and_store(client, papers, m)

    print("\nAll done.")


if __name__ == "__main__":
    main()
