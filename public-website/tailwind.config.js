/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'balai-bg': '#F9F9F7',
        'balai-dark': '#2B2B2B',
        'balai-gold': '#B58B4C',
        'balai-gold-dark': '#96733F'
      },
      fontFamily: {
        serif: ['Prata', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1.5rem',
        screens: {
          lg: '1124px',
          xl: '1124px',
          '2xl': '1124px',
        }
      }
    },
  },
  plugins: [],
}