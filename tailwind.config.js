/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          600: '#1e3a6e',
          700: '#162d5a',
          800: '#0f2047',
          900: '#0a1628',
        }
      }
    },
  },
  plugins: [],
}
