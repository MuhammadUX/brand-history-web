import type { Locale } from "@/lib/types";

/**
 * Minimal centered shell for auth pages (login, register, etc.).
 * The global app Header/Footer (mounted in the locale layout) provide the
 * page chrome; this shell only renders the centered auth panel.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6"
    >
      <div className="border border-hairline bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl tracking-tight text-ink">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 font-mono text-[13px] text-metadata">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
