import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  Badge,
  Table,
  THead,
  TRow,
  TCell,
  ActionCell,
} from "@/components/ui";
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
        <h1 className="text-h2 font-bold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-[14px] text-muted">{t.subtitle}</p>
      </div>

      <Table>
        <THead>
          <TCell head>{t.colName}</TCell>
          <TCell head className="hidden sm:table-cell">
            {t.colSector}
          </TCell>
          <TCell head className="hidden md:table-cell">
            {t.colRegion}
          </TCell>
          <TCell head>{t.colStatus}</TCell>
          <TCell head align="end">
            {" "}
          </TCell>
        </THead>
        <tbody>
          {!requests || requests.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-[14px] text-muted"
              >
                {t.empty}
              </td>
            </tr>
          ) : (
            requests.map((r) => {
              const reviewed = r.status === "reviewed";
              return (
                <TRow key={r.id}>
                  <TCell>
                    <span className="font-medium text-ink">{r.name}</span>
                    <span className="block text-[12px] text-muted">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString(typedLocale)
                        : ""}
                    </span>
                  </TCell>
                  <TCell className="hidden text-muted sm:table-cell">
                    {r.sector ?? "—"}
                  </TCell>
                  <TCell className="hidden text-muted md:table-cell">
                    {r.region ?? "—"}
                  </TCell>
                  <TCell>
                    <Badge
                      kind="state"
                      className={
                        reviewed
                          ? "text-ok border-[#bfe6cd] bg-[#eef9f1]"
                          : "text-amber border-amber-line bg-amber-bg"
                      }
                    >
                      {reviewed ? t.statusReviewed : t.statusNew}
                    </Badge>
                  </TCell>
                  <ActionCell>
                    <div className="flex justify-end">
                      <RequestActions
                        locale={typedLocale}
                        id={r.id}
                        reviewed={reviewed}
                      />
                    </div>
                  </ActionCell>
                </TRow>
              );
            })
          )}
        </tbody>
      </Table>
    </AdminShell>
  );
}
