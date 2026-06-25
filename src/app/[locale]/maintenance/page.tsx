import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui";
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
      className="mx-auto flex min-h-[70vh] w-full max-w-content flex-col items-center justify-center px-6 py-24 text-center"
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-lg border border-line bg-surface text-3xl shadow-card"
        aria-hidden="true"
      >
        ⚙
      </span>
      <p className="label mt-6">{dict.brandName}</p>
      <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-ink">
        {dict.maintenance.title}
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-7 text-muted">
        {dict.maintenance.body}
      </p>
      <Button href={`/${typedLocale}`} className="mt-8">
        {dict.maintenance.home}
      </Button>
    </main>
  );
}
