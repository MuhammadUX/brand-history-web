import type { NextConfig } from "next";

// Supabase origin (for CSP connect-src / img-src). Falls back to the wildcard
// supabase host so a missing build-time env can't lock the app out of its API.
const SUPABASE_ORIGIN = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "https://*.supabase.co";
  try {
    return new URL(url).origin;
  } catch {
    return "https://*.supabase.co";
  }
})();

// Content-Security-Policy (WEB-3). Reasonably strict but allows what the app
// needs: same-origin scripts; Supabase for API (connect) + storage images;
// img.logo.dev + Google favicon service for brand marks; inline styles (Tailwind
// + a few inline style attributes); no framing (frame-ancestors 'none').
// 'unsafe-inline' for scripts is intentionally NOT granted. Next.js inline
// bootstrap scripts are emitted with nonces/hashes by the framework; if any
// inline script is later blocked, prefer adding a nonce over loosening this.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://img.logo.dev https://www.google.com https://t1.gstatic.com https://t2.gstatic.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_ORIGIN}`,
  "frame-src 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  eslint: {
    // Do not fail the production build on lint errors (Sprint-0).
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Apply the security headers to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
