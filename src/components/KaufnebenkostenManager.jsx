import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';
import InputSliderCombo from './InputSliderCombo.jsx';

const KaufnebenkostenManager = ({ params, updateParams, kaufpreis }) => {
  const [modus, setModus] = useState(params.kaufnebenkostenModus || 'prozent'); // 'prozent' oder 'manuell'

  // Manuelle Positionen mit Standardwerten basierend auf Bundesland
  const [positionen, setPositionen] = useState(params.kaufnebenkostenPositionen || {
    grunderwerbsteuer: kaufpreis * 0.035,
    notar: kaufpreis * 0.015,
    grundbuch: kaufpreis * 0.005,
    makler: kaufpreis * 0.0357,
    sonstige: 0
  });

  const bundeslaender = {
    'bayern': { name: 'Bayern', grunderwerbsteuer: 3.5 },
    'baden-wuerttemberg': { name: 'Baden-Württemberg', grunderwerbsteuer: 5.0 },
    'berlin': { name: 'Berlin', grunderwerbsteuer: 6.0 },
    'brandenburg': { name: 'Brandenburg', grunderwerbsteuer: 6.5 },
    'bremen': { name: 'Bremen', grunderwerbsteuer: 5.0 },
    'hamburg': { name: 'Hamburg', grunderwerbsteuer: 5.5 },
    'hessen': { name: 'Hessen', grunderwerbsteuer: 6.0 },
    'mecklenburg': { name: 'Mecklenburg-Vorpommern', grunderwerbsteuer: 6.0 },
    'niedersachsen': { name: 'Niedersachsen', grunderwerbsteuer: 5.0 },
    'nrw': { name: 'Nordrhein-Westfalen', grunderwerbsteuer: 6.5 },
    'rheinland-pfalz': { name: 'Rheinland-Pfalz', grunderwerbsteuer: 5.0 },
    'saarland': { name: 'Saarland', grunderwerbsteuer: 6.5 },
    'sachsen': { name: 'Sachsen', grunderwerbsteuer: 5.5 },
    'sachsen-anhalt': { name: 'Sachsen-Anhalt', grunderwerbsteuer: 5.0 },
    'schleswig-holstein': { name: 'Schleswig-Holstein', grunderwerbsteuer: 6.5 },
    'thueringen': { name: 'Thüringen', grunderwerbsteuer: 5.0 }
  };

  const [bundesland, setBundesland] = useState(params.bundesland || 'bayern');

  const kaufnebenkostenAbsolut = modus === 'prozent'
    ? kaufpreis * (params.kaufnebenkosten / 100)
    : Object.values(positionen).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const gesamtinvestition = kaufpreis + kaufnebenkostenAbsolut;

  const handlePositionChange = (key, value) => {
    const neuePositionen = { ...positionen, [key]: parseFloat(value) || 0 };
    setPositionen(neuePositionen);
    const neuesGesamt = Object.values(neuePositionen).reduce((sum, val) => sum + val, 0);
    const neuerProzentsatz = kaufpreis > 0 ? (neuesGesamt / kaufpreis) * 100 : 0;
    updateParams({
      ...params,
      kaufnebenkosten: neuerProzentsatz,
      kaufnebenkostenModus: 'manuell',
      kaufnebenkostenPositionen: neuePositionen
    });
  };

  const handleBundeslandChange = (bl) => {
    setBundesland(bl);
    const neueGrunderwerbsteuer = kaufpreis * (bundeslaender[bl].grunderwerbsteuer / 100);
    const neuePositionen = { ...positionen, grunderwerbsteuer: neueGrunderwerbsteuer };
    setPositionen(neuePositionen);
    const neuesGesamt = Object.values(neuePositionen).reduce((sum, val) => sum + val, 0);
    const neuerProzentsatz = kaufpreis > 0 ? (neuesGesamt / kaufpreis) * 100 : 0;
    updateParams({
      ...params,
      kaufnebenkosten: neuerProzentsatz,
      bundesland: bl,
      kaufnebenkostenPositionen: neuePositionen
    });
  };

  const handleModusChange = (neuerModus) => {
    setModus(neuerModus);
    updateParams({ ...params, kaufnebenkostenModus: neuerModus });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-700">Kaufnebenkosten</h4>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => handleModusChange('prozent')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${modus === 'prozent' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Pauschal %
          </button>
          <button
            onClick={() => handleModusChange('manuell')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${modus === 'manuell' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Aufgeschlüsselt
          </button>
        </div>
      </div>

      {modus === 'prozent' ? (
        <div>
          <InputSliderCombo
            label="Kaufnebenkosten gesamt"
            value={params.kaufnebenkosten}
            onChange={(v) => updateParams({...params, kaufnebenkosten: v})}
            min={5}
            max={15}
            step={0.5}
            unit="%"
          />
          <div className="text-sm text-gray-600 mt-2">
            = {formatCurrency(kaufpreis * (params.kaufnebenkosten / 100))}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Bundesland (für Grunderwerbsteuer)</label>
            <select
              value={bundesland}
              onChange={(e) => handleBundeslandChange(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              {Object.entries(bundeslaender).map(([key, val]) => (
                <option key={key} value={key}>{val.name} ({val.grunderwerbsteuer}%)</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {[
              { key: 'grunderwerbsteuer', label: `Grunderwerbsteuer (${bundeslaender[bundesland].grunderwerbsteuer}%)` },
              { key: 'notar', label: 'Notar (ca. 1,5%)' },
              { key: 'grundbuch', label: 'Grundbuch (ca. 0,5%)' },
              { key: 'makler', label: 'Makler (ca. 3,57%)' },
              { key: 'sonstige', label: 'Sonstige' }
            ].map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <label className="text-sm text-gray-600">{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={Math.round(positionen[key] || 0)}
                    onChange={(e) => handlePositionChange(key, e.target.value)}
                    className="w-24 px-2 py-1 border rounded text-sm text-right"
                  />
                  <span className="text-xs text-gray-500">€</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="font-medium text-gray-700">Nebenkosten gesamt</span>
            <span className="font-bold">{formatCurrency(kaufnebenkostenAbsolut)}</span>
          </div>
        </div>
      )}

      {/* Gesamtinvestition Anzeige */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Kaufpreis:</span>
          <span>{formatCurrency(kaufpreis)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>+ Nebenkosten:</span>
          <span>{formatCurrency(kaufnebenkostenAbsolut)}</span>
        </div>
        <div className="flex justify-between font-bold text-blue-700 pt-2 border-t border-blue-200 mt-2">
          <span>Gesamtinvestition:</span>
          <span>{formatCurrency(gesamtinvestition)}</span>
        </div>
      </div>
    </div>
  );
};

// Miet- und Kostenmanager Komponente

export default KaufnebenkostenManager;
