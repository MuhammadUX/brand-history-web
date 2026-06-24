"use server";

import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";

export interface SuggestState {
  status: "idle" | "success" | "error";
  message?: string;
}

const THROTTLE_COOKIE = "suggest_last_at";
const THROTTLE_WINDOW_MS = 60_000;

export async function submitSuggestion(
  locale: string,
  _prev: SuggestState,
  formData: FormData
): Promise<SuggestState> {
  // Lightweight server-side throttle: reject a new submission within ~60s of
  // the last one (tracked via a short-lived cookie timestamp).
  const cookieStore = await cookies();
  const last = Number(cookieStore.get(THROTTLE_COOKIE)?.value ?? 0);
  const now = Date.now();
  if (last && now - last < THROTTLE_WINDOW_MS) {
    return { status: "error", message: "throttled" };
  }

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

  // Stamp the throttle cookie so rapid re-submissions are rejected.
  cookieStore.set(THROTTLE_COOKIE, String(now), {
    maxAge: Math.ceil(THROTTLE_WINDOW_MS / 1000),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { status: "success" };
}
