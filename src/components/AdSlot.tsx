import { getEntitlements } from "@/lib/entitlements";
import { getDictionary } from "@/i18n";
import { AdSlot as AdSlotUi } from "@/components/ui";
import type { Locale } from "@/lib/types";

/**
 * AdSlot — server component. Renders a clearly-labeled "Sponsored" slot for
 * FREE users, and NOTHING for Pro users (entitlement ad_free). The ad/no-ad
 * decision is made server-side — never client-guessed, never on a download CTA.
 * Re-skinned onto the Library presentational AdSlot primitive.
 */
export default async function AdSlot({
  locale,
  variant = "row",
}: {
  locale: Locale;
  /** "row": wide banner between rows. "sidebar": compact card. */
  variant?: "row" | "sidebar";
}) {
  const entitlements = await getEntitlements();
  if (entitlements.ad_free) return null;

  const dict = getDictionary(locale);

  return (
    <AdSlotUi
      variant={variant}
      label={`${dict.ad.label} · ${dict.ad.tag}`}
      title={dict.ad.body}
      body={dict.ad.cta}
      cta={`${dict.ad.removeAds} →`}
      ctaHref={`/${locale}/login`}
    />
  );
}
