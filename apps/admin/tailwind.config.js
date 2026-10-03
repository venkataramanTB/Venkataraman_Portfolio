/** @type {import('tailwindcss').Config} */

// Colours resolve through CSS variables so every utility class follows the
// active substrate (light paper / dark terminal). The `<alpha-value>`
// placeholder keeps modifiers like `bg-ink/5` working.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: v('--paper-rgb'),
          sunk: v('--paper-sunk-rgb'),
          ink: v('--paper-ink-rgb'),
        },
        ink: {
          DEFAULT: v('--ink-rgb'),
          2: v('--ink-2-rgb'),
          3: v('--ink-3-rgb'),
          4: v('--ink-4-rgb'),
        },
        hazard: {
          DEFAULT: v('--hazard-rgb'),
          ink: v('--hazard-rgb'),
        },

        // Legacy aliases kept so any stray class still resolves to the system.
        // There is exactly one accent: hazard red.
        primary: v('--hazard-rgb'),
        secondary: v('--ink-rgb'),
        accent: v('--hazard-rgb'),
        dark: v('--paper-rgb'),
        surface: v('--paper-sunk-rgb'),
        border: 'rgb(var(--ink-rgb) / 0.16)',
      },
      fontFamily: {
        display: ['Archivo', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        sans: ['Archivo', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        none: '0',
        DEFAULT: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        mech: 'cubic-bezier(0.83, 0, 0.17, 1)',
      },
    },
  },
  plugins: [],
};
