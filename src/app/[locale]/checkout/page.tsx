import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { Badge, Card, Button } from "@/components/ui";
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
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
      <h1 className="text-[32px] font-extrabold leading-tight tracking-display text-ink">
        {dict.checkout.title}
      </h1>

      {isPro ? (
        <Card className="mt-6 p-8 text-center">
          <span className="inline-flex">
            <Badge kind="pro" />
          </span>
          <h2 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-ink">
            {dict.checkout.alreadyTitle}
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-muted">
            {dict.checkout.alreadyBody}
          </p>
          <div className="mt-5 flex justify-center">
            <Button href={`/${typedLocale}/account`} variant="primary">
              {dict.pro.manage}
            </Button>
          </div>
        </Card>
      ) : !isPlan(planRaw) ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-[15px] leading-6 text-muted">
            {dict.checkout.invalidPlan}
          </p>
          <div className="mt-5 flex justify-center">
            <Button href={`/${typedLocale}/pro`} variant="primary">
              {dict.checkout.choosePlan}
            </Button>
          </div>
        </Card>
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
  );
}
