import type { WineSuggestion } from "@/lib/types";
import { suggestDrinkWindow } from "@/lib/drink-window";
import { mapWineType } from "@/lib/wine-types";

type WineApiWine = {
  id?: string;
  name?: string;
  vintage?: number | null;
  type?: string | null;
  winery?: string | { id?: string; name?: string } | null;
  region?: string | { id?: string; name?: string; country?: string } | null;
  country?: string | null;
  grapes?: Array<{ name?: string }> | null;
  confidence?: number | null;
};

function wineryName(w: WineApiWine["winery"]) {
  if (!w) return undefined;
  if (typeof w === "string") return w;
  return w.name || undefined;
}

function regionName(r: WineApiWine["region"]) {
  if (!r) return undefined;
  if (typeof r === "string") return r;
  return r.name || undefined;
}

function regionCountry(r: WineApiWine["region"], fallback?: string | null) {
  if (r && typeof r === "object" && r.country) return r.country;
  return fallback || undefined;
}

export function mapWineApiResult(wine: WineApiWine, confidence?: number | null): WineSuggestion {
  const wineType = mapWineType(wine.type);
  const vintage = wine.vintage ?? undefined;
  const window = suggestDrinkWindow({ vintage, wineType });
  return {
    name: wine.name?.trim() || "Ukendt vin",
    producer: wineryName(wine.winery),
    vintage,
    wineType,
    region: regionName(wine.region),
    country: regionCountry(wine.region, wine.country),
    grapes: wine.grapes?.map((g) => g.name).filter(Boolean).join(", ") || undefined,
    externalWineId: wine.id,
    confidence: confidence ?? wine.confidence ?? undefined,
    drinkFrom: window.drinkFrom,
    drinkBestBy: window.drinkBestBy,
  };
}

export async function identifyWineImage(file: Blob): Promise<{
  suggestion: WineSuggestion | null;
  suggestions: WineSuggestion[];
  raw: unknown;
}> {
  const key = process.env.WINEAPI_API_KEY;
  if (!key) {
    return { suggestion: null, suggestions: [], raw: null };
  }

  const form = new FormData();
  form.append("image", file, "label.jpg");

  const res = await fetch("https://api.wineapi.io/identify/image", {
    method: "POST",
    headers: { "X-API-Key": key },
    body: form,
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      typeof raw === "object" && raw && "error" in raw
        ? String((raw as { error: string }).error)
        : `WineAPI fejl (${res.status})`,
    );
  }

  const payload = raw as {
    confidence?: number;
    wine?: WineApiWine | null;
    suggestions?: WineApiWine[];
  };

  const suggestions = (payload.suggestions ?? [])
    .filter(Boolean)
    .map((w) => mapWineApiResult(w));

  const top =
    payload.wine != null
      ? mapWineApiResult(payload.wine, payload.confidence)
      : suggestions[0] ?? null;

  return { suggestion: top, suggestions, raw };
}

export async function searchWines(query: string): Promise<WineSuggestion[]> {
  const key = process.env.WINEAPI_API_KEY;
  if (!key || !query.trim()) return [];

  const url = new URL("https://api.wineapi.io/wines/search");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("limit", "8");

  const res = await fetch(url, { headers: { "X-API-Key": key } });
  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      typeof raw === "object" && raw && "error" in raw
        ? String((raw as { error: string }).error)
        : `WineAPI søgning fejlede (${res.status})`,
    );
  }

  const results = (raw as { results?: WineApiWine[] }).results ?? [];
  return results.map((w) => mapWineApiResult(w));
}
