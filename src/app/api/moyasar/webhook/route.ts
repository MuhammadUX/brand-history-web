import { NextResponse } from "next/server";
import { getMoyasarInvoice } from "@/lib/payments/moyasar";
import { grantProForUser } from "@/lib/payments/grant";
import { isPlan, amountForPlan } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Moyasar webhook.
 *
 * Security: Moyasar includes a `secret_token` in the body equal to the shared
 * secret configured on the webhook. We verify it against MOYASAR_WEBHOOK_SECRET.
 * Defense in depth: we re-fetch the invoice from the API and confirm
 * status==="paid" and the amount before granting (never trust the body alone).
 *
 * We return 200 quickly for anything ignorable so Moyasar doesn't retry-storm;
 * only a bad/missing secret returns 401.
 */
export async function POST(req: Request) {
  let body: {
    type?: string;
    secret_token?: string;
    data?: {
      id?: string;
      status?: string;
      metadata?: Record<string, string> | null;
    };
  };

  try {
    body = await req.json();
  } catch {
    // Malformed JSON — ack so it isn't retried forever.
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 200 });
  }

  // Verify shared secret.
  const expected = process.env.MOYASAR_WEBHOOK_SECRET;
  if (!expected || body.secret_token !== expected) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const eventType = body.type ?? "";
  const isPaidEvent =
    eventType === "payment_paid" ||
    eventType === "invoice_paid" ||
    body.data?.status === "paid";

  if (!isPaidEvent) {
    // Not a grant-triggering event (e.g. payment_failed) — ack and move on.
    return NextResponse.json({ ok: true, ignored: eventType || "unknown" });
  }

  const invoiceId = body.data?.id;
  if (!invoiceId) {
    return NextResponse.json({ ok: true, ignored: "no_invoice_id" });
  }

  try {
    // Re-fetch the invoice from the API (defense in depth).
    const invoice = await getMoyasarInvoice(invoiceId);
    if (invoice.status !== "paid") {
      return NextResponse.json({ ok: true, ignored: "not_paid_on_verify" });
    }

    const userId = invoice.metadata.user_id;
    const planRaw = invoice.metadata.plan;
    if (!userId || !isPlan(planRaw)) {
      console.error("[webhook] missing/invalid metadata", invoice.metadata);
      return NextResponse.json({ ok: true, ignored: "bad_metadata" });
    }

    // Sanity-check the amount matches the plan price (halalas = SAR × 100).
    const expectedHalalas = amountForPlan(planRaw) * 100;
    if (invoice.amount !== expectedHalalas) {
      console.error(
        "[webhook] amount mismatch",
        invoice.amount,
        "expected",
        expectedHalalas
      );
      return NextResponse.json({ ok: true, ignored: "amount_mismatch" });
    }

    const result = await grantProForUser(userId, planRaw, {
      provider: "moyasar",
      ref: invoiceId,
      amountSar: amountForPlan(planRaw),
    });
    if (!result.ok) {
      console.error("[webhook] grant failed:", result.error);
      // Return 200 anyway so Moyasar doesn't hammer us; the return page is a
      // safety net and we've logged the failure.
      return NextResponse.json({ ok: false, reason: result.error });
    }

    return NextResponse.json({
      ok: true,
      granted: !result.alreadyGranted,
      alreadyGranted: !!result.alreadyGranted,
    });
  } catch (e) {
    console.error("[webhook] processing error:", e);
    // Ack to avoid retry storms; failure is logged and recoverable via return page.
    return NextResponse.json({ ok: false, reason: "processing_error" });
  }
}
