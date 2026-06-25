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
import { Button, Badge } from "@/components/ds";

const primaryLink =
  "mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700";

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
      <div className="border border-hairline bg-surface p-6">
        <h3 className="font-display text-[15px] leading-tight text-ink">
          {dict.accountPro.freeTitle}
        </h3>
        <p className="mt-1 font-mono text-[13px] leading-5 text-ink-700">
          {dict.accountPro.freeBody}
        </p>
        <Link href={`/${locale}/pro`} className={`mt-4 ${primaryLink}`}>
          {dict.accountPro.getPro}
        </Link>
      </div>
    );
  }

  const statusLabel = dict.accountPro.status[status];
  const planLabel = subscription.plan
    ? dict.accountPro.planValue[subscription.plan]
    : "—";

  const statusBadgeKind =
    status === "active" || status === "trialing"
      ? "approved"
      : status === "past_due"
        ? "draft"
        : "unpublished";

  return (
    <div className="space-y-5">
      {status === "past_due" && (
        <div className="border border-danger bg-surface px-4 py-3 font-mono text-[13px] text-danger">
          <span aria-hidden="true" className="me-1">
            ⚠
          </span>
          {dict.accountPro.pastDueBanner}
        </div>
      )}

      {isProNow && cancelsAtPeriodEnd && (
        <div className="border border-hairline bg-scaffold px-4 py-3 font-mono text-[13px] text-ink">
          {dict.accountPro.cancelsAtPeriodEnd(
            formatDate(subscription.current_period_end)
          )}
        </div>
      )}

      <div className="border border-hairline bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-mono text-metadata">
              {dict.accountPro.statusLabel}
            </p>
            <span className="mt-1 inline-flex">
              <Badge kind={statusBadgeKind}>{statusLabel}</Badge>
            </span>
          </div>
          <div>
            <p className="label-mono text-metadata">
              {dict.accountPro.planLabel}
            </p>
            <p className="mt-1 font-mono text-[13px] text-ink">{planLabel}</p>
          </div>
          <div>
            <p className="label-mono text-metadata">
              {status === "canceled"
                ? dict.accountPro.canceledRenewal
                : dict.accountPro.renewalLabel}
            </p>
            <p className="mt-1 font-mono text-[13px] text-ink tabular-nums">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>

        {/* Entitlements */}
        <div className="mt-6 border-t border-hairline pt-5">
          <p className="label-mono text-ink">
            {dict.accountPro.entitlementsTitle}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ENT_KEYS.map((key) => {
              const on = subscription.entitlements[key];
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 font-mono text-[13px] text-ink"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-5 w-5 items-center justify-center border text-[11px] ${
                      on
                        ? "border-ink bg-ink text-paper"
                        : "border-hairline text-metadata"
                    }`}
                  >
                    {on ? "✓" : "—"}
                  </span>
                  <span className={on ? "" : "text-metadata line-through"}>
                    {dict.accountPro.ent[key]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {note && (
          <p className="mt-5 border border-hairline bg-surface px-3 py-2 font-mono text-[13px] text-ink">
            <span aria-hidden="true" className="me-1">
              [ ✓ ]
            </span>
            {note}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-hairline pt-5">
          {isProNow && !cancelsAtPeriodEnd ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={pending}
            >
              {pending ? dict.accountPro.canceling : dict.accountPro.cancel}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={onReactivate}
              disabled={pending}
            >
              {pending
                ? dict.accountPro.reactivating
                : dict.accountPro.reactivate}
            </Button>
          )}
        </div>
        <p className="mt-3 font-mono text-[11px] text-metadata">
          {dict.accountPro.mockNote}
        </p>
      </div>
    </div>
  );
}
