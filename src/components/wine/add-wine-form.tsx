"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Loader2, Search, Sparkles } from "lucide-react";
import { ThumbBar } from "@/components/thumb-bar";
import { GrapeWindow } from "@/components/wine/grape-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileToCompressedDataUrl } from "@/lib/image";
import { readBarcode } from "@/lib/barcode";
import { formatDateDa, suggestDrinkWindow } from "@/lib/drink-window";
import { readLabelText } from "@/lib/label-text";
import { lookupOpenFoodFacts } from "@/lib/open-food-facts";
import { effectiveDrinkWindow, storedDrinkWindow, windowSourceCaption } from "@/lib/effective-window";
import { rememberGrapeWindow } from "@/lib/grape-session";
import { savedDrinkDates, type GrapeIdentity } from "@/lib/grapeminds";
import { yearsAfterVintage } from "@/lib/scan-sources";
import { cachedWineProfile, vintagesMatch, type WineProfile } from "@/lib/wine-profile";
import type { IdentifyResponse, WineSuggestion, WineType } from "@/lib/types";
import { WINE_TYPE_LABELS, WINE_TYPES } from "@/lib/wine-types";
import { useBottles } from "@/hooks/use-bottles";

const initialStopped = { wineapi: false, off: false, gemini: false, grapeminds: false };

const emptyForm = {
  name: "",
  producer: "",
  vintage: "",
  wineType: "" as WineType | "",
  region: "",
  country: "",
  grapes: "",
  notes: "",
  quantity: "1",
  addedAt: new Date().toISOString().slice(0, 10),
  drinkFrom: "",
  drinkBestBy: "",
};

export function AddWineForm() {
  const router = useRouter();
  const { addBottle, bottles } = useBottles();
  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const imageBlob = useRef<Blob | null>(null);
  const grapeRequest = useRef<{
    producer?: string;
    name: string;
    vintage?: number;
    wineId?: number;
    displayName?: string;
    choiceProducer?: string;
  } | null>(null);
  const scanAbort = useRef<AbortController | null>(null);
  const [pending, startTransition] = useTransition();
  const [identifying, setIdentifying] = useState(false);
  const [searching, setSearching] = useState(false);
  const [scanBusy, setScanBusy] = useState<"ocr" | "barcode" | "gemini" | null>(null);
  const [geminiOn, setGeminiOn] = useState(false);
  const [grapemindsOn, setGrapemindsOn] = useState(false);
  const [grape, setGrape] = useState<{
    status: "loading" | "ready" | "ambiguous" | "unavailable" | "pending" | "stopped" | "missing_key";
    identity?: GrapeIdentity;
    choices?: GrapeIdentity[];
    fromOffset?: number;
    toOffset?: number;
  } | null>(null);
  const [geminiAsk, setGeminiAsk] = useState(false);
  const stoppedRef = useRef(initialStopped);
  const [stopped, setStopped] = useState(initialStopped);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<WineSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [drinkEdited, setDrinkEdited] = useState(false);
  const [ownDates, setOwnDates] = useState(false);
  const [matched, setMatched] = useState<{ id: string; vintage?: number } | null>(null);
  const [wineProfile, setWineProfile] = useState<WineProfile | undefined>();

  function stopProvider(provider: "wineapi" | "off" | "gemini" | "grapeminds", message: string) {
    stoppedRef.current = { ...stoppedRef.current, [provider]: true };
    setStopped(stoppedRef.current);
    setError(message);
  }

  async function loadGrape(input: {
    producer?: string;
    name: string;
    vintage?: number;
    wineId?: number;
    displayName?: string;
    choiceProducer?: string;
  }) {
    grapeRequest.current = input;
    if (!grapemindsOn || stoppedRef.current.grapeminds) return;
    setGrape((current) => ({
      status: "loading",
      identity: input.wineId
        ? {
            wineId: input.wineId,
            displayName: input.displayName ?? "",
            producer: input.choiceProducer ?? input.producer ?? "",
          }
        : current?.identity,
      choices: current?.choices,
    }));
    try {
      const res = await fetch("/api/grapeminds-window", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => null)) as {
        enabled?: boolean;
        status?: "ready" | "ambiguous" | "unavailable" | "pending" | "stopped";
        identity?: GrapeIdentity;
        choices?: GrapeIdentity[];
        fromOffset?: number;
        toOffset?: number;
      } | null;
      if (!data?.enabled) {
        setGrape({ status: "missing_key" });
        return;
      }
      if (data.status === "stopped") {
        stopProvider("grapeminds", "GrapeMinds er ikke tilgængeligt. Der prøves ikke igen.");
        setGrape({ status: "stopped", identity: data.identity });
        return;
      }
      setGrape({
        status: data.status ?? "unavailable",
        identity: data.identity,
        choices: data.choices,
        fromOffset: data.fromOffset,
        toOffset: data.toOffset,
      });
    } catch {
      setGrape({ status: "unavailable" });
    }
  }

  function applySuggestion(s: WineSuggestion) {
    const typedVintage = form.vintage.trim();
    const suggestedVintage = s.vintage ? String(s.vintage) : "";
    const keepTyped = Boolean(typedVintage && suggestedVintage && typedVintage !== suggestedVintage);
    const vintageForWindow = keepTyped ? Number(typedVintage) : s.vintage;
    const window =
      !keepTyped && s.drinkFrom && s.drinkBestBy
        ? { drinkFrom: s.drinkFrom, drinkBestBy: s.drinkBestBy }
        : suggestDrinkWindow({
            vintage: vintageForWindow,
            wineType: s.wineType,
            addedAt: form.addedAt,
          });
    setForm((f) => ({
      ...f,
      name: s.name || f.name,
      producer: s.producer || "",
      vintage: keepTyped ? f.vintage : suggestedVintage || f.vintage,
      wineType: s.wineType || f.wineType,
      region: s.region || "",
      country: s.country || "",
      grapes: s.grapes || "",
      drinkFrom: drinkEdited ? f.drinkFrom : window.drinkFrom || "",
      drinkBestBy: drinkEdited ? f.drinkBestBy : window.drinkBestBy || "",
    }));
    const vintageUsed = keepTyped ? Number(typedVintage) : s.vintage;
    if (s.externalWineId) {
      void loadGrape({ producer: s.producer, name: s.name, vintage: vintageUsed });
    } else {
      setGrape(null);
    }
    if (keepTyped) {
      setMatched(null);
      setWineProfile(undefined);
      setInfo(`Forslaget er årgang ${suggestedVintage}. Din årgang ${typedVintage} er beholdt.`);
      return;
    }
    if (s.externalWineId) {
      const next = { id: s.externalWineId, vintage: s.vintage };
      setMatched(next);
      setWineProfile(undefined);
      void enrichMatch(next.id, next.vintage);
    } else {
      setMatched(null);
      setWineProfile(undefined);
    }
  }

  async function enrichMatch(id: string, vintage?: number) {
    const cached = cachedWineProfile(bottles, id, vintage);
    if (cached) {
      setWineProfile(cached);
      return;
    }
    try {
      const params = new URLSearchParams({ id });
      if (vintage !== undefined) params.set("vintage", String(vintage));
      const res = await fetch(`/api/wine-detail?${params}`);
      const data = (await res.json().catch(() => null)) as { profile?: WineProfile | null } | null;
      if (data?.profile && vintagesMatch(vintage, data.profile.vintage)) setWineProfile(data.profile);
    } catch {
      // Saving the bottle does not depend on the detail call.
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/scanner-options", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { gemini?: boolean; grapeminds?: boolean }) => {
        setGeminiOn(Boolean(data.gemini));
        setGrapemindsOn(Boolean(data.grapeminds));
      })
      .catch(() => {
        setGeminiOn(false);
        setGrapemindsOn(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (grapemindsOn && grapeRequest.current) void loadGrape(grapeRequest.current);
    // Retry the confirmed WineAPI match once the server says the key is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grapemindsOn]);

  function beginScan() {
    scanAbort.current?.abort();
    const controller = new AbortController();
    scanAbort.current = controller;
    return controller;
  }

  function stopScan() {
    scanAbort.current?.abort();
    setScanBusy(null);
    setIdentifying(false);
  }

  async function searchQuery(text: string, signal?: AbortSignal) {
    if (stoppedRef.current.wineapi || text.trim().length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/search-wine?q=${encodeURIComponent(text)}`, { signal });
      const data = (await res.json()) as {
        results?: WineSuggestion[];
        error?: string;
        message?: string;
      };
      if (res.status === 429) {
        stopProvider("wineapi", data.error || "WineAPI er midlertidigt brugt op. Der søges ikke igen.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Søgning fejlede");
      setSuggestions(data.results ?? []);
      if (!(data.results && data.results.length)) {
        setInfo(data.message || "Ingen resultater — prøv et andet navn.");
      } else {
        setInfo("Vælg et forslag, før noget gemmes.");
      }
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Søgning fejlede");
    } finally {
      setSearching(false);
    }
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    setError(null);
    setInfo(null);
    setGeminiAsk(false);
    const controller = beginScan();
    try {
      const { dataUrl, blob } = await fileToCompressedDataUrl(file);
      imageBlob.current = blob;
      setImageDataUrl(dataUrl);
      if (stoppedRef.current.wineapi) {
        setInfo("Billedet bliver på telefonen. WineAPI er brugt op, så det sendes ikke.");
        return;
      }
      setIdentifying(true);

      const body = new FormData();
      body.append("image", blob, "label.jpg");
      const res = await fetch("/api/identify-wine", { method: "POST", body, signal: controller.signal });
      const data = (await res.json()) as IdentifyResponse & { error?: string };
      if (res.status === 429) {
        stopProvider("wineapi", data.error || "WineAPI er midlertidigt brugt op. Der prøves ikke igen.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Genkendelse fejlede");

      const list = data.suggestions ?? [];
      const top = data.suggestion;
      const withTop =
        top && !list.some((item) => item.externalWineId === top.externalWineId && item.vintage === top.vintage)
          ? [top, ...list]
          : list;
      setSuggestions(withTop);
      setInfo(
        withTop.length
          ? "Vælg et forslag, før noget gemmes. Billedet er kun sendt til WineAPI."
          : data.message || "Ingen match. Læs teksten på telefonen, eller udfyld selv.",
      );
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Kunne ikke læse billedet");
    } finally {
      setIdentifying(false);
    }
  }

  async function onReadLocally() {
    const blob = imageBlob.current;
    if (!blob) return;
    const controller = beginScan();
    setScanBusy("ocr");
    setError(null);
    setInfo("Teksten læses på telefonen. Billedet sendes ikke videre.");
    try {
      const text = await readLabelText(blob, controller.signal);
      if (controller.signal.aborted) return;
      if (text.length < 3) {
        setInfo("Kunne ikke læse tekst på telefonen. Skriv navnet, eller prøv stregkoden.");
        return;
      }
      const queryText = text.slice(0, 120);
      setQuery(queryText);
      if (stoppedRef.current.wineapi) {
        setInfo("Teksten er læst på telefonen. WineAPI er brugt op, så der søges ikke.");
        return;
      }
      setInfo("Teksten er læst på telefonen. Den søges i WineAPI.");
      await searchQuery(queryText, controller.signal);
    } catch {
      if (!controller.signal.aborted) setError("Tekstlæsningen stoppede.");
    } finally {
      setScanBusy(null);
    }
  }

  async function onBarcode(file: File | null) {
    if (!file || stoppedRef.current.off) return;
    const controller = beginScan();
    setScanBusy("barcode");
    setError(null);
    setInfo("Stregkoden læses på telefonen. Opslaget giver et navn, ikke en årgang.");
    try {
      const code = await readBarcode(file);
      if (controller.signal.aborted) return;
      if (!code) {
        setInfo("Ingen stregkode i billedet.");
        return;
      }
      const product = await lookupOpenFoodFacts(code, controller.signal);
      if (!product) {
        setInfo(`Stregkode ${code}. Open Food Facts havde intet navn, og årgangen er ikke bekræftet.`);
        return;
      }
      setSuggestions([{ name: product.name, producer: product.producer }]);
      setInfo(
        "Navn fra Open Food Facts. Stregkoden bekræfter ikke årgangen. Data: Open Food Facts (ODbL). Vælg forslaget, hvis det passer.",
      );
    } catch (e) {
      if (controller.signal.aborted) return;
      if (e instanceof Error && "status" in e && e.status === 429) {
        stopProvider("off", "Open Food Facts er midlertidigt brugt op. Der prøves ikke igen.");
        return;
      }
      setError("Stregkoden kunne ikke slås op.");
    } finally {
      setScanBusy(null);
    }
  }

  async function onGemini() {
    const blob = imageBlob.current;
    if (!blob || !geminiOn || stoppedRef.current.gemini) return;
    const controller = beginScan();
    setScanBusy("gemini");
    setGeminiAsk(false);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", blob, "label.jpg");
      const res = await fetch("/api/gemini-label", { method: "POST", body, signal: controller.signal });
      const data = (await res.json()) as {
        enabled?: boolean;
        error?: string;
        query?: string;
        name?: string;
        producer?: string;
        vintage?: string;
      };
      if (res.status === 429) {
        stopProvider("gemini", data.error || "Gemini er midlertidigt brugt op. Der prøves ikke igen.");
        return;
      }
      if (!res.ok || data.enabled === false) {
        setInfo("Gemini er ikke slået til.");
        return;
      }
      const read = data.query || [data.producer, data.name, data.vintage].filter(Boolean).join(" ");
      setInfo(
        read
          ? `Gemini læste «${read}». Bekræft forslaget, før det gemmes. Billedet er sendt til Google.`
          : "Gemini læste ingen etiket.",
      );
      if (read) {
        setQuery(read);
        await searchQuery(read, controller.signal);
      }
    } catch {
      if (!controller.signal.aborted) setError("Gemini svarede ikke.");
    } finally {
      setScanBusy(null);
    }
  }

  async function onSearch() {
    await searchQuery(query);
  }

  function onSave() {
    if (!form.name.trim()) {
      setError("Giv vinen et navn");
      return;
    }
    const wineType = form.wineType || undefined;
    const vintage = form.vintage ? Number(form.vintage) : undefined;
    const quantity = Math.min(99, Math.max(1, Number(form.quantity) || 1));
    const dates = savedDrinkDates({
      drinkFrom: form.drinkFrom,
      drinkBestBy: form.drinkBestBy,
      edited: drinkEdited,
      fallback: suggestDrinkWindow({
        vintage,
        wineType,
        addedAt: form.addedAt,
      }),
    });
    const id = crypto.randomUUID();
    const stored = storedDrinkWindow({
      drinkFrom: dates.drinkFrom,
      drinkBestBy: dates.drinkBestBy,
      provenance: dates.source,
      vintage,
      grape: drinkEdited ? null : grapeYearsFor(grape, vintage),
    });

    startTransition(() => {
      if (stored.provenance === "grapeminds" && grape?.identity && vintage && stored.drinkWindowVintage === vintage) {
        rememberGrapeWindow(id, {
          fromYear: Number(stored.drinkFrom?.slice(0, 4)),
          toYear: Number(stored.drinkBestBy?.slice(0, 4)),
          vintage,
          wineId: grape.identity.wineId,
          displayName: grape.identity.displayName,
          producer: grape.identity.producer,
        });
      }
      addBottle({
        id,
        name: form.name.trim(),
        producer: form.producer.trim() || undefined,
        vintage,
        wineType,
        region: form.region.trim() || undefined,
        country: form.country.trim() || undefined,
        grapes: form.grapes.trim() || undefined,
        notes: form.notes.trim() || undefined,
        imageDataUrl,
        addedAt: form.addedAt,
        drinkFrom: stored.drinkFrom,
        drinkBestBy: stored.drinkBestBy,
        quantity,
        status: "in_fridge",
        ...(stored.provenance ? { drinkWindowSource: stored.provenance } : {}),
        ...(stored.drinkWindowVintage !== undefined ? { drinkWindowVintage: stored.drinkWindowVintage } : {}),
        ...(grape?.identity && (grape.status === "ready" || grape.status === "pending")
          ? { grapeMatch: grape.identity }
          : {}),
        ...(matched && vintagesMatch(vintage, matched.vintage)
          ? {
              externalWineId: matched.id,
              ...(wineProfile ? { wineProfile, wineLookup: {
                externalWineId: matched.id,
                vintage: wineProfile.vintage,
                at: new Date().toISOString(),
                result: "ready" as const,
              } } : {}),
            }
          : {}),
      });
      router.push("/");
    });
  }

  return (
    <div className="space-y-5 pb-28">
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={identifying}
          className="relative flex min-h-28 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-dashed border-[rgba(196,163,90,0.35)] bg-[rgba(42,34,24,0.75)] px-4 py-6 text-center transition hover:bg-[rgba(52,40,28,0.9)]"
        >
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDataUrl}
              alt="Valgt etikette"
              className="absolute inset-0 size-full object-cover opacity-40"
            />
          ) : null}
          <div className="relative z-10 flex flex-col items-center gap-2">
            {identifying ? (
              <Loader2 className="size-8 animate-spin text-[var(--brand)]" />
            ) : (
              <Camera className="size-8 text-[var(--brand)]" />
            )}
            <p className="font-medium">
              {identifying ? "Genkender vin…" : "Tag foto af etiketten"}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Åbner kameraet på telefonen. Du kan altid rette forslaget bagefter.
            </p>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
        />
        <div className="grid gap-2">
          {imageDataUrl ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              disabled={scanBusy !== null || identifying}
              onClick={() => void onReadLocally()}
            >
              {scanBusy === "ocr" ? <Loader2 className="animate-spin" /> : null}
              Læs teksten på telefonen
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={scanBusy !== null || stopped.off}
            onClick={() => barcodeRef.current?.click()}
          >
            {scanBusy === "barcode" ? <Loader2 className="animate-spin" /> : null}
            Læs stregkode
          </Button>
          <input
            ref={barcodeRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void onBarcode(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Stregkoden slås op hos Open Food Facts og siger ikke hvilken årgang det er.
          </p>
          {geminiOn && imageDataUrl ? (
            geminiAsk ? (
              <div className="space-y-2 rounded-xl border border-[rgba(196,163,90,0.2)] px-3 py-3">
                <p className="text-sm">
                  Billedet forlader telefonen og sendes til Google Gemini på det gratis niveau. Google må
                  bruge de kald til at forbedre deres produkter. Der er ingen betalt reserve.
                </p>
                <div className="flex gap-2">
                  <Button type="button" className="min-h-11 flex-1" onClick={() => void onGemini()}>
                    Send dette billede
                  </Button>
                  <Button type="button" variant="ghost" className="min-h-11" onClick={() => setGeminiAsk(false)}>
                    Annuller
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={scanBusy !== null || stopped.gemini}
                onClick={() => setGeminiAsk(true)}
              >
                {scanBusy === "gemini" ? <Loader2 className="animate-spin" /> : null}
                Spørg Gemini om etiketten
              </Button>
            )
          ) : null}
          {scanBusy || identifying ? (
            <Button type="button" variant="ghost" className="min-h-11" onClick={stopScan}>
              Stop
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="search">Eller søg i WineAPI</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Fx Barolo, Chablis, Ridge…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onSearch();
              }
            }}
          />
          <Button type="button" variant="secondary" size="lg" className="shrink-0 px-4" onClick={() => void onSearch()} disabled={searching}>
            {searching ? <Loader2 className="animate-spin" /> : <Search />}
            Søg
          </Button>
        </div>
      </section>

      {suggestions.length > 0 ? (
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-[var(--brand)]" /> Forslag
          </p>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={`${s.externalWineId ?? s.name}-${i}`}>
                <button
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="min-h-11 w-full rounded-xl border border-[rgba(196,163,90,0.14)] bg-[rgba(28,22,18,0.9)] px-3 py-2 text-left transition hover:border-[rgba(196,163,90,0.35)]"
                >
                  <p className="font-medium leading-tight">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      s.producer,
                      s.vintage,
                      s.wineType ? WINE_TYPE_LABELS[s.wineType] : null,
                      s.region,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {grape && grapemindsOn && grape.status !== "ready" && !drinkEdited ? (
        <GrapeWindow
          status={grape.status}
          identity={grape.identity}
          choices={grape.choices}
          onChoose={(choice) =>
            void loadGrape({
              producer: form.producer,
              name: form.name,
              vintage: /^\d{4}$/.test(form.vintage) ? Number(form.vintage) : undefined,
              wineId: choice.wineId,
              displayName: choice.displayName,
              choiceProducer: choice.producer,
            })
          }
          onRetry={() =>
            grape.identity
              ? void loadGrape({
                  producer: form.producer,
                  name: form.name,
                  vintage: /^\d{4}$/.test(form.vintage) ? Number(form.vintage) : undefined,
                  wineId: grape.identity.wineId,
                  displayName: grape.identity.displayName,
                  choiceProducer: grape.identity.producer,
                })
              : undefined
          }
        />
      ) : null}

      {(error || info) && (
        <p
          className={
            error
              ? "rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-xl bg-[rgba(196,163,90,0.12)] px-3 py-2 text-sm text-[var(--brass)]"
          }
        >
          {error || info}
        </p>
      )}

      <section className="grid gap-3">
        <Field label="Navn *" id="name">
          <Input
            id="name"
            value={form.name}
            onChange={(e) => {
              setGrape(null);
              setForm({ ...form, name: e.target.value });
            }}
            placeholder="Vinens navn"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Årgang" id="vintage">
            <Input
              id="vintage"
              inputMode="numeric"
              value={form.vintage}
              onChange={(e) => setForm({ ...form, vintage: e.target.value })}
              placeholder="2019"
            />
          </Field>
          <Field label="Type" id="wineType">
            <select
              id="wineType"
              className="h-11 min-h-11 w-full rounded-lg border border-input bg-background px-2.5 text-base"
              value={form.wineType}
              onChange={(e) =>
                setForm({ ...form, wineType: e.target.value as WineType | "" })
              }
            >
              <option value="">Vælg…</option>
              {WINE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WINE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Antal flasker" id="quantity">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="quantity"
              inputMode="numeric"
              className="max-w-[6rem]"
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: e.target.value.replace(/[^\d]/g, "").slice(0, 2),
                })
              }
            />
            <div className="flex flex-wrap gap-1.5">
              {[1, 6, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, quantity: String(n) })}
                  className={`min-h-11 rounded-full border px-3 text-sm transition ${
                    form.quantity === String(n)
                      ? "border-[rgba(196,163,90,0.55)] bg-[rgba(196,163,90,0.16)] text-[var(--brass)]"
                      : "border-[rgba(196,163,90,0.18)] text-muted-foreground hover:border-[rgba(196,163,90,0.35)]"
                  }`}
                >
                  {n === 1 ? "1 flaske" : `${n} (kasse)`}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Købt en kasse? Vælg antal, så tælles de som én post på hylden.
          </p>
        </Field>
        <DrinkWindowSummary
          drinkFrom={form.drinkFrom}
          drinkBestBy={form.drinkBestBy}
          edited={drinkEdited}
          ownDates={ownDates}
          vintage={/^\d{4}$/.test(form.vintage) ? Number(form.vintage) : undefined}
          grape={grape}
          onOwnDates={() => setOwnDates(true)}
        />
        <button
          type="button"
          className="min-h-11 text-left text-sm text-[var(--brass)] underline-offset-4 hover:underline"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          {detailsOpen ? "Skjul detaljer" : "Flere detaljer"}
        </button>
        {detailsOpen ? (
          <div className="grid gap-3">
        <Field label="Producent" id="producer">
          <Input
            id="producer"
            value={form.producer}
            onChange={(e) => {
              setGrape(null);
              setForm({ ...form, producer: e.target.value });
            }}
          />
        </Field>
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          <Field label="Region" id="region">
            <Input
              id="region"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            />
          </Field>
          <Field label="Land" id="country">
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Druer" id="grapes">
          <Input
            id="grapes"
            value={form.grapes}
            onChange={(e) => setForm({ ...form, grapes: e.target.value })}
          />
        </Field>
        <Field label="Lagt i køleskab" id="addedAt">
          <Input
            id="addedAt"
            type="date"
            value={form.addedAt}
            onChange={(e) => setForm({ ...form, addedAt: e.target.value })}
          />
        </Field>
        {ownDates || drinkEdited || !grapeYearsFor(grape, /^\d{4}$/.test(form.vintage) ? Number(form.vintage) : undefined) ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          <Field label="Bedst fra" id="drinkFrom">
            <Input
              id="drinkFrom"
              type="date"
              value={form.drinkFrom}
              onChange={(e) => {
                setDrinkEdited(true);
                setForm({ ...form, drinkFrom: e.target.value });
              }}
            />
          </Field>
          <Field label="Bedst til" id="drinkBestBy">
            <Input
              id="drinkBestBy"
              type="date"
              value={form.drinkBestBy}
              onChange={(e) => {
                setDrinkEdited(true);
                setForm({ ...form, drinkBestBy: e.target.value });
              }}
            />
          </Field>
        </div>
        ) : (
          <p className="text-sm text-muted-foreground">Datoerne står ovenfor. Skriv egne datoer, hvis de skal gemmes i stedet.</p>
        )}
        <Field label="Noter" id="notes">
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Hyldesplads, gave fra…."
          />
        </Field>
          </div>
        ) : null}
      </section>

      <ThumbBar>
        <Button
          type="button"
          size="lg"
          className="w-full text-base"
          onClick={onSave}
          disabled={pending || identifying}
        >
          {pending ? <Loader2 className="animate-spin" /> : null}
          {Number(form.quantity) > 1
            ? `Gem ${Math.min(99, Math.max(1, Number(form.quantity) || 1))} flasker`
            : "Gem i køleskabet"}
        </Button>
      </ThumbBar>
    </div>
  );
}

function DrinkWindowSummary({
  drinkFrom,
  drinkBestBy,
  edited,
  ownDates,
  vintage,
  grape,
  onOwnDates,
}: {
  drinkFrom: string;
  drinkBestBy: string;
  edited: boolean;
  ownDates: boolean;
  vintage?: number;
  grape: { status: string; fromOffset?: number; toOffset?: number } | null;
  onOwnDates: () => void;
}) {
  const dates = savedDrinkDates({
    drinkFrom,
    drinkBestBy,
    edited,
    fallback: drinkFrom || drinkBestBy ? { drinkFrom, drinkBestBy } : undefined,
  });
  const shown = effectiveDrinkWindow({
    drinkFrom: dates.drinkFrom,
    drinkBestBy: dates.drinkBestBy,
    provenance: edited ? "manual" : dates.drinkFrom || dates.drinkBestBy ? "estimate" : undefined,
    vintage,
    grape: ownDates ? null : grapeYearsFor(grape, vintage),
  });
  if (shown.source === "unavailable" && !drinkFrom && !drinkBestBy) return null;
  return (
    <div className="space-y-1 rounded-xl border border-[rgba(196,163,90,0.16)] px-3 py-3">
      <p className="text-sm">Bedst fra {formatDateDa(shown.drinkFrom)}</p>
      <p className="text-sm">Bedst til {formatDateDa(shown.drinkBestBy)}</p>
      <p className="text-xs text-muted-foreground">{windowSourceCaption(shown.source)}</p>
      {shown.source === "grapeminds" ? (
        <button type="button" className="min-h-11 text-sm text-[var(--brass)] underline" onClick={onOwnDates}>
          Skriv egne datoer
        </button>
      ) : null}
    </div>
  );
}

function grapeYearsFor(
  grape: { status: string; fromOffset?: number; toOffset?: number } | null,
  vintage?: number,
) {
  if (grape?.status !== "ready" || grape.fromOffset === undefined || grape.toOffset === undefined) return null;
  const window = yearsAfterVintage(grape.fromOffset, grape.toOffset, vintage);
  if (!window.ok || window.fromYear === undefined || window.toYear === undefined || vintage === undefined) return null;
  return { fromYear: window.fromYear, toYear: window.toYear, vintage };
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
