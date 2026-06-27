import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import { getOperatorAccess } from "@/lib/admin";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
import AdminSignOut from "@/components/admin/AdminSignOut";

export const dynamic = "force-dynamic";

/**
 * Admin (operator) layout · Library operator chrome.
 *
 * Renders the Library Sidebar rail (240px, operator nav, identity card) +
 * a main content area for the whole `admin/` subtree, replacing the public
 * marketing Header/Footer (which suppress themselves on `/admin` paths). RTL is
 * respected via the dictionary `dir`.
 *
 * Auth: pages still run their own `requireOperator`/<Forbidden> guards. This
 * layout only fetches the operator for the identity card and degrades to a
 * chrome-less pass-through when the visitor isn't an operator, so the page's
 * own guard remains the single source of truth (and no rail leaks to
 * unauthenticated/forbidden visitors).
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.admin;
  const dir = dict.dir === "rtl" ? "rtl" : "ltr";
  const base = `/${typedLocale}/admin`;

  const access = await getOperatorAccess();

  // Not an operator → let the page render its own redirect / <Forbidden>.
  if (access.status !== "ok") {
    return <>{children}</>;
  }

  const operator = access.operator;

  const items = [
    { label: t.nav.dashboard, href: base },
    { label: t.nav.brands, href: `${base}/brands` },
    { label: t.nav.aiBuilder, href: `${base}/ai-builder` },
    { label: t.nav.requests, href: `${base}/requests` },
    // Team & Roles is admin-only (renders only for admins).
    ...(operator.role === "admin"
      ? [{ label: t.nav.team, href: `${base}/team` }]
      : []),
    { label: t.nav.audit, href: `${base}/audit` },
  ];

  const brand = (
    <Link href={`/${typedLocale}`} className="text-sm font-bold tracking-tight">
      {dict.brandName}
    </Link>
  );

  const identity = (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="label">{t.signedInAs}</p>
        <p
          className="mt-0.5 truncate text-[14px] font-medium text-ink"
          title={operator.email}
        >
          {operator.displayName || operator.email}
        </p>
        <p className="mt-0.5 text-[12px] text-muted">
          {operator.role === "admin" ? t.role.admin : t.role.editor}
        </p>
      </div>
      <AdminSignOut locale={typedLocale} label={t.signOut} compact />
      <Link
        href={`/${typedLocale}`}
        className="text-[12px] font-medium text-muted hover:text-ink hover:underline"
      >
        {t.backToSite}
      </Link>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AdminSidebarNav
        items={items}
        dir={dir}
        brand={brand}
        identity={identity}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          className="mx-auto w-full max-w-content flex-1 px-6 py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
