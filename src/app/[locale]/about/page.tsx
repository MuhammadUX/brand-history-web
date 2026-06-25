import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary, isLocale } from "@/i18n";
import { buildMetadata } from "@/lib/seo";
import { Button, Card, SectionHeader } from "@/components/ui";
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
      pathAfterLocale: "about",
      title: `${dict.legal.about.title} — ${dict.brandName}`,
      description: dict.legal.about.subtitle,
    }),
    robots: { index: true, follow: true },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const t = dict.legal;
  const a = t.about;

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
          <p className="label">{a.kicker}</p>
          <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-ink">
            {a.title}
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-muted">{a.subtitle}</p>
        </header>

        <div className="mt-8 space-y-6">
          <Card>
            <SectionHeader as="h2" title={a.whatTitle} className="mb-2.5" />
            <p className="text-[14.5px] leading-7 text-ink">{a.whatBody}</p>
          </Card>

          <Card>
            <SectionHeader as="h2" title={a.missionTitle} className="mb-2.5" />
            <p className="text-[14.5px] leading-7 text-ink">{a.missionBody}</p>
          </Card>

          <Card>
            <SectionHeader as="h2" title={a.curationTitle} className="mb-3" />
            <ol className="space-y-3">
              {a.curationSteps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-line bg-surface-2 text-[12px] font-bold text-muted">
                    {i + 1}
                  </span>
                  <span className="text-[14.5px] leading-7 text-ink">{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-bold text-ink">{a.ctaTitle}</p>
            <p className="mt-1 text-[13.5px] leading-6 text-muted">
              {a.ctaBody}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href={`/${typedLocale}/discover`}>{a.ctaDiscover}</Button>
            <Button href={`/${typedLocale}/suggest`} variant="ghost">
              {a.ctaSuggest}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
