import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import RequestActions from "@/components/admin/RequestActions";

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const t = getDictionary(typedLocale).admin.requests;

  const access = await requireOperator(typedLocale, `/${typedLocale}/admin/requests`);
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;

  const supabase = await createServerSupabase();
  const { data: requests } = await supabase
    .from("brand_suggestions")
    .select("id, name, sector, region, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <AdminShell locale={typedLocale} operator={access.operator} active="requests">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-secondary">{t.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-page text-xs uppercase tracking-wide text-tertiary">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t.colName}</th>
              <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">{t.colSector}</th>
              <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t.colRegion}</th>
              <th className="px-4 py-3 text-start font-medium">{t.colStatus}</th>
              <th className="px-4 py-3 text-end font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {!requests || requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-tertiary">{t.empty}</td>
              </tr>
            ) : (
              requests.map((r) => {
                const reviewed = r.status === "reviewed";
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{r.name}</span>
                      <span className="block text-xs text-tertiary">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString(typedLocale) : ""}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-secondary sm:table-cell">{r.sector ?? "—"}</td>
                    <td className="hidden px-4 py-3 text-secondary md:table-cell">{r.region ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium " +
                          (reviewed ? "bg-verifiedBg text-verifiedText" : "bg-sponsoredBg text-sponsored")
                        }
                      >
                        {reviewed ? t.statusReviewed : t.statusNew}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex justify-end">
                        <RequestActions locale={typedLocale} id={r.id} reviewed={reviewed} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
