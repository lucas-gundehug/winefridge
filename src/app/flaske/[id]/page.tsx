"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBottles } from "@/hooks/use-bottles";
import { drinkStatusLabel, formatDateDa } from "@/lib/drink-window";
import { WINE_TYPE_LABELS } from "@/lib/wine-types";

export default function BottlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { bottles, hydrated, takeOut } = useBottles();
  const [confirming, setConfirming] = useState(false);
  const [takeCount, setTakeCount] = useState("1");

  const bottle = useMemo(
    () => bottles.find((b) => b.id === params.id),
    [bottles, params.id],
  );

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
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-[var(--brass)]">
        <Link href="/">
          <ArrowLeft /> Tilbage
        </Link>
      </Button>

      <div className="overflow-hidden rounded-2xl border border-[rgba(196,163,90,0.18)] bg-[rgba(28,22,18,0.92)] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.8)]">
        <div className="aspect-[4/3] bg-[rgba(42,34,24,0.9)]">
          {bottle.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bottle.imageDataUrl}
              alt={bottle.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-[var(--brass-dim)]">
              Ingen etiket
            </div>
          )}
        </div>
        <div className="space-y-3 px-5 py-5">
          <div>
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

          {bottle.notes ? (
            <p className="rounded-xl bg-muted/80 px-3 py-2 text-sm text-muted-foreground">
              {bottle.notes}
            </p>
          ) : null}
        </div>
      </div>

      {bottle.status === "in_fridge" ? (
        <div className="space-y-2">
          {!confirming ? (
            <Button
              size="lg"
              className="h-11 w-full"
              variant="destructive"
              onClick={() => {
                setTakeCount("1");
                setConfirming(true);
              }}
            >
              <DoorOpen /> Tag ud af køleskabet
            </Button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-[rgba(196,163,90,0.2)] bg-[rgba(28,22,18,0.95)] p-4">
              {qty > 1 ? (
                <div className="space-y-1.5">
                  <Label htmlFor="takeCount">Hvor mange flasker?</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="takeCount"
                      inputMode="numeric"
                      className="max-w-[5rem]"
                      value={takeCount}
                      onChange={(e) =>
                        setTakeCount(e.target.value.replace(/[^\d]/g, "").slice(0, 2))
                      }
                    />
                    <span className="text-sm text-muted-foreground">af {qty}</span>
                    <button
                      type="button"
                      className="ml-auto text-xs text-[var(--brass)] underline-offset-2 hover:underline"
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
                <Button className="flex-1" variant="secondary" onClick={() => setConfirming(false)}>
                  Annuller
                </Button>
              </div>
            </div>
          )}
        </div>
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
