import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.json({ error: `Slack OAuth denied: ${error}` }, { status: 400 });
  }
  if (!code || !state) {
    return Response.json({ error: "Missing code or state" }, { status: 400 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/connectors/slack/callback`;

  if (!clientId || !clientSecret) {
    return Response.json({ error: "Slack OAuth not configured" }, { status: 503 });
  }

  // Exchange code for token
  try {
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenJson.ok) {
      return Response.json({ error: `Slack API error: ${tokenJson.error}` }, { status: 500 });
    }

    // Extract user token (for ingestion) — note: expires in ~12 hours
    const userToken = tokenJson.authed_user?.access_token;
    const userId = tokenJson.authed_user?.id;

    if (!userToken || !userId) {
      return Response.json({ error: "No user token returned from Slack" }, { status: 500 });
    }

    // Persist token in connectors table
    if (hasSupabase()) {
      const sb = supabaseAdmin();
      // Validate state to find original user (best-effort; if state table doesn't exist, skip)
      let originalUserId: string | null = null;
      try {
        const { data: stateRow } = await sb
          .from("oauth_states")
          .select("user_id")
          .eq("state", state)
          .maybeSingle();
        originalUserId = stateRow?.user_id || null;
        // Clean up state
        await sb.from("oauth_states").delete().eq("state", state);
      } catch {
        // oauth_states table may not exist; ignore
      }

      if (originalUserId) {
        await sb.from("connectors").upsert(
          {
            user_id: originalUserId,
            provider: "slack",
            is_on: true,
            access_token: userToken,
            last_sync: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" }
        );
      }
    }

    // Return a small HTML page that closes the popup and notifies the opener
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Slack Connected</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;background:#0a0a0a;color:#fff;">
  <h2>Slack connected successfully!</h2>
  <p>You can close this window.</p>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: "SLACK_CONNECTED", ok: true }, "*");
    }
    setTimeout(() => window.close(), 1500);
  </script>
</body>
</html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
