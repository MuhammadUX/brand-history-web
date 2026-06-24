import { notFound, redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import NotificationList from "@/components/NotificationList";
import { createServerSupabase } from "@/lib/supabase-server";
import { getNotifications } from "@/lib/notifications";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${typedLocale}/login?next=/${typedLocale}/notifications`);
  }

  const notifications = await getNotifications();

  return (
    <>
      <TopNav locale={typedLocale} pathAfterLocale="notifications" />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {dict.notifications.title}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {dict.notifications.subtitle}
          </p>
        </header>
        <NotificationList
          locale={typedLocale}
          initialNotifications={notifications}
        />
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
