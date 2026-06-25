"use client";

import { useState } from "react";
import ProfileForm from "./ProfileForm";
import AccountFavorites from "./AccountFavorites";
import SignOutButton from "./SignOutButton";
import SubscriptionPanel from "./SubscriptionPanel";
import PrivacyPanel from "./PrivacyPanel";
import { Tabs } from "@/components/ui";
import { getDictionary } from "@/i18n";
import type { Brand, Locale } from "@/lib/types";
import type { SubscriptionRecord } from "@/lib/entitlements";

type Tab = "profile" | "subscription" | "favorites" | "downloads" | "privacy";

export default function AccountTabs({
  locale,
  email,
  displayName,
  favorites,
  subscription,
}: {
  locale: Locale;
  email: string;
  displayName: string;
  favorites: Brand[];
  subscription: SubscriptionRecord | null;
}) {
  const dict = getDictionary(locale);
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: dict.account.tabs.profile },
    { id: "subscription", label: dict.accountPro.tab },
    { id: "favorites", label: dict.account.tabs.favorites },
    { id: "downloads", label: dict.account.tabs.downloads },
    { id: "privacy", label: dict.privacy.tab },
  ];

  return (
    <div>
      <Tabs
        tabs={tabs}
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        className="mb-6 border-b border-line pb-3"
      />

      {tab === "profile" && (
        <section role="tabpanel" aria-label={dict.account.tabs.profile}>
          <h2 className="text-[18px] font-bold leading-tight tracking-tight text-ink">
            {dict.account.profileTitle}
          </h2>
          <p className="mb-5 mt-1 text-[13px] leading-5 text-muted">
            {dict.account.profileSubtitle}
          </p>
          <ProfileForm
            locale={locale}
            email={email}
            initialDisplayName={displayName}
          />
          <div className="mt-8 border-t border-line pt-6">
            <SignOutButton locale={locale} />
          </div>
        </section>
      )}

      {tab === "subscription" && (
        <section role="tabpanel" aria-label={dict.accountPro.tab}>
          <h2 className="text-[18px] font-bold leading-tight tracking-tight text-ink">
            {dict.accountPro.title}
          </h2>
          <p className="mb-5 mt-1 text-[13px] leading-5 text-muted">
            {dict.accountPro.subtitle}
          </p>
          <SubscriptionPanel locale={locale} subscription={subscription} />
        </section>
      )}

      {tab === "favorites" && (
        <section role="tabpanel" aria-label={dict.account.tabs.favorites}>
          <h2 className="text-[18px] font-bold leading-tight tracking-tight text-ink">
            {dict.account.favoritesTitle}
          </h2>
          <p className="mb-5 mt-1 text-[13px] leading-5 text-muted">
            {dict.account.favoritesSubtitle}
          </p>
          <AccountFavorites locale={locale} initialBrands={favorites} />
        </section>
      )}

      {tab === "downloads" && (
        <section role="tabpanel" aria-label={dict.account.tabs.downloads}>
          <h2 className="text-[18px] font-bold leading-tight tracking-tight text-ink">
            {dict.account.downloadsTitle}
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-muted">
            {dict.account.downloadsBody}
          </p>
        </section>
      )}

      {tab === "privacy" && (
        <section role="tabpanel" aria-label={dict.privacy.tab}>
          <h2 className="text-[18px] font-bold leading-tight tracking-tight text-ink">
            {dict.privacy.title}
          </h2>
          <p className="mb-5 mt-1 text-[13px] leading-5 text-muted">
            {dict.privacy.subtitle}
          </p>
          <PrivacyPanel locale={locale} />
        </section>
      )}
    </div>
  );
}
