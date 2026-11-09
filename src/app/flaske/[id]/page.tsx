"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { ThumbBar } from "@/components/thumb-bar";
import { WineBottleSvg } from "@/components/wine/wine-bottle-svg";
import { GrapeWindow, type GrapeWindowStatus } from "@/components/wine/grape-window";
import { WineFacts } from "@/components/wine/wine-facts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBottles } from "@/hooks/use-bottles";
import { drinkStatusLabel, formatDateDa } from "@/lib/drink-window";
import type { GrapeIdentity } from "@/lib/grapeminds";
import type { WineProfile } from "@/lib/wine-profile";
import { vintagesMatch } from "@/lib/wine-profile";
import { WINE_TYPE_LABELS } from "@/lib/wine-types";

export default function BottlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { bottles, hydrated, takeOut, addBottle } = useBottles();
  const [confirming, setConfirming] = useState(false);
  const [takeCount, setTakeCount] = useState("1");
  const asked = useRef<string | null>(null);
  const grapeAsked = useRef<string | null>(null);
  const [grape, setGrape] = useState<{
    status: GrapeWindowStatus;
    identity?: GrapeIdentity;
    fromOffset?: number;
    toOffset?: number;
  } | null>(null);

  const bottle = useMemo(
    () => bottles.find((b) => b.id === params.id),
    [bottles, params.id],
  );

  useEffect(() => {
    if (!bottle?.externalWineId || bottle.wineProfile || bottle.wineLookup) return;
    const key = `${bottle.id}:${bottle.externalWineId}:${bottle.vintage ?? ""}`;
    if (asked.current === key) return;
    asked.current = key;
    const snapshot = bottle;
    const id = snapshot.externalWineId;
    if (!id) return;
    const query = new URLSearchParams({ id });
    if (snapshot.vintage !== undefined) query.set("vintage", String(snapshot.vintage));
    fetch(`/api/wine-detail?${query}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          profile?: WineProfile | null;
          reason?: string;
        } | null;
        const profile = data?.profile ?? undefined;
        const matched = Boolean(profile && vintagesMatch(snapshot.vintage, profile.vintage));
        const result =
          data?.reason === "vintage_mismatch" ? "mismatch" : matched ? "ready" : "unavailable";
        addBottle({
          ...snapshot,
          ...(matched && profile ? { wineProfile: profile } : {}),
          wineLookup: {
            externalWineId: id,
            vintage: profile?.vintage ?? snapshot.vintage ?? null,
            at: new Date().toISOString(),
            result,
          },
        });
      })
      .catch(() => {
        addBottle({
          ...snapshot,
          wineLookup: {
            externalWineId: id,
            vintage: snapshot.vintage ?? null,
            at: new Date().toISOString(),
            result: "unavailable",
          },
        });
      });
  }, [bottle, addBottle]);

  function loadGrapeWindow(match: GrapeIdentity, vintage: number | undefined, force = false) {
    const key = `${match.wineId}:${vintage ?? ""}`;
    if (!force && grapeAsked.current === key) return;
    grapeAsked.current = key;
    setGrape({ status: "loading", identity: match });
    fetch("/api/grapeminds-window", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: match.displayName,
        producer: match.producer,
        vintage,
        wineId: match.wineId,
        displayName: match.displayName,
        choiceProducer: match.producer,
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          enabled?: boolean;
          status?: GrapeWindowStatus;
          identity?: GrapeIdentity;
          fromOffset?: number;
          toOffset?: number;
        } | null;
        if (!data?.enabled) {
          setGrape({ status: "missing_key", identity: match });
          return;
        }
        if (data.status === "stopped") {
          grapeAsked.current = `stopped:${key}`;
        }
        setGrape({
          status: data.status ?? "unavailable",
          identity: data.identity ?? match,
          fromOffset: data.fromOffset,
          toOffset: data.toOffset,
        });
      })
      .catch(() => setGrape({ status: "unavailable", identity: match }));
  }

  useEffect(() => {
    if (!bottle?.grapeMatch) return;
    loadGrapeWindow(bottle.grapeMatch, bottle.vintage);
    // The match id and vintage decide the request. The function identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottle?.id, bottle?.grapeMatch?.wineId, bottle?.vintage]);

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Henter flaske…</p>;
  }

  if (!bottle) {
    return (
      <div className="space-y-3">
        <p className="font-medium text-[var(--brass)]">Flasken findes ikke</p>
        <Button asChild variant="secondary">
          <Link href="/">Tilbage</Link>
        </Button>
      </div>
    );
  }

  const status = drinkStatusLabel(bottle);
  const qty = Math.max(1, bottle.quantity || 1);
  const take = Math.min(qty, Math.max(1, Number(takeCount) || 1));

  return (
    <div className="space-y-5 pb-28">
      <Button asChild variant="ghost" className="-ml-2 h-11 min-h-11 px-3 text-[var(--brass)]">
        <Link href="/">
          <ArrowLeft /> Tilbage
        </Link>
      </Button>

      <div className="overflow-hidden rounded-2xl border border-[rgba(196,163,90,0.18)] bg-[rgba(28,22,18,0.92)] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.8)]">
        {bottle.imageDataUrl ? (
          <div className="bg-[#1a120e]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bottle.imageDataUrl}
              alt=""
              className="max-h-48 w-full object-contain"
            />
          </div>
        ) : null}
        <div className="space-y-3 px-4 py-4">
          <div className="flex items-end gap-3">
            <WineBottleSvg
              wineType={bottle.wineType}
              imageUrl={bottle.imageDataUrl ?? bottle.wineProfile?.imageUrl}
              name={bottle.name}
              vintage={bottle.vintage}
              className="bottle-figure h-36 w-auto shrink-0"
            />
            <div className="min-w-0 pb-1">
              <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight tracking-tight text-[var(--brass)]">
                {bottle.name}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {[
                  bottle.producer,
                  bottle.vintage,
                  bottle.wineType ? WINE_TYPE_LABELS[bottle.wineType] : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          <p className="inline-flex rounded-md bg-[rgba(196,163,90,0.14)] px-2 py-1 text-sm text-[var(--brass)]">
            {status.label}
          </p>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <Item label="Region" value={[bottle.region, bottle.country].filter(Boolean).join(", ")} />
            <Item label="Druer" value={bottle.grapes} />
            <Item label="Antal" value={qty > 1 ? `${qty} flasker` : "1 flaske"} />
            <Item label="Indlagt" value={formatDateDa(bottle.addedAt)} />
            <Item label="Bedst fra" value={formatDateDa(bottle.drinkFrom)} />
            <Item label="Bedst til" value={formatDateDa(bottle.drinkBestBy)} />
            <Item
              label="Status"
              value={bottle.status === "in_fridge" ? "I køleskabet" : "Taget ud"}
            />
            {bottle.removedAt ? (
              <Item label="Taget ud" value={formatDateDa(bottle.removedAt)} />
            ) : null}
          </dl>
          {bottle.grapeMatch ? (
            <GrapeWindow
              status={grape?.status ?? "loading"}
              identity={grape?.identity ?? bottle.grapeMatch}
              fromOffset={grape?.fromOffset}
              toOffset={grape?.toOffset}
              vintage={bottle.vintage}
              onRetry={
                grape?.status === "pending"
                  ? () => loadGrapeWindow(bottle.grapeMatch!, bottle.vintage, true)
                  : undefined
              }
            />
          ) : null}
          {bottle.drinkWindowSource ? (
            <p className="text-xs text-muted-foreground">
              {bottle.drinkWindowSource === "manual"
                ? "Datoerne er dem, du har skrevet."
                : "Datoerne er et skøn ud fra type og årgang."}
            </p>
          ) : null}

          {bottle.notes ? (
            <p className="rounded-xl bg-muted/80 px-3 py-2 text-sm text-muted-foreground">
              {bottle.notes}
            </p>
          ) : null}
          {bottle.wineProfile ? <WineFacts profile={bottle.wineProfile} /> : null}
        </div>
      </div>

      {bottle.status === "in_fridge" ? (
        <ThumbBar>
          {!confirming ? (
            <Button
              size="lg"
              className="w-full"
              variant="destructive"
              onClick={() => {
                setTakeCount("1");
                setConfirming(true);
              }}
            >
              <DoorOpen /> Tag ud af køleskabet
            </Button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-[rgba(196,163,90,0.2)] bg-[#1c1612] p-3">
              {qty > 1 ? (
                <div className="space-y-1.5">
                  <Label htmlFor="takeCount">Hvor mange flasker?</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="takeCount"
                      inputMode="numeric"
                      className="max-w-[5.5rem]"
                      value={takeCount}
                      onChange={(e) =>
                        setTakeCount(e.target.value.replace(/[^\d]/g, "").slice(0, 2))
                      }
                    />
                    <span className="text-sm text-muted-foreground">af {qty}</span>
                    <button
                      type="button"
                      className="ml-auto min-h-11 px-2 text-sm text-[var(--brass)] underline-offset-2 hover:underline"
                      onClick={() => setTakeCount(String(qty))}
                    >
                      Alle
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">Bekræft at flasken er taget ud?</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    takeOut(bottle.id, take);
                    router.push(take >= qty ? "/historik" : "/");
                  }}
                >
                  {take >= qty
                    ? qty > 1
                      ? `Ja, tag alle ${qty} ud`
                      : "Ja, tag ud"
                    : `Tag ${take} ud`}
                </Button>
                <Button size="lg" className="flex-1" variant="secondary" onClick={() => setConfirming(false)}>
                  Annuller
                </Button>
              </div>
            </div>
          )}
        </ThumbBar>
      ) : null}
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-[var(--foreground)]">{value || "—"}</dd>
    </div>
  );
}
