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
      className="mx-auto flex min-h-[60vh] w-full max-w-content flex-col items-center justify-center px-6 py-24 text-center"
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-surface text-2xl shadow-card"
        aria-hidden="true"
      >
        ⚑
      </span>
      <h1 className="mt-5 text-[30px] font-bold leading-tight tracking-tight text-ink">
        {dict.unavailable.title}
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-7 text-muted">
        {dict.unavailable.body}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button href={`/${typedLocale}/browse`}>{dict.unavailable.browse}</Button>
        <Button href={`/${typedLocale}`} variant="ghost">
          {dict.unavailable.home}
        </Button>
      </div>
    </main>
  );
}
