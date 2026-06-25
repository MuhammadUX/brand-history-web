import Link from "next/link";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import FooterShell from "./FooterShell";
import PrivacyChoicesButton from "./PrivacyChoicesButton";

/**
 * AppFooter · The Library colophon (server). Preserves the existing nav links
 * + PDPL privacy-choices control. Renders ONCE in the locale layout.
 */
export default function AppFooter({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();
  const linkCls =
    "text-[13px] font-semibold text-link transition-colors hover:underline";

  return (
    <FooterShell
      tagline={dict.footer.tagline}
      copyright={`© ${year} · ${dict.brandName} · ${dict.footer.rights}`}
      nav={
        <>
          <Link href={`/${locale}/discover`} className={linkCls}>
            {dict.footer.discover}
          </Link>
          <Link href={`/${locale}/browse`} className={linkCls}>
            {dict.footer.browse}
          </Link>
          <Link href={`/${locale}/suggest`} className={linkCls}>
            {dict.footer.suggest}
          </Link>
          <PrivacyChoicesButton
            label={dict.consent.privacyChoices}
            className={linkCls}
          />
        </>
      }
    />
  );
}
