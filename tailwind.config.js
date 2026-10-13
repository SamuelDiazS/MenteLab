const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        panel: v('panel'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        brand: v('brand'),
        good: v('good'),
        bad: v('bad'),
        warn: v('warn'),
        c: {
          lectura: v('c-lectura'),
          logica: v('c-logica'),
          matematicas: v('c-matematicas'),
          ciencias: v('c-ciencias'),
          sociales: v('c-sociales'),
          ingles: v('c-ingles'),
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Figtree Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 1px 0 rgb(var(--ink) / 0.06) inset, 0 14px 30px -18px rgb(0 0 0 / 0.55)',
      },
    },
  },
  plugins: [],
};
