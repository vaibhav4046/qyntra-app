import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET || "qyntra-fallback-secret-dev-only";

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export interface MagicPayload {
  email: string;
  name?: string;
  /** unix-ms expiry */
  exp: number;
}

/** Generate signed magic-link token. Valid for `ttlMs` (default 1h). */
export function signMagicToken(payload: Omit<MagicPayload, "exp">, ttlMs = 60 * 60 * 1000): string {
  const full: MagicPayload = { ...payload, exp: Date.now() + ttlMs };
  const body = b64url(JSON.stringify(full));
  const sig = b64url(createHmac("sha256", SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyMagicToken(token: string): MagicPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = b64url(createHmac("sha256", SECRET).update(body).digest());
    if (expected !== sig) return null;
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as MagicPayload;
    if (!payload?.email || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
