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
          50:  '#e8ecf4',
          100: '#c5cfe3',
          200: '#9aafd0',
          300: '#6f8fbd',
          400: '#5077af',
          500: '#315fa1',
          600: '#2b5799',
          700: '#234d8f',
          800: '#1a4385',
          900: '#0D1F3C',
          950: '#070f1e',
        },
        crimson: {
          400: '#ff4d6a',
          500: '#E31837',
          600: '#c41530',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },
    },
  },
  plugins: [],
}
