import Link from "next/link";
import LogoTile from "./LogoTile";
import FavoriteButton from "./FavoriteButton";
import type { Brand, Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";

interface BrandCardProps {
  brand: Brand;
  locale: Locale;
  /** Whether the signed-in user has favorited this brand (SSR-known). */
  isFavorited?: boolean;
  /** Whether the current visitor is authenticated. */
  isAuthed?: boolean;
}

export default function BrandCard({
  brand,
  locale,
  isFavorited = false,
  isAuthed = false,
}: BrandCardProps) {
  const dict = getDictionary(locale);
  const name = locale === "ar" ? brand.name_ar : brand.name_en;
  const sectorName =
    brand.sectors && (locale === "ar" ? brand.sectors.name_ar : brand.sectors.name_en);
  const meta = [sectorName, brand.region].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/${locale}/brand/${brand.slug}`}
      className="group flex flex-col gap-4 rounded-card border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <LogoTile initials={brand.initials} color={brand.primary_color} name={name} />
        <div className="flex items-center gap-2">
          {brand.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-verifiedBg px-2.5 py-1 text-xs font-medium text-verifiedText">
              <span aria-hidden="true">✓</span> {dict.card.verified}
            </span>
          )}
          <FavoriteButton
            brandId={brand.id}
            brandName={name}
            locale={locale}
            initialFavorited={isFavorited}
            initialAuthed={isAuthed}
            variant="icon"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ink">{name}</h3>
        {meta && <p className="text-sm text-secondary">{meta}</p>}
      </div>
      <p className="mt-auto text-xs text-tertiary">
        {dict.card.downloads(brand.download_count)}
      </p>
    </Link>
  );
}
