import Link from "next/link";
import { notFound } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  return (
    <AuthShell locale={typedLocale} title={dict.auth.verifyTitle}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-secondary">{dict.auth.verifyBody}</p>
        <p className="rounded-card border border-border bg-page px-4 py-3 text-sm text-secondary">
          {dict.auth.demoNote}
        </p>
        <Link
          href={`/${typedLocale}/login`}
          className="w-full rounded-btn bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {dict.auth.goToLogin}
        </Link>
      </div>
    </AuthShell>
  );
}
