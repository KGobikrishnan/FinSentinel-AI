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
          canvas: '#F4F5FA',
          card: '#FFFFFF',
          navy: '#161622',
          dock: '#181824',
          indigo: '#5847F6',
          indigoHover: '#4B3BE0',
          gradientStart: '#635BFF',
          gradientMid: '#5847F6',
          gradientEnd: '#4636C9',
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
        'finnova-card': '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
        'finnova-pill': '0 8px 20px -4px rgba(88, 71, 246, 0.45)',
        'finnova-dock': '0 25px 60px -15px rgba(24, 24, 36, 0.4)',
        'finnova-glow': '0 0 25px rgba(88, 71, 246, 0.35)',
      },
    },
  },
  plugins: [],
};
