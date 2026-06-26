import { NextResponse } from "next/server";
import { runRenewals } from "@/lib/payments/renew";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Allow the renewal pass enough time to charge a batch of tokens.
export const maxDuration = 300;

/**
 * Daily recurring-renewal cron.
 *
 * Triggered by Vercel Cron (see vercel.json). Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET env var is set, so
 * we reject any request whose bearer token doesn't match — this prevents the
 * public URL from being used to trigger charges.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runRenewals();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    console.error("[cron/renew] failed:", e);
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
