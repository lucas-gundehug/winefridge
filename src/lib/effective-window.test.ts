import assert from "node:assert/strict";
import test from "node:test";
import { effectiveDrinkWindow } from "./effective-window.ts";

const grape = { fromYear: 2025, toYear: 2045, vintage: 2020 };

test("a partial manual date stays ahead of a GrapeMinds window", () => {
  const result = effectiveDrinkWindow({
    drinkFrom: "2026-01-01",
    provenance: "manual",
    vintage: 2020,
    grape,
  });
  assert.equal(result.source, "manual");
  assert.equal(result.drinkFrom, "2026-01-01");
  assert.equal(result.drinkBestBy, undefined);
});

test("a matched window for the confirmed vintage replaces the type estimate", () => {
  const result = effectiveDrinkWindow({
    drinkFrom: "2021-01-01",
    drinkBestBy: "2028-12-31",
    provenance: "estimate",
    vintage: 2020,
    grape,
  });
  assert.equal(result.source, "grapeminds");
  assert.equal(result.drinkFrom, "2025-01-01");
  assert.equal(result.drinkBestBy, "2045-12-31");
});

test("the wrong vintage, a missing vintage and a failed window do not become the source", () => {
  assert.equal(
    effectiveDrinkWindow({
      drinkFrom: "2021-01-01",
      drinkBestBy: "2028-12-31",
      provenance: "estimate",
      vintage: 2018,
      grape,
    }).source,
    "estimate",
  );
  assert.equal(
    effectiveDrinkWindow({
      provenance: "estimate",
      grape,
    }).source,
    "unavailable",
  );
  assert.equal(
    effectiveDrinkWindow({
      drinkFrom: "2021-01-01",
      drinkBestBy: "2028-12-31",
      provenance: "estimate",
      vintage: 2020,
      grape: null,
    }).source,
    "estimate",
  );
});

test("dates without a recorded origin are not replaced", () => {
  const result = effectiveDrinkWindow({
    drinkFrom: "2026-01-01",
    drinkBestBy: "2034-12-31",
    vintage: 2020,
    grape,
  });
  assert.equal(result.source, "stored");
  assert.equal(result.drinkFrom, "2026-01-01");
  assert.equal(result.drinkBestBy, "2034-12-31");
});
