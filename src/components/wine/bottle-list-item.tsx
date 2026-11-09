"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Bottle } from "@/lib/types";
import { effectiveDrinkWindow } from "@/lib/effective-window";
import { drinkStatusLabel, formatDateDa } from "@/lib/drink-window";
import { useGrapeWindows } from "@/lib/grape-session";
import { WINE_TYPE_LABELS } from "@/lib/wine-types";
import { WineBottleSvg } from "@/components/wine/wine-bottle-svg";
import { cn } from "@/lib/utils";

const toneClass = {
  soon: "text-amber-200 bg-amber-950/60",
  peak: "text-emerald-200 bg-emerald-950/50",
  wait: "text-sky-200 bg-sky-950/50",
  past: "text-stone-300 bg-stone-800/70",
  unknown: "text-muted-foreground bg-muted",
} as const;

export function BottleListItem({ bottle }: { bottle: Bottle }) {
  const grapes = useGrapeWindows();
  const window = effectiveDrinkWindow({
    drinkFrom: bottle.drinkFrom,
    drinkBestBy: bottle.drinkBestBy,
    provenance: bottle.drinkWindowSource,
    vintage: bottle.vintage,
    grape: grapes[bottle.id] ?? null,
  });
  const status = drinkStatusLabel(window);
  const qty = Math.max(1, bottle.quantity || 1);

  return (
    <Link
      href={`/flaske/${bottle.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-[rgba(196,163,90,0.14)] bg-[rgba(28,22,18,0.85)] px-3 py-3 transition hover:border-[rgba(196,163,90,0.35)] hover:bg-[rgba(36,28,22,0.95)]"
    >
      <div className="relative flex h-16 w-11 shrink-0 items-end justify-center">
        <WineBottleSvg
          wineType={bottle.wineType}
          imageUrl={bottle.imageDataUrl}
          vintage={bottle.vintage}
          className="h-16 w-auto"
        />
        {qty > 1 ? (
          <span className="absolute top-0.5 right-0.5 rounded bg-[rgba(20,14,10,0.9)] px-1 text-[9px] text-[var(--brass)]">
            ×{qty}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-[family-name:var(--font-display)] text-[var(--brass)]">
          {bottle.name}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {[
            bottle.producer,
            bottle.vintage,
            bottle.wineType ? WINE_TYPE_LABELS[bottle.wineType] : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Uden detaljer"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              toneClass[status.tone],
            )}
          >
            {status.label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Ind {formatDateDa(bottle.addedAt)}
          </span>
        </div>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-[var(--brass)]" />
    </Link>
  );
}
