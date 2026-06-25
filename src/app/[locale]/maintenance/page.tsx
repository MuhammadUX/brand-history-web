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
      pathAfterLocale: "maintenance",
      title: `${dict.maintenance.title} — ${dict.brandName}`,
      description: dict.maintenance.body,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function MaintenancePage({
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
      className="mx-auto flex min-h-screen w-full max-w-content flex-col items-center justify-center px-6 py-24 text-center"
    >
      <span
        className="flex h-16 w-16 items-center justify-center border border-ink font-display text-3xl text-ink"
        aria-hidden="true"
      >
        ⚙
      </span>
      <p className="label-mono mt-6 text-metadata">{dict.brandName}</p>
      <h1 className="mt-2 font-display text-[32px] leading-tight text-ink">
        {dict.maintenance.title}
      </h1>
      <p className="mt-3 max-w-md font-mono text-[15px] leading-6 text-ink-700">
        {dict.maintenance.body}
      </p>
      <Link
        href={`/${typedLocale}`}
        className="mo-invert mo-press mt-8 inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700"
      >
        {dict.maintenance.home}
      </Link>
    </main>
  );
}
