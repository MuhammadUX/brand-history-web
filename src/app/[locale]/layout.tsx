import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary, isLocale } from "@/i18n";
import ConsentBanner from "@/components/ConsentBanner";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { RouteTransition } from "@/components/ds";
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
          Concept A fonts loaded via runtime <link> (avoids a build-time fetch
          to Google Fonts; works on Vercel). Space Grotesk (display) + IBM Plex
          Mono (UI/body/labels) + Noto Sans Arabic. CSS vars in globals.css.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-2 focus:py-1 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-label focus:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          {dict.a11y.skipToContent}
        </a>
        {/*
          Concept A shared chrome: ONE DS Header (top) + DS Footer (bottom),
          with the R1 scanline RouteTransition mounted once around the page
          body. Pages render their own <Shell> content slot between them.
        */}
        <RouteTransition>
          <div className="mx-auto w-full max-w-content px-6 pt-6">
            <AppHeader locale={typedLocale} />
          </div>
          {children}
          <div className="mx-auto w-full max-w-content px-6 pb-6">
            <AppFooter locale={typedLocale} />
          </div>
        </RouteTransition>
        <ConsentBanner locale={typedLocale} />
      </body>
    </html>
  );
}
