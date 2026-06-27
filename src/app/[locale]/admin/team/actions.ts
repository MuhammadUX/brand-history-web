"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireOperatorAction, writeAudit } from "@/lib/admin";

/** Roles assignable to a profile (DB column `profiles.role`). */
export const ASSIGNABLE_ROLES = ["user", "editor", "admin"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export type SetUserRoleResult =
  | { ok: true }
  | { ok: false; reason: "forbidden" | "self" | "invalid" | "error" };

function isAssignableRole(value: string): value is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

/**
 * setUserRole — admin-only role change for another user's profile.
 *
 * Critically, this runs the UPDATE with the operator's COOKIE-AUTH client
 * (not the service-role client) so the SEC-1 DB trigger evaluates `is_admin()`
 * against the real caller and PERMITS the change. The service-role client would
 * bypass RLS/triggers and is reserved for reads only (e.g. auth.users emails).
 *
 * Guards: caller must be admin; cannot change their own role (self-lockout
 * footgun); role must be one of {user, editor, admin}.
 */
export async function setUserRole(
  locale: string,
  userId: string,
  role: string
): Promise<SetUserRoleResult> {
  try {
    const operator = await requireOperatorAction();

    // Admin-only.
    if (operator.role !== "admin") {
      return { ok: false, reason: "forbidden" };
    }

    // Footgun guard: never let an admin change their own role.
    if (userId === operator.id) {
      return { ok: false, reason: "self" };
    }

    // Validate target role.
    if (!isAssignableRole(role)) {
      return { ok: false, reason: "invalid" };
    }

    const supabase = await createServerSupabase();

    // Read the current role first so we can audit the transition.
    const { data: before } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    const fromRole = before?.role ?? null;

    // Operator cookie client → the SEC-1 trigger sees is_admin() = true.
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select("id");

    if (error) {
      console.error("setUserRole:", error.message);
      return { ok: false, reason: "error" };
    }
    if (!updated || updated.length === 0) {
      // No row updated (not found, or trigger/RLS silently blocked it).
      return { ok: false, reason: "error" };
    }

    await writeAudit(supabase, operator, "role_changed", "profile", userId, {
      from: fromRole,
      to: role,
    });

    revalidatePath(`/${locale}/admin/team`);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
