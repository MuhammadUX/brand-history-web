import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary, isLocale } from "@/i18n";
import { buildMetadata } from "@/lib/seo";
import { Button, Card, SectionHeader, Badge } from "@/components/ui";
import type { Metadata } from "next";
import type { Locale } from "@/lib/types";

/** Placeholder contact address — the owner must replace this before launch. */
const CONTACT_EMAIL = "hello@brandhistory.example";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    ...buildMetadata({
      locale,
      pathAfterLocale: "contact",
      title: `${dict.legal.contact.title} — ${dict.brandName}`,
      description: dict.legal.contact.subtitle,
    }),
    robots: { index: true, follow: true },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.legal;
  const c = t.contact;

  return (
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-14">
      <div className="mx-auto max-w-[72ch]">
        <Link
          href={`/${typedLocale}`}
          className="text-[13px] font-semibold text-link hover:underline"
        >
          {t.backHome}
        </Link>

        <header className="mt-5">
          <p className="label">{c.kicker}</p>
          <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-ink">
            {c.title}
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-muted">{c.subtitle}</p>
        </header>

        <div className="mt-8 space-y-6">
          <Card>
            <SectionHeader as="h2" title={c.emailTitle} className="mb-2.5" />
            <p className="text-[14.5px] leading-7 text-ink">{c.emailBody}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[15px] font-semibold text-link hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              <Badge kind="neutral">{c.placeholderBadge}</Badge>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-muted">
              {c.placeholderNote}
            </p>
          </Card>

          <Card>
            <SectionHeader as="h2" title={c.suggestTitle} className="mb-2.5" />
            <p className="text-[14.5px] leading-7 text-ink">{c.suggestBody}</p>
            <div className="mt-4">
              <Button href={`/${typedLocale}/suggest`}>{c.suggestCta}</Button>
            </div>
          </Card>

          <Card>
            <SectionHeader as="h2" title={c.claimTitle} className="mb-2.5" />
            <p className="text-[14.5px] leading-7 text-ink">{c.claimBody}</p>
            <p className="mt-3 text-[13px] leading-6 text-muted">
              {c.claimSeeTerms}{" "}
              <Link
                href={`/${typedLocale}/terms`}
                className="font-semibold text-link hover:underline"
              >
                {c.claimTermsLink}
              </Link>
              .
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
