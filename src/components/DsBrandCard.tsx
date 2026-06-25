import { BrandCard as DsCard } from "@/components/ds";
import FavoriteButton from "./FavoriteButton";
import type { Brand, Locale } from "@/lib/types";

/**
 * Stable catalogue code (BH-####) derived from the brand id/slug so every
 * specimen plate carries a deterministic archive code without a schema change.
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
 * DsBrandCard — maps a Supabase Brand onto the Concept A DS BrandCard
 * (DitherPlate specimen + display name + mono meta + verified Badge). The
 * favorite control rides the card's children slot. Plate `develop` (M1) is on
 * by default in the DS component, so cards develop-in as they enter view.
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
    <DsCard
      name={name}
      meta={meta || undefined}
      initials={brand.initials}
      domain={brand.website}
      code={catalogueCode(brand.slug || brand.id)}
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
    </DsCard>
  );
}
