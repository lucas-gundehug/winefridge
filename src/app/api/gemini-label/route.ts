import { NextResponse } from "next/server";
import { geminiEnabled } from "@/lib/scan-sources";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store" };
const MAX_BYTES = 1_500_000;
/** Pricing page lists this model's input, including image, as free of charge. No Search grounding. */
const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export async function POST(request: Request) {
  if (!geminiEnabled(process.env)) {
    return NextResponse.json({ enabled: false }, { headers: NO_STORE });
  }

  const form = await request.formData();
  const image = form.get("image");
  if (!(image instanceof Blob)) {
    return NextResponse.json({ error: "Intet billede" }, { status: 400, headers: NO_STORE });
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "Billedet er for stort" }, { status: 413, headers: NO_STORE });
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const bytes = Buffer.from(await image.arrayBuffer());
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
      },
      signal: request.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Read this wine label. Reply with JSON only: {"name":"","producer":"","vintage":"","query":""}. vintage is a four-digit year or an empty string. query is producer, name and vintage. Do not invent a drinking window or a score.',
              },
              { inline_data: { mime_type: "image/jpeg", data: bytes.toString("base64") } },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 200 },
      }),
    },
  );

  if (res.status === 429) {
    return NextResponse.json(
      { error: "Gemini er midlertidigt brugt op. Der prøves ikke igen." },
      { status: 429, headers: NO_STORE },
    );
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Gemini svarede ikke" }, { status: 502, headers: NO_STORE });
  }

  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "Gemini læste ingen etiket" }, { status: 502, headers: NO_STORE });
  }
  try {
    const parsed = JSON.parse(match[0]) as { name?: string; producer?: string; vintage?: string; query?: string };
    const vintage = /^\d{4}$/.test(parsed.vintage ?? "") ? parsed.vintage : "";
    return NextResponse.json(
      {
        enabled: true,
        source: "gemini",
        name: parsed.name?.trim() || "",
        producer: parsed.producer?.trim() || "",
        vintage,
        query: parsed.query?.trim() || [parsed.producer, parsed.name, vintage].filter(Boolean).join(" "),
      },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json({ error: "Gemini læste ingen etiket" }, { status: 502, headers: NO_STORE });
  }
}
