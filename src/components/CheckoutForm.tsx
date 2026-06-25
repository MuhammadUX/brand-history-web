"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/i18n";
import { PRICING, type Plan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";
import { runCheckout } from "@/app/[locale]/checkout/actions";
import { Button, Checkbox, Badge, Card } from "@/components/ui";

type View = "form" | "success" | "declined";

export default function CheckoutForm({
  locale,
  plan,
  renewDate,
}: {
  locale: Locale;
  plan: Plan;
  renewDate: string;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const amount = PRICING[plan].amountSar;

  const [consent, setConsent] = useState(false);
  const [simulateDeclined, setSimulateDeclined] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [view, setView] = useState<View>("form");

  const planLabel =
    plan === "annual" ? dict.checkout.planAnnual : dict.checkout.planMonthly;

  const methods = [
    { id: "stcpay", label: dict.checkout.stcpay, primary: true },
    { id: "mada", label: dict.checkout.mada, primary: false },
    { id: "visa", label: dict.checkout.visa, primary: false },
    { id: "mastercard", label: dict.checkout.mastercard, primary: false },
  ];

  async function onPay() {
    setError("");
    if (!consent) {
      setError(dict.checkout.consentRequired);
      return;
    }
    setPending(true);
    try {
      const res = await runCheckout(plan, simulateDeclined);
      if (res.status === "success" || res.status === "already_pro") {
        setView("success");
        router.refresh();
      } else if (res.status === "declined") {
        setView("declined");
      } else {
        setError(dict.auth.genericError);
      }
    } catch {
      setError(dict.auth.genericError);
    } finally {
      setPending(false);
    }
  }

  if (view === "success") {
    return (
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
          <Button href={`/${locale}/account`} variant="primary">
            {dict.checkout.goAccount}
          </Button>
          <Button href={`/${locale}/discover`} variant="ghost">
            {dict.checkout.explore}
          </Button>
        </div>
      </Card>
    );
  }

  if (view === "declined") {
    return (
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
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setSimulateDeclined(false);
              setView("form");
            }}
          >
            {dict.checkout.retry}
          </Button>
          <Button href={`/${locale}/pro`} variant="ghost">
            {dict.pro.back}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      {/* Payment */}
      <Card>
        <h2 className="text-[18px] font-bold leading-tight tracking-tight text-ink">
          {dict.checkout.methods}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {methods.map((m) => (
            <span
              key={m.id}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-2 text-[12px] font-semibold ${
                m.primary
                  ? "border-transparent bg-ink text-white"
                  : "border-line text-ink"
              }`}
            >
              {m.label}
              {m.primary && (
                <span aria-hidden="true" className="text-link">
                  ★
                </span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">{dict.checkout.methodsNote}</p>

        <div className="mt-6">
          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            label={dict.checkout.consent}
          />
        </div>

        <div className="mt-4">
          <Checkbox
            checked={simulateDeclined}
            onChange={(e) => setSimulateDeclined(e.target.checked)}
            label={dict.checkout.simulateDeclined}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-md border border-danger/40 bg-danger/5 px-3 py-2.5 text-[13px] text-danger"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="primary"
          onClick={onPay}
          disabled={pending}
          className="mt-6 w-full"
        >
          {pending ? dict.checkout.paying : dict.checkout.pay(amount)}
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted">
          {dict.checkout.mockNote}
        </p>
      </Card>

      {/* Summary */}
      <Card className="lg:sticky lg:top-24" title={dict.checkout.summary}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">{dict.checkout.plan}</span>
          <span className="text-[13px] text-ink">{planLabel}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[13px] text-muted">{dict.checkout.total}</span>
          <span className="text-[18px] font-bold leading-none text-ink tnum">
            {dict.checkout.sar} {amount}
          </span>
        </div>
        <p className="mt-3 border-t border-line pt-3 text-[11px] text-muted">
          {dict.checkout.renews(renewDate)}
        </p>
      </Card>
    </div>
  );
}
