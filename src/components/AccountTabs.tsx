"use client";

import { useState } from "react";
import ProfileForm from "./ProfileForm";
import AccountFavorites from "./AccountFavorites";
import SignOutButton from "./SignOutButton";
import SubscriptionPanel from "./SubscriptionPanel";
import PrivacyPanel from "./PrivacyPanel";
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
      <div
        role="tablist"
        aria-label={dict.account.title}
        className="mb-6 flex flex-wrap gap-1 border-b border-border"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-secondary hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <section role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">
          <h2 className="text-lg font-bold text-ink">
            {dict.account.profileTitle}
          </h2>
          <p className="mb-5 mt-1 text-sm text-secondary">
            {dict.account.profileSubtitle}
          </p>
          <ProfileForm
            locale={locale}
            email={email}
            initialDisplayName={displayName}
          />
          <div className="mt-8 border-t border-border pt-6">
            <SignOutButton locale={locale} />
          </div>
        </section>
      )}

      {tab === "subscription" && (
        <section
          role="tabpanel"
          id="panel-subscription"
          aria-labelledby="tab-subscription"
        >
          <h2 className="text-lg font-bold text-ink">
            {dict.accountPro.title}
          </h2>
          <p className="mb-5 mt-1 text-sm text-secondary">
            {dict.accountPro.subtitle}
          </p>
          <SubscriptionPanel locale={locale} subscription={subscription} />
        </section>
      )}

      {tab === "favorites" && (
        <section
          role="tabpanel"
          id="panel-favorites"
          aria-labelledby="tab-favorites"
        >
          <h2 className="text-lg font-bold text-ink">
            {dict.account.favoritesTitle}
          </h2>
          <p className="mb-5 mt-1 text-sm text-secondary">
            {dict.account.favoritesSubtitle}
          </p>
          <AccountFavorites locale={locale} initialBrands={favorites} />
        </section>
      )}

      {tab === "downloads" && (
        <section
          role="tabpanel"
          id="panel-downloads"
          aria-labelledby="tab-downloads"
        >
          <h2 className="text-lg font-bold text-ink">
            {dict.account.downloadsTitle}
          </h2>
          <p className="mt-1 text-sm text-secondary">
            {dict.account.downloadsBody}
          </p>
        </section>
      )}

      {tab === "privacy" && (
        <section
          role="tabpanel"
          id="panel-privacy"
          aria-labelledby="tab-privacy"
        >
          <h2 className="text-lg font-bold text-ink">{dict.privacy.title}</h2>
          <p className="mb-5 mt-1 text-sm text-secondary">
            {dict.privacy.subtitle}
          </p>
          <PrivacyPanel locale={locale} />
        </section>
      )}
    </div>
  );
}
