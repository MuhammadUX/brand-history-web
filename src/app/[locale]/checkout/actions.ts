"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { getPaymentProvider } from "@/lib/payments/payment-provider";
import {
  FULL_ENTITLEMENTS,
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
 * Cancel at period end: keep status 'active' and entitlements intact, but flag
 * cancel_at_period_end=true. The entitlement resolver (isSubscriptionPro) keeps
 * the user Pro until current_period_end passes, then naturally resolves to free
 * — no scheduler required.
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
      status: "active",
      cancel_at_period_end: true,
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
    detail: {
      immediate: false,
      note: "cancels at period end; entitlements run until current_period_end",
    },
  });
  return { ok: true };
}

/**
 * Reactivate: clear the cancel_at_period_end flag so the subscription renews
 * normally. If the period already lapsed (status moved to canceled), restore an
 * active period and entitlements.
 */
export async function reactivateSubscription(): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const plan: Plan = isPlan(sub?.plan) ? sub!.plan : "monthly";

  // If the period is still in the future, just clear the flag and keep the
  // existing period/entitlements. Otherwise restore a fresh active period.
  const endMs = sub?.current_period_end
    ? new Date(sub.current_period_end as string).getTime()
    : 0;
  const stillActive =
    (sub?.status === "active" || sub?.status === "trialing") &&
    (!endMs || endMs > Date.now());

  const update: Record<string, unknown> = stillActive
    ? {
        status: "active",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }
    : {
        status: "active",
        plan,
        entitlements: FULL_ENTITLEMENTS,
        current_period_end: periodEnd(plan),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      };

  const { error } = await supabase
    .from("subscriptions")
    .update(update)
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
