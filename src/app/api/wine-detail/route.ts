import { NextResponse } from "next/server";
import { guardWineApi } from "@/lib/api-guard";
import { interpretWineDetail } from "@/lib/wine-profile";

const privateHeaders = { "cache-control": "private, no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

export async function GET(request: Request) {
  const gate = await guardWineApi(request);
  if (gate instanceof Response) return gate;

  if (!process.env.WINEAPI_API_KEY) {
    return json({ profile: null, reason: "missing_key" });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim() ?? "";
  if (!/^[A-Za-z0-9-]{8,80}$/.test(id)) {
    return json({ profile: null, reason: "malformed" }, 400);
  }

  const vintageParam = searchParams.get("vintage");
  const vintage =
    vintageParam && /^\d{4}$/.test(vintageParam) ? Number(vintageParam) : undefined;

  try {
    const res = await fetch(`https://api.wineapi.io/wines/${encodeURIComponent(id)}`, {
      headers: { "X-API-Key": process.env.WINEAPI_API_KEY },
    });
    if (res.status === 429) return json({ profile: null, reason: "rate_limited" }, 429);
    const raw = await res.json().catch(() => null);
    if (!res.ok) return json({ profile: null, reason: "error" }, 502);
    const result = interpretWineDetail(raw, vintage);
    return json({ profile: result.profile ?? null, reason: result.reason });
  } catch {
    return json({ profile: null, reason: "error" }, 502);
  }
}
