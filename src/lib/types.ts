export type WineType = "rød" | "hvid" | "rosé" | "mousserende" | "anden";

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
