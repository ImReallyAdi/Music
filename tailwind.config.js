/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem', // 24px (mobile)
        md: '3rem',        // 48px (tablet)
        lg: '4rem',        // 64px (desktop)
      },
      screens: {
        '2xl': '1200px', // max-w-5xl
      },
    },
    extend: {
      colors: {
        background: '#0A0A0A',
        foreground: '#FAFAFA',
        muted: {
          DEFAULT: '#1A1A1A',
          foreground: '#737373',
        },
        accent: {
          DEFAULT: '#FF3D00',
          foreground: '#0A0A0A',
        },
        border: '#262626',
        input: '#1A1A1A',
        card: {
          DEFAULT: '#0F0F0F',
          foreground: '#FAFAFA',
        },
        ring: '#FF3D00',
        // Legacy/Material compatibility (mapped to new system where possible or kept as fallbacks)
        surface: '#0A0A0A',
        'on-surface': '#FAFAFA',
        primary: '#FF3D00',
        'primary-container': '#1A1A1A',
        'on-primary': '#0A0A0A',
        secondary: '#FAFAFA',
        tertiary: '#FF3D00',
        error: '#FF3D00',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', '"Inter"', 'system-ui', 'sans-serif'], // For headlines
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.75' }],
        xl: ['1.25rem', { lineHeight: '1.75' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['2rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.5rem' }],
        '5xl': ['3.5rem', { lineHeight: '1' }],
        '6xl': ['4.5rem', { lineHeight: '1' }],
        '7xl': ['6rem', { lineHeight: '1' }],
        '8xl': ['8rem', { lineHeight: '1' }],
        '9xl': ['10rem', { lineHeight: '1' }],
      },
      letterSpacing: {
        tighter: '-0.06em',
        tight: '-0.04em',
        normal: '-0.01em',
        wide: '0.05em',
        wider: '0.1em',
        widest: '0.2em',
      },
      lineHeight: {
        none: '1',
        tight: '1.1',
        snug: '1.25',
        normal: '1.6',
        relaxed: '1.75',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px', // Keep full for circular elements if needed (avatars)
      },
      boxShadow: {
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
        none: 'none',
      },
      animation: {
        'underline-expand': 'underline-expand 0.15s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.25, 0, 0, 1) forwards',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        'underline-expand': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.25, 0, 0, 1)',
        'in-out': 'cubic-bezier(0.25, 0, 0, 1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      }
    },
  },
  plugins: [],
}
