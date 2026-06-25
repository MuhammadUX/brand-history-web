"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Button } from "@/components/ds";

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
    <Button
      type="button"
      variant="secondary"
      onClick={signOut}
      disabled={pending}
      className={className}
    >
      {dict.auth.signOut}
    </Button>
  );
}
