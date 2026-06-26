/**
 * Recurring renewal engine. Called by the daily cron (/api/cron/renew).
 *
 * For each active, non-cancelled subscription with a saved card token whose
 * term is ending within the lookahead window, we charge the token via Moyasar.
 * On success we extend the period and email a receipt; on failure we run a
 * small dunning sequence (retry on subsequent cron runs, then past_due).
 *
 * Server-only (uses the service-role admin client + the Moyasar secret key).
 */

import { createAdminSupabase } from "@/lib/supabase-admin";
import { chargeToken } from "./moyasar";
import { amountForPlan, isPlan, type Plan } from "@/lib/pricing";
import { sendEmail } from "@/lib/email/email-provider";

/** Days before period end to attempt the renewal (avoids a lapse). */
const LOOKAHEAD_DAYS = 1;
/** Total charge attempts before giving up and marking past_due. */
const MAX_ATTEMPTS = 3;

export interface RenewSummary {
  considered: number;
  renewed: number;
  retrying: number;
  failed: number;
}

/** Extend a period by one term, anchored to the later of (current end, now). */
function extendPeriod(fromIso: string | null, plan: Plan): string {
  const base = fromIso ? new Date(fromIso) : new Date();
  const anchor = base.getTime() > Date.now() ? base : new Date();
  const d = new Date(anchor);
  if (plan === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export async function runRenewals(now: Date = new Date()): Promise<RenewSummary> {
  const supabase = createAdminSupabase();
  const summary: RenewSummary = {
    considered: 0,
    renewed: 0,
    retrying: 0,
    failed: 0,
  };

  const dueBefore = new Date(
    now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: due, error } = await supabase
    .from("subscriptions")
    .select("user_id, plan, current_period_end, card_token, renew_attempts")
    .eq("status", "active")
    .eq("cancel_at_period_end", false)
    .not("card_token", "is", null)
    .lte("current_period_end", dueBefore)
    .limit(200);

  if (error) {
    console.error("[renew] query failed:", error.message);
    return summary;
  }

  for (const sub of due ?? []) {
    summary.considered += 1;
    const planRaw = sub.plan as string | null;
    const token = sub.card_token as string | null;
    if (!isPlan(planRaw) || !token) continue;
    const plan = planRaw;
    const amountSar = amountForPlan(plan);

    let paid = false;
    let chargeId: string | null = null;
    try {
      const res = await chargeToken({
        amountHalalas: amountSar * 100,
        token,
        description:
          plan === "annual"
            ? "Brand Assets Pro — annual renewal"
            : "Brand Assets Pro — monthly renewal",
        metadata: { user_id: sub.user_id, plan, kind: "renewal" },
      });
      chargeId = res.id;
      paid = res.status === "paid";
    } catch (e) {
      console.error("[renew] charge error:", e);
      paid = false;
    }

    const email = await userEmail(supabase, sub.user_id);

    if (paid && chargeId) {
      const newEnd = extendPeriod(sub.current_period_end as string | null, plan);
      const { error: updErr } = await supabase
        .from("subscriptions")
        .update({
          current_period_end: newEnd,
          renew_attempts: 0,
          renewal_state: "ok",
          last_renewal_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("user_id", sub.user_id);
      if (updErr) {
        console.error("[renew] period update failed:", updErr.message);
      }

      // Idempotent event (unique index on provider+invoice_id for succeeded).
      const { error: evErr } = await supabase.from("payment_events").insert({
        user_id: sub.user_id,
        provider: "moyasar",
        event_type: "payment_succeeded",
        amount_sar: amountSar,
        plan,
        detail: { invoice_id: chargeId, ref: chargeId, kind: "renewal" },
      });
      if (evErr && (evErr as { code?: string }).code !== "23505") {
        console.error("[renew] event insert failed:", evErr.message);
      }

      if (email) {
        await sendEmail({
          to: email,
          subject: "Your Brand Assets Pro renewal — تجديد اشتراك برو",
          html: renewalReceiptHtml(plan, amountSar, newEnd),
        }).catch(() => undefined);
      }
      summary.renewed += 1;
      continue;
    }

    // Failed charge → dunning.
    const attempts = (Number(sub.renew_attempts) || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
          renewal_state: "failed",
          renew_attempts: attempts,
          updated_at: now.toISOString(),
        })
        .eq("user_id", sub.user_id);
      await supabase.from("payment_events").insert({
        user_id: sub.user_id,
        provider: "moyasar",
        event_type: "payment_failed",
        amount_sar: amountSar,
        plan,
        detail: { kind: "renewal", attempts, final: true },
      });
      if (email) {
        await sendEmail({
          to: email,
          subject: "Action needed: Brand Assets Pro payment failed — فشل تجديد الاشتراك",
          html: dunningHtml(plan, true),
        }).catch(() => undefined);
      }
      summary.failed += 1;
    } else {
      await supabase
        .from("subscriptions")
        .update({
          renewal_state: "retrying",
          renew_attempts: attempts,
          updated_at: now.toISOString(),
        })
        .eq("user_id", sub.user_id);
      await supabase.from("payment_events").insert({
        user_id: sub.user_id,
        provider: "moyasar",
        event_type: "payment_failed",
        amount_sar: amountSar,
        plan,
        detail: { kind: "renewal", attempts, final: false },
      });
      if (email) {
        await sendEmail({
          to: email,
          subject: "We couldn't renew your Brand Assets Pro — لم نتمكن من تجديد اشتراكك",
          html: dunningHtml(plan, false),
        }).catch(() => undefined);
      }
      summary.retrying += 1;
    }
  }

  return summary;
}

async function userEmail(
  supabase: ReturnType<typeof createAdminSupabase>,
  userId: string
): Promise<string | null> {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function renewalReceiptHtml(plan: Plan, amountSar: number, end: string): string {
  const planLabel = plan === "annual" ? "Annual / سنوي" : "Monthly / شهري";
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 4px">Brand Assets Pro — renewed</h2>
    <p style="margin:0 0 16px;color:#555">Your subscription was renewed. تم تجديد اشتراكك.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#555">Plan / الباقة</td><td style="padding:8px 0;text-align:right"><strong>${planLabel}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#555">Amount / المبلغ</td><td style="padding:8px 0;text-align:right"><strong>SAR ${amountSar}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#555">Next renewal / التجديد القادم</td><td style="padding:8px 0;text-align:right"><strong>${fmtDate(end)}</strong></td></tr>
    </table>
    <p style="margin:16px 0 0;color:#888;font-size:12px">Brand Assets — brandassets.sa</p>
  </div>`;
}

function dunningHtml(plan: Plan, final: boolean): string {
  const planLabel = plan === "annual" ? "Annual / سنوي" : "Monthly / شهري";
  const line = final
    ? "We tried several times but couldn't renew your subscription, so Pro access will end. Update your card to restore it. حاولنا عدة مرات ولم ننجح؛ سينتهي وصول برو. حدّث بطاقتك لاستعادته."
    : "We couldn't charge your card for your Pro renewal. We'll try again soon — please check your card. لم نتمكن من خصم تجديد برو؛ سنحاول مرة أخرى قريباً، يرجى التحقق من بطاقتك.";
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 4px">Brand Assets Pro (${planLabel})</h2>
    <p style="margin:0 0 16px;color:#555">${line}</p>
    <p style="margin:16px 0 0"><a href="https://brandassets.sa/en/account" style="color:#7a5f30;font-weight:600">Manage your subscription →</a></p>
    <p style="margin:16px 0 0;color:#888;font-size:12px">Brand Assets — brandassets.sa</p>
  </div>`;
}
