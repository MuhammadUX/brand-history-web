import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { createServerSupabase } from "@/lib/supabase-server";
import { getIsPro } from "@/lib/entitlements";
import { getUnreadNotificationCount } from "@/lib/notifications";
import AccountMenu from "./AccountMenu";
import LocaleToggle from "./LocaleToggle";

interface TopNavProps {
  locale: Locale;
  /**
   * @deprecated The locale toggle now preserves the live pathname/query via
   * LocaleToggle (client). Retained for backward compatibility with callers.
   */
  pathAfterLocale?: string;
}

export default async function TopNav({ locale }: TopNavProps) {
  const dict = getDictionary(locale);

  // Read the current session for the nav (logged-in greeting vs. Log in link).
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const displayName = user
    ? (user.user_metadata?.display_name as string | undefined) ||
      user.email ||
      ""
    : "";

  // Operator role (if any) to surface the console link in the account menu.
  let role: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role;
  }

  // Pro state (server-authoritative) — drives the nav CTA.
  const isPro = user ? await getIsPro() : false;

  // Unread notifications count for the bell badge.
  const unread = user ? await getUnreadNotificationCount() : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex h-[72px] max-w-container items-center gap-4 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="shrink-0 rounded-btn text-lg font-bold tracking-tight text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {dict.brandName}
        </Link>

        <form
          action={`/${locale}/search`}
          method="get"
          className="mx-2 hidden flex-1 md:block"
          role="search"
        >
          <input
            type="search"
            name="q"
            placeholder={dict.nav.searchPlaceholder}
            aria-label={dict.nav.searchPlaceholder}
            className="w-full rounded-btn border border-border bg-page px-4 py-2.5 text-sm text-ink placeholder:text-tertiary focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </form>

        <nav className="ms-auto flex items-center gap-2 sm:gap-3">
          <Link
            href={`/${locale}/browse`}
            className="hidden rounded-btn px-3 py-2 text-sm font-medium text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:inline-flex"
          >
            {dict.nav.browse}
          </Link>
          <Link
            href={`/${locale}/discover`}
            className="hidden rounded-btn px-3 py-2 text-sm font-medium text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:inline-flex"
          >
            {dict.nav.discover}
          </Link>
          <Suspense
            fallback={
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-pill border border-border px-3 text-sm font-medium text-ink">
                {dict.nav.toggleTo}
              </span>
            }
          >
            <LocaleToggle locale={locale} />
          </Suspense>
          {user ? (
            <>
              <Link
                href={`/${locale}/notifications`}
                aria-label={
                  unread > 0
                    ? dict.notifications.unreadAria(unread)
                    : dict.notifications.bellAria
                }
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-pill border border-border text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -end-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-pill bg-primary px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <AccountMenu locale={locale} displayName={displayName} role={role} />
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="hidden rounded-btn px-3 py-2 text-sm font-medium text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex"
            >
              {dict.nav.login}
            </Link>
          )}
          {isPro ? (
            <Link
              href={`/${locale}/account`}
              className="inline-flex items-center gap-1.5 rounded-btn border border-primary bg-primary-tint px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">★</span>
              {dict.nav.proBadge}
            </Link>
          ) : (
            <Link
              href={`/${locale}/pro`}
              className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.nav.getPro}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
