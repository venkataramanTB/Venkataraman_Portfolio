/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#a78bfa',
        secondary: '#38bdf8',
        accent: '#fb923c',
        dark: '#0a0a0f',
        surface: '#11111b',
        border: '#1e1e2e',
      },
    },
  },
  plugins: [],
};
