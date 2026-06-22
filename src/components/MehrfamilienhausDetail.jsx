import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';
import { berechneRendite } from '../utils/berechnung.js';

const MehrfamilienhausDetail = ({ immobilie, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('wohnungen');
  const [wohnungen, setWohnungen] = useState(immobilie.wohnungen || []);
  const [showWohnungForm, setShowWohnungForm] = useState(false);
  const [editWohnungIdx, setEditWohnungIdx] = useState(null);
  const [wohnungForm, setWohnungForm] = useState({ name: '', wohnflaeche: 0, kaltmiete: 0, mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: 0, kautionBezahlt: false });
  const [hasChanges, setHasChanges] = useState(false);

  // Aggregierte Werte aller Wohnungen
  const gesamtKaltmiete = wohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
  const gesamtFlaeche = wohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
  const aktiveMieter = wohnungen.filter(w => w.mieterName && !w.mietende);
  const leerstandQuote = wohnungen.length > 0 ? Math.round((wohnungen.length - aktiveMieter.length) / wohnungen.length * 100) : 0;

  const saveWohnung = () => {
    const neu = [...wohnungen];
    if (editWohnungIdx !== null) neu[editWohnungIdx] = { ...neu[editWohnungIdx], ...wohnungForm };
    else neu.push({ id: Date.now(), ...wohnungForm, forderungen: [], mietAnpassungen: [] });
    setWohnungen(neu);
    setShowWohnungForm(false);
    setHasChanges(true);
  };

  const deleteWohnung = (idx) => {
    if (!confirm('Wohnung wirklich löschen?')) return;
    setWohnungen(wohnungen.filter((_, i) => i !== idx));
    setHasChanges(true);
  };

  const openWohnungForm = (idx = null) => {
    setEditWohnungIdx(idx);
    setWohnungForm(idx !== null ? { ...wohnungen[idx] } : { name: '', wohnflaeche: 0, kaltmiete: 0, mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: 0, kautionBezahlt: false });
    setShowWohnungForm(true);
  };

  const handleSave = () => {
    onSave({ ...immobilie, wohnungen });
    setHasChanges(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-5 text-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏘️</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">MFH · {wohnungen.length} WE</span>
              </div>
              <h2 className="text-xl font-black">{immobilie.name}</h2>
              {immobilie.adresse && <p className="text-sm text-white/80">{immobilie.adresse}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white text-2xl">&times;</button>
          </div>
          {/* KPI Strip */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <p className="text-xs text-white/70">Gesamtmiete</p>
              <p className="text-lg font-black">{formatCurrency(gesamtKaltmiete)}/mo</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <p className="text-xs text-white/70">Gesamtfläche</p>
              <p className="text-lg font-black">{gesamtFlaeche} m²</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <p className="text-xs text-white/70">Vermietet</p>
              <p className="text-lg font-black">{aktiveMieter.length}/{wohnungen.length} WE</p>
            </div>
            <div className={`${leerstandQuote > 0 ? 'bg-red-400/30' : 'bg-white/20'} rounded-xl p-3 text-center`}>
              <p className="text-xs text-white/70">Leerstand</p>
              <p className="text-lg font-black">{leerstandQuote} %</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 flex-shrink-0">
          {[
            { id: 'wohnungen', label: '🏠 Wohnungen' },
            { id: 'kaution', label: '🔑 Kaution' },
            { id: 'cashflow', label: '💰 Cashflow' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab.label}
            </button>
          ))}
          {hasChanges && (
            <button onClick={handleSave} className="ml-auto py-2 px-4 bg-orange-500 text-white text-sm font-bold rounded-lg">
              💾 Speichern
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Wohnungen Tab */}
          {activeTab === 'wohnungen' && (
            <div className="space-y-4">
              <button onClick={() => openWohnungForm()} className="w-full py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 font-semibold hover:bg-orange-50">
                + Wohnung hinzufügen
              </button>
              {wohnungen.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Noch keine Wohnungen angelegt. Füge jetzt die erste Wohneinheit hinzu.</p>
              )}
              {wohnungen.map((w, idx) => (
                <div key={w.id || idx} className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:border-orange-200 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{w.name || `Wohnung ${idx + 1}`}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {w.wohnflaeche > 0 && <span>📐 {w.wohnflaeche} m²</span>}
                        {w.mieterName ? (
                          <span className="text-emerald-600">👤 {w.mieterName}</span>
                        ) : (
                          <span className="text-red-500">🔴 Leerstand</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-orange-600">{formatCurrency(Number(w.kaltmiete) || 0)}</p>
                      <p className="text-xs text-gray-400">/ Monat</p>
                    </div>
                  </div>
                  {/* Kaution Kurzinfo */}
                  {w.kautionBetrag > 0 && (
                    <div className={`text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1 mb-2 ${w.kautionBezahlt ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {w.kautionBezahlt ? '✅' : '🔴'} Kaution: {Number(w.kautionBetrag).toLocaleString('de-DE')} €
                    </div>
                  )}
                  {/* Mietinfos */}
                  {(w.mietbeginn || w.mietende) && (
                    <p className="text-xs text-gray-400 mb-2">
                      {w.mietbeginn && `Seit: ${w.mietbeginn}`}
                      {w.mietende && ` · Bis: ${w.mietende}`}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => openWohnungForm(idx)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">✏️ Bearbeiten</button>
                    <button onClick={() => deleteWohnung(idx)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️ Löschen</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kaution Tab — MFH nutzt KautionsManager auf Basis der Wohnungen */}
          {activeTab === 'kaution' && (
            <div className="space-y-3">
              {wohnungen.map((w, idx) => {
                const kStatus = !w.kautionBetrag ? 'keine' : w.kautionBezahlt ? 'bezahlt' : 'offen';
                return (
                  <div key={w.id || idx} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{w.name || `Wohnung ${idx + 1}`}</p>
                      <p className="text-sm text-gray-500">{w.mieterName || 'kein Mieter'}</p>
                    </div>
                    <div className="text-right">
                      {kStatus === 'keine' && <span className="text-xs text-gray-400">Keine Kaution</span>}
                      {kStatus === 'offen' && <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">🔴 {Number(w.kautionBetrag).toLocaleString('de-DE')} € offen</span>}
                      {kStatus === 'bezahlt' && <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">✅ {Number(w.kautionBetrag).toLocaleString('de-DE')} € bezahlt</span>}
                    </div>
                  </div>
                );
              })}
              {wohnungen.length === 0 && <p className="text-center text-gray-400 py-6">Erst Wohnungen anlegen, dann Kaution verwalten.</p>}
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                💡 Kaution je Wohnung bearbeiten: Wohnungen-Tab → Wohnung bearbeiten
              </div>
            </div>
          )}

          {/* Cashflow Tab — aggregiert über alle Wohnungen */}
          {activeTab === 'cashflow' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-4">💰 Gesamtcashflow (alle Wohnungen)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-green-600">+ Gesamtmieteinnahmen</span>
                    <span className="font-semibold text-green-600">{formatCurrency(gesamtKaltmiete)}/mo</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-red-500">− Instandhaltung</span>
                    <span className="font-semibold text-red-500">−{formatCurrency(immobilie.instandhaltung || 0)}/mo</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-red-500">− Verwaltung</span>
                    <span className="font-semibold text-red-500">−{formatCurrency(immobilie.verwaltung || 0)}/mo</span>
                  </div>
                  {immobilie.hausgeld > 0 && (
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-red-500">− Hausgeld</span>
                      <span className="font-semibold text-red-500">−{formatCurrency(immobilie.hausgeld)}/mo</span>
                    </div>
                  )}
                  {(() => {
                    const ergebnis = berechneRendite({ ...immobilie, kaltmiete: gesamtKaltmiete });
                    const kreditrate = ergebnis.monatlicheRate;
                    const kosten = (immobilie.instandhaltung || 0) + (immobilie.verwaltung || 0) + (immobilie.hausgeld || 0);
                    const cashflow = gesamtKaltmiete - kosten - kreditrate;
                    return (
                      <>
                        {kreditrate > 0 && (
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-red-500">− Kreditrate</span>
                            <span className="font-semibold text-red-500">−{formatCurrency(kreditrate)}/mo</span>
                          </div>
                        )}
                        <div className={`flex justify-between py-2 mt-1 rounded-lg px-2 ${cashflow >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          <span className={`font-bold ${cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>= Netto-Cashflow</span>
                          <span className={`font-black text-lg ${cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}/mo</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wohnung Form Modal */}
      {showWohnungForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editWohnungIdx !== null ? '✏️ Wohnung bearbeiten' : '+ Wohnung hinzufügen'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bezeichnung</label>
                <input value={wohnungForm.name} onChange={e => setWohnungForm({...wohnungForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="z.B. EG links, OG rechts, Dachgeschoss" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Wohnfläche (m²)</label>
                  <input type="number" value={wohnungForm.wohnflaeche} onChange={e => setWohnungForm({...wohnungForm, wohnflaeche: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-right" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Kaltmiete (€/mo)</label>
                  <input type="number" value={wohnungForm.kaltmiete} onChange={e => setWohnungForm({...wohnungForm, kaltmiete: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-right" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mieter/in</label>
                <input value={wohnungForm.mieterName} onChange={e => setWohnungForm({...wohnungForm, mieterName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Name des Mieters" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mietbeginn</label>
                  <input type="date" value={wohnungForm.mietbeginn} onChange={e => setWohnungForm({...wohnungForm, mietbeginn: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mietende</label>
                  <input type="date" value={wohnungForm.mietende} onChange={e => setWohnungForm({...wohnungForm, mietende: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">🔑 Kaution</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Betrag (€)</label>
                    <input type="number" value={wohnungForm.kautionBetrag} onChange={e => setWohnungForm({...wohnungForm, kautionBetrag: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-right" />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={wohnungForm.kautionBezahlt} onChange={e => setWohnungForm({...wohnungForm, kautionBezahlt: e.target.checked})} className="w-4 h-4 rounded accent-emerald-500" />
                      <span className="text-sm text-gray-700">Bezahlt</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowWohnungForm(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Abbrechen</button>
              <button onClick={saveWohnung} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MehrfamilienhausDetail;
