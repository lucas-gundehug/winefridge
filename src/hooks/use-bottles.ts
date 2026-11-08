"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Bottle } from "@/lib/types";
import {
  loadBottles,
  removeBottleFromFridge,
  saveBottles,
  totalBottleCount,
  upsertBottle,
} from "@/lib/storage";

let memory: Bottle[] = [];
const EMPTY: Bottle[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return memory;
}

function getServerSnapshot(): Bottle[] {
  return EMPTY;
}

function setMemory(next: Bottle[]) {
  memory = next;
  emit();
}

export function useBottles() {
  const [hydrated, setHydrated] = useState(false);
  const bottles = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    setMemory(loadBottles());
    setHydrated(true);
  }, []);

  const addBottle = useCallback((bottle: Bottle) => {
    const next = upsertBottle(bottle);
    setMemory(next);
  }, []);

  const takeOut = useCallback((id: string, count = 1) => {
    const next = removeBottleFromFridge(id, count);
    setMemory(next);
  }, []);

  const replaceAll = useCallback((next: Bottle[]) => {
    saveBottles(next);
    setMemory(next);
  }, []);

  const inFridge = bottles.filter((b) => b.status === "in_fridge");

  return {
    bottles,
    hydrated,
    inFridge,
    history: bottles.filter((b) => b.status === "removed"),
    fridgeCount: totalBottleCount(inFridge),
    addBottle,
    takeOut,
    replaceAll,
  };
}
