/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Warme Palette für die App-Oberfläche (renditly "Warm & einladend"
      // Redesign). Marketing-/SEO-Seiten nutzen weiterhin die Standard-
      // Tailwind-Farben (slate/indigo/emerald etc.) und bleiben unverändert —
      // diese Töne werden bewusst nur innerhalb von .font-app (App.jsx-Shell)
      // eingesetzt, damit die öffentlichen Seiten unangetastet bleiben.
      colors: {
        cream: {
          50: '#FBF7F1',
          100: '#F5EDE1',
          200: '#EAE0D0',
          300: '#DDCEB8',
          400: '#C2AF95',
          500: '#A08D73',
          600: '#7D6B52',
          700: '#5C4F3D',
          800: '#3E362A',
          900: '#2A2319',
        },
        clay: {
          50: '#FCF1E8',
          100: '#F8DFC8',
          200: '#F0C094',
          300: '#E49A5E',
          400: '#D57C3D',
          500: '#B5652E',
          600: '#965022',
          700: '#78401B',
          800: '#5C3013',
          900: '#40210D',
        },
        sage: {
          50: '#F2F5ED',
          100: '#E1EAD3',
          200: '#C3D7A9',
          300: '#9EBE77',
          400: '#7DA254',
          500: '#5E8339',
          600: '#4A6A2B',
          700: '#395320',
          800: '#293C17',
          900: '#1B280F',
        },
        brick: {
          50: '#FCF0EE',
          100: '#F8DAD3',
          200: '#F0B4A6',
          300: '#E28870',
          400: '#CC6249',
          500: '#AD4632',
          600: '#8A3627',
          700: '#6B2A1E',
          800: '#4E1F16',
          900: '#35150F',
        },
        honey: {
          50: '#FCF3E3',
          100: '#F8E2B8',
          200: '#F0C577',
          300: '#E4A43D',
          400: '#C1832E',
          500: '#A06A21',
          600: '#7D5219',
          700: '#5E3E13',
          800: '#422B0D',
          900: '#2B1B08',
        },
      },
      fontFamily: {
        app: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
