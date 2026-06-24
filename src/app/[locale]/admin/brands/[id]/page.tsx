import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale, Brand, BrandColor, BrandAsset, TimelineEntry } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSectors } from "@/lib/data";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import StateBadge from "@/components/admin/StateBadge";
import BrandEditorForm from "@/components/admin/BrandEditorForm";
import { ColorsManager, AssetsManager, TimelineManager } from "@/components/admin/ChildManagers";

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

  const [sectors, colorsRes, assetsRes, timelineRes] = await Promise.all([
    getSectors(),
    supabase.from("brand_colors").select("*").eq("brand_id", id).order("sort_order"),
    supabase.from("brand_assets").select("*").eq("brand_id", id).order("sort_order"),
    supabase
      .from("timeline_entries")
      .select("*")
      .eq("brand_id", id)
      .order("sort_order")
      .order("year"),
  ]);

  const colors = (colorsRes.data ?? []) as BrandColor[];
  const assets = (assetsRes.data ?? []) as BrandAsset[];
  const timeline = (timelineRes.data ?? []) as TimelineEntry[];

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="brands">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {typedLocale === "ar" ? brand.name_ar || brand.name_en : brand.name_en}
          </h1>
          <StateBadge state={brand.publication_state} locale={typedLocale} />
        </div>
        <Link href={`/${typedLocale}/admin/brands`} className="text-sm font-medium text-secondary hover:text-ink">
          {dict.admin.nav.brands}
        </Link>
      </div>

      <div className="space-y-4">
        <BrandEditorForm
          locale={typedLocale}
          sectors={sectors}
          brand={brand as unknown as Brand}
          role={access.operator.role}
        />
        <ColorsManager locale={typedLocale} brandId={id} colors={colors} />
        <AssetsManager locale={typedLocale} brandId={id} assets={assets} />
        <TimelineManager locale={typedLocale} brandId={id} entries={timeline} />
      </div>
      <p className="sr-only">{t.editTitle}</p>
    </AdminShell>
  );
}
