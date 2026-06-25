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
      className={`relative border border-dashed border-hairline bg-surface ${
        isSidebar ? "p-4" : "p-6"
      }`}
    >
      <span className="label-mono inline-flex items-center gap-1.5 text-metadata">
        [ {dict.ad.label} · {dict.ad.tag} ]
      </span>
      <p
        className={`mt-3 font-display leading-tight text-ink ${
          isSidebar ? "text-[15px]" : "text-lg"
        }`}
      >
        {dict.ad.body}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="label-mono inline-flex border border-hairline px-2 py-1 text-metadata">
          {dict.ad.cta}
        </span>
        <Link
          href={`/${locale}/pro`}
          className="label-mono text-ink hover:underline"
        >
          {dict.ad.removeAds} →
        </Link>
      </div>
    </aside>
  );
}
