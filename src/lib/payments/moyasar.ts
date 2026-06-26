/**
 * Moyasar API wrappers (server-only).
 *
 * Auth: HTTP Basic with the SECRET key as the username and an empty password,
 * i.e. `Authorization: Basic base64(secretKey + ":")`. Reads MOYASAR_SECRET_KEY
 * from env — never hardcode. Amounts are integer halalas (SAR × 100).
 */

const MOYASAR_API = "https://api.moyasar.com/v1";

export interface MoyasarInvoice {
  id: string;
  url: string;
  status: string;
}

export interface MoyasarInvoiceDetail {
  status: string;
  amount: number; // halalas
  metadata: Record<string, string>;
}

function authHeader(): string {
  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) {
    throw new Error("MOYASAR_SECRET_KEY is not set.");
  }
  // Basic auth: secret key as username, empty password.
  const token = Buffer.from(`${secret}:`).toString("base64");
  return `Basic ${token}`;
}

export interface CreateInvoiceInput {
  amountHalalas: number;
  description: string;
  /** Where the payer is redirected by the browser once the invoice is paid. */
  successUrl: string;
  /** Where the payer is redirected if they click "back" on the hosted page. */
  backUrl: string;
  metadata: Record<string, string>;
}

/** Create a hosted-invoice payment. Returns the id + hosted payment page url. */
export async function createMoyasarInvoice(
  input: CreateInvoiceInput
): Promise<MoyasarInvoice> {
  const res = await fetch(`${MOYASAR_API}/invoices`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountHalalas,
      currency: "SAR",
      description: input.description,
      // For invoices, success_url is the browser redirect after payment;
      // callback_url is only a server notification (we use the dashboard webhook
      // for that), so we set the redirect URLs here instead.
      success_url: input.successUrl,
      back_url: input.backUrl,
      metadata: input.metadata,
    }),
    // Never cache payment calls.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`moyasar_create_failed_${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    id?: string;
    url?: string;
    status?: string;
  };
  if (!data.id || !data.url) {
    throw new Error("moyasar_create_invalid_response");
  }
  return {
    id: data.id,
    url: data.url,
    status: data.status ?? "initiated",
  };
}

/** Fetch an invoice to verify its status + amount server-side. */
export async function getMoyasarInvoice(
  id: string
): Promise<MoyasarInvoiceDetail> {
  const res = await fetch(`${MOYASAR_API}/invoices/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`moyasar_fetch_failed_${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    status?: string;
    amount?: number;
    metadata?: Record<string, string> | null;
  };
  return {
    status: data.status ?? "unknown",
    amount: typeof data.amount === "number" ? data.amount : 0,
    metadata: data.metadata ?? {},
  };
}

export interface MoyasarPaymentDetail {
  status: string;
  amount: number; // halalas
  metadata: Record<string, string>;
  token: string | null; // saved-card token when the payer chose save_card
  last4: string | null;
  brand: string | null;
}

/**
 * Fetch a single payment (used by the tokenizing embedded-form return flow).
 * The payment's `source` carries the saved-card `token`, masked `number`, and
 * `company` (brand) when save_card was enabled.
 */
export async function getMoyasarPayment(
  id: string
): Promise<MoyasarPaymentDetail> {
  const res = await fetch(`${MOYASAR_API}/payments/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`moyasar_payment_fetch_failed_${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    status?: string;
    amount?: number;
    metadata?: Record<string, string> | null;
    source?: { token?: string | null; number?: string | null; company?: string | null };
  };
  const masked = data.source?.number ?? null;
  const last4 = masked ? masked.replace(/[^0-9]/g, "").slice(-4) : null;
  return {
    status: data.status ?? "unknown",
    amount: typeof data.amount === "number" ? data.amount : 0,
    metadata: data.metadata ?? {},
    token: data.source?.token ?? null,
    last4,
    brand: data.source?.company ?? null,
  };
}

export interface ChargeTokenInput {
  amountHalalas: number;
  token: string;
  description: string;
  metadata: Record<string, string>;
  /**
   * 3-D Secure. For unattended, merchant-initiated renewals this is false
   * (the cardholder is not present). Some issuers/mada may still require 3DS;
   * in that case the payment will not reach "paid" and we treat it as a failed
   * renewal (dunning). Confirm your account's recurring policy with Moyasar.
   */
  threeDS?: boolean;
}

export interface ChargeResult {
  id: string;
  status: string; // "paid" on success
}

/**
 * Charge a previously-saved card token (recurring renewal). Server-only:
 * authenticates with the SECRET key. Never trust the returned status alone for
 * irreversible side effects elsewhere — but for a renewal, status "paid" here
 * (Basic-auth, server-to-server) is authoritative.
 */
export async function chargeToken(
  input: ChargeTokenInput
): Promise<ChargeResult> {
  const res = await fetch(`${MOYASAR_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountHalalas,
      currency: "SAR",
      description: input.description,
      metadata: input.metadata,
      source: {
        type: "token",
        token: input.token,
        "3ds": input.threeDS ?? false,
        manual: false,
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`moyasar_charge_failed_${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { id?: string; status?: string };
  if (!data.id) throw new Error("moyasar_charge_invalid_response");
  return { id: data.id, status: data.status ?? "unknown" };
}

export interface MoyasarToken {
  status: string; // "active" when usable
  brand: string | null;
  last_four: string | null;
}

/** Fetch saved-card info for a token (brand + last four for UX). */
export async function getMoyasarToken(token: string): Promise<MoyasarToken> {
  const res = await fetch(`${MOYASAR_API}/tokens/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`moyasar_token_fetch_failed_${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    status?: string;
    brand?: string;
    last_four?: string;
  };
  return {
    status: data.status ?? "unknown",
    brand: data.brand ?? null,
    last_four: data.last_four ?? null,
  };
}

/** Invalidate a saved card token (user removed their card). Best-effort. */
export async function deleteMoyasarToken(token: string): Promise<void> {
  await fetch(`${MOYASAR_API}/tokens/${encodeURIComponent(token)}`, {
    method: "DELETE",
    headers: { Authorization: authHeader() },
    cache: "no-store",
  }).catch(() => undefined);
}
