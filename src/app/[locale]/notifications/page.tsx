import { notFound, redirect } from "next/navigation";
import NotificationList from "@/components/NotificationList";
import { Shell } from "@/components/ds";
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
    <main id="main-content">
      <Shell>
        <header className="mb-6">
          <h1 className="font-display text-[32px] leading-tight text-ink">
            {dict.notifications.title}
          </h1>
          <p className="mt-3 font-mono text-[15px] leading-6 text-ink-700">
            {dict.notifications.subtitle}
          </p>
        </header>
        <NotificationList
          locale={typedLocale}
          initialNotifications={notifications}
        />
      </Shell>
    </main>
  );
}
