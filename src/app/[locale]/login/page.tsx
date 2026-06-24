import { Suspense } from "react";
import { notFound } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LoginPage({
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
      title={dict.auth.loginTitle}
      subtitle={dict.auth.loginSubtitle}
    >
      <Suspense fallback={null}>
        <LoginForm locale={typedLocale} />
      </Suspense>
    </AuthShell>
  );
}
