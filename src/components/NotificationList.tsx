"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import type { NotificationRow } from "@/lib/notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/[locale]/notifications/actions";

export default function NotificationList({
  locale,
  initialNotifications,
}: {
  locale: Locale;
  initialNotifications: NotificationRow[];
}) {
  const dict = getDictionary(locale);
  const isAr = locale === "ar";
  const [items, setItems] = useState(initialNotifications);
  const [pending, startTransition] = useTransition();

  const unreadCount = items.filter((n) => !n.read).length;

  function fmtDate(iso: string | null) {
    if (!iso) return "";
    return new Intl.DateTimeFormat(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  }

  function onMarkRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    startTransition(() => {
      markNotificationRead(locale, id);
    });
  }

  function onMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => {
      markAllNotificationsRead(locale);
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <p className="text-base font-semibold text-ink">
          {dict.notifications.emptyTitle}
        </p>
        <p className="mt-1 text-sm text-secondary">
          {dict.notifications.emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p aria-live="polite" className="text-sm text-secondary">
          {unreadCount > 0
            ? dict.notifications.unreadAria(unreadCount)
            : dict.notifications.emptyTitle}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAll}
            disabled={pending}
            className="rounded-btn border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {dict.notifications.markAllRead}
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((n) => {
          const title = (isAr ? n.title_ar : n.title_en) ?? "";
          const body = (isAr ? n.body_ar : n.body_en) ?? "";
          return (
            <li
              key={n.id}
              className={`rounded-card border p-4 ${
                n.read
                  ? "border-border bg-surface"
                  : "border-primary/30 bg-primary-tint"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span
                        className="inline-flex rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      >
                        {dict.notifications.new}
                      </span>
                    )}
                    <h2 className="text-sm font-bold text-ink">{title}</h2>
                  </div>
                  {body && (
                    <p className="mt-1 text-sm text-secondary">{body}</p>
                  )}
                  <p className="mt-2 text-xs text-tertiary">
                    {fmtDate(n.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {n.link && (
                  <Link
                    href={n.link.replace(/^\/(en|ar)\//, `/${locale}/`)}
                    className="text-sm font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {dict.notifications.view} →
                  </Link>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    aria-label={dict.notifications.markReadAria}
                    className="text-sm font-medium text-secondary hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {dict.notifications.markRead}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
