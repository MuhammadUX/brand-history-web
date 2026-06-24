import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";

export const dynamic = "force-dynamic";

const STATES = ["published", "draft", "in_review", "approved", "unpublished"] as const;

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin.dashboard;

  const access = await requireOperator(typedLocale, `/${typedLocale}/admin`);
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const supabase = await createServerSupabase();

  // Count brands per state
  const counts: Record<string, number> = {};
  await Promise.all(
    STATES.map(async (s) => {
      const { count } = await supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .eq("publication_state", s);
      counts[s] = count ?? 0;
    })
  );

  const { count: pendingRequests } = await supabase
    .from("brand_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  const { data: audit } = await supabase
    .from("audit_log")
    .select("id, actor_email, action, entity, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const stateLabels = t.states as Record<string, string>;

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="dashboard">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t.title}</h1>
          <p className="mt-1 text-sm text-secondary">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${typedLocale}/admin/ai-builder`}
            className="rounded-btn border border-primary/40 bg-primary-tint/40 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-tint"
          >
            {t.runAiBuilder}
          </Link>
          <Link
            href={`/${typedLocale}/admin/brands/new`}
            className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            {t.newBrand}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATES.map((s) => (
          <Link
            key={s}
            href={`/${typedLocale}/admin/brands?state=${s}`}
            className="rounded-card border border-border bg-surface p-4 transition hover:border-primary/40"
          >
            <p className="text-2xl font-bold text-ink">{counts[s]}</p>
            <p className="mt-1 text-xs font-medium text-secondary">{stateLabels[s]}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link
          href={`/${typedLocale}/admin/requests`}
          className="rounded-card border border-border bg-surface p-4 transition hover:border-primary/40"
        >
          <p className="text-2xl font-bold text-ink">{pendingRequests ?? 0}</p>
          <p className="mt-1 text-xs font-medium text-secondary">{t.pendingRequests}</p>
        </Link>

        <div className="rounded-card border border-border bg-surface p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{t.recentActivity}</h2>
            <Link href={`/${typedLocale}/admin/audit`} className="text-xs font-medium text-primary hover:underline">
              {t.viewAll}
            </Link>
          </div>
          {!audit || audit.length === 0 ? (
            <p className="text-sm text-tertiary">{t.noActivity}</p>
          ) : (
            <ul className="space-y-2">
              {audit.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-ink">
                    <span className="font-medium">{a.action}</span>{" "}
                    <span className="text-tertiary">{a.entity}</span>
                  </span>
                  <span className="shrink-0 text-xs text-tertiary">{a.actor_email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
