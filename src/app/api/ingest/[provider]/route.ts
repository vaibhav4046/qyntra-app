import { auth } from "@/lib/auth";
import { runIngest } from "@/lib/ingest";

export async function POST(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!session.accessToken) {
    return Response.json({ error: "No access token in session. Re-authenticate with this provider." }, { status: 400 });
  }
  // Provider in URL must match the one user is signed in with
  // (NextAuth JWT only carries the latest provider's accessToken)
  if (session.provider !== provider && !(session.provider === "google" && (provider === "drive" || provider === "gmail"))) {
    return Response.json(
      {
        error: `Session signed in with "${session.provider}", but you asked to ingest "${provider}". Sign in with ${provider} first via /sources.`,
      },
      { status: 400 }
    );
  }
  try {
    const result = await runIngest(provider, session.accessToken, session.user.id);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  // Allow GET for easier debugging
  return POST(req, ctx);
}
