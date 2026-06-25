import type { Config } from "tailwindcss";

/**
 * Concept A — Terminal / Excavation
 * Monochrome archive: paper + ink, IBM Plex Mono labels, Space Grotesk headers,
 * sharp 0px corners, 1px hairlines, ordered-Bayer dither plates.
 *
 * NOTE: legacy color aliases (primary/page/border/secondary/...) are kept and
 * remapped onto the monochrome scale so existing screens keep compiling while
 * the page-level re-skin (next phase) migrates class usage to the new tokens.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Concept A canonical tokens ───────────────────────────────
        ink: {
          DEFAULT: "#0A0A0A", // primary text / fills / borders / primary button
          700: "#2B2B2B", // body text, hover ink, secondary emphasis
        },
        paper: "#F4F1EA", // page background
        surface: "#FBFAF6", // card / panel / input surface
        metadata: "#6E6E6E", // meta text, captions, disabled label
        hairline: "#9A9A9A", // 1px rules, dividers, disabled borders
        scaffold: "#D8D6CF", // hover wash, table inner rules, active-nav fill
        danger: "#8A1B1B", // destructive / error text + borders

        // ── Legacy aliases → mapped onto the monochrome scale ────────
        secondary: "#2B2B2B",
        tertiary: "#6E6E6E",
        primary: {
          DEFAULT: "#0A0A0A",
          hover: "#2B2B2B",
          tint: "#D8D6CF",
        },
        page: "#F4F1EA",
        border: "#9A9A9A",
        success: "#0A0A0A",
        verifiedText: "#0A0A0A",
        verifiedBg: "#D8D6CF",
        sponsored: "#2B2B2B",
        sponsoredBg: "#D8D6CF",
      },
      fontFamily: {
        // display / headings
        display: [
          "var(--font-display)",
          "Space Grotesk",
          "system-ui",
          "sans-serif",
        ],
        // UI / data / body / labels
        mono: [
          "var(--font-mono)",
          "IBM Plex Mono",
          "ui-monospace",
          "monospace",
        ],
        // Arabic
        arabic: [
          "var(--font-arabic)",
          "Noto Sans Arabic",
          "var(--font-mono)",
          "sans-serif",
        ],
        // legacy alias: default body = mono
        sans: [
          "var(--font-mono)",
          "IBM Plex Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
        // legacy aliases collapsed to sharp
        btn: "0",
        card: "0",
        pill: "0",
      },
      borderWidth: {
        hairline: "1px",
      },
      spacing: {
        // 8pt scale (Concept A · space): 4 8 12 16 24 32 48 64 96
        "0.5": "4px",
        "1": "8px",
        "1.5": "12px",
        "2": "16px",
        "3": "24px",
        "4": "32px",
        "6": "48px",
        "8": "64px",
        "12": "96px",
      },
      maxWidth: {
        container: "1200px",
        content: "1200px",
      },
      ringColor: {
        DEFAULT: "#0A0A0A",
        ink: "#0A0A0A",
      },
      ringWidth: {
        DEFAULT: "2px",
      },
      ringOffsetWidth: {
        DEFAULT: "2px",
      },
      letterSpacing: {
        label: "0.08em", // mono UPPERCASE labels +8% tracking
      },
      fontSize: {
        display: ["56px", { lineHeight: "60px", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "38px", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "30px", fontWeight: "500" }],
        h3: ["18px", { lineHeight: "24px", fontWeight: "500" }],
        body: ["15px", { lineHeight: "24px" }],
        label: ["13px", { lineHeight: "18px" }],
        caption: ["11px", { lineHeight: "16px" }],
        mono: ["11px", { lineHeight: "16px", letterSpacing: "0.08em" }],
      },
    },
  },
  plugins: [],
};

export default config;
