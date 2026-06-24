import { notFound } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
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
      title={dict.auth.registerTitle}
      subtitle={dict.auth.registerSubtitle}
    >
      <RegisterForm locale={typedLocale} />
    </AuthShell>
  );
}
