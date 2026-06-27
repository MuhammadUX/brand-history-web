import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n";

export const dynamic = "force-dynamic";

/**
 * Checkout is dormant in the current free model (subscriptions hidden). The
 * server actions and form component are kept for a future paid model, but the
 * page itself redirects to the locale home so there is no purchase entry point.
 */
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}`);
}
