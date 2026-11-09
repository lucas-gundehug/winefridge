/** Open Food Facts product fields we are willing to show. Vintage is never taken as fact. */
export type OffProduct = {
  product_name?: string;
  brands?: string;
  code?: string;
};

export type OffSuggestion = {
  name: string;
  producer?: string;
  barcode: string;
  attribution: "Open Food Facts";
  vintageUnconfirmed: true;
};

export function offSuggestion(product: OffProduct | null | undefined, barcode: string): OffSuggestion | null {
  const name = product?.product_name?.trim();
  if (!name) return null;
  const producer = product?.brands?.split(",")[0]?.trim();
  return {
    name,
    ...(producer ? { producer } : {}),
    barcode,
    attribution: "Open Food Facts",
    vintageUnconfirmed: true,
  };
}

/**
 * from/to are years after the vintage.
 * Documented example: vintage 2020, from 5, to 20 → 2025–2040.
 * A sanitized live response for wine 9146 was from 5, to 25. That wine's vintage was not in the payload.
 * Numbers that look like calendar years are rejected instead of being added to the vintage.
 */
export function yearsAfterVintage(
  from: number,
  to: number,
  vintage?: number,
):
  | { ok: true; fromOffset: number; toOffset: number; fromYear?: number; toYear?: number }
  | { ok: false; reason: "malformed" | "absolute_year" } {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from) {
    return { ok: false, reason: "malformed" };
  }
  if (from >= 100 || to >= 100) return { ok: false, reason: "absolute_year" };
  const offsets = { ok: true as const, fromOffset: from, toOffset: to };
  if (vintage === undefined) return offsets;
  if (!Number.isInteger(vintage) || vintage < 1900 || vintage > 2100) {
    return { ok: false, reason: "malformed" };
  }
  return { ...offsets, fromYear: vintage + from, toYear: vintage + to };
}

/** Keep the numeric period. Drop statement, young, ripe and storage. */
export function drinkingPeriodNumbers(payload: unknown): {
  id: number;
  wineId: number;
  lang: string;
  from: number;
  to: number;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Record<string, unknown>;
  const { id, wine_id: wineId, lang, from, to } = row;
  if (
    typeof id !== "number" ||
    typeof wineId !== "number" ||
    typeof lang !== "string" ||
    typeof from !== "number" ||
    typeof to !== "number"
  ) {
    return null;
  }
  return { id, wineId, lang, from, to };
}

export function geminiEnabled(env: Record<string, string | undefined>): boolean {
  return Boolean(env.GEMINI_API_KEY?.trim());
}

/** True only when the server holds GRAPEMINDS_API_KEY. The value never reaches the browser. */
export function grapemindsEnabled(env: Record<string, string | undefined>): boolean {
  return Boolean(env.GRAPEMINDS_API_KEY?.trim());
}
