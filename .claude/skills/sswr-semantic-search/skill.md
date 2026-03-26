# SSWR Semantic Search

Use this skill when asked to find presentations similar to a topic, concept, or research question. This uses pre-computed vector embeddings to search by meaning, not just keywords.

## Requirements

- An **OpenRouter API key** (sign up free at https://openrouter.ai, generate key at https://openrouter.ai/keys)
- Python packages: `openai`, `requests`

## Two Embedding Models

| Model | Dimensions | RPC Function | OpenRouter ID | Best For |
|-------|-----------|--------------|---------------|----------|
| text-embedding-3-large | 3,072 | `match_papers` | `openai/text-embedding-3-large` | Higher precision |
| text-embedding-3-small | 1,536 | `match_papers_small` | `openai/text-embedding-3-small` | Faster, cheaper |

**Critical:** The query embedding MUST use the exact same model as the stored embeddings. Mismatched models produce meaningless results.

## Complete Workflow

```python
import openai
import requests

# --- Configuration ---
OPENROUTER_KEY = "sk-or-..."  # User provides this
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNrc3FxY3BrYnVod3l0b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgwODksImV4cCI6MjA1OTc4NDA4OX0.9Vxp6gB03H0MKxrX1ltSCKCumlT-ba5GszWqAAw1Aqg"

# --- Step 1: Generate query embedding ---
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_KEY,
)

response = client.embeddings.create(
    model="openai/text-embedding-3-small",  # or "openai/text-embedding-3-large"
    input="your search query here"
)
query_vector = response.data[0].embedding

# --- Step 2: Search via Supabase RPC ---
result = requests.post(
    "https://jomsksqqcpkbuhwytovo.supabase.co/rest/v1/rpc/match_papers_small",
    # Use "match_papers" for text-embedding-3-large
    headers={
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    },
    json={
        "query_embedding": query_vector,
        "match_threshold": 0.3,  # minimum similarity (0-1)
        "match_count": 10,       # number of results
        "min_year": 2005,        # optional year filter
        "max_year": 2026         # optional year filter
    }
).json()

# --- Step 3: Display results ---
for i, paper in enumerate(result, 1):
    print(f"{i}. [{paper['year']}] sim={paper['similarity']:.3f}")
    print(f"   {paper['title']}")
    print(f"   {paper['methodology']}")
```

## RPC Function Signatures

```
match_papers(query_embedding vector(3072), match_threshold float DEFAULT 0.3, match_count int DEFAULT 10, min_year int DEFAULT 2005, max_year int DEFAULT 2026)

match_papers_small(query_embedding vector(1536), match_threshold float DEFAULT 0.3, match_count int DEFAULT 10, min_year int DEFAULT 2005, max_year int DEFAULT 2026)
```

Both return: `id`, `title`, `year`, `abstract`, `methodology`, `similarity`, `authors` (JSON array)

## Interpreting Similarity Scores

- **> 0.6** — highly relevant, directly on topic
- **0.4–0.6** — related, shares key concepts
- **0.3–0.4** — loosely related
- **< 0.3** — weak match, likely noise

## Using OpenAI Directly (instead of OpenRouter)

```python
client = openai.OpenAI(api_key="sk-...")  # OpenAI key
response = client.embeddings.create(
    model="text-embedding-3-small",  # no "openai/" prefix
    input="your query"
)
```
