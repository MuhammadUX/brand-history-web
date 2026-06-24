import Link from "next/link";
import { getEntitlements } from "@/lib/entitlements";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

/**
 * Server component. Renders a clearly-labeled "Sponsored / Ad" placeholder for
 * FREE users, and renders NOTHING for Pro users (entitlement ad_free).
 * The ad/no-ad decision is made server-side — never client-guessed, and never
 * shown on download surfaces.
 */
export default async function AdSlot({
  locale,
  variant = "row",
}: {
  locale: Locale;
  /** "row": wide banner between Discover rows. "sidebar": compact card. */
  variant?: "row" | "sidebar";
}) {
  const entitlements = await getEntitlements();
  if (entitlements.ad_free) return null;

  const dict = getDictionary(locale);
  const isSidebar = variant === "sidebar";

  return (
    <aside
      aria-label={dict.ad.label}
      className={`relative overflow-hidden rounded-card border border-dashed border-border bg-page ${
        isSidebar ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-sponsoredBg px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-sponsored">
        {dict.ad.label}
        <span className="rounded-sm bg-sponsored/15 px-1 text-[10px]">
          {dict.ad.tag}
        </span>
      </span>
      <p
        className={`mt-3 font-semibold text-ink ${
          isSidebar ? "text-base" : "text-lg"
        }`}
      >
        {dict.ad.body}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex rounded-btn bg-surface px-4 py-2 text-sm font-medium text-secondary">
          {dict.ad.cta}
        </span>
        <Link
          href={`/${locale}/pro`}
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          {dict.ad.removeAds} →
        </Link>
      </div>
    </aside>
  );
}
