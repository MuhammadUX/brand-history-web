"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import type { NotificationRow } from "@/lib/notifications";
import { Button, Badge, StateBlock } from "@/components/ds";
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
  const [toast, setToast] = useState("");

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
    setToast("");
    const prevItems = items;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    startTransition(async () => {
      const res = await markNotificationRead(locale, id);
      if (!res.ok) {
        // Roll back the optimistic update and surface a toast.
        setItems(prevItems);
        setToast(dict.notifications.markReadError);
      }
    });
  }

  function onMarkAll() {
    setToast("");
    const prevItems = items;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      const res = await markAllNotificationsRead(locale);
      if (!res.ok) {
        setItems(prevItems);
        setToast(dict.notifications.markReadError);
      }
    });
  }

  if (items.length === 0) {
    return (
      <StateBlock
        state="empty"
        title={dict.notifications.emptyTitle}
        message={dict.notifications.emptyBody}
      />
    );
  }

  return (
    <div>
      <div aria-live="assertive" className="sr-only">
        {toast}
      </div>
      {toast && (
        <div
          role="alert"
          className="mb-4 border border-danger bg-surface px-4 py-3 font-mono text-[13px] text-danger"
        >
          <span aria-hidden="true" className="me-1">
            ⚠
          </span>
          {toast}
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <p aria-live="polite" className="font-mono text-[13px] text-metadata">
          {unreadCount > 0
            ? dict.notifications.unreadAria(unreadCount)
            : dict.notifications.emptyTitle}
        </p>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onMarkAll}
            disabled={pending}
          >
            {dict.notifications.markAllRead}
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((n) => {
          const title = (isAr ? n.title_ar : n.title_en) ?? "";
          const body = (isAr ? n.body_ar : n.body_en) ?? "";
          return (
            <li
              key={n.id}
              className={`border p-4 ${
                n.read
                  ? "border-hairline bg-surface"
                  : "border-ink bg-scaffold"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && <Badge kind="filter">{dict.notifications.new}</Badge>}
                    <h2 className="font-display text-[15px] leading-tight text-ink">
                      {title}
                    </h2>
                  </div>
                  {body && (
                    <p className="mt-1 font-mono text-[13px] leading-5 text-ink-700">
                      {body}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[11px] text-metadata">
                    {fmtDate(n.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {n.link && (
                  <Link
                    href={n.link.replace(/^\/(en|ar)\//, `/${locale}/`)}
                    className="label-mono text-ink hover:underline"
                  >
                    {dict.notifications.view} →
                  </Link>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    aria-label={dict.notifications.markReadAria}
                    className="label-mono text-metadata hover:text-ink"
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
