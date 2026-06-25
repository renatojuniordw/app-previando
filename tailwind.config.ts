import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Legal Design System
        brand: {
          light: '#f8fafc',    // slate-50 (App background)
          dark: '#0f172a',     // slate-900 (Primary text/buttons)
          accent: '#d97706',   // amber-600 (Call to action)
          surface: '#ffffff',  // Cards and modals
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Merriweather', 'serif'],
        mono: ['var(--font-jetbrains)', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        // Soft elevation shadows replacing solid brutalist shadows
        'elevation-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
