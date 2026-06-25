"use client";

import { useState } from "react";
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
import { Button, Badge, Card, type BadgeKind } from "@/components/ui";

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
      <Card>
        <h3 className="text-[15px] font-bold leading-tight text-ink">
          {dict.accountPro.freeTitle}
        </h3>
        <p className="mt-1 text-[13px] leading-5 text-muted">
          {dict.accountPro.freeBody}
        </p>
        <Button href={`/${locale}/pro`} variant="primary" className="mt-4">
          {dict.accountPro.getPro}
        </Button>
      </Card>
    );
  }

  const statusLabel = dict.accountPro.status[status];
  const planLabel = subscription.plan
    ? dict.accountPro.planValue[subscription.plan]
    : "—";

  const statusBadgeKind: BadgeKind =
    status === "active" || status === "trialing"
      ? "verified"
      : status === "past_due"
        ? "archived"
        : "state";

  return (
    <div className="space-y-5">
      {status === "past_due" && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-[13px] text-danger"
        >
          <span aria-hidden="true">⚠</span>
          {dict.accountPro.pastDueBanner}
        </div>
      )}

      {isProNow && cancelsAtPeriodEnd && (
        <div className="rounded-md border border-line bg-surface-2 px-4 py-3 text-[13px] text-ink">
          {dict.accountPro.cancelsAtPeriodEnd(
            formatDate(subscription.current_period_end)
          )}
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">{dict.accountPro.statusLabel}</p>
            <span className="mt-1.5 inline-flex">
              <Badge kind={statusBadgeKind}>{statusLabel}</Badge>
            </span>
          </div>
          <div>
            <p className="label">{dict.accountPro.planLabel}</p>
            <p className="mt-1.5 text-[13px] text-ink">{planLabel}</p>
          </div>
          <div>
            <p className="label">
              {status === "canceled"
                ? dict.accountPro.canceledRenewal
                : dict.accountPro.renewalLabel}
            </p>
            <p className="mt-1.5 text-[13px] text-ink tnum">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>

        {/* Entitlements */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="label text-ink">{dict.accountPro.entitlementsTitle}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ENT_KEYS.map((key) => {
              const on = subscription.entitlements[key];
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 text-[13px] text-ink"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-[11px] ${
                      on
                        ? "border-ok/40 bg-ok/10 text-ok"
                        : "border-line text-muted"
                    }`}
                  >
                    {on ? "✓" : "—"}
                  </span>
                  <span className={on ? "" : "text-muted line-through"}>
                    {dict.accountPro.ent[key]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {note && (
          <p className="mt-5 flex items-center gap-1.5 rounded-md border border-ok/40 bg-ok/5 px-3 py-2 text-[13px] text-ink">
            <span aria-hidden="true" className="text-ok">
              ✓
            </span>
            {note}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
          {isProNow && !cancelsAtPeriodEnd ? (
            <Button
              type="button"
              variant="ghost"
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
        <p className="mt-3 text-[11px] text-muted">{dict.accountPro.mockNote}</p>
      </Card>
    </div>
  );
}
