import type { Bottle } from "@/lib/types";

const STORAGE_KEY = "winefridge.bottles.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadBottles(): Bottle[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bottle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBottles(bottles: Bottle[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bottles));
}

export function upsertBottle(bottle: Bottle) {
  const bottles = loadBottles();
  const index = bottles.findIndex((b) => b.id === bottle.id);
  if (index >= 0) bottles[index] = bottle;
  else bottles.unshift(bottle);
  saveBottles(bottles);
  return bottles;
}

export function getBottle(id: string) {
  return loadBottles().find((b) => b.id === id);
}

export function removeBottleFromFridge(id: string) {
  const bottles = loadBottles();
  const next = bottles.map((b) =>
    b.id === id
      ? {
          ...b,
          status: "removed" as const,
          removedAt: new Date().toISOString().slice(0, 10),
        }
      : b,
  );
  saveBottles(next);
  return next;
}
