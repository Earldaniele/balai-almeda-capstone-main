/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'balai-gold': '#D4AF37',
        'balai-gold-dark': '#B8941C',
        'balai-dark': '#1a1a1a',
      },
    },
  },
  plugins: [],
}