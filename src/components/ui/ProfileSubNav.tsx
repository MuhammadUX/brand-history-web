"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface SubNavItem {
  id: string;
  label: string;
}

export interface ProfileSubNavProps {
  items: SubNavItem[];
  /** Accessible label for the nav landmark. */
  ariaLabel: string;
  className?: string;
}

/**
 * ProfileSubNav — thin sticky in-page sub-nav with scroll-spy. Anchors jump to
 * each section and the one currently in view is highlighted. Sits below the
 * global header (sticky top-[68px]). RTL-mirrored via logical utilities. Render
 * only the items whose section has data (caller filters). Client component.
 */
export function ProfileSubNav({ items, ariaLabel, className }: ProfileSubNavProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost section currently intersecting the upper viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Activate a section when it reaches just under the sticky chrome.
        rootMargin: "-140px 0px -55% 0px",
        threshold: 0,
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  // Keep the active anchor scrolled into view within the horizontal bar.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-target="${activeId}"]`,
    );
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "sticky top-[68px] z-30 -mx-6 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75",
        className,
      )}
    >
      <div
        ref={listRef}
        className="mx-auto flex max-w-content gap-1 overflow-x-auto px-6 py-2"
      >
        {items.map((it) => {
          const isActive = it.id === activeId;
          return (
            <a
              key={it.id}
              href={`#${it.id}`}
              data-target={it.id}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link",
                isActive
                  ? "bg-ink text-white"
                  : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              {it.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default ProfileSubNav;
