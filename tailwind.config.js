const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#F7F8FA',
        dusk: '#1B2A4A',
        teal: {
          ...colors.teal,
          DEFAULT: '#2F6F6D',
        },
        amber: {
          ...colors.amber,
          DEFAULT: '#E8A33D',
        },
        clay: '#C1443C',
        cloud: '#E8ECF1',
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        bubble: '12px',
      },
    },
  },
  plugins: [],
};
