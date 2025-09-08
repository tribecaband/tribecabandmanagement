/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2DB2CA', // Celeste principal
          50: '#E8F8FB',
          100: '#D1F1F7',
          200: '#A3E3EF',
          300: '#75D5E7',
          400: '#47C7DF',
          500: '#2DB2CA',
          600: '#248FA2',
          700: '#1B6B79',
          800: '#124851',
          900: '#092428'
        },
        secondary: {
          DEFAULT: '#BDB3A4', // Naranja apagado
          50: '#F7F5F2',
          100: '#EFEBE5',
          200: '#DFD7CB',
          300: '#CFC3B1',
          400: '#BFB097',
          500: '#BDB3A4',
          600: '#A89C83',
          700: '#8A7D62',
          800: '#6C5E41',
          900: '#4E3F20'
        },
        alert: {
          DEFAULT: '#E58483', // Rojo pastel
          50: '#FDF5F5',
          100: '#FBEBEB',
          200: '#F7D7D7',
          300: '#F3C3C3',
          400: '#EFAFAF',
          500: '#E58483',
          600: '#D85A58',
          700: '#CB302D',
          800: '#A02622',
          900: '#751C1A'
        },
        background: {
          DEFAULT: '#FAF9ED', // Amarillo claro
          50: '#FEFEFE',
          100: '#FDFDFD',
          200: '#FCFBFB',
          300: '#FAF9ED',
          400: '#F8F7E1',
          500: '#F6F5D5',
          600: '#F4F3C9',
          700: '#F2F1BD',
          800: '#F0EFB1',
          900: '#EEEDA5'
        },
        contrast: '#FFFFFF' // Blanco
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
