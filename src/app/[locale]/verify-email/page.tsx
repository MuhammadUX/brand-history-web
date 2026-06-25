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
        <p className="font-mono text-[13px] leading-5 text-ink-700">
          {dict.auth.verifyBody}
        </p>
        <p className="border border-hairline bg-surface px-4 py-3 font-mono text-[13px] leading-5 text-metadata">
          {dict.auth.demoNote}
        </p>
        <Link
          href={`/${typedLocale}/login`}
          className="mo-invert mo-press inline-flex h-10 w-full items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700"
        >
          {dict.auth.goToLogin}
        </Link>
      </div>
    </AuthShell>
  );
}
