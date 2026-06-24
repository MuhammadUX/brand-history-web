// Shared Supabase URL + anon key for the cookie-based (SSR) auth clients.
// Publishable-by-design dev keys (RLS-protected). Override via env in prod.
const FALLBACK_URL = "https://osivlxbygjdluzuckvpo.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zaXZseGJ5Z2pkbHV6dWNrdnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTE5NjQsImV4cCI6MjA5NzgyNzk2NH0.ldGSInsBFa3-PTOdD33AjU9DMIQKXnouL1xkxiQH6c4";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;
