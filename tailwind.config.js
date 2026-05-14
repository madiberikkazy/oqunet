/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2D6BFF",
          50: "#EEF3FF",
          100: "#DDE7FF",
          200: "#B8CCFF",
          500: "#2D6BFF",
          600: "#1F58E0",
          700: "#1947B8",
        },
        ink: {
          900: "#0F1724",
          700: "#2A3340",
          500: "#5B6573",
          300: "#A7ADB7",
          100: "#EEF0F3",
        },
        ok: "#16A34A",
        okSoft: "#DCFCE7",
        warn: "#F59E0B",
        warnSoft: "#FEF3C7",
        bad: "#EF4444",
        badSoft: "#FEE2E2",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: { soft: "0 4px 16px rgba(15, 23, 36, 0.06)" },
      borderRadius: { xl: "14px", "2xl": "20px" },
    },
  },
  plugins: [],
};
