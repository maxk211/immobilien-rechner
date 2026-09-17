import { useState } from 'react';
import { Home, TrendingUp, TrendingDown, CalendarDays, Receipt, Building2, Wallet, X, Info } from 'lucide-react';
import { getAktuellerWert } from '../utils/miete.js';

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
    <div className="bg-cream-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-cream-700">Einnahmen & Kosten</h3>
        <div className="flex bg-cream-200 rounded-lg p-1">
          <button
            onClick={() => handleModusChange('automatisch')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'automatisch' ? 'bg-white shadow text-clay-600 font-semibold' : 'text-cream-600'}`}
          >
            Automatisch
          </button>
          <button
            onClick={() => handleModusChange('manuell')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'manuell' ? 'bg-white shadow text-clay-600 font-semibold' : 'text-cream-600'}`}
          >
            Manuell
          </button>
        </div>
      </div>

      {modus === 'automatisch' ? (
        <div className="space-y-3">
          {/* Vermietungsmodell */}
          <div className="bg-clay-50 p-3 rounded-xl border border-clay-100">
            <p className="text-xs font-bold text-clay-800 mb-2 flex items-center gap-1"><Home size={12} /> Vermietungsmodell</p>
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
                      ? 'border-clay-500 bg-white text-clay-700 font-semibold'
                      : 'border-cream-200 bg-white text-cream-500 hover:border-cream-300'
                  }`}>
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-cream-400 text-[10px]">{opt.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-clay-600 mt-1.5">
              {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete' ? 'Betriebskosten via NK-Abrechnung auf Mieter umgelegt'
                : (params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' ? 'Mieter zahlt Nebenkostenvorauszahlung direkt an dich'
                : 'Vermieter zahlt alle Betriebskosten aus der Warmmiete'}
            </p>
          </div>

          {/* Einnahmen */}
          <div className="bg-white border border-cream-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-cream-50 border-b border-cream-100">
              <p className="text-xs font-bold text-cream-500 uppercase tracking-wide flex items-center gap-1"><TrendingUp size={12} /> Einnahmen</p>
            </div>
            <div className="divide-y divide-cream-100 px-4">
              {[
                { label: (params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete (Basis)' : 'Kaltmiete (Basis)', key: 'kaltmiete', unit: '€', step: 25, hint: 'Monatliche Grundmiete' },
                ...((params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' ? [{ label: 'NK-Vorauszahlung (Mieter)', key: 'nebenkostenVomMieter', unit: '€', step: 10, hint: 'Monatliche NK-Vorauszahlung' }] : []),
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm text-cream-800 font-medium">{item.label}</div>
                    <div className="text-[10px] text-cream-400">{item.hint}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number"
                      value={params[item.key] ?? 0}
                      onChange={e => updateParams({...params, [item.key]: parseFloat(e.target.value) || 0})}
                      step={item.step || 1} min={0} max={item.max || 99999}
                      className="w-24 text-right border border-cream-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-clay-500 focus:border-clay-500 tabular-nums" />
                    <span className="text-xs text-cream-400 w-5 text-left">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mietanpassungen */}
          <div className="bg-white border border-cream-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-cream-50 border-b border-cream-100">
              <p className="text-xs font-bold text-cream-500 uppercase tracking-wide flex items-center gap-1"><CalendarDays size={12} /> Mietanpassungen</p>
              <button type="button"
                onClick={() => {
                  const neueAnpassung = { datum: new Date().toISOString().split('T')[0], kaltmiete: params.kaltmiete || 0 };
                  updateParams({ ...params, mietAnpassungen: [...(params.mietAnpassungen || []), neueAnpassung] });
                }}
                className="text-xs bg-clay-100 hover:bg-clay-200 text-clay-700 px-2 py-1 rounded-lg font-medium">
                + Anpassung
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-start gap-2 p-3 bg-honey-50 rounded-lg border border-honey-200 text-xs text-honey-700 mb-3">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>Fließt in Cashflow, Rendite und alle Berechnungen ein — die jeweils zum betreffenden Zeitpunkt gültige Miete wird automatisch verwendet.</span>
              </div>
              {(params.mietAnpassungen || []).length === 0 ? (
                <div className="text-center py-4 text-cream-400 text-sm">
                  <p>Noch keine Verlaufshistorie</p>
                  <p className="text-xs mt-1 text-cream-300">Nicht nötig für Berechnungen — optional für den Miete-Verlaufsgraph</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(params.mietAnpassungen || [])
                    .map((anp, originalIdx) => ({ ...anp, originalIdx }))
                    .sort((a, b) => new Date(a.datum) - new Date(b.datum))
                    .map(anp => (
                      <div key={anp.originalIdx} className="flex items-center gap-2 bg-cream-50 border border-cream-200 rounded-lg p-1.5">
                        <input type="date" value={anp.datum}
                          onChange={e => {
                            const neu = [...(params.mietAnpassungen || [])];
                            neu[anp.originalIdx] = { ...neu[anp.originalIdx], datum: e.target.value };
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="text-xs border border-cream-300 rounded px-1 py-0.5 flex-1 min-w-0" />
                        <input type="number" value={anp.kaltmiete}
                          onChange={e => {
                            const neu = [...(params.mietAnpassungen || [])];
                            neu[anp.originalIdx] = { ...neu[anp.originalIdx], kaltmiete: parseFloat(e.target.value) || 0 };
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="w-20 text-xs border border-cream-300 rounded px-1 py-0.5 text-right" />
                        <span className="text-[10px] text-cream-400 whitespace-nowrap">€/Mon</span>
                        <button type="button"
                          onClick={() => {
                            const neu = (params.mietAnpassungen || []).filter((_, i) => i !== anp.originalIdx);
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="text-brick-400 hover:text-brick-600 text-xs px-1 shrink-0"><X size={12} /></button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Vermieterkosten */}
          <div className="bg-white border border-cream-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-cream-50 border-b border-cream-100">
              <p className="text-xs font-bold text-cream-500 uppercase tracking-wide flex items-center gap-1"><Receipt size={12} /> Vermieterkosten</p>
            </div>
            <div className="divide-y divide-cream-100 px-4">
              {[
                { label: 'Instandhaltung', key: 'instandhaltung', unit: '€', step: 10, hint: 'Rücklagen für Reparaturen & Instandhaltung' },
                { label: 'Verwaltung', key: 'verwaltung', unit: '€', step: 5, hint: 'Hausverwaltung, Buchführung etc.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm text-cream-800 font-medium">{item.label}</div>
                    <div className="text-[10px] text-cream-400">{item.hint}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number"
                      value={params[item.key] ?? 0}
                      onChange={e => updateParams({...params, [item.key]: parseFloat(e.target.value) || 0})}
                      step={item.step || 1} min={0} max={9999}
                      className="w-24 text-right border border-cream-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-clay-500 focus:border-clay-500 tabular-nums" />
                    <span className="text-xs text-cream-400 w-5 text-left">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WEG & Betriebskosten */}
          <div className="bg-white border border-cream-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-cream-50 border-b border-cream-100">
              <p className="text-xs font-bold text-cream-500 uppercase tracking-wide flex items-center gap-1"><Building2 size={12} /> WEG & Betriebskosten</p>
            </div>
            <div className="divide-y divide-cream-100 px-4">
              {[
                { label: 'WEG / Hausgeld', key: 'hausgeld', unit: '€', step: 10, hint: 'Monatliches Hausgeld an die WEG' },
                { label: 'Strom', key: 'strom', unit: '€', step: 5, hint: 'Wenn vom Vermieter getragen' },
                { label: 'Internet', key: 'internet', unit: '€', step: 5, hint: 'Wenn vom Vermieter getragen' },
                { label: 'Sonstige Nebenkosten', key: 'nebenkosten', unit: '€', step: 10, hint: 'Versicherungen, Grundsteuer anteilig etc.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm text-cream-800 font-medium">{item.label}</div>
                    <div className="text-[10px] text-cream-400">{item.hint}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number"
                      value={params[item.key] ?? 0}
                      onChange={e => updateParams({...params, [item.key]: parseFloat(e.target.value) || 0})}
                      step={item.step || 1} min={0} max={9999}
                      className="w-24 text-right border border-cream-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-clay-500 focus:border-clay-500 tabular-nums" />
                    <span className="text-xs text-cream-400 w-5 text-left">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kostenanpassungen — datumsbasierte Overrides für alle Kostenfelder,
              analog zu den Mietanpassungen oben (statt starr pro Kalenderjahr). */}
          {(() => {
            const COST_FELDER = [
              { key: 'instandhaltung', label: 'Instandhaltung' },
              { key: 'verwaltung', label: 'Verwaltung' },
              { key: 'hausgeld', label: 'WEG / Hausgeld' },
              { key: 'strom', label: 'Strom' },
              { key: 'internet', label: 'Internet' },
              { key: 'nebenkosten', label: 'Sonstige NK' },
            ];
            const hatKostenFeld = (entry) => COST_FELDER.some(f => entry[f.key] != null);
            const kostenAnpassungen = (params.mietAnpassungen || [])
              .map((anp, originalIdx) => ({ ...anp, originalIdx }))
              .filter(hatKostenFeld)
              .sort((a, b) => new Date(a.datum) - new Date(b.datum));

            const addAnpassung = () => {
              const neueAnpassung = {
                datum: new Date().toISOString().split('T')[0],
                instandhaltung: getAktuellerWert(params, 'instandhaltung'),
                verwaltung: getAktuellerWert(params, 'verwaltung'),
                hausgeld: getAktuellerWert(params, 'hausgeld'),
                strom: getAktuellerWert(params, 'strom'),
                internet: getAktuellerWert(params, 'internet'),
                nebenkosten: getAktuellerWert(params, 'nebenkosten'),
              };
              updateParams({ ...params, mietAnpassungen: [...(params.mietAnpassungen || []), neueAnpassung] });
            };

            const removeAnpassung = (originalIdx) => {
              // Nur die Kosten-Felder aus dem Eintrag entfernen — falls derselbe
              // Eintrag auch eine Mietanpassung (kaltmiete) trägt, bleibt der
              // erhalten; ist der Eintrag danach leer, ganz entfernen.
              const neu = [...(params.mietAnpassungen || [])];
              const entry = { ...(neu[originalIdx] || {}) };
              COST_FELDER.forEach(f => delete entry[f.key]);
              const bleibtEtwas = Object.keys(entry).some(k => k !== 'datum');
              if (bleibtEtwas) neu[originalIdx] = entry;
              else neu.splice(originalIdx, 1);
              updateParams({ ...params, mietAnpassungen: neu });
            };

            const updateAnpassungDatum = (originalIdx, datum) => {
              const neu = [...(params.mietAnpassungen || [])];
              neu[originalIdx] = { ...neu[originalIdx], datum };
              updateParams({ ...params, mietAnpassungen: neu });
            };

            const updateAnpassungFeld = (originalIdx, feldKey, wert) => {
              const neu = [...(params.mietAnpassungen || [])];
              neu[originalIdx] = { ...neu[originalIdx], [feldKey]: parseFloat(wert) || 0 };
              updateParams({ ...params, mietAnpassungen: neu });
            };

            return (
              <div className="bg-white border border-cream-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-cream-50 border-b border-cream-100">
                  <div>
                    <p className="text-xs font-bold text-cream-500 uppercase tracking-wide flex items-center gap-1"><CalendarDays size={12} /> Kostenanpassungen</p>
                    <p className="text-[10px] text-cream-400">Basiswerte gelten ab Kauf — hier ab einem bestimmten Datum überschreiben (z.B. Hausgeld-Erhöhung zum 1. Juli)</p>
                  </div>
                  <button type="button" onClick={addAnpassung}
                    className="text-xs bg-clay-100 hover:bg-clay-200 text-clay-700 px-2 py-1 rounded-lg font-medium shrink-0 ml-3">
                    + Anpassung
                  </button>
                </div>
                <div className="px-4 py-3">
                  {kostenAnpassungen.length === 0 ? (
                    <p className="text-[10px] text-cream-400 italic bg-cream-50 border border-cream-100 p-2 rounded-lg">Keine Anpassungen → Basiswerte gelten durchgehend</p>
                  ) : (
                    <div className="space-y-3">
                      {kostenAnpassungen.map(anp => {
                        const istKuenftig = new Date(anp.datum) > new Date();
                        return (
                          <div key={anp.originalIdx} className={`border rounded-xl p-3 ${istKuenftig ? 'border-honey-200 bg-honey-50' : 'border-clay-200 bg-clay-50'}`}>
                            <div className="flex items-center justify-between mb-2.5 gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <label className="text-[10px] text-cream-500 shrink-0">Gültig ab</label>
                                <input type="date" value={anp.datum}
                                  onChange={e => updateAnpassungDatum(anp.originalIdx, e.target.value)}
                                  className="text-xs border border-cream-300 rounded px-1.5 py-1 bg-white min-w-0" />
                                {istKuenftig && <span className="text-[10px] bg-honey-500 text-white px-1.5 py-0.5 rounded shrink-0">Künftig</span>}
                              </div>
                              <button type="button" onClick={() => removeAnpassung(anp.originalIdx)}
                                className="text-brick-400 hover:text-brick-600 text-xs px-1 shrink-0"><X size={12} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                              {COST_FELDER.map(item => (
                                <div key={item.key} className="flex items-center gap-1">
                                  <label className="text-[10px] text-cream-500 w-[70px] shrink-0">{item.label}</label>
                                  <input type="number"
                                    value={anp[item.key] ?? ''}
                                    placeholder={`${getAktuellerWert(params, item.key)}`}
                                    onChange={e => updateAnpassungFeld(anp.originalIdx, item.key, e.target.value)}
                                    className="flex-1 text-xs text-right border border-cream-200 rounded px-1.5 py-1 min-w-0 bg-white focus:ring-1 focus:ring-clay-400" />
                                  <span className="text-[10px] text-cream-400">€</span>
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
          <div className="mb-3 bg-clay-50 p-2.5 rounded-lg border border-clay-100">
            <p className="text-[10px] font-semibold text-clay-800 mb-1.5 flex items-center gap-1"><Home size={12} /> Vermietungsmodell</p>
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
                      ? 'border-clay-500 bg-white text-clay-700 font-semibold'
                      : 'border-cream-200 bg-white text-cream-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-cream-500">Manuelle Eingabe pro Zeitraum</p>
            <div className="flex bg-cream-200 rounded-lg p-1">
              <button
                onClick={() => setAnsicht('jahr')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'jahr' ? 'bg-white shadow text-clay-600' : 'text-cream-600'}`}
              >
                Jahre
              </button>
              <button
                onClick={() => setAnsicht('monat')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'monat' ? 'bg-white shadow text-clay-600' : 'text-cream-600'}`}
              >
                Monate
              </button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-3">
            {ansicht === 'jahr' ? (
              // Jahresansicht - Card Layout
              jahre.map(jahr => (
                <div key={jahr} className={`border rounded-lg p-3 ${jahr === aktuellesJahr ? 'border-clay-400 bg-clay-50' : 'border-cream-200 bg-white'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-cream-800">{jahr}</span>
                    {jahr === aktuellesJahr && <span className="text-xs bg-clay-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                  </div>

                  {/* Einnahmen */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-sage-700 mb-2 flex items-center gap-1"><TrendingUp size={12} /> Einnahmen</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between bg-sage-50 p-2 rounded">
                        <label className="text-sm text-cream-700">
                          {(params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete' : 'Kaltmiete'}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'kaltmiete')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'kaltmiete', e.target.value)}
                            className="w-24 px-2 py-1 border border-sage-300 rounded text-right text-sm"
                          />
                          <span className="text-xs text-cream-500">€</span>
                        </div>
                      </div>
                      {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' && (
                        <div className="flex items-center justify-between bg-sage-50 p-2 rounded">
                          <label className="text-sm text-cream-700">NK-Vorauszahlung Mieter</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={getWertFuerZeitraum(jahr, null, 'nebenkostenVomMieter')}
                              onChange={(e) => setWertFuerZeitraum(jahr, null, 'nebenkostenVomMieter', e.target.value)}
                              className="w-24 px-2 py-1 border border-sage-300 rounded text-right text-sm"
                            />
                            <span className="text-xs text-cream-500">€</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kosten */}
                  <div>
                    <div className="text-xs font-semibold text-brick-700 mb-2 flex items-center gap-1"><TrendingDown size={12} /> Kosten (Vermieter)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-cream-50 p-2 rounded">
                        <label className="text-xs text-cream-600">Instandhaltung</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'instandhaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'instandhaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-cream-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-cream-50 p-2 rounded">
                        <label className="text-xs text-cream-600">Verwaltung</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'verwaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'verwaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-cream-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-cream-50 p-2 rounded">
                        <label className="text-xs text-cream-600">Hausgeld</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'hausgeld')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'hausgeld', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-cream-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-cream-50 p-2 rounded">
                        <label className="text-xs text-cream-600">Strom</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'strom')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'strom', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-cream-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-cream-50 p-2 rounded">
                        <label className="text-xs text-cream-600">Internet</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'internet')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'internet', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-cream-400">€</span>
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
                    <div className={`font-bold text-lg p-2 rounded-t-lg ${jahr === aktuellesJahr ? 'bg-clay-500 text-white' : 'bg-cream-200 text-cream-800'}`}>
                      {jahr}
                    </div>
                    <div className="border border-t-0 rounded-b-lg divide-y">
                      {monate.map((monat, idx) => {
                        const aktuellerMonat = new Date().getMonth();
                        const istAktuell = jahr === aktuellesJahr && idx === aktuellerMonat;
                        return (
                          <div key={`${jahr}-${idx}`} className={`p-3 ${istAktuell ? 'bg-clay-50' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-cream-700">{monat}</span>
                              {istAktuell && <span className="text-xs bg-clay-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                            </div>

                            {/* Einnahmen */}
                            <div className="mb-2 space-y-1">
                              <div className="flex items-center justify-between bg-sage-50 p-2 rounded">
                                <label className="text-sm text-sage-800 flex items-center gap-1">
                                  <Wallet size={12} /> {(params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete' : 'Kaltmiete'}
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={getWertFuerZeitraum(jahr, idx, 'kaltmiete')}
                                    onChange={(e) => setWertFuerZeitraum(jahr, idx, 'kaltmiete', e.target.value)}
                                    className="w-24 px-2 py-1 border border-sage-300 rounded text-right text-sm"
                                  />
                                  <span className="text-xs text-cream-500">€</span>
                                </div>
                              </div>
                              {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' && (
                                <div className="flex items-center justify-between bg-sage-50 p-2 rounded">
                                  <label className="text-sm text-sage-800 flex items-center gap-1"><Wallet size={12} /> NK-Vorauszahlung</label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={getWertFuerZeitraum(jahr, idx, 'nebenkostenVomMieter')}
                                      onChange={(e) => setWertFuerZeitraum(jahr, idx, 'nebenkostenVomMieter', e.target.value)}
                                      className="w-24 px-2 py-1 border border-sage-300 rounded text-right text-sm"
                                    />
                                    <span className="text-xs text-cream-500">€</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Kosten Grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-cream-50 p-2 rounded">
                                <label className="text-cream-500 block mb-1">Inst.</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'instandhaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'instandhaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-cream-50 p-2 rounded">
                                <label className="text-cream-500 block mb-1">Verw.</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'verwaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'verwaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-cream-50 p-2 rounded">
                                <label className="text-cream-500 block mb-1">Hausgeld</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'hausgeld')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'hausgeld', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-cream-50 p-2 rounded">
                                <label className="text-cream-500 block mb-1">Strom</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'strom')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'strom', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-cream-50 p-2 rounded">
                                <label className="text-cream-500 block mb-1">Internet</label>
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
          <p className="text-xs text-cream-400 mt-3 text-center">Alle Werte in € pro Monat</p>
        </div>
      )}
    </div>
  );
};

// Cashflow-Übersicht Komponente

export default MietKostenManager;
