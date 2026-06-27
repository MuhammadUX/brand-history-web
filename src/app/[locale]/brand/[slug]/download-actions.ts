"use server";

import { createServerSupabase } from "@/lib/supabase-server";

const ALLOWED_KINDS = ["logo-svg", "logo-png", "highres", "kit"] as const;

/**
 * Record a download for the signed-in user (best-effort; anonymous downloads
 * aren't tracked). Used to populate the account "Downloads" history. RLS ensures
 * a user can only insert rows for themselves.
 */
export async function recordDownload(
  brandId: string,
  kind: string
): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const safeKind = (ALLOWED_KINDS as readonly string[]).includes(kind)
    ? kind
    : "logo-svg";
  const { error } = await supabase.from("downloads").insert({
    user_id: user.id,
    brand_id: brandId,
    kind: safeKind,
  });
  if (error) {
    console.error("recordDownload error:", error.message);
    return { ok: false };
  }
  return { ok: true };
}
