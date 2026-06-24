/**
 * PaymentProvider — clean interface behind which real PSPs plug in.
 *
 * No real network calls are made anywhere in this module. The shipped
 * implementation is MockPaymentProvider, selected via PAYMENT_PROVIDER=mock.
 *
 * Swap targets (KSA market), kept deliberately abstract here:
 *   - stc pay      → primary wallet rail. createCheckout() would request a
 *                    wallet payment session; confirm() would poll/verify status.
 *   - Moyasar      → card / mada acquirer with 3-D Secure. createCheckout()
 *                    would create a Moyasar payment + return its redirect/3DS
 *                    URL via sessionId; confirm() would verify the callback.
 *
 * Each real provider becomes a class implementing PaymentProvider and is
 * returned from getPaymentProvider() based on env — no call site changes.
 */

import { type Plan, amountForPlan } from "@/lib/pricing";

export type CheckoutSession = {
  sessionId: string;
  amountSar: number;
  plan: Plan;
};

export type ConfirmResult =
  | { status: "succeeded"; txnId: string }
  | { status: "declined"; txnId: string; reason: string };

export interface PaymentProvider {
  readonly id: string;
  /** Begin a checkout for a plan; returns a session reference + amount. */
  createCheckout(plan: Plan): Promise<CheckoutSession>;
  /** Verify/settle the session. Real providers verify a callback/webhook. */
  confirm(sessionId: string): Promise<ConfirmResult>;
}

/**
 * MockPaymentProvider — clearly a stand-in. Always "succeeds" unless the
 * session was flagged to simulate a decline (sessionId carries `_declined`,
 * which the checkout passes through from a `?simulate=declined` flag). No real
 * money moves; this only exercises the success/decline UI paths.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock";

  async createCheckout(plan: Plan): Promise<CheckoutSession> {
    return {
      sessionId: `mock_${plan}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      amountSar: amountForPlan(plan),
      plan,
    };
  }

  async confirm(sessionId: string): Promise<ConfirmResult> {
    const txnId = `mocktxn_${Math.random().toString(36).slice(2, 10)}`;
    if (sessionId.includes("_declined")) {
      return {
        status: "declined",
        txnId,
        reason: "card_declined",
      };
    }
    return { status: "succeeded", txnId };
  }
}

/**
 * Factory: reads PAYMENT_PROVIDER (defaults to "mock"). Add cases here for
 * "stcpay" and "moyasar" once those classes exist — call sites stay unchanged.
 */
export function getPaymentProvider(): PaymentProvider {
  const which = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (which) {
    // case "stcpay":  return new StcPayProvider();   // primary wallet
    // case "moyasar": return new MoyasarProvider();  // card/mada + 3DS
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}
