import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Bottle } from "@/lib/types";
import { drinkStatusLabel, formatDateDa } from "@/lib/drink-window";
import { cn } from "@/lib/utils";

const toneClass = {
  soon: "text-amber-800 bg-amber-100",
  peak: "text-emerald-900 bg-emerald-100",
  wait: "text-sky-900 bg-sky-100",
  past: "text-stone-700 bg-stone-200",
  unknown: "text-muted-foreground bg-muted",
} as const;

export function BottleListItem({ bottle }: { bottle: Bottle }) {
  const status = drinkStatusLabel(bottle);

  return (
    <Link
      href={`/flaske/${bottle.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-transparent bg-white/55 px-3 py-3 shadow-[0_1px_0_rgba(40,20,10,0.04)] transition hover:border-[var(--brand-soft)] hover:bg-white/80"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)]">
        {bottle.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bottle.imageDataUrl}
            alt={bottle.name}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-[var(--brand)]">
            Vin
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{bottle.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {[bottle.producer, bottle.vintage].filter(Boolean).join(" · ") || "Uden detaljer"}
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

      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
    </Link>
  );
}
