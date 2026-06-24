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
      className="mx-auto flex min-h-screen max-w-container flex-col items-center justify-center px-4 py-24 text-center sm:px-6"
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-card bg-primary-tint text-3xl text-primary"
        aria-hidden="true"
      >
        ⚙
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-wide text-primary">
        {dict.brandName}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
        {dict.maintenance.title}
      </h1>
      <p className="mt-3 max-w-md text-secondary">{dict.maintenance.body}</p>
      <Link
        href={`/${typedLocale}`}
        className="mt-8 rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {dict.maintenance.home}
      </Link>
    </main>
  );
}
