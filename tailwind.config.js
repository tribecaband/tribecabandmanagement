/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tribeca': {
          'celeste': '#2DB2CA',
          'rojo': '#E58483',
          'naranja': '#BDB3A4',
          'amarillo': '#FAF9ED',
          'blanco': '#FFFFFF',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
