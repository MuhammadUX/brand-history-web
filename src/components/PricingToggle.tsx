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
    <div className="border border-hairline bg-surface p-6">
      <div
        role="tablist"
        aria-label={dict.pro.title}
        className="mx-auto flex w-full max-w-xs border border-hairline bg-paper"
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
              className={`mo-invert relative flex-1 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-label ${
                active ? "bg-ink text-paper" : "text-metadata hover:text-ink"
              }`}
            >
              {p === "monthly" ? dict.pro.monthly : dict.pro.annual}
              {p === "annual" && (
                <span className="ms-1.5 border border-current px-1 py-0.5 text-[10px]">
                  {dict.pro.save(ANNUAL_SAVING_PERCENT)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <div className="flex items-end justify-center gap-1">
          <span className="font-mono text-[13px] text-metadata">
            {dict.pro.sar}
          </span>
          <span className="font-display text-5xl leading-none text-ink tabular-nums">
            {displayPerMonth}
          </span>
          <span className="mb-1.5 font-mono text-[13px] text-metadata">
            {dict.pro.perMonth}
          </span>
        </div>
        {plan === "annual" && (
          <p className="mt-1.5 font-mono text-[13px] text-metadata">
            {dict.pro.billedAnnually(annualAmount)}
          </p>
        )}
      </div>

      <Link
        href={`/${locale}/checkout?plan=${plan}`}
        className="mo-invert mo-press mt-6 inline-flex h-10 w-full items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700"
      >
        {dict.pro.upgrade}
      </Link>
      <p className="mt-3 text-center font-mono text-[11px] text-metadata">
        {dict.pro.mockNote}
      </p>
    </div>
  );
}
