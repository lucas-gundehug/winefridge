import type { Bottle } from "@/lib/types";

const STORAGE_KEY = "winefridge.bottles.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeBottle(raw: Bottle): Bottle {
  const quantity = Math.max(1, Number(raw.quantity) || 1);
  return { ...raw, quantity };
}

export function loadBottles(): Bottle[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bottle[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeBottle);
  } catch {
    return [];
  }
}

export function saveBottles(bottles: Bottle[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bottles.map(normalizeBottle)));
}

export function upsertBottle(bottle: Bottle) {
  const bottles = loadBottles();
  const nextBottle = normalizeBottle(bottle);
  const index = bottles.findIndex((b) => b.id === nextBottle.id);
  if (index >= 0) bottles[index] = nextBottle;
  else bottles.unshift(nextBottle);
  saveBottles(bottles);
  return bottles;
}

export function getBottle(id: string) {
  return loadBottles().find((b) => b.id === id);
}

/** Remove one or more bottles from a fridge entry. */
export function removeBottleFromFridge(id: string, count = 1) {
  const bottles = loadBottles();
  const next = bottles.flatMap((b) => {
    if (b.id !== id) return [b];
    const qty = Math.max(1, b.quantity || 1);
    const take = Math.min(Math.max(1, count), qty);
    const remaining = qty - take;
    if (remaining > 0) {
      return [{ ...b, quantity: remaining }];
    }
    return [
      {
        ...b,
        quantity: take,
        status: "removed" as const,
        removedAt: new Date().toISOString().slice(0, 10),
      },
    ];
  });
  saveBottles(next);
  return next;
}

export function totalBottleCount(bottles: Bottle[]) {
  return bottles.reduce((sum, b) => sum + Math.max(1, b.quantity || 1), 0);
}
