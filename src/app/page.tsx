"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { FridgeShelfGrid } from "@/components/wine/bottle-shelf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBottles } from "@/hooks/use-bottles";
import type { WineType } from "@/lib/types";
import { WINE_TYPE_LABELS, WINE_TYPES } from "@/lib/wine-types";

export default function HomePage() {
  const { inFridge, fridgeCount, hydrated } = useBottles();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<WineType | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inFridge.filter((b) => {
      if (typeFilter !== "all" && b.wineType !== typeFilter) return false;
      if (!q) return true;
      const hay = [
        b.name,
        b.producer,
        b.region,
        b.country,
        b.grapes,
        b.vintage?.toString(),
        b.wineType ? WINE_TYPE_LABELS[b.wineType] : "",
        b.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [inFridge, search, typeFilter]);

  const typesPresent = useMemo(() => {
    const set = new Set<WineType>();
    for (const b of inFridge) {
      if (b.wineType) set.add(b.wineType);
    }
    return WINE_TYPES.filter((t) => set.has(t));
  }, [inFridge]);

  const filtering = search.trim().length > 0 || typeFilter !== "all";

  return (
    <div className="space-y-4">
      <section className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-tight text-[var(--brass)]">
            Køleskab
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {!hydrated
              ? "Åbner køleskabet…"
              : filtering
                ? `${filtered.length} af ${fridgeCount} flasker`
                : `${fridgeCount} flasker på hylden`}
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/tilfoej">
            <Plus /> Tilføj
          </Link>
        </Button>
      </section>

      {hydrated && inFridge.length > 0 ? (
        <section className="space-y-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg navn, producent, region…"
              className="h-9 pr-9 pl-8"
              aria-label="Søg i køleskabet"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-[var(--brass)]"
                aria-label="Ryd søgning"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          {typesPresent.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                active={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
                label="Alle"
              />
              {typesPresent.map((t) => (
                <FilterChip
                  key={t}
                  active={typeFilter === t}
                  onClick={() => setTypeFilter(t)}
                  label={WINE_TYPE_LABELS[t]}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!hydrated ? (
        <div className="fridge-cabinet h-64 animate-pulse rounded-2xl" />
      ) : filtering && filtered.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(196,163,90,0.16)] bg-[rgba(28,22,18,0.7)] px-4 py-10 text-center">
          <p className="font-medium text-[var(--brass)]">Ingen match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Prøv et andet søgeord eller skift filter.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
            }}
          >
            Ryd filtre
          </Button>
        </div>
      ) : (
        <FridgeShelfGrid bottles={filtered} />
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md border px-2.5 py-1 text-xs transition ${
        active
          ? "border-[rgba(196,163,90,0.55)] bg-[rgba(196,163,90,0.16)] text-[var(--brass)]"
          : "border-[rgba(196,163,90,0.16)] text-muted-foreground hover:border-[rgba(196,163,90,0.35)]"
      }`}
    >
      {label}
    </button>
  );
}
