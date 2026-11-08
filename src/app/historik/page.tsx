"use client";

import Link from "next/link";
import { BottleListItem } from "@/components/wine/bottle-list-item";
import { useBottles } from "@/hooks/use-bottles";
import { formatDateDa } from "@/lib/drink-window";

export default function HistoryPage() {
  const { history, hydrated } = useBottles();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Historik</h1>
        <p className="text-sm text-muted-foreground">Flasker du har taget ud af køleskabet.</p>
      </div>

      {!hydrated ? (
        <p className="text-sm text-muted-foreground">Henter…</p>
      ) : history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--brand)]/30 bg-white/40 px-5 py-8">
          <p className="font-medium">Ingen historik endnu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Når du tager en flaske ud, dukker den op her.
          </p>
          <Link href="/" className="mt-3 inline-block text-sm text-[var(--brand)] underline-offset-4 hover:underline">
            Tilbage til køleskabet
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {history.map((bottle) => (
            <li key={bottle.id} className="space-y-1">
              <BottleListItem bottle={bottle} />
              <p className="px-1 text-xs text-muted-foreground">
                Taget ud {formatDateDa(bottle.removedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
