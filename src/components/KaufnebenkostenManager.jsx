import { useState, useEffect } from 'react';
import { GREST_HISTORIE, BUNDESLAND_KEYS, grestSatz, grestFrei, bundeslandAusPlz, bundeslandAusAdresse } from '../config/grunderwerbsteuer.js';
import { formatCurrency } from '../utils/format.js';
import InputSliderCombo from './InputSliderCombo.jsx';
import InfoHint from './InfoHint';

const KaufnebenkostenManager = ({ params, updateParams, kaufpreis }) => {
  const [modus, setModus] = useState(params.kaufnebenkostenModus || 'prozent'); // 'prozent' oder 'manuell'

  // Phase H: Grunderwerbsteuer aus der Tabelle mit Gültig-ab-Historie — Satz am Kaufdatum,
  // Bundesland aus der Adresse (kein stiller Vorgabewert mehr), 0 bei Erbe/Schenkung.
  const [bundesland, setBundesland] = useState(params.bundesland || bundeslandAusPlz(params.plz) || '');
  const [erkannt, setErkannt] = useState(null); // aus der Adresse erkannt, noch nicht übernommen
  useEffect(() => {
    if (params.bundesland) return;
    let aktiv = true;
    bundeslandAusAdresse({ plz: params.plz, adresse: params.adresse }).then(bl => {
      if (aktiv && bl) { setErkannt(bl); if (!bundesland) setBundesland(bl); }
    });
    return () => { aktiv = false; };
  }, [params.plz, params.adresse]); // eslint-disable-line react-hooks/exhaustive-deps
  const frei = grestFrei(params);
  const grest = bundesland ? grestSatz(bundesland, params.kaufdatum || new Date()) : null;
  const grestProzent = frei ? 0 : (grest?.satz ?? 0);
  const blName = bundesland ? GREST_HISTORIE[bundesland]?.name : null;

  // Manuelle Positionen: Grunderwerbsteuer aus dem Satz, sonst leer (keine erfundenen Werte)
  const [positionen, setPositionen] = useState(params.kaufnebenkostenPositionen || {
    grunderwerbsteuer: kaufpreis * (grestProzent / 100),
    notar: 0,
    grundbuch: 0,
    makler: 0,
    sonstige: 0
  });

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
    setErkannt(null);
    const satz = frei ? 0 : (grestSatz(bl, params.kaufdatum || new Date())?.satz ?? 0);
    const neuePositionen = { ...positionen, grunderwerbsteuer: kaufpreis * (satz / 100) };
    setPositionen(neuePositionen);
    const neuesGesamt = Object.values(neuePositionen).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const neuerProzentsatz = kaufpreis > 0 ? (neuesGesamt / kaufpreis) * 100 : 0;
    updateParams({
      ...params,
      ...(modus === 'manuell' ? { kaufnebenkosten: neuerProzentsatz, kaufnebenkostenPositionen: neuePositionen } : {}),
      bundesland: bl,
    });
  };

  // Bundesland-Auswahl + Grunderwerbsteuer-Zeile, in beiden Modi sichtbar
  const bundeslandBlock = (
    <div className="mb-3 space-y-1.5">
      <label className="text-xs text-gray-600 flex items-center gap-1">Bundesland (für Grunderwerbsteuer) <InfoHint text="Einmalige Steuer beim Eigentumswechsel, vom Bundesland festgelegt. Maßgeblich ist der Satz am Tag des Kaufvertrags — renditly nimmt den Satz, der am Kaufdatum galt." /></label>
      <select value={bundesland} onChange={(e) => handleBundeslandChange(e.target.value)}
        className={`w-full px-2 py-1.5 border rounded text-base sm:text-sm ${!bundesland ? 'border-amber-400 bg-amber-50' : ''}`}>
        <option value="">Bitte wählen</option>
        {BUNDESLAND_KEYS.map(key => (
          <option key={key} value={key}>{GREST_HISTORIE[key].name} ({String(grestSatz(key, params.kaufdatum || new Date()).satz).replace('.', ',')} %)</option>
        ))}
      </select>
      {erkannt && !params.bundesland && (
        <div className="text-[11px] text-indigo-700 flex items-center gap-2">
          Aus der Adresse erkannt: {GREST_HISTORIE[erkannt]?.name}
          <button type="button" onClick={() => handleBundeslandChange(erkannt)} className="font-bold underline">übernehmen</button>
        </div>
      )}
      {frei ? (
        <p className="text-[11px] text-emerald-700">Keine Grunderwerbsteuer: Erwerb durch Schenkung oder Erbe ist befreit (§ 3 Nr. 2 GrEStG). Ausnahme: Bei einer Schenkung mit Auflage (z. B. übernommene Schulden) ist der Wert der Auflage steuerpflichtig.</p>
      ) : grest ? (
        <p className="text-[11px] text-gray-500">
          Grunderwerbsteuer {blName}: <strong>{String(grest.satz).replace('.', ',')} %</strong>, gültig seit {new Date(grest.ab).toLocaleDateString('de-DE')}
          {params.kaufdatum ? ` (Satz am Kaufdatum ${new Date(params.kaufdatum).toLocaleDateString('de-DE')})` : ''} = {formatCurrency(kaufpreis * grest.satz / 100)}
        </p>
      ) : (
        <p className="text-[11px] text-amber-700">Ohne Bundesland kann renditly die Grunderwerbsteuer nicht ausweisen.</p>
      )}
    </div>
  );

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

      {bundeslandBlock}

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
          {!frei && grest && (params.kaufnebenkosten || 0) < grest.satz && (
            <p className="text-[11px] text-amber-700 mt-1">Die Kaufnebenkosten liegen unter der Grunderwerbsteuer allein ({String(grest.satz).replace('.', ',')} %). Notar und Grundbuch kommen noch dazu.</p>
          )}
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            {[
              { key: 'grunderwerbsteuer', label: frei ? 'Grunderwerbsteuer (befreit)' : `Grunderwerbsteuer (${grest ? String(grest.satz).replace('.', ',') + ' %' : 'Bundesland wählen'})` },
              { key: 'notar', label: 'Notar (ca. 1,5%)' },
              { key: 'grundbuch', label: 'Grundbuch (Faustregel ca. 0,5 % — Eigentum und Grundschuld zusammen)' },
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
