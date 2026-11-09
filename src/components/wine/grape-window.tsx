"use client";

import type { GrapeIdentity } from "@/lib/grapeminds";
import { yearsAfterVintage } from "@/lib/scan-sources";

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
  fromOffset,
  toOffset,
  vintage,
  onChoose,
  onRetry,
}: {
  status: GrapeWindowStatus;
  identity?: GrapeIdentity | null;
  choices?: GrapeIdentity[];
  fromOffset?: number;
  toOffset?: number;
  vintage?: number;
  onChoose?: (choice: GrapeIdentity) => void;
  onRetry?: () => void;
}) {
  const dated =
    status === "ready" && fromOffset !== undefined && toOffset !== undefined
      ? yearsAfterVintage(fromOffset, toOffset, vintage)
      : null;

  return (
    <section className="space-y-2 rounded-xl border border-[rgba(196,163,90,0.2)] bg-[rgba(28,22,18,0.9)] px-3 py-3">
      <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--brass)]">GrapeMinds-skøn</h2>
      <p className="text-sm text-muted-foreground">
        Gælder vinen generelt, ikke en analyse af denne årgang. Ikke alle vine findes.
      </p>
      {identity ? (
        <p className="text-sm">
          Matchet vin: {identity.producer ? `${identity.producer}, ` : ""}
          {identity.displayName}
        </p>
      ) : null}
      {dated?.ok && dated.fromYear !== undefined && dated.toYear !== undefined ? (
        <p className="text-sm">
          For årgang {vintage}: {dated.fromYear}–{dated.toYear}. Det er {dated.fromOffset}–{dated.toOffset}{" "}
          år efter årgangen.
        </p>
      ) : null}
      {dated?.ok && dated.fromYear === undefined ? (
        <p className="text-sm">
          Årgang mangler, så der beregnes ingen årstal. Vinduet er {dated.fromOffset}–{dated.toOffset} år efter
          årgangen.
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
      <p className="text-xs text-muted-foreground">
        Datoerne på flasken er dine eller et groft typeskøn. De overtages ikke herfra.
      </p>
    </section>
  );
}
