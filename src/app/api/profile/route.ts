import { auth } from "@/lib/auth";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    // Treat anonymous as a 200 with an empty profile so the demo workspace
    // doesn't log noisy 401s in the console (Lighthouse best-practices flagged
    // these as page errors).
    return Response.json({ profile: null, demoMode: true, onboarded: false, anonymous: true });
  }
  if (!hasSupabase()) {
    return Response.json({ profile: null, demoMode: false, onboarded: false });
  }
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({
      profile: data,
      demoMode: data?.demo_mode ?? false,
      onboarded: data?.onboarded ?? false,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    // Anonymous visitors still hit POST when they toggle demo mode in the UI.
    // Return 200 no-op so the console stays clean; their preference persists
    // in localStorage via the client store. We only persist server-side when authed.
    return Response.json({ ok: true, anonymous: true });
  }
  if (!hasSupabase()) {
    return Response.json({ ok: false, note: "Supabase not configured" });
  }
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.onboarded === "boolean") patch.onboarded = body.onboarded;
  if (typeof body.demo_mode === "boolean") patch.demo_mode = body.demo_mode;
  if (typeof body.name === "string") patch.name = body.name;
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "No valid fields" }, { status: 400 });
  }
  try {
    const sb = supabaseAdmin();
    const { error } = await sb.from("profiles").update(patch).eq("id", session.user.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
