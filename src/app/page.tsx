"use client";

import Link from "next/link";
import { Plus, Refrigerator } from "lucide-react";
import { BottleListItem } from "@/components/wine/bottle-list-item";
import { Button } from "@/components/ui/button";
import { useBottles } from "@/hooks/use-bottles";

export default function HomePage() {
  const { inFridge, hydrated } = useBottles();

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,var(--brand)_0%,#1f3d34_48%,#0f241f_100%)] px-5 py-6 text-[var(--brand-foreground)] shadow-[0_20px_50px_-28px_rgba(20,40,30,0.7)]">
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(232,214,170,0.35),transparent_70%)]"
          aria-hidden
        />
        <p className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-tight">
          Winefridge
        </p>
        <p className="mt-2 max-w-[16rem] text-sm text-white/80">
          Hvad ligger der koldt lige nu — og hvornår er det bedst at drikke?
        </p>
        <p className="mt-4 text-4xl font-semibold tabular-nums">
          {hydrated ? inFridge.length : "·"}
          <span className="ml-2 text-base font-normal text-white/70">flasker</span>
        </p>
      </section>

      {!hydrated ? (
        <p className="text-sm text-muted-foreground">Henter køleskab…</p>
      ) : inFridge.length === 0 ? (
        <section className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-[var(--brand)]/30 bg-white/40 px-5 py-8">
          <Refrigerator className="size-8 text-[var(--brand)]" />
          <div>
            <h1 className="text-lg font-semibold">Køleskabet er tomt</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tag et billede af næste flaske, så registrerer vi den med dato og drikkevindue.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/tilfoej">
              <Plus /> Tilføj første flaske
            </Link>
          </Button>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-lg font-semibold">I køleskabet</h1>
            <Button asChild variant="secondary" size="sm">
              <Link href="/tilfoej">
                <Plus /> Tilføj
              </Link>
            </Button>
          </div>
          <ul className="space-y-2.5">
            {inFridge.map((bottle) => (
              <li key={bottle.id}>
                <BottleListItem bottle={bottle} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
