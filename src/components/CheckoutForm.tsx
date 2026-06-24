"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/i18n";
import { PRICING, type Plan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";
import { runCheckout } from "@/app/[locale]/checkout/actions";

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
      <div className="rounded-card border border-border bg-surface p-8 text-center">
        <span className="inline-flex rounded-pill bg-verifiedBg px-3 py-1 text-xs font-semibold text-verifiedText">
          {dict.nav.proBadge}
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          {dict.checkout.successTitle}
        </h2>
        <p className="mt-2 text-base text-secondary">
          {dict.checkout.successBody}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${locale}/account`}
            className="inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.checkout.goAccount}
          </Link>
          <Link
            href={`/${locale}/discover`}
            className="inline-flex rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.checkout.explore}
          </Link>
        </div>
      </div>
    );
  }

  if (view === "declined") {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center">
        <span className="inline-flex rounded-pill bg-sponsoredBg px-3 py-1 text-xs font-semibold text-sponsored">
          ✕
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          {dict.checkout.declinedTitle}
        </h2>
        <p className="mt-2 text-base text-secondary">
          {dict.checkout.declinedBody}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSimulateDeclined(false);
              setView("form");
            }}
            className="inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.checkout.retry}
          </button>
          <Link
            href={`/${locale}/pro`}
            className="inline-flex rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.pro.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      {/* Payment */}
      <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-bold text-ink">{dict.checkout.methods}</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {methods.map((m) => (
            <span
              key={m.id}
              className={`inline-flex items-center gap-1.5 rounded-btn border px-4 py-2.5 text-sm font-semibold ${
                m.primary
                  ? "border-primary bg-primary-tint text-primary"
                  : "border-border bg-page text-secondary"
              }`}
            >
              {m.label}
              {m.primary && (
                <span className="rounded-pill bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ★
                </span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-tertiary">{dict.checkout.methodsNote}</p>

        <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>{dict.checkout.consent}</span>
        </label>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-xs text-tertiary">
          <input
            type="checkbox"
            checked={simulateDeclined}
            onChange={(e) => setSimulateDeclined(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>{dict.checkout.simulateDeclined}</span>
        </label>

        {error && (
          <p className="mt-4 rounded-btn bg-sponsoredBg px-3 py-2 text-sm text-sponsored">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onPay}
          disabled={pending}
          className="mt-6 inline-flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-base font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {pending ? dict.checkout.paying : dict.checkout.pay(amount)}
        </button>
        <p className="mt-3 text-center text-xs text-tertiary">
          {dict.checkout.mockNote}
        </p>
      </div>

      {/* Summary */}
      <aside className="rounded-card border border-border bg-page p-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">
          {dict.checkout.summary}
        </h2>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-secondary">{dict.checkout.plan}</span>
          <span className="text-sm font-semibold text-ink">{planLabel}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-secondary">{dict.checkout.total}</span>
          <span className="text-lg font-bold text-ink">
            {dict.checkout.sar} {amount}
          </span>
        </div>
        <p className="mt-3 border-t border-border pt-3 text-xs text-tertiary">
          {dict.checkout.renews(renewDate)}
        </p>
      </aside>
    </div>
  );
}
