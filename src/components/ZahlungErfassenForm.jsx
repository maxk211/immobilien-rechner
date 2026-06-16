import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';

const ZahlungErfassenForm = ({ monatKey, forderungBetrag, onSave, mieterListe = [] }) => {
  const [betrag, setBetrag] = useState(forderungBetrag);
  const [datum, setDatum] = useState(() => {
    const heute = new Date();
    return heute.toISOString().split('T')[0];
  });
  const [notiz, setNotiz] = useState('');
  const [mieterId, setMieterId] = useState('');

  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 p-3 mt-2">
      <p className="text-xs font-semibold text-blue-700 mb-2">💰 Zahlung erfassen</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Betrag eingegangen</label>
          <div className="flex items-center gap-1">
            <input type="number" value={betrag} onChange={e => setBetrag(parseFloat(e.target.value)||0)}
              className="w-full px-2 py-1.5 border-2 border-blue-300 rounded text-sm text-right font-bold" />
            <span className="text-xs text-gray-400">€</span>
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Datum Eingang</label>
          <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
        {mieterListe.length > 0 && (
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">👤 Mieter (optional)</label>
            <select value={mieterId} onChange={e => setMieterId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white">
              <option value="">— Mieter wählen —</option>
              {mieterListe.map(m => (
                <option key={m.id} value={m.id}>{m.name}{m.zimmer_bezeichnung ? ` (${m.zimmer_bezeichnung})` : ''}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Notiz (optional)</label>
          <input type="text" value={notiz} onChange={e => setNotiz(e.target.value)} placeholder="z.B. verspätet"
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        {betrag !== forderungBetrag && (
          <span className={`text-xs font-semibold ${betrag > forderungBetrag ? 'text-emerald-600' : 'text-amber-600'}`}>
            {betrag > forderungBetrag ? `+${formatCurrency(betrag-forderungBetrag)} Überzahlung` : `${formatCurrency(betrag-forderungBetrag)} Differenz zur Forderung`}
          </span>
        )}
        <button onClick={() => onSave({ datum, betrag, notiz, typ: 'kaltmiete', mieterId: mieterId || undefined })}
          className="ml-auto px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700">
          Zahlung buchen
        </button>
      </div>
    </div>
  );
};




export default ZahlungErfassenForm;
