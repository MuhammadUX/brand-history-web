"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, DitherPlate, StateBlock } from "@/components/ds";
import { catalogueCode } from "./DsBrandCard";
import { createClient } from "@/lib/supabase-browser";
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
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(brandId: string) {
    if (removing) return;
    setRemoving(brandId);
    const prev = brands;
    setBrands((b) => b.filter((x) => x.id !== brandId)); // optimistic
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("no-user");
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("brand_id", brandId);
      if (error) throw error;
    } catch {
      setBrands(prev); // revert
    } finally {
      setRemoving(null);
    }
  }

  if (brands.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <StateBlock
          state="empty"
          message={dict.account.favoritesEmpty}
          className="w-full"
        />
        <Link
          href={`/${locale}/browse`}
          className="mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700"
        >
          {dict.account.browseBrands}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => {
        const name = locale === "ar" ? brand.name_ar : brand.name_en;
        const sectorName =
          brand.sectors &&
          (locale === "ar" ? brand.sectors.name_ar : brand.sectors.name_en);
        const meta = [sectorName, brand.region].filter(Boolean).join(" · ");
        return (
          <div
            key={brand.id}
            className="flex flex-col items-start border border-hairline bg-surface p-2"
          >
            <Link
              href={`/${locale}/brand/${brand.slug}`}
              className="block"
              aria-label={name}
            >
              <DitherPlate
                initials={brand.initials}
                size="md"
                code={catalogueCode(brand.slug || brand.id)}
                develop={false}
              />
            </Link>
            <Link
              href={`/${locale}/brand/${brand.slug}`}
              className="mt-2 block"
            >
              <h3 className="font-display text-lg leading-tight text-ink">
                {name}
              </h3>
              {meta && (
                <p className="mt-1 font-mono text-[11px] text-metadata">
                  {meta}
                </p>
              )}
            </Link>
            <div className="mt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => remove(brand.id)}
                disabled={removing === brand.id}
                aria-label={dict.account.removeAria(name)}
              >
                {dict.account.remove}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
