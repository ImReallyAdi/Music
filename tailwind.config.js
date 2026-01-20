/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--md-sys-color-background)',
        surface: 'var(--md-sys-color-surface)',
        'surface-variant': 'var(--md-sys-color-surface-variant)',
        'surface-container': 'var(--md-sys-color-surface-container)',
        'surface-container-high': 'var(--md-sys-color-surface-container-high)',
        'surface-container-highest': 'var(--md-sys-color-surface-container-highest)',
        'surface-container-low': 'var(--md-sys-color-surface-container-low)',
        'surface-container-lowest': 'var(--md-sys-color-surface-container-lowest)',
        primary: 'var(--md-sys-color-primary)',
        'primary-container': 'var(--md-sys-color-primary-container)',
        secondary: 'var(--md-sys-color-secondary)',
        'secondary-container': 'var(--md-sys-color-secondary-container)',
        tertiary: 'var(--md-sys-color-tertiary)',
        'tertiary-container': 'var(--md-sys-color-tertiary-container)',
        error: 'var(--md-sys-color-error)',
        'error-container': 'var(--md-sys-color-error-container)',
        outline: 'var(--md-sys-color-outline)',
        'outline-variant': 'var(--md-sys-color-outline-variant)',

        // On Colors
        'on-background': 'var(--md-sys-color-on-background)',
        'on-surface': 'var(--md-sys-color-on-surface)',
        'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
        'on-primary': 'var(--md-sys-color-on-primary)',
        'on-primary-container': 'var(--md-sys-color-on-primary-container)',
        'on-secondary': 'var(--md-sys-color-on-secondary)',
        'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
        'on-tertiary': 'var(--md-sys-color-on-tertiary)',
        'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',
        'on-error': 'var(--md-sys-color-on-error)',
        'on-error-container': 'var(--md-sys-color-on-error-container)',
      },
      fontFamily: {
        sans: ['"Roboto Flex"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // M3 Expressive Typography Scale
        // Display
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0px', fontWeight: '400' }],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0px', fontWeight: '400' }],

        // Headline
        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '400' }],

        // Title
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '400' }],
        'title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],

        // Label
        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],

        // Body
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
      },
      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '28px', // Extra Large
        '4xl': '56px',
        'full': '9999px',
      },
      boxShadow: {
        'elevation-1': 'none', // Replaced by surface tint
        'elevation-2': 'none',
        'elevation-3': 'none',
        'elevation-4': 'none',
        'elevation-5': 'none',
      },
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.2, 0.0, 0, 1.0)',
        'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'emphasized-accelerate': 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
        'standard': 'cubic-bezier(0.2, 0.0, 0, 1.0)',
        'standard-decelerate': 'cubic-bezier(0.0, 0.0, 0, 1.0)',
        'standard-accelerate': 'cubic-bezier(0.3, 0.0, 1.0, 1.0)',
      },
      transitionDuration: {
        'short1': '50ms',
        'short2': '100ms',
        'short3': '150ms',
        'short4': '200ms',
        'medium1': '250ms',
        'medium2': '300ms',
        'medium3': '350ms',
        'medium4': '400ms',
        'long1': '450ms',
        'long2': '500ms',
        'long3': '550ms',
        'long4': '600ms',
        'extra-long1': '700ms',
        'extra-long2': '800ms',
        'extra-long3': '900ms',
        'extra-long4': '1000ms',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite linear',
        'gradient': 'gradient 4s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
