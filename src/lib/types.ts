import type { WineProfile } from "@/lib/wine-profile";
import type { WineType } from "@/lib/wine-types";

export type { WineType } from "@/lib/wine-types";

export type BottleStatus = "in_fridge" | "removed";

export type Bottle = {
  id: string;
  name: string;
  producer?: string;
  vintage?: number;
  wineType?: WineType;
  region?: string;
  country?: string;
  grapes?: string;
  imageDataUrl?: string;
  externalWineId?: string;
  addedAt: string;
  drinkFrom?: string;
  drinkBestBy?: string;
  notes?: string;
  /** How many identical bottles of this entry are in the fridge. */
  quantity: number;
  /** Present only when we know how the drinking dates were chosen. */
  drinkWindowSource?: "manual" | "estimate" | "grapeminds";
  /** Vintage the stored GrapeMinds years were calculated from. */
  drinkWindowVintage?: number;
  wineProfile?: WineProfile;
  /** Confirmed GrapeMinds catalog identity. Prose from the provider is not stored. */
  grapeMatch?: {
    wineId: number;
    displayName: string;
    producer: string;
  };
  /** Set after one detail lookup so the page does not ask again. */
  wineLookup?: {
    externalWineId: string;
    vintage: number | null;
    at: string;
    result: "ready" | "mismatch" | "unavailable";
  };
  status: BottleStatus;
  removedAt?: string;
};

export type WineSuggestion = {
  name: string;
  producer?: string;
  vintage?: number;
  wineType?: WineType;
  region?: string;
  country?: string;
  grapes?: string;
  externalWineId?: string;
  confidence?: number;
  drinkFrom?: string;
  drinkBestBy?: string;
};

export type IdentifyResponse = {
  suggestion: WineSuggestion | null;
  suggestions: WineSuggestion[];
  source: "wineapi" | "manual";
  message?: string;
};
