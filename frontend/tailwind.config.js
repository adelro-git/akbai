/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* --- MD3 Surface tokens (theme-aware via CSS variables) --- */
        surface: 'hsl(var(--surface))',
        'surface-dim': 'hsl(var(--surface-dim))',
        'surface-bright': 'hsl(var(--surface-bright))',
        'surface-container-lowest': 'hsl(var(--surface-container-lowest))',
        'surface-container-low': 'hsl(var(--surface-container-low))',
        'surface-container': 'hsl(var(--surface-container))',
        'surface-container-high': 'hsl(var(--surface-container-high))',
        'surface-container-highest': 'hsl(var(--surface-container-highest))',
        'on-surface': 'hsl(var(--on-surface))',
        'on-surface-variant': 'hsl(var(--on-surface-variant))',
        'surface-tint': 'hsl(var(--surface-tint))',

        /* --- MD3 Outline tokens --- */
        outline: 'hsl(var(--outline))',
        'outline-variant': 'hsl(var(--outline-variant))',

        /* --- MD3 Primary tokens --- */
        'primary-container': 'hsl(var(--primary-container))',
        'on-primary': 'hsl(var(--on-primary))',
        'on-primary-container': 'hsl(var(--on-primary-container))',
        'primary-fixed': 'hsl(var(--primary-fixed))',
        'primary-fixed-dim': 'hsl(var(--primary-fixed-dim))',
        'inverse-primary': 'hsl(var(--inverse-primary))',

        /* --- MD3 Secondary tokens --- */
        'secondary-container': 'hsl(var(--secondary-container))',
        'on-secondary': 'hsl(var(--on-secondary))',
        'on-secondary-container': 'hsl(var(--on-secondary-container))',

        /* --- MD3 Tertiary tokens --- */
        tertiary: 'hsl(var(--tertiary))',
        'tertiary-container': 'hsl(var(--tertiary-container))',
        'on-tertiary': 'hsl(var(--on-tertiary))',
        'on-tertiary-container': 'hsl(var(--on-tertiary-container))',

        /* --- MD3 Error tokens --- */
        'error-container': 'hsl(var(--error-container))',
        'on-error-container': 'hsl(var(--on-error-container))',

        /* --- MD3 Inverse tokens --- */
        'inverse-surface': 'hsl(var(--inverse-surface))',
        'inverse-on-surface': 'hsl(var(--inverse-on-surface))',

        /* --- Backward-compat aliases (old → new, remove later) --- */
        ink: 'hsl(var(--background))',
        'kai-card': 'hsl(var(--surface-container))',
        'kai-card-alt': 'hsl(var(--surface-container-high))',
        honey: {
          DEFAULT: 'hsl(var(--primary-container))',
          deep: 'hsl(var(--primary))',
        },
        teal: 'hsl(var(--tertiary))',
        'user-bubble': 'hsl(var(--secondary-container))',

        /* --- Shadcn/UI compatibility tokens --- */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        /* Amber ambient shadows — no grey shadows allowed */
        'ambient': '0 20px 40px -5px hsl(var(--primary) / 0.08)',
        'ambient-lg': '0 30px 60px -5px hsl(var(--primary) / 0.08)',
        'ambient-nav': '0 -10px 40px -5px hsl(var(--primary) / 0.06)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
