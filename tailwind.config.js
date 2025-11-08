/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d5ff",
          300: "#a4b8ff",
          400: "#8190ff",
          500: "#667eea",
          600: "#5568d3",
          700: "#4751b8",
          800: "#3d4496",
          900: "#383e7a",
        },
      },
    },
  },
  plugins: [],
};
