import { isTokenExpired, refreshGoogleToken } from "@/lib/token-refresh";
import { markConnectorSynced } from "@/lib/ingest";
import { getOAuthToken } from "@/lib/auth";

export const REMOVED_INGEST_PROVIDERS = new Set(["slack", "linkedin"]);

export function getAutoIngestTargets(provider?: string): string[] {
  if (provider === "google") return ["drive", "gmail"];
  if (provider === "github") return ["github"];
  if (provider === "notion") return ["notion"];
  return [];
}

export function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case "drive":
      return "Google Drive";
    case "gmail":
      return "Gmail";
    case "github":
      return "GitHub";
    case "google":
      return "Google";
    case "notion":
      return "Notion";
    case "slack":
      return "Slack";
    case "linkedin":
      return "LinkedIn";
    default:
      return provider;
  }
}

function providerMatchesSession(sessionProvider: string | undefined, provider: string): boolean {
  if (sessionProvider === provider) return true;
  return sessionProvider === "google" && (provider === "drive" || provider === "gmail");
}

export async function getSessionAccessTokenForIngest(
  userId: string,
  provider: string,
  sessionProvider?: string
): Promise<string> {
  if (REMOVED_INGEST_PROVIDERS.has(provider)) {
    throw new Error(`${getProviderDisplayName(provider)} ingestion has been removed.`);
  }

  if (!providerMatchesSession(sessionProvider, provider)) {
    throw new Error(
      `Session signed in with "${sessionProvider || "unknown"}", but you asked to ingest "${provider}". Sign in with ${getProviderDisplayName(provider)} first.`
    );
  }

  // Fetch token from Clerk
  const accessToken = await getOAuthToken(userId, provider);
  if (!accessToken) {
    throw new Error("No access token in session. Re-authenticate with this provider.");
  }

  // For Google, check expiration and refresh if needed
  // Clerk tokens are short-lived (~1 hour). We try refresh if ingest fails,
  // but Clerk usually handles refresh automatically on the next auth.
  // For now, return the token as-is. If the ingest API returns 401,
  // the user will need to re-authenticate.
  return accessToken;
}
