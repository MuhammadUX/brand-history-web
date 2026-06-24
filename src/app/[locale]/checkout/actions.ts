"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { getPaymentProvider } from "@/lib/payments/payment-provider";
import {
  FULL_ENTITLEMENTS,
  NO_ENTITLEMENTS,
  amountForPlan,
  isPlan,
  type Plan,
} from "@/lib/pricing";

export type CheckoutResult =
  | { status: "success" }
  | { status: "declined"; reason: string }
  | { status: "already_pro" }
  | { status: "error"; message: string };

function periodEnd(plan: Plan): string {
  const d = new Date();
  if (plan === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/**
 * Server action: runs the (mock) checkout end-to-end.
 * createCheckout → confirm → on success upsert subscriptions + log payment_event.
 * `simulateDeclined` exercises the declined UI path via the mock provider.
 */
export async function runCheckout(
  planRaw: string,
  simulateDeclined: boolean
): Promise<CheckoutResult> {
  if (!isPlan(planRaw)) {
    return { status: "error", message: "invalid_plan" };
  }
  const plan = planRaw;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "unauthenticated" };

  // Already-Pro guard — don't double-charge / re-create.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing && (existing.status === "active" || existing.status === "trialing")) {
    return { status: "already_pro" };
  }

  const provider = getPaymentProvider();
  const session = await provider.createCheckout(plan);
  // Pass the decline flag through the session ref (mock honors `_declined`).
  const sessionId = simulateDeclined
    ? `${session.sessionId}_declined`
    : session.sessionId;
  const result = await provider.confirm(sessionId);

  const amount = amountForPlan(plan);

  if (result.status === "declined") {
    await supabase.from("payment_events").insert({
      user_id: user.id,
      provider: provider.id,
      event_type: "payment_declined",
      amount_sar: amount,
      plan,
      detail: { sessionId, txnId: result.txnId, reason: result.reason },
    });
    return { status: "declined", reason: result.reason };
  }

  // Success → upsert subscription (one row per user, unique user_id).
  const { error: upsertErr } = await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      status: "active",
      plan,
      entitlements: FULL_ENTITLEMENTS,
      provider: provider.id,
      current_period_end: periodEnd(plan),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (upsertErr) {
    console.error("runCheckout upsert error:", upsertErr.message);
    return { status: "error", message: "db_error" };
  }

  await supabase.from("payment_events").insert({
    user_id: user.id,
    provider: provider.id,
    event_type: "payment_succeeded",
    amount_sar: amount,
    plan,
    detail: { sessionId, txnId: result.txnId },
  });

  return { status: "success" };
}

/**
 * Cancel: per spec, status → 'canceled'. For the demo we ALSO flip
 * entitlements off immediately (production would keep them until period end).
 */
export async function cancelSubscription(): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      entitlements: NO_ENTITLEMENTS,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) {
    console.error("cancelSubscription error:", error.message);
    return { ok: false };
  }
  await supabase.from("payment_events").insert({
    user_id: user.id,
    provider: "mock",
    event_type: "subscription_canceled",
    detail: { immediate: true, note: "demo flips entitlements immediately" },
  });
  return { ok: true };
}

/** Reactivate a canceled subscription back to active for the rest of a period. */
export async function reactivateSubscription(): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();
  const plan: Plan = isPlan(sub?.plan) ? sub!.plan : "monthly";

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      plan,
      entitlements: FULL_ENTITLEMENTS,
      current_period_end: periodEnd(plan),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) {
    console.error("reactivateSubscription error:", error.message);
    return { ok: false };
  }
  await supabase.from("payment_events").insert({
    user_id: user.id,
    provider: "mock",
    event_type: "subscription_reactivated",
    plan,
    detail: {},
  });
  return { ok: true };
}
