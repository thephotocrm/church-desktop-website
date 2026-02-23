/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx}',
    './src/**/*.{js,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1b294b',
          foreground: '#f8fafc',
        },
        accent: {
          DEFAULT: '#e7b008',
          foreground: '#0f1729',
        },
        background: '#f6f7f9',
        card: '#ffffff',
        foreground: '#0f1729',
        muted: {
          DEFAULT: '#e2e4e9',
          foreground: '#6b7280',
        },
        border: '#e5e7eb',
        destructive: '#c51111',
      },
      fontFamily: {
        heading: ['PlayfairDisplay_400Regular'],
        'heading-bold': ['PlayfairDisplay_700Bold'],
        body: ['OpenSans_400Regular'],
        'body-semibold': ['OpenSans_600SemiBold'],
        'body-bold': ['OpenSans_700Bold'],
      },
    },
  },
  plugins: [],
};
