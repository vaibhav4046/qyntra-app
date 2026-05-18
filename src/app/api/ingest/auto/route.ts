import { auth } from "@/lib/auth";
import { runIngest } from "@/lib/ingest";
import {
  getAutoIngestTargets,
  getProviderDisplayName,
  getSessionAccessTokenForIngest,
} from "@/lib/session-ingest";
import { hasSupabase } from "@/lib/supabase";

interface AutoIngestResult {
  provider: string;
  label: string;
  inserted?: number;
  error?: string;
}

export async function POST() {
  if (!hasSupabase()) {
    return Response.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const targets = getAutoIngestTargets(session.provider);
  if (!targets.length) {
    return Response.json(
      {
        ok: false,
        error: `Auto-ingest is not available for "${session.provider || "unknown"}" sign-in.`,
      },
      { status: 400 }
    );
  }

  const results: AutoIngestResult[] = [];

  for (const provider of targets) {
    try {
      const accessToken = await getSessionAccessTokenForIngest(session, provider);
      const result = await runIngest(provider, accessToken, session.user.id);
      results.push({
        provider,
        label: getProviderDisplayName(provider),
        inserted: result.inserted,
      });
    } catch (err) {
      results.push({
        provider,
        label: getProviderDisplayName(provider),
        error: (err as Error).message,
      });
    }
  }

  const ok = results.some((result) => typeof result.inserted === "number");
  return Response.json({ ok, provider: session.provider, results }, { status: ok ? 200 : 500 });
}

export async function GET() {
  return POST();
}
