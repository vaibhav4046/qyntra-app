import { supabaseAdmin, hasSupabase } from "@/lib/supabase";
import { signMagicToken } from "@/lib/magic-link";
import { hashPassword, isStrongEnough } from "@/lib/password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendMagicEmail(email: string, link: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Qyntra <onboarding@resend.dev>";
  if (!apiKey) return false;
  try {
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0e11;color:#f4f4f5;border-radius:12px;">
        <h2 style="font-size:22px;margin:0 0 16px;color:#ff5b1f">Qyntra · Sign-in link</h2>
        <p style="font-size:14px;line-height:1.6;color:#b8bcc4">Click the button below to open your workspace. Valid 1 hour.</p>
        <a href="${link}" style="display:inline-block;margin-top:16px;padding:14px 24px;background:#ff5b1f;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open my workspace →</a>
        <p style="font-size:11px;color:#71757e;margin-top:24px">If you didn't request this, ignore.</p>
      </div>
    `;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject: "Your Qyntra sign-in link", html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

interface ProfileUpdate {
  id?: string;
  email?: string;
  name?: string | null;
  provider?: string;
  password_hash?: string;
  password_salt?: string;
}

export async function POST(req: Request) {
  if (!hasSupabase()) return Response.json({ error: "Backend not configured" }, { status: 503 });
  let body: { email?: string; name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim().slice(0, 80) || undefined;
  const password = body.password;
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Invalid email." }, { status: 400 });
  if (password !== undefined && !isStrongEnough(password)) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const id = `email:${Buffer.from(email).toString("hex").slice(0, 32)}`;
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const token = signMagicToken({ email, name });
  const magicLink = `${origin}/signin/magic?token=${encodeURIComponent(token)}`;

  try {
    const sb = supabaseAdmin();
    const { data: existing } = await sb
      .from("profiles")
      .select("id, provider")
      .eq("email", email)
      .maybeSingle();

    const passwordFields: ProfileUpdate = {};
    if (password) {
      const { hash, salt } = hashPassword(password);
      passwordFields.password_hash = hash;
      passwordFields.password_salt = salt;
    }

    if (existing) {
      // Existing email — if password supplied, attach it to the existing row
      if (Object.keys(passwordFields).length) {
        const { error: updErr } = await sb
          .from("profiles")
          .update(passwordFields)
          .eq("email", email);
        if (updErr && !/column .* does not exist|could not find the .* column|schema cache/i.test(updErr.message)) {
          return Response.json({ error: updErr.message }, { status: 500 });
        }
      }
      const emailed = await sendMagicEmail(email, magicLink);
      return Response.json({
        ok: true,
        workspaceId: existing.id,
        existing: true,
        emailed,
        magicLink,
        message: emailed
          ? `Sign-in link sent to ${email}. Check inbox.`
          : `Welcome back. Open the magic link to sign in.`,
      });
    }

    const { error } = await sb.from("profiles").insert({
      id,
      email,
      name: name ?? null,
      provider: "email",
      ...passwordFields,
    });
    // Tolerate missing password columns gracefully (schema not patched yet)
    if (error && /column .* does not exist|could not find the .* column|schema cache/i.test(error.message)) {
      await sb.from("profiles").insert({ id, email, name: name ?? null, provider: "email" });
    } else if (error && !/duplicate key|unique constraint/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const emailed = await sendMagicEmail(email, magicLink);
    return Response.json({
      ok: true,
      workspaceId: id,
      emailed,
      magicLink,
      message: emailed
        ? `Workspace claimed. Sign-in link sent to ${email}.`
        : `Workspace claimed. Open the magic link to enter.`,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
