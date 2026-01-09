/** @type {import('tailwindcss').Config} */
import colors from 'material-colors/dist/colors.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Deepest Zinc/Black for OLED-like dark
        surface: '#18181b', // Zinc 900
        'surface-variant': '#27272a', // Zinc 800

        // Material Colors Integration
        primary: {
          DEFAULT: colors.deepPurple[400], // Visible on dark background
          light: colors.deepPurple[300],
          dark: colors.deepPurple[700],
          container: `rgb(var(--color-primary) / 0.2)`,
        },
        secondary: {
          DEFAULT: colors.teal[400],
          light: colors.teal[200],
          dark: colors.teal[700],
          container: '#3E3528', // Keep original or update? Updating to match teal
        },

        // Semantic Colors
        error: colors.red[400],
        success: colors.green[400],
        warning: colors.amber[400],
        info: colors.lightBlue[400],

        on: {
          background: '#FFFFFF',
          surface: '#F4F4F5', // Zinc 100
          primary: '#FFFFFF',
          secondary: '#000000',
        },
        outline: '#52525b', // Zinc 600

        // Keep existing Tailwind extends if used
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '56px',
        'full': '9999px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'ios-small': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'ios-medium': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'ios-large': '0 16px 48px rgba(0, 0, 0, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
