import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary, isLocale } from "@/i18n";
import { buildMetadata } from "@/lib/seo";
import { Card, SectionHeader } from "@/components/ui";
import { DraftNotice } from "../_legal/DraftNotice";
import type { Metadata } from "next";
import type { Locale } from "@/lib/types";

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
      pathAfterLocale: "privacy",
      title: `${dict.legal.privacy.title} — ${dict.brandName}`,
      description: dict.legal.privacy.subtitle,
    }),
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.legal;
  const p = t.privacy;

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-content px-6 py-14"
    >
      <div className="mx-auto max-w-[72ch]">
        <Link
          href={`/${typedLocale}`}
          className="text-[13px] font-semibold text-link hover:underline"
        >
          {t.backHome}
        </Link>

        <header className="mt-5">
          <p className="label">{t.kicker}</p>
          <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-ink">
            {p.title}
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-muted">{p.subtitle}</p>
        </header>

        <DraftNotice
          label={t.draftLabel}
          body={t.draftBody}
          updated={`${t.lastUpdatedLabel}: ${p.lastUpdated}`}
        />

        <div className="mt-8 space-y-6">
          {p.sections.map((s, i) => (
            <Card key={i}>
              <SectionHeader as="h2" title={s.h} className="mb-2.5" />
              <p className="text-[14.5px] leading-7 text-ink">{s.b}</p>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-[13px] leading-6 text-muted">
          {p.rightsNote}{" "}
          <Link
            href={`/${typedLocale}/account/privacy`}
            className="font-semibold text-link hover:underline"
          >
            {p.rightsLink}
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
