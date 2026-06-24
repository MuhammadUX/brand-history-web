import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
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
    <>
      <TopNav locale={typedLocale} pathAfterLocale="suggest" />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {dict.suggest.title}
          </h1>
          <p className="mt-1 text-sm text-secondary">{dict.suggest.subtitle}</p>
        </header>
        <SuggestForm locale={typedLocale} />
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
