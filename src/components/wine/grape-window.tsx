"use client";

import type { GrapeIdentity } from "@/lib/grapeminds";

export type GrapeWindowStatus =
  | "loading"
  | "ready"
  | "ambiguous"
  | "unavailable"
  | "pending"
  | "stopped"
  | "missing_key";

export function GrapeWindow({
  status,
  identity,
  choices,
  onChoose,
  onRetry,
}: {
  status: GrapeWindowStatus;
  identity?: GrapeIdentity | null;
  choices?: GrapeIdentity[];
  onChoose?: (choice: GrapeIdentity) => void;
  onRetry?: () => void;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-[rgba(196,163,90,0.2)] bg-[rgba(28,22,18,0.9)] px-3 py-3">
      <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--brass)]">GrapeMinds-skøn</h2>
      <p className="text-sm text-muted-foreground">
        Gælder vinen generelt, ikke en analyse af denne årgang. Ikke alle vine findes.
      </p>
      {identity && status !== "ready" ? (
        <p className="text-sm">
          Matchet vin: {identity.producer ? `${identity.producer}, ` : ""}
          {identity.displayName}
        </p>
      ) : null}
      {status === "loading" ? <p className="text-sm">Henter skøn…</p> : null}
      {status === "ambiguous" ? (
        <div className="space-y-2">
          <p className="text-sm">Flere vine ligner. Vælg den rigtige, eller lad feltet stå.</p>
          <ul className="space-y-2">
            {(choices ?? []).map((choice) => (
              <li key={choice.wineId}>
                <button
                  type="button"
                  className="min-h-11 w-full rounded-xl border border-[rgba(196,163,90,0.2)] px-3 py-2 text-left text-sm"
                  onClick={() => onChoose?.(choice)}
                >
                  {[choice.producer, choice.displayName].filter(Boolean).join(", ")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {status === "unavailable" ? (
        <p className="text-sm">Ingen sikker GrapeMinds-vin til det her navn.</p>
      ) : null}
      {status === "pending" ? (
        <div className="space-y-2">
          <p className="text-sm">GrapeMinds har ikke vinduet endnu.</p>
          {onRetry ? (
            <button type="button" className="min-h-11 text-sm text-[var(--brass)] underline" onClick={onRetry}>
              Prøv igen
            </button>
          ) : null}
        </div>
      ) : null}
      {status === "stopped" ? (
        <p className="text-sm">GrapeMinds er ikke tilgængeligt. Der prøves ikke igen.</p>
      ) : null}
      {status === "missing_key" ? (
        <p className="text-sm">Serveren har ingen GrapeMinds-nøgle, så skønnet hentes ikke.</p>
      ) : null}
    </section>
  );
}
