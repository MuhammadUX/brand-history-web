import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator, PUBLICATION_STATES } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { Button, FilterChip, Input } from "@/components/ui";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import BrandsBulkTable, {
  type BulkBrandRow,
} from "@/components/admin/BrandsBulkTable";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { state, q } = await searchParams;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin.brands;

  const access = await requireOperator(typedLocale, `/${typedLocale}/admin/brands`);
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const filterState =
    state && (PUBLICATION_STATES as readonly string[]).includes(state) ? state : null;
  const search = (q ?? "").trim();

  const supabase = await createServerSupabase();
  let query = supabase
    .from("brands")
    .select(
      "id, name_en, name_ar, slug, publication_state, claim_status, last_updated_at, sectors(name_en, name_ar)"
    )
    .order("last_updated_at", { ascending: false });
  if (filterState) query = query.eq("publication_state", filterState);
  if (search) {
    // Case-insensitive match on English/Arabic name or slug. Escape PostgREST
    // wildcards/special chars in the user term so they're treated literally.
    const esc = search.replace(/[%,()*]/g, (c) => `\\${c}`);
    query = query.or(
      `name_en.ilike.%${esc}%,name_ar.ilike.%${esc}%,slug.ilike.%${esc}%`
    );
  }
  const { data: brands } = await query;

  const isAdmin = access.operator.role === "admin";

  const rows: BulkBrandRow[] = (brands ?? []).map((b) => {
    const sector = b.sectors as
      | { name_en?: string; name_ar?: string }
      | null;
    const sectorLabel = sector
      ? (typedLocale === "ar" ? sector.name_ar : sector.name_en) ?? t.dash
      : t.dash;
    return {
      id: b.id,
      name_en: b.name_en,
      name_ar: b.name_ar,
      slug: b.slug,
      publication_state: b.publication_state,
      claim_status: b.claim_status,
      sectorLabel,
      updatedLabel: b.last_updated_at
        ? new Date(b.last_updated_at).toLocaleDateString(typedLocale)
        : t.dash,
    };
  });

  // Preserve the active search term across state-filter navigation.
  const qSuffix = search ? `&q=${encodeURIComponent(search)}` : "";

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="brands">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h2 font-bold tracking-tight text-ink">{t.title}</h1>
          <p className="mt-1 text-[14px] text-muted">{t.subtitle}</p>
        </div>
        <Button href={`/${typedLocale}/admin/brands/new`} variant="primary" size="md">
          {t.newBrand}
        </Button>
      </div>

      {/* Search — GET form so it's a server-consumed ?q= param. Keeps the active
          state filter via a hidden field. */}
      <form
        method="get"
        action={`/${typedLocale}/admin/brands`}
        className="mb-4 flex flex-wrap items-center gap-2"
        role="search"
      >
        {filterState && (
          <input type="hidden" name="state" value={filterState} />
        )}
        <label htmlFor="brand-search" className="sr-only">
          {t.searchLabel}
        </label>
        <Input
          id="brand-search"
          name="q"
          type="search"
          defaultValue={search}
          placeholder={t.searchPlaceholder}
          className="max-w-xs"
        />
        <Button type="submit" variant="ghost" size="md">
          {t.searchSubmit}
        </Button>
        {search && (
          <Button
            href={`/${typedLocale}/admin/brands${
              filterState ? `?state=${filterState}` : ""
            }`}
            variant="ghost"
            size="md"
          >
            {t.searchClear}
          </Button>
        )}
      </form>

      {/* State filter — segmented chips covering ALL states + "All". Combines
          with the active search term. */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip
          href={`/${typedLocale}/admin/brands${search ? `?q=${encodeURIComponent(search)}` : ""}`}
          active={!filterState}
          aria-current={!filterState ? "page" : undefined}
        >
          {t.filterAll}
        </FilterChip>
        {PUBLICATION_STATES.map((s) => (
          <FilterChip
            key={s}
            href={`/${typedLocale}/admin/brands?state=${s}${qSuffix}`}
            active={filterState === s}
            aria-current={filterState === s ? "page" : undefined}
          >
            {(dict.admin.dashboard.states as Record<string, string>)[s]}
          </FilterChip>
        ))}
      </div>

      <BrandsBulkTable locale={typedLocale} rows={rows} isAdmin={isAdmin} />
    </AdminShell>
  );
}
