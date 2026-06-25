"use client";

import React from "react";
import Link from "next/link";
import { cn } from "./cn";

/**
 * OperatorSidebar · Concept A operator/admin rail. 240px, vertical: brand top,
 * nav (40px rhythm) with caret + scaffold wash on the active item, identity
 * card pinned to the bottom. Inline-end hairline border.
 */

export interface OperatorNavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface OperatorSidebarProps {
  brand?: React.ReactNode;
  items: OperatorNavItem[];
  /** Pinned bottom identity card. */
  identity?: React.ReactNode;
  /** Caret orientation: `‹` in RTL, `›` otherwise. */
  dir?: "ltr" | "rtl";
  className?: string;
}

export function OperatorSidebar({
  brand,
  items,
  identity,
  dir = "ltr",
  className,
}: OperatorSidebarProps) {
  const caret = dir === "rtl" ? "‹" : "›";

  return (
    <nav
      aria-label="Operator"
      className={cn(
        "flex w-60 flex-col border-e border-hairline bg-paper text-ink",
        className,
      )}
    >
      {brand ? (
        <div className="flex h-10 items-center px-3 font-display">{brand}</div>
      ) : null}

      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "label-mono flex h-10 items-center gap-2 px-3",
                item.active
                  ? "bg-scaffold text-ink"
                  : "text-metadata hover:text-ink",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "w-2",
                  item.active ? "text-ink" : "text-transparent",
                )}
              >
                {caret}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {identity ? (
        <div className="mt-auto border-t border-hairline p-3">{identity}</div>
      ) : null}
    </nav>
  );
}
