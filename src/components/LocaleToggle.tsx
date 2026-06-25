"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getDictionary, isLocale, otherLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

/**
 * LocaleToggle — Library EN/عربي switch. Preserves the full current path and
 * query, swapping only the leading locale segment.
 * e.g. /ar/brand/stc/compare?a=1 ↔ /en/brand/stc/compare?a=1.
 */
export default function LocaleToggle({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const other = otherLocale(locale);
  const pathname = usePathname() || `/${locale}`;
  const searchParams = useSearchParams();

  const segments = pathname.split("/"); // ["", "ar", "brand", ...]
  if (segments.length > 1 && isLocale(segments[1])) {
    segments[1] = other;
  } else {
    segments.splice(1, 0, other);
  }
  const query = searchParams?.toString();
  const href = segments.join("/") + (query ? `?${query}` : "");

  return (
    <Link
      href={href}
      aria-label={dict.nav.toggleAria}
      className="inline-flex h-[42px] min-w-[44px] shrink-0 items-center justify-center rounded-pill border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors duration-150 hover:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      {dict.nav.toggleTo}
    </Link>
  );
}
