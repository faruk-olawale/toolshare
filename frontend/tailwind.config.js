/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdecd6',
          200: '#fbd6ac',
          300: '#f8b878',
          400: '#f59042',
          500: '#f2711c',
          600: '#e35712',
          700: '#bc4011',
          800: '#953315',
          900: '#782c14',
        },
        earth: {
          50: '#f9f5f0',
          100: '#f0e8db',
          200: '#dfd0b9',
          300: '#c9b090',
          400: '#b08f68',
          500: '#9d764f',
          600: '#8a6344',
          700: '#72503a',
          800: '#5e4232',
          900: '#4e382b',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(-10px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
      }
    },
  },
  plugins: [],
}
