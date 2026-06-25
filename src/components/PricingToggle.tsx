"use client";

import { useState } from "react";
import { getDictionary } from "@/i18n";
import { PRICING, ANNUAL_SAVING_PERCENT, type Plan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";
import { Card, Button } from "@/components/ui";

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
    <Card>
      <div
        role="tablist"
        aria-label={dict.pro.title}
        className="mx-auto flex w-full max-w-xs gap-1 rounded-pill border border-line bg-surface-2 p-1"
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
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
                active ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              {p === "monthly" ? dict.pro.monthly : dict.pro.annual}
              {p === "annual" && (
                <span
                  className={`rounded-pill px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-white/20 text-white" : "bg-ok/10 text-ok"
                  }`}
                >
                  {dict.pro.save(ANNUAL_SAVING_PERCENT)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <div className="flex items-end justify-center gap-1">
          <span className="text-[13px] text-muted">{dict.pro.sar}</span>
          <span className="text-[48px] font-extrabold leading-none tracking-display text-ink tnum">
            {displayPerMonth}
          </span>
          <span className="mb-1.5 text-[13px] text-muted">
            {dict.pro.perMonth}
          </span>
        </div>
        {plan === "annual" && (
          <p className="mt-1.5 text-[13px] text-muted">
            {dict.pro.billedAnnually(annualAmount)}
          </p>
        )}
      </div>

      <Button
        href={`/${locale}/checkout?plan=${plan}`}
        variant="primary"
        className="mt-6 w-full"
      >
        {dict.pro.upgrade}
      </Button>
      <p className="mt-3 text-center text-[11px] text-muted">
        {dict.pro.mockNote}
      </p>
    </Card>
  );
}
