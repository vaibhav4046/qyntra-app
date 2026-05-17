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
