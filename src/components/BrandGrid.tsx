import BrandCard from "./BrandCard";
import type { Brand, Locale } from "@/lib/types";

interface BrandGridProps {
  brands: Brand[];
  locale: Locale;
  /** Brand IDs the signed-in user has favorited (SSR-known). */
  favoriteIds?: string[];
  /** Whether the current visitor is authenticated. */
  isAuthed?: boolean;
}

export default function BrandGrid({
  brands,
  locale,
  favoriteIds = [],
  isAuthed = false,
}: BrandGridProps) {
  const favSet = new Set(favoriteIds);
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {brands.map((brand) => (
        <BrandCard
          key={brand.id}
          brand={brand}
          locale={locale}
          isFavorited={favSet.has(brand.id)}
          isAuthed={isAuthed}
        />
      ))}
    </div>
  );
}
