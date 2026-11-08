import Link from "next/link";
import type { Bottle } from "@/lib/types";
import { shelfReadinessLine, groupShelfRows } from "@/lib/shelf";
import { WINE_TYPE_LABELS } from "@/lib/wine-types";
import { WineBottleSvg } from "@/components/wine/wine-bottle-svg";

export function BottleShelfSlot({ bottle }: { bottle: Bottle }) {
  const qty = Math.max(1, bottle.quantity || 1);
  const meta = [
    bottle.vintage ?? "—",
    bottle.wineType ? WINE_TYPE_LABELS[bottle.wineType] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/flaske/${bottle.id}`}
      className="group flex min-h-11 flex-col items-center text-center outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
    >
      <div className="relative flex h-52 w-full items-end justify-center">
        <WineBottleSvg
          wineType={bottle.wineType}
          imageUrl={bottle.imageDataUrl}
          name={bottle.name}
          vintage={bottle.vintage}
          className="bottle-figure h-52 w-auto max-w-[7.5rem]"
        />
        {qty > 1 ? (
          <span className="absolute top-1 right-1 rounded-md bg-[rgba(18,14,11,0.92)] px-1.5 py-0.5 text-xs font-medium text-[var(--brass)] ring-1 ring-[rgba(196,163,90,0.4)]">
            ×{qty}
          </span>
        ) : null}
      </div>
      <div className="mt-1 w-full min-w-0 px-1 pb-3">
        <p
          className="truncate font-[family-name:var(--font-display)] text-base leading-tight text-[var(--brass)]"
          title={bottle.name}
        >
          {bottle.name}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{meta}</p>
        <p className="mt-0.5 text-sm text-foreground">{shelfReadinessLine(bottle)}</p>
      </div>
    </Link>
  );
}

/** Two bottles on each wooden shelf. No empty filler rows. */
export function FridgeShelfGrid({ bottles }: { bottles: Bottle[] }) {
  const rows = groupShelfRows(bottles, 2);

  if (rows.length === 0) {
    return (
      <div className="fridge-cabinet rounded-2xl px-4 py-12 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--brass)]">
          Køleskabet er tomt
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tilføj den første flaske med knappen forneden.
        </p>
      </div>
    );
  }

  return (
    <div className="fridge-cabinet rounded-2xl px-2 pt-3 pb-1">
      <div>
        {rows.map((row) => (
          <div key={row.map((bottle) => bottle.id).join("-")} className="wood-shelf-row">
            <div className="grid grid-cols-2 gap-x-2 px-1">
              {row.map((bottle) => (
                <div key={bottle.id} className="min-w-0">
                  <BottleShelfSlot bottle={bottle} />
                </div>
              ))}
            </div>
            <div className="wood-plank" aria-hidden>
              <span className="wood-plank-edge" />
              <span className="wood-plank-grain" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
