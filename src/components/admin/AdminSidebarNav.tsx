"use client";

import { usePathname } from "next/navigation";
import { Sidebar, SidebarLink } from "@/components/ui";

/**
 * AdminSidebarNav — the operator navigation rail, rebuilt on the Library
 * <Sidebar>/<SidebarLink>. Client component: it derives the active nav item
 * from the live pathname (the server layout can't read the current sub-route).
 *
 * Active resolution: longest matching href wins, so /admin/brands beats /admin
 * (Dashboard). Falls back to an exact Dashboard match. The brand slot and the
 * pinned identity card are passed through from the layout.
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

  return (
    <aside dir={dir} className="w-[240px] shrink-0 p-4">
      <div className="sticky top-4 flex flex-col gap-4">
        {brand ? <div className="px-2">{brand}</div> : null}
        <Sidebar>
          {items.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              active={item.href === activeHref}
            >
              {item.label}
            </SidebarLink>
          ))}
        </Sidebar>
        {identity ? (
          <div className="rounded-lg border border-line bg-surface p-3 shadow-card">
            {identity}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
