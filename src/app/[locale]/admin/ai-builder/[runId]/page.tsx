import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale, Sector } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSectors } from "@/lib/data";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import type { BrandDraft } from "@/lib/ai/llm-provider";
import DraftReview from "@/components/admin/DraftReview";
import GatheringView from "@/components/admin/GatheringView";

export const dynamic = "force-dynamic";

export default async function AiBuilderRun({
  params,
}: {
  params: Promise<{ locale: string; runId: string }>;
}) {
  const { locale, runId } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin.aiBuilder;

  const access = await requireOperator(
    typedLocale,
    `/${typedLocale}/admin/ai-builder/${runId}`
  );
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const supabase = await createServerSupabase();
  const { data: run } = await supabase
    .from("profile_builder_runs")
    .select("id, input_name, status, draft, brand_id, languages, hints")
    .eq("id", runId)
    .maybeSingle();

  if (!run) notFound();

  const sectors: Sector[] = await getSectors();

  // Branches ---------------------------------------------------------------
  if (run.status === "gathering") {
    return (
      <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
        <GatheringView locale={typedLocale} runId={run.id} />
      </AdminShell>
    );
  }

  if (run.status === "discarded") {
    return (
      <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
        <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-sm text-secondary">{t.discarded}</p>
          <Link href={`/${typedLocale}/admin/ai-builder`} className="mt-4 inline-block rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            {t.title}
          </Link>
        </div>
      </AdminShell>
    );
  }

  if (run.status === "accepted" && run.brand_id) {
    return (
      <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
        <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-sm text-secondary">{t.createdNote}</p>
          <Link href={`/${typedLocale}/admin/brands/${run.brand_id}`} className="mt-4 inline-block rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            {t.goToEditor}
          </Link>
        </div>
      </AdminShell>
    );
  }

  const draft = run.draft as BrandDraft | null;
  if (!draft || run.status === "failed") {
    return (
      <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
        <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-sm text-secondary">{t.noDraft}</p>
          <Link href={`/${typedLocale}/admin/ai-builder`} className="mt-4 inline-block rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            {t.title}
          </Link>
        </div>
      </AdminShell>
    );
  }

  // draft_ready -> the review workspace
  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
      <DraftReview
        locale={typedLocale}
        runId={run.id}
        inputName={run.input_name}
        draft={draft}
        sectors={sectors}
        languages={(run.languages as string[]) ?? ["en", "ar"]}
      />
    </AdminShell>
  );
}
