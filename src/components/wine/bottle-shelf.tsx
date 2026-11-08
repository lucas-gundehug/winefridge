import Link from "next/link";
import type { Bottle } from "@/lib/types";
import { formatDateDa } from "@/lib/drink-window";
import { WINE_TYPE_LABELS } from "@/lib/wine-types";
import { WineBottleSvg } from "@/components/wine/wine-bottle-svg";

function drinkLine(bottle: Bottle) {
  if (bottle.drinkFrom && bottle.drinkBestBy) {
    return `${formatDateDa(bottle.drinkFrom)} – ${formatDateDa(bottle.drinkBestBy)}`;
  }
  if (bottle.drinkBestBy) return `Bedst til ${formatDateDa(bottle.drinkBestBy)}`;
  return "Drikkevindue ukendt";
}

export function BottleShelfSlot({ bottle }: { bottle: Bottle }) {
  const qty = Math.max(1, bottle.quantity || 1);
  return (
    <Link
      href={`/flaske/${bottle.id}`}
      className="group flex flex-col items-center gap-2.5 text-center outline-none"
    >
      <div className="relative flex h-[9.25rem] w-full items-end justify-center">
        <WineBottleSvg
          wineType={bottle.wineType}
          imageUrl={bottle.imageDataUrl}
          className="h-full w-auto max-w-[3.4rem] drop-shadow-[0_10px_14px_rgba(0,0,0,0.45)] transition duration-500 group-hover:-translate-y-1"
        />
        {qty > 1 ? (
          <span className="absolute top-1 right-[18%] rounded bg-[rgba(20,14,10,0.88)] px-1.5 py-0.5 text-[0.65rem] font-medium tracking-wide text-[var(--brass)] ring-1 ring-[rgba(196,163,90,0.35)]">
            ×{qty}
          </span>
        ) : null}
      </div>
      <div className="w-full min-w-0 px-0.5 pb-1">
        <p className="line-clamp-2 font-[family-name:var(--font-display)] text-[0.82rem] leading-snug text-[var(--brass)]">
          {bottle.name}
        </p>
        <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
          {[bottle.vintage ?? "—", bottle.wineType ? WINE_TYPE_LABELS[bottle.wineType] : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 line-clamp-2 text-[0.62rem] leading-snug text-[var(--brass-dim)]">
          {drinkLine(bottle)}
        </p>
      </div>
    </Link>
  );
}

export function EmptyShelfSlot() {
  return (
    <div className="flex flex-col items-center gap-2.5 opacity-45" aria-hidden>
      <div className="relative flex h-[9.25rem] w-full items-end justify-center">
        <WineBottleSvg empty className="h-full w-auto max-w-[3.4rem]" />
      </div>
      <div className="h-12 w-full" />
    </div>
  );
}

function WoodShelfRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="wood-shelf-row">
      <div className="grid grid-cols-3 gap-x-3 gap-y-0 px-2 pt-3">{children}</div>
      <div className="wood-plank" aria-hidden>
        <span className="wood-plank-edge" />
        <span className="wood-plank-grain" />
      </div>
    </div>
  );
}

/** Fridge as dark wood shelves, always 3 bottles across. */
export function FridgeShelfGrid({ bottles }: { bottles: Bottle[] }) {
  const cols = 3;
  const extraRows = 2;
  const minSlots = bottles.length + cols * extraRows;
  const totalSlots = Math.ceil(minSlots / cols) * cols;
  const slots = Array.from({ length: totalSlots }, (_, i) => bottles[i] ?? null);
  const rows: (typeof slots)[] = [];
  for (let i = 0; i < slots.length; i += cols) {
    rows.push(slots.slice(i, i + cols));
  }

  return (
    <div className="fridge-cabinet rounded-2xl p-3 sm:p-4">
      <div className="space-y-1">
        {rows.map((row, rowIndex) => (
          <WoodShelfRow key={`row-${rowIndex}`}>
            {row.map((bottle, colIndex) => {
              const key = bottle?.id ?? `empty-${rowIndex}-${colIndex}`;
              return (
                <div key={key} className="min-w-0">
                  {bottle ? <BottleShelfSlot bottle={bottle} /> : <EmptyShelfSlot />}
                </div>
              );
            })}
          </WoodShelfRow>
        ))}
      </div>
    </div>
  );
}
