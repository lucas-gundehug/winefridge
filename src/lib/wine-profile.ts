export type WinePairingFact = {
  food: string;
  notes?: string;
  confidence?: number;
};

export type WineScoreFact = {
  reviewer: string;
  scoreText?: string;
  reviewDate?: string;
};

export type WinePriceFact = {
  merchant: string;
  price: string;
  currency: string;
  fetchedAt: string;
};

/** Facts copied from one WineAPI wine record. Dates are not included. */
export type WineProfile = {
  source: "wineapi";
  externalWineId: string;
  vintage: number | null;
  description?: string;
  body?: string;
  acidity?: string;
  grapes?: string;
  alcohol?: string;
  appellation?: string;
  classification?: string;
  imageUrl?: string;
  pairings?: WinePairingFact[];
  scores?: WineScoreFact[];
  prices?: WinePriceFact[];
};

export type WineDetailResult = {
  reason: "ready" | "empty" | "vintage_mismatch" | "malformed";
  profile?: WineProfile;
};

type CacheBottle = {
  externalWineId?: string;
  vintage?: number;
  wineProfile?: WineProfile;
};

export function vintagesMatch(
  left: number | null | undefined,
  right: number | null | undefined,
): boolean {
  const a = left ?? null;
  const b = right ?? null;
  if (a === null && b === null) return true;
  if (typeof a === "number" && typeof b === "number") return a === b;
  return false;
}

function text(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function httpUrl(value: unknown): string | undefined {
  const url = text(value);
  if (!url || !/^https:\/\//i.test(url)) return undefined;
  return url;
}

export function interpretWineDetail(raw: unknown, expectedVintage?: number): WineDetailResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { reason: "malformed" };
  const wine = raw as Record<string, unknown>;
  const id = text(wine.id) ?? "";

  const vintage = typeof wine.vintage === "number" && Number.isFinite(wine.vintage) ? wine.vintage : null;
  if (!vintagesMatch(expectedVintage, vintage)) return { reason: "vintage_mismatch" };

  const grapes = Array.isArray(wine.grapes)
    ? wine.grapes
        .map((grape) =>
          grape && typeof grape === "object" ? text((grape as { name?: unknown }).name) : undefined,
        )
        .filter((name): name is string => Boolean(name))
        .join(", ") || undefined
    : undefined;

  const alcoholNumber =
    typeof wine.alcoholContent === "number" && Number.isFinite(wine.alcoholContent)
      ? wine.alcoholContent
      : undefined;
  const alcohol = alcoholNumber !== undefined ? `${alcoholNumber} %` : text(wine.alcoholContent);

  const pairings = Array.isArray(wine.pairings)
    ? wine.pairings.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const food = text((item as { food?: unknown }).food);
        if (!food) return [];
        const notes = text((item as { notes?: unknown }).notes);
        const confidence = (item as { confidence?: unknown }).confidence;
        return [
          {
            food,
            ...(notes ? { notes } : {}),
            ...(typeof confidence === "number" && Number.isFinite(confidence) ? { confidence } : {}),
          },
        ];
      })
    : [];

  const scores = Array.isArray(wine.scores)
    ? wine.scores.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const reviewer = text((item as { reviewer?: unknown }).reviewer);
        if (!reviewer) return [];
        const scoreText =
          text((item as { scoreText?: unknown }).scoreText) ??
          text((item as { score?: unknown }).score);
        const reviewDate = text((item as { reviewDate?: unknown }).reviewDate);
        if (!scoreText && !reviewDate) return [];
        return [
          {
            reviewer,
            ...(scoreText ? { scoreText } : {}),
            ...(reviewDate ? { reviewDate } : {}),
          },
        ];
      })
    : [];

  const prices = Array.isArray(wine.prices)
    ? wine.prices.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const merchant = text((item as { merchantName?: unknown }).merchantName);
        const currency = text((item as { currency?: unknown }).currency);
        const fetchedAt = text((item as { fetchedAt?: unknown }).fetchedAt);
        const price = (item as { price?: unknown }).price;
        if (!merchant || !currency || !fetchedAt || typeof price !== "number" || !Number.isFinite(price)) {
          return [];
        }
        if (Number.isNaN(Date.parse(fetchedAt))) return [];
        return [{ merchant, currency, fetchedAt, price: String(price) }];
      })
    : [];

  const profile: WineProfile = {
    source: "wineapi",
    externalWineId: id,
    vintage,
    ...(text(wine.description) ? { description: text(wine.description) } : {}),
    ...(text(wine.body) ? { body: text(wine.body) } : {}),
    ...(text(wine.acidity) ? { acidity: text(wine.acidity) } : {}),
    ...(grapes ? { grapes } : {}),
    ...(alcohol ? { alcohol } : {}),
    ...(text(wine.appellation) ? { appellation: text(wine.appellation) } : {}),
    ...(text(wine.classification) ? { classification: text(wine.classification) } : {}),
    ...(httpUrl(wine.imageUrl) ? { imageUrl: httpUrl(wine.imageUrl) } : {}),
    ...(pairings.length ? { pairings } : {}),
    ...(scores.length ? { scores } : {}),
    ...(prices.length ? { prices } : {}),
  };

  const hasFact = Object.keys(profile).some(
    (key) => !["source", "externalWineId", "vintage"].includes(key),
  );
  if (!hasFact) return { reason: "empty" };
  return { reason: "ready", profile };
}

export function cachedWineProfile(
  bottles: CacheBottle[],
  externalWineId: string,
  vintage: number | undefined,
): WineProfile | undefined {
  return bottles.find((bottle) => {
    const profile = bottle.wineProfile;
    return (
      bottle.externalWineId === externalWineId &&
      profile?.source === "wineapi" &&
      vintagesMatch(bottle.vintage, vintage) &&
      vintagesMatch(profile.vintage, vintage)
    );
  })?.wineProfile;
}
