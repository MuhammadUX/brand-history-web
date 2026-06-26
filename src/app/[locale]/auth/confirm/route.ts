import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * Server-side auth callback for email links (verify signup / password recovery /
 * magic link). The email template points here with `token_hash` + `type`. We
 * verify server-side (which sets the session cookie) and then redirect to `next`
 * — so the destination page already has a valid session. This avoids the fragile
 * client-side hash/PKCE hand-off that made reset links read as "expired".
 *
 * Recommended Supabase App-Router pattern.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") || `/${locale}`;
  // Open-redirect guard: only allow same-site relative paths.
  const next = nextParam.startsWith("/") ? nextParam : `/${locale}`;

  if (token_hash && type) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  // Invalid/expired/used link → land on reset-password with an error flag.
  redirect(`/${locale}/reset-password?error_description=link_invalid`);
}
