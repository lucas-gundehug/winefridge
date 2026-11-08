// Minimal identity stub for Vercel (WineAPI guarded by IP rate limit when unverified).
export type DevViewer = {
  sub: string;
  email: string;
  name: string;
  teamId: number;
  teamRole: string;
};

export type Identity =
  | { verified: true; sub: string; simulated?: boolean }
  | { verified: false; reason: string };

export async function getIdentity(_request: unknown): Promise<Identity> {
  return { verified: false, reason: "missing_header" };
}

export async function requireIdentity(
  request: unknown,
  options: { onFailure?: "response" | "throw" } = {},
): Promise<Identity | Response> {
  const identity = await getIdentity(request);
  if (identity.verified) return identity;
  if (options.onFailure === "throw") throw new Error(identity.reason);
  return new Response(JSON.stringify({ error: "unauthorized", reason: identity.reason }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
