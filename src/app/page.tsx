"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
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
  const [finderOpen, setFinderOpen] = useState(false);

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
  const showFinder = finderOpen || filtering;

  const countLabel = !hydrated
    ? "Åbner køleskabet…"
    : filtering
      ? `${filtered.length} af ${fridgeCount} flasker`
      : `${fridgeCount} flasker på hylden`;

  return (
    <div className="-mx-4 -mt-3 flex flex-1 flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 pt-[max(0.4rem,env(safe-area-inset-top,0px))]">
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-display)] text-[0.95rem] leading-tight text-[var(--brass)]">
            Bossen(Anders) virtuelle vinkøleskab
          </h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[rgba(196,163,90,0.35)] px-3 text-sm text-[var(--brass)]"
          aria-expanded={showFinder}
          aria-controls="fridge-finder"
          onClick={() => setFinderOpen((open) => !open)}
        >
          <Search className="size-4" />
          Søg
        </button>
      </div>

      {showFinder && hydrated && inFridge.length > 0 ? (
        <section id="fridge-finder" className="space-y-2 px-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg navn, producent, region…"
              className="pr-11 pl-10"
              aria-label="Søg i køleskabet"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-[var(--brass)]"
                aria-label="Ryd søgning"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          {typesPresent.length > 1 ? (
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#120e0b] to-transparent"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {!hydrated ? (
          <div className="fridge-case flex-1 animate-pulse" />
        ) : filtering && filtered.length === 0 ? (
          <div className="fridge-case flex-1">
            <div className="fridge-rail" aria-hidden />
            <div className="fridge-opening">
              <div className="fridge-jamb" aria-hidden />
              <div className="fridge-interior flex flex-col items-center justify-center px-4 text-center">
                <p className="font-medium text-[var(--brass)]">Ingen match</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prøv et andet søgeord eller skift filter.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4 h-11 min-h-11"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setFinderOpen(false);
                  }}
                >
                  Ryd filtre
                </Button>
              </div>
              <div className="fridge-jamb fridge-jamb-right" aria-hidden />
            </div>
            <div className="fridge-sill" aria-hidden />
          </div>
        ) : (
          <FridgeShelfGrid bottles={filtered} />
        )}
      </div>
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
      className={`min-h-11 shrink-0 rounded-full border px-3.5 text-sm transition ${
        active
          ? "border-[rgba(196,163,90,0.55)] bg-[rgba(196,163,90,0.16)] text-[var(--brass)]"
          : "border-[rgba(196,163,90,0.16)] text-muted-foreground hover:border-[rgba(196,163,90,0.35)]"
      }`}
    >
      {label}
    </button>
  );
}
