/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        defense: {
          900: '#0a0e1a',
          800: '#0f1428',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          primary: '#6366f1',
          cyan: '#06b6d4',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        }
      },
      backgroundImage: {
        'defense-gradient': 'radial-gradient(circle at center, #0f1428 0%, #0a0e1a 100%)',
      }
    },
  },
  plugins: [],
}
