import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { Shell, Badge } from "@/components/ds";
import { createServerSupabase } from "@/lib/supabase-server";
import { getIsPro } from "@/lib/entitlements";
import { getDictionary, isLocale } from "@/i18n";
import { isPlan } from "@/lib/pricing";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

const primaryLink =
  "mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700";

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
    <main id="main-content">
      <Shell>
        <h1 className="font-display text-[32px] leading-tight text-ink">
          {dict.checkout.title}
        </h1>

        {isPro ? (
          <div className="mt-6 border border-hairline bg-surface p-8 text-center">
            <Badge kind="pro" />
            <h2 className="mt-4 font-display text-2xl leading-tight text-ink">
              {dict.checkout.alreadyTitle}
            </h2>
            <p className="mt-2 font-mono text-[13px] leading-5 text-ink-700">
              {dict.checkout.alreadyBody}
            </p>
            <div className="mt-5 flex justify-center">
              <Link href={`/${typedLocale}/account`} className={primaryLink}>
                {dict.pro.manage}
              </Link>
            </div>
          </div>
        ) : !isPlan(planRaw) ? (
          <div className="mt-6 border border-hairline bg-surface p-8 text-center">
            <p className="font-mono text-[15px] leading-6 text-ink-700">
              {dict.checkout.invalidPlan}
            </p>
            <div className="mt-5 flex justify-center">
              <Link href={`/${typedLocale}/pro`} className={primaryLink}>
                {dict.checkout.choosePlan}
              </Link>
            </div>
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
      </Shell>
    </main>
  );
}
