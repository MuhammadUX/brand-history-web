import { notFound } from "next/navigation";
import PricingToggle from "@/components/PricingToggle";
import { Badge, Card, Button } from "@/components/ui";
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
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
      <div className="text-center">
        <span className="inline-flex">
          <Badge kind="pro" />
        </span>
        <h1 className="mt-4 text-[32px] font-extrabold leading-tight tracking-display text-ink">
          {dict.pro.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-6 text-muted">
          {dict.pro.subtitle}
        </p>
      </div>

      {isPro ? (
        <Card className="mx-auto mt-10 max-w-xl p-8 text-center">
          <span className="inline-flex">
            <Badge kind="pro" />
          </span>
          <h2 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-ink">
            {dict.pro.alreadyTitle}
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-muted">
            {dict.pro.alreadyBody}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button href={`/${typedLocale}/account`} variant="primary">
              {dict.pro.manage}
            </Button>
            <Button href={`/${typedLocale}`} variant="ghost">
              {dict.pro.back}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Value prop */}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {features.map((f) => (
              <li key={f.title}>
                <Card className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-ok/40 bg-ok/10 text-[12px] text-ok"
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-[15px] font-bold leading-tight text-ink">
                      {f.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-muted">
                      {f.body}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Pricing */}
          <div className="lg:sticky lg:top-24">
            <PricingToggle locale={typedLocale} />
            <div className="mt-4 text-center">
              <Button href={`/${typedLocale}`} variant="ghost" size="sm">
                {dict.pro.later}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
