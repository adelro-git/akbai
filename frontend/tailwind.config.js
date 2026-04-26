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
      screens: {
        /* Phase 3 — custom 860px breakpoint for action-grid 4-col on tablets (per Q13) */
        tablet: '860px',
      },
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
          DEFAULT: 'hsl(var(--honey))',
          bright: 'hsl(var(--honey-bright))',
          pale: 'hsl(var(--honey-pale))',
          deep: 'hsl(var(--honey-deep))',
          cream: 'hsl(var(--honey-cream))',
        },
        sage: {
          DEFAULT: 'hsl(var(--sage))',
          deep: 'hsl(var(--sage-deep))',
          pale: 'hsl(var(--sage-pale))',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          soft: 'hsl(var(--ink-soft))',
          faint: 'hsl(var(--ink-faint))',
        },
        'outline-soft': 'hsl(var(--outline-soft))',
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
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      boxShadow: {
        /* Amber ambient shadows — no grey shadows allowed */
        'ambient': '0 20px 40px -5px hsl(var(--primary) / 0.08)',
        'ambient-lg': '0 30px 60px -5px hsl(var(--primary) / 0.08)',
        'ambient-nav': '0 -10px 40px -5px hsl(var(--primary) / 0.06)',
      },
      keyframes: {
        'slide-up': {
          /* drawer/sheet slide (legacy preserved) */
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-up-soft': {
          /* Phase 3 redesign — card/section entry (B6 approved) */
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          from: { transform: 'scale(0.94)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'kai-bob': {
          '0%, 100%': { transform: 'translateY(-3px)' },
          '50%': { transform: 'translateY(3px)' },
        },
        'kai-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'pandesal-squish': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
        },
        'petal-drift': {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        'typing-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        'gentle-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-1.2deg)' },
          '50%': { transform: 'rotate(1.2deg)' },
        },
        'flame-flicker': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.18)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        /* legacy drawer/sheet — keep */
        'slide-up': 'slide-up 0.3s ease-out',
        /* Phase 3 redesign animation library (B6 approved) — production CSS gates each on prefers-reduced-motion */
        'slide-up-soft': 'slide-up-soft 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 300ms ease-out both',
        'pop-in': 'pop-in 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'kai-bob': 'kai-bob 3s ease-in-out infinite',
        'kai-breathe': 'kai-breathe 4s ease-in-out infinite',
        'pandesal-squish': 'pandesal-squish 120ms cubic-bezier(0.4, 0, 0.6, 1)',
        'petal-drift': 'petal-drift 16s linear infinite',
        'typing-bounce': 'typing-bounce 1.2s ease-in-out infinite',
        'gentle-float': 'gentle-float 4s ease-in-out infinite',
        wobble: 'wobble 5s ease-in-out infinite',
        'flame-flicker': 'flame-flicker 1.6s ease-in-out infinite',
        'check-pop': 'check-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'bounce-in': 'bounce-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
