"use server";

import { getSupabaseServerClient } from "@/lib/supabase";

export interface SuggestState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitSuggestion(
  locale: string,
  _prev: SuggestState,
  formData: FormData
): Promise<SuggestState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { status: "error", message: "required" };
  }

  const sector = String(formData.get("sector") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("brand_suggestions").insert({
    name,
    sector,
    region,
    url,
    email,
    locale: locale === "ar" ? "ar" : "en",
  });

  if (error) {
    console.error("submitSuggestion error:", error.message);
    return { status: "error", message: "error" };
  }

  return { status: "success" };
}
