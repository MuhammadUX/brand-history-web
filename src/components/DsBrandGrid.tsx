import { BrandGrid } from "@/components/ui";
import DsBrandCard from "./DsBrandCard";
import type { Brand, Locale } from "@/lib/types";

interface DsBrandGridProps {
  brands: Brand[];
  locale: Locale;
  favoriteIds?: string[];
  isAuthed?: boolean;
}

/**
 * DsBrandGrid — thin wrapper over The Library `@/components/ui` BrandGrid.
 * Same data contract as before; maps each Brand through DsBrandCard.
 */
export default function DsBrandGrid({
  brands,
  locale,
  favoriteIds = [],
  isAuthed = false,
}: DsBrandGridProps) {
  const favSet = new Set(favoriteIds);
  return (
    <BrandGrid>
      {brands.map((brand) => (
        <DsBrandCard
          key={brand.id}
          brand={brand}
          locale={locale}
          isFavorited={favSet.has(brand.id)}
          isAuthed={isAuthed}
        />
      ))}
    </BrandGrid>
  );
}
