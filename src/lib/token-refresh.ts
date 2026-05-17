import { auth } from "@/lib/auth";

/**
 * Check whether the current session's access token is expired or about to expire.
 * Returns true if expired or expiring within `bufferSeconds`.
 */
export function isTokenExpired(expiresAt: number | undefined, bufferSeconds = 300): boolean {
  if (!expiresAt) return false; // no expiry = assume valid (GitHub classic, Notion)
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt - bufferSeconds;
}

/**
 * Token lifetime rules:
 * - Google: 1 hour (3600s). refresh_token available if access_type=offline.
 * - LinkedIn: 60 days. refresh_token available (365d lifetime).
 * - GitHub: no expiration for classic tokens; fine-grained may expire.
 * - Notion: no expiration.
 * - Slack: ~12 hours (NOT used for auth; ingestion-only via custom OAuth).
 */

interface RefreshResult {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
}

/**
 * Refresh a Google access token using the stored refresh_token.
 * Returns the new token payload or null on failure.
 */
export async function refreshGoogleToken(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      access_token: json.access_token,
      expires_in: json.expires_in,
      refresh_token: json.refresh_token, // Google may rotate it
      token_type: json.token_type,
    };
  } catch {
    return null;
  }
}

/**
 * Refresh a LinkedIn access token.
 * LinkedIn refresh tokens are valid for 365 days.
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      access_token: json.access_token,
      expires_in: json.expires_in,
      refresh_token: json.refresh_token,
      token_type: json.token_type,
    };
  } catch {
    return null;
  }
}

/**
 * Ensure the session has a valid, non-expired access token.
 * If expired and a refresh_token exists, attempt refresh.
 * Returns the valid access token or null.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const session = await auth();
  if (!session?.accessToken) return null;

  const expiresAt = session.expiresAt;
  const refreshToken = session.refreshToken;
  const provider = session.provider;

  if (!isTokenExpired(expiresAt)) {
    return session.accessToken;
  }

  // Token expired — try refresh
  if (!refreshToken) return null;

  let refreshed: RefreshResult | null = null;
  if (provider === "google") {
    refreshed = await refreshGoogleToken(refreshToken);
  } else if (provider === "linkedin") {
    refreshed = await refreshLinkedInToken(refreshToken);
  }

  if (refreshed?.access_token) {
    // NOTE: NextAuth JWT strategy doesn't allow us to update the token here easily.
    // In production you'd update the session token via a custom endpoint or DB store.
    // For now, we return the fresh token for this request.
    return refreshed.access_token;
  }

  return null;
}
