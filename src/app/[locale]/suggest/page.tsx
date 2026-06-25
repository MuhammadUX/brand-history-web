import { notFound } from "next/navigation";
import SuggestForm from "@/components/SuggestForm";
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
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-[32px] font-extrabold leading-tight tracking-display text-ink">
          {dict.suggest.title}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted">
          {dict.suggest.subtitle}
        </p>
      </header>
      <div className="max-w-2xl">
        <SuggestForm locale={typedLocale} />
      </div>
    </main>
  );
}
