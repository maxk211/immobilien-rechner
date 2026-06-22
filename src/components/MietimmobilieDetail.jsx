import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleWarmmiete, getAktuelleUntermiete, berechneHistorischenArbitrageCashflow } from '../utils/miete.js';
import MieterDashboard from './MieterDashboard';

const MietimmobilieDetail = ({ immobilie, onClose, onSave, mieterListe = [], onSaveMieter, onDeleteMieter, nkAbrechnungen = [], onSaveNK, onDeleteNK, portfolio = [] }) => {
  const [params, setParams] = useState({
    eigeneWarmmiete: immobilie.eigeneWarmmiete || 1500,
    anzahlZimmerVermietet: immobilie.anzahlZimmerVermietet || 3,
    untermieteProZimmer: immobilie.untermieteProZimmer || 600,
    // Aufgeschlüsselte Kosten für Steuerberater
    arbitrageStrom: immobilie.arbitrageStrom || 0,
    arbitrageInternet: immobilie.arbitrageInternet || 0,
    arbitrageGEZ: immobilie.arbitrageGEZ ?? 18.36,
    wohnflaeche: immobilie.wohnflaeche || 80,
    zimmer: immobilie.zimmer || 4,
    mietvertragStart: immobilie.mietvertragStart || '',
    mietvertragEnde: immobilie.mietvertragEnde || '',
    name: immobilie.name || '',
    plz: immobilie.plz || '',
    adresse: immobilie.adresse || '',
    // Mietanpassungen: [{datum, eigeneWarmmiete?, untermieteProZimmer?}]
    mietAnpassungen: immobilie.mietAnpassungen || []
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('uebersicht');

  const updateParams = (newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({ ...immobilie, ...params });
    setHasChanges(false);
  };

  // Mietvertragsende prüfen
  const vertragsende = params.mietvertragEnde ? new Date(params.mietvertragEnde) : null;
  const heute = new Date();
  const vertragsBeendet = vertragsende && vertragsende < heute;

  // Aktuelle Werte aus mietAnpassungen (historisch korrekt, neuster Wert ≤ heute)
  const aktWarmmiete = getAktuelleWarmmiete(params);
  const aktUntermiete = getAktuelleUntermiete(params);

  // Berechnungen — wenn Vertrag beendet: laufender Cashflow = 0
  const einnahmen = vertragsBeendet ? 0 : params.anzahlZimmerVermietet * aktUntermiete;
  const zusatzkosten = vertragsBeendet ? 0 : (params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36);
  const ausgaben = vertragsBeendet ? 0 : aktWarmmiete + zusatzkosten;
  const monatsCashflow = einnahmen - ausgaben;
  const jahresCashflow = monatsCashflow * 12;

  // Bisheriger Cashflow: Monat-für-Monat mit historisch korrekten Werten je Anpassungsperiode
  const mietvertragStart = params.mietvertragStart ? new Date(params.mietvertragStart) : null;
  const bisWann = vertragsende && vertragsende < heute ? vertragsende : heute;
  const monateSeitStart = mietvertragStart
    ? Math.max(0, Math.floor((bisWann - mietvertragStart) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const bisherigeCashflowGesamt = mietvertragStart
    ? berechneHistorischenArbitrageCashflow(params, mietvertragStart, bisWann)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">🔄 Arbitrage</span>
                  {vertragsBeendet && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/80 text-white">🔴 Vertrag beendet {new Date(params.mietvertragEnde).toLocaleDateString('de-DE')}</span>
                  )}
                  {vertragsende && !vertragsBeendet && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/80 text-amber-900">⏳ Endet {new Date(params.mietvertragEnde).toLocaleDateString('de-DE')}</span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white truncate">{params.name || 'Mietimmobilie'}</h2>
                {(params.plz || params.adresse) && (
                  <p className="text-emerald-100 text-sm mt-0.5">📍 {params.plz} {params.adresse}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {hasChanges && (
                  <button onClick={handleSave}
                    className="px-4 py-2 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 font-bold text-sm shadow-sm transition-colors">
                    Speichern
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white text-2xl leading-none">&times;</button>
              </div>
            </div>
          </div>
          {/* KPI Strip */}
          <div className="grid grid-cols-3 bg-white border-b border-gray-200 divide-x divide-gray-100">
            <div className={`px-5 py-3 ${monatsCashflow >= 0 ? '' : ''}`}>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Monatl. Cashflow</div>
              <div className={`text-xl font-black ${monatsCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {monatsCashflow >= 0 ? '+' : ''}{formatCurrency(monatsCashflow)}
              </div>
            </div>
            <div className="px-5 py-3">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jährl. Cashflow</div>
              <div className={`text-xl font-black ${jahresCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow)}
              </div>
            </div>
            <div className="px-5 py-3">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Bisheriger Gewinn</div>
              <div className={`text-xl font-black text-violet-600`}>
                {bisherigeCashflowGesamt >= 0 ? '+' : ''}{formatCurrency(bisherigeCashflowGesamt)}
              </div>
              <div className="text-xs text-gray-400">{monateSeitStart} Monate</div>
            </div>
          </div>
          {/* Tab-Navigation */}
          <div className="flex gap-1 bg-slate-100 p-1">
            {[
              { id: 'uebersicht', label: '📊 Übersicht' },
              { id: 'mieter', label: `👤 Mieter${mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length > 0 ? ` (${mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length})` : ''}` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Mieter Tab */}
          {activeTab === 'mieter' && (
            <MieterDashboard
              mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id)}
              portfolio={[immobilie]}
              onDelete={onDeleteMieter}
              onSave={onSaveMieter}
              nkAbrechnungen={nkAbrechnungen}
              onSaveNK={onSaveNK}
              onDeleteNK={onDeleteNK}
            />
          )}
          {activeTab === 'uebersicht' && <>
          {/* Cashflow-Aufschlüsselung */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">Cashflow-Aufschlüsselung</h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
                <span className="text-sm text-gray-600">
                  Einnahmen — {params.anzahlZimmerVermietet} Zimmer × {formatCurrency(params.untermieteProZimmer)}
                </span>
                <span className="text-sm font-bold text-emerald-600">+{formatCurrency(einnahmen)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
                <span className="text-sm text-gray-600">Eigene Warmmiete</span>
                <span className="text-sm font-bold text-red-500">−{formatCurrency(params.eigeneWarmmiete)}</span>
              </div>
              {zusatzkosten > 0 && (
                <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
                  <span className="text-sm text-gray-600">
                    Nebenkosten
                    <span className="text-xs text-gray-400 ml-2">
                      Strom {formatCurrency(params.arbitrageStrom||0)} · Internet {formatCurrency(params.arbitrageInternet||0)} · GEZ {formatCurrency(params.arbitrageGEZ??18.36)}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-red-500">−{formatCurrency(zusatzkosten)}</span>
                </div>
              )}
              <div className={`flex justify-between items-center pt-3 font-black text-base ${monatsCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <span>= Monatlicher Cashflow</span>
                <span>{monatsCashflow >= 0 ? '+' : ''}{formatCurrency(monatsCashflow)}</span>
              </div>
            </div>
          </div>

          {/* Bearbeitungsbereich */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Grunddaten */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">📍 Grunddaten</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name/Bezeichnung</label>
                  <input
                    type="text"
                    value={params.name}
                    onChange={(e) => updateParams({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="z.B. Mitarbeiter-WG München"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">PLZ</label>
                    <input
                      type="text"
                      value={params.plz}
                      onChange={(e) => updateParams({ plz: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mietvertrag seit</label>
                    <input
                      type="date"
                      value={params.mietvertragStart}
                      onChange={(e) => updateParams({ mietvertragStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mietvertragsende</label>
                    <input
                      type="date"
                      value={params.mietvertragEnde}
                      onChange={(e) => updateParams({ mietvertragEnde: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${vertragsBeendet ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {params.mietvertragEnde && (
                      <button
                        type="button"
                        onClick={() => updateParams({ mietvertragEnde: '' })}
                        className="text-xs text-gray-400 hover:text-red-500 mt-1"
                      >
                        ✕ Datum entfernen
                      </button>
                    )}
                  </div>
                  <div className="flex items-end pb-2">
                    {vertragsBeendet && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                        Cashflow wird ab Vertragsende nicht mehr berechnet.
                      </div>
                    )}
                    {vertragsende && !vertragsBeendet && (
                      <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                        Noch {Math.ceil((vertragsende - heute) / (1000 * 60 * 60 * 24 * 30))} Monate verbleibend.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={params.adresse}
                    onChange={(e) => updateParams({ adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Musterstraße 123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Wohnfläche (m²)</label>
                    <input
                      type="number"
                      value={params.wohnflaeche}
                      onChange={(e) => updateParams({ wohnflaeche: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gesamtzahl Zimmer</label>
                    <input
                      type="number"
                      value={params.zimmer}
                      onChange={(e) => updateParams({ zimmer: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Finanzdaten */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">💰 Arbitrage-Kalkulation</h3>
              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <label className="block text-sm font-medium text-red-700 mb-1">Eigene Warmmiete (€/Monat)</label>
                  <input
                    type="number"
                    value={params.eigeneWarmmiete}
                    onChange={(e) => updateParams({ eigeneWarmmiete: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg font-semibold"
                  />
                  <p className="text-xs text-red-600 mt-1">Die Miete, die du an den Vermieter zahlst</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <label className="block text-sm font-medium text-green-700 mb-2">Untervermietung</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Vermietete Zimmer</label>
                      <input
                        type="number"
                        value={params.anzahlZimmerVermietet}
                        onChange={(e) => updateParams({ anzahlZimmerVermietet: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="0"
                        max={params.zimmer}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Miete pro Zimmer (€)</label>
                      <input
                        type="number"
                        value={params.untermieteProZimmer}
                        onChange={(e) => updateParams({ untermieteProZimmer: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Einnahmen: {params.anzahlZimmerVermietet} × {formatCurrency(params.untermieteProZimmer)} = <strong>{formatCurrency(einnahmen)}</strong>
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">📊 Zusätzliche Kosten (für Steuerberater)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">⚡ Strom</label>
                      <input
                        type="number"
                        value={params.arbitrageStrom || 0}
                        onChange={(e) => updateParams({ arbitrageStrom: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">🌐 Internet</label>
                      <input
                        type="number"
                        value={params.arbitrageInternet || 0}
                        onChange={(e) => updateParams({ arbitrageInternet: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">📺 GEZ</label>
                      <input
                        type="number"
                        value={params.arbitrageGEZ ?? 18.36}
                        onChange={(e) => updateParams({ arbitrageGEZ: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="18.36"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Summe: <strong>{formatCurrency(zusatzkosten)}</strong>/Monat · <strong>{formatCurrency(zusatzkosten * 12)}</strong>/Jahr
                  </p>
                </div>

                {/* Mietanpassungen */}
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-yellow-800">📅 Mietanpassungen</label>
                    <button
                      type="button"
                      onClick={() => {
                        const neu = { datum: new Date().toISOString().split('T')[0], eigeneWarmmiete: params.eigeneWarmmiete, untermieteProZimmer: params.untermieteProZimmer };
                        updateParams({ mietAnpassungen: [...(params.mietAnpassungen || []), neu] });
                      }}
                      className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-2 py-1 rounded"
                    >
                      + Anpassung
                    </button>
                  </div>
                  <p className="text-[10px] text-yellow-700 mb-2">Trage Änderungen an deiner Miete oder Untermiete mit Datum ein – wird für den korrekten Steuerexport verwendet.</p>
                  {(params.mietAnpassungen || []).length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic bg-white p-2 rounded border border-yellow-100">Keine Anpassungen → aktuelle Werte gelten durchgehend</p>
                  ) : (
                    <div className="space-y-2">
                      {(params.mietAnpassungen || [])
                        .map((anp, originalIdx) => ({ ...anp, originalIdx }))
                        .sort((a, b) => new Date(a.datum) - new Date(b.datum))
                        .map((anp) => (
                          <div key={anp.originalIdx} className="bg-white rounded border border-yellow-200 p-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] text-gray-500 w-10 shrink-0">Datum</span>
                              <input
                                type="date"
                                value={anp.datum}
                                onChange={(e) => {
                                  const neu = [...(params.mietAnpassungen || [])];
                                  neu[anp.originalIdx] = { ...neu[anp.originalIdx], datum: e.target.value };
                                  updateParams({ mietAnpassungen: neu });
                                }}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const neu = (params.mietAnpassungen || []).filter((_, i) => i !== anp.originalIdx);
                                  updateParams({ mietAnpassungen: neu });
                                }}
                                className="text-red-400 hover:text-red-600 text-xs px-1 shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-600 shrink-0">Warmmiete</span>
                                <input
                                  type="number"
                                  value={anp.eigeneWarmmiete ?? ''}
                                  placeholder="—"
                                  onChange={(e) => {
                                    const neu = [...(params.mietAnpassungen || [])];
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                    neu[anp.originalIdx] = { ...neu[anp.originalIdx], eigeneWarmmiete: val };
                                    updateParams({ mietAnpassungen: neu });
                                  }}
                                  className="w-full text-xs border border-red-200 rounded px-1 py-0.5 text-right"
                                />
                                <span className="text-[10px] text-gray-400">€</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-green-600 shrink-0">Untermiete</span>
                                <input
                                  type="number"
                                  value={anp.untermieteProZimmer ?? ''}
                                  placeholder="—"
                                  onChange={(e) => {
                                    const neu = [...(params.mietAnpassungen || [])];
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                    neu[anp.originalIdx] = { ...neu[anp.originalIdx], untermieteProZimmer: val };
                                    updateParams({ mietAnpassungen: neu });
                                  }}
                                  className="w-full text-xs border border-green-200 rounded px-1 py-0.5 text-right"
                                />
                                <span className="text-[10px] text-gray-400">€</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prognose */}
          <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">📈 Kumulierter Cashflow</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[[1,'1 Jahr'],[2,'2 Jahre'],[3,'3 Jahre'],[5,'5 Jahre']].map(([mult, label]) => (
                <div key={mult} className={`rounded-xl p-4 text-center border ${jahresCashflow >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="text-xs text-gray-400 font-medium mb-1">{label}</div>
                  <div className={`text-lg font-black ${jahresCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow * mult)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>}
        </div>
      </div>
    </div>
  );
};

export default MietimmobilieDetail;
