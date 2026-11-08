import assert from "node:assert/strict";
import test from "node:test";
import { bottleLabelCopy, bottleShape, groupShelfRows, shelfReadinessLine } from "./shelf.ts";

test("shelf rows follow the bottles and do not add empty rows", () => {
  assert.deepEqual(groupShelfRows([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(groupShelfRows([], 2), []);
  assert.deepEqual(groupShelfRows(["a"], 2), [["a"]]);
});

test("readiness uses the real window and stays short", () => {
  const now = new Date(2026, 10, 8);
  assert.equal(
    shelfReadinessLine({ drinkFrom: "2020-01-01", drinkBestBy: "2034-12-31" }, now),
    "bedst til 2034",
  );
  assert.equal(
    shelfReadinessLine({ drinkFrom: "2020-01-01", drinkBestBy: "2026-12-01" }, now),
    "drik snart",
  );
  assert.equal(
    shelfReadinessLine({ drinkFrom: "2028-01-01", drinkBestBy: "2034-12-31" }, now),
    "vent til 2028",
  );
  assert.equal(
    shelfReadinessLine({ drinkFrom: "2010-01-01", drinkBestBy: "2020-12-31" }, now),
    "forbi 2020",
  );
  assert.equal(shelfReadinessLine({}, now), "vindue ukendt");
});

test("label copy only repeats the wine's own name and year", () => {
  const copy = bottleLabelCopy("Barolo Cannubi Riserva", 2018);
  assert.deepEqual(copy.lines, ["Barolo Cannubi", "Riserva"]);
  assert.equal(copy.year, "2018");
  const shown = copy.lines.join(" ").replaceAll("…", "");
  for (const word of shown.split(" ")) {
    assert.ok("Barolo Cannubi Riserva".includes(word), word);
  }
  assert.equal(bottleLabelCopy("Barolo Cannubi", undefined).year, null);
  assert.equal(bottleLabelCopy("   ", 2019).lines.length, 0);
});

test("bottle shape follows wine type and invents no extra styles", () => {
  assert.equal(bottleShape("rød"), "bordeaux");
  assert.equal(bottleShape("hvid"), "burgundy");
  assert.equal(bottleShape("rosé"), "burgundy");
  assert.equal(bottleShape("orange"), "burgundy");
  assert.equal(bottleShape("mousserende"), "champagne");
  assert.equal(bottleShape("portvin"), "port");
  assert.equal(bottleShape("madeira"), "port");
  assert.equal(bottleShape("sherry"), "sherry");
  assert.equal(bottleShape("dessert"), "bordeaux");
  assert.equal(bottleShape(undefined), "bordeaux");
});
