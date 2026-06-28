import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type {
  Locale,
  Brand,
  BrandColor,
  BrandAsset,
  TimelineEntry,
  BrandFont,
  BrandGuideline,
  BrandApplication,
} from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSectors } from "@/lib/data";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import StateBadge from "@/components/admin/StateBadge";
import BrandEditorForm from "@/components/admin/BrandEditorForm";
import BrandStateMachine from "@/components/admin/BrandStateMachine";
import {
  ColorsManager,
  AssetsManager,
  TimelineManager,
  FontsManager,
  GuidelinesManager,
  ApplicationsManager,
} from "@/components/admin/ChildManagers";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin.editor;

  const access = await requireOperator(
    typedLocale,
    `/${typedLocale}/admin/brands/${id}`
  );
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const supabase = await createServerSupabase();
  const { data: brand } = await supabase
    .from("brands")
    .select(
      "id, slug, name_en, name_ar, sector_id, region, founded_year, summary_en, summary_ar, primary_color, initials, claim_status, publication_state, is_verified, download_count, row_version, last_updated_at, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!brand) notFound();

  const [
    sectors,
    colorsRes,
    assetsRes,
    timelineRes,
    fontsRes,
    guidelinesRes,
    applicationsRes,
  ] = await Promise.all([
    getSectors(),
    supabase.from("brand_colors").select("*").eq("brand_id", id).order("sort_order"),
    supabase.from("brand_assets").select("*").eq("brand_id", id).order("sort_order"),
    supabase
      .from("timeline_entries")
      .select("*")
      .eq("brand_id", id)
      .order("sort_order")
      .order("year"),
    supabase.from("brand_fonts").select("*").eq("brand_id", id).order("sort_order"),
    supabase.from("brand_guidelines").select("*").eq("brand_id", id).order("sort_order"),
    supabase.from("brand_applications").select("*").eq("brand_id", id).order("sort_order"),
  ]);

  const colors = (colorsRes.data ?? []) as BrandColor[];
  const assets = (assetsRes.data ?? []) as BrandAsset[];
  const timeline = (timelineRes.data ?? []) as TimelineEntry[];
  const fonts = (fontsRes.data ?? []) as BrandFont[];
  const guidelines = (guidelinesRes.data ?? []) as BrandGuideline[];
  const applications = (applicationsRes.data ?? []) as BrandApplication[];

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="brands">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-h2 font-bold tracking-tight text-ink">
            {typedLocale === "ar" ? brand.name_ar || brand.name_en : brand.name_en}
          </h1>
          <StateBadge state={brand.publication_state} locale={typedLocale} />
        </div>
        <Link
          href={`/${typedLocale}/admin/brands`}
          className="text-[13px] font-medium text-muted hover:text-ink"
        >
          {dict.admin.nav.brands}
        </Link>
      </div>

      {/* Sticky action bar: lifecycle controls at the top so the operator
          doesn't have to scroll. Reuses the same StateMachine logic. */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="text-[13px] font-bold uppercase tracking-label text-muted">
            {t.stateLabel}
          </span>
          <BrandStateMachine
            locale={typedLocale}
            brandId={id}
            state={brand.publication_state}
            rowVersion={
              (brand as unknown as { row_version?: number }).row_version ?? 0
            }
            role={access.operator.role}
            variant="bar"
          />
        </div>
      </div>

      <div className="space-y-4">
        <BrandEditorForm
          locale={typedLocale}
          sectors={sectors}
          brand={brand as unknown as Brand}
          role={access.operator.role}
        />
        <ColorsManager locale={typedLocale} brandId={id} colors={colors} role={access.operator.role} />
        <AssetsManager locale={typedLocale} brandId={id} assets={assets} role={access.operator.role} website={(brand as unknown as Brand).website} />
        <TimelineManager locale={typedLocale} brandId={id} entries={timeline} role={access.operator.role} />
        <FontsManager locale={typedLocale} brandId={id} fonts={fonts} role={access.operator.role} />
        <GuidelinesManager locale={typedLocale} brandId={id} guidelines={guidelines} role={access.operator.role} />
        <ApplicationsManager locale={typedLocale} brandId={id} applications={applications} role={access.operator.role} />
      </div>
      <p className="sr-only">{t.editTitle}</p>
    </AdminShell>
  );
}
