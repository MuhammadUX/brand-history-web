import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase-config";

/**
 * Server-ONLY Supabase client using the service-role key.
 *
 * Bypasses RLS — it must NEVER be imported from a client component or shipped to
 * the browser. Used only by trusted server contexts (the Moyasar webhook + the
 * Pro grant) where there is no user session/cookie to act on behalf of.
 *
 * Throws if SUPABASE_SERVICE_ROLE_KEY is missing so misconfiguration fails loud.
 */
export function createAdminSupabase(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — the admin Supabase client cannot be created."
    );
  }
  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
