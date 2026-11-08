export type WineType =
  | "rød"
  | "hvid"
  | "rosé"
  | "mousserende"
  | "portvin"
  | "madeira"
  | "sherry"
  | "dessert"
  | "orange"
  | "anden";

export const WINE_TYPES: WineType[] = [
  "rød",
  "hvid",
  "rosé",
  "mousserende",
  "portvin",
  "madeira",
  "sherry",
  "dessert",
  "orange",
  "anden",
];

export const WINE_TYPE_LABELS: Record<WineType, string> = {
  rød: "Rødvin",
  hvid: "Hvidvin",
  rosé: "Rosé",
  mousserende: "Mousserende",
  portvin: "Portvin",
  madeira: "Madeira",
  sherry: "Sherry",
  dessert: "Dessertvin",
  orange: "Orangevin",
  anden: "Anden",
};

/** Map WineAPI / free-text type strings into our Danish variants. */
export function mapWineType(raw?: string | null): WineType | undefined {
  if (!raw) return undefined;
  const t = raw.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

  if (t.includes("port")) return "portvin";
  if (t.includes("madeira")) return "madeira";
  if (t.includes("sherry") || t.includes("jerez") || t.includes("xeres")) return "sherry";
  if (t.includes("orange") || t.includes("amber") || t.includes("skin contact")) return "orange";
  if (
    t.includes("dessert") ||
    t.includes("sweet") ||
    t.includes("sauternes") ||
    t.includes("tokaji") ||
    t.includes("ice wine") ||
    t.includes("eiswein") ||
    t.includes("late harvest")
  )
    return "dessert";
  if (
    t.includes("sparkling") ||
    t.includes("mousser") ||
    t.includes("champagne") ||
    t.includes("cava") ||
    t.includes("prosecco") ||
    t.includes("cremant") ||
    t.includes("sekt")
  )
    return "mousserende";
  if (t.includes("rose") || t.includes("rosato") || t.includes("blush")) return "rosé";
  if (
    t.includes("white") ||
    t.includes("hvid") ||
    t.includes("blanc") ||
    t.includes("bianco") ||
    t.includes("weiss")
  )
    return "hvid";
  if (
    t.includes("red") ||
    t.includes("rod") ||
    t.includes("rouge") ||
    t.includes("rosso") ||
    t.includes("tinto") ||
    t.includes("noir")
  )
    return "rød";

  return "anden";
}
