import { NextResponse } from "next/server";
import { searchWines } from "@/lib/wineapi";

export async function GET(request: Request) {
  try {
    if (!process.env.WINEAPI_API_KEY) {
      return NextResponse.json({ results: [], message: "WineAPI-nøgle mangler" });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    if (q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchWines(q);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
