/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#08090c',
        'bg-surface': '#0f1117',
        'bg-elevated': '#161820',
        'border': '#1c1f2e',
        'border-subtle': '#13151f',
        'accent': '#4f6ef7',
        'accent-dim': '#1e2a6e',
        'primary': '#e2e8f0',
        'secondary': '#64748b',
        'muted': '#374151',
        'green-secure': '#16a34a',
        'amber-secure': '#d97706',
        'red-secure': '#dc2626',
        'red-dim': '#3b0f0f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xxs': '10px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
      }
    },
  },
  plugins: [],
}
