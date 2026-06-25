import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import FooterShell from "./FooterShell";
import PrivacyChoicesButton from "./PrivacyChoicesButton";

/**
 * AppFooter · Concept A shared colophon (server). Wraps the DS <Footer>,
 * preserving the existing nav links + PDPL privacy-choices control. Renders
 * ONCE in the locale layout — pages no longer mount their own footer.
 */
export default function AppFooter({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();
  const linkCls = "label-mono text-metadata mo-underline hover:text-ink";

  return (
    <FooterShell
      title={dict.brandName.toUpperCase()}
      catalogue="BH·ARCHIVE / 1.0.0"
      copyright={`© ${year} · ${dict.footer.rights}`}
      nav={
        <nav className="flex flex-wrap items-center gap-3">
          <Link href={`/${locale}/browse`} className={linkCls}>
            {dict.footer.browse}
          </Link>
          <Link href={`/${locale}/discover`} className={linkCls}>
            {dict.footer.discover}
          </Link>
          <Link href={`/${locale}/suggest`} className={linkCls}>
            {dict.footer.suggest}
          </Link>
          <PrivacyChoicesButton
            label={dict.consent.privacyChoices}
            className={linkCls}
          />
        </nav>
      }
    />
  );
}
