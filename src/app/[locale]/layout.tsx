import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  return (
    <html lang={typedLocale} dir={dict.dir}>
      <head>
        {/*
          Fonts are loaded via <link> at runtime (Inter + Noto Sans Arabic).
          This avoids a build-time fetch to Google Fonts and works on Vercel.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-page text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
