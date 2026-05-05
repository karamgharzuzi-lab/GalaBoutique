import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          brown:        "#3B1F0F",
          cream:        "#FAF7F2",
          gold:         "#C9A84C",
          "gold-light": "#E8C96A",
          "brown-light":"#6B3A22",
          "brown-dark": "#2A1508",
          "cream-dark": "#EDE8E0",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "Inter", "sans-serif"],
        he:      ["var(--font-heebo)", "Heebo", "sans-serif"],
        display: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
      },
      letterSpacing: {
        luxe: "0.18em",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:        "0 1px 2px 0 rgba(59,31,15,0.04), 0 8px 24px -8px rgba(59,31,15,0.08)",
        "card-hover":"0 2px 4px 0 rgba(59,31,15,0.06), 0 16px 40px -12px rgba(59,31,15,0.18)",
        toast:       "0 4px 24px 0 rgba(59,31,15,0.18)",
        soft:        "0 1px 0 0 rgba(59,31,15,0.04)",
      },
      screens: {
        xs: "390px",
      },
    },
  },
  plugins: [],
};
export default config;
