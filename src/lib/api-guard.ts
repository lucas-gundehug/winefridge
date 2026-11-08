import { getIdentity } from "../../cursor/identity";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 40; // per caller per hour

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function takeRateLimit(subject: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(subject);
  if (!current || now >= current.resetAt) {
    buckets.set(subject, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (current.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  buckets.set(subject, current);
  return { ok: true };
}

/**
 * Protect WineAPI proxy routes.
 * On Cursor Apps: prefer signed-in identity.
 * On Vercel/custom domain: rate-limit by IP (personal single-user app).
 */
export async function guardWineApi(request: Request): Promise<Response | { sub: string }> {
  const identity = await getIdentity(request);
  const sub = identity.verified ? identity.sub : `ip:${clientKey(request)}`;

  const limited = takeRateLimit(sub);
  if (!limited.ok) {
    return new Response(
      JSON.stringify({
        error: "For mange WineAPI-kald. Prøv igen om lidt.",
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "cache-control": "private, no-store",
          "retry-after": String(limited.retryAfterSec),
        },
      },
    );
  }

  return { sub };
}
