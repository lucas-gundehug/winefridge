import assert from "node:assert/strict";
import test from "node:test";
import {
  drinkingPeriodNumbers,
  geminiEnabled,
  grapemindsEnabled,
  offSuggestion,
  yearsAfterVintage,
} from "./scan-sources.ts";

test("a barcode product never becomes a confirmed vintage", () => {
  const suggestion = offSuggestion(
    { product_name: "Barolo 2018", brands: "Produsent" },
    "8001234567890",
  );
  assert.equal(suggestion?.vintageUnconfirmed, true);
  assert.equal("vintage" in (suggestion ?? {}), false);
  assert.equal(suggestion?.attribution, "Open Food Facts");
  assert.equal(offSuggestion({ product_name: "  " }, "1"), null);
});

test("documented offsets are years after the vintage", () => {
  assert.deepEqual(yearsAfterVintage(5, 20, 2020), {
    ok: true,
    fromOffset: 5,
    toOffset: 20,
    fromYear: 2025,
    toYear: 2040,
  });
});

test("sanitized live numbers use to 25 and drop restricted text", () => {
  const payload = {
    id: 21461,
    wine_id: 9146,
    lang: "da",
    from: 5,
    to: 25,
    statement: "restricted",
    young: "restricted",
    ripe: "restricted",
    storage: "restricted",
  };
  const numbers = drinkingPeriodNumbers(payload);
  assert.deepEqual(numbers, { id: 21461, wineId: 9146, lang: "da", from: 5, to: 25 });
  assert.equal(JSON.stringify(numbers).includes("restricted"), false);
  // 2020 is a hypothetical vintage used to check the arithmetic. Wine 9146 did not include one.
  assert.deepEqual(yearsAfterVintage(numbers!.from, numbers!.to, 2020), {
    ok: true,
    fromOffset: 5,
    toOffset: 25,
    fromYear: 2025,
    toYear: 2045,
  });
  assert.equal(yearsAfterVintage(numbers!.from, numbers!.to).ok, true);
  assert.equal("fromYear" in yearsAfterVintage(numbers!.from, numbers!.to), false);
});

test("calendar-like GrapeMinds numbers are rejected", () => {
  assert.equal(yearsAfterVintage(2020, 2035, 2018).ok, false);
  assert.deepEqual(yearsAfterVintage(5, 2025, 2020), { ok: false, reason: "absolute_year" });
  assert.equal(yearsAfterVintage(-1, 5, 2020).ok, false);
  assert.equal(yearsAfterVintage(8, 3, 2020).ok, false);
});

test("Gemini needs a key and GrapeMinds stays off until the licence is confirmed", () => {
  assert.equal(geminiEnabled({}), false);
  assert.equal(geminiEnabled({ GEMINI_API_KEY: "  " }), false);
  assert.equal(geminiEnabled({ GEMINI_API_KEY: "present" }), true);
  assert.equal(grapemindsEnabled({}), false);
  assert.equal(grapemindsEnabled({ GRAPEMINDS_API_KEY: "present" }), false);
});
