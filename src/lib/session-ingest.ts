import type { Session } from "next-auth";
import { isTokenExpired, refreshGoogleToken } from "@/lib/token-refresh";
import { markConnectorSynced } from "@/lib/ingest";

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
  session: Session,
  provider: string
): Promise<string> {
  if (REMOVED_INGEST_PROVIDERS.has(provider)) {
    throw new Error(`${getProviderDisplayName(provider)} ingestion has been removed.`);
  }

  if (!session.user?.id) {
    throw new Error("Unauthenticated");
  }

  if (!session.accessToken) {
    throw new Error("No access token in session. Re-authenticate with this provider.");
  }

  if (!providerMatchesSession(session.provider, provider)) {
    throw new Error(
      `Session signed in with "${session.provider}", but you asked to ingest "${provider}". Sign in with ${getProviderDisplayName(provider)} first.`
    );
  }

  if (!isTokenExpired(session.expiresAt)) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    throw new Error(
      `Your ${getProviderDisplayName(provider)} access token has expired. Please re-authenticate before syncing.`
    );
  }

  if (session.provider !== "google") {
    throw new Error(
      `Your ${getProviderDisplayName(provider)} access token has expired. Please re-authenticate before syncing.`
    );
  }

  const refreshed = await refreshGoogleToken(session.refreshToken);
  if (!refreshed?.access_token) {
    throw new Error(`Failed to refresh your ${getProviderDisplayName(provider)} token. Please re-authenticate.`);
  }

  // Persist refreshed token to DB so cron and future requests can use it
  // even if the session cookie still carries the old token.
  if (session.user?.id) {
    try {
      await markConnectorSynced(session.user.id, provider, 0, refreshed.access_token);
    } catch {
      // Non-fatal: DB update best-effort
    }
  }

  return refreshed.access_token;
}
