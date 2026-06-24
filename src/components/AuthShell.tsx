import Link from "next/link";
import Footer from "@/components/Footer";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

/**
 * Minimal centered shell for auth pages (login, register, etc.).
 */
export default function AuthShell({
  locale,
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-[72px] max-w-container items-center px-4 sm:px-6">
          <Link
            href={`/${locale}`}
            className="rounded-btn text-lg font-bold tracking-tight text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.brandName}
          </Link>
        </div>
      </header>
      <main id="main-content" className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-secondary">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
