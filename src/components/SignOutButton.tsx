"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

export default function SignOutButton({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) return;
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className={
        className ??
        "inline-flex items-center rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
      }
    >
      {dict.auth.signOut}
    </button>
  );
}
