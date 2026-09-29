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
      // UX-Paket (Teil 1–3): violette Akzentfarbe nur in der eingeloggten App.
      // "indigo" läuft über CSS-Variablen: Standard = Tailwind-Indigo (Marketing-
      // Seiten bleiben unverändert), innerhalb von .font-app das neue Violett.
      colors: {
        indigo: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
            .map(k => [k, `rgb(var(--c-indigo-${k}) / <alpha-value>)`])
        ),
        ink: '#14161c',      // dunkler Kopf
        canvas: '#f0f1f5',   // Seitenhintergrund der App
      },
      fontFamily: {
        app: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
