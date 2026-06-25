"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Locale } from "@/lib/types";
import { Button } from "@/components/ui";

/**
 * AdminSignOut — operator sign-out control. Supabase auth wiring is unchanged;
 * presentation is re-skinned onto the Library ghost <Button> (44px target,
 * gold focus). `compact` keeps the smaller rail footprint.
 */
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={signOut}
      className={compact ? "w-full" : undefined}
    >
      {label}
    </Button>
  );
}
