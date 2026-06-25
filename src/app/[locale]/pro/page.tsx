import Link from "next/link";
import { notFound } from "next/navigation";
import PricingToggle from "@/components/PricingToggle";
import { Shell, Badge } from "@/components/ds";
import { getDictionary, isLocale } from "@/i18n";
import { getIsPro } from "@/lib/entitlements";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

const primaryLink =
  "mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700";
const secondaryLink =
  "mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-transparent px-4 font-mono text-[11px] font-medium uppercase tracking-label text-ink hover:bg-ink hover:text-paper";

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
    <main id="main-content">
      <Shell>
        <div className="text-center">
          <Badge kind="pro" />
          <h1 className="mt-4 font-display text-[32px] leading-tight text-ink">
            {dict.pro.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl font-mono text-[15px] leading-6 text-ink-700">
            {dict.pro.subtitle}
          </p>
        </div>

        {isPro ? (
          <div className="mx-auto mt-10 max-w-xl border border-hairline bg-surface p-8 text-center">
            <Badge kind="pro" />
            <h2 className="mt-4 font-display text-2xl leading-tight text-ink">
              {dict.pro.alreadyTitle}
            </h2>
            <p className="mt-2 font-mono text-[15px] leading-6 text-ink-700">
              {dict.pro.alreadyBody}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
              <Link href={`/${typedLocale}/account`} className={primaryLink}>
                {dict.pro.manage}
              </Link>
              <Link href={`/${typedLocale}`} className={secondaryLink}>
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
                  className="flex gap-3 border border-hairline bg-surface p-5"
                >
                  <span
                    aria-hidden="true"
                    className="label-mono mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center border border-ink text-ink"
                  >
                    ✓
                  </span>
                  <div>
                    <p className="font-display text-[15px] leading-tight text-ink">
                      {f.title}
                    </p>
                    <p className="mt-1 font-mono text-[13px] leading-5 text-ink-700">
                      {f.body}
                    </p>
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
                  className="label-mono text-metadata hover:text-ink"
                >
                  {dict.pro.later}
                </Link>
              </div>
            </div>
          </div>
        )}
      </Shell>
    </main>
  );
}
