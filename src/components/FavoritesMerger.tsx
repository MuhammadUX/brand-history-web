"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

const LS_KEY = "bh_favorites";

/**
 * Merges any device-local favorites (localStorage) into the signed-in user's
 * account, then clears localStorage and shows "We saved your N favorites".
 * Mount once on an auth-gated page (e.g. account or after login redirect).
 */
export default function FavoritesMerger({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [mergedCount, setMergedCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let local: string[] = [];
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      local = Array.isArray(arr)
        ? (arr.filter((x) => typeof x === "string") as string[])
        : [];
    } catch {
      local = [];
    }
    if (local.length === 0) return;

    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      // Which are already favorited?
      const { data: existing } = await supabase
        .from("favorites")
        .select("brand_id")
        .eq("user_id", user.id)
        .in("brand_id", local);
      const have = new Set((existing ?? []).map((r) => r.brand_id as string));
      const missing = local.filter((id) => !have.has(id));

      let insertedOk = true;
      if (missing.length > 0) {
        const { error } = await supabase.from("favorites").upsert(
          missing.map((brand_id) => ({ user_id: user.id, brand_id })),
          { onConflict: "user_id,brand_id", ignoreDuplicates: true }
        );
        if (error) insertedOk = false;
      }

      if (!insertedOk || !active) return;

      // Clear device favorites now that they're saved to the account.
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      setMergedCount(missing.length);
      if (missing.length > 0) router.refresh();
    })();

    return () => {
      active = false;
    };
  }, [router]);

  if (mergedCount === null || mergedCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 flex items-center gap-2 rounded-md border border-ok/40 bg-ok/5 px-4 py-3 text-[14px] font-medium text-ink"
    >
      <span aria-hidden="true" className="text-ok">
        ✓
      </span>
      {dict.favorite.merged(mergedCount)}
    </div>
  );
}
