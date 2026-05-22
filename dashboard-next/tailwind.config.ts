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
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        navy: {
          950: "#07090e",
          900: "#0e1525",
          800: "#141e33",
          700: "#1a263d",
          600: "#243352",
        },
        surface: {
          50:  "#f8fafc",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        channel: {
          tv:    "#3b82f6",
          radio: "#8b5cf6",
          sm:    "#06b6d4",
        },
      },
      backgroundImage: {
        "gradient-radial":   "radial-gradient(var(--tw-gradient-stops))",
        "gradient-hero":     "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59,130,246,0.15) 0%, transparent 60%)",
        "gradient-card":     "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(139,92,246,0.03) 100%)",
        "gradient-accent":   "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        "gradient-success":  "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
      },
      animation: {
        "fade-in":     "fadeIn 0.4s ease-out",
        "fade-in-up":  "fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1)",
        "scale-in":    "scaleIn 0.4s cubic-bezier(0.22,1,0.36,1)",
        "slide-down":  "slideDown 0.3s ease-out",
        "pulse-slow":  "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "shimmer":     "shimmer 1.8s infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" },                                           to: { opacity: "1" } },
        fadeInUp:  { from: { opacity: "0", transform: "translateY(12px)" },            to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn:   { from: { opacity: "0", transform: "scale(0.96)" },                 to: { opacity: "1", transform: "scale(1)" } },
        slideDown: { from: { opacity: "0", transform: "translateY(-8px)" },            to: { opacity: "1", transform: "translateY(0)" } },
        shimmer:   { "0%": { backgroundPosition: "-800px 0" }, "100%": { backgroundPosition: "800px 0" } },
      },
      boxShadow: {
        "glow-blue":   "0 0 24px rgba(59,130,246,0.25)",
        "glow-green":  "0 0 24px rgba(16,185,129,0.25)",
        "card":        "0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)",
        "card-hover":  "0 2px 8px rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        "card": "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
