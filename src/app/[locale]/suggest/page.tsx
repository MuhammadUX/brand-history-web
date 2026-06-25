import { notFound } from "next/navigation";
import SuggestForm from "@/components/SuggestForm";
import { Shell } from "@/components/ds";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SuggestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  return (
    <main id="main-content">
      <Shell>
        <header className="mb-8">
          <h1 className="font-display text-[32px] leading-tight text-ink">
            {dict.suggest.title}
          </h1>
          <p className="mt-3 font-mono text-[15px] leading-6 text-ink-700">
            {dict.suggest.subtitle}
          </p>
        </header>
        <SuggestForm locale={typedLocale} />
      </Shell>
    </main>
  );
}
