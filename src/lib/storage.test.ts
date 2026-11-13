import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { loadBottles } from "./storage.ts";

const BOTTLES_KEY = "winefridge.bottles.v1";
const SEEDED_KEY = "winefridge.samples.seeded.v3";

function installStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const localStorage = {
    getItem(key: string) {
      return data.has(key) ? (data.get(key) ?? null) : null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });
  return {
    snapshot() {
      return Object.fromEntries(data);
    },
  };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

test("a first visit adds nothing to localStorage", () => {
  const storage = installStorage();
  assert.deepEqual(loadBottles(), []);
  assert.deepEqual(storage.snapshot(), {});
});

test("saved bottles stay byte-for-byte in localStorage", () => {
  const raw = JSON.stringify([
    {
      id: "kept-1",
      name: "Egen Barolo",
      quantity: 2,
      status: "in_fridge",
      addedAt: "2026-01-01",
      notes: "ikke et eksempel",
    },
  ]);
  const storage = installStorage({ [BOTTLES_KEY]: raw, [SEEDED_KEY]: "1" });
  const loaded = loadBottles();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0]?.name, "Egen Barolo");
  assert.equal(loaded[0]?.quantity, 2);
  assert.deepEqual(storage.snapshot(), { [BOTTLES_KEY]: raw, [SEEDED_KEY]: "1" });
});

test("an emptied cabinet is not filled with examples", () => {
  const storage = installStorage({ [BOTTLES_KEY]: "[]" });
  assert.deepEqual(loadBottles(), []);
  assert.deepEqual(storage.snapshot(), { [BOTTLES_KEY]: "[]" });
});
