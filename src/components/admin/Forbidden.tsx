import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";

export default function Forbidden({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.admin;
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sponsored">
          403
        </p>
        <h1 className="mt-2 text-xl font-bold text-ink">{t.forbiddenTitle}</h1>
        <p className="mt-2 text-sm text-secondary">{t.forbiddenBody}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-flex rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          {t.goHome}
        </Link>
      </div>
    </div>
  );
}
