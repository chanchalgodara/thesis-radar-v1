import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#3a7d5c",
          bg: "#0d0f11",
          card: "#14171a",
          border: "#2a2e33",
          surface: "#1a1d21",
          hover: "#1e2227",
          accent: "#4a9d70",
          "accent-bg": "rgba(58, 125, 92, 0.1)",
          muted: "#7a8290",
          faint: "#4a5060",
        },
      },
      fontFamily: {
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        display: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
