import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary, isLocale } from "@/i18n";
import ConsentBanner from "@/components/ConsentBanner";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
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
          The Library fonts loaded via runtime <link> (avoids a build-time fetch
          to Google Fonts; works on Vercel). Canonical type pin: Inter
          (Latin/UI) + Noto Sans Arabic (RTL). No other faces, no serif.
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
      <body className="min-h-screen bg-paper text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-pill focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          {dict.a11y.skipToContent}
        </a>

        {/* Shared chrome: one Library header (own inner max-width + sticky) and
            one footer, with the page content centered between them. Navigation
            is a plain cut — no route-transition wrapper. */}
        <AppHeader locale={typedLocale} />
        {children}
        <div className="mx-auto w-full max-w-content px-6">
          <AppFooter locale={typedLocale} />
        </div>

        <ConsentBanner locale={typedLocale} />
      </body>
    </html>
  );
}
