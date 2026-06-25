import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { Table, THead, TRow, TCell } from "@/components/ui";
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
        <h1 className="text-h2 font-bold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-[14px] text-muted">{t.subtitle}</p>
      </div>

      <Table>
        <THead>
          <TCell head>{t.colActor}</TCell>
          <TCell head>{t.colAction}</TCell>
          <TCell head>{t.colEntity}</TCell>
          <TCell head className="hidden sm:table-cell">
            {t.colDate}
          </TCell>
        </THead>
        <tbody>
          {!rows || rows.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-10 text-center text-[14px] text-muted"
              >
                {t.empty}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <TRow key={r.id}>
                <TCell className="text-muted">{r.actor_email}</TCell>
                <TCell className="font-medium text-ink">{r.action}</TCell>
                <TCell className="text-muted">{r.entity}</TCell>
                <TCell className="hidden text-muted sm:table-cell">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleString(typedLocale)
                    : ""}
                </TCell>
              </TRow>
            ))
          )}
        </tbody>
      </Table>
    </AdminShell>
  );
}
