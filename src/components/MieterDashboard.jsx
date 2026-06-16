import { useState } from 'react';
import MieterFormular from './MieterFormular';
import MieterAuszug from './MieterAuszug';
import NKAbrechnungListe from './NKAbrechnungListe';

const MieterDashboard = ({ mieterListe, portfolio, onAdd, onEdit, onDelete, onSave, nkAbrechnungen, onSaveNK, onDeleteNK }) => {
  const [selectedMieter, setSelectedMieter] = useState(null);
  const [showAuszug, setShowAuszug] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filter, setFilter] = useState('aktiv'); // 'aktiv' | 'inaktiv' | 'alle'
  const [expandedNK, setExpandedNK] = useState(null); // mieter.id or null

  const getImmobilieName = (id) => {
    const immo = portfolio.find(i => i.id === id);
    return immo ? (immo.name || immo.adresse || 'Immobilie') : 'Unbekannt';
  };

  const aktiveMieter = mieterListe.filter(m => m.aktiv !== false);
  const inaktiveMieter = mieterListe.filter(m => m.aktiv === false);
  const anzeigedMieter = filter === 'aktiv' ? aktiveMieter : filter === 'inaktiv' ? inaktiveMieter : mieterListe;

  // Stats
  const kautionOffen = aktiveMieter.filter(m => !m.kaution_bezahlt && m.kaution_betrag > 0).length;
  const mahnstufeAktiv = aktiveMieter.filter(m => m.mahnstufe > 0).length;

  const mahnstufeLabel = (s) => ['—', '1. Mahnung', '2. Mahnung', 'Letzte Mahnung'][s] || '—';
  const mahnstufeColor = (s) => ['text-gray-400', 'text-yellow-600', 'text-orange-600', 'text-red-700'][s] || 'text-gray-400';

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-2xl font-bold text-blue-700">{aktiveMieter.length}</div>
          <div className="text-sm text-gray-500">Aktive Mieter</div>
        </div>
        <div className={`bg-white rounded-xl p-4 shadow ${kautionOffen > 0 ? 'border-l-4 border-red-400' : ''}`}>
          <div className={`text-2xl font-bold ${kautionOffen > 0 ? 'text-red-600' : 'text-green-600'}`}>{kautionOffen}</div>
          <div className="text-sm text-gray-500">Kaution offen</div>
        </div>
        <div className={`bg-white rounded-xl p-4 shadow ${mahnstufeAktiv > 0 ? 'border-l-4 border-orange-400' : ''}`}>
          <div className={`text-2xl font-bold ${mahnstufeAktiv > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{mahnstufeAktiv}</div>
          <div className="text-sm text-gray-500">Mahnungen aktiv</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-2xl font-bold text-gray-600">{inaktiveMieter.length}</div>
          <div className="text-sm text-gray-500">Ausgezogen</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {[['aktiv', 'Aktiv'], ['inaktiv', 'Ausgezogen'], ['alle', 'Alle']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === val ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditData(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-2"
        >
          + Mieter hinzufügen
        </button>
      </div>

      {/* Mieter List */}
      {anzeigedMieter.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-gray-500">{filter === 'inaktiv' ? 'Keine ausgezogenen Mieter.' : 'Noch keine Mieter angelegt.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anzeigedMieter.map(mieter => {
            const kautionStatus = !mieter.kaution_betrag ? 'keine' : mieter.kaution_bezahlt ? 'bezahlt' : 'offen';
            return (
              <div key={mieter.id} className={`bg-white rounded-xl shadow p-4 border-l-4 ${mieter.aktiv === false ? 'border-gray-300 opacity-70' : mieter.mahnstufe > 0 ? 'border-orange-400' : 'border-blue-400'}`}>
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{mieter.name}</span>
                      {mieter.aktiv === false && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ausgezogen</span>}
                      {mieter.mahnstufe > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 ${mahnstufeColor(mieter.mahnstufe)}`}>
                          ⚠️ {mahnstufeLabel(mieter.mahnstufe)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-3">
                      <span>🏠 {getImmobilieName(mieter.immobilie_id)}</span>
                      {mieter.zimmer_bezeichnung && <span>📍 {mieter.zimmer_bezeichnung}</span>}
                      {mieter.mietbeginn && <span>📅 seit {new Date(mieter.mietbeginn).toLocaleDateString('de-DE')}</span>}
                      {mieter.kaltmiete && <span>💶 {Number(mieter.kaltmiete).toLocaleString('de-DE')} €/Mon</span>}
                      {mieter.email && <span>✉️ {mieter.email}</span>}
                      {mieter.telefon && <span>📞 {mieter.telefon}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {/* Kaution Badge */}
                      {mieter.kaution_betrag > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          mieter.kaution_zurueck ? 'bg-gray-100 text-gray-500' :
                          kautionStatus === 'bezahlt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {mieter.kaution_zurueck ? '↩️ Kaution zurück' : kautionStatus === 'bezahlt' ? '✅ Kaution bezahlt' : `🔴 Kaution offen (${Number(mieter.kaution_betrag).toLocaleString('de-DE')} €)`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => setExpandedNK(expandedNK === mieter.id ? null : mieter.id)}
                      className={`px-3 py-1.5 text-xs border rounded-lg ${expandedNK === mieter.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}`}
                    >
                      📄 NK {(nkAbrechnungen||[]).filter(a=>a.mieter_id===mieter.id).length > 0 ? `(${(nkAbrechnungen||[]).filter(a=>a.mieter_id===mieter.id).length})` : ''}
                    </button>
                    {mieter.aktiv !== false && (
                      <button
                        onClick={() => { setSelectedMieter(mieter); setShowAuszug(true); }}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        🚪 Auszug
                      </button>
                    )}
                    <button
                      onClick={() => { setEditData(mieter); setShowForm(true); }}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(mieter.id)}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {expandedNK === mieter.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <NKAbrechnungListe
                      mieter={mieter}
                      nkAbrechnungen={nkAbrechnungen || []}
                      portfolio={portfolio}
                      onSave={onSaveNK}
                      onDelete={onDeleteNK}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Formular Modal */}
      {showForm && (
        <MieterFormular
          mieter={editData}
          portfolio={portfolio}
          onSave={async (data) => { await onSave(data); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Auszug Modal */}
      {showAuszug && selectedMieter && (
        <MieterAuszug
          mieter={selectedMieter}
          onSave={async (data) => { await onSave(data); setShowAuszug(false); setSelectedMieter(null); }}
          onClose={() => { setShowAuszug(false); setSelectedMieter(null); }}
        />
      )}
    </div>
  );
};

export default MieterDashboard;
