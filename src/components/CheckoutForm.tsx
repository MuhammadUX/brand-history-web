"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/i18n";
import { PRICING, type Plan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";
import { runCheckout } from "@/app/[locale]/checkout/actions";
import { Button, Checkbox, Badge } from "@/components/ds";

const primaryLink =
  "mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700";
const secondaryLink =
  "mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-transparent px-4 font-mono text-[11px] font-medium uppercase tracking-label text-ink hover:bg-ink hover:text-paper";

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
      <div className="border border-hairline bg-surface p-8 text-center">
        <Badge kind="pro" />
        <h2 className="mt-4 font-display text-2xl leading-tight text-ink">
          {dict.checkout.successTitle}
        </h2>
        <p className="mt-2 font-mono text-[15px] leading-6 text-ink-700">
          {dict.checkout.successBody}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          <Link href={`/${locale}/account`} className={primaryLink}>
            {dict.checkout.goAccount}
          </Link>
          <Link href={`/${locale}/discover`} className={secondaryLink}>
            {dict.checkout.explore}
          </Link>
        </div>
      </div>
    );
  }

  if (view === "declined") {
    return (
      <div className="border border-danger bg-surface p-8 text-center">
        <span
          className="inline-flex h-8 w-8 items-center justify-center border border-danger font-display text-danger"
          aria-hidden="true"
        >
          ✕
        </span>
        <h2 className="mt-4 font-display text-2xl leading-tight text-ink">
          {dict.checkout.declinedTitle}
        </h2>
        <p className="mt-2 font-mono text-[15px] leading-6 text-ink-700">
          {dict.checkout.declinedBody}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSimulateDeclined(false);
              setView("form");
            }}
            className={primaryLink}
          >
            {dict.checkout.retry}
          </button>
          <Link href={`/${locale}/pro`} className={secondaryLink}>
            {dict.pro.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      {/* Payment */}
      <div className="border border-hairline bg-surface p-6">
        <h2 className="font-display text-lg leading-tight text-ink">
          {dict.checkout.methods}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {methods.map((m) => (
            <span
              key={m.id}
              className={`label-mono inline-flex items-center gap-1.5 border px-3 py-2 ${
                m.primary
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline text-ink"
              }`}
            >
              {m.label}
              {m.primary && <span aria-hidden="true">★</span>}
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-metadata">
          {dict.checkout.methodsNote}
        </p>

        <div className="mt-6">
          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            label={dict.checkout.consent}
            className="items-start"
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
            className="mt-4 border border-danger bg-surface px-3 py-2 font-mono text-[13px] text-danger"
          >
            <span aria-hidden="true" className="me-1">
              ⚠
            </span>
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
        <p className="mt-3 text-center font-mono text-[11px] text-metadata">
          {dict.checkout.mockNote}
        </p>
      </div>

      {/* Summary */}
      <aside className="border border-hairline bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="label-mono text-metadata">{dict.checkout.summary}</h2>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[13px] text-metadata">
            {dict.checkout.plan}
          </span>
          <span className="font-mono text-[13px] text-ink">{planLabel}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[13px] text-metadata">
            {dict.checkout.total}
          </span>
          <span className="font-display text-lg leading-none text-ink tabular-nums">
            {dict.checkout.sar} {amount}
          </span>
        </div>
        <p className="mt-3 border-t border-hairline pt-3 font-mono text-[11px] text-metadata">
          {dict.checkout.renews(renewDate)}
        </p>
      </aside>
    </div>
  );
}
