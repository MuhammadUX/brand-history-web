"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Locale } from "@/lib/types";

export default function AdminSignOut({
  locale,
  label,
  compact = false,
}: {
  locale: Locale;
  label: string;
  compact?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={
        compact
          ? "rounded-btn border border-border px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-page"
          : "rounded-btn border border-border px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      }
    >
      {label}
    </button>
  );
}
