import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import PrivacyChoicesButton from "./PrivacyChoicesButton";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();
  const linkCls =
    "rounded text-sm text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-container flex-col gap-4 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-ink">{dict.brandName}</p>
          <nav className="flex flex-wrap items-center gap-4">
            <Link href={`/${locale}/browse`} className={linkCls}>
              {dict.footer.browse}
            </Link>
            <Link href={`/${locale}/discover`} className={linkCls}>
              {dict.footer.discover}
            </Link>
            <Link href={`/${locale}/suggest`} className={linkCls}>
              {dict.footer.suggest}
            </Link>
            <PrivacyChoicesButton label={dict.consent.privacyChoices} className={linkCls} />
          </nav>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">{dict.footer.tagline}</p>
          <p className="text-xs text-tertiary">
            © {year} · {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
