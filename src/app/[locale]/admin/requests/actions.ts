"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireOperatorAction, writeAudit } from "@/lib/admin";

export async function markRequestReviewed(
  locale: string,
  id: string
): Promise<{ ok: boolean }> {
  try {
    const operator = await requireOperatorAction();
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("brand_suggestions")
      .update({ status: "reviewed" })
      .eq("id", id);
    if (error) {
      console.error("markRequestReviewed:", error.message);
      return { ok: false };
    }
    await writeAudit(supabase, operator, "reviewed", "brand_suggestion", id);
    revalidatePath(`/${locale}/admin/requests`);
    revalidatePath(`/${locale}/admin`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
