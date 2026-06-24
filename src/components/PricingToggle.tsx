"use client";

import { useState } from "react";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import { PRICING, ANNUAL_SAVING_PERCENT, type Plan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";

/**
 * Monthly/annual toggle + price + primary CTA → /checkout?plan=...
 * The toggle is presentational; entitlement state is decided server-side.
 */
export default function PricingToggle({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [plan, setPlan] = useState<Plan>("annual");

  const monthlyAmount = PRICING.monthly.amountSar;
  const annualAmount = PRICING.annual.amountSar;
  const displayPerMonth =
    plan === "monthly" ? monthlyAmount : Math.round(annualAmount / 12);

  return (
    <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <div
        role="tablist"
        aria-label={dict.pro.title}
        className="mx-auto flex w-full max-w-xs rounded-pill border border-border bg-page p-1"
      >
        {(["monthly", "annual"] as Plan[]).map((p) => {
          const active = plan === p;
          return (
            <button
              key={p}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setPlan(p)}
              className={`relative flex-1 rounded-pill px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active ? "bg-surface text-ink shadow-sm" : "text-secondary"
              }`}
            >
              {p === "monthly" ? dict.pro.monthly : dict.pro.annual}
              {p === "annual" && (
                <span className="ms-1.5 rounded-pill bg-verifiedBg px-1.5 py-0.5 text-[10px] font-bold text-verifiedText">
                  {dict.pro.save(ANNUAL_SAVING_PERCENT)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <div className="flex items-end justify-center gap-1">
          <span className="text-sm font-medium text-secondary">
            {dict.pro.sar}
          </span>
          <span className="text-5xl font-bold tracking-tight text-ink">
            {displayPerMonth}
          </span>
          <span className="mb-1.5 text-sm font-medium text-secondary">
            {dict.pro.perMonth}
          </span>
        </div>
        {plan === "annual" && (
          <p className="mt-1.5 text-sm text-secondary">
            {dict.pro.billedAnnually(annualAmount)}
          </p>
        )}
      </div>

      <Link
        href={`/${locale}/checkout?plan=${plan}`}
        className="mt-6 inline-flex w-full items-center justify-center rounded-btn bg-primary px-5 py-3 text-base font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {dict.pro.upgrade}
      </Link>
      <p className="mt-3 text-center text-xs text-tertiary">{dict.pro.mockNote}</p>
    </div>
  );
}
