import { auth } from "@/lib/auth";
import { runIngest } from "@/lib/ingest";
import {
  getProviderDisplayName,
  getSessionAccessTokenForIngest,
  REMOVED_INGEST_PROVIDERS,
} from "@/lib/session-ingest";
import { hasSupabase, ensureProfile } from "@/lib/supabase";

export async function POST(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;

  if (REMOVED_INGEST_PROVIDERS.has(provider)) {
    return Response.json(
      { error: `${getProviderDisplayName(provider)} ingestion has been removed from Qyntra.` },
      { status: 410 }
    );
  }

  if (!hasSupabase()) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // CRITICAL: Ensure profile exists before inserting files (FK constraint)
  await ensureProfile(session.user.id, session.user.email, session.user.name);

  try {
    const accessToken = await getSessionAccessTokenForIngest(session, provider);
    const result = await runIngest(provider, accessToken, session.user.id);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  return POST(req, ctx);
}
