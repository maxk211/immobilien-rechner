import { CheckCircle2 } from 'lucide-react';

// "Jetzt dran" im Objekt-Cockpit (UX-Paket Teil 1): je Zeile die passende
// Handlung statt eines generischen "Ansehen".
//   Miete offen          → Eingegangen (bucht direkt) + Mahnen (Zahlungserinnerung PDF)
//   Mieterhöhung         → Durchrechnen (öffnet den Mieterhöhungs-Rechner)
//   Zinsbindung / Lücke  → Anschluss planen (Finanzierung)
//   NK-Abrechnung fehlt  → Erstellen (Nebenkosten)
//   Kaution              → Eintragen (Mieter)
// Fehlt ein Handler (z. B. MFH ohne Einzel-Buchung), fällt die Zeile auf "Öffnen" zurück.
export function aktionenFuer(aufgabe, h) {
  const id = aufgabe.id || '';
  const oeffnen = (label = 'Öffnen', primaer = false) => ({ label, primaer, onClick: () => h.onOeffnen(aufgabe.targetTab) });
  if (id.startsWith('miete-ausstehend')) {
    const a = [];
    if (h.onEingegangen) a.push({ label: 'Eingegangen', primaer: true, onClick: () => h.onEingegangen(aufgabe) });
    if (h.onMahnen) a.push({ label: 'Mahnen', onClick: () => h.onMahnen(aufgabe) });
    return a.length ? a : [oeffnen('Miete buchen', true)];
  }
  if (id.startsWith('mieterhoehung')) {
    return [h.onDurchrechnen
      ? { label: 'Durchrechnen', primaer: true, onClick: () => h.onDurchrechnen(aufgabe) }
      : oeffnen('Durchrechnen', true)];
  }
  if (id.startsWith('zinsbindung') || id.startsWith('finanzierung')) return [oeffnen('Anschluss planen', true)];
  if (id.startsWith('nk-abrechnung')) return [oeffnen('Erstellen', true)];
  if (id.startsWith('kaution')) return [oeffnen('Eintragen', true)];
  if (id.startsWith('regel15')) return [oeffnen('Prüfen')];
  return [oeffnen()];
}

export default function JetztDran({ aufgaben, handler, zusatz = null }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Jetzt dran</p>
        {aufgaben.length > 0 && <span className="text-xs font-semibold text-gray-400">{aufgaben.length} offen</span>}
      </div>
      {aufgaben.length === 0 && !zusatz ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0"/>
          <span className="text-sm font-semibold text-emerald-700">Alles im grünen Bereich — keine offenen Punkte</span>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {zusatz}
          {aufgaben.map(aufgabe => (
            <div key={aufgabe.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                aufgabe.priority === 'rot' ? 'bg-red-500' : aufgabe.priority === 'gelb' ? 'bg-amber-400' : 'bg-gray-400'
              }`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-800 truncate">{aufgabe.titel}</div>
                {aufgabe.sub && <div className="text-xs text-gray-400 truncate">{aufgabe.sub}</div>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {aktionenFuer(aufgabe, handler).map(a => (
                  <button key={a.label} onClick={a.onClick}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      a.primaer
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700'
                    }`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
