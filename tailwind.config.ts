import type { Config } from "tailwindcss";

/**
 * THE LIBRARY — design tokens (locked).
 *
 * Warm, editorial, logo-forward. Brands are the content; the UI is a quiet
 * frame. Canonical type pin: Inter (Latin/UI) + Noto Sans Arabic (RTL).
 *
 * Color governance: a brand's own color appears ONLY inside its own context
 * (logo-tile tint ≤12%, 8px hero rule, color swatches) — never as a body-text
 * background, never full-bleed. The single governed UI accent is `link` (gold).
 *
 * `brand` is wired to the CSS var `--brand` so a profile can scope its own
 * accent on a container (e.g. style={{ "--brand": brand.primary_color }}).
 *
 * NOTE: legacy aliases from the previous concept (page/border/primary/…) are
 * intentionally NOT carried over. ds/* still compiles because it reads CSS vars
 * and its own utility classes; the public tokens below are the Library surface.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Library canonical tokens ─────────────────────────────────
        paper: "#F6F3EC", // page (warm paper)
        surface: {
          DEFAULT: "#FFFFFF", // cards / panels
          2: "#FCFAF5", // insets, search field, hover wash
        },
        ink: "#1A1A1A", // primary text + primary buttons
        muted: "#6B6B63", // secondary text / labels
        line: "#E6E0D2", // warm hairline borders
        link: "#7A5F30", // links / copy / "view all" (warm gold) — AA ≥4.5:1 on paper
        ok: "#0A7D3B", // verified / do
        danger: "#B4232A", // don't / destructive
        amber: {
          DEFAULT: "#855A0E", // archived label text — AA ≥4.5:1 on amber-bg
          bg: "#FBF3E0", // archived label background
          line: "#EAD9AE", // archived label border
        },
        // per-brand governed accent (set via the --brand CSS var on a scope).
        brand: "var(--brand, #8A6D3B)",
      },
      fontFamily: {
        // Latin / UI — Inter (canonical). `sans` is the default body face.
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        // RTL / Arabic — Noto Sans Arabic, co-equal scale & weight intent.
        arabic: [
          "Noto Sans Arabic",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        // Soft, never sharp. 10 controls/cards · 14 large cards · 999 pills.
        none: "0",
        DEFAULT: "10px",
        sm: "8px",
        md: "10px",
        lg: "14px",
        pill: "9999px",
        full: "9999px",
      },
      boxShadow: {
        // 1px hairline elevation + a whisper of lift.
        card: "0 1px 0 rgba(0,0,0,.04)",
        lift: "0 6px 22px -16px rgba(0,0,0,.25)",
        modal: "0 30px 80px -30px rgba(0,0,0,.5)",
        pop: "0 20px 60px -24px rgba(0,0,0,.4)",
      },
      maxWidth: {
        content: "1080px",
      },
      letterSpacing: {
        label: "0.14em", // small uppercase labels
        display: "-0.02em", // large display headings
        tight: "-0.01em",
      },
      fontSize: {
        // Library scale: Display 40/1.05 · H2 22 · label 11 · body 14–15.
        display: ["40px", { lineHeight: "1.05", fontWeight: "800" }],
        h1: ["32px", { lineHeight: "1.1", fontWeight: "800" }],
        h2: ["22px", { lineHeight: "1.2", fontWeight: "700" }],
        h3: ["15px", { lineHeight: "1.3", fontWeight: "700" }],
        body: ["15px", { lineHeight: "1.5" }],
        meta: ["12px", { lineHeight: "1.4" }],
        micro: ["11px", { lineHeight: "1.4" }],
      },
      keyframes: {
        fade: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "none" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        fade: "fade .22s ease both",
        "fade-in": "fadeIn .2s ease both",
        shimmer: "shimmer 1.4s linear infinite",
      },
      ringColor: {
        DEFAULT: "#8A6D3B",
        link: "#8A6D3B",
      },
    },
  },
  // Brand colors are injected at runtime via inline style on swatches/tiles, so
  // safelist the dynamic utilities the components rely on.
  safelist: ["animate-fade", "animate-fade-in", "animate-shimmer"],
  plugins: [],
};

export default config;
