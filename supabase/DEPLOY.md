# Supabase Deployment Guide

## 1. Apply Migrations

Run these SQL files **in order** in the Supabase Dashboard SQL Editor
(Dashboard > SQL Editor > New query):

1. `migrations/001_enable_pg_trgm.sql` — Enables fuzzy text matching extension
2. `migrations/002_create_search_logs.sql` — Creates query logging table
3. `migrations/003_trigram_indexes.sql` — Adds fuzzy search indexes on authors + institutions
4. `migrations/004_search_authors_rpc.sql` — Author search function
5. `migrations/005_search_institution_rpcs.sql` — Institution search + autocomplete functions

## 2. Set Edge Function Secrets

In the Supabase Dashboard (Settings > Edge Functions > Secrets) or via CLI:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
supabase secrets set HCAPTCHA_SECRET=your-hcaptcha-secret
supabase secrets set SESSION_SECRET=$(openssl rand -hex 32)
```

## 3. Deploy the Edge Function

Via Supabase Dashboard (Edge Functions > Deploy) or CLI:

```bash
supabase functions deploy search --no-verify-jwt
```

The `--no-verify-jwt` flag is required because the function implements its own
authentication via hCaptcha session tokens.

## 4. hCaptcha Setup

1. Register at https://www.hcaptcha.com
2. Add your site: `beperron.github.io` (or your custom domain)
3. Get the **Site Key** and **Secret Key**
4. Replace the test site key in `docs/search.html`:
   - Find: `data-sitekey="10000000-ffff-ffff-ffff-000000000001"`
   - Replace with your real site key
5. Set the secret as an Edge Function secret (step 2 above)

**Test keys** (currently in the code) work for development:
- Site key: `10000000-ffff-ffff-ffff-000000000001`
- Secret: `0x0000000000000000000000000000000000000000`

## 5. Verify

Test each endpoint with curl:

```bash
# Verify captcha (use test token for dev)
curl -X POST https://jomsksqqcpkbuhwytovo.supabase.co/functions/v1/search \
  -H "Content-Type: application/json" \
  -d '{"type": "verify", "captcha_token": "10000000-aaaa-bbbb-cccc-000000000001"}'

# Keyword search (use session_token from verify response)
curl -X POST https://jomsksqqcpkbuhwytovo.supabase.co/functions/v1/search \
  -H "Content-Type: application/json" \
  -d '{"type": "keyword", "query": "trauma", "session_token": "YOUR_TOKEN", "filters": {"min_year": 2005, "max_year": 2026}}'
```
