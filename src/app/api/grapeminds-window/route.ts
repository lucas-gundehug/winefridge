import { NextResponse } from "next/server";
import { grapemindsEnabled } from "@/lib/scan-sources";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store" };

/**
 * Disabled until the free-plan length and the licence for stored text are confirmed.
 * This handler does not call GrapeMinds and does not read a key.
 */
export async function POST() {
  if (!grapemindsEnabled()) {
    return NextResponse.json(
      { enabled: false, reason: "license_unverified" },
      { headers: NO_STORE },
    );
  }
  return NextResponse.json({ enabled: false }, { headers: NO_STORE });
}
