import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSectors } from "@/lib/data";
import {
  Card,
  Field,
  Input,
  Select,
  Checkbox,
  Button,
  Badge,
} from "@/components/ui";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import {
  DeleteRunButton,
  DeleteAllRunsButton,
} from "@/components/admin/AiBuilderRunActions";
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

  const startWithLocale = startRun.bind(null, typedLocale);

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
      <div className="mb-6">
        <h1 className="text-h2 font-bold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-[14px] text-muted">{t.subtitle}</p>
      </div>

      <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-[14px] text-ink">
        {t.calmNote}
      </div>

      {error === "name" && (
        <p className="mt-4 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
          {t.errorName}
        </p>
      )}
      {error === "create" && (
        <p className="mt-4 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
          {t.errorCreate}
        </p>
      )}
      {error === "delete" && (
        <p className="mt-4 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
          {t.errorDelete}
        </p>
      )}

      <form action={startWithLocale} className="mt-6">
        <Card className="space-y-5">
          <Field label={t.nameLabel} htmlFor="input_name" required>
            <Input
              id="input_name"
              name="input_name"
              required
              placeholder={t.namePlaceholder}
            />
          </Field>

          <fieldset className="space-y-4 border-t border-line pt-4">
            <legend className="text-[13px] font-bold uppercase tracking-label text-muted">
              {t.hintsTitle}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.sectorLabel} htmlFor="sector_slug">
                <Select id="sector_slug" name="sector_slug" defaultValue="">
                  <option value="">{t.sectorAny}</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {typedLocale === "ar" ? s.name_ar : s.name_en}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.regionLabel} htmlFor="region">
                <Input id="region" name="region" defaultValue="KSA" />
              </Field>
            </div>
            <Field label={t.urlLabel} htmlFor="url">
              <Input id="url" name="url" type="url" placeholder="https://" />
            </Field>
            <Field label={t.providerLabel} htmlFor="ai_provider">
              <Select id="ai_provider" name="ai_provider" defaultValue="gemini">
                <option value="gemini">{t.providerGemini}</option>
                <option value="claude">{t.providerClaude}</option>
              </Select>
            </Field>
          </fieldset>

          <fieldset className="border-t border-line pt-4">
            <legend className="mb-2 text-[13px] font-bold uppercase tracking-label text-muted">
              {t.languagesLabel}
            </legend>
            <div className="flex flex-wrap gap-5">
              <Checkbox name="lang_en" defaultChecked label={t.langEn} />
              <Checkbox name="lang_ar" defaultChecked label={t.langAr} />
            </div>
          </fieldset>

          <Button type="submit" variant="primary" size="md">
            {t.start}
          </Button>
        </Card>
      </form>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-bold uppercase tracking-label text-muted">
            {t.recentRuns}
          </h2>
          {runs.length > 0 && (
            <DeleteAllRunsButton
              locale={typedLocale}
              label={t.deleteAll}
              confirmText={t.deleteAllConfirm}
            />
          )}
        </div>
        {runs.length === 0 ? (
          <p className="text-[14px] text-muted">{t.noRuns}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface shadow-card">
            {runs.map((r) => {
              const href =
                r.status === "accepted" && r.brand_id
                  ? `/${typedLocale}/admin/brands/${r.brand_id}`
                  : `/${typedLocale}/admin/ai-builder/${r.id}`;
              return (
                <li key={r.id} className="flex items-center gap-2 pe-3">
                  <Link
                    href={href}
                    className="flex flex-1 items-center justify-between gap-3 px-4 py-3 text-[14px] transition-colors hover:bg-surface-2"
                  >
                    <span className="truncate font-medium text-ink">
                      {r.input_name}
                    </span>
                    <Badge kind="state">{runStatus[r.status] ?? r.status}</Badge>
                  </Link>
                  <DeleteRunButton
                    locale={typedLocale}
                    runId={r.id}
                    label={t.deleteRun}
                    confirmText={t.deleteRunConfirm}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
