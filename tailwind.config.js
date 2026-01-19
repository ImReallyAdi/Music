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
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        // M3 Expressive Typography Scale - Modified for Boldness
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '900' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0px', fontWeight: '800' }],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0px', fontWeight: '800' }],

        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '800' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0px', fontWeight: '700' }],
        'headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '700' }],

        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '600' }],
        'title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '600' }],
        'title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '600' }],

        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '600' }],
        'label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '600' }],
        'label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '600' }],

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
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '56px',
        '5xl': '80px',
        'full': '9999px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'elevation-1': '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
        'elevation-3': '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px 0px rgba(0,0,0,0.3)',
        'elevation-4': '0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px 0px rgba(0,0,0,0.3)',
        'elevation-5': '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px 0px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
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
