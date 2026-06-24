import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const t = getDictionary(typedLocale).admin.audit;

  const access = await requireOperator(typedLocale, `/${typedLocale}/admin/audit`);
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const supabase = await createServerSupabase();
  const { data: rows } = await supabase
    .from("audit_log")
    .select("id, actor_email, action, entity, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="audit">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-secondary">{t.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-page text-xs uppercase tracking-wide text-tertiary">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t.colActor}</th>
              <th className="px-4 py-3 text-start font-medium">{t.colAction}</th>
              <th className="px-4 py-3 text-start font-medium">{t.colEntity}</th>
              <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">{t.colDate}</th>
            </tr>
          </thead>
          <tbody>
            {!rows || rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-tertiary">{t.empty}</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-secondary">{r.actor_email}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.action}</td>
                  <td className="px-4 py-3 text-secondary">{r.entity}</td>
                  <td className="hidden px-4 py-3 text-tertiary sm:table-cell">
                    {r.created_at ? new Date(r.created_at).toLocaleString(typedLocale) : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
