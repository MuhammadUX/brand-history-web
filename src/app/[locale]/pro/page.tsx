import Link from "next/link";
import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProPage({
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
      <TopNav locale={typedLocale} pathAfterLocale="pro" />
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <div className="rounded-card border border-border bg-surface p-10 text-center">
          <span className="inline-flex rounded-pill bg-sponsoredBg px-3 py-1 text-xs font-semibold text-sponsored">
            {dict.brand.proLock}
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
            {dict.pro.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-secondary">
            {dict.pro.body}
          </p>
          <Link
            href={`/${typedLocale}`}
            className="mt-6 inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.pro.back}
          </Link>
        </div>
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
