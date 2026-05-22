/**
 * Server-side error sink.
 * Receives beacons from src/lib/track.ts and logs them.
 * On Vercel these end up in the function logs which is fine for hackathon scale.
 *
 * If you have a SENTRY_DSN configured server-side later, forward there too.
 */
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ua = req.headers.get("user-agent") || "";
    // eslint-disable-next-line no-console
    console.error("[qyntra:client-error]", {
      ts: new Date().toISOString(),
      ua,
      ...body,
    });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
