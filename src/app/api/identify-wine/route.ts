import { NextResponse } from "next/server";
import { identifyWineImage } from "@/lib/wineapi";
import type { IdentifyResponse } from "@/lib/types";

export async function POST(request: Request) {
  try {
    if (!process.env.WINEAPI_API_KEY) {
      const body: IdentifyResponse = {
        suggestion: null,
        suggestions: [],
        source: "manual",
        message:
          "WineAPI-nøgle mangler. Udfyld vinoplysningerne manuelt — nøglen kan tilføjes som secret.",
      };
      return NextResponse.json(body);
    }

    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof Blob) || image.size === 0) {
      return NextResponse.json(
        { error: "Mangler billedfil" },
        { status: 400 },
      );
    }

    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Billedet er for stort (max 8 MB)" },
        { status: 400 },
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
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
