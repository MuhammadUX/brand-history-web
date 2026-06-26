import { notFound } from "next/navigation";
import { Badge, Card, Button } from "@/components/ui";
import { getMoyasarInvoice } from "@/lib/payments/moyasar";
import { grantProForUser } from "@/lib/payments/grant";
import { getDictionary, isLocale } from "@/i18n";
import { isPlan, amountForPlan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Moyasar callback landing page.
 *
 * After payment, Moyasar redirects the buyer here and appends the invoice id as
 * a query param (commonly `?id=` or `?invoice_id=` — we handle both). We verify
 * the invoice server-side; if paid we grant Pro (idempotent — a safety net in
 * case the webhook lagged), then show success. Otherwise we show a pending /
 * declined state with a retry link to /pro.
 */
export default async function CheckoutReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string; invoice_id?: string; status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  const sp = await searchParams;
  const invoiceId = sp.id || sp.invoice_id || "";

  let paid = false;
  if (invoiceId) {
    try {
      const invoice = await getMoyasarInvoice(invoiceId);
      if (invoice.status === "paid") {
        paid = true;
        // Safety-net grant (idempotent — webhook may have already granted).
        const userId = invoice.metadata.user_id;
        const planRaw = invoice.metadata.plan;
        const expectedHalalas = isPlan(planRaw)
          ? amountForPlan(planRaw) * 100
          : -1;
        if (userId && isPlan(planRaw) && invoice.amount === expectedHalalas) {
          await grantProForUser(userId, planRaw, {
            provider: "moyasar",
            ref: invoiceId,
            amountSar: amountForPlan(planRaw),
          });
        }
      }
    } catch (e) {
      console.error("[checkout/return] verify failed:", e);
    }
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
      <h1 className="text-[32px] font-extrabold leading-tight tracking-display text-ink">
        {dict.checkout.title}
      </h1>

      <div className="mt-6">
        {paid ? (
          <Card className="p-8 text-center">
            <span className="inline-flex">
              <Badge kind="pro" />
            </span>
            <h2 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-ink">
              {dict.checkout.successTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-[46ch] text-[15px] leading-6 text-muted">
              {dict.checkout.successBody}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button href={`/${typedLocale}/account`} variant="primary">
                {dict.checkout.goAccount}
              </Button>
              <Button href={`/${typedLocale}/discover`} variant="ghost">
                {dict.checkout.explore}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="border-danger/40 p-8 text-center">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-danger/40 text-[16px] text-danger"
              aria-hidden="true"
            >
              ✕
            </span>
            <h2 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-ink">
              {dict.checkout.declinedTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-[46ch] text-[15px] leading-6 text-muted">
              {dict.checkout.declinedBody}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button href={`/${typedLocale}/pro`} variant="primary">
                {dict.checkout.retry}
              </Button>
              <Button href={`/${typedLocale}/pro`} variant="ghost">
                {dict.pro.back}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
