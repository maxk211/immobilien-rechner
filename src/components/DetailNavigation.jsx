import { ChevronLeft } from 'lucide-react';

// Optik aus den UX-Mockups (Teil 1): Haupt-Reiter als Text mit violetter
// Unterstreichung, Unter-Reiter als Pills (aktiv schwarz, sonst umrandet).
// Gemeinsam für Kaufimmobilie, Mehrfamilienhaus und Mietimmobilie.
export function DetailNavigation({ gruppen, aktiveGruppeId, activeTab, onSelect, leerHinweise = {} }) {
  const aktiv = gruppen.find(g => g.id === aktiveGruppeId) || gruppen[0];
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex gap-5 sm:gap-8 px-4 sm:px-6 overflow-x-auto">
        {gruppen.map(g => (
          <button key={g.id} onClick={() => onSelect(g.first)}
            className={`py-3 text-sm sm:text-[15px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              aktiv.id === g.id ? 'text-gray-900 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-800'
            }`}>
            {g.label}
          </button>
        ))}
      </div>
      {aktiv.subs && (
        <div className="flex gap-2 px-4 sm:px-6 py-3 border-t border-gray-100 overflow-x-auto">
          {aktiv.subs.map(s => {
            const leer = leerHinweise[s.id];
            return (
              <button key={s.id} onClick={() => onSelect(s.id)} title={leer || undefined}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === s.id
                    ? 'bg-gray-900 text-white border border-gray-900'
                    : leer
                      ? 'bg-white text-gray-400 border border-gray-200 hover:text-gray-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-500'
                }`}>
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Zurück-Pfeil oben links: führt immer aufs Cockpit, nie einen Schritt in die Tiefe.
export function ZurueckZumCockpit({ sichtbar, onClick }) {
  if (!sichtbar) return null;
  return (
    <button onClick={onClick} title="Zurück zum Cockpit"
      className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-colors">
      <ChevronLeft size={18}/>
    </button>
  );
}

// Kompakte Kennzahlen-Zeile für Unterseiten (Cockpit zeigt die große Leiste).
export function KennzahlenZeile({ eintraege }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 sm:px-6 py-2 bg-white border-b border-gray-200 text-sm">
      {eintraege.map(([label, wert, farbe]) => (
        <span key={label} className="text-gray-500">{label} <strong className={farbe || 'text-gray-900'}>{wert}</strong></span>
      ))}
    </div>
  );
}
