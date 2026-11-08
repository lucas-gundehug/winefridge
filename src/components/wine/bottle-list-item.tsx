import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Bottle } from "@/lib/types";
import { drinkStatusLabel, formatDateDa } from "@/lib/drink-window";
import { WINE_TYPE_LABELS } from "@/lib/wine-types";
import { cn } from "@/lib/utils";

const toneClass = {
  soon: "text-amber-200 bg-amber-950/60",
  peak: "text-emerald-200 bg-emerald-950/50",
  wait: "text-sky-200 bg-sky-950/50",
  past: "text-stone-300 bg-stone-800/70",
  unknown: "text-muted-foreground bg-muted",
} as const;

export function BottleListItem({ bottle }: { bottle: Bottle }) {
  const status = drinkStatusLabel(bottle);
  const qty = Math.max(1, bottle.quantity || 1);

  return (
    <Link
      href={`/flaske/${bottle.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-[rgba(196,163,90,0.14)] bg-[rgba(28,22,18,0.85)] px-3 py-3 transition hover:border-[rgba(196,163,90,0.35)] hover:bg-[rgba(36,28,22,0.95)]"
    >
      <div className="relative flex h-16 w-10 shrink-0 items-end justify-center overflow-hidden rounded-lg bg-[rgba(42,34,24,0.9)]">
        {bottle.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bottle.imageDataUrl}
            alt={bottle.name}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="mb-1 h-12 w-4 rounded-b-md bg-gradient-to-b from-[#6b1c2a] to-[#3a0f18]" />
        )}
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
