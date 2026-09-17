import { useState, useMemo } from 'react';
import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuelleWarmmiete, getAktuelleUntermiete, getAktuellerWert } from '../utils/miete.js';
import { berechneMtlCashflow, berechneImmoVermoegenswerte, berechneRendite, getAktuellerGesamtwert } from '../utils/berechnung.js';
import PortfolioZiele from './PortfolioZiele';

const PortfolioOverview = ({ portfolio }) => {
  const [showVermoegenDetail, setShowVermoegenDetail] = useState(false);
  const stats = useMemo(() => {
    let gesamtKaufpreis = 0;
    let gesamtWert = 0;
    let gesamtMiete = 0;
    let gesamtFlaeche = 0;
    let gesamtCashflow = 0;
    let gesamtCashflowKauf = 0; // nur Kaufimmobilien — Basis für ekRendite (Mietimmobilien nutzen kein Eigenkapital)
    let gesamtKreditrate = 0;
    let gesamtKosten = 0;
    let gesamtEigenkapital = 0;
    let anzahlKaufimmobilien = 0;
    let anzahlMietimmobilien = 0;
    let gesamtRestschuld = 0;
    let gesamtTilgungJahr = 0;
    let gesamtFreiesVermoegen = 0;
    const vermoegenProImmo = [];

    portfolio.forEach(immo => {
      const isMietimmobilie = immo.immobilienTyp === 'mietimmobilie';
      gesamtFlaeche += immo.wohnflaeche || 0;

      if (isMietimmobilie) {
        // Mietimmobilie (Arbitrage-Modell) — aktuelle Werte aus mietAnpassungen
        anzahlMietimmobilien++;
        const vertragsEndeImmo = immo.mietvertragEnde ? new Date(immo.mietvertragEnde) : null;
        const vertragsLaeuft = !vertragsEndeImmo || vertragsEndeImmo >= new Date();
        const einnahmen = vertragsLaeuft ? (immo.anzahlZimmerVermietet || 0) * getAktuelleUntermiete(immo) : 0;
        const zusatzkosten = vertragsLaeuft ? (immo.arbitrageStrom || 0) + (immo.arbitrageInternet || 0) + (immo.arbitrageGEZ ?? 18.36) : 0;
        const ausgaben = vertragsLaeuft ? getAktuelleWarmmiete(immo) + zusatzkosten : 0;
        const monatsCashflow = einnahmen - ausgaben;

        gesamtMiete += einnahmen * 12; // Einnahmen aus Untervermietung
        gesamtCashflow += monatsCashflow * 12;
        gesamtKosten += ausgaben * 12;
      } else {
        // Kaufimmobilie
        anzahlKaufimmobilien++;
        gesamtKaufpreis += immo.kaufpreis || 0;
        gesamtWert += getAktuellerGesamtwert(immo);
        // Vermögenswerte berechnen
        const vw = berechneImmoVermoegenswerte(immo);
        if (vw) {
          gesamtRestschuld += vw.restschuld;
          gesamtTilgungJahr += vw.tilgungJahr;
          gesamtFreiesVermoegen += vw.freiVermoegen;
          vermoegenProImmo.push({ id: immo.id, name: immo.name || immo.adresse || 'Immobilie', kaufpreis: immo.kaufpreis || 0, ...vw });
        }
        const nkMieterJahr = (immo.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' ? (immo.nebenkostenVomMieter || 0) * 12 : 0;
        gesamtMiete += (getAktuelleMiete(immo) + (nkMieterJahr / 12)) * 12;

        // Einheitliche Berechnung — eine Quelle für Rate + Cashflow
        const immoGesamtMiete = immo.immobilienTyp === 'mehrfamilienhaus'
          ? (immo.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0)
          : getAktuelleMiete(immo);
        const rendite = berechneRendite({ ...immo, kaltmiete: immoGesamtMiete });

        // Datumsbasierte Kostenanpassungen berücksichtigen (Bug-Fix: vorher immer Basiswerte)
        const monatlicheKosten = immo.immobilienTyp === 'mehrfamilienhaus'
          ? (immo.instandhaltung || 0) + (immo.verwaltung || 0) + (immo.hausgeld || 0) + (immo.strom || 0) + (immo.internet || 0)
          : getAktuellerWert(immo, 'instandhaltung') + getAktuellerWert(immo, 'verwaltung')
            + getAktuellerWert(immo, 'hausgeld') + getAktuellerWert(immo, 'strom') + getAktuellerWert(immo, 'internet');
        const gesamtEK = (immo.ekFuerNebenkosten !== undefined && immo.ekFuerKaufpreis !== undefined)
          ? (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0)
          : (immo.eigenkapital ?? (immo.kaufpreis || 0) * 0.2);

        // berechneMtlCashflow für Cashflow (inkl. Bauspar, Stellplatz, Phasenwechsel)
        const monatsCashflow = berechneMtlCashflow(immo);

        gesamtCashflow    += monatsCashflow * 12;
        gesamtCashflowKauf += monatsCashflow * 12;
        gesamtKreditrate  += rendite.monatlicheRate * 12;   // phasenbewusst, vollEK-aware
        gesamtKosten      += monatlicheKosten * 12;
        gesamtEigenkapital += gesamtEK;
      }
    });

    return {
      anzahl: portfolio.length,
      anzahlKaufimmobilien,
      anzahlMietimmobilien,
      gesamtKaufpreis,
      gesamtWert,
      wertsteigerung: gesamtWert - gesamtKaufpreis,
      gesamtMieteJahr: gesamtMiete,
      gesamtMieteMonat: gesamtMiete / 12,
      gesamtCashflowJahr: gesamtCashflow,
      gesamtCashflowMonat: gesamtCashflow / 12,
      gesamtKreditrateJahr: gesamtKreditrate,
      gesamtKostenJahr: gesamtKosten,
      gesamtFlaeche,
      gesamtEigenkapital,
      ekRendite: gesamtEigenkapital > 0 ? (gesamtCashflowKauf / gesamtEigenkapital) * 100 : null,
      gesamtRestschuld,
      gesamtTilgungJahr,
      gesamtFreiesVermoegen,
      vermoegenProImmo,
    };
  }, [portfolio]);

  if (portfolio.length === 0) return null;

  const cfPositiv = stats.gesamtCashflowMonat >= 0;

  return (
    <div className="mb-6 sm:mb-8">
      {/* Top KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        {/* Cashflow — most important, gets visual prominence */}
        <div className={`col-span-2 md:col-span-1 rounded-2xl p-3 sm:p-5 border ${cfPositiv ? 'bg-sage-50 border-sage-200' : 'bg-brick-50 border-brick-200'}`}>
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cream-500 mb-1">Monatl. Cashflow</div>
          <div className={`text-2xl sm:text-3xl font-black ${cfPositiv ? 'text-sage-600' : 'text-brick-600'}`}>
            {stats.gesamtCashflowMonat >= 0 ? '+' : ''}{formatCurrency(stats.gesamtCashflowMonat)}
          </div>
          <div className={`text-xs mt-1 font-medium ${cfPositiv ? 'text-sage-500' : 'text-brick-400'}`}>
            {stats.gesamtCashflowJahr >= 0 ? '+' : ''}{formatCurrency(stats.gesamtCashflowJahr)} p.a.
          </div>
          <div className="text-xs text-cream-400 mt-0.5 hidden sm:block">nach Kredit &amp; Kosten</div>
        </div>

        {/* Mieteinnahmen */}
        <div className="rounded-2xl bg-white border border-cream-200 p-3 sm:p-5 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cream-400 mb-1">Mieteinnahmen</div>
          <div className="text-xl sm:text-2xl font-black text-cream-800">{formatCurrency(stats.gesamtMieteMonat)}</div>
          <div className="text-xs text-cream-400 mt-1 font-medium">{formatCurrency(stats.gesamtMieteJahr)} p.a.</div>
        </div>

        {/* Gesamtwert */}
        <div className="rounded-2xl bg-white border border-cream-200 p-3 sm:p-5 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cream-400 mb-1">Portfoliowert</div>
          <div className="text-xl sm:text-2xl font-black text-cream-800">{formatCurrency(stats.gesamtWert)}</div>
          {stats.wertsteigerung !== 0 && (
            <div className={`text-xs mt-1 font-semibold flex items-center gap-0.5 ${stats.wertsteigerung >= 0 ? 'text-sage-500' : 'text-brick-500'}`}>
              {stats.wertsteigerung >= 0 ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} {formatCurrency(Math.abs(stats.wertsteigerung))}
            </div>
          )}
          <div className="text-xs text-cream-400 mt-0.5">
            {stats.anzahl} Objekt{stats.anzahl !== 1 ? 'e' : ''}
          </div>
        </div>

        {/* EK-Rendite */}
        <div className="rounded-2xl bg-white border border-cream-200 p-3 sm:p-5 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cream-400 mb-1">EK-Rendite</div>
          {stats.ekRendite !== null ? (
            <>
              <div className={`text-xl sm:text-2xl font-black ${stats.ekRendite >= 0 ? 'text-honey-600' : 'text-brick-600'}`}>
                {stats.ekRendite >= 0 ? '+' : ''}{stats.ekRendite.toFixed(1)} %
              </div>
              <div className="text-xs text-cream-400 mt-1 font-medium">
                EK: {formatCurrency(stats.gesamtEigenkapital)}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl sm:text-2xl font-black text-cream-300">–</div>
              <div className="text-xs text-cream-400 mt-1">Kein EK erfasst</div>
            </>
          )}
        </div>
      </div>

      {/* Freies Vermögen + Portfolio-Ziele Zeile */}
      {stats.anzahlKaufimmobilien > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch">
          {/* Freies Vermögen — kompakt */}
          <div className="flex-shrink-0 rounded-2xl bg-gradient-to-br from-honey-50 to-honey-50 border border-honey-200 p-3 sm:p-4 shadow-sm sm:w-48">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-honey-600 mb-1">Freies Vermögen</div>
            <div className="text-lg sm:text-xl font-black text-honey-800">{formatCurrency(stats.gesamtFreiesVermoegen)}</div>
            <div className="text-xs text-honey-500 mt-0.5">Marktwert − Restschuld</div>
            {stats.gesamtRestschuld > 0 && (
              <div className="text-[10px] text-cream-400 mt-0.5">Schulden: {formatCurrency(stats.gesamtRestschuld)}</div>
            )}
          </div>
          {/* Portfolio-Ziele inline */}
          <div className="flex-1">
            <PortfolioZiele portfolio={portfolio} inline />
          </div>
        </div>
      )}

      {/* Vermögensdetails pro Objekt */}
      {stats.vermoegenProImmo.length > 0 && (
        <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden mb-4">
          <button
            onClick={() => setShowVermoegenDetail(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-cream-700 text-sm flex items-center gap-1"><BarChart3 size={16}/>Vermögensaufbau pro Objekt</span>
              <span className="text-xs text-cream-400">{stats.vermoegenProImmo.length} Kaufobjekt{stats.vermoegenProImmo.length !== 1 ? 'e' : ''}</span>
            </div>
            <span className="text-cream-400 text-sm">{showVermoegenDetail ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
          </button>
          {showVermoegenDetail && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 border-y border-cream-100">
                  <tr>
                    <th className="text-left px-3 sm:px-4 py-2 text-xs font-semibold text-cream-500 uppercase">Objekt</th>
                    <th className="hidden sm:table-cell text-right px-4 py-2 text-xs font-semibold text-cream-500 uppercase">Kaufpreis</th>
                    <th className="hidden sm:table-cell text-right px-4 py-2 text-xs font-semibold text-cream-500 uppercase">Marktwert</th>
                    <th className="hidden sm:table-cell text-right px-4 py-2 text-xs font-semibold text-cream-500 uppercase">Restschuld</th>
                    <th className="text-right px-3 sm:px-4 py-2 text-xs font-semibold text-honey-700 uppercase">Freies EK</th>
                    <th className="text-right px-3 sm:px-4 py-2 text-xs font-semibold text-sage-600 uppercase">Tilgung {new Date().getFullYear()}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-50">
                  {stats.vermoegenProImmo.map(v => (
                    <tr key={v.id} className="hover:bg-cream-50">
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-cream-800 truncate max-w-[120px] sm:max-w-[160px] text-sm">{v.name}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right text-cream-500">{formatCurrency(v.kaufpreis)}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right text-cream-700 font-semibold">{formatCurrency(v.marktwert)}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right text-brick-500">{formatCurrency(v.restschuld)}</td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-honey-800 font-bold text-sm">{formatCurrency(v.freiVermoegen)}</td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-sage-700 font-bold text-sm">+{formatCurrency(v.tilgungJahr)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-cream-100 border-t-2 border-cream-200">
                  <tr>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-black text-cream-800 text-xs uppercase">Gesamt</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right font-bold text-cream-600">{formatCurrency(stats.gesamtKaufpreis)}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right font-bold text-cream-800">{formatCurrency(stats.gesamtWert)}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right font-bold text-brick-600">{formatCurrency(stats.gesamtRestschuld)}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-black text-honey-800">{formatCurrency(stats.gesamtFreiesVermoegen)}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-black text-sage-700">+{formatCurrency(stats.gesamtTilgungJahr)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};



export default PortfolioOverview;
