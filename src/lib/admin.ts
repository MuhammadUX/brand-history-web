import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  slugify,
  PUBLICATION_STATES,
  CLAIM_STATUSES,
  type OperatorRole,
  type PublicationState,
} from "@/lib/admin-shared";

export {
  slugify,
  PUBLICATION_STATES,
  CLAIM_STATUSES,
  type OperatorRole,
  type PublicationState,
};

export interface Operator {
  id: string;
  email: string;
  displayName: string;
  role: OperatorRole;
}

/**
 * Result of an access check for the admin area.
 * - "unauthenticated": no session → caller should redirect to login
 * - "forbidden": signed in but not an operator → render 403
 * - "ok": operator with role
 */
export type AccessResult =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "ok"; operator: Operator };

/** Reads the session + profile role without redirecting. */
export async function getOperatorAccess(): Promise<AccessResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role !== "editor" && role !== "admin") {
    return { status: "forbidden" };
  }

  const displayName =
    profile?.display_name ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email ||
    "";

  return {
    status: "ok",
    operator: {
      id: user.id,
      email: user.email ?? "",
      displayName,
      role,
    },
  };
}

/**
 * Guard for admin pages. Redirects unauthenticated users to login (with next),
 * returns the access result so the page can render a 403 for plain users.
 */
export async function requireOperator(
  locale: string,
  nextPath: string
): Promise<AccessResult> {
  const access = await getOperatorAccess();
  if (access.status === "unauthenticated") {
    redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  }
  return access;
}

/** Server-action variant: throws if not an operator (no redirect). */
export async function requireOperatorAction(): Promise<Operator> {
  const access = await getOperatorAccess();
  if (access.status !== "ok") {
    throw new Error("forbidden");
  }
  return access.operator;
}

/** Writes an audit_log row using the operator's cookie-auth client (RLS allows it). */
export async function writeAudit(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  operator: Operator,
  action: string,
  entity: string,
  entityId: string | null,
  detail?: Record<string, unknown>
): Promise<void> {
  await supabase.from("audit_log").insert({
    actor_id: operator.id,
    actor_email: operator.email,
    action,
    entity,
    entity_id: entityId,
    detail: detail ?? null,
  });
}
