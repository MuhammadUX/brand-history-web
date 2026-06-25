import DsBrandCard from "./DsBrandCard";
import type { Brand, Locale } from "@/lib/types";

interface DsBrandGridProps {
  brands: Brand[];
  locale: Locale;
  favoriteIds?: string[];
  isAuthed?: boolean;
}

/**
 * DsBrandGrid — Concept A index grid of specimen cards. Same data contract as
 * the legacy BrandGrid; swaps the visual layer for DS BrandCard / DitherPlate.
 */
export default function DsBrandGrid({
  brands,
  locale,
  favoriteIds = [],
  isAuthed = false,
}: DsBrandGridProps) {
  const favSet = new Set(favoriteIds);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {brands.map((brand) => (
        <DsBrandCard
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
