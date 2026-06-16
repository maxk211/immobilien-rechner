import { useState } from 'react';

const MieterAuszug = ({ mieter, onSave, onClose }) => {
  const [form, setForm] = useState({
    ...mieter,
    auszugsdatum: mieter.auszugsdatum || new Date().toISOString().split('T')[0],
    zaehlerstandStrom: mieter.zaehlerstand_strom || '',
    zaehlerstandWasser: mieter.zaehlerstand_wasser || '',
    zaehlerstandHeizung: mieter.zaehlerstand_heizung || '',
    schlusselZurueck: mieter.schluessel_zurueck || false,
    zustandNotizen: mieter.zustand_notizen || '',
    kautionAbzug: mieter.kaution_abzug || 0,
    kautionAbzugGrund: mieter.kaution_abzug_grund || '',
    kautionZurueck: mieter.kaution_zurueck || false,
    kautionZurueckAm: mieter.kaution_zurueck_am || '',
    aktiv: false,
  });
  const [saving, setSaving] = useState(false);

  const kautionRueckzahlung = Math.max(0, (Number(mieter.kaution_betrag) || 0) - (Number(form.kautionAbzug) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-700 text-white p-5 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">🚪 Auszug: {mieter.name}</h2>
            <p className="text-red-200 text-sm">Mieter als ausgezogen markieren</p>
          </div>
          <button onClick={onClose} className="text-white text-2xl hover:text-red-200">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Auszugsdatum *</label>
            <input type="date" value={form.auszugsdatum} onChange={e => setForm({...form, auszugsdatum: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required />
          </div>

          {/* Übergabeprotokoll */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">📋 Übergabeprotokoll</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">⚡ Strom</label>
                <input type="number" value={form.zaehlerstandStrom} onChange={e => setForm({...form, zaehlerstandStrom: e.target.value})}
                  placeholder="kWh" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">💧 Wasser</label>
                <input type="number" value={form.zaehlerstandWasser} onChange={e => setForm({...form, zaehlerstandWasser: e.target.value})}
                  placeholder="m³" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">🔥 Heizung</label>
                <input type="number" value={form.zaehlerstandHeizung} onChange={e => setForm({...form, zaehlerstandHeizung: e.target.value})}
                  placeholder="kWh" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={form.schlusselZurueck} onChange={e => setForm({...form, schlusselZurueck: e.target.checked})}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-gray-700">🔑 Schlüssel zurückgegeben</span>
            </label>
            <textarea value={form.zustandNotizen} onChange={e => setForm({...form, zustandNotizen: e.target.value})}
              rows={3} placeholder="Zustand der Wohnung, Schäden, Besonderheiten..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" />
          </div>

          {/* Kaution */}
          {mieter.kaution_betrag > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-3">🔑 Kautionsrückzahlung</p>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Kaution gesamt:</span>
                <span className="font-semibold">{Number(mieter.kaution_betrag).toLocaleString('de-DE')} €</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Abzüge (€)</label>
                  <input type="number" value={form.kautionAbzug} onChange={e => setForm({...form, kautionAbzug: parseFloat(e.target.value) || 0})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500" min="0" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Grund der Abzüge</label>
                  <input type="text" value={form.kautionAbzugGrund} onChange={e => setForm({...form, kautionAbzugGrund: e.target.value})}
                    placeholder="z.B. Schäden" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500" />
                </div>
              </div>
              <div className={`flex justify-between text-sm font-bold mb-3 p-2 rounded ${kautionRueckzahlung > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                <span>Rückzahlung:</span>
                <span>{kautionRueckzahlung.toLocaleString('de-DE')} €</span>
              </div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={form.kautionZurueck} onChange={e => setForm({...form, kautionZurueck: e.target.checked})}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">Kaution bereits zurückgezahlt</span>
              </label>
              {form.kautionZurueck && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Zurückgezahlt am</label>
                  <input type="date" value={form.kautionZurueckAm} onChange={e => setForm({...form, kautionZurueckAm: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500" />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50">
              {saving ? 'Speichern...' : '✓ Auszug bestätigen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MieterAuszug;
