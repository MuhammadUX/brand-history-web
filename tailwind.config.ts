import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16181D",
        secondary: "#5B616E",
        tertiary: "#8A909C",
        primary: {
          DEFAULT: "#3B5BDB",
          hover: "#2F49B0",
          tint: "#EEF2FF",
        },
        page: "#F7F8FA",
        surface: "#FFFFFF",
        border: "#E4E7EC",
        success: "#15803D",
        verifiedText: "#0E7490",
        verifiedBg: "#E0F2F1",
        sponsored: "#B45309",
        sponsoredBg: "#FEF3C7",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto-arabic)", "system-ui", "sans-serif"],
        arabic: ["var(--font-noto-arabic)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        btn: "10px",
        card: "16px",
        pill: "999px",
      },
      maxWidth: {
        container: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
