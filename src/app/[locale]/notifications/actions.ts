"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";

/** Mark a single notification read (RLS scopes the update to the owner). */
export async function markNotificationRead(
  locale: string,
  id: string
): Promise<{ ok: boolean }> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      console.error("markNotificationRead:", error.message);
      return { ok: false };
    }
    revalidatePath(`/${locale}/notifications`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Mark every notification for the current user read. */
export async function markAllNotificationsRead(
  locale: string
): Promise<{ ok: boolean }> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) {
      console.error("markAllNotificationsRead:", error.message);
      return { ok: false };
    }
    revalidatePath(`/${locale}/notifications`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
