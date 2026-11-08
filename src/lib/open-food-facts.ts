import { offSuggestion, type OffSuggestion } from "@/lib/scan-sources";

const cache = new Map<string, OffSuggestion | null>();

/** One product lookup. A 429 is not cached and must stop further calls. */
export async function lookupOpenFoodFacts(code: string, signal: AbortSignal): Promise<OffSuggestion | null> {
  if (cache.has(code)) return cache.get(code) ?? null;
  const res = await fetch(`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}.json`, {
    headers: { "User-Agent": "BossenWinefridge/1.0 (personal cellar)" },
    signal,
  });
  if (res.status === 429) {
    const error = new Error("Open Food Facts er midlertidigt brugt op.") as Error & { status?: number };
    error.status = 429;
    throw error;
  }
  if (!res.ok) return null;
  const body = (await res.json()) as { product?: { product_name?: string; brands?: string; code?: string } };
  const suggestion = offSuggestion(body.product, code);
  cache.set(code, suggestion);
  return suggestion;
}
