import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format.js';
import { berechneHistorischenArbitrageCashflow, getAktuelleWarmmiete, getAktuelleUntermiete } from '../utils/miete.js';

/**
 * Steuerberechnung für Arbitrage-Modell (Untervermietung, §21 EStG).
 * Einnahmen aus Untervermietung sind zu versteuern;
 * anteilige Kosten (Warmmiete, NK) können als Werbungskosten abgezogen werden.
 */
const ArbitrageSteuern = ({ params, onUpdateParams }) => {
  const [steuersatz, setSteuersatz] = useState(params.steuersatz || 30);
  const [tabJahr, setTabJahr] = useState(new Date().getFullYear().toString());

  const aktWarmmiete = getAktuelleWarmmiete(params);
  const aktUntermiete = getAktuelleUntermiete(params);

  // Anteil vermieteter Zimmer
  const zimmerGesamt = params.zimmer || 1;
  const zimmerVermietet = params.anzahlZimmerVermietet || 0;
  const anteil = zimmerGesamt > 0 ? zimmerVermietet / zimmerGesamt : 0;

  // Jahreszahlen
  const mietvertragStart = params.mietvertragStart ? new Date(params.mietvertragStart) : null;
  const vertragsende = params.mietvertragEnde ? new Date(params.mietvertragEnde) : null;
  const heute = new Date();
  const bisWann = vertragsende && vertragsende < heute ? vertragsende : heute;

  const startJahr = mietvertragStart ? mietvertragStart.getFullYear() : heute.getFullYear();
  const aktuellesJahr = heute.getFullYear();
  const jahre = Array.from({ length: aktuellesJahr - startJahr + 2 }, (_, i) => `${startJahr + i}`);

  // Jahres-Steuerdaten berechnen
  const jahresDaten = useMemo(() => {
    if (!mietvertragStart) return [];
    const anpassungen = [...(params.mietAnpassungen || [])].sort((a, b) => new Date(a.datum) - new Date(b.datum));
    return jahre.map(jStr => {
      const j = parseInt(jStr);
      const vonJ = new Date(j, 0, 1);
      const bisJ = new Date(j, 11, 31);
      const von = vonJ < mietvertragStart ? mietvertragStart : vonJ;
      const bis = vertragsende && vertragsende < bisJ ? vertragsende
        : bisJ > bisWann ? bisWann : bisJ;
      if (von > bis) return { jahr: jStr, einnahmen: 0, werbungskosten: 0, ueberschuss: 0, steuer: 0 };

      // Monate durchgehen
      let einnahmen = 0;
      let wkWarmmiete = 0;
      let wkNK = 0;
      let d = new Date(von.getFullYear(), von.getMonth(), 1);
      const endMonth = new Date(bis.getFullYear(), bis.getMonth(), 1);
      while (d <= endMonth) {
        const monatsMitte = new Date(d.getFullYear(), d.getMonth(), 15);
        let gueltige = null;
        for (const a of anpassungen) { if (new Date(a.datum) <= monatsMitte) gueltige = a; }
        const warmmiete = gueltige?.eigeneWarmmiete ?? (params.eigeneWarmmiete || 0);
        const untermiete = gueltige?.untermieteProZimmer ?? (params.untermieteProZimmer || 0);
        const zk = (params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36);
        einnahmen += zimmerVermietet * untermiete;
        wkWarmmiete += anteil * warmmiete;
        wkNK += anteil * zk;
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
      const werbungskosten = wkWarmmiete + wkNK;
      const ueberschuss = einnahmen - werbungskosten;
      const steuer = Math.max(0, ueberschuss * (steuersatz / 100));
      return { jahr: jStr, einnahmen: Math.round(einnahmen), wkWarmmiete: Math.round(wkWarmmiete), wkNK: Math.round(wkNK), werbungskosten: Math.round(werbungskosten), ueberschuss: Math.round(ueberschuss), steuer: Math.round(steuer) };
    });
  }, [params, steuersatz, mietvertragStart, bisWann]);

  // Aktuell-Ansicht (aktuelles Jahr oder ausgewähltes)
  const aktJahrDaten = jahresDaten.find(d => d.jahr === tabJahr) || {
    einnahmen: zimmerVermietet * aktUntermiete * 12,
    wkWarmmiete: Math.round(anteil * aktWarmmiete * 12),
    wkNK: Math.round(anteil * ((params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36)) * 12),
    werbungskosten: 0, ueberschuss: 0, steuer: 0
  };
  const aktWerbungskosten = aktJahrDaten.wkWarmmiete + aktJahrDaten.wkNK;
  const aktUeberschuss = aktJahrDaten.einnahmen - aktWerbungskosten;
  const aktSteuer = Math.max(0, aktUeberschuss * (steuersatz / 100));
  const aktNettoCF = aktJahrDaten.einnahmen - aktWarmmiete * 12 - ((params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36)) * 12;
  const aktNettoCFnachSteuer = aktNettoCF - aktSteuer;

  const handleSteuersatzChange = (val) => {
    setSteuersatz(val);
    onUpdateParams?.({ steuersatz: val });
  };

  return (
    <div className="space-y-5">
      {/* Steuersatz Slider */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Persönlicher Steuersatz (Grenzsteuersatz)</p>
          <span className="text-lg font-black text-purple-700">{steuersatz} %</span>
        </div>
        <input type="range" min={0} max={45} step={1} value={steuersatz}
          onChange={e => handleSteuersatzChange(Number(e.target.value))}
          className="w-full accent-purple-600" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 %</span><span>14 %</span><span>25 %</span><span>42 %</span><span>45 %</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Tipp: Du zahlst auf Einkünfte aus Untervermietung deinen persönlichen Einkommensteuersatz (§ 21 EStG).
          Bei einem zu versteuernden Einkommen von 50.000 € / Jahr liegt der Grenzsteuersatz bei ca. 35–42 %.
        </p>
      </div>

      {/* Jahr-Auswahl */}
      {jahre.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {jahre.map(j => (
            <button key={j} onClick={() => setTabJahr(j)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${tabJahr === j ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>
              {j}
            </button>
          ))}
        </div>
      )}

      {/* Jahres-Steuererklärung */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
          <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">§ 21 EStG — Einkünfte aus Untervermietung {tabJahr}</p>
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-gray-50 text-sm">
            <tr>
              <td className="py-3 px-4 text-gray-600">
                Einnahmen aus Untervermietung
                <div className="text-xs text-gray-400">{zimmerVermietet} Zimmer × Untermiete × Monate</div>
              </td>
              <td className="py-3 px-4 text-right font-semibold text-emerald-600">+{formatCurrency(aktJahrDaten.einnahmen)}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">
                − Anteilige Warmmiete (Werbungskosten)
                <div className="text-xs text-gray-400">
                  {zimmerVermietet}/{zimmerGesamt} Zimmer = {Math.round(anteil * 100)} % × Warmmiete
                </div>
              </td>
              <td className="py-3 px-4 text-right font-semibold text-red-500">−{formatCurrency(aktJahrDaten.wkWarmmiete)}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">
                − Anteilige Nebenkosten (Werbungskosten)
                <div className="text-xs text-gray-400">{Math.round(anteil * 100)} % × Strom/Internet/GEZ</div>
              </td>
              <td className="py-3 px-4 text-right font-semibold text-red-500">−{formatCurrency(aktJahrDaten.wkNK)}</td>
            </tr>
            <tr className="bg-purple-50 border-t-2 border-purple-200">
              <td className="py-3 px-4 font-bold text-gray-800">
                = Zu versteuernder Überschuss
                <div className="text-xs text-gray-500 font-normal">Zeile 21 der Anlage V</div>
              </td>
              <td className={`py-3 px-4 text-right font-black text-base ${(aktJahrDaten.einnahmen - aktWerbungskosten) >= 0 ? 'text-purple-700' : 'text-emerald-600'}`}>
                {(aktJahrDaten.einnahmen - aktWerbungskosten) >= 0 ? '+' : ''}{formatCurrency(aktJahrDaten.einnahmen - aktWerbungskosten)}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">
                Einkommensteuer auf Überschuss
                <div className="text-xs text-gray-400">{steuersatz} % Grenzsteuersatz</div>
              </td>
              <td className="py-3 px-4 text-right font-semibold text-orange-600">−{formatCurrency(Math.max(0, (aktJahrDaten.einnahmen - aktWerbungskosten) * steuersatz / 100))}</td>
            </tr>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td className="py-3 px-4 font-bold text-gray-800">
                Netto-Cashflow nach Steuern
                <div className="text-xs text-gray-500 font-normal">Cashflow − Steuern</div>
              </td>
              <td className={`py-3 px-4 text-right font-black text-base ${aktNettoCFnachSteuer >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {aktNettoCFnachSteuer >= 0 ? '+' : ''}{formatCurrency(aktNettoCFnachSteuer)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Steuer-Anteil Visualisierung */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Einnahmen-Aufteilung {tabJahr}</p>
        {(() => {
          const total = aktJahrDaten.einnahmen || 1;
          const wk = aktJahrDaten.wkWarmmiete + aktJahrDaten.wkNK;
          const eigenkosten = Math.round(aktWarmmiete * 12 * (1 - anteil));
          const steuerBetrag = Math.round(Math.max(0, (aktJahrDaten.einnahmen - wk) * steuersatz / 100));
          const netto = aktJahrDaten.einnahmen - aktWarmmiete * 12 - ((params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36)) * 12 - steuerBetrag;
          const teile = [
            { label: 'Steuer', wert: steuerBetrag, farbe: '#a855f7', pct: Math.round(steuerBetrag / total * 100) },
            { label: 'Eigene Kosten', wert: eigenkosten + Math.round(((params.arbitrageStrom||0)+(params.arbitrageInternet||0)+(params.arbitrageGEZ??18.36)) * 12 * (1 - anteil)), farbe: '#f87171', pct: 0 },
            { label: 'Werbungskosten (absetzbar)', wert: wk, farbe: '#fb923c', pct: Math.round(wk / total * 100) },
            { label: 'Netto verbleibend', wert: Math.max(0, netto), farbe: '#34d399', pct: 0 },
          ];
          // fill pcts
          const used = teile[0].pct + teile[2].pct;
          teile[1].pct = Math.round(teile[1].wert / total * 100);
          teile[3].pct = Math.max(0, 100 - teile[0].pct - teile[1].pct - teile[2].pct);

          return (
            <div className="space-y-2">
              {/* Balken */}
              <div className="flex rounded-lg overflow-hidden h-5">
                {teile.filter(t => t.pct > 0).map((t, i) => (
                  <div key={i} style={{ width: `${t.pct}%`, backgroundColor: t.farbe }} title={`${t.label}: ${formatCurrency(t.wert)}`} />
                ))}
              </div>
              {/* Legende */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {teile.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: t.farbe }} />
                    <div>
                      <span className="text-xs text-gray-600">{t.label}</span>
                      <span className="text-xs font-bold text-gray-800 ml-1">{formatCurrency(t.wert)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Jahresvergleich */}
      {jahresDaten.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Jahresvergleich Steuerlast</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-2 px-4 text-gray-500 font-semibold">Jahr</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Einnahmen</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">WK</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Überschuss</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Steuer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jahresDaten.filter(d => d.einnahmen > 0).map(d => (
                <tr key={d.jahr} className={`hover:bg-gray-50 ${d.jahr === tabJahr ? 'bg-purple-50' : ''}`}
                  onClick={() => setTabJahr(d.jahr)} style={{ cursor: 'pointer' }}>
                  <td className="py-2 px-4 font-semibold text-gray-700">{d.jahr}</td>
                  <td className="py-2 px-3 text-right text-emerald-600">+{formatCurrency(d.einnahmen)}</td>
                  <td className="py-2 px-3 text-right text-orange-500">−{formatCurrency(d.wkWarmmiete + d.wkNK)}</td>
                  <td className={`py-2 px-3 text-right font-bold ${d.ueberschuss >= 0 ? 'text-purple-600' : 'text-emerald-600'}`}>
                    {d.ueberschuss >= 0 ? '+' : ''}{formatCurrency(d.ueberschuss)}
                  </td>
                  <td className="py-2 px-3 text-right text-orange-600 font-semibold">
                    {d.ueberschuss > 0 ? `−${formatCurrency(Math.round(d.ueberschuss * steuersatz / 100))}` : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hinweisbox */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Wichtige Hinweise zur Untervermietungssteuer</p>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• Einnahmen aus Untervermietung sind nach <strong>§ 21 EStG</strong> als Einkünfte aus V+V zu erklären.</li>
          <li>• Absetzbar sind nur die <strong>anteiligen</strong> Kosten (nach Zimmer-Verhältnis, nicht Fläche — falls keine genaue Flächenaufteilung).</li>
          <li>• Liegt der Überschuss unter <strong>256 € / Jahr</strong>, gilt die Freigrenze (§ 22 EStG) — keine Steuerpflicht.</li>
          <li>• Möbelabschreibung (§ 7 EStG) ggf. zusätzlich ansetzbar — bitte mit Steuerberater abstimmen.</li>
          <li>• Diese Berechnung ist eine Schätzung. Bitte mit deinem Steuerberater abstimmen.</li>
        </ul>
      </div>
    </div>
  );
};

export default ArbitrageSteuern;
