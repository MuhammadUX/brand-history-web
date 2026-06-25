"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Header } from "@/components/ds";
import { isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

/**
 * HeaderShell — client wrapper around the DS <Header>. Computes the EN/ع toggle
 * hrefs from the live pathname + query so switching locale preserves the route
 * (e.g. /ar/brand/stc/compare?a=1 ↔ /en/brand/stc/compare?a=1), matching the
 * old LocaleToggle behaviour. The auth slot is rendered server-side and passed
 * straight through.
 */
export default function HeaderShell({
  locale,
  wordmark,
  systemLine,
  authSlot,
}: {
  locale: Locale;
  wordmark: string;
  systemLine?: string;
  authSlot?: React.ReactNode;
}) {
  const pathname = usePathname() || `/${locale}`;
  const searchParams = useSearchParams();
  const query = searchParams?.toString();
  const suffix = query ? `?${query}` : "";

  // Operator/admin routes get their own OperatorSidebar chrome — suppress the
  // public marketing header there so there's no double chrome.
  if (/(^|\/)admin(\/|$)/.test(pathname)) {
    return null;
  }

  function hrefFor(target: Locale): string {
    const segments = pathname.split("/");
    if (segments.length > 1 && isLocale(segments[1])) {
      segments[1] = target;
    } else {
      segments.splice(1, 0, target);
    }
    return segments.join("/") + suffix;
  }

  return (
    <Header
      wordmark={wordmark}
      systemLine={systemLine}
      locale={locale}
      localeToggleHref={{ en: hrefFor("en"), ar: hrefFor("ar") }}
      authSlot={authSlot}
    />
  );
}
