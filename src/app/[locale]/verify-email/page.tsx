import { notFound } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui";
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
        <p className="text-[13px] leading-5 text-muted">{dict.auth.verifyBody}</p>
        <Button
          href={`/${typedLocale}/login`}
          variant="primary"
          className="w-full"
        >
          {dict.auth.goToLogin}
        </Button>
      </div>
    </AuthShell>
  );
}
