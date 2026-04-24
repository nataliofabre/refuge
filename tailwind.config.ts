import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical-but-fun palette
        ink: {
          50: "#F7F8FA",
          100: "#EEF1F5",
          200: "#DDE3EC",
          400: "#8B93A3",
          600: "#4A5266",
          800: "#1F2530",
          900: "#0F131B",
        },
        clinic: {
          50: "#EFF8FF",
          100: "#DDEFFE",
          300: "#7EC4FD",
          500: "#2B7FFF", // primary clinical blue
          600: "#1862E1",
          700: "#134DB3",
        },
        mint: {
          50: "#ECFDF5",
          300: "#6EE7B7",
          500: "#10B981", // success / sobriety progress
          700: "#047857",
        },
        coral: {
          50: "#FFF1F2",
          300: "#FDA4AF",
          500: "#FB7185", // craving / warm moments
          700: "#BE123C",
        },
        sand: {
          50: "#FDFAF4",
          200: "#F2E8D5",
          500: "#CFA969",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgb(15 19 27 / 0.08)",
        card: "0 2px 12px -4px rgb(15 19 27 / 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
