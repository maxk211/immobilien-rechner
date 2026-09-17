import { Building2, Wallet, CalendarDays, TrendingUp, Clock, Check, FileText, AlertTriangle, Info, X } from 'lucide-react';
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
        <div className="bg-clay-50 border border-clay-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-clay-700">{formatCurrency(gesamtAngespart)}</div>
          <div className="text-xs text-clay-500 font-semibold mt-1">Gesamt angespart</div>
        </div>
        <div className="bg-honey-50 border border-honey-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-honey-700">{formatCurrency(gesamtSparrate)}/Mo.</div>
          <div className="text-xs text-honey-500 font-semibold mt-1">Monatliche Sparrate gesamt</div>
          <div className="text-[10px] text-honey-400 mt-0.5">fließt in Cashflow-Berechnung ein</div>
        </div>
      </div>

      {/* Verträge */}
      {vertraege.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-3"><Building2 size={40} className="text-cream-300" /></div>
          <p className="text-cream-500 text-sm">Noch kein Bausparvertrag angelegt.</p>
          <p className="text-cream-400 text-xs mt-1">Die monatliche Sparrate wird im Cashflow als Abfluss eingerechnet.</p>
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
              <div key={v.id} className={`bg-white border-2 rounded-2xl p-5 space-y-4 ${istZuteilungsreif ? 'border-sage-300' : 'border-cream-200'}`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 size={22} className="text-cream-500" />
                    <div>
                      <input
                        type="text"
                        value={v.vertragsnummer}
                        onChange={e => updateVertrag(v.id, 'vertragsnummer', e.target.value)}
                        placeholder="Vertragsnummer / Bezeichnung"
                        className="text-base font-bold text-cream-800 border-0 border-b-2 border-dashed border-cream-200 focus:border-clay-400 outline-none bg-transparent w-64"
                      />
                      {istZuteilungsreif && (
                        <span className="ml-2 text-xs bg-sage-100 text-sage-700 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5"><Check size={10} /> Zuteilungsreif</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteVertrag(v.id)} className="text-brick-400 hover:text-brick-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-brick-50 transition-colors flex items-center gap-1">
                    <X size={14} /> Löschen
                  </button>
                </div>

                {/* Felder */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-cream-500 font-semibold mb-1.5 flex items-center gap-1"><Wallet size={12} /> Aktueller Sparbetrag</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={v.aktuellerSparbetrag || ''}
                        onChange={e => updateVertrag(v.id, 'aktuellerSparbetrag', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-clay-400 focus:border-clay-400"
                      />
                      <span className="text-sm text-cream-400 shrink-0">€</span>
                    </div>
                    <p className="text-[10px] text-cream-400 mt-1">Bereits angespartes Guthaben</p>
                  </div>

                  <div>
                    <label className="block text-xs text-cream-500 font-semibold mb-1.5 flex items-center gap-1"><CalendarDays size={12} /> Monatliche Sparrate</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={v.monatlicheSparrate || ''}
                        onChange={e => updateVertrag(v.id, 'monatlicheSparrate', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-honey-300 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-honey-400 focus:border-honey-400 bg-honey-50"
                      />
                      <span className="text-sm text-cream-400 shrink-0">€/Mo.</span>
                    </div>
                    <p className="text-[10px] text-honey-500 mt-1 font-semibold flex items-center gap-0.5"><AlertTriangle size={10} /> Reduziert monatlichen Cashflow</p>
                  </div>

                  <div>
                    <label className="block text-xs text-cream-500 font-semibold mb-1.5 flex items-center gap-1"><TrendingUp size={12} /> Gesicherter Zinssatz (Darlehen)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={v.gesicherterZinssatz || ''}
                        onChange={e => updateVertrag(v.id, 'gesicherterZinssatz', e.target.value)}
                        placeholder="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-clay-400 focus:border-clay-400"
                      />
                      <span className="text-sm text-cream-400 shrink-0">% p.a.</span>
                    </div>
                    <p className="text-[10px] text-cream-400 mt-1">Zinssatz des BSV-Darlehens nach Zuteilung</p>
                  </div>

                  <div>
                    <label className="block text-xs text-cream-500 font-semibold mb-1.5 flex items-center gap-1"><CalendarDays size={12} /> Zuteilungsreife ab</label>
                    <input
                      type="date"
                      value={v.zuteilungsreifAb || ''}
                      onChange={e => updateVertrag(v.id, 'zuteilungsreifAb', e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:ring-2 focus:ring-clay-400 focus:border-clay-400"
                    />
                    {monateVerbleibend !== null && (
                      <p className="text-[10px] text-clay-500 mt-1 font-semibold">
                        <Clock size={10} className="inline mr-0.5" /> noch ca. {monateVerbleibend} Monate bis zur Zuteilung
                      </p>
                    )}
                    {istZuteilungsreif && (
                      <p className="text-[10px] text-sage-600 mt-1 font-semibold flex items-center gap-0.5"><Check size={10} /> Bereits zuteilungsreif — Sparrate wird im Cashflow nicht mehr abgezogen</p>
                    )}
                  </div>
                </div>

                {/* Notiz */}
                <div>
                  <label className="block text-xs text-cream-500 font-semibold mb-1.5 flex items-center gap-1"><FileText size={12} /> Notiz</label>
                  <input
                    type="text"
                    value={v.notiz || ''}
                    onChange={e => updateVertrag(v.id, 'notiz', e.target.value)}
                    placeholder="z.B. Bausparkasse Schwäbisch Hall, zur Anschlussfinanzierung geplant..."
                    className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:ring-2 focus:ring-cream-300 text-cream-600"
                  />
                </div>

                {/* Zusammenfassung */}
                {(v.aktuellerSparbetrag > 0 || v.monatlicheSparrate > 0) && (
                  <div className="bg-cream-50 rounded-xl p-3 text-xs text-cream-600">
                    <div className="flex items-center justify-between">
                      <span>Angespart:</span>
                      <span className="font-bold text-clay-700">{formatCurrency(parseFloat(v.aktuellerSparbetrag) || 0)}</span>
                    </div>
                    {v.monatlicheSparrate > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <span>Sparrate/Monat:</span>
                        <span className="font-bold text-honey-600">−{formatCurrency(parseFloat(v.monatlicheSparrate) || 0)}</span>
                      </div>
                    )}
                    {v.gesicherterZinssatz > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <span>Darlehen-Zinssatz:</span>
                        <span className="font-bold text-sage-600">{v.gesicherterZinssatz}% p.a.</span>
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
        <div className="bg-honey-50 border border-honey-200 rounded-xl p-4 text-xs text-honey-700">
          <strong className="inline-flex items-center gap-1"><Info size={12} /> Cashflow-Integration:</strong> Die monatlichen Sparraten aller aktiven Bausparverträge werden im Cashflow-Tab als Abfluss berücksichtigt — bis zum jeweiligen Zuteilungsreife-Datum.
        </div>
      )}

      {/* Button */}
      <button
        onClick={addVertrag}
        className="w-full py-3 border-2 border-dashed border-clay-300 text-clay-600 font-semibold text-sm rounded-2xl hover:border-clay-400 hover:bg-clay-50 transition-all"
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
