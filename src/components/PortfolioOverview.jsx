import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuelleWarmmiete, getAktuelleUntermiete } from '../utils/miete.js';
import { berechneMtlCashflow, berechneImmoVermoegenswerte } from '../utils/berechnung.js';

const PortfolioOverview = ({ portfolio }) => {
  const [showVermoegenDetail, setShowVermoegenDetail] = useState(false);
  const stats = useMemo(() => {
    let gesamtKaufpreis = 0;
    let gesamtWert = 0;
    let gesamtMiete = 0;
    let gesamtFlaeche = 0;
    let gesamtCashflow = 0;
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
        gesamtWert += immo.geschaetzterWert || immo.kaufpreis || 0;
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

        // Cashflow-Berechnung pro Kaufimmobilie
        const zinssatz = immo.zinssatz ?? 4.0;
        const tilgung = immo.tilgung ?? 2.0;
        const kaufnebenkosten = immo.kaufnebenkosten ?? 10;
        const instandhaltung = immo.instandhaltung ?? 100;
        const verwaltung = immo.verwaltung ?? 30;
        const hausgeld = immo.hausgeld ?? 0;
        const strom = immo.strom ?? 0;
        const internet = immo.internet ?? 0;

        // Fremdkapital berechnen
        const kaufnebenkostenAbsolut = (immo.kaufpreis || 0) * (kaufnebenkosten / 100);
        const gesamtinvestition = (immo.kaufpreis || 0) + kaufnebenkostenAbsolut;
        const gesamtEK = (immo.ekFuerNebenkosten !== undefined && immo.ekFuerKaufpreis !== undefined)
          ? (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0)
          : (immo.eigenkapital ?? (immo.kaufpreis || 0) * 0.2);
        const fremdkapital = immo.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);

        // Monatliche Kreditrate (Annuität)
        const monatszins = zinssatz / 100 / 12;
        const laufzeit = immo.laufzeit ?? 25;
        let monatlicheRate = 0;
        if (fremdkapital > 0 && monatszins > 0) {
          monatlicheRate = fremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) /
                          (Math.pow(1 + monatszins, laufzeit * 12) - 1);
        }

        // Monatliche Kosten (inkl. zusätzliche Kosten bei möblierter Vermietung)
        const monatlicheKosten = instandhaltung + verwaltung + hausgeld + strom + internet;

        // NK-Vorauszahlung vom Mieter (nur bei Modell kaltmiete_nk)
        const nkVomMieter = (immo.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' ? (immo.nebenkostenVomMieter || 0) : 0;

        // Monatlicher Cashflow — einheitlich via berechneMtlCashflow (inkl. Bauspar, Phase-aware Rate)
        const monatsCashflow = berechneMtlCashflow(immo);

        gesamtCashflow += monatsCashflow * 12;
        gesamtKreditrate += monatlicheRate * 12;
        gesamtKosten += monatlicheKosten * 12;
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
      ekRendite: gesamtEigenkapital > 0 ? (gesamtCashflow / gesamtEigenkapital) * 100 : null,
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
        <div className={`col-span-2 md:col-span-1 rounded-2xl p-3 sm:p-5 border ${cfPositiv ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Monatl. Cashflow</div>
          <div className={`text-2xl sm:text-3xl font-black ${cfPositiv ? 'text-emerald-600' : 'text-red-600'}`}>
            {stats.gesamtCashflowMonat >= 0 ? '+' : ''}{formatCurrency(stats.gesamtCashflowMonat)}
          </div>
          <div className={`text-xs mt-1 font-medium ${cfPositiv ? 'text-emerald-500' : 'text-red-400'}`}>
            {stats.gesamtCashflowJahr >= 0 ? '+' : ''}{formatCurrency(stats.gesamtCashflowJahr)} p.a.
          </div>
          <div className="text-xs text-gray-400 mt-0.5 hidden sm:block">nach Kredit &amp; Kosten</div>
        </div>

        {/* Mieteinnahmen */}
        <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-5 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Mieteinnahmen</div>
          <div className="text-xl sm:text-2xl font-black text-gray-800">{formatCurrency(stats.gesamtMieteMonat)}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">{formatCurrency(stats.gesamtMieteJahr)} p.a.</div>
        </div>

        {/* Gesamtwert */}
        <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-5 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Portfoliowert</div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">{formatCurrency(stats.gesamtWert)}</div>
          {stats.wertsteigerung !== 0 && (
            <div className={`text-xs mt-1 font-semibold ${stats.wertsteigerung >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {stats.wertsteigerung >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(stats.wertsteigerung))}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-0.5">
            {stats.anzahl} Objekt{stats.anzahl !== 1 ? 'e' : ''}
          </div>
        </div>

        {/* EK-Rendite */}
        <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-5 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">EK-Rendite</div>
          {stats.ekRendite !== null ? (
            <>
              <div className={`text-xl sm:text-2xl font-black ${stats.ekRendite >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {stats.ekRendite >= 0 ? '+' : ''}{stats.ekRendite.toFixed(1)} %
              </div>
              <div className="text-xs text-gray-400 mt-1 font-medium">
                EK: {formatCurrency(stats.gesamtEigenkapital)}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl sm:text-2xl font-black text-gray-300">–</div>
              <div className="text-xs text-gray-400 mt-1">Kein EK erfasst</div>
            </>
          )}
        </div>
      </div>

      {/* Vermögens-KPI Zeile */}
      {stats.anzahlKaufimmobilien > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Freies Vermögen */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">Freies Vermögen (EK)</div>
            <div className="text-2xl font-black text-amber-800">{formatCurrency(stats.gesamtFreiesVermoegen)}</div>
            <div className="text-xs text-amber-500 mt-1 font-medium">Marktwert − Restschuld</div>
            {stats.gesamtRestschuld > 0 && (
              <div className="text-xs text-gray-400 mt-0.5">Restschuld: {formatCurrency(stats.gesamtRestschuld)}</div>
            )}
          </div>
          {/* Tilgung p.a. */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-500 mb-1">Tilgung p.a. (Vermögensaufbau)</div>
            <div className="text-2xl font-black text-teal-700">+{formatCurrency(stats.gesamtTilgungJahr)}</div>
            <div className="text-xs text-teal-400 mt-1 font-medium">Schuldenabbau in {new Date().getFullYear()}</div>
            <div className="text-xs text-gray-400 mt-0.5">≈ {formatCurrency(stats.gesamtTilgungJahr / 12)}/Monat</div>
          </div>
        </div>
      )}

      {/* Vermögensdetails pro Objekt */}
      {stats.vermoegenProImmo.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">
          <button
            onClick={() => setShowVermoegenDetail(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 text-sm">📊 Vermögensaufbau pro Objekt</span>
              <span className="text-xs text-gray-400">{stats.vermoegenProImmo.length} Kaufobjekt{stats.vermoegenProImmo.length !== 1 ? 'e' : ''}</span>
            </div>
            <span className="text-gray-400 text-sm">{showVermoegenDetail ? '▲' : '▼'}</span>
          </button>
          {showVermoegenDetail && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-y border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Objekt</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Kaufpreis</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Marktwert</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Restschuld</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-amber-700 uppercase">Freies EK</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-teal-600 uppercase">Tilgung {new Date().getFullYear()}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.vermoegenProImmo.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[160px]">{v.name}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(v.kaufpreis)}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-semibold">{formatCurrency(v.marktwert)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{formatCurrency(v.restschuld)}</td>
                      <td className="px-4 py-3 text-right text-amber-800 font-bold">{formatCurrency(v.freiVermoegen)}</td>
                      <td className="px-4 py-3 text-right text-teal-700 font-bold">+{formatCurrency(v.tilgungJahr)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-4 py-3 font-black text-gray-800 text-xs uppercase">Gesamt</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-600">{formatCurrency(stats.gesamtKaufpreis)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(stats.gesamtWert)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(stats.gesamtRestschuld)}</td>
                    <td className="px-4 py-3 text-right font-black text-amber-800">{formatCurrency(stats.gesamtFreiesVermoegen)}</td>
                    <td className="px-4 py-3 text-right font-black text-teal-700">+{formatCurrency(stats.gesamtTilgungJahr)}</td>
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
