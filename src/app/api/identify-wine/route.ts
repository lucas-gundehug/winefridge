import { NextResponse } from "next/server";
import { guardWineApi } from "@/lib/api-guard";
import { identifyWineImage } from "@/lib/wineapi";
import type { IdentifyResponse } from "@/lib/types";

const privateHeaders = { "cache-control": "private, no-store" };

export async function POST(request: Request) {
  const gate = await guardWineApi(request);
  if (gate instanceof Response) return gate;

  try {
    if (!process.env.WINEAPI_API_KEY) {
      const body: IdentifyResponse = {
        suggestion: null,
        suggestions: [],
        source: "manual",
        message:
          "WineAPI-nøgle mangler. Udfyld vinoplysningerne manuelt — nøglen kan tilføjes som secret.",
      };
      return NextResponse.json(body, { headers: privateHeaders });
    }

    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof Blob) || image.size === 0) {
      return NextResponse.json(
        { error: "Mangler billedfil" },
        { status: 400, headers: privateHeaders },
      );
    }

    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Billedet er for stort (max 8 MB)" },
        { status: 400, headers: privateHeaders },
      );
    }

    const { suggestion, suggestions } = await identifyWineImage(image);

    const body: IdentifyResponse = {
      suggestion,
      suggestions,
      source: "wineapi",
      message: suggestion
        ? undefined
        : "Ingen sikker match. Tjek billedet eller udfyld manuelt.",
    };
    return NextResponse.json(body, { headers: privateHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json(
      { error: message },
      { status: 502, headers: privateHeaders },
    );
  }
}
