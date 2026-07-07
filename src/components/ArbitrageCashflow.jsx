import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Eye, CalendarDays } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleWarmmiete, getAktuelleUntermiete, berechneHistorischenArbitrageCashflow } from '../utils/miete.js';

const ArbitrageCashflow = ({ params }) => {
  const [tab, setTab] = useState('aktuell');

  const aktWarmmiete = getAktuelleWarmmiete(params);
  const aktUntermiete = getAktuelleUntermiete(params);
  const einnahmen = params.anzahlZimmerVermietet * aktUntermiete;
  const zusatzkosten = (params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36);
  const ausgaben = aktWarmmiete + zusatzkosten;
  const monatsCF = einnahmen - ausgaben;
  const jahresCF = monatsCF * 12;

  const mietvertragStart = params.mietvertragStart ? new Date(params.mietvertragStart) : null;
  const vertragsende = params.mietvertragEnde ? new Date(params.mietvertragEnde) : null;
  const heute = new Date();
  const bisWann = vertragsende && vertragsende < heute ? vertragsende : heute;

  const bisherigeCF = mietvertragStart
    ? berechneHistorischenArbitrageCashflow(params, mietvertragStart, bisWann)
    : 0;

  const startJahr = mietvertragStart ? mietvertragStart.getFullYear() : heute.getFullYear();
  const aktuellesJahr = heute.getFullYear();

  // Jahres-Verlauf: für jedes Jahr den historisch korrekten CF berechnen
  const verlaufDaten = useMemo(() => {
    if (!mietvertragStart) return [];
    const data = [];
    for (let j = startJahr; j <= aktuellesJahr + 1; j++) {
      const vonJ = new Date(j, 0, 1);
      const bisJ = new Date(j, 11, 31);
      const von = vonJ < mietvertragStart ? mietvertragStart : vonJ;
      const bis = vertragsende && vertragsende < bisJ ? vertragsende
        : bisJ > bisWann ? bisWann : bisJ;
      if (von > bis) { data.push({ jahr: j, cf: 0, einnahmen: 0, ausgaben: 0 }); continue; }
      const cf = berechneHistorischenArbitrageCashflow(params, von, bis);
      // Grobe Einnahmen/Ausgaben für das Jahr
      const monate = Math.max(1, Math.round((bis - von) / (1000 * 60 * 60 * 24 * 30.44)));
      const anpassungen = (params.mietAnpassungen || []).sort((a, b) => new Date(a.datum) - new Date(b.datum));
      // Letzte Anpassung die im Jahr j oder früher liegt (Mitte des Jahres als Referenz)
      const jahrMitte = new Date(j, 6, 1); // 1. Juli des Jahres
      const lastAnp = anpassungen.filter(a => new Date(a.datum) <= jahrMitte).pop();
      // Fallback auf Basiswert (params.*ProZimmer), NICHT auf aktuelle angepasste Werte
      const jUntermiete = lastAnp?.untermieteProZimmer ?? params.untermieteProZimmer;
      const jWarmmiete = lastAnp?.eigeneWarmmiete ?? params.eigeneWarmmiete;
      const jEinnahmen = params.anzahlZimmerVermietet * jUntermiete * monate;
      const jAusgaben = (jWarmmiete + zusatzkosten) * monate;
      data.push({ jahr: `${j}`, cf: Math.round(cf), einnahmen: Math.round(jEinnahmen), ausgaben: Math.round(jAusgaben) });
    }
    return data;
  }, [params, mietvertragStart, bisWann]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[{ id: 'aktuell', label: <span className="inline-flex items-center gap-1"><BarChart3 size={13}/> Aktuell</span> }, { id: 'verlauf', label: <span className="inline-flex items-center gap-1"><TrendingUp size={13}/> Jahresverlauf</span> }, { id: 'prognose', label: <span className="inline-flex items-center gap-1"><Eye size={13}/> Prognose</span> }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${tab === t.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* AKTUELL */}
      {tab === 'aktuell' && (
        <div className="space-y-4">
          {/* Cashflow-Tabelle */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Cashflow-Aufschlüsselung</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-semibold py-2 px-4">Position</th>
                  <th className="text-right text-xs text-gray-500 font-semibold py-2 px-3">Monat</th>
                  <th className="text-right text-xs text-gray-500 font-semibold py-2 px-3">Jahr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="py-2.5 px-4 text-xs text-gray-600">
                    + Untervermietung
                    <span className="text-gray-400 ml-1">({params.anzahlZimmerVermietet} × {formatCurrency(aktUntermiete)})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs font-semibold text-emerald-600">+{formatCurrency(einnahmen)}</td>
                  <td className="py-2.5 px-3 text-right text-xs font-semibold text-emerald-600">+{formatCurrency(einnahmen * 12)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-xs text-gray-600">− Eigene Warmmiete</td>
                  <td className="py-2.5 px-3 text-right text-xs font-semibold text-red-500">−{formatCurrency(aktWarmmiete)}</td>
                  <td className="py-2.5 px-3 text-right text-xs font-semibold text-red-500">−{formatCurrency(aktWarmmiete * 12)}</td>
                </tr>
                {zusatzkosten > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-xs text-gray-600">
                      − Nebenkosten
                      <span className="text-gray-400 ml-1">(Strom {formatCurrency(params.arbitrageStrom || 0)} · Internet {formatCurrency(params.arbitrageInternet || 0)} · GEZ {formatCurrency(params.arbitrageGEZ ?? 18.36)})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-semibold text-red-500">−{formatCurrency(zusatzkosten)}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-semibold text-red-500">−{formatCurrency(zusatzkosten * 12)}</td>
                  </tr>
                )}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="py-3 px-4 text-sm font-bold text-gray-800">= Netto-Cashflow</td>
                  <td className={`py-3 px-3 text-right text-sm font-black ${monatsCF >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {monatsCF >= 0 ? '+' : ''}{formatCurrency(monatsCF)}
                  </td>
                  <td className={`py-3 px-3 text-right text-sm font-black ${jahresCF >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {jahresCF >= 0 ? '+' : ''}{formatCurrency(jahresCF)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bisheriger CF */}
          {mietvertragStart && (
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 border ${bisherigeCF >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Bisher verdient (seit {mietvertragStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })})</p>
                <p className={`text-xl font-black ${bisherigeCF >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {bisherigeCF >= 0 ? '+' : ''}{formatCurrency(bisherigeCF)}
                </p>
              </div>
              <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
                <p className="text-xs text-gray-500 mb-1">Ø pro Monat (historisch)</p>
                {(() => {
                  const monate = Math.max(1, Math.round((bisWann - mietvertragStart) / (1000 * 60 * 60 * 24 * 30.44)));
                  return <p className="text-xl font-black text-indigo-700">{formatCurrency(bisherigeCF / monate)}/Mo.</p>;
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* JAHRESVERLAUF */}
      {tab === 'verlauf' && (
        <div className="space-y-4">
          {verlaufDaten.length > 0 ? (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Cashflow pro Jahr</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={verlaufDaten} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="jahr" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="cf" name="Netto-CF" stroke="#10b981" fill="url(#cfGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-2 px-4 text-gray-500 font-semibold">Jahr</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-semibold">Einnahmen</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-semibold">Ausgaben</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-semibold">Netto-CF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {verlaufDaten.map(d => (
                      <tr key={d.jahr} className="hover:bg-gray-50">
                        <td className="py-2 px-4 font-semibold text-gray-700">{d.jahr}</td>
                        <td className="py-2 px-3 text-right text-emerald-600">+{formatCurrency(d.einnahmen)}</td>
                        <td className="py-2 px-3 text-right text-red-500">−{formatCurrency(d.ausgaben)}</td>
                        <td className={`py-2 px-3 text-right font-bold ${d.cf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {d.cf >= 0 ? '+' : ''}{formatCurrency(d.cf)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <CalendarDays size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Kein Mietvertrag-Startdatum hinterlegt</p>
              <p className="text-xs mt-1">Trage das Startdatum unter Übersicht → Grunddaten ein</p>
            </div>
          )}
        </div>
      )}

      {/* PROGNOSE */}
      {tab === 'prognose' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[[1,'1 Jahr'],[2,'2 Jahre'],[3,'3 Jahre'],[5,'5 Jahre']].map(([mult, label]) => (
              <div key={mult} className={`rounded-xl p-4 text-center border ${jahresCF >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className="text-xs text-gray-400 font-medium mb-1">{label}</div>
                <div className={`text-lg font-black ${jahresCF >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {jahresCF >= 0 ? '+' : ''}{formatCurrency(jahresCF * mult)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(monatsCF)}/Mo.</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Kumulierter Cashflow (Prognose)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={Array.from({ length: 6 }, (_, i) => ({
                  label: `Jahr ${i + 1}`,
                  kumuliert: Math.round(jahresCF * (i + 1)),
                }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="kumuliert" name="Kum. CF" stroke="#10b981" fill="url(#progGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArbitrageCashflow;
