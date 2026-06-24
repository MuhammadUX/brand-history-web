"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

export default function AccountMenu({
  locale,
  displayName,
  role,
}: {
  locale: Locale;
  displayName: string;
  role?: string;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.replace(`/${locale}`);
    router.refresh();
  }

  const label = displayName || dict.auth.account;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.auth.menuAria}
        className="inline-flex items-center gap-2 rounded-btn border border-border px-3 py-2 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-primary-tint text-xs font-bold text-primary">
          {(label.trim().charAt(0) || "U").toUpperCase()}
        </span>
        <span className="hidden max-w-[10ch] truncate sm:inline">{label}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 z-30 mt-2 w-48 overflow-hidden rounded-card border border-border bg-surface py-1 shadow-lg"
        >
          <Link
            href={`/${locale}/account`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink transition hover:bg-page focus:bg-page focus:outline-none"
          >
            {dict.auth.account}
          </Link>
          {(role === "editor" || role === "admin") && (
            <Link
              href={`/${locale}/admin`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-page focus:bg-page focus:outline-none"
            >
              {dict.admin.console}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="block w-full px-4 py-2.5 text-start text-sm text-ink transition hover:bg-page focus:bg-page focus:outline-none"
          >
            {dict.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
