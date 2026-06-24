"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getDictionary, isLocale, otherLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

/**
 * Locale switch that preserves the full current path and query, swapping only
 * the leading locale segment. e.g. /ar/brand/stc/compare?a=1 ↔ /en/brand/stc/compare?a=1.
 */
export default function LocaleToggle({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const other = otherLocale(locale);
  const pathname = usePathname() || `/${locale}`;
  const searchParams = useSearchParams();

  // Replace only the first path segment (the locale) with the other locale.
  const segments = pathname.split("/"); // ["", "ar", "brand", ...]
  if (segments.length > 1 && isLocale(segments[1])) {
    segments[1] = other;
  } else {
    // No locale segment present — prefix the other locale.
    segments.splice(1, 0, other);
  }
  const query = searchParams?.toString();
  const href = segments.join("/") + (query ? `?${query}` : "");

  return (
    <Link
      href={href}
      aria-label={dict.nav.toggleAria}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-pill border border-border px-3 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {dict.nav.toggleTo}
    </Link>
  );
}
