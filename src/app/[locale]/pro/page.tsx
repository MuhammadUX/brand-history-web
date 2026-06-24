import Link from "next/link";
import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import PricingToggle from "@/components/PricingToggle";
import { getDictionary, isLocale } from "@/i18n";
import { getIsPro } from "@/lib/entitlements";
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

  const isPro = await getIsPro();

  const features = [
    { title: dict.pro.features.adFree, body: dict.pro.features.adFreeBody },
    { title: dict.pro.features.highRes, body: dict.pro.features.highResBody },
    { title: dict.pro.features.kits, body: dict.pro.features.kitsBody },
    { title: dict.pro.features.search, body: dict.pro.features.searchBody },
    { title: dict.pro.features.api, body: dict.pro.features.apiBody },
  ];

  return (
    <>
      <TopNav locale={typedLocale} pathAfterLocale="pro" />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <span className="inline-flex rounded-pill bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">
            {dict.nav.proBadge}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {dict.pro.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-secondary">
            {dict.pro.subtitle}
          </p>
        </div>

        {isPro ? (
          <div className="mx-auto mt-10 max-w-xl rounded-card border border-border bg-surface p-8 text-center">
            <span className="inline-flex rounded-pill bg-verifiedBg px-3 py-1 text-xs font-semibold text-verifiedText">
              {dict.nav.proBadge}
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink">
              {dict.pro.alreadyTitle}
            </h2>
            <p className="mt-2 text-base text-secondary">{dict.pro.alreadyBody}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${typedLocale}/account`}
                className="inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {dict.pro.manage}
              </Link>
              <Link
                href={`/${typedLocale}`}
                className="inline-flex rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {dict.pro.back}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
            {/* Value prop */}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {features.map((f) => (
                <li
                  key={f.title}
                  className="flex gap-3 rounded-card border border-border bg-surface p-5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-primary-tint text-sm font-bold text-primary"
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{f.title}</p>
                    <p className="mt-0.5 text-sm text-secondary">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pricing */}
            <div className="lg:sticky lg:top-24">
              <PricingToggle locale={typedLocale} />
              <div className="mt-4 text-center">
                <Link
                  href={`/${typedLocale}`}
                  className="text-sm font-medium text-secondary hover:text-ink"
                >
                  {dict.pro.later}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
