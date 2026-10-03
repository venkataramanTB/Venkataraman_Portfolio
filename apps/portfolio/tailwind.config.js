/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f4f4f0',
          sunk: '#eae8e3',
          ink: '#e2e0da',
        },
        ink: {
          DEFAULT: '#0a0a0a',
          2: '#35352f',
          3: '#6e6e67',
          4: '#9b9b93',
        },
        hazard: {
          DEFAULT: '#e61919',
          ink: '#b31313',
        },
        rule: 'rgba(10,10,10,0.16)',
      },
      fontFamily: {
        display: ['Archivo', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Archivo', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        DEFAULT: '0',
      },
      maxWidth: {
        shell: '1440px',
      },
      zIndex: {
        base: '0',
        raised: '10',
        nav: '20',
        overlay: '30',
        modal: '40',
        grain: '50',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        mech: 'cubic-bezier(0.83, 0, 0.17, 1)',
      },
    },
  },
  plugins: [],
};
