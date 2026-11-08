"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBottles } from "@/hooks/use-bottles";
import { drinkStatusLabel, formatDateDa } from "@/lib/drink-window";

export default function BottlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { bottles, hydrated, takeOut } = useBottles();
  const [confirming, setConfirming] = useState(false);

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
        <p className="font-medium">Flasken findes ikke</p>
        <Button asChild variant="secondary">
          <Link href="/">Tilbage</Link>
        </Button>
      </div>
    );
  }

  const status = drinkStatusLabel(bottle);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft /> Tilbage
        </Link>
      </Button>

      <div className="overflow-hidden rounded-[1.75rem] bg-white/60 shadow-[0_18px_40px_-30px_rgba(20,40,30,0.55)]">
        <div className="aspect-[4/3] bg-[var(--brand-soft)]">
          {bottle.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bottle.imageDataUrl}
              alt={bottle.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[var(--brand)]">
              Ingen etiket
            </div>
          )}
        </div>
        <div className="space-y-3 px-5 py-5">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight tracking-tight">
              {bottle.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {[bottle.producer, bottle.vintage, bottle.wineType]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <p className="inline-flex rounded-md bg-[var(--brand-soft)] px-2 py-1 text-sm text-[var(--brand)]">
            {status.label}
          </p>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <Item label="Region" value={[bottle.region, bottle.country].filter(Boolean).join(", ")} />
            <Item label="Druer" value={bottle.grapes} />
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
            <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm">{bottle.notes}</p>
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
              onClick={() => setConfirming(true)}
            >
              <DoorOpen /> Tag ud af køleskabet
            </Button>
          ) : (
            <div className="space-y-2 rounded-2xl bg-white/70 p-4">
              <p className="text-sm">Bekræft at flasken er taget ud?</p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    takeOut(bottle.id);
                    router.push("/historik");
                  }}
                >
                  Ja, tag ud
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
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
