import assert from "node:assert/strict";
import test from "node:test";
import {
  grapeHttpOutcome,
  grapeSearchQuery,
  matchGrapemindsWines,
  publicGrapeWindow,
  savedDrinkDates,
} from "./grapeminds.ts";

const chiaro = {
  id: 10,
  display_name: "Barolo DOCG",
  producer_name: "Michele Chiarlo",
  producer_display_name: "Michele Chiarlo",
};
const cannubi = {
  id: 11,
  display_name: "Barolo Cannubi",
  producer_name: "Michele Chiarlo",
  producer_display_name: "Michele Chiarlo",
};

test("an exact producer and cuvée matches, and a more specific cuvée does not", () => {
  const exact = matchGrapemindsWines({ producer: "Michele Chiarlo", name: "Barolo" }, [chiaro, cannubi]);
  assert.equal(exact.status, "match");
  if (exact.status === "match") assert.equal(exact.identity.wineId, 10);

  const specific = matchGrapemindsWines({ producer: "Michele Chiarlo", name: "Barolo Cannubi" }, [chiaro]);
  assert.equal(specific.status, "ambiguous");
  if (specific.status === "ambiguous") assert.equal(specific.choices[0]?.wineId, 10);
});

test("two credible wines stay a choice, and a different producer is not used", () => {
  const ambiguous = matchGrapemindsWines({ producer: "Michele Chiarlo", name: "Barolo" }, [
    chiaro,
    { ...chiaro, id: 12, display_name: "Barolo" },
  ]);
  assert.equal(ambiguous.status, "ambiguous");

  const other = matchGrapemindsWines({ producer: "Michele Chiarlo", name: "Barolo" }, [
    { id: 9146, display_name: "Tignanello", producer_name: "Antinori", producer_display_name: "Antinori" },
  ]);
  assert.equal(other.status, "unavailable");
});

test("a missing producer is never an automatic match", () => {
  const result = matchGrapemindsWines({ name: "Barolo" }, [chiaro]);
  assert.equal(result.status, "ambiguous");
  assert.equal(grapeSearchQuery("  ", "Ba"), null);
  assert.equal(grapeSearchQuery("Michele Chiarlo", "Barolo"), "Michele Chiarlo Barolo");
});

test("the sanitized live offsets need a real vintage before they become years", () => {
  const payload = {
    id: 21461,
    wine_id: 88,
    lang: "da",
    from: 5,
    to: 25,
    statement: "restricted",
    young: "restricted",
    ripe: "restricted",
    storage: "restricted",
  };
  const identity = { wineId: 88, displayName: "Barolo DOCG", producer: "Michele Chiarlo" };
  const dated = publicGrapeWindow(payload, 2020, identity);
  assert.equal(dated.status, "ready");
  assert.equal(dated.fromYear, 2025);
  assert.equal(dated.toYear, 2045);
  assert.equal(JSON.stringify(dated).includes("restricted"), false);
  assert.equal("statement" in dated, false);

  const undated = publicGrapeWindow(payload, undefined, identity);
  assert.equal(undated.status, "ready");
  assert.equal(undated.fromOffset, 5);
  assert.equal(undated.toOffset, 25);
  assert.equal("fromYear" in undated, false);
});

test("calendar-like drinking numbers are not added to the vintage", () => {
  const result = publicGrapeWindow(
    { id: 1, wine_id: 2, lang: "da", from: 2020, to: 2035 },
    2018,
    { wineId: 2, displayName: "Barolo", producer: "Hus" },
  );
  assert.equal(result.status, "unavailable");
  assert.equal("fromYear" in result, false);
});

test("manual and partial dates stay, including when only one side is filled", () => {
  assert.deepEqual(
    savedDrinkDates({ drinkFrom: "2026-01-01", drinkBestBy: "", edited: true }),
    { drinkFrom: "2026-01-01", source: "manual" },
  );
  assert.deepEqual(
    savedDrinkDates({
      drinkFrom: "",
      drinkBestBy: "",
      edited: false,
      fallback: { drinkFrom: "2024-01-01", drinkBestBy: "2028-12-31" },
    }),
    { drinkFrom: "2024-01-01", drinkBestBy: "2028-12-31", source: "estimate" },
  );
});

test("401, 402 and 429 stop GrapeMinds", () => {
  assert.equal(grapeHttpOutcome(401), "stopped");
  assert.equal(grapeHttpOutcome(402), "stopped");
  assert.equal(grapeHttpOutcome(429), "stopped");
  assert.equal(grapeHttpOutcome(404), "missing");
  assert.equal(grapeHttpOutcome(200), "ok");
});
