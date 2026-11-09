export type EffectiveSource = "manual" | "grapeminds" | "estimate" | "stored" | "unavailable";

export type EffectiveWindow = {
  drinkFrom?: string;
  drinkBestBy?: string;
  source: EffectiveSource;
};

export type VolatileGrapeWindow = {
  fromYear: number;
  toYear: number;
  vintage: number;
};

function isoYear(year: number, end: boolean) {
  return `${year}-${end ? "12-31" : "01-01"}`;
}

/**
 * One drinking window for the shelf and the bottle page.
 * Manual dates win, including when only one side is filled.
 * A GrapeMinds window applies only for the same confirmed vintage.
 * Dates already stored without a recorded origin are left as they are.
 */
export function effectiveDrinkWindow(input: {
  drinkFrom?: string;
  drinkBestBy?: string;
  provenance?: "manual" | "estimate";
  vintage?: number;
  grape?: VolatileGrapeWindow | null;
}): EffectiveWindow {
  const drinkFrom = input.drinkFrom || undefined;
  const drinkBestBy = input.drinkBestBy || undefined;
  if (input.provenance === "manual") {
    return { drinkFrom, drinkBestBy, source: "manual" };
  }
  if (!input.provenance && (drinkFrom || drinkBestBy)) {
    return { drinkFrom, drinkBestBy, source: "stored" };
  }
  const grape = input.grape;
  if (
    grape &&
    input.vintage !== undefined &&
    grape.vintage === input.vintage &&
    Number.isInteger(grape.fromYear) &&
    Number.isInteger(grape.toYear) &&
    grape.toYear >= grape.fromYear
  ) {
    return {
      drinkFrom: isoYear(grape.fromYear, false),
      drinkBestBy: isoYear(grape.toYear, true),
      source: "grapeminds",
    };
  }
  if (input.provenance === "estimate" && (drinkFrom || drinkBestBy)) {
    return { drinkFrom, drinkBestBy, source: "estimate" };
  }
  if (drinkFrom || drinkBestBy) return { drinkFrom, drinkBestBy, source: "stored" };
  return { source: "unavailable" };
}

export function windowSourceCaption(source: EffectiveSource) {
  switch (source) {
    case "manual":
      return "Datoerne er dem, du har skrevet.";
    case "grapeminds":
      return "GrapeMinds-skøn for den matchede vin. Det gælder vinen generelt, ikke en analyse af denne årgang. Årstallene gemmes ikke.";
    case "estimate":
      return "Groft skøn ud fra type og årgang. Ikke et GrapeMinds-skøn.";
    case "stored":
      return "Datoer gemt på flasken. Oprindelsen er ikke registreret.";
    default:
      return "Intet drikkevindue.";
  }
}
