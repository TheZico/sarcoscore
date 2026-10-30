import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--foreground))",
        },
        border: "hsl(var(--border))",
        level: {
          low: "#2E8B57",
          moderate: "#E3A21A",
          high: "#C0504D",
        },
        sage: {
          DEFAULT: "hsl(158, 30%, 27%)",
          hover: "hsl(158, 32%, 21%)",
          deep: "hsl(164, 28%, 18%)",
          soft: "hsl(158, 22%, 90%)",
        },
      },
      fontFamily: {
        serif: ["var(--font-petrona)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        mockup: "0 20px 50px -15px rgba(34, 48, 46, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

