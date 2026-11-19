/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF8EF',
          100: '#F6EFCF',
          200: '#EDDC9E',
          300: '#E4C86C',
          400: '#DCB742',
          500: '#D4AF37', // primary brand gold
          600: '#B89326',
          700: '#91711A',
          800: '#6C5314',
          900: '#48360D',
          glow: 'rgba(212, 175, 55, 0.25)',
        },
        dark: {
          950: '#07080B', // deepest obsidian
          900: '#0B0C10', // main background
          850: '#111319', // card background
          800: '#161922', // elevated surface
          750: '#1D212E', // border / hover
          700: '#262B3B', // subtle borders
          600: '#3D445D',
          500: '#636C8B',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 2px 10px rgba(212, 175, 55, 0.15)',
        'gold-md': '0 4px 20px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 8px 32px rgba(212, 175, 55, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA8022 100%)',
        'gold-gradient-subtle': 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(17, 19, 25, 0.8) 100%)',
        'dark-gradient': 'linear-gradient(180deg, #111319 0%, #0B0C10 100%)',
      },
    },
  },
  plugins: [],
}
