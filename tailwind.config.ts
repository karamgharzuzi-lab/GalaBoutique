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
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        he:   ["var(--font-heebo)", "Heebo", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:        "0 2px 16px 0 rgba(59,31,15,0.08)",
        "card-hover":"0 8px 32px 0 rgba(59,31,15,0.16)",
        toast:       "0 4px 24px 0 rgba(59,31,15,0.18)",
      },
      screens: {
        xs: "390px",
      },
    },
  },
  plugins: [],
};
export default config;
