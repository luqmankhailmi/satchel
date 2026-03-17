/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0a0b10",
          800: "#0f1117",
          700: "#161920",
          600: "#1c2030",
          500: "#232840",
        },
        surface: {
          DEFAULT: "#161b27",
          hover: "#1e2535",
          active: "#252d42",
        },
        border: {
          DEFAULT: "#252d40",
          muted: "#1c2333",
        },
        ink: {
          DEFAULT: "#e2e8f0",
          muted: "#8892a4",
          faint: "#4a5568",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
