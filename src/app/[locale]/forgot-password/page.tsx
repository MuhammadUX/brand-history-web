import { notFound } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
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
      title={dict.auth.forgotTitle}
      subtitle={dict.auth.forgotSubtitle}
    >
      <ForgotPasswordForm locale={typedLocale} />
    </AuthShell>
  );
}
