export type BottleShape = "bordeaux" | "burgundy" | "champagne" | "port" | "sherry";

const SHAPE: Record<string, BottleShape> = {
  rød: "bordeaux",
  hvid: "burgundy",
  rosé: "burgundy",
  orange: "burgundy",
  mousserende: "champagne",
  portvin: "port",
  madeira: "port",
  sherry: "sherry",
  dessert: "bordeaux",
  anden: "bordeaux",
};

export function bottleShape(type?: string): BottleShape {
  if (!type) return "bordeaux";
  return SHAPE[type] ?? "bordeaux";
}

/** Pair bottles onto shelves. No filler rows. */
export function groupShelfRows<T>(items: T[], columns = 2): T[][] {
  const width = Math.max(1, columns);
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += width) {
    rows.push(items.slice(i, i + width));
  }
  return rows;
}

function day(iso: string) {
  const [year, month, date] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, date ?? 1);
}

function yearOf(iso?: string) {
  if (!iso || !/^\d{4}/.test(iso)) return null;
  return iso.slice(0, 4);
}

/** Short shelf line. The caller passes the one effective window. */
export function shelfReadinessLine(
  bottle: { drinkFrom?: string; drinkBestBy?: string },
  now = new Date(),
): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = bottle.drinkFrom ? day(bottle.drinkFrom) : null;
  const to = bottle.drinkBestBy ? day(bottle.drinkBestBy) : null;
  const fromYear = yearOf(bottle.drinkFrom);
  const toYear = yearOf(bottle.drinkBestBy);

  if (!from && !to) return "vindue ukendt";
  if (to && today > to) return toYear ? `forbi ${toYear}` : "forbi vinduet";
  if (from && today < from) return fromYear ? `vent til ${fromYear}` : "vent lidt";
  if (to) {
    const days = Math.ceil((to.getTime() - today.getTime()) / 86_400_000);
    if (days <= 90) return "drik snart";
  }
  return toYear ? `bedst til ${toYear}` : "i vinduet";
}

/**
 * Two short lines for a bottle label. Words come only from `name`;
 * nothing is added except an ellipsis when the name does not fit.
 */
export function bottleLabelCopy(
  name: string,
  vintage?: number,
): { lines: string[]; year: string | null } {
  const clean = name.replace(/\s+/g, " ").trim();
  const year =
    typeof vintage === "number" && Number.isFinite(vintage) ? String(vintage) : null;
  if (!clean) return { lines: [], year };

  const max = 16;
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (let index = 0; index < words.length; index++) {
    const raw = words[index];
    const word = raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) {
      lines.push(current);
      current = word;
      if (lines.length === 2) {
        current = "";
        break;
      }
    } else {
      current = next;
    }
  }

  if (current && lines.length < 2) lines.push(current);

  const consumed = lines
    .join(" ")
    .replaceAll("…", "")
    .split(" ")
    .filter(Boolean).length;
  if (consumed < words.length && lines.length > 0) {
    const last = lines.length - 1;
    if (!lines[last].endsWith("…")) lines[last] = `${lines[last]}…`;
  }

  return { lines, year };
}
