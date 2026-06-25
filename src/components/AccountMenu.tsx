"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

/**
 * AccountMenu — The Library account control (client). Same props and sign-out
 * wiring as before; re-skinned to Library tokens (soft pill trigger, warm
 * popover). Closes on outside click / Escape.
 */
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
  const itemCls =
    "block px-4 py-2.5 text-[14px] text-ink transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.auth.menuAria}
        className="inline-flex h-[42px] items-center gap-2 rounded-pill border border-line bg-surface px-3 text-[13.5px] font-medium text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-surface-2 text-[12px] font-bold text-ink">
          {(label.trim().charAt(0) || "U").toUpperCase()}
        </span>
        <span className="hidden max-w-[10ch] truncate sm:inline">{label}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 z-30 mt-2 w-48 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop"
        >
          <Link
            href={`/${locale}/account`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemCls}
          >
            {dict.auth.account}
          </Link>
          <Link
            href={`/${locale}/notifications`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemCls}
          >
            {dict.notifications.title}
          </Link>
          {(role === "editor" || role === "admin") && (
            <Link
              href={`/${locale}/admin`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[14px] font-semibold text-link transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
            >
              {dict.admin.console}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="block w-full px-4 py-2.5 text-start text-[14px] text-ink transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
          >
            {dict.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
