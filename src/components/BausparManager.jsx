import { formatCurrency } from '../utils/format.js';

const BausparManager = ({ params, updateParams }) => {
  const vertraege = params.bausparvertraege || [];

  const saveVertraege = (neu) => {
    updateParams({ ...params, bausparvertraege: neu });
  };

  const addVertrag = () => {
    const neuer = {
      id: Date.now(),
      vertragsnummer: '',
      aktuellerSparbetrag: 0,
      monatlicheSparrate: 0,
      gesicherterZinssatz: 0,
      zuteilungsreifAb: '',
      notiz: '',
    };
    saveVertraege([...vertraege, neuer]);
  };

  const updateVertrag = (id, feld, wert) => {
    saveVertraege(vertraege.map(v => v.id === id ? { ...v, [feld]: wert } : v));
  };

  const deleteVertrag = (id) => saveVertraege(vertraege.filter(v => v.id !== id));

  const gesamtSparrate = vertraege.reduce((s, v) => s + (parseFloat(v.monatlicheSparrate) || 0), 0);
  const gesamtAngespart = vertraege.reduce((s, v) => s + (parseFloat(v.aktuellerSparbetrag) || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header-KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-indigo-700">{formatCurrency(gesamtAngespart)}</div>
          <div className="text-xs text-indigo-500 font-semibold mt-1">Gesamt angespart</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-amber-700">{formatCurrency(gesamtSparrate)}/Mo.</div>
          <div className="text-xs text-amber-500 font-semibold mt-1">Monatliche Sparrate gesamt</div>
          <div className="text-[10px] text-amber-400 mt-0.5">fließt in Cashflow-Berechnung ein</div>
        </div>
      </div>

      {/* Verträge */}
      {vertraege.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🏗</div>
          <p className="text-gray-500 text-sm">Noch kein Bausparvertrag angelegt.</p>
          <p className="text-gray-400 text-xs mt-1">Die monatliche Sparrate wird im Cashflow als Abfluss eingerechnet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vertraege.map(v => {
            const zuteilungDatum = v.zuteilungsreifAb ? new Date(v.zuteilungsreifAb) : null;
            const istZuteilungsreif = zuteilungDatum && zuteilungDatum <= new Date();
            const monateVerbleibend = zuteilungDatum && !istZuteilungsreif
              ? Math.round((zuteilungDatum - new Date()) / (1000 * 60 * 60 * 24 * 30.44))
              : null;

            return (
              <div key={v.id} className={`bg-white border-2 rounded-2xl p-5 space-y-4 ${istZuteilungsreif ? 'border-emerald-300' : 'border-gray-200'}`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏗</span>
                    <div>
                      <input
                        type="text"
                        value={v.vertragsnummer}
                        onChange={e => updateVertrag(v.id, 'vertragsnummer', e.target.value)}
                        placeholder="Vertragsnummer / Bezeichnung"
                        className="text-base font-bold text-gray-800 border-0 border-b-2 border-dashed border-gray-200 focus:border-indigo-400 outline-none bg-transparent w-64"
                      />
                      {istZuteilungsreif && (
                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">✓ Zuteilungsreif</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteVertrag(v.id)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                    ✕ Löschen
                  </button>
                </div>

                {/* Felder */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1.5">💰 Aktueller Sparbetrag</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={v.aktuellerSparbetrag || ''}
                        onChange={e => updateVertrag(v.id, 'aktuellerSparbetrag', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      />
                      <span className="text-sm text-gray-400 shrink-0">€</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Bereits angespartes Guthaben</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1.5">📅 Monatliche Sparrate</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={v.monatlicheSparrate || ''}
                        onChange={e => updateVertrag(v.id, 'monatlicheSparrate', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-amber-50"
                      />
                      <span className="text-sm text-gray-400 shrink-0">€/Mo.</span>
                    </div>
                    <p className="text-[10px] text-amber-500 mt-1 font-semibold">⚠ Reduziert monatlichen Cashflow</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1.5">📈 Gesicherter Zinssatz (Darlehen)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={v.gesicherterZinssatz || ''}
                        onChange={e => updateVertrag(v.id, 'gesicherterZinssatz', e.target.value)}
                        placeholder="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      />
                      <span className="text-sm text-gray-400 shrink-0">% p.a.</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Zinssatz des BSV-Darlehens nach Zuteilung</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1.5">🗓 Zuteilungsreife ab</label>
                    <input
                      type="date"
                      value={v.zuteilungsreifAb || ''}
                      onChange={e => updateVertrag(v.id, 'zuteilungsreifAb', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    />
                    {monateVerbleibend !== null && (
                      <p className="text-[10px] text-indigo-500 mt-1 font-semibold">
                        ⏳ noch ca. {monateVerbleibend} Monate bis zur Zuteilung
                      </p>
                    )}
                    {istZuteilungsreif && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-semibold">✓ Bereits zuteilungsreif — Sparrate wird im Cashflow nicht mehr abgezogen</p>
                    )}
                  </div>
                </div>

                {/* Notiz */}
                <div>
                  <label className="block text-xs text-gray-500 font-semibold mb-1.5">📝 Notiz</label>
                  <input
                    type="text"
                    value={v.notiz || ''}
                    onChange={e => updateVertrag(v.id, 'notiz', e.target.value)}
                    placeholder="z.B. Bausparkasse Schwäbisch Hall, zur Anschlussfinanzierung geplant..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 text-gray-600"
                  />
                </div>

                {/* Zusammenfassung */}
                {(v.aktuellerSparbetrag > 0 || v.monatlicheSparrate > 0) && (
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Angespart:</span>
                      <span className="font-bold text-indigo-700">{formatCurrency(parseFloat(v.aktuellerSparbetrag) || 0)}</span>
                    </div>
                    {v.monatlicheSparrate > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <span>Sparrate/Monat:</span>
                        <span className="font-bold text-amber-600">−{formatCurrency(parseFloat(v.monatlicheSparrate) || 0)}</span>
                      </div>
                    )}
                    {v.gesicherterZinssatz > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <span>Darlehen-Zinssatz:</span>
                        <span className="font-bold text-emerald-600">{v.gesicherterZinssatz}% p.a.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hinweis */}
      {vertraege.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
          <strong>ℹ Cashflow-Integration:</strong> Die monatlichen Sparraten aller aktiven Bausparverträge werden im Cashflow-Tab als Abfluss berücksichtigt — bis zum jeweiligen Zuteilungsreife-Datum.
        </div>
      )}

      {/* Button */}
      <button
        onClick={addVertrag}
        className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 font-semibold text-sm rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all"
      >
        + Bausparvertrag hinzufügen
      </button>
    </div>
  );
};

// Mieteinnahmen-Tracker — Forderungs-basiert
// Jeder Monat seit Kauf hat eine automatische Forderung (erwarteter Mieteingang).
// Zahlungen werden gegen diese Forderung gebucht. Offene Forderungen bleiben sichtbar.

export default BausparManager;
