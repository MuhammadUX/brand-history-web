import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator, PUBLICATION_STATES } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  Button,
  FilterChip,
  Table,
  THead,
  TRow,
  TCell,
} from "@/components/ui";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import StateBadge from "@/components/admin/StateBadge";
import DeleteDraftButton from "@/components/admin/DeleteDraftButton";

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
          <h1 className="text-h2 font-bold tracking-tight text-ink">{t.title}</h1>
          <p className="mt-1 text-[14px] text-muted">{t.subtitle}</p>
        </div>
        <Button href={`/${typedLocale}/admin/brands/new`} variant="primary" size="md">
          {t.newBrand}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip
          href={`/${typedLocale}/admin/brands`}
          active={!filterState}
          aria-current={!filterState ? "page" : undefined}
        >
          {t.filterAll}
        </FilterChip>
        {PUBLICATION_STATES.map((s) => (
          <FilterChip
            key={s}
            href={`/${typedLocale}/admin/brands?state=${s}`}
            active={filterState === s}
            aria-current={filterState === s ? "page" : undefined}
          >
            {(dict.admin.dashboard.states as Record<string, string>)[s]}
          </FilterChip>
        ))}
      </div>

      <Table>
        <THead>
          <TCell head>{t.colName}</TCell>
          <TCell head>{t.colState}</TCell>
          <TCell head className="hidden sm:table-cell">
            {t.colClaim}
          </TCell>
          <TCell head className="hidden md:table-cell">
            {t.colSector}
          </TCell>
          <TCell head className="hidden lg:table-cell">
            {t.colUpdated}
          </TCell>
          <TCell head>
            <span className="sr-only">{t.colActions}</span>
          </TCell>
        </THead>
        <tbody>
          {!brands || brands.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-[14px] text-muted"
              >
                {t.empty}
              </td>
            </tr>
          ) : (
            brands.map((b) => {
              const sector = b.sectors as
                | { name_en?: string; name_ar?: string }
                | null;
              const sectorLabel = sector
                ? typedLocale === "ar"
                  ? sector.name_ar
                  : sector.name_en
                : t.dash;
              return (
                <TRow key={b.id}>
                  <TCell>
                    <Link
                      href={`/${typedLocale}/admin/brands/${b.id}`}
                      className="font-medium text-ink hover:text-link"
                    >
                      {typedLocale === "ar"
                        ? b.name_ar || b.name_en
                        : b.name_en}
                    </Link>
                    <span className="block text-[12px] text-muted">{b.slug}</span>
                  </TCell>
                  <TCell>
                    <StateBadge
                      state={b.publication_state}
                      locale={typedLocale}
                    />
                  </TCell>
                  <TCell className="hidden text-muted sm:table-cell">
                    {claimLabels[b.claim_status] ?? b.claim_status}
                  </TCell>
                  <TCell className="hidden text-muted md:table-cell">
                    {sectorLabel}
                  </TCell>
                  <TCell className="hidden text-muted lg:table-cell">
                    {b.last_updated_at
                      ? new Date(b.last_updated_at).toLocaleDateString(
                          typedLocale,
                        )
                      : t.dash}
                  </TCell>
                  <TCell className="text-end">
                    {(b.publication_state === "draft" ||
                      b.publication_state === "archived") &&
                    access.operator.role === "admin" ? (
                      <DeleteDraftButton
                        brandId={b.id}
                        label={t.delete}
                        confirmText={t.deleteConfirm}
                      />
                    ) : null}
                  </TCell>
                </TRow>
              );
            })
          )}
        </tbody>
      </Table>
    </AdminShell>
  );
}
