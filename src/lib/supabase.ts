import { createClient } from "@supabase/supabase-js";

// No hardcoded fallback: each environment (local / staging / production) MUST set
// its own Supabase URL + anon key. A missing var fails fast (below) rather than
// silently connecting to the wrong database — critical now that staging and
// production are separate projects.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
