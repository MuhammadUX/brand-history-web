import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSectors } from "@/lib/data";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import { startRun } from "./actions";

export const dynamic = "force-dynamic";

export default async function AiBuilderStart({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin.aiBuilder;

  const access = await requireOperator(typedLocale, `/${typedLocale}/admin/ai-builder`);
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const supabase = await createServerSupabase();
  const [sectors, runsRes] = await Promise.all([
    getSectors(),
    supabase
      .from("profile_builder_runs")
      .select("id, input_name, status, brand_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const runs = runsRes.data ?? [];
  const runStatus = t.runStatus as Record<string, string>;

  const inputCls =
    "w-full rounded-btn border border-border bg-page px-3 py-2 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  const startWithLocale = startRun.bind(null, typedLocale);

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-secondary">{t.subtitle}</p>
      </div>

      <div className="rounded-card border border-primary/30 bg-primary-tint/40 px-4 py-3 text-sm text-ink">
        {t.calmNote}
      </div>

      {error === "name" && (
        <p className="mt-4 rounded-btn border border-sponsored/40 bg-sponsoredBg px-3 py-2 text-sm text-sponsored">
          {t.errorName}
        </p>
      )}
      {error === "create" && (
        <p className="mt-4 rounded-btn border border-sponsored/40 bg-sponsoredBg px-3 py-2 text-sm text-sponsored">
          {t.errorCreate}
        </p>
      )}

      <form action={startWithLocale} className="mt-6 space-y-5 rounded-card border border-border bg-surface p-5">
        <div>
          <label htmlFor="input_name" className="mb-1.5 block text-sm font-medium text-ink">
            {t.nameLabel}
          </label>
          <input id="input_name" name="input_name" required placeholder={t.namePlaceholder} className={inputCls} />
        </div>

        <fieldset className="space-y-4 border-t border-border pt-4">
          <legend className="text-sm font-semibold text-ink">{t.hintsTitle}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sector_slug" className="mb-1.5 block text-sm font-medium text-secondary">
                {t.sectorLabel}
              </label>
              <select id="sector_slug" name="sector_slug" className={inputCls} defaultValue="">
                <option value="">{t.sectorAny}</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {typedLocale === "ar" ? s.name_ar : s.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="region" className="mb-1.5 block text-sm font-medium text-secondary">
                {t.regionLabel}
              </label>
              <input id="region" name="region" defaultValue="KSA" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="url" className="mb-1.5 block text-sm font-medium text-secondary">
              {t.urlLabel}
            </label>
            <input id="url" name="url" type="url" placeholder="https://" className={inputCls} />
          </div>
        </fieldset>

        <fieldset className="border-t border-border pt-4">
          <legend className="mb-2 text-sm font-semibold text-ink">{t.languagesLabel}</legend>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="lang_en" defaultChecked className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              {t.langEn}
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="lang_ar" defaultChecked className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              {t.langAr}
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          {t.start}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">{t.recentRuns}</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-tertiary">{t.noRuns}</p>
        ) : (
          <ul className="divide-y divide-border rounded-card border border-border bg-surface">
            {runs.map((r) => {
              const href =
                r.status === "accepted" && r.brand_id
                  ? `/${typedLocale}/admin/brands/${r.brand_id}`
                  : `/${typedLocale}/admin/ai-builder/${r.id}`;
              return (
                <li key={r.id}>
                  <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-page">
                    <span className="truncate font-medium text-ink">{r.input_name}</span>
                    <span className="shrink-0 rounded-full bg-page px-2.5 py-0.5 text-xs font-medium text-secondary">
                      {runStatus[r.status] ?? r.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
