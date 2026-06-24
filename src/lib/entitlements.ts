import { createServerSupabase } from "./supabase-server";
import { NO_ENTITLEMENTS } from "./pricing";
import type { Plan } from "./pricing";

export type Entitlements = {
  ad_free: boolean;
  bulk_zip: boolean;
  high_res: boolean;
  api: boolean;
  advanced_search: boolean;
};

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export interface SubscriptionRecord {
  status: SubscriptionStatus;
  plan: Plan | null;
  entitlements: Entitlements;
  provider: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

function normalizeEntitlements(raw: unknown): Entitlements {
  const e = (raw ?? {}) as Partial<Entitlements>;
  return {
    ad_free: !!e.ad_free,
    bulk_zip: !!e.bulk_zip,
    high_res: !!e.high_res,
    api: !!e.api,
    advanced_search: !!e.advanced_search,
  };
}

/** True for statuses that grant Pro access. Server-authoritative. */
export function isPro(status: SubscriptionStatus | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Resolve whether a subscription record currently grants Pro. A row is Pro only
 * while its status is active/trialing AND its period has not yet ended
 * (current_period_end is null or in the future). Once the period has passed it
 * resolves to free — no scheduler needed. This is what makes "cancel at period
 * end" safe: entitlements persist until current_period_end, then expire here.
 */
export function isSubscriptionPro(
  sub: Pick<SubscriptionRecord, "status" | "current_period_end"> | null | undefined
): boolean {
  if (!sub) return false;
  if (!isPro(sub.status)) return false;
  if (sub.current_period_end) {
    const end = new Date(sub.current_period_end).getTime();
    if (!Number.isNaN(end) && end <= Date.now()) return false;
  }
  return true;
}

/**
 * Server-authoritative entitlement read. Returns the user's subscription
 * entitlements when Pro, otherwise all-false (free / anonymous). The UI must
 * reflect this value and never guess client-side.
 *
 * Note: if a row exists but the status is not Pro (canceled / past_due /
 * none), entitlements collapse to all-false regardless of the stored jsonb.
 */
export async function getEntitlements(): Promise<Entitlements> {
  const sub = await getSubscription();
  if (isSubscriptionPro(sub)) return sub!.entitlements;
  return { ...NO_ENTITLEMENTS };
}

/** Convenience: is the current user Pro right now? */
export async function getIsPro(): Promise<boolean> {
  const sub = await getSubscription();
  return isSubscriptionPro(sub);
}

/**
 * Full subscription record for the signed-in user, or null for anon / no row.
 */
export async function getSubscription(): Promise<SubscriptionRecord | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "status,plan,entitlements,provider,current_period_end,cancel_at_period_end"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getSubscription error:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    status: (data.status as SubscriptionStatus) ?? "none",
    plan: (data.plan as Plan | null) ?? null,
    entitlements: normalizeEntitlements(data.entitlements),
    provider: (data.provider as string | null) ?? null,
    current_period_end: (data.current_period_end as string | null) ?? null,
    cancel_at_period_end: !!data.cancel_at_period_end,
  };
}
