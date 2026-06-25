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
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-content flex-col items-center justify-center px-6 py-24 text-center"
    >
      <span
        className="flex h-14 w-14 items-center justify-center border border-ink font-display text-2xl text-ink"
        aria-hidden="true"
      >
        ⚑
      </span>
      <h1 className="mt-5 font-display text-[32px] leading-tight text-ink">
        {dict.unavailable.title}
      </h1>
      <p className="mt-3 max-w-md font-mono text-[15px] leading-6 text-ink-700">
        {dict.unavailable.body}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
        <Link
          href={`/${typedLocale}/browse`}
          className="mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700"
        >
          {dict.unavailable.browse}
        </Link>
        <Link
          href={`/${typedLocale}`}
          className="mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-transparent px-4 font-mono text-[11px] font-medium uppercase tracking-label text-ink hover:bg-ink hover:text-paper"
        >
          {dict.unavailable.home}
        </Link>
      </div>
    </main>
  );
}
