import { NextResponse } from "next/server";
import { guardWineApi } from "@/lib/api-guard";
import { searchWines } from "@/lib/wineapi";

const privateHeaders = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const gate = await guardWineApi(request);
  if (gate instanceof Response) return gate;

  try {
    if (!process.env.WINEAPI_API_KEY) {
      return NextResponse.json(
        { results: [], message: "WineAPI-nøgle mangler" },
        { headers: privateHeaders },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    if (q.trim().length < 2) {
      return NextResponse.json({ results: [] }, { headers: privateHeaders });
    }

    const results = await searchWines(q);
    return NextResponse.json({ results }, { headers: privateHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    const status = error instanceof Error && "status" in error && error.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: message },
      { status, headers: privateHeaders },
    );
  }
}
