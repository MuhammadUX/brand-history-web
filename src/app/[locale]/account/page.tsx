import { notFound, redirect } from "next/navigation";
import AccountTabs from "@/components/AccountTabs";
import FavoritesMerger from "@/components/FavoritesMerger";
import { Shell } from "@/components/ds";
import { createServerSupabase } from "@/lib/supabase-server";
import { getFavoriteBrands } from "@/lib/favorites";
import { getSubscription } from "@/lib/entitlements";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage({
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
    redirect(`/${typedLocale}/login?next=/${typedLocale}/account`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ||
    (user.user_metadata?.display_name as string | undefined) ||
    "";

  const [favorites, subscription] = await Promise.all([
    getFavoriteBrands(),
    getSubscription(),
  ]);

  return (
    <main id="main-content">
      <Shell>
        <header className="mb-6">
          <h1 className="font-display text-[32px] leading-tight text-ink">
            {dict.account.title}
          </h1>
        </header>
        {/* Merge any device-local favorites into the account on first load. */}
        <FavoritesMerger locale={typedLocale} />
        <AccountTabs
          locale={typedLocale}
          email={user.email ?? ""}
          displayName={displayName}
          favorites={favorites}
          subscription={subscription}
        />
      </Shell>
    </main>
  );
}
