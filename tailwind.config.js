import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./resources/js/Pages/**/*.tsx'],
  theme: {
    extend: {
      fontFamily :{
        'sans': ['Roboto', ...defaultTheme.fontFamily.sans],
      }
    },
  },
  plugins: [],
}

