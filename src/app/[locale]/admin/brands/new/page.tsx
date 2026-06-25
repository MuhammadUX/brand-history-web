import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSectors } from "@/lib/data";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import BrandEditorForm, { type BrandPrefill } from "@/components/admin/BrandEditorForm";

export const dynamic = "force-dynamic";

export default async function NewBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  const { from } = await searchParams;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin.editor;

  const access = await requireOperator(typedLocale, `/${typedLocale}/admin/brands/new`);
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const sectors = await getSectors();

  let prefill: BrandPrefill | null = null;
  if (from) {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("brand_suggestions")
      .select("name, region")
      .eq("id", from)
      .maybeSingle();
    if (data) prefill = { name_en: data.name ?? "", region: data.region ?? "KSA" };
  }

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="brands">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-h2 font-bold tracking-tight text-ink">{t.newTitle}</h1>
          <p className="mt-1 text-[14px] text-muted">{t.subtitleNew}</p>
        </div>
        <Link
          href={`/${typedLocale}/admin/brands`}
          className="text-[13px] font-medium text-muted hover:text-ink"
        >
          {dict.admin.nav.brands}
        </Link>
      </div>
      <BrandEditorForm
        locale={typedLocale}
        sectors={sectors}
        brand={null}
        role={access.operator.role}
        prefill={prefill}
      />
    </AdminShell>
  );
}
