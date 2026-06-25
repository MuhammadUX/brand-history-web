"use client";

import { usePathname } from "next/navigation";
import { OperatorSidebar } from "@/components/ds";
import type { OperatorNavItem } from "@/components/ds/OperatorSidebar";

/**
 * AdminSidebarNav — client wrapper around the DS <OperatorSidebar>. Derives the
 * active operator nav item from the live pathname (the server layout can't read
 * the current sub-route), then renders the Concept-A rail with the brand slot +
 * pinned identity card passed through from the layout.
 */
export default function AdminSidebarNav({
  items,
  dir,
  brand,
  identity,
}: {
  /** Nav items WITHOUT `active` — this component computes it from the path. */
  items: Array<{ label: string; href: string }>;
  dir: "ltr" | "rtl";
  brand?: React.ReactNode;
  identity?: React.ReactNode;
}) {
  const pathname = usePathname() || "";

  // Longest matching href wins so e.g. /admin/brands beats /admin (dashboard).
  let activeHref: string | null = null;
  for (const item of items) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (!activeHref || item.href.length > activeHref.length) {
        activeHref = item.href;
      }
    }
  }
  // Fallback: exact dashboard match (base path) when nothing else matched.
  if (!activeHref && items.length > 0) {
    const dashboard = items[0];
    if (pathname === dashboard.href) activeHref = dashboard.href;
  }

  const resolved: OperatorNavItem[] = items.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));

  return (
    <OperatorSidebar
      items={resolved}
      dir={dir}
      brand={brand}
      identity={identity}
    />
  );
}
