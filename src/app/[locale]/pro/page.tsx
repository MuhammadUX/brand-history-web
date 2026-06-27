import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n";

export const dynamic = "force-dynamic";

/**
 * Subscriptions/Pro purchase are hidden in the current free model. The page is
 * kept (dormant) so it can be revived for a future paid model, but for now any
 * visit redirects to the locale home so there is no purchase entry point.
 */
export default async function ProPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}`);
}
