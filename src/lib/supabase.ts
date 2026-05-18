import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _admin: SupabaseClient | null = null;
let _browser: SupabaseClient | null = null;

/**
 * Admin client (server-only). Bypasses RLS. Never expose to browser.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!url || !serviceRole) {
    throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }
  if (!_admin) {
    _admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}

/**
 * Browser client (anon key, RLS-enforced).
 */
export function supabaseBrowser(): SupabaseClient {
  if (!url || !anon) {
    throw new Error("Supabase env missing");
  }
  if (!_browser) {
    _browser = createClient(url, anon);
  }
  return _browser;
}

export function hasSupabase(): boolean {
  return Boolean(url && (anon || serviceRole));
}

/**
 * Ensure a profiles row exists for the given user id/email.
 * Call this before any operation that references user_id via FK.
 */
export async function ensureProfile(userId: string, email?: string | null, name?: string | null) {
  if (!hasSupabase() || !userId) return;
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!data) {
      await sb.from("profiles").insert({
        id: userId,
        email: email || null,
        name: name || null,
        provider: userId.split(":")[0] || "unknown",
      });
    }
  } catch {
    // Non-fatal: FK might already exist or table missing
  }
}
