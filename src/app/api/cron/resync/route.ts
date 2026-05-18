import { supabaseAdmin, hasSupabase } from "@/lib/supabase";
import { runIngest } from "@/lib/ingest";
import { REMOVED_INGEST_PROVIDERS } from "@/lib/session-ingest";

/**
 * Periodic re-sync cron.
 * Iterates `connectors` rows where `is_on = true` AND access_token present,
 * re-runs ingest per user/provider.
 *
 * Auth: Vercel cron adds Authorization: Bearer <CRON_SECRET>. We check it.
 * Disable in dev or set CRON_SECRET in Vercel.
 */
export async function GET(req: Request) {
  // Auth gate
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
    .select("user_id, provider, access_token")
    .eq("is_on", true)
    .not("access_token", "is", null)
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const results: { user_id: string; provider: string; inserted?: number; error?: string }[] = [];

  for (const row of rows) {
    if (!row.access_token) continue;
    if (REMOVED_INGEST_PROVIDERS.has(row.provider)) continue;
    try {
      const r = await runIngest(row.provider, row.access_token, row.user_id);
      results.push({ user_id: row.user_id, provider: row.provider, inserted: r.inserted });
    } catch (err) {
      results.push({ user_id: row.user_id, provider: row.provider, error: (err as Error).message });
    }
  }

  return Response.json({ ok: true, processed: results.length, results });
}
