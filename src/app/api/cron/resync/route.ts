import { supabaseAdmin, hasSupabase } from "@/lib/supabase";
import { runIngest, markConnectorSynced } from "@/lib/ingest";
import { REMOVED_INGEST_PROVIDERS } from "@/lib/session-ingest";
import { refreshGoogleToken } from "@/lib/token-refresh";

/**
 * Periodic re-sync cron — runs every 5 minutes on Vercel.
 *
 * For each active connector:
 *   1. If Google (drive/gmail) and has refresh_token → refresh access token first,
 *      persist new token to DB.
 *   2. Run ingest with the (possibly refreshed) access_token.
 *   3. Skip connectors that have no usable token (will need re-auth in UI).
 *
 * Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET>. Required in prod.
 */
export const maxDuration = 60;

type ConnectorRow = {
  user_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
};

type Result = {
  user_id: string;
  provider: string;
  inserted?: number;
  refreshed?: boolean;
  error?: string;
  skipped?: string;
};

const GOOGLE_PROVIDERS = new Set(["drive", "gmail"]);

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!hasSupabase()) {
    return Response.json({ ok: false, reason: "supabase not configured" });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("connectors")
    .select("user_id, provider, access_token, refresh_token")
    .eq("is_on", true)
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []) as ConnectorRow[];
  const results: Result[] = [];

  for (const row of rows) {
    if (REMOVED_INGEST_PROVIDERS.has(row.provider)) {
      results.push({ user_id: row.user_id, provider: row.provider, skipped: "removed-provider" });
      continue;
    }

    let token = row.access_token || "";
    let refreshed = false;

    // Refresh Google tokens up-front so each tick of the cron heals expired sessions.
    if (GOOGLE_PROVIDERS.has(row.provider) && row.refresh_token) {
      const fresh = await refreshGoogleToken(row.refresh_token);
      if (fresh?.access_token) {
        token = fresh.access_token;
        refreshed = true;
        // Persist refreshed access token (and rotated refresh token, if any) so
        // browser sessions see the fresh value too.
        try {
          await markConnectorSynced(
            row.user_id,
            row.provider,
            0,
            token,
            fresh.refresh_token || row.refresh_token,
          );
        } catch {}
      }
    }

    if (!token) {
      results.push({ user_id: row.user_id, provider: row.provider, skipped: "no-token" });
      continue;
    }

    try {
      const r = await runIngest(row.provider, token, row.user_id);
      results.push({ user_id: row.user_id, provider: row.provider, inserted: r.inserted, refreshed });
    } catch (err) {
      results.push({
        user_id: row.user_id,
        provider: row.provider,
        error: (err as Error).message,
        refreshed,
      });
    }
  }

  return Response.json({ ok: true, processed: results.length, results });
}
