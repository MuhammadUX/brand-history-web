import React from "react";
import Link from "next/link";
import { cn } from "./cn";

export interface SidebarProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

/**
 * Sidebar — admin navigation rail. A hairline card holding SidebarLinks with an
 * optional label header. Server component.
 */
export function Sidebar({ children, header, className }: SidebarProps) {
  return (
    <nav
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-line bg-surface p-3 shadow-card",
        className,
      )}
    >
      {header ? <div className="label px-2 pb-2">{header}</div> : null}
      {children}
    </nav>
  );
}

export interface SidebarLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * SidebarLink — a Next.js Link styled as a nav item. `active` gives the
 * selected look. Server component.
 */
export function SidebarLink({ href, active = false, children, className }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-[14px] font-medium transition-colors",
        active
          ? "bg-surface-2 text-ink"
          : "text-muted hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default Sidebar;
