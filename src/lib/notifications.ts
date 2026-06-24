import { createServerSupabase } from "./supabase-server";

export interface NotificationRow {
  id: string;
  type: string | null;
  title_en: string | null;
  title_ar: string | null;
  body_en: string | null;
  body_ar: string | null;
  link: string | null;
  read: boolean;
  created_at: string | null;
}

/** All notifications for the signed-in user, newest first. Empty if anon. */
export async function getNotifications(): Promise<NotificationRow[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title_en,title_ar,body_en,body_ar,link,read,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getNotifications error:", error.message);
    return [];
  }
  return (data as NotificationRow[]) ?? [];
}

/** Unread count for the badge. 0 for anon. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) {
    console.error("getUnreadNotificationCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}
