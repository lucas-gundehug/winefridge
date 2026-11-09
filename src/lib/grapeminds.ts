import { drinkingPeriodNumbers, yearsAfterVintage } from "./scan-sources.ts";

const STOP = new Set([
  "weingut",
  "domaine",
  "domainede",
  "chateau",
  "casa",
  "tenuta",
  "cantina",
  "azienda",
  "doc",
  "docg",
  "doca",
  "aoc",
  "aop",
  "igt",
  "the",
  "and",
  "und",
  "von",
  "van",
  "del",
  "della",
  "dos",
  "das",
  "les",
]);

export type GrapeCandidate = {
  id: number;
  display_name?: string | null;
  producer_name?: string | null;
  producer_display_name?: string | null;
};

export type GrapeIdentity = {
  wineId: number;
  displayName: string;
  producer: string;
};

export type GrapeMatch =
  | { status: "match"; identity: GrapeIdentity }
  | { status: "ambiguous"; choices: GrapeIdentity[] }
  | { status: "unavailable" };

export type SavedDrinkDates = {
  drinkFrom?: string;
  drinkBestBy?: string;
  source: "manual" | "estimate";
};

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return fold(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP.has(token) && !/^\d{4}$/.test(token));
}

function covers(required: string[], haystack: string[]) {
  return required.every((token) => haystack.includes(token));
}

function identityOf(candidate: GrapeCandidate): GrapeIdentity {
  const producer = candidate.producer_display_name?.trim() || candidate.producer_name?.trim() || "";
  return {
    wineId: candidate.id,
    displayName: candidate.display_name?.trim() || "",
    producer,
  };
}

/**
 * WineAPI's id is not a GrapeMinds id. A match requires the producer and the cuvée,
 * and a more specific cuvée is not selected on its own.
 */
export function matchGrapemindsWines(
  query: { producer?: string; name: string },
  candidates: GrapeCandidate[],
): GrapeMatch {
  const nameTokens = tokens(query.name);
  const producerTokens = tokens(query.producer ?? "");
  const usable = candidates.filter((candidate) => Number.isInteger(candidate.id) && candidate.id > 0);
  if (!nameTokens.length || !usable.length) return { status: "unavailable" };

  const sameProducer = producerTokens.length
    ? usable.filter((candidate) =>
        covers(producerTokens, tokens(`${candidate.producer_name ?? ""} ${candidate.producer_display_name ?? ""}`)),
      )
    : [];
  const pool = producerTokens.length ? sameProducer : usable;
  const strict = pool.filter((candidate) => {
    const displayTokens = tokens(candidate.display_name ?? "");
    const producer = tokens(`${candidate.producer_name ?? ""} ${candidate.producer_display_name ?? ""}`);
    const cuvee = displayTokens.filter((token) => !producer.includes(token));
    return covers(nameTokens, displayTokens) && covers(cuvee, nameTokens);
  });

  if (producerTokens.length && strict.length === 1) {
    return { status: "match", identity: identityOf(strict[0]) };
  }
  const choicePool =
    strict.length > 1
      ? strict
      : producerTokens.length
        ? pool
        : usable.filter((candidate) => covers(nameTokens, tokens(candidate.display_name ?? "")));
  const choices = choicePool
    .slice(0, 5)
    .map(identityOf)
    .filter((choice) => choice.displayName);
  if (!choices.length) return { status: "unavailable" };
  return { status: "ambiguous", choices };
}

export function grapeSearchQuery(producer?: string, name?: string) {
  const query = [producer, name]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  if (query.length < 3 || query.length > 255) return null;
  return query;
}

/** 401, 402 and 429 stop the provider. Other failures stay non-blocking. */
export function grapeHttpOutcome(status: number): "stopped" | "missing" | "ok" | "unavailable" {
  if (status === 401 || status === 402 || status === 429) return "stopped";
  if (status === 404) return "missing";
  if (status >= 200 && status < 300) return "ok";
  return "unavailable";
}

export type PublicGrapeWindow = {
  enabled: true;
  status: "ready" | "unavailable";
  identity: GrapeIdentity;
  scope: "wine";
  label: "GrapeMinds-skøn";
  fromOffset?: number;
  toOffset?: number;
  fromYear?: number;
  toYear?: number;
};

/** Numeric window only. statement, young, ripe and storage never leave this function. */
export function publicGrapeWindow(
  payload: unknown,
  vintage: number | undefined,
  identity: GrapeIdentity,
): PublicGrapeWindow {
  const numbers = drinkingPeriodNumbers(payload);
  const base = {
    enabled: true as const,
    identity,
    scope: "wine" as const,
    label: "GrapeMinds-skøn" as const,
  };
  if (!numbers) return { ...base, status: "unavailable" };
  const window = yearsAfterVintage(numbers.from, numbers.to, vintage);
  if (!window.ok) return { ...base, status: "unavailable" };
  return {
    ...base,
    status: "ready",
    fromOffset: window.fromOffset,
    toOffset: window.toOffset,
    ...(window.fromYear !== undefined && window.toYear !== undefined
      ? { fromYear: window.fromYear, toYear: window.toYear }
      : {}),
  };
}

/**
 * Saved dates are the user's dates or the local type estimate.
 * A GrapeMinds window is not an input, so it cannot be written here.
 */
export function savedDrinkDates(input: {
  drinkFrom: string;
  drinkBestBy: string;
  edited: boolean;
  fallback?: { drinkFrom?: string; drinkBestBy?: string };
}): SavedDrinkDates {
  if (input.edited || input.drinkFrom || input.drinkBestBy) {
    return {
      ...(input.drinkFrom ? { drinkFrom: input.drinkFrom } : {}),
      ...(input.drinkBestBy ? { drinkBestBy: input.drinkBestBy } : {}),
      source: input.edited ? "manual" : "estimate",
    };
  }
  return {
    ...(input.fallback?.drinkFrom ? { drinkFrom: input.fallback.drinkFrom } : {}),
    ...(input.fallback?.drinkBestBy ? { drinkBestBy: input.fallback.drinkBestBy } : {}),
    source: "estimate",
  };
}
