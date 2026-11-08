import type { WineType } from "@/lib/types";

/** Rough personal drinking windows when WineAPI does not provide them. */
export function suggestDrinkWindow(input: {
  vintage?: number;
  wineType?: WineType;
  addedAt?: string;
}): { drinkFrom?: string; drinkBestBy?: string } {
  const added = input.addedAt ? new Date(input.addedAt) : new Date();
  const vintage = input.vintage ?? added.getFullYear();

  const yearsFromVintage: Record<WineType, [number, number]> = {
    mousserende: [0, 3],
    hvid: [0, 4],
    rosé: [0, 2],
    rød: [1, 8],
    anden: [0, 5],
  };

  const type = input.wineType ?? "anden";
  const [fromOffset, toOffset] = yearsFromVintage[type];

  const from = new Date(Date.UTC(vintage + fromOffset, 0, 1));
  const to = new Date(Date.UTC(vintage + toOffset, 11, 31));

  // Never suggest a "from" after today + 1 year without reason — clamp lightly
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { drinkFrom: iso(from), drinkBestBy: iso(to) };
}

export function formatDateDa(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("da-DK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function drinkStatusLabel(bottle: {
  drinkFrom?: string;
  drinkBestBy?: string;
}): { label: string; tone: "soon" | "peak" | "wait" | "past" | "unknown" } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = bottle.drinkFrom ? new Date(bottle.drinkFrom) : null;
  const to = bottle.drinkBestBy ? new Date(bottle.drinkBestBy) : null;

  if (!from && !to) return { label: "Ukendt vindue", tone: "unknown" };
  if (to && today > to) return { label: "Past peak", tone: "past" };
  if (from && today < from) return { label: "Vent lidt", tone: "wait" };
  if (to) {
    const days = Math.ceil((to.getTime() - today.getTime()) / 86400000);
    if (days <= 90) return { label: "Drik snart", tone: "soon" };
  }
  return { label: "I vinduet", tone: "peak" };
}
