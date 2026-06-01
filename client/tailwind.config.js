/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.88)', opacity: '0' },
          '65%':  { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-7px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        spinSpark: {
          '0%':   { transform: 'rotate(0deg) scale(1)' },
          '50%':  { transform: 'rotate(180deg) scale(1.25)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(99,102,241,0.15)' },
        },
        heroReveal: {
          '0%':   { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 0.3s ease-out both',
        'slide-down': 'slideDown 0.22s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'float':      'floatY 4s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s ease-in-out infinite',
        'spin-spark': 'spinSpark 1.1s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.2s ease-in-out infinite',
        'hero':             'heroReveal 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right':   'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
