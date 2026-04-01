/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        'surface-2': '#1a1a24',
        'surface-3': '#22222f',
        accent: '#00d4ff',
        'accent-dim': '#0099bb',
        purple: '#7c3aed',
        'purple-dim': '#5b21b6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#6b7280',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.2)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.2)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
