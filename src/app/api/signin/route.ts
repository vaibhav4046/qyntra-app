import { supabaseAdmin, hasSupabase } from "@/lib/supabase";
import { verifyPassword } from "@/lib/password";
import { signMagicToken } from "@/lib/magic-link";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!hasSupabase()) return Response.json({ error: "Backend not configured" }, { status: 503 });
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Invalid email." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("profiles")
      .select("id,email,name,password_hash,password_salt")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      if (/column .* does not exist|could not find the .* column|schema cache/i.test(error.message)) {
        return Response.json(
          { error: "Password auth not enabled — admin must run patch-002-passwords.sql." },
          { status: 503 }
        );
      }
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!data) return Response.json({ error: "No workspace for that email. Sign up first." }, { status: 404 });
    if (!data.password_hash || !data.password_salt) {
      return Response.json(
        { error: "This workspace doesn't have a password yet. Use OAuth or the email magic-link instead." },
        { status: 400 }
      );
    }
    if (!verifyPassword(password, data.password_hash, data.password_salt)) {
      return Response.json({ error: "Wrong password." }, { status: 401 });
    }

    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const token = signMagicToken({ email, name: data.name || undefined });
    return Response.json({
      ok: true,
      magicLink: `${origin}/signin/magic?token=${encodeURIComponent(token)}`,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
