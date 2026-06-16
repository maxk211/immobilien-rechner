import { useState } from 'react';
import { showConfirm } from '../utils/confirm.jsx';
import NKAbrechnungFormular, { berechneMieteranteil } from './NKAbrechnungFormular';
import NKAbrechnungDetail from './NKAbrechnungDetail';

const NKAbrechnungListe = ({ mieter, nkAbrechnungen, portfolio, onSave, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editAbrechnung, setEditAbrechnung] = useState(null);
  const [viewAbrechnung, setViewAbrechnung] = useState(null);

  const meinAbrechnungen = nkAbrechnungen.filter(a => a.mieter_id === mieter.id)
    .sort((a, b) => b.abrechnungsjahr - a.abrechnungsjahr);

  const statusColor = {
    entwurf: 'bg-yellow-100 text-yellow-700',
    versendet: 'bg-blue-100 text-blue-700',
    abgeschlossen: 'bg-green-100 text-green-700'
  };
  const statusLabel = { entwurf: 'Entwurf', versendet: 'Versendet', abgeschlossen: 'Abgeschlossen' };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold text-gray-700">📄 NK-Abrechnungen</p>
        <button onClick={() => { setEditAbrechnung(null); setShowForm(true); }}
          className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200">
          + Neue Abrechnung
        </button>
      </div>

      {meinAbrechnungen.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Noch keine NK-Abrechnungen für diesen Mieter.</p>
      ) : (
        <div className="space-y-2">
          {meinAbrechnungen.map(a => {
            const mf = Number(a.mieterflaeche) || 0;
            const gf = Number(a.gesamtflaeche) || 0;
            const ap = Number(a.anzahl_parteien) || 1;
            const positionen = a.kostenpositionen || [];
            const gesamt = positionen.reduce((s, p) => s + berechneMieteranteil(p, mf, gf, ap), 0);
            const ergebnis = gesamt - (Number(a.vorauszahlungen_gesamt) || 0);
            return (
              <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">{a.abrechnungsjahr}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[a.status] || 'bg-gray-100'}`}>
                    {statusLabel[a.status] || a.status}
                  </span>
                  <span className={`text-xs font-semibold ${ergebnis > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {ergebnis > 0 ? `+${Math.abs(ergebnis).toLocaleString('de-DE', {maximumFractionDigits:0})} € NK` : `-${Math.abs(ergebnis).toLocaleString('de-DE', {maximumFractionDigits:0})} € Gut.`}
                  </span>
                </div>
                <button onClick={() => setViewAbrechnung(a)}
                  className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded hover:bg-teal-100">
                  Ansehen
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <NKAbrechnungFormular
          mieter={mieter}
          portfolio={portfolio}
          existingAbrechnung={editAbrechnung}
          onSave={async (data) => { await onSave(data); setShowForm(false); setEditAbrechnung(null); }}
          onClose={() => { setShowForm(false); setEditAbrechnung(null); }}
        />
      )}

      {viewAbrechnung && (
        <NKAbrechnungDetail
          abrechnung={viewAbrechnung}
          onEdit={() => { setEditAbrechnung(viewAbrechnung); setViewAbrechnung(null); setShowForm(true); }}
          onDelete={async () => {
            if (!(await showConfirm('Abrechnung wirklich löschen?'))) return;
            await onDelete(viewAbrechnung.id);
            setViewAbrechnung(null);
          }}
          onClose={() => setViewAbrechnung(null)}
        />
      )}
    </div>
  );
};

export default NKAbrechnungListe;
