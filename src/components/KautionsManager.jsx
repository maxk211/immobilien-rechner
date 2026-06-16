import { useState } from 'react';

const KautionsManager = ({ params, updateParams }) => {
  const kautionen = params.kautionen || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({
    mieterName: '', mietbeginn: '', mietende: '',
    vereinbartBetrag: 0, eingegangen: false, eingegangenAm: '', eingegangenBetrag: 0,
    zurueckgegeben: false, zurueckgegebenAm: '', abzugBetrag: 0, abzugGrund: '',
  });

  const totalGehalten = kautionen
    .filter(k => k.eingegangen && !k.zurueckgegeben)
    .reduce((s, k) => s + (Number(k.eingegangenBetrag) || 0), 0);
  const anzahlOffen = kautionen.filter(k => !k.eingegangen).length;

  const openForm = (idx = null) => {
    setEditIdx(idx);
    setForm(idx !== null ? { ...kautionen[idx] } : {
      mieterName: '', mietbeginn: '', mietende: '',
      vereinbartBetrag: 0, eingegangen: false, eingegangenAm: '', eingegangenBetrag: 0,
      zurueckgegeben: false, zurueckgegebenAm: '', abzugBetrag: 0, abzugGrund: '',
    });
    setShowForm(true);
  };

  const saveForm = () => {
    const neu = [...kautionen];
    if (editIdx !== null) neu[editIdx] = { ...form };
    else neu.push({ id: Date.now(), ...form });
    updateParams({ ...params, kautionen: neu });
    setShowForm(false);
  };

  const deleteKaution = (idx) => {
    updateParams({ ...params, kautionen: kautionen.filter((_, i) => i !== idx) });
  };

  const statusBadge = (k) => {
    if (k.zurueckgegeben) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">↩️ Zurückgegeben</span>;
    if (k.eingegangen) return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">✅ Eingegangen</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">🔴 Ausstehend</span>;
  };

  return (
    <div className="space-y-4">
      {/* Übersicht */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-600 font-semibold uppercase mb-1">Kaution gehalten</p>
          <p className="text-2xl font-black text-emerald-700">{totalGehalten.toLocaleString('de-DE')} €</p>
        </div>
        <div className={`${anzahlOffen > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 text-center`}>
          <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Ausstehend</p>
          <p className={`text-2xl font-black ${anzahlOffen > 0 ? 'text-red-600' : 'text-gray-400'}`}>{anzahlOffen}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Gesamt Einträge</p>
          <p className="text-2xl font-black text-blue-700">{kautionen.length}</p>
        </div>
      </div>

      <button
        onClick={() => openForm()}
        className="w-full py-2 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-50"
      >
        + Kaution hinzufügen
      </button>

      {/* Liste */}
      {kautionen.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">Noch keine Kautionen erfasst.</p>
      ) : (
        <div className="space-y-3">
          {kautionen.map((k, idx) => (
            <div key={k.id || idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{k.mieterName || 'Unbekannter Mieter'}</p>
                  <p className="text-xs text-gray-500">
                    {k.mietbeginn && `Mietbeginn: ${k.mietbeginn}`}
                    {k.mietende && ` · Ende: ${k.mietende}`}
                  </p>
                </div>
                {statusBadge(k)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-500 text-xs">Vereinbart</span>
                  <p className="font-semibold">{(Number(k.vereinbartBetrag) || 0).toLocaleString('de-DE')} €</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Eingegangen</span>
                  <p className="font-semibold">{k.eingegangen ? `${(Number(k.eingegangenBetrag) || 0).toLocaleString('de-DE')} €` : '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Abzug</span>
                  <p className="font-semibold text-red-600">{k.abzugBetrag > 0 ? `-${Number(k.abzugBetrag).toLocaleString('de-DE')} €` : '—'}</p>
                </div>
              </div>
              {k.abzugGrund && <p className="text-xs text-gray-500 mb-2">Abzugsgrund: {k.abzugGrund}</p>}
              <div className="flex gap-2">
                <button onClick={() => openForm(idx)} className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">✏️ Bearbeiten</button>
                <button onClick={() => deleteKaution(idx)} className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️ Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formular Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editIdx !== null ? '✏️ Kaution bearbeiten' : '+ Kaution erfassen'}</h3>
            <div className="space-y-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mieter/in</label>
                <input value={form.mieterName} onChange={e => setForm({...form, mieterName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mietbeginn</label>
                  <input type="date" value={form.mietbeginn} onChange={e => setForm({...form, mietbeginn: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mietende</label>
                  <input type="date" value={form.mietende} onChange={e => setForm({...form, mietende: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Vereinbarter Kautionsbetrag (€)</label>
                <input type="number" value={form.vereinbartBetrag} onChange={e => setForm({...form, vereinbartBetrag: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-sm text-right" />
              </div>
              <div className="border-t pt-3">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={form.eingegangen} onChange={e => setForm({...form, eingegangen: e.target.checked})} className="w-4 h-4 rounded accent-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">✅ Kaution eingegangen</span>
                </label>
                {form.eingegangen && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Eingegangen am</label>
                      <input type="date" value={form.eingegangenAm} onChange={e => setForm({...form, eingegangenAm: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div><label className="block text-xs text-gray-600 mb-1">Betrag (€)</label>
                      <input type="number" value={form.eingegangenBetrag} onChange={e => setForm({...form, eingegangenBetrag: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-sm text-right" />
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t pt-3">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={form.zurueckgegeben} onChange={e => setForm({...form, zurueckgegeben: e.target.checked})} className="w-4 h-4 rounded" />
                  <span className="text-sm font-semibold text-gray-700">↩️ Kaution zurückgegeben</span>
                </label>
                {form.zurueckgegeben && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-600 mb-1">Zurückgegeben am</label>
                        <input type="date" value={form.zurueckgegebenAm} onChange={e => setForm({...form, zurueckgegebenAm: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>
                      <div><label className="block text-xs text-gray-600 mb-1">Abzug (€)</label>
                        <input type="number" value={form.abzugBetrag} onChange={e => setForm({...form, abzugBetrag: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-sm text-right" />
                      </div>
                    </div>
                    <div><label className="block text-xs text-gray-600 mb-1">Abzugsgrund</label>
                      <input value={form.abzugGrund} onChange={e => setForm({...form, abzugGrund: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="z.B. Schäden, ausst. Nebenkosten..." />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Abbrechen</button>
              <button onClick={saveForm} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default KautionsManager;
