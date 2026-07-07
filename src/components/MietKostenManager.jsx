import { useState } from 'react';
import { Home, TrendingUp, TrendingDown, CalendarDays, Receipt, Building2, Wallet, X } from 'lucide-react';

const MietKostenManager = ({ params, updateParams, immobilie, hasChanges, setHasChanges }) => {
  const [modus, setModus] = useState(immobilie.mietModus || 'automatisch'); // 'automatisch' oder 'manuell'
  const [ansicht, setAnsicht] = useState('jahr'); // 'jahr' oder 'monat'
  const [mietHistorie, setMietHistorie] = useState(immobilie.mietHistorie || {});

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();
  const jahre = [];
  for (let j = kaufjahr; j <= aktuellesJahr + 5; j++) {
    jahre.push(j);
  }

  const monate = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  const getWertFuerZeitraum = (jahr, monat = null, feld) => {
    const key = monat !== null ? `${jahr}-${monat}` : `${jahr}`;
    if (mietHistorie[key] && mietHistorie[key][feld] !== undefined) {
      return mietHistorie[key][feld];
    }
    // Fallback auf params oder berechne mit Steigerung
    const jahreVergangen = jahr - kaufjahr;
    const basisWert = params[feld] || 0;
    if (modus === 'automatisch' && feld === 'kaltmiete') {
      return Math.round(basisWert * Math.pow(1 + (params.mietsteigerung || 0) / 100, jahreVergangen));
    }
    return basisWert;
  };

  const setWertFuerZeitraum = (jahr, monat, feld, wert) => {
    const key = monat !== null ? `${jahr}-${monat}` : `${jahr}`;
    const neueHistorie = {
      ...mietHistorie,
      [key]: {
        ...(mietHistorie[key] || {}),
        [feld]: parseFloat(wert) || 0
      }
    };
    setMietHistorie(neueHistorie);
    updateParams({ ...params, mietHistorie: neueHistorie, mietModus: modus });
  };

  const handleModusChange = (neuerModus) => {
    setModus(neuerModus);
    updateParams({ ...params, mietModus: neuerModus });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Einnahmen & Kosten</h3>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => handleModusChange('automatisch')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'automatisch' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-gray-600'}`}
          >
            Automatisch
          </button>
          <button
            onClick={() => handleModusChange('manuell')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'manuell' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-gray-600'}`}
          >
            Manuell
          </button>
        </div>
      </div>

      {modus === 'automatisch' ? (
        <div className="space-y-3">
          {/* Vermietungsmodell */}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><Home size={12} /> Vermietungsmodell</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'kaltmiete', label: 'Kaltmiete', desc: 'NK via Abrechnung' },
                { value: 'kaltmiete_nk', label: 'Kaltmiete + NK', desc: 'Mieter zahlt NK-VZ' },
                { value: 'warmmiete', label: 'Warmmiete', desc: 'Inklusivmiete' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => updateParams({ ...params, vermietungsmodell: opt.value })}
                  className={`p-1.5 rounded-lg border-2 text-xs transition-all text-left ${
                    (params.vermietungsmodell || 'kaltmiete') === opt.value
                      ? 'border-indigo-500 bg-white text-indigo-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-gray-400 text-[10px]">{opt.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-indigo-600 mt-1.5">
              {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete' ? 'Betriebskosten via NK-Abrechnung auf Mieter umgelegt'
                : (params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' ? 'Mieter zahlt Nebenkostenvorauszahlung direkt an dich'
                : 'Vermieter zahlt alle Betriebskosten aus der Warmmiete'}
            </p>
          </div>

          {/* Einnahmen */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><TrendingUp size={12} /> Einnahmen</p>
            </div>
            <div className="divide-y divide-gray-100 px-4">
              {[
                { label: (params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete (Basis)' : 'Kaltmiete (Basis)', key: 'kaltmiete', unit: '€', step: 25, hint: 'Monatliche Grundmiete' },
                ...((params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' ? [{ label: 'NK-Vorauszahlung (Mieter)', key: 'nebenkostenVomMieter', unit: '€', step: 10, hint: 'Monatliche NK-Vorauszahlung' }] : []),
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm text-gray-800 font-medium">{item.label}</div>
                    <div className="text-[10px] text-gray-400">{item.hint}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number"
                      value={params[item.key] ?? 0}
                      onChange={e => updateParams({...params, [item.key]: parseFloat(e.target.value) || 0})}
                      step={item.step || 1} min={0} max={item.max || 99999}
                      className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tabular-nums" />
                    <span className="text-xs text-gray-400 w-5 text-left">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mietanpassungen */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><CalendarDays size={12} /> Mietanpassungen</p>
              <button type="button"
                onClick={() => {
                  const neueAnpassung = { datum: new Date().toISOString().split('T')[0], kaltmiete: params.kaltmiete || 0 };
                  updateParams({ ...params, mietAnpassungen: [...(params.mietAnpassungen || []), neueAnpassung] });
                }}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-indigo-700 px-2 py-1 rounded-lg font-medium">
                + Anpassung
              </button>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] text-gray-400 mb-2">Mietänderungen mit Datum – für Steuerexport</p>
              {(params.mietAnpassungen || []).length === 0 ? (
                <p className="text-[10px] text-gray-400 italic bg-gray-50 border border-gray-100 p-2 rounded-lg">Keine Anpassungen → Kaltmiete (Basis) gilt durchgehend</p>
              ) : (
                <div className="space-y-1.5">
                  {(params.mietAnpassungen || [])
                    .map((anp, originalIdx) => ({ ...anp, originalIdx }))
                    .sort((a, b) => new Date(a.datum) - new Date(b.datum))
                    .map(anp => (
                      <div key={anp.originalIdx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5">
                        <input type="date" value={anp.datum}
                          onChange={e => {
                            const neu = [...(params.mietAnpassungen || [])];
                            neu[anp.originalIdx] = { ...neu[anp.originalIdx], datum: e.target.value };
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="text-xs border border-gray-300 rounded px-1 py-0.5 flex-1 min-w-0" />
                        <input type="number" value={anp.kaltmiete}
                          onChange={e => {
                            const neu = [...(params.mietAnpassungen || [])];
                            neu[anp.originalIdx] = { ...neu[anp.originalIdx], kaltmiete: parseFloat(e.target.value) || 0 };
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="w-20 text-xs border border-gray-300 rounded px-1 py-0.5 text-right" />
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">€/Mon</span>
                        <button type="button"
                          onClick={() => {
                            const neu = (params.mietAnpassungen || []).filter((_, i) => i !== anp.originalIdx);
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="text-red-400 hover:text-red-600 text-xs px-1 shrink-0"><X size={12} /></button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Vermieterkosten */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Receipt size={12} /> Vermieterkosten</p>
            </div>
            <div className="divide-y divide-gray-100 px-4">
              {[
                { label: 'Instandhaltung', key: 'instandhaltung', unit: '€', step: 10, hint: 'Rücklagen für Reparaturen & Instandhaltung' },
                { label: 'Verwaltung', key: 'verwaltung', unit: '€', step: 5, hint: 'Hausverwaltung, Buchführung etc.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm text-gray-800 font-medium">{item.label}</div>
                    <div className="text-[10px] text-gray-400">{item.hint}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number"
                      value={params[item.key] ?? 0}
                      onChange={e => updateParams({...params, [item.key]: parseFloat(e.target.value) || 0})}
                      step={item.step || 1} min={0} max={9999}
                      className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tabular-nums" />
                    <span className="text-xs text-gray-400 w-5 text-left">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WEG & Betriebskosten */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Building2 size={12} /> WEG & Betriebskosten</p>
            </div>
            <div className="divide-y divide-gray-100 px-4">
              {[
                { label: 'WEG / Hausgeld', key: 'hausgeld', unit: '€', step: 10, hint: 'Monatliches Hausgeld an die WEG' },
                { label: 'Strom', key: 'strom', unit: '€', step: 5, hint: 'Wenn vom Vermieter getragen' },
                { label: 'Internet', key: 'internet', unit: '€', step: 5, hint: 'Wenn vom Vermieter getragen' },
                { label: 'Sonstige Nebenkosten', key: 'nebenkosten', unit: '€', step: 10, hint: 'Versicherungen, Grundsteuer anteilig etc.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm text-gray-800 font-medium">{item.label}</div>
                    <div className="text-[10px] text-gray-400">{item.hint}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number"
                      value={params[item.key] ?? 0}
                      onChange={e => updateParams({...params, [item.key]: parseFloat(e.target.value) || 0})}
                      step={item.step || 1} min={0} max={9999}
                      className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tabular-nums" />
                    <span className="text-xs text-gray-400 w-5 text-left">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kostenanpassungen — year-based overrides for all cost fields */}
          {(() => {
            const COST_FELDER = [
              { key: 'instandhaltung', label: 'Instandhaltung' },
              { key: 'verwaltung', label: 'Verwaltung' },
              { key: 'hausgeld', label: 'WEG / Hausgeld' },
              { key: 'strom', label: 'Strom' },
              { key: 'internet', label: 'Internet' },
              { key: 'nebenkosten', label: 'Sonstige NK' },
            ];
            const hasCostData = (val) => COST_FELDER.some(f => val[f.key] !== undefined);
            const kostenjahre = Object.entries(mietHistorie)
              .filter(([key, val]) => /^\d{4}$/.test(key) && hasCostData(val))
              .sort(([a], [b]) => Number(a) - Number(b));

            const addJahr = () => {
              const existingYears = new Set(kostenjahre.map(([y]) => Number(y)));
              let neuesJahr = new Date().getFullYear();
              while (existingYears.has(neuesJahr)) neuesJahr++;
              const neueHistorie = {
                ...mietHistorie,
                [`${neuesJahr}`]: {
                  ...(mietHistorie[`${neuesJahr}`] || {}),
                  instandhaltung: params.instandhaltung ?? 0,
                  verwaltung: params.verwaltung ?? 0,
                  hausgeld: params.hausgeld ?? 0,
                  strom: params.strom ?? 0,
                  internet: params.internet ?? 0,
                  nebenkosten: params.nebenkosten ?? 0,
                }
              };
              setMietHistorie(neueHistorie);
              updateParams({ ...params, mietHistorie: neueHistorie, mietModus: modus });
            };

            const removeJahr = (jahrKey) => {
              const neueHistorie = { ...mietHistorie };
              const entry = { ...(neueHistorie[jahrKey] || {}) };
              COST_FELDER.forEach(f => delete entry[f.key]);
              if (Object.keys(entry).length === 0) delete neueHistorie[jahrKey];
              else neueHistorie[jahrKey] = entry;
              setMietHistorie(neueHistorie);
              updateParams({ ...params, mietHistorie: neueHistorie, mietModus: modus });
            };

            const updateKostenJahr = (jahrKey, feldKey, wert) => {
              const neueHistorie = {
                ...mietHistorie,
                [jahrKey]: { ...(mietHistorie[jahrKey] || {}), [feldKey]: parseFloat(wert) || 0 }
              };
              setMietHistorie(neueHistorie);
              updateParams({ ...params, mietHistorie: neueHistorie, mietModus: modus });
            };

            return (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><CalendarDays size={12} /> Kostenanpassungen</p>
                    <p className="text-[10px] text-gray-400">Basiswerte gelten für alle Jahre — hier einzelne Jahre überschreiben</p>
                  </div>
                  <button type="button" onClick={addJahr}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-indigo-700 px-2 py-1 rounded-lg font-medium shrink-0 ml-3">
                    + Jahr
                  </button>
                </div>
                <div className="px-4 py-3">
                  {kostenjahre.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic bg-gray-50 border border-gray-100 p-2 rounded-lg">Keine Anpassungen → Basiswerte gelten für alle Jahre</p>
                  ) : (
                    <div className="space-y-3">
                      {kostenjahre.map(([jahrKey, val]) => {
                        const isAktuell = jahrKey === String(new Date().getFullYear());
                        return (
                          <div key={jahrKey} className={`border rounded-xl p-3 ${isAktuell ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">{jahrKey}</span>
                                {isAktuell && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded">Aktuell</span>}
                              </div>
                              <button type="button" onClick={() => removeJahr(jahrKey)}
                                className="text-red-400 hover:text-red-600 text-xs px-1"><X size={12} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                              {COST_FELDER.map(item => (
                                <div key={item.key} className="flex items-center gap-1">
                                  <label className="text-[10px] text-gray-500 w-[70px] shrink-0">{item.label}</label>
                                  <input type="number"
                                    value={val[item.key] ?? ''}
                                    placeholder={`${params[item.key] ?? 0}`}
                                    onChange={e => updateKostenJahr(jahrKey, item.key, e.target.value)}
                                    className="flex-1 text-xs text-right border border-gray-200 rounded px-1.5 py-1 min-w-0 bg-white focus:ring-1 focus:ring-blue-400" />
                                  <span className="text-[10px] text-gray-400">€</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div>
          {/* Vermietungsmodell auch im manuellen Modus */}
          <div className="mb-3 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
            <p className="text-[10px] font-semibold text-blue-800 mb-1.5 flex items-center gap-1"><Home size={12} /> Vermietungsmodell</p>
            <div className="flex gap-1.5">
              {[
                { value: 'kaltmiete', label: 'Kaltmiete' },
                { value: 'kaltmiete_nk', label: '+ NK' },
                { value: 'warmmiete', label: 'Warmmiete' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParams({ ...params, vermietungsmodell: opt.value })}
                  className={`px-2 py-1 rounded text-[10px] border transition-all flex-1 ${
                    (params.vermietungsmodell || 'kaltmiete') === opt.value
                      ? 'border-indigo-500 bg-white text-indigo-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-gray-500">Manuelle Eingabe pro Zeitraum</p>
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setAnsicht('jahr')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'jahr' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}
              >
                Jahre
              </button>
              <button
                onClick={() => setAnsicht('monat')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'monat' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}
              >
                Monate
              </button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-3">
            {ansicht === 'jahr' ? (
              // Jahresansicht - Card Layout
              jahre.map(jahr => (
                <div key={jahr} className={`border rounded-lg p-3 ${jahr === aktuellesJahr ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-gray-800">{jahr}</span>
                    {jahr === aktuellesJahr && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                  </div>

                  {/* Einnahmen */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><TrendingUp size={12} /> Einnahmen</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <label className="text-sm text-gray-700">
                          {(params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete' : 'Kaltmiete'}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'kaltmiete')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'kaltmiete', e.target.value)}
                            className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-500">€</span>
                        </div>
                      </div>
                      {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' && (
                        <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <label className="text-sm text-gray-700">NK-Vorauszahlung Mieter</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={getWertFuerZeitraum(jahr, null, 'nebenkostenVomMieter')}
                              onChange={(e) => setWertFuerZeitraum(jahr, null, 'nebenkostenVomMieter', e.target.value)}
                              className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                            />
                            <span className="text-xs text-gray-500">€</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kosten */}
                  <div>
                    <div className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1"><TrendingDown size={12} /> Kosten (Vermieter)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Instandhaltung</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'instandhaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'instandhaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Verwaltung</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'verwaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'verwaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Hausgeld</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'hausgeld')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'hausgeld', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Strom</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'strom')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'strom', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Internet</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'internet')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'internet', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Monatsansicht - Card Layout
              <div>
                <select
                  className="w-full mb-3 p-2 border rounded-lg text-sm font-semibold"
                  onChange={(e) => document.getElementById(`monat-${e.target.value}`)?.scrollIntoView({ behavior: 'smooth' })}
                  defaultValue={aktuellesJahr}
                >
                  {jahre.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                {jahre.map(jahr => (
                  <div key={jahr} id={`monat-${jahr}`} className="mb-6">
                    <div className={`font-bold text-lg p-2 rounded-t-lg ${jahr === aktuellesJahr ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {jahr}
                    </div>
                    <div className="border border-t-0 rounded-b-lg divide-y">
                      {monate.map((monat, idx) => {
                        const aktuellerMonat = new Date().getMonth();
                        const istAktuell = jahr === aktuellesJahr && idx === aktuellerMonat;
                        return (
                          <div key={`${jahr}-${idx}`} className={`p-3 ${istAktuell ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-gray-700">{monat}</span>
                              {istAktuell && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                            </div>

                            {/* Einnahmen */}
                            <div className="mb-2 space-y-1">
                              <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                                <label className="text-sm text-green-800 flex items-center gap-1">
                                  <Wallet size={12} /> {(params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete' : 'Kaltmiete'}
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={getWertFuerZeitraum(jahr, idx, 'kaltmiete')}
                                    onChange={(e) => setWertFuerZeitraum(jahr, idx, 'kaltmiete', e.target.value)}
                                    className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                                  />
                                  <span className="text-xs text-gray-500">€</span>
                                </div>
                              </div>
                              {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' && (
                                <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                                  <label className="text-sm text-green-800 flex items-center gap-1"><Wallet size={12} /> NK-Vorauszahlung</label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={getWertFuerZeitraum(jahr, idx, 'nebenkostenVomMieter')}
                                      onChange={(e) => setWertFuerZeitraum(jahr, idx, 'nebenkostenVomMieter', e.target.value)}
                                      className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                                    />
                                    <span className="text-xs text-gray-500">€</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Kosten Grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Inst.</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'instandhaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'instandhaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Verw.</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'verwaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'verwaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Hausgeld</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'hausgeld')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'hausgeld', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Strom</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'strom')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'strom', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Internet</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'internet')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'internet', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Alle Werte in € pro Monat</p>
        </div>
      )}
    </div>
  );
};

// Cashflow-Übersicht Komponente

export default MietKostenManager;
