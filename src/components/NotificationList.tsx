"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import type { NotificationRow } from "@/lib/notifications";
import { Button, Badge, StateBlock } from "@/components/ui";
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
        icon="🔔"
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
          className="mb-4 flex items-center gap-2 rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-[13px] text-danger"
        >
          <span aria-hidden="true">⚠</span>
          {toast}
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-[13px] text-muted">
          {unreadCount > 0
            ? dict.notifications.unreadAria(unreadCount)
            : dict.notifications.emptyTitle}
        </p>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
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
              className={`rounded-lg border p-4 ${
                n.read
                  ? "border-line bg-surface"
                  : "border-ink/15 bg-surface-2"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <Badge kind="pro">{dict.notifications.new}</Badge>
                    )}
                    <h2 className="text-[15px] font-bold leading-tight text-ink">
                      {title}
                    </h2>
                  </div>
                  {body && (
                    <p className="mt-1 text-[13px] leading-5 text-muted">
                      {body}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-muted">
                    {fmtDate(n.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {n.link && (
                  <Link
                    href={n.link.replace(/^\/(en|ar)\//, `/${locale}/`)}
                    className="text-[13px] font-semibold text-link hover:underline"
                  >
                    {dict.notifications.view} →
                  </Link>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    aria-label={dict.notifications.markReadAria}
                    className="min-h-[44px] text-[13px] font-semibold text-muted hover:text-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
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
