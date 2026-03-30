import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HCAPTCHA_SECRET = Deno.env.get("HCAPTCHA_SECRET")!;
const SESSION_SECRET = Deno.env.get("SESSION_SECRET")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// In-memory rate limiting (resets on cold start)
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ---- Helpers ----

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(payload);
  return expected === signature;
}

function createSessionToken(id: string, ts: number): Promise<string> {
  const payload = btoa(JSON.stringify({ id, ts }));
  return hmacSign(payload).then((sig) => `${payload}.${sig}`);
}

async function validateSessionToken(
  token: string
): Promise<{ valid: boolean; id?: string }> {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [payload, sig] = parts;
  const ok = await hmacVerify(payload, sig);
  if (!ok) return { valid: false };
  try {
    const data = JSON.parse(atob(payload));
    // 24-hour expiry
    if (Date.now() - data.ts > 24 * 60 * 60 * 1000) return { valid: false };
    return { valid: true, id: data.id };
  } catch {
    return { valid: false };
  }
}

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(sessionId);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimits.set(sessionId, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

async function hashString(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 16);
}

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text.slice(0, 8000), // safety truncation
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter embedding error: ${res.status} ${err}`);
  }
  const json = await res.json();
  return json.data[0].embedding;
}

// ---- Main handler ----

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const startTime = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const { type } = body;

  // ---- CAPTCHA VERIFICATION ----
  if (type === "verify") {
    const captchaToken = body.captcha_token as string;
    if (!captchaToken) {
      return errorResponse("Missing captcha token", 400);
    }

    const verifyRes = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: captchaToken,
      }),
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return errorResponse("Captcha verification failed", 403);
    }

    const sessionToken = await createSessionToken(
      crypto.randomUUID(),
      Date.now()
    );
    return jsonResponse({ session_token: sessionToken });
  }

  // ---- ALL OTHER ROUTES: Validate session ----
  const sessionToken = body.session_token as string;
  const session = await validateSessionToken(sessionToken);
  if (!session.valid) {
    return errorResponse("Invalid or expired session", 401);
  }

  if (!checkRateLimit(session.id!)) {
    return errorResponse("Too many requests. Please wait a moment.", 429);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const query = (body.query as string || "").trim();
  const filters = (body.filters || {}) as Record<string, unknown>;
  const minYear = (filters.min_year as number) || 2005;
  const maxYear = (filters.max_year as number) || 2026;
  const methodology = (filters.methodology as string) || null;
  const matchCount = Math.min((body.match_count as number) || 25, 50);

  if (!query && type !== "autocomplete" && type !== "author_papers") {
    return errorResponse("Query is required", 400);
  }

  let results: unknown[] = [];
  let searchError: string | null = null;

  try {
    // ---- KEYWORD SEARCH ----
    if (type === "keyword") {
      const { data, error } = await supabase.rpc("search_papers_keyword", {
        query_text: query,
        match_count: matchCount,
        min_year: minYear,
        max_year: maxYear,
      });
      if (error) throw error;
      results = data || [];
      if (methodology) {
        results = results.filter(
          (r: any) => r.methodology === methodology
        );
      }
    }

    // ---- SEMANTIC SEARCH ----
    else if (type === "semantic") {
      const embedding = await getEmbedding(query);
      const { data, error } = await supabase.rpc("match_papers_small", {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.25,
        match_count: matchCount,
        min_year: minYear,
        max_year: maxYear,
      });
      if (error) throw error;
      results = data || [];
      if (methodology) {
        results = results.filter(
          (r: any) => r.methodology === methodology
        );
      }
    }

    // ---- HYBRID SEARCH (BM25 + Semantic) ----
    else if (type === "hybrid") {
      const embedding = await getEmbedding(query);

      // Run both searches in parallel
      const [bm25Res, semanticRes] = await Promise.all([
        supabase.rpc("search_papers_bm25", {
          query_text: query,
          match_count: matchCount,
          min_year: minYear,
          max_year: maxYear,
        }),
        supabase.rpc("match_papers_small", {
          query_embedding: JSON.stringify(embedding),
          match_threshold: 0.25,
          match_count: matchCount,
          min_year: minYear,
          max_year: maxYear,
        }),
      ]);

      if (bm25Res.error) throw bm25Res.error;
      if (semanticRes.error) throw semanticRes.error;

      const bm25Results = bm25Res.data || [];
      const semanticResults = semanticRes.data || [];

      // Reciprocal Rank Fusion (k=60)
      const k = 60;
      const scores = new Map<string, { score: number; item: any }>();

      bm25Results.forEach((item: any, idx: number) => {
        const id = item.id;
        const entry = scores.get(id) || { score: 0, item };
        entry.score += 1 / (k + idx + 1);
        entry.item = item; // BM25 result as base
        scores.set(id, entry);
      });

      semanticResults.forEach((item: any, idx: number) => {
        const id = item.id;
        const entry = scores.get(id) || { score: 0, item };
        entry.score += 1 / (k + idx + 1);
        // Preserve semantic similarity score
        if (item.similarity) {
          entry.item.semantic_similarity = item.similarity;
        }
        // If we don't have authors from BM25, use semantic result
        if (!entry.item.authors && item.authors) {
          entry.item = { ...entry.item, ...item };
        }
        scores.set(id, entry);
      });

      results = Array.from(scores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, matchCount)
        .map((e) => ({ ...e.item, rrf_score: e.score }));

      if (methodology) {
        results = results.filter(
          (r: any) => r.methodology === methodology
        );
      }
    }

    // ---- AUTHOR SEARCH ----
    else if (type === "author") {
      const { data, error } = await supabase.rpc("search_authors_by_name", {
        query_text: query,
        match_count: matchCount,
      });
      if (error) throw error;
      results = data || [];
    }

    // ---- INSTITUTION SEARCH ----
    else if (type === "institution") {
      const { data, error } = await supabase.rpc(
        "search_papers_by_institution",
        {
          query_text: query,
          match_count: matchCount,
          min_year: minYear,
          max_year: maxYear,
        }
      );
      if (error) throw error;
      results = data || [];
      if (methodology) {
        results = results.filter(
          (r: any) => r.methodology === methodology
        );
      }
    }

    // ---- AUTHOR PAPERS (expand author card) ----
    else if (type === "author_papers") {
      const authorId = body.author_id as number;
      if (!authorId) return errorResponse("author_id is required", 400);
      const { data, error } = await supabase
        .from("paper_authors")
        .select("paper_id, papers!inner(id, title, year, abstract, format, methodology, original_paper_id)")
        .eq("canonical_author_id", authorId)
        .order("year", { foreignTable: "papers", ascending: false });
      if (error) throw error;
      results = (data || []).map((row: any) => {
        const p = row.papers;
        return {
          id: p.id,
          title: p.title,
          year: p.year,
          abstract: p.abstract,
          format: p.format,
          methodology: p.methodology,
          confex_url: p.original_paper_id
            ? `https://sswr.confex.com/sswr/${p.year}/webprogram/Paper${p.original_paper_id}.html`
            : null,
        };
      });
    }

    // ---- INSTITUTION AUTOCOMPLETE ----
    else if (type === "autocomplete") {
      const prefix = (body.query as string || "").trim();
      if (prefix.length < 2) {
        return jsonResponse({ results: [] });
      }
      const { data, error } = await supabase.rpc(
        "autocomplete_institutions",
        { prefix, limit_count: 10 }
      );
      if (error) throw error;
      return jsonResponse({ results: data || [] });
    } else {
      return errorResponse("Invalid search type", 400);
    }
  } catch (err: any) {
    console.error("Search error:", err);
    searchError = err.message || "Search failed";
    if (err.message?.includes("OpenRouter") || err.message?.includes("embedding")) {
      return errorResponse(
        "Semantic search is temporarily unavailable. Try keyword or author search.",
        502
      );
    }
    return errorResponse("Search encountered an error. Please try again.", 500);
  }

  // ---- Enrich results with Confex links and canonical institutions ----
  if (results.length > 0 && type !== "author") {
    const ids = results.map((r: any) => r.id).filter(Boolean);
    if (ids.length > 0) {
      // Fetch paper metadata and canonical author institutions in parallel
      const [metaRes, authRes] = await Promise.all([
        supabase
          .from("papers")
          .select("id, original_paper_id, year, format")
          .in("id", ids),
        supabase
          .from("paper_authors")
          .select("paper_id, author_order, name, institution_normalized")
          .in("paper_id", ids)
          .order("author_order", { ascending: true }),
      ]);

      if (metaRes.data) {
        const metaMap = new Map(metaRes.data.map((p: any) => [p.id, p]));
        results = results.map((r: any) => {
          const meta = metaMap.get(r.id);
          if (meta) {
            if (meta.original_paper_id) {
              r.confex_url = `https://sswr.confex.com/sswr/${meta.year}/webprogram/Paper${meta.original_paper_id}.html`;
            }
            if (!r.format && meta.format) {
              r.format = meta.format;
            }
          }
          return r;
        });
      }

      // Replace author institutions with canonical versions
      if (authRes.data) {
        const authMap = new Map<string, any[]>();
        for (const a of authRes.data) {
          if (!authMap.has(a.paper_id)) authMap.set(a.paper_id, []);
          authMap.get(a.paper_id)!.push(a);
        }
        results = results.map((r: any) => {
          const canonical = authMap.get(r.id);
          if (canonical && r.authors) {
            r.authors = canonical.map((ca: any) => ({
              name: ca.name,
              institution: ca.institution_normalized,
              rank: ca.author_order,
            }));
          }
          return r;
        });
      }
    }
  }

  // ---- LOG SEARCH (fire-and-forget) ----
  const durationMs = Date.now() - startTime;
  supabase
    .from("search_logs")
    .insert({
      search_type: type,
      query_text: query,
      filters: { min_year: minYear, max_year: maxYear, methodology },
      results_count: results.length,
      session_hash: await hashString(sessionToken),
      duration_ms: durationMs,
    })
    .then(() => {})
    .catch((e: any) => console.error("Log insert error:", e));

  return jsonResponse({ results, count: results.length });
});
