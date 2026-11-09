import { NextResponse } from "next/server";
import { geminiEnabled, grapemindsEnabled } from "@/lib/scan-sources";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store" };

/** Which optional providers have a server key. The keys themselves stay on the server. */
export async function GET() {
  return NextResponse.json(
    {
      gemini: geminiEnabled(process.env),
      grapeminds: grapemindsEnabled(process.env),
    },
    { headers: NO_STORE },
  );
}
