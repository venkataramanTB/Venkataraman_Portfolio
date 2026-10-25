/** @type {import('tailwindcss').Config} */

// Colours resolve through CSS variables so every utility class follows the
// active substrate. The `<alpha-value>` placeholder keeps modifiers like
// `bg-ink/5` working.
//
// The `paper` / `ink` names are kept as aliases after the Aperture redesign:
// they are threaded through a few hundred utility classes in the dashboard
// markup, and repointing the variables is a smaller, safer change than
// renaming every class. `paper` is the substrate, `ink` the text ramp.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: v('--bg-rgb'),
          sunk: v('--bg-sunk-rgb'),
          ink: v('--bg-raised-rgb'),
        },
        ink: {
          DEFAULT: v('--text-rgb'),
          2: v('--text-2-rgb'),
          3: v('--text-3-rgb'),
          4: v('--text-4-rgb'),
        },

        // One chromatic accent, for focus, links and live status only.
        primary: v('--accent-rgb'),
        accent: v('--accent-rgb'),

        // Semantic status.
        live: v('--live-rgb'),
        warn: v('--warn-rgb'),
        bad: v('--bad-rgb'),

        // `hazard` was the old single accent. Mapped to the destructive
        // colour, which is the only role it still plays in this console.
        hazard: {
          DEFAULT: v('--bad-rgb'),
          ink: v('--bad-rgb'),
        },

        secondary: v('--text-rgb'),
        dark: v('--bg-rgb'),
        surface: v('--bg-sunk-rgb'),
        border: 'rgb(var(--text-rgb) / 0.1)',
      },
      fontFamily: {
        // Platform face first; Inter is the fallback off Apple hardware.
        display: ['ui-sans-serif', '-apple-system', 'SF Pro Display', 'Inter', 'Segoe UI', 'sans-serif'],
        sans: ['ui-sans-serif', '-apple-system', 'SF Pro Text', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      // Radii are continuous with surface size — the same scale the public
      // site uses, so the two apps read as one product.
      borderRadius: {
        none: '0',
        DEFAULT: '11px',
        sm: '7px',
        md: '11px',
        lg: '16px',
        xl: '22px',
        '2xl': '30px',
        '3xl': '38px',
        full: '999px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
        mech: 'cubic-bezier(0.7, 0, 0.84, 0)',
      },
    },
  },
  plugins: [],
};
