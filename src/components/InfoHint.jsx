import { HelpCircle } from 'lucide-react';

// Phase 7c (UX-Umbau): kleine, wiederverwendbare Erklärung für Fachbegriffe,
// die externen Nutzern (nicht nur dem internen Team) nicht selbstverständlich
// sind — AfA, Sondertilgung, Zinsbindung, Miteigentumsanteil, WEG,
// Kappungsgrenze, Grunderwerbsteuer etc.
//
// Bewusst als natives <details>/<summary> statt als absolut positioniertes
// Popover gebaut: kein Risiko von Abschneiden/Überlappen an Bildschirmrändern
// oder Z-Index-Kollisionen, die sich in dieser Umgebung nicht visuell prüfen
// lassen. Der Erklärtext erscheint stattdessen im normalen Textfluss direkt
// unter dem Label, wenn man auf das "?"-Icon tippt/klickt — funktioniert
// identisch auf Mobile und Desktop, ganz ohne JS-State.
const InfoHint = ({ text, className = '' }) => (
  <details className={`inline-block align-middle ${className}`} onClick={(e) => e.stopPropagation()}>
    <summary
      className="inline-flex items-center cursor-pointer text-gray-400 hover:text-indigo-500 transition-colors list-none marker:content-none [&::-webkit-details-marker]:hidden"
      aria-label="Erklärung anzeigen"
    >
      <HelpCircle size={13} />
    </summary>
    <div className="mt-1 text-xs font-normal text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 leading-snug max-w-xs sm:max-w-sm">
      {text}
    </div>
  </details>
);

export default InfoHint;
