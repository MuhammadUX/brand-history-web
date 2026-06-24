import { createClient } from "@supabase/supabase-js";

// Publishable-by-design dev keys (RLS-protected; anon can only read published rows).
// Used as a fallback so the app deploys without extra env config. Override via env in prod.
const FALLBACK_URL = "https://osivlxbygjdluzuckvpo.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zaXZseGJ5Z2pkbHV6dWNrdnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTE5NjQsImV4cCI6MjA5NzgyNzk2NH0.ldGSInsBFa3-PTOdD33AjU9DMIQKXnouL1xkxiQH6c4";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

/**
 * Server-side Supabase client using the anon (publishable) key.
 * RLS restricts anon to SELECT on published rows only. No service role is used.
 */
export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
