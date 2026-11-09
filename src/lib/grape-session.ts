"use client";

import { useSyncExternalStore } from "react";

export type RememberedGrapeWindow = {
  fromYear: number;
  toYear: number;
  vintage: number;
  wineId: number;
  displayName: string;
  producer: string;
};

let snapshot: Record<string, RememberedGrapeWindow> = {};
const listeners = new Set<() => void>();
const EMPTY: Record<string, RememberedGrapeWindow> = {};

function emit() {
  listeners.forEach((listener) => listener());
}

export function rememberGrapeWindow(bottleId: string, window: RememberedGrapeWindow) {
  snapshot = { ...snapshot, [bottleId]: window };
  emit();
}

export function grapeWindowFor(bottleId: string) {
  return snapshot[bottleId];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Session-only drinking windows. Nothing here is written to localStorage. */
export function useGrapeWindows() {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
