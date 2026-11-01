/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#09090B',
          900: '#0D0D10',
          850: '#121216',
          800: '#18181D',
          700: '#272730',
        },
        surface: {
          base: '#09090B',
          raised: '#0F0F12',
          overlay: '#141418',
          hover: '#1B1B22',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Geist Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        kpi: '-0.015em',
        caption: '0.06em',
      },
      boxShadow: {
        'specular': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'specular-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 8px 24px -4px rgba(0, 0, 0, 0.6)',
        'subtle-card': '0 1px 2px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
};
