/** @type {import('tailwindcss').Config} */
export default {
  content: ['./frontend/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { dark: '#0F172A', primary: '#2563EB', accent: '#22C55E', light: '#F1F5F9' }
      },
      fontFamily: { sans: ['Poppins', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
