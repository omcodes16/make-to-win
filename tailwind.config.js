const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy/indigo base system
        surface: {
          0: '#030712', // Background app level
          1: '#0B1221', // Primary cards
          2: '#152033', // Secondary cards / inputs
          3: '#1F2E47', // Hover states / borders
        },
        // Refined accent system
        accent: {
          DEFAULT: '#38BDF8', // Sky blue primary
          hover: '#0EA5E9',
          muted: 'rgba(56, 189, 248, 0.15)', // For soft backgrounds
        },
        // Keeping original semantic colors for compatibility but refining them
        dusk: '#1B2A4A',
        teal: { ...colors.teal, DEFAULT: '#2DD4BF' },
        amber: { ...colors.amber, DEFAULT: '#FBBF24' },
        clay: '#EF4444',
        cloud: '#F8FAFC',
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'title-hero': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title-section': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-card': ['1.125rem', { lineHeight: '1.3', fontWeight: '500' }],
        'body-base': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
        'label-xs': ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.05em', fontWeight: '600', textTransform: 'uppercase' }],
      },
      borderRadius: {
        'card-sm': '0.75rem',  // 12px
        'card-md': '1rem',     // 16px
        'card-lg': '1.5rem',   // 24px
        'card-xl': '2rem',     // 32px
        bubble: '12px',
      },
      boxShadow: {
        // Elevation System
        'hero': '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'card-primary': '0 10px 30px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-secondary': '0 4px 6px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
      },
      spacing: {
        'card-padding-sm': '1rem',
        'card-padding-md': '1.5rem',
        'card-padding-lg': '2rem',
      }
    },
  },
  plugins: [],
};
