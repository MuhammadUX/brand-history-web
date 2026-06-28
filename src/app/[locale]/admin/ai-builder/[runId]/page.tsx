import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale, Sector } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSectors } from "@/lib/data";
import { StateBlock, Button } from "@/components/ui";
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
    .select("id, input_name, status, draft, brand_id, languages, hints, error_code, error_detail")
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
        <div className="mx-auto max-w-md">
          <StateBlock
            state="empty"
            message={t.discarded}
            action={
              <Button href={`/${typedLocale}/admin/ai-builder`} variant="primary">
                {t.title}
              </Button>
            }
          />
        </div>
      </AdminShell>
    );
  }

  if (run.status === "accepted" && run.brand_id) {
    return (
      <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
        <div className="mx-auto max-w-md">
          <StateBlock
            state="empty"
            message={t.createdNote}
            action={
              <Button
                href={`/${typedLocale}/admin/brands/${run.brand_id}`}
                variant="primary"
              >
                {t.goToEditor}
              </Button>
            }
          />
        </div>
      </AdminShell>
    );
  }

  const draft = run.draft as BrandDraft | null;
  if (!draft || run.status === "failed") {
    const errors = t.errors as unknown as Record<string, string>;
    const code = (run.error_code as string | null) || "unknown";
    const reason = errors?.[code] || errors?.unknown || t.noDraft;
    const detail = (run.error_detail as string | null) || null;
    return (
      <AdminShell locale={typedLocale} operator={access.operator} active="ai-builder">
        <div className="mx-auto max-w-xl">
          <StateBlock
            state="error"
            icon="⚠"
            title={`${t.failedTitle} ${run.input_name}`}
            message={reason}
            action={
              <Button href={`/${typedLocale}/admin/ai-builder`} variant="primary">
                {t.tryAgain}
              </Button>
            }
          />
          {detail && (
            <details className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-start">
              <summary className="cursor-pointer text-[13px] font-semibold text-muted">
                {t.technicalDetails}
              </summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-[12px] text-ink">
                {detail}
              </pre>
            </details>
          )}
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
