import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { requireOperator } from "@/lib/admin";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { Badge, Table, THead, TRow, TCell, ActionCell } from "@/components/ui";
import AdminShell from "@/components/admin/AdminShell";
import Forbidden from "@/components/admin/Forbidden";
import TeamRoleControl from "@/components/admin/TeamRoleControl";
import { type AssignableRole } from "./actions";

export const dynamic = "force-dynamic";

type ProfileRow = { id: string; role: string | null };
type AuthUser = { id: string; email: string | null; created_at: string };

function normalizeRole(role: string | null): AssignableRole {
  return role === "admin" || role === "editor" ? role : "user";
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const t = getDictionary(typedLocale).admin.team;

  const access = await requireOperator(
    typedLocale,
    `/${typedLocale}/admin/team`
  );
  if (access.status === "forbidden") return <Forbidden locale={typedLocale} />;
  if (access.status !== "ok") return null;
  // Admin-only screen (beyond the operator guard).
  if (access.operator.role !== "admin") return <Forbidden locale={typedLocale} />;

  const operator = access.operator;

  // Reading auth.users (emails + created_at) requires the service-role client.
  // This is server-only and read-only here — role WRITES use the operator's
  // cookie client (see actions.ts) so the SEC-1 trigger permits them.
  const admin = createAdminSupabase();

  const [{ data: profiles }, authList] = await Promise.all([
    admin.from("profiles").select("id, role"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const roleById = new Map<string, string | null>(
    ((profiles as ProfileRow[] | null) ?? []).map((p) => [p.id, p.role])
  );

  const users: Array<{
    id: string;
    email: string;
    role: AssignableRole;
    createdAt: string;
  }> = ((authList.data?.users as AuthUser[] | undefined) ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "—",
    role: normalizeRole(roleById.get(u.id) ?? null),
    createdAt: u.created_at,
  }));

  // Newest first.
  users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const roleLabel: Record<AssignableRole, string> = {
    user: t.roleUser,
    editor: t.roleEditor,
    admin: t.roleAdmin,
  };

  return (
    <AdminShell locale={typedLocale} operator={operator} active="team">
      <div className="mb-6">
        <h1 className="text-h2 font-bold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-[14px] text-muted">{t.subtitle}</p>
      </div>

      <Table>
        <THead>
          <TCell head>{t.colUser}</TCell>
          <TCell head>{t.colRole}</TCell>
          <TCell head className="hidden md:table-cell">
            {t.colJoined}
          </TCell>
          <TCell head align="end">
            {t.colAction}
          </TCell>
        </THead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-10 text-center text-[14px] text-muted"
              >
                {t.empty}
              </td>
            </tr>
          ) : (
            users.map((u) => {
              const isSelf = u.id === operator.id;
              return (
                <TRow key={u.id}>
                  <TCell>
                    <span className="font-medium text-ink">{u.email}</span>
                    {isSelf && (
                      <Badge
                        kind="state"
                        className="ms-2 text-link border-[#cfe0f7] bg-[#eef4fd]"
                      >
                        {t.you}
                      </Badge>
                    )}
                  </TCell>
                  <TCell>
                    <Badge kind="state">{roleLabel[u.role]}</Badge>
                  </TCell>
                  <TCell className="hidden text-muted md:table-cell">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString(typedLocale)
                      : "—"}
                  </TCell>
                  <ActionCell>
                    {isSelf ? (
                      <span className="block text-end text-[12px] text-muted">
                        {t.youHint}
                      </span>
                    ) : (
                      <TeamRoleControl
                        locale={typedLocale}
                        userId={u.id}
                        currentRole={u.role}
                      />
                    )}
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
