"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import type {
  Entitlements,
  SubscriptionRecord,
} from "@/lib/entitlements";
import {
  cancelSubscription,
  reactivateSubscription,
} from "@/app/[locale]/checkout/actions";

const ENT_KEYS: (keyof Entitlements)[] = [
  "ad_free",
  "high_res",
  "bulk_zip",
  "advanced_search",
  "api",
];

export default function SubscriptionPanel({
  locale,
  subscription,
}: {
  locale: Locale;
  subscription: SubscriptionRecord | null;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  const status = subscription?.status ?? "none";
  const isProNow = status === "active" || status === "trialing";
  const cancelsAtPeriodEnd = !!subscription?.cancel_at_period_end;

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  }

  async function onCancel() {
    setPending(true);
    setNote("");
    try {
      const res = await cancelSubscription();
      if (res.ok) {
        setNote(dict.accountPro.canceledNote);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function onReactivate() {
    setPending(true);
    setNote("");
    try {
      const res = await reactivateSubscription();
      if (res.ok) {
        setNote(dict.accountPro.reactivatedNote);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  // Free / no subscription.
  if (!subscription || status === "none") {
    return (
      <div className="rounded-card border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-ink">
          {dict.accountPro.freeTitle}
        </h3>
        <p className="mt-1 text-sm text-secondary">{dict.accountPro.freeBody}</p>
        <Link
          href={`/${locale}/pro`}
          className="mt-4 inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {dict.accountPro.getPro}
        </Link>
      </div>
    );
  }

  const statusLabel = dict.accountPro.status[status];
  const planLabel = subscription.plan
    ? dict.accountPro.planValue[subscription.plan]
    : "—";

  const statusCls =
    status === "active" || status === "trialing"
      ? "bg-verifiedBg text-verifiedText"
      : status === "past_due"
        ? "bg-sponsoredBg text-sponsored"
        : "bg-page text-secondary";

  return (
    <div className="space-y-5">
      {status === "past_due" && (
        <div className="rounded-card border border-sponsored/30 bg-sponsoredBg px-4 py-3 text-sm text-sponsored">
          {dict.accountPro.pastDueBanner}
        </div>
      )}

      {isProNow && cancelsAtPeriodEnd && (
        <div className="rounded-card border border-primary/30 bg-primary-tint px-4 py-3 text-sm text-primary">
          {dict.accountPro.cancelsAtPeriodEnd(
            formatDate(subscription.current_period_end)
          )}
        </div>
      )}

      <div className="rounded-card border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
              {dict.accountPro.statusLabel}
            </p>
            <span
              className={`mt-1 inline-flex rounded-pill px-2.5 py-1 text-xs font-semibold ${statusCls}`}
            >
              {statusLabel}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
              {dict.accountPro.planLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{planLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
              {status === "canceled"
                ? dict.accountPro.canceledRenewal
                : dict.accountPro.renewalLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>

        {/* Entitlements */}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-semibold text-ink">
            {dict.accountPro.entitlementsTitle}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ENT_KEYS.map((key) => {
              const on = subscription.entitlements[key];
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-pill text-xs font-bold ${
                      on
                        ? "bg-verifiedBg text-verifiedText"
                        : "bg-page text-tertiary"
                    }`}
                  >
                    {on ? "✓" : "—"}
                  </span>
                  <span className={on ? "" : "text-tertiary line-through"}>
                    {dict.accountPro.ent[key]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {note && (
          <p className="mt-5 rounded-btn bg-primary-tint px-3 py-2 text-sm text-primary">
            {note}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          {isProNow && !cancelsAtPeriodEnd ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="inline-flex rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {pending ? dict.accountPro.canceling : dict.accountPro.cancel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onReactivate}
              disabled={pending}
              className="inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {pending
                ? dict.accountPro.reactivating
                : dict.accountPro.reactivate}
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-tertiary">{dict.accountPro.mockNote}</p>
      </div>
    </div>
  );
}
