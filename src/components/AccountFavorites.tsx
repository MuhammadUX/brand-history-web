"use client";

import { useState } from "react";
import Link from "next/link";
import LogoTile from "./LogoTile";
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
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <p className="text-sm text-secondary">{dict.account.favoritesEmpty}</p>
        <Link
          href={`/${locale}/browse`}
          className="mt-4 inline-flex rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {dict.account.browseBrands}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => {
        const name = locale === "ar" ? brand.name_ar : brand.name_en;
        const sectorName =
          brand.sectors &&
          (locale === "ar" ? brand.sectors.name_ar : brand.sectors.name_en);
        const meta = [sectorName, brand.region].filter(Boolean).join(" · ");
        return (
          <div
            key={brand.id}
            className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/${locale}/brand/${brand.slug}`}
                className="rounded-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <LogoTile
                  initials={brand.initials}
                  color={brand.primary_color}
                  name={name}
                />
              </Link>
              <button
                type="button"
                onClick={() => remove(brand.id)}
                disabled={removing === brand.id}
                aria-label={dict.account.removeAria(name)}
                className="inline-flex items-center rounded-pill border border-border px-3 py-1.5 text-xs font-medium text-secondary transition hover:border-primary/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {dict.account.remove}
              </button>
            </div>
            <Link
              href={`/${locale}/brand/${brand.slug}`}
              className="flex flex-col gap-1 rounded-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <h3 className="text-base font-semibold text-ink">{name}</h3>
              {meta && <p className="text-sm text-secondary">{meta}</p>}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
