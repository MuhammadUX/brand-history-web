/**
 * grantProForUser — idempotent Pro entitlement grant for real-payment flows.
 *
 * Called from trusted server contexts (the Moyasar webhook + the checkout
 * return page) with NO user session, so it uses the admin (service-role)
 * Supabase client. It mirrors the success path of runCheckout() exactly:
 * upsert the subscriptions row + insert a `payment_succeeded` payment_event,
 * then email a receipt.
 *
 * Idempotency: before granting, it checks payment_events for an existing
 * `payment_succeeded` whose detail->>'invoice_id' (the provider ref) matches.
 * If found, it no-ops. This makes the webhook and the return-page safety net
 * safe to both run for the same payment.
 */

import { createAdminSupabase } from "@/lib/supabase-admin";
import { FULL_ENTITLEMENTS, type Plan } from "@/lib/pricing";
import { sendEmail } from "@/lib/email/email-provider";

export function periodEndFor(plan: Plan): string {
  const d = new Date();
  if (plan === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export interface GrantOpts {
  provider: string;
  ref: string; // provider invoice/payment id
  amountSar: number;
}

export interface GrantResult {
  ok: boolean;
  alreadyGranted?: boolean;
  error?: string;
}

export async function grantProForUser(
  userId: string,
  plan: Plan,
  opts: GrantOpts
): Promise<GrantResult> {
  const supabase = createAdminSupabase();

  // 1) Fast-path idempotency — already granted for this exact invoice/ref?
  // (Cheap early-out for the common case where the webhook granted long before
  // the return page runs. The hard guarantee is the unique-index insert below.)
  const { data: prior, error: priorErr } = await supabase
    .from("payment_events")
    .select("id")
    .eq("provider", opts.provider)
    .eq("event_type", "payment_succeeded")
    .eq("detail->>invoice_id", opts.ref)
    .limit(1);

  if (priorErr) {
    console.error("[grant] idempotency check failed:", priorErr.message);
    return { ok: false, error: "idempotency_check_failed" };
  }
  if (prior && prior.length > 0) {
    return { ok: true, alreadyGranted: true };
  }

  // 2) Upsert subscription (one row per user; idempotent on user_id, so it is
  // safe even if the webhook and the return page race here simultaneously).
  const { error: upsertErr } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      status: "active",
      plan,
      entitlements: FULL_ENTITLEMENTS,
      provider: opts.provider,
      current_period_end: periodEndFor(plan),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (upsertErr) {
    console.error("[grant] subscription upsert failed:", upsertErr.message);
    return { ok: false, error: "db_error" };
  }

  // 3) Record the succeeded payment event. A partial unique index on
  // (provider, detail->>'invoice_id') WHERE event_type='payment_succeeded'
  // makes this the real idempotency gate: if a concurrent grant already
  // inserted it, we get a 23505 unique violation and bail out as
  // alreadyGranted — which crucially skips the duplicate receipt below.
  const { error: eventErr } = await supabase.from("payment_events").insert({
    user_id: userId,
    provider: opts.provider,
    event_type: "payment_succeeded",
    amount_sar: opts.amountSar,
    plan,
    detail: { invoice_id: opts.ref, ref: opts.ref },
  });
  if (eventErr) {
    if ((eventErr as { code?: string }).code === "23505") {
      // Lost the race — the other caller already recorded this payment and sent
      // the receipt. Subscription is active; do not email again.
      return { ok: true, alreadyGranted: true };
    }
    // Other insert error: subscription is active, so don't fail the grant, but
    // skip the receipt to avoid emailing on an inconsistent state.
    console.error("[grant] payment_event insert failed:", eventErr.message);
    return { ok: true };
  }

  // 4) Receipt email (best-effort; never blocks the grant).
  try {
    const { data: userRes } = await supabase.auth.admin.getUserById(userId);
    const email = userRes?.user?.email;
    if (email) {
      const planLabel =
        plan === "annual" ? "Annual / سنوي" : "Monthly / شهري";
      await sendEmail({
        to: email,
        subject: "Your Brand History Pro receipt — إيصال اشتراك برو",
        html: receiptHtml(planLabel, opts.amountSar, opts.ref),
      });
    }
  } catch (e) {
    console.error("[grant] receipt email failed:", e);
  }

  return { ok: true };
}

function receiptHtml(planLabel: string, amountSar: number, ref: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 4px">Brand History Pro</h2>
    <p style="margin:0 0 16px;color:#555">Thank you — your subscription is active. شكرًا لك — تم تفعيل اشتراكك.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#555">Plan / الباقة</td><td style="padding:8px 0;text-align:right"><strong>${planLabel}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#555">Amount / المبلغ</td><td style="padding:8px 0;text-align:right"><strong>SAR ${amountSar}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#555">Reference / المرجع</td><td style="padding:8px 0;text-align:right"><code>${ref}</code></td></tr>
    </table>
    <p style="margin:16px 0 0;color:#888;font-size:12px">Brand History — brandshistory.com</p>
  </div>`;
}
