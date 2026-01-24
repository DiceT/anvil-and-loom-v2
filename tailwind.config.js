/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy Overrides (To be migrated)
        slate: {
          850: '#1a202e',
          900: '#0f1419',
          950: '#0a0d14',
        },

        // PALETTE PHILOSOPHY
        // Canvas
        canvas: {
          DEFAULT: 'var(--bg-app)',
          surface: 'var(--bg-surface)',
          panel: 'var(--bg-panel)',
        },
        border: {
          DEFAULT: 'var(--border-app)',
        },
        // Typography
        type: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },

        // Palette Names
        gold: 'var(--color-gold)',
        ruby: 'var(--color-ruby)',
        emerald: 'var(--color-emerald)',
        sapphire: 'var(--color-sapphire)',
        amethyst: 'var(--color-amethyst)',
        copper: 'var(--color-copper)',
        jade: 'var(--color-jade)',
        ivory: 'var(--color-ivory)',

        // Functional Pillars
        dice: 'var(--color-gold)',
        ai: 'var(--color-ruby)',
        weave: 'var(--color-amethyst)',
        clock: 'var(--color-copper)',
        user: 'var(--color-ivory)',
        system: 'var(--color-sapphire)',

        // Status
        success: 'var(--state-success)',
        warning: 'var(--state-warning)',
        error: 'var(--state-error)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
