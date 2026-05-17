import { auth } from "@/lib/auth";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

/**
 * Start Slack OAuth flow for ingestion (NOT for sign-in).
 * This is a custom OAuth because Slack user tokens expire in ~12 hours
 * and are therefore unsuitable for session auth.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/connectors/slack/callback`;

  if (!clientId) {
    return Response.json({ error: "Slack OAuth not configured (missing SLACK_CLIENT_ID)" }, { status: 503 });
  }

  const state = Buffer.from(JSON.stringify({ userId: session.user.id, nonce: Math.random().toString(36).slice(2) })).toString("base64");

  // Store state in Supabase temporarily (5-min TTL is enough for OAuth round-trip)
  if (hasSupabase()) {
    try {
      const sb = supabaseAdmin();
      await sb.from("oauth_states").upsert({
        state,
        provider: "slack",
        user_id: session.user.id,
        created_at: new Date().toISOString(),
      }, { onConflict: "state" });
    } catch {
      // oauth_states table may not exist; ignore
    }
  }

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "channels:read channels:history files:read");
  url.searchParams.set("user_scope", "channels:read groups:read im:read mpim:read");
  url.searchParams.set("state", state);

  return Response.json({ url: url.toString() });
}
