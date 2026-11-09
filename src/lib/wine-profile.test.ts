import assert from "node:assert/strict";
import test from "node:test";
import {
  cachedWineProfile,
  interpretWineDetail,
  vintagesMatch,
} from "./wine-profile.ts";

const populated = {
  id: "7b726d74-e63d-4694-bf22-75bf66c71ed0",
  name: "Barolo",
  vintage: 2018,
  body: "full",
  acidity: "high",
  description: "Tar and roses.",
  classification: "DOCG",
  appellation: "Barolo",
  alcoholContent: 14.5,
  grapes: [{ name: "Nebbiolo" }, { name: "" }],
  imageUrl: "https://example.com/label.jpg",
  pairings: [
    { food: "Braiseret okse", notes: "Tanninerne møder fedtet.", confidence: 0.8 },
    { food: "   ", notes: "tom" },
  ],
  scores: [
    { reviewer: "Wine Spectator", score: 94, scoreText: "94", reviewDate: "2024-01-02" },
    { reviewer: " ", score: 90 },
  ],
  prices: [
    {
      merchantName: "Vinhandlen",
      price: 420,
      currency: "DKK",
      fetchedAt: "2026-01-15T00:00:00.000Z",
    },
    { merchantName: "Uden dato", price: 10, currency: "EUR" },
    { merchantName: "Uden valuta", price: 10, fetchedAt: "2026-01-01T00:00:00.000Z" },
  ],
};

test("matching vintage keeps sourced facts and drops empty or unclear ones", () => {
  const result = interpretWineDetail(populated, 2018);
  assert.equal(result.reason, "ready");
  assert.equal(result.profile?.description, "Tar and roses.");
  assert.equal(result.profile?.body, "full");
  assert.equal(result.profile?.acidity, "high");
  assert.equal(result.profile?.grapes, "Nebbiolo");
  assert.equal(result.profile?.alcohol, "14.5 %");
  assert.equal(result.profile?.appellation, "Barolo");
  assert.equal(result.profile?.classification, "DOCG");
  assert.equal(result.profile?.imageUrl, "https://example.com/label.jpg");
  assert.deepEqual(result.profile?.pairings, [
    { food: "Braiseret okse", notes: "Tanninerne møder fedtet.", confidence: 0.8 },
  ]);
  assert.deepEqual(result.profile?.scores, [
    { reviewer: "Wine Spectator", scoreText: "94", reviewDate: "2024-01-02" },
  ]);
  assert.equal(result.profile?.scores?.[0].scoreText?.includes("/"), false);
  assert.deepEqual(result.profile?.prices, [
    {
      merchant: "Vinhandlen",
      price: "420",
      currency: "DKK",
      fetchedAt: "2026-01-15T00:00:00.000Z",
    },
  ]);
});

test("a different vintage is not attached", () => {
  const result = interpretWineDetail(populated, 2016);
  assert.equal(result.reason, "vintage_mismatch");
  assert.equal(result.profile, undefined);
});

test("missing detail vintage is not treated as the bottle vintage", () => {
  const result = interpretWineDetail({ ...populated, vintage: null }, 2018);
  assert.equal(result.reason, "vintage_mismatch");
});

test("two missing vintages still match", () => {
  const result = interpretWineDetail({ ...populated, vintage: null }, undefined);
  assert.equal(result.reason, "ready");
  assert.equal(result.profile?.vintage, null);
});

test("empty and malformed payloads produce no facts", () => {
  assert.equal(interpretWineDetail(null, 2018).reason, "malformed");
  assert.equal(interpretWineDetail("barolo", 2018).reason, "malformed");
  assert.equal(interpretWineDetail({ vintage: 2018, body: 4, description: "  " }, 2018).reason, "ready");
  const loose = interpretWineDetail({ vintage: 2018, body: 4, description: "  " }, 2018);
  assert.equal(loose.profile?.body, "4");
  assert.equal(loose.profile?.description, undefined);
  assert.equal(interpretWineDetail({ vintage: 2018 }, 2018).profile, undefined);
});

test("cached profile is reused only for the same wine and vintage", () => {
  const profile = interpretWineDetail(populated, 2018).profile!;
  const bottles = [
    { externalWineId: populated.id, vintage: 2018, wineProfile: profile },
    { externalWineId: populated.id, vintage: 2015, wineProfile: profile },
  ];
  assert.equal(cachedWineProfile(bottles, populated.id, 2018)?.description, "Tar and roses.");
  assert.equal(cachedWineProfile(bottles, populated.id, 2015), undefined);
  assert.equal(cachedWineProfile(bottles, "other", 2018), undefined);
});

test("vintage comparison does not coerce different values", () => {
  assert.equal(vintagesMatch(2018, 2018), true);
  assert.equal(vintagesMatch(undefined, undefined), true);
  assert.equal(vintagesMatch(2018, null), false);
  assert.equal(vintagesMatch(2018, 2019), false);
});
