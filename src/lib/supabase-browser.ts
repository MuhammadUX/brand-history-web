"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config";

/**
 * Browser Supabase client with cookie-based session storage (App Router).
 * Use in client components for auth + favorites mutations.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
