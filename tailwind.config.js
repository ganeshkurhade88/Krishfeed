/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-green': '#1B4332',
        'mid-green': '#2D6A4F',
        'lite-green': '#52B788',
        'pale-green': '#D8F3DC',
        'off-white': '#F8FFF9',
        'accent-orange': '#E76F51',
        'amber': '#F4A261',
        'gold': '#F9C74F',
        'dark': '#1A1A2E',
        'grey': '#6B7280',
        'light-grey': '#F3F4F6',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(27, 67, 50, 0.08)',
        'card-hover': '0 4px 16px rgba(27, 67, 50, 0.14)',
        'elevated': '0 8px 24px rgba(27, 67, 50, 0.12)',
      },
      borderRadius: {
        'card': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
