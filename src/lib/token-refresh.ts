import { auth } from "@/lib/auth";

export function isTokenExpired(expiresAt: number | undefined, bufferSeconds = 300): boolean {
  if (!expiresAt) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt - bufferSeconds;
}

interface RefreshResult {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
}

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
      refresh_token: json.refresh_token,
      token_type: json.token_type,
    };
  } catch {
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const session = await auth();
  if (!session?.accessToken) return null;

  if (!isTokenExpired(session.expiresAt)) {
    return session.accessToken;
  }

  if (!session.refreshToken || session.provider !== "google") {
    return null;
  }

  const refreshed = await refreshGoogleToken(session.refreshToken);
  return refreshed?.access_token || null;
}
