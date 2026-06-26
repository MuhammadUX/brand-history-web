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
  callbackUrl: string;
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
      callback_url: input.callbackUrl,
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
