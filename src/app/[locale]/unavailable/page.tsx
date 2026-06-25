import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

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
      pathAfterLocale: "unavailable",
      title: `${dict.unavailable.title} — ${dict.brandName}`,
      description: dict.unavailable.body,
    }),
    // 410-style: a previously-known resource that is gone — keep it out of the index.
    robots: { index: false, follow: true },
  };
}

export default async function UnavailablePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  return (
    <>
      <main
        id="main-content"
        className="mx-auto flex max-w-container flex-col items-center justify-center px-4 py-24 text-center sm:px-6"
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-card bg-sponsoredBg text-2xl text-sponsored"
          aria-hidden="true"
        >
          ⚑
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">
          {dict.unavailable.title}
        </h1>
        <p className="mt-3 max-w-md text-secondary">{dict.unavailable.body}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${typedLocale}/browse`}
            className="rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.unavailable.browse}
          </Link>
          <Link
            href={`/${typedLocale}`}
            className="rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.unavailable.home}
          </Link>
        </div>
      </main>
    </>
  );
}
