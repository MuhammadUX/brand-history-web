import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import type { Operator } from "@/lib/admin";
import AdminSignOut from "./AdminSignOut";

type Section = "dashboard" | "brands" | "ai-builder" | "requests" | "audit";

export default function AdminShell({
  locale,
  operator,
  active,
  children,
}: {
  locale: Locale;
  operator: Operator;
  active: Section;
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  const t = dict.admin;
  const base = `/${locale}/admin`;

  const items: { key: Section; href: string; label: string }[] = [
    { key: "dashboard", href: base, label: t.nav.dashboard },
    { key: "brands", href: `${base}/brands`, label: t.nav.brands },
    { key: "ai-builder", href: `${base}/ai-builder`, label: t.nav.aiBuilder },
    { key: "requests", href: `${base}/requests`, label: t.nav.requests },
    { key: "audit", href: `${base}/audit`, label: t.nav.audit },
  ];

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-e border-border bg-surface md:flex">
        <div className="border-b border-border px-5 py-5">
          <Link
            href={`/${locale}`}
            className="text-sm font-bold tracking-tight text-ink"
          >
            {dict.brandName}
          </Link>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-tertiary">
            {t.console}
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((it) => {
            const isActive = it.key === active;
            return (
              <Link
                key={it.key}
                href={it.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  "block rounded-btn px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                  (isActive
                    ? "bg-primary-tint text-primary"
                    : "text-secondary hover:bg-page hover:text-ink")
                }
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-4">
          <p className="text-xs text-tertiary">{t.signedInAs}</p>
          <p className="truncate text-sm font-medium text-ink" title={operator.email}>
            {operator.displayName || operator.email}
          </p>
          <p className="mt-0.5 text-xs text-tertiary">
            {operator.role === "admin" ? t.role.admin : t.role.editor}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <AdminSignOut locale={locale} label={t.signOut} />
            <Link
              href={`/${locale}`}
              className="rounded-btn px-3 py-1.5 text-center text-xs font-medium text-secondary transition hover:bg-page hover:text-ink"
            >
              {t.backToSite}
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <span className="text-sm font-bold">{t.console}</span>
          <AdminSignOut locale={locale} label={t.signOut} compact />
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-2 md:hidden">
          {items.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className={
                "whitespace-nowrap rounded-btn px-3 py-1.5 text-sm font-medium " +
                (it.key === active
                  ? "bg-primary-tint text-primary"
                  : "text-secondary")
              }
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <main id="main-content" className="mx-auto w-full max-w-container flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
