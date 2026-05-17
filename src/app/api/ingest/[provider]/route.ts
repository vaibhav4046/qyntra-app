import { auth } from "@/lib/auth";
import { runIngest } from "@/lib/ingest";
import { isTokenExpired, refreshGoogleToken, refreshLinkedInToken } from "@/lib/token-refresh";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

/**
 * Ingest handler.
 * Checks token expiration before calling provider APIs.
 * For Google + LinkedIn attempts automatic refresh.
 * For Slack, reads token from connectors table (Slack is not an auth provider).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let accessToken: string | null = null;

  // ─── Slack is ingestion-only, read token from connectors table ───
  if (provider === "slack") {
    if (!hasSupabase()) {
      return Response.json({ error: "Supabase not configured" }, { status: 503 });
    }
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("connectors")
      .select("access_token")
      .eq("user_id", session.user.id)
      .eq("provider", "slack")
      .maybeSingle();
    if (error || !data?.access_token) {
      return Response.json({ error: "Slack not connected. Connect it in /sources first." }, { status: 400 });
    }
    accessToken = data.access_token;
  } else {
    // ─── Auth-based providers ───
    if (!session.accessToken) {
      return Response.json({ error: "No access token in session. Re-authenticate with this provider." }, { status: 400 });
    }

    // Session provider must match requested provider (Google covers drive/gmail)
    if (session.provider !== provider && !(session.provider === "google" && (provider === "drive" || provider === "gmail"))) {
      return Response.json(
        {
          error: `Session signed in with "${session.provider}", but you asked to ingest "${provider}". Sign in with ${provider} first via /sources.`,
        },
        { status: 400 }
      );
    }

    accessToken = session.accessToken;

    // ─── Token expiration check + refresh ───
    if (isTokenExpired(session.expiresAt)) {
      if (!session.refreshToken) {
        return Response.json(
          { error: `Your ${provider} access token has expired and no refresh token is available. Please re-authenticate in /sources.` },
          { status: 401 }
        );
      }

      let refreshed = null;
      if (provider === "google" || provider === "drive" || provider === "gmail") {
        refreshed = await refreshGoogleToken(session.refreshToken);
      } else if (provider === "linkedin") {
        refreshed = await refreshLinkedInToken(session.refreshToken);
      }

      if (!refreshed?.access_token) {
        return Response.json(
          { error: `Failed to refresh your ${provider} token. Please re-authenticate in /sources.` },
          { status: 401 }
        );
      }

      accessToken = refreshed.access_token;
      // NOTE: we cannot update the NextAuth JWT here easily in App Router.
      // The refreshed token is used for this request only.
      // In production, persist the new token to DB or a custom session store.
    }
  }

  if (!accessToken) {
    return Response.json({ error: "Unable to obtain a valid access token." }, { status: 500 });
  }

  try {
    const result = await runIngest(provider, accessToken, session.user.id);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  return POST(req, ctx);
}
