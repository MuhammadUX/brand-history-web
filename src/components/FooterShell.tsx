"use client";

import React from "react";
import { usePathname } from "next/navigation";

export interface FooterShellProps {
  tagline: React.ReactNode;
  copyright: React.ReactNode;
  note?: React.ReactNode;
  nav: React.ReactNode;
}

/**
 * FooterShell — The Library colophon (client only to suppress itself on
 * /admin routes, which render their own operator chrome). Warm hairline top
 * rule, muted micro type.
 */
export default function FooterShell({
  tagline,
  copyright,
  note,
  nav,
}: FooterShellProps) {
  const pathname = usePathname() || "";
  if (/(^|\/)admin(\/|$)/.test(pathname)) return null;

  return (
    <footer className="mt-10 border-t border-line pb-16 pt-9 text-[12.5px] text-muted">
      <div className="text-ink">{tagline}</div>
      <nav className="my-3.5 flex flex-wrap items-center gap-x-[18px] gap-y-2">
        {nav}
      </nav>
      <div className="text-[12px]">{copyright}</div>
      {note ? <div className="mt-3 max-w-[70ch] text-[12px]">{note}</div> : null}
    </footer>
  );
}
