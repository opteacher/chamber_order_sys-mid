/** @type {import('tailwindcss').Config} */
const base = require('./lib/frontend-library/tailwind.config')
export default {
  corePlugins: {
    preflight: false
  },
  important: true,
  content: [
    './index.html',
    './lib/frontend-library/src/**/*.{vue,js,ts,jsx,tsx}',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      textColor: theme => ({
        ...base.theme.textColor(theme)
      }),
      backgroundColor: theme => ({
        ...base.theme.backgroundColor(theme)
      }),
      borderColor: theme => ({
        ...base.theme.borderColor(theme)
      })
    },
  },
  plugins: [],
}

