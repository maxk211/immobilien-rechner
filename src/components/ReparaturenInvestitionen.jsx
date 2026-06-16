import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format.js';

const ReparaturenInvestitionen = ({ immobilie, onUpdate }) => {
  const [investitionen, setInvestitionen] = useState(immobilie.investitionen || []);
  const [showForm, setShowForm] = useState(false);
  const [neueInvestition, setNeueInvestition] = useState({
    datum: new Date().toISOString().split('T')[0],
    beschreibung: '',
    betrag: '',
    kategorie: 'erhaltung'
  });

  const kategorien = {
    'erhaltung': { label: 'Erhaltungsaufwand', color: 'orange', icon: '🔧', steuer: 'sofort', hint: 'Sofort absetzbar im Zahlungsjahr' },
    'herstellung': { label: 'Herstellungskosten', color: 'blue', icon: '🏠', steuer: 'afa', hint: 'Erhöht AfA-Bemessungsgrundlage' },
    'anschaffung': { label: 'Anschaffungsnebenk.', color: 'purple', icon: '📋', steuer: 'afa', hint: 'Erhöht AfA-Bemessungsgrundlage' },
    'modernisierung': { label: 'Modernisierung', color: 'green', icon: '🌱', steuer: 'afa', hint: 'Wird über AfA abgeschrieben' },
    'nicht_relevant': { label: 'Nicht steuerlich', color: 'gray', icon: '📦', steuer: 'keine', hint: 'Keine Steuerwirkung' }
  };

  const handleAdd = () => {
    if (!neueInvestition.beschreibung || !neueInvestition.betrag) return;

    const updated = [...investitionen, {
      id: Date.now(),
      ...neueInvestition,
      betrag: parseFloat(neueInvestition.betrag)
    }];
    setInvestitionen(updated);
    onUpdate({ ...immobilie, investitionen: updated });
    setNeueInvestition({
      datum: new Date().toISOString().split('T')[0],
      beschreibung: '',
      betrag: '',
      kategorie: 'erhaltung'
    });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const updated = investitionen.filter(i => i.id !== id);
    setInvestitionen(updated);
    onUpdate({ ...immobilie, investitionen: updated });
  };

  const gesamtNachKategorie = useMemo(() => {
    const summen = {};
    investitionen.forEach(inv => {
      summen[inv.kategorie] = (summen[inv.kategorie] || 0) + inv.betrag;
    });
    return summen;
  }, [investitionen]);

  const gesamtInvestitionen = investitionen.reduce((sum, inv) => sum + inv.betrag, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">🔧 Reparaturen & Investitionen</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Datum</label>
              <input
                type="date"
                value={neueInvestition.datum}
                onChange={(e) => setNeueInvestition({...neueInvestition, datum: e.target.value})}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kategorie</label>
              <select
                value={neueInvestition.kategorie}
                onChange={(e) => setNeueInvestition({...neueInvestition, kategorie: e.target.value})}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                {Object.entries(kategorien).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Beschreibung</label>
            <input
              type="text"
              value={neueInvestition.beschreibung}
              onChange={(e) => setNeueInvestition({...neueInvestition, beschreibung: e.target.value})}
              placeholder="z.B. Neue Heizung, Dachsanierung..."
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Betrag (€)</label>
            <input
              type="number"
              value={neueInvestition.betrag}
              onChange={(e) => setNeueInvestition({...neueInvestition, betrag: e.target.value})}
              placeholder="z.B. 5000"
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
              Speichern
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Zusammenfassung */}
      {investitionen.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Gesamt investiert:</span>
            <span className="text-lg font-bold text-orange-600">{formatCurrency(gesamtInvestitionen)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gesamtNachKategorie).map(([kat, summe]) => (
              <span key={kat} className={`text-xs px-2 py-1 rounded bg-${kategorien[kat].color}-100 text-${kategorien[kat].color}-700`}>
                {kategorien[kat].icon} {formatCurrency(summe)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="max-h-48 overflow-y-auto">
        {investitionen.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            Noch keine Reparaturen oder Investitionen erfasst
          </div>
        ) : (
          <div className="space-y-2">
            {investitionen.sort((a, b) => new Date(b.datum) - new Date(a.datum)).map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span>{kategorien[inv.kategorie]?.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{inv.beschreibung}</div>
                    <div className="text-xs text-gray-500">{new Date(inv.datum).toLocaleDateString('de-DE')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-orange-600">{formatCurrency(inv.betrag)}</span>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



export default ReparaturenInvestitionen;
