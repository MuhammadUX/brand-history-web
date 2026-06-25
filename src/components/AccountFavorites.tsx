"use client";

import { useState } from "react";
import { BrandCard, StateBlock, Button } from "@/components/ui";
import FavoriteButton from "./FavoriteButton";
import { getDictionary } from "@/i18n";
import type { Brand, Locale } from "@/lib/types";

export default function AccountFavorites({
  locale,
  initialBrands,
}: {
  locale: Locale;
  initialBrands: Brand[];
}) {
  const dict = getDictionary(locale);
  const isAr = locale === "ar";
  const [brands, setBrands] = useState<Brand[]>(initialBrands);

  function onRemoved(brandId: string) {
    setBrands((b) => b.filter((x) => x.id !== brandId));
  }

  if (brands.length === 0) {
    return (
      <StateBlock
        state="empty"
        icon="♡"
        message={dict.account.favoritesEmpty}
        action={
          <Button href={`/${locale}/browse`} variant="primary">
            {dict.account.browseBrands}
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => {
        const name = isAr ? brand.name_ar : brand.name_en;
        const sectorName =
          brand.sectors && (isAr ? brand.sectors.name_ar : brand.sectors.name_en);
        const meta = [sectorName, brand.region].filter(Boolean).join(" · ");
        return (
          <BrandCard
            key={brand.id}
            name={name}
            meta={meta}
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
              initialFavorited
              initialAuthed
              variant="icon"
              onRemoved={() => onRemoved(brand.id)}
            />
          </BrandCard>
        );
      })}
    </div>
  );
}
