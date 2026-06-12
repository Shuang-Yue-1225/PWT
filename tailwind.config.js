/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        muted: '#657089',
        line: '#D9E0EA',
        soft: '#F6F8FB',
        brand: '#2563EB',
        brandDark: '#1D4ED8'
      },
      boxShadow: {
        panel: '0 12px 30px rgba(23, 32, 51, 0.08)'
      }
    },
  },
  plugins: [],
};
