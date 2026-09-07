/**
 * Kontextuelle CTA direkt nach dem berechneten Ergebnis — genau der Moment
 * mit der höchsten Kaufbereitschaft. Bisher hatten die Rechner-Seiten nur
 * eine einzige CTA ganz am Seitenende, nach den Erklärtexten. Diese Karte
 * fängt den Nutzer ab, sobald er sein Ergebnis sieht.
 */
export default function ResultCTA({ text }) {
  return (
    <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-900 mb-0.5">Ergebnis dauerhaft tracken?</div>
        <p className="text-xs sm:text-sm text-slate-600">
          {text || 'Speichere diese Berechnung in renditly und sieh, wie sich Cashflow und Rendite über die Zeit entwickeln — automatisch aktualisiert.'}
        </p>
      </div>
      <a
        href="/app"
        className="flex-shrink-0 w-full sm:w-auto text-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
      >
        Kostenlos speichern →
      </a>
    </div>
  );
}
