import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { createServerSupabase } from "@/lib/supabase-server";
import { getIsPro } from "@/lib/entitlements";
import { getDictionary, isLocale } from "@/i18n";
import { isPlan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  const { plan: planRaw } = await searchParams;

  // Require login → redirect with next back to this checkout.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = `/${typedLocale}/checkout${
      planRaw ? `?plan=${planRaw}` : ""
    }`;
    redirect(`/${typedLocale}/login?next=${encodeURIComponent(next)}`);
  }

  const isPro = await getIsPro();

  const renewDate = (() => {
    const d = new Date();
    if (planRaw === "annual") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return new Intl.DateTimeFormat(typedLocale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  })();

  return (
    <>
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {dict.checkout.title}
        </h1>

        {isPro ? (
          <div className="mt-6 rounded-card border border-border bg-surface p-8 text-center">
            <span className="inline-flex rounded-pill bg-verifiedBg px-3 py-1 text-xs font-semibold text-verifiedText">
              {dict.nav.proBadge}
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">
              {dict.checkout.alreadyTitle}
            </h2>
            <p className="mt-2 text-sm text-secondary">
              {dict.checkout.alreadyBody}
            </p>
            <Link
              href={`/${typedLocale}/account`}
              className="mt-5 inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.pro.manage}
            </Link>
          </div>
        ) : !isPlan(planRaw) ? (
          <div className="mt-6 rounded-card border border-border bg-surface p-8 text-center">
            <p className="text-base text-secondary">
              {dict.checkout.invalidPlan}
            </p>
            <Link
              href={`/${typedLocale}/pro`}
              className="mt-5 inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.checkout.choosePlan}
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <CheckoutForm
              locale={typedLocale}
              plan={planRaw}
              renewDate={renewDate}
            />
          </div>
        )}
      </main>
    </>
  );
}
