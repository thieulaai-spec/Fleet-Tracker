/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        blue: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        slate: {
          950: '#ffffff', // App background -> White
          900: '#f8fafc', // Card background -> slate-50 (light off-white)
          800: '#f1f5f9', // Input bg -> slate-100
          700: '#e2e8f0', // Borders -> slate-200
          600: '#cbd5e1', // Borders/Muted -> slate-300
          500: '#64748b', // Muted text -> slate-500
          400: '#475569', // Gray text -> slate-600
          300: '#334155', // Subtitle text -> slate-700
          200: '#1e293b', // Body text -> slate-800
          100: '#0f172a', // Heading text -> slate-900
          50: '#020617',  // Primary heading text -> slate-950
        },
        white: '#0f172a', // Map white -> dark slate for text readability on light bg
        realwhite: '#ffffff', // Reference for actual white
      }
    },
  },
  plugins: [],
};

