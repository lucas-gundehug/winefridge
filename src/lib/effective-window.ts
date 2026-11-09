export type EffectiveSource = "manual" | "grapeminds" | "estimate" | "stored" | "unavailable";

export type EffectiveWindow = {
  drinkFrom?: string;
  drinkBestBy?: string;
  source: EffectiveSource;
};

export type DrinkProvenance = "manual" | "estimate" | "grapeminds";

export type VolatileGrapeWindow = {
  fromYear: number;
  toYear: number;
  vintage: number;
};

export type StoredDrinkWindow = {
  drinkFrom?: string;
  drinkBestBy?: string;
  provenance?: DrinkProvenance;
  drinkWindowVintage?: number;
  replaced: boolean;
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
function usableGrape(grape: VolatileGrapeWindow | null | undefined, vintage: number | undefined) {
  return Boolean(
    grape &&
      vintage !== undefined &&
      grape.vintage === vintage &&
      Number.isInteger(grape.fromYear) &&
      Number.isInteger(grape.toYear) &&
      grape.toYear >= grape.fromYear,
  );
}

export function effectiveDrinkWindow(input: {
  drinkFrom?: string;
  drinkBestBy?: string;
  provenance?: DrinkProvenance;
  vintage?: number;
  drinkWindowVintage?: number;
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
  if (
    input.provenance === "grapeminds" &&
    input.vintage !== undefined &&
    input.drinkWindowVintage === input.vintage &&
    (drinkFrom || drinkBestBy)
  ) {
    return { drinkFrom, drinkBestBy, source: "grapeminds" };
  }
  const grape = input.grape;
  if (usableGrape(grape, input.vintage) && grape) {
    return {
      drinkFrom: isoYear(grape.fromYear, false),
      drinkBestBy: isoYear(grape.toYear, true),
      source: "grapeminds",
    };
  }
  if (input.provenance === "estimate" && (drinkFrom || drinkBestBy)) {
    return { drinkFrom, drinkBestBy, source: "estimate" };
  }
  if (input.provenance === "grapeminds") return { source: "unavailable" };
  if (drinkFrom || drinkBestBy) return { drinkFrom, drinkBestBy, source: "stored" };
  return { source: "unavailable" };
}

/** Dates to write on the bottle. Manual and unlabelled dates are copied through unchanged. */
export function storedDrinkWindow(input: {
  drinkFrom?: string;
  drinkBestBy?: string;
  provenance?: DrinkProvenance;
  vintage?: number;
  grape?: VolatileGrapeWindow | null;
}): StoredDrinkWindow {
  const drinkFrom = input.drinkFrom || undefined;
  const drinkBestBy = input.drinkBestBy || undefined;
  if (input.provenance === "manual") {
    return { drinkFrom, drinkBestBy, provenance: "manual", replaced: false };
  }
  if (!input.provenance && (drinkFrom || drinkBestBy)) {
    return { drinkFrom, drinkBestBy, replaced: false };
  }
  if (usableGrape(input.grape, input.vintage) && input.grape && input.vintage !== undefined) {
    return {
      drinkFrom: isoYear(input.grape.fromYear, false),
      drinkBestBy: isoYear(input.grape.toYear, true),
      provenance: "grapeminds",
      drinkWindowVintage: input.vintage,
      replaced: true,
    };
  }
  return {
    drinkFrom,
    drinkBestBy,
    ...(input.provenance ? { provenance: input.provenance } : {}),
    replaced: false,
  };
}

export function windowSourceCaption(source: EffectiveSource) {
  switch (source) {
    case "manual":
      return "Datoerne er dem, du har skrevet.";
    case "grapeminds":
      return "GrapeMinds-skøn for den matchede vin. Det gælder vinen generelt, ikke en analyse af denne årgang.";
    case "estimate":
      return "Groft skøn ud fra type og årgang. Ikke et GrapeMinds-skøn.";
    case "stored":
      return "Datoer gemt på flasken. Oprindelsen er ikke registreret.";
    default:
      return "Intet drikkevindue.";
  }
}
