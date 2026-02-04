/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d59f2",
        "primary-hover": "#0b4ecf",
        "background-light": "#f5f6f8",
        "background-dark": "#101622",
        "surface-dark": "#161b26", 
        "surface-light": "#ffffff",
        "border-dark": "#2a3447",
        "editor-bg": "#0d1117",
        "text-secondary": "#9ca6ba"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
}