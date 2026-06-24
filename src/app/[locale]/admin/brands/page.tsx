import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator, PUBLICATION_STATES } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import StateBadge from "@/components/admin/StateBadge";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale } = await params;
  const { state } = await searchParams;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin.brands;

  const access = await requireOperator(typedLocale, `/${typedLocale}/admin/brands`);
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const filterState =
    state && (PUBLICATION_STATES as readonly string[]).includes(state) ? state : null;

  const supabase = await createServerSupabase();
  let query = supabase
    .from("brands")
    .select(
      "id, name_en, name_ar, slug, publication_state, claim_status, last_updated_at, sectors(name_en, name_ar)"
    )
    .order("last_updated_at", { ascending: false });
  if (filterState) query = query.eq("publication_state", filterState);
  const { data: brands } = await query;

  const claimLabels = dict.admin.editor.claim as Record<string, string>;

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="brands">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t.title}</h1>
          <p className="mt-1 text-sm text-secondary">{t.subtitle}</p>
        </div>
        <Link
          href={`/${typedLocale}/admin/brands/new`}
          className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          {t.newBrand}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href={`/${typedLocale}/admin/brands`}
          className={
            "rounded-pill px-3 py-1.5 text-sm font-medium transition " +
            (!filterState ? "bg-primary text-white" : "border border-border text-secondary hover:bg-page")
          }
        >
          {t.filterAll}
        </Link>
        {PUBLICATION_STATES.map((s) => (
          <Link
            key={s}
            href={`/${typedLocale}/admin/brands?state=${s}`}
            className={
              "rounded-pill px-3 py-1.5 text-sm font-medium transition " +
              (filterState === s ? "bg-primary text-white" : "border border-border text-secondary hover:bg-page")
            }
          >
            {(dict.admin.dashboard.states as Record<string, string>)[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-page text-start text-xs uppercase tracking-wide text-tertiary">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t.colName}</th>
              <th className="px-4 py-3 text-start font-medium">{t.colState}</th>
              <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">{t.colClaim}</th>
              <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t.colSector}</th>
              <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t.colUpdated}</th>
            </tr>
          </thead>
          <tbody>
            {!brands || brands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-tertiary">{t.empty}</td>
              </tr>
            ) : (
              brands.map((b) => {
                const sector = b.sectors as { name_en?: string; name_ar?: string } | null;
                const sectorLabel = sector
                  ? typedLocale === "ar"
                    ? sector.name_ar
                    : sector.name_en
                  : t.dash;
                return (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-page">
                    <td className="px-4 py-3">
                      <Link
                        href={`/${typedLocale}/admin/brands/${b.id}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        {typedLocale === "ar" ? b.name_ar || b.name_en : b.name_en}
                      </Link>
                      <span className="block text-xs text-tertiary">{b.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge state={b.publication_state} locale={typedLocale} />
                    </td>
                    <td className="hidden px-4 py-3 text-secondary sm:table-cell">
                      {claimLabels[b.claim_status] ?? b.claim_status}
                    </td>
                    <td className="hidden px-4 py-3 text-secondary md:table-cell">{sectorLabel}</td>
                    <td className="hidden px-4 py-3 text-tertiary lg:table-cell">
                      {b.last_updated_at ? new Date(b.last_updated_at).toLocaleDateString(typedLocale) : t.dash}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
