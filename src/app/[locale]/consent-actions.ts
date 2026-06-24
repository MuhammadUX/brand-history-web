"use server";

import { createServerSupabase } from "@/lib/supabase-server";

export interface ConsentChoices {
  essential: true;
  analytics: boolean;
  ads: boolean;
  personalization: boolean;
}

/**
 * Best-effort consent record. Inserts a `consent_records` row tied to the
 * signed-in user (if any) or an anonymous id generated client-side. RLS allows
 * insert for anon + authenticated. Failures are swallowed — the cookie remains
 * the source of truth for gating and never blocks the user.
 */
export async function recordConsent(
  choices: ConsentChoices,
  anonId: string
): Promise<{ ok: boolean }> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("consent_records").insert({
      user_id: user?.id ?? null,
      anon_id: user ? null : anonId,
      choices,
      policy_version: "v1",
    });
    if (error) {
      console.error("recordConsent:", error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
