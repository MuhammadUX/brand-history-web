import { BrandCard } from "@/components/ui";
import FavoriteButton from "./FavoriteButton";
import type { Brand, Locale } from "@/lib/types";

/**
 * Stable catalogue code (BH-####) derived from the brand id/slug. Kept for any
 * remaining importers; The Library BrandCard does not render it, but the export
 * signature is preserved so callers continue to compile.
 */
export function catalogueCode(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `BH-${String(h % 10000).padStart(4, "0")}`;
}

interface DsBrandCardProps {
  brand: Brand;
  locale: Locale;
  isFavorited?: boolean;
  isAuthed?: boolean;
}

/**
 * DsBrandCard — thin wrapper over The Library `@/components/ui` BrandCard.
 * Maps a Supabase Brand onto BrandCard (name + meta + verified) and rides the
 * FavoriteButton in the card's overlay slot. Existing prop signature preserved.
 */
export default function DsBrandCard({
  brand,
  locale,
  isFavorited = false,
  isAuthed = false,
}: DsBrandCardProps) {
  const isAr = locale === "ar";
  const name = isAr ? brand.name_ar : brand.name_en;
  const sectorName =
    brand.sectors && (isAr ? brand.sectors.name_ar : brand.sectors.name_en);
  const meta = [sectorName, brand.region].filter(Boolean).join(" · ");

  return (
    <BrandCard
      name={name}
      meta={meta || undefined}
      initials={brand.initials}
      domain={brand.website}
      color={brand.primary_color}
      href={`/${locale}/brand/${brand.slug}`}
      verified={brand.is_verified}
    >
      <FavoriteButton
        brandId={brand.id}
        brandName={name}
        locale={locale}
        initialFavorited={isFavorited}
        initialAuthed={isAuthed}
        variant="icon"
      />
    </BrandCard>
  );
}
