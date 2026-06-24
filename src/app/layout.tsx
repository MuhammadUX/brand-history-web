import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand History",
  description:
    "Explore logos, colors, and stories from the brands that shaped the region.",
};

// The <html> and <body> tags are rendered in app/[locale]/layout.tsx so that
// `lang` and `dir` can be set per-locale. This root layout is a pass-through.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
