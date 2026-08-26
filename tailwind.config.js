/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050914",
        night: "#0a1122",
        panel: "#0e1730",
        moon: "#f5c86a",
        fruit: "#ff6d3d",
        storm: "#38bdf8",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        rise: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        spinSlow: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        breathe: "breathe 5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        rise: "rise 0.6s cubic-bezier(0.22,1,0.36,1) both",
        spinSlow: "spinSlow 18s linear infinite",
      },
    },
  },
  plugins: [],
};
