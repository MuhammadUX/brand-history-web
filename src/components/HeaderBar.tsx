"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LocaleToggle from "./LocaleToggle";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

interface HeaderBarProps {
  locale: Locale;
  /** Account / sign-in + Get Pro slot, computed server-side. */
  authSlot?: React.ReactNode;
}

/**
 * HeaderBar — The Library top chrome (client). Wordmark (dot + name), nav
 * (Discover / Browse / Sectors), a persistent search field that submits to the
 * search route, the EN/عربي LocaleToggle, and an auth/Get-Pro slot. Suppressed
 * on /admin routes (which render their own operator chrome).
 */
export default function HeaderBar({ locale, authSlot }: HeaderBarProps) {
  const dict = getDictionary(locale);
  const pathname = usePathname() || `/${locale}`;

  if (/(^|\/)admin(\/|$)/.test(pathname)) return null;

  const navCls =
    "rounded-pill px-3 py-2 text-[14px] font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-[68px] max-w-content items-center gap-5 px-6">
        <Link
          href={`/${locale}`}
          aria-label={`${dict.brandName} — home`}
          className="flex shrink-0 items-center gap-2.5 text-[19px] font-extrabold tracking-tight text-ink"
        >
          <span className="h-[11px] w-[11px] rounded-[3px] bg-ink" aria-hidden="true" />
          <span>{dict.brandName}</span>
        </Link>

        <nav className="ms-2 hidden items-center gap-1.5 md:flex">
          <Link href={`/${locale}/discover`} className={navCls}>
            {dict.nav.discover}
          </Link>
          <Link href={`/${locale}/browse`} className={navCls}>
            {dict.nav.browse}
          </Link>
          <Link href={`/${locale}/browse`} className={navCls}>
            {dict.nav.sectors}
          </Link>
        </nav>

        <form
          action={`/${locale}/search`}
          method="get"
          role="search"
          className="ms-auto hidden h-[42px] min-w-[240px] items-center gap-2.5 rounded-pill border border-line bg-surface-2 px-4 text-muted sm:flex"
        >
          <SearchIcon />
          <input
            type="search"
            name="q"
            placeholder={dict.nav.searchPlaceholder}
            aria-label={dict.nav.searchAria}
            className="w-full border-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
          />
        </form>

        <div className="ms-auto flex items-center gap-2.5 sm:ms-0">
          <LocaleToggle locale={locale} />
          {authSlot}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
