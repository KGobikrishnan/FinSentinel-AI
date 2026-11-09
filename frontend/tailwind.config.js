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
        finnova: {
          canvas: '#F4F7F9',
          card: '#FFFFFF',
          navy: '#051329',
          dock: '#071833',
          indigo: '#0284C7',
          indigoHover: '#0369A1',
          gradientStart: '#00D4FF',
          gradientMid: '#0284C7',
          gradientEnd: '#034375',
          cyan: '#00F0FF',
          teal: '#0D9488',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'monospace',
        ],
      },
      boxShadow: {
        'finnova-card': '0 10px 30px -10px rgba(5, 19, 41, 0.05)',
        'finnova-pill': '0 8px 20px -4px rgba(2, 132, 199, 0.45)',
        'finnova-dock': '0 25px 60px -15px rgba(5, 19, 41, 0.45)',
        'finnova-glow': '0 0 25px rgba(0, 212, 255, 0.35)',
      },
    },
  },
  plugins: [],
};
