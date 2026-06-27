import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { createServerSupabase } from "@/lib/supabase-server";
import { getUnreadNotificationCount } from "@/lib/notifications";
import AccountMenu from "./AccountMenu";
import HeaderBar from "./HeaderBar";

/**
 * AppHeader · The Library shared top chrome (server).
 *
 * Keeps the existing auth / Pro / notifications lookup and feeds the client
 * HeaderBar (so the persistent search + EN/عربي toggle can read the live
 * pathname). Renders ONCE in the locale layout — pages do not mount their own
 * header.
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

  const unread = user ? await getUnreadNotificationCount() : 0;

  // Subscriptions are hidden in the current free model, so there is no "Get Pro"
  // CTA. Anonymous visitors get a prominent Sign in pill (signing in removes
  // ads); signed-in visitors get notifications + the account menu.
  const signInPill =
    "inline-flex h-[42px] shrink-0 items-center rounded-pill bg-ink px-[18px] text-[13.5px] font-semibold text-white transition-colors duration-150 hover:bg-black";

  const authSlot = user ? (
    <>
      <Link
        href={`/${locale}/notifications`}
        aria-label={
          unread > 0
            ? dict.notifications.unreadAria(unread)
            : dict.notifications.bellAria
        }
        className="relative hidden h-[42px] items-center rounded-pill border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink hover:bg-surface-2 md:inline-flex"
      >
        {dict.notifications.title}
        {unread > 0 && (
          <span className="ms-1.5 inline-flex min-w-[18px] items-center justify-center rounded-pill bg-ink px-1 text-[10px] tabular-nums text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <AccountMenu locale={locale} displayName={displayName} role={role} />
    </>
  ) : (
    <Link href={`/${locale}/login`} className={signInPill}>
      {dict.nav.login}
    </Link>
  );

  return <HeaderBar locale={locale} authSlot={authSlot} />;
}
