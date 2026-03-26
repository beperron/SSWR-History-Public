#!/usr/bin/env python3
"""Generate embeddings for all papers using OpenRouter.

Models:
  - openai/text-embedding-3-large  (3072 dimensions)
  - openai/text-embedding-3-small  (1536 dimensions)

Usage:
  python3 scripts/generate_embeddings.py --openrouter-key sk-or-...
"""

import argparse
import time
import openai
from supabase import create_client

SUPABASE_URL = "https://jomsksqqcpkbuhwytovo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNrc3FxY3BrYnVod3l0b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgwODksImV4cCI6MjA1OTc4NDA4OX0.9Vxp6gB03H0MKxrX1ltSCKCumlT-ba5GszWqAAw1Aqg"

BATCH_SIZE = 100  # papers per API call
MODELS = {
    "large": {"model": "openai/text-embedding-3-large", "dims": 3072, "col": "embedding_large"},
    "small": {"model": "openai/text-embedding-3-small", "dims": 1536, "col": "embedding_small"},
}


def get_all_papers(db):
    """Fetch all paper IDs, titles, and abstracts."""
    papers = []
    batch_size = 1000
    offset = 0
    while True:
        result = db.table("papers").select("id, title, abstract").range(offset, offset + batch_size - 1).execute()
        if not result.data:
            break
        papers.extend(result.data)
        offset += batch_size
        if len(result.data) < batch_size:
            break
    return papers


def generate_and_store(client, db, papers, model_key):
    """Generate embeddings for all papers and store in Supabase."""
    cfg = MODELS[model_key]
    model_name = cfg["model"]
    col = cfg["col"]
    total = len(papers)
    print(f"\n{'='*60}")
    print(f"Generating: {model_name} ({cfg['dims']} dims)")
    print(f"Papers: {total:,}  |  Batch size: {BATCH_SIZE}")
    print(f"{'='*60}")

    for i in range(0, total, BATCH_SIZE):
        batch = papers[i:i + BATCH_SIZE]
        texts = [(p["title"] or "") + " " + (p["abstract"] or "") for p in batch]
        ids = [p["id"] for p in batch]

        try:
            response = client.embeddings.create(model=model_name, input=texts)
        except Exception as e:
            print(f"  ERROR at batch {i//BATCH_SIZE + 1}: {e}")
            print(f"  Retrying in 10s...")
            time.sleep(10)
            try:
                response = client.embeddings.create(model=model_name, input=texts)
            except Exception as e2:
                print(f"  FAILED: {e2}")
                continue

        for j, emb_data in enumerate(response.data):
            paper_id = ids[j]
            vector = emb_data.embedding
            db.table("paper_embeddings").update({col: vector}).eq("paper_id", paper_id).execute()

        done = min(i + BATCH_SIZE, total)
        pct = done / total * 100
        print(f"  [{done:>6,}/{total:,}] {pct:5.1f}%", flush=True)

        # Rate limit: small pause between batches
        time.sleep(0.5)

    print(f"  Done: {model_name}")


def main():
    parser = argparse.ArgumentParser(description="Generate paper embeddings via OpenRouter")
    parser.add_argument("--openrouter-key", required=True, help="OpenRouter API key")
    parser.add_argument("--model", choices=["large", "small", "both"], default="both",
                        help="Which model to run (default: both)")
    args = parser.parse_args()

    client = openai.OpenAI(base_url="https://openrouter.ai/api/v1", api_key=args.openrouter_key)
    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Fetching papers...")
    papers = get_all_papers(db)
    print(f"  {len(papers):,} papers loaded")

    models_to_run = ["large", "small"] if args.model == "both" else [args.model]
    for m in models_to_run:
        generate_and_store(client, db, papers, m)

    print(f"\nAll done.")


if __name__ == "__main__":
    main()
