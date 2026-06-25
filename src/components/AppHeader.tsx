import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { createServerSupabase } from "@/lib/supabase-server";
import { getIsPro } from "@/lib/entitlements";
import { getUnreadNotificationCount } from "@/lib/notifications";
import AccountMenu from "./AccountMenu";
import HeaderShell from "./HeaderShell";

/**
 * AppHeader · Concept A shared top chrome (server).
 *
 * Lifts the auth/Pro/notifications lookup that previously lived in TopNav and
 * feeds the DS <Header> (rendered by the client HeaderShell so the EN/ع toggle
 * can preserve the live pathname/query). Renders ONCE in the locale layout —
 * pages no longer mount their own header.
 */
export default async function AppHeader({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const displayName = user
    ? (user.user_metadata?.display_name as string | undefined) ||
      user.email ||
      ""
    : "";

  let role: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role;
  }

  const isPro = user ? await getIsPro() : false;
  const unread = user ? await getUnreadNotificationCount() : 0;

  const navLinkCls =
    "label-mono text-metadata mo-underline hover:text-ink hidden md:inline-flex";

  const authSlot = (
    <div className="flex items-center gap-3">
      <Link href={`/${locale}/browse`} className={navLinkCls}>
        {dict.nav.browse}
      </Link>
      <Link href={`/${locale}/discover`} className={navLinkCls}>
        {dict.nav.discover}
      </Link>
      {user ? (
        <>
          <Link
            href={`/${locale}/notifications`}
            aria-label={
              unread > 0
                ? dict.notifications.unreadAria(unread)
                : dict.notifications.bellAria
            }
            className="label-mono relative inline-flex items-center text-ink mo-underline"
          >
            {dict.notifications.title}
            {unread > 0 && (
              <span className="ms-1 inline-flex min-w-[1.1rem] items-center justify-center bg-ink px-0.5 text-[10px] text-paper tabular-nums">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <AccountMenu locale={locale} displayName={displayName} role={role} />
          {isPro ? (
            <Link
              href={`/${locale}/account`}
              className="label-mono inline-flex items-center gap-1 border border-ink bg-ink px-1 py-0.5 text-paper mo-invert"
            >
              [ {dict.nav.proBadge} ]
            </Link>
          ) : (
            <Link
              href={`/${locale}/pro`}
              className="label-mono inline-flex items-center border border-ink px-1 py-0.5 text-ink mo-invert hover:bg-ink hover:text-paper"
            >
              {dict.nav.getPro}
            </Link>
          )}
        </>
      ) : (
        <>
          <Link
            href={`/${locale}/login`}
            className="label-mono inline-flex items-center text-ink mo-underline"
          >
            {dict.nav.login}
          </Link>
          <Link
            href={`/${locale}/pro`}
            className="label-mono inline-flex items-center border border-ink px-1 py-0.5 text-ink mo-invert hover:bg-ink hover:text-paper"
          >
            {dict.nav.getPro}
          </Link>
        </>
      )}
    </div>
  );

  return (
    <HeaderShell
      locale={locale}
      wordmark={dict.brandName.toUpperCase()}
      systemLine="ARCHIVE · v1"
      authSlot={authSlot}
    />
  );
}
