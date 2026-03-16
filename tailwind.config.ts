import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        surface: '#111827',
        border: '#1f2937',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        text: {
          primary: '#f9fafb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
