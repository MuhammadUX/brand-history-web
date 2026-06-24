"use server";

import { createServerSupabase } from "@/lib/supabase-server";

export interface DataExport {
  generated_at: string;
  policy_version: string;
  account: { id: string; email: string | null; created_at: string | undefined };
  profile: Record<string, unknown> | null;
  favorites: { brand_id: string; created_at: string | null }[];
  subscription: Record<string, unknown> | null;
  consents: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
}

/**
 * Gathers the signed-in user's personal data into a single JSON payload and
 * logs a `dsar_requests` export row. The browser triggers the download.
 * All reads are RLS-scoped to the current user via the cookie-auth client.
 */
export async function exportMyData(): Promise<
  { ok: true; data: DataExport } | { ok: false }
> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    const [profileRes, favRes, subRes, consentRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("favorites").select("brand_id,created_at").eq("user_id", user.id),
      supabase
        .from("subscriptions")
        .select("status,plan,entitlements,provider,current_period_end,created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("consent_records")
        .select("choices,policy_version,created_at")
        .eq("user_id", user.id),
      supabase
        .from("notifications")
        .select("type,title_en,read,created_at")
        .eq("user_id", user.id),
    ]);

    // Log the export request (received → completed for this synchronous export).
    await supabase
      .from("dsar_requests")
      .insert({ user_id: user.id, type: "export", status: "completed" });

    const data: DataExport = {
      generated_at: new Date().toISOString(),
      policy_version: "v1",
      account: {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
      },
      profile: (profileRes.data as Record<string, unknown> | null) ?? null,
      favorites: (favRes.data as { brand_id: string; created_at: string | null }[]) ?? [],
      subscription: (subRes.data as Record<string, unknown> | null) ?? null,
      consents: (consentRes.data as Record<string, unknown>[]) ?? [],
      notifications: (notifRes.data as Record<string, unknown>[]) ?? [],
    };
    return { ok: true, data };
  } catch (e) {
    console.error("exportMyData:", e);
    return { ok: false };
  }
}

/**
 * Records an account-deletion request. For the demo we DO NOT delete the auth
 * user; we insert a `dsar_requests` delete row with status 'received'. In
 * production this would enqueue erasure to complete within 30 days.
 */
export async function requestAccountDeletion(): Promise<{ ok: boolean }> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };
    const { error } = await supabase
      .from("dsar_requests")
      .insert({ user_id: user.id, type: "delete", status: "received" });
    if (error) {
      console.error("requestAccountDeletion:", error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
