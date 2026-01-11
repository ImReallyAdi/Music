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
        'elevation-1': '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
        'elevation-3': '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px 0px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}
