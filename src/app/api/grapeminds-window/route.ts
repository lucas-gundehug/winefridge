import { NextResponse } from "next/server";
import {
  grapeHttpOutcome,
  grapeSearchQuery,
  matchGrapemindsWines,
  publicGrapeWindow,
  type GrapeCandidate,
  type GrapeIdentity,
} from "@/lib/grapeminds";
import { grapemindsEnabled } from "@/lib/scan-sources";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store" };
const BASE = "https://api.grapeminds.eu/public/v1";

/**
 * Live lookup when GRAPEMINDS_API_KEY is set.
 * Supplemental API terms (27 April 2026) prohibit storage and permanent archiving of API data
 * outside the integration. The paid Persistent Storage License is the right to store drinking
 * periods offline. This route never calls /licence. It returns the numeric window for the
 * current response and drops statement, young, ripe and storage.
 */
export async function POST(request: Request) {
  if (!grapemindsEnabled(process.env)) {
    return NextResponse.json({ enabled: false, reason: "missing_key" }, { headers: NO_STORE });
  }

  const body = (await request.json().catch(() => null)) as {
    producer?: string;
    name?: string;
    vintage?: number;
    wineId?: number;
    displayName?: string;
    choiceProducer?: string;
  } | null;
  const vintage = Number.isInteger(body?.vintage) ? body?.vintage : undefined;
  const chosenId = Number.isInteger(body?.wineId) && (body?.wineId ?? 0) > 0 ? body?.wineId : undefined;
  const key = process.env.GRAPEMINDS_API_KEY ?? "";
  const headers = { authorization: `Bearer ${key}`, accept: "application/json" };

  let identity: GrapeIdentity | undefined;
  if (chosenId && body?.displayName?.trim()) {
    identity = {
      wineId: chosenId,
      displayName: body.displayName.trim(),
      producer: body.choiceProducer?.trim() || body.producer?.trim() || "",
    };
  } else {
    const query = grapeSearchQuery(body?.producer, body?.name);
    if (!query || !body?.name?.trim()) {
      return NextResponse.json({ enabled: true, status: "unavailable" }, { headers: NO_STORE });
    }
    const search = await fetch(`${BASE}/wines/search?${new URLSearchParams({ q: query, limit: "8" })}`, {
      headers,
      signal: request.signal,
    });
    const searchOutcome = grapeHttpOutcome(search.status);
    if (searchOutcome === "stopped") {
      return NextResponse.json({ enabled: true, status: "stopped", http: search.status }, { headers: NO_STORE });
    }
    if (searchOutcome !== "ok") {
      return NextResponse.json({ enabled: true, status: "unavailable" }, { headers: NO_STORE });
    }
    const found = (await search.json().catch(() => null)) as { data?: GrapeCandidate[] } | null;
    const decision = matchGrapemindsWines(
      { producer: body.producer, name: body.name },
      found?.data ?? [],
    );
    if (decision.status === "unavailable") {
      return NextResponse.json({ enabled: true, status: "unavailable" }, { headers: NO_STORE });
    }
    if (decision.status === "ambiguous") {
      return NextResponse.json(
        { enabled: true, status: "ambiguous", choices: decision.choices },
        { headers: NO_STORE },
      );
    }
    identity = decision.identity;
  }

  const period = await fetch(`${BASE}/drinking-periods/${identity.wineId}?lang=da`, {
    headers,
    signal: request.signal,
  });
  const periodOutcome = grapeHttpOutcome(period.status);
  if (periodOutcome === "stopped") {
    return NextResponse.json(
      { enabled: true, status: "stopped", http: period.status, identity },
      { headers: NO_STORE },
    );
  }
  if (periodOutcome === "missing") {
    const flag = (await period.json().catch(() => null)) as { generating?: boolean } | null;
    return NextResponse.json(
      { enabled: true, status: flag?.generating === true ? "pending" : "unavailable", identity },
      { headers: NO_STORE },
    );
  }
  if (periodOutcome !== "ok") {
    return NextResponse.json({ enabled: true, status: "unavailable", identity }, { headers: NO_STORE });
  }

  const payload = await period.json().catch(() => null);
  return NextResponse.json(publicGrapeWindow(payload, vintage, identity), { headers: NO_STORE });
}
