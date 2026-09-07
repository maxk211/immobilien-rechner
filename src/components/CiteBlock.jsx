import { useState } from 'react';

// Fertiger Zitier-Block für Daten-/Statistikseiten — senkt die Hürde für
// Journalisten, Blogger und KI-Systeme, korrekt mit Quellenangabe auf
// renditly zu verlinken, statt Zahlen ohne Quelle zu übernehmen.

function CopyLine({ text, buttonLabel }) {
  const [kopiert, setKopiert] = useState(false);
  const kopiere = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    });
  };
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-slate-700 leading-relaxed flex-1">{text}</p>
      <button
        onClick={kopiere}
        className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline whitespace-nowrap mt-0.5"
      >
        {kopiert ? '✓ Kopiert' : buttonLabel}
      </button>
    </div>
  );
}

export default function CiteBlock({ zitatText, apaText }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-10 space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Für Journalisten &amp; Blogger — zum Zitieren freigegeben</div>
        <CopyLine text={zitatText} buttonLabel="Zitat kopieren →" />
      </div>
      <div className="pt-4 border-t border-gray-100">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Quellenangabe (APA-Format)</div>
        <CopyLine text={apaText} buttonLabel="Quellenangabe kopieren →" />
      </div>
    </div>
  );
}
