/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // App-Schriftart (nur für die eingeloggte App-Oberfläche via .font-app
      // genutzt, Marketing-Seiten behalten ihren bisherigen Systemfont-Stack).
      fontFamily: {
        app: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
