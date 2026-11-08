"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileToCompressedDataUrl } from "@/lib/image";
import { suggestDrinkWindow } from "@/lib/drink-window";
import type { IdentifyResponse, WineSuggestion, WineType } from "@/lib/types";
import { WINE_TYPE_LABELS, WINE_TYPES } from "@/lib/wine-types";
import { useBottles } from "@/hooks/use-bottles";

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
  const { addBottle } = useBottles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [identifying, setIdentifying] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<WineSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);

  function applySuggestion(s: WineSuggestion) {
    const window =
      s.drinkFrom && s.drinkBestBy
        ? { drinkFrom: s.drinkFrom, drinkBestBy: s.drinkBestBy }
        : suggestDrinkWindow({
            vintage: s.vintage,
            wineType: s.wineType,
            addedAt: form.addedAt,
          });
    setForm((f) => ({
      ...f,
      name: s.name || f.name,
      producer: s.producer || "",
      vintage: s.vintage ? String(s.vintage) : "",
      wineType: s.wineType || "",
      region: s.region || "",
      country: s.country || "",
      grapes: s.grapes || "",
      drinkFrom: window.drinkFrom || "",
      drinkBestBy: window.drinkBestBy || "",
    }));
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    setError(null);
    setInfo(null);
    setIdentifying(true);
    try {
      const { dataUrl, blob } = await fileToCompressedDataUrl(file);
      setImageDataUrl(dataUrl);

      const body = new FormData();
      body.append("image", blob, "label.jpg");
      const res = await fetch("/api/identify-wine", { method: "POST", body });
      const data = (await res.json()) as IdentifyResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Genkendelse fejlede");

      setSuggestions(data.suggestions ?? []);
      if (data.suggestion) {
        applySuggestion(data.suggestion);
        setInfo("Forslag fra WineAPI — ret gerne inden du gemmer.");
      } else {
        setInfo(data.message || "Ingen match. Udfyld manuelt eller søg.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke læse billedet");
    } finally {
      setIdentifying(false);
    }
  }

  async function onSearch() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/search-wine?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as {
        results?: WineSuggestion[];
        error?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.error || "Søgning fejlede");
      setSuggestions(data.results ?? []);
      if (!(data.results && data.results.length)) {
        setInfo(data.message || "Ingen resultater — prøv et andet navn.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Søgning fejlede");
    } finally {
      setSearching(false);
    }
  }

  function onSave() {
    if (!form.name.trim()) {
      setError("Giv vinen et navn");
      return;
    }
    const wineType = form.wineType || undefined;
    const vintage = form.vintage ? Number(form.vintage) : undefined;
    const quantity = Math.min(99, Math.max(1, Number(form.quantity) || 1));
    const window =
      form.drinkFrom && form.drinkBestBy
        ? { drinkFrom: form.drinkFrom, drinkBestBy: form.drinkBestBy }
        : suggestDrinkWindow({
            vintage,
            wineType,
            addedAt: form.addedAt,
          });

    startTransition(() => {
      addBottle({
        id: crypto.randomUUID(),
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
        drinkFrom: window.drinkFrom,
        drinkBestBy: window.drinkBestBy,
        quantity,
        status: "in_fridge",
      });
      router.push("/");
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={identifying}
          className="relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-dashed border-[rgba(196,163,90,0.35)] bg-[rgba(42,34,24,0.75)] px-4 py-10 text-center transition hover:bg-[rgba(52,40,28,0.9)]"
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
          <Button type="button" variant="secondary" onClick={() => void onSearch()} disabled={searching}>
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
                  className="w-full rounded-xl border border-[rgba(196,163,90,0.14)] bg-[rgba(28,22,18,0.9)] px-3 py-2 text-left transition hover:border-[rgba(196,163,90,0.35)]"
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
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Vinens navn"
          />
        </Field>
        <Field label="Producent" id="producer">
          <Input
            id="producer"
            value={form.producer}
            onChange={(e) => setForm({ ...form, producer: e.target.value })}
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
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
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
          <div className="flex items-center gap-2">
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
            <div className="flex gap-1.5">
              {[1, 6, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, quantity: String(n) })}
                  className={`rounded-md border px-2.5 py-1 text-xs transition ${
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
        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bedst fra" id="drinkFrom">
            <Input
              id="drinkFrom"
              type="date"
              value={form.drinkFrom}
              onChange={(e) => setForm({ ...form, drinkFrom: e.target.value })}
            />
          </Field>
          <Field label="Bedst til" id="drinkBestBy">
            <Input
              id="drinkBestBy"
              type="date"
              value={form.drinkBestBy}
              onChange={(e) => setForm({ ...form, drinkBestBy: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Noter" id="notes">
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Hyldesplads, gave fra…."
          />
        </Field>
      </section>

      <Button
        type="button"
        size="lg"
        className="h-11 w-full text-base"
        onClick={onSave}
        disabled={pending || identifying}
      >
        {pending ? <Loader2 className="animate-spin" /> : null}
        {Number(form.quantity) > 1
          ? `Gem ${Math.min(99, Math.max(1, Number(form.quantity) || 1))} flasker`
          : "Gem i køleskabet"}
      </Button>
    </div>
  );
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
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
