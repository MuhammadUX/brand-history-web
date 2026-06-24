import { notFound } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  return (
    <AuthShell
      locale={typedLocale}
      title={dict.auth.resetTitle}
      subtitle={dict.auth.resetSubtitle}
    >
      <ResetPasswordForm locale={typedLocale} />
    </AuthShell>
  );
}
