// Shared Supabase URL + anon key for the cookie-based (SSR) auth clients.
// No hardcoded fallback: each environment (local / staging / production) MUST
// provide its own env vars. Missing values fail fast so a misconfigured deploy
// can never silently connect to the wrong database (staging vs production).
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Set it for this environment (local/staging/production).`
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);
export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
