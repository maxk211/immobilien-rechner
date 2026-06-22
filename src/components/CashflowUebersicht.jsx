import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete } from '../utils/miete.js';
import { berechneJahresRateFuerPhasen, berechneRendite } from '../utils/berechnung.js';

const CashflowUebersicht = ({ params, ergebnis, immobilie, investitionen = [], anteilFaktor = 1 }) => {
  const [ansicht, setAnsicht] = useState('monat'); // 'monat' oder 'jahr'

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();

  // Berechne Cashflow-Daten pro Jahr
  const cashflowDaten = useMemo(() => {
    const daten = [];
    let kumulierterCashflow = 0;

    // Für Anschlussfinanzierung: Fremdkapital und Phasen ermitteln
    const phasen = params.finanzierungsphasen;
    const kreditStartStr = phasen?.[0]?.kreditStartDatum || params.kaufdatum;
    const kreditStartJahr = kreditStartStr ? new Date(kreditStartStr).getFullYear() : kaufjahr;
    const cfFremdkapital = (() => {
      const kauf = params.kaufnebenkosten ?? 10;
      const kNKAbs = params.kaufpreis * (kauf / 100);
      const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
        ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
        : (params.eigenkapital ?? 0);
      return params.finanzierungsbetrag ?? Math.max(0, params.kaufpreis + kNKAbs - gesamtEK);
    })();

    for (let jahr = kaufjahr; jahr <= aktuellesJahr + 5; jahr++) {
      const jahreIndex = jahr - kaufjahr;

      // Miete per-year: mietHistorie[Jahr].kaltmiete falls händisch eingetragen, sonst Basismiete
      const histMiete = (params.mietHistorie || {})[`${jahr}`];
      const basisMiete = getAktuelleMiete(params); // aktuelle Miete als Basis für Prognose
      const jahresMiete = (histMiete?.kaltmiete != null ? histMiete.kaltmiete : basisMiete) * 12;
      const nkVomMieter = (params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' ? (params.nebenkostenVomMieter || 0) * 12 : 0;
      // Vermieterkosten: historische Werte aus mietHistorie[Jahr] bevorzugen (manuell eingetragen)
      const histKosten = (params.mietHistorie || {})[`${jahr}`] || {};
      const jInstandhaltung = histKosten.instandhaltung ?? params.instandhaltung;
      const jVerwaltung = histKosten.verwaltung ?? params.verwaltung;
      const jHausgeld = histKosten.hausgeld ?? (params.hausgeld || 0);
      const jStrom = histKosten.strom ?? (params.strom || 0);
      const jInternet = histKosten.internet ?? (params.internet || 0);
      const jNebenkosten = histKosten.nebenkosten ?? (params.nebenkosten || 0);
      const jahresKosten = (jInstandhaltung + jVerwaltung + jHausgeld + jStrom + jInternet + jNebenkosten) * 12;
      // Anschlussfinanzierung: korrekte Rate pro Jahr aus aktiver Phase
      const monatsRate = berechneJahresRateFuerPhasen(phasen, cfFremdkapital, kreditStartJahr, jahr, ergebnis.monatlicheRate);
      const jahresKreditrate = monatsRate * 12;

      // Investitionen für dieses Jahr
      const jahresInvestitionen = investitionen
        .filter(inv => new Date(inv.datum).getFullYear() === jahr)
        .reduce((sum, inv) => sum + inv.betrag, 0);

      // Bausparverträge: monatliche Sparrate abziehen bis Zuteilungsreife
      const jahresBauspar = (params.bausparvertraege || [])
        .filter(b => !b.zuteilungsreifAb || new Date(b.zuteilungsreifAb) > new Date(jahr, 11, 31))
        .reduce((s, b) => s + (parseFloat(b.monatlicheSparrate) || 0), 0) * 12;

      const jahresCashflow = jahresMiete + nkVomMieter - jahresKosten - jahresKreditrate - jahresInvestitionen - jahresBauspar;
      kumulierterCashflow += jahresCashflow;

      daten.push({
        jahr,
        einnahmen: Math.round(jahresMiete),
        kosten: Math.round(jahresKosten),
        kreditrate: Math.round(jahresKreditrate),
        investitionen: Math.round(jahresInvestitionen),
        bauspar: Math.round(jahresBauspar),
        cashflow: Math.round(jahresCashflow),
        kumuliert: Math.round(kumulierterCashflow)
      });
    }
    return daten;
  }, [params, ergebnis, kaufjahr, investitionen]);

  // Berechne Zins- und Tilgungsanteil
  // Verwendet effZinssatz + effRestschuld aus berechneRendite (aktive Phase, korrekte Restschuld)
  const berechneZinsTilgung = () => {
    const effZinssatz = ergebnis.effZinssatz ?? (params.zinssatz ?? 4.0);
    const effRestschuld = ergebnis.effRestschuld ?? (() => {
      const kaufnebenkosten = params.kaufnebenkosten ?? 10;
      const kaufnebenkostenAbsolut = params.kaufpreis * (kaufnebenkosten / 100);
      const gesamtinvestition = params.kaufpreis + kaufnebenkostenAbsolut;
      const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
        ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
        : (params.eigenkapital ?? params.kaufpreis * 0.2);
      return params.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);
    })();
    const monatsZinsen = effRestschuld * (effZinssatz / 100 / 12);
    const monatsTilgung = ergebnis.monatlicheRate - monatsZinsen;
    return {
      zinsen: Math.max(0, Math.round(monatsZinsen)),
      tilgung: Math.max(0, Math.round(monatsTilgung)),
      gesamt: ergebnis.monatlicheRate
    };
  };

  const kreditDetails = berechneZinsTilgung();
  const a = (v) => Math.round(v * anteilFaktor); // Anteil-Helfer
  const isGbR = anteilFaktor !== 1;

  // Vermieterkosten für aktuelles Jahr aus mietHistorie (falls manuell eingetragen)
  const aktuellesJahrHistKosten = (params.mietHistorie || {})[`${aktuellesJahr}`] || {};
  const monatsDaten = {
    einnahmen: getAktuelleMiete(params), // aktuelle Miete lt. mietAnpassungen
    nebenkosten: aktuellesJahrHistKosten.nebenkosten ?? params.nebenkosten,
    instandhaltung: aktuellesJahrHistKosten.instandhaltung ?? params.instandhaltung,
    verwaltung: aktuellesJahrHistKosten.verwaltung ?? params.verwaltung,
    hausgeld: aktuellesJahrHistKosten.hausgeld ?? (params.hausgeld || 0),
    strom: aktuellesJahrHistKosten.strom ?? (params.strom || 0),
    internet: aktuellesJahrHistKosten.internet ?? (params.internet || 0),
    kreditrate: ergebnis.monatlicheRate,
    zinsen: kreditDetails.zinsen,
    tilgung: kreditDetails.tilgung,
    // Bauspar: monatliche Sparraten aller noch nicht zuteilungsreifen Verträge
    bauspar: (params.bausparvertraege || [])
      .filter(b => !b.zuteilungsreifAb || new Date(b.zuteilungsreifAb) > new Date())
      .reduce((s, b) => s + (parseFloat(b.monatlicheSparrate) || 0), 0),
    // Cashflow neu berechnen mit allen Kosten inkl. Bauspar
    get gesamtKosten() { return this.nebenkosten + this.instandhaltung + this.verwaltung + this.hausgeld + this.strom + this.internet; },
    get cashflowMitTilgung() { return this.einnahmen - this.gesamtKosten - this.kreditrate - this.bauspar; },
    get cashflowOhneTilgung() { return this.einnahmen - this.gesamtKosten - this.zinsen - this.bauspar; }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">💰 Cashflow-Übersicht</h3>
          {isGbR && (
            <div className="mt-1 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700 font-medium">
              🏛 GbR: Werte zeigen Ihren {Math.round(anteilFaktor * 100)}%-Anteil
            </div>
          )}
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setAnsicht('monat')}
            className={`px-3 py-1 text-xs rounded-md ${ansicht === 'monat' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setAnsicht('jahr')}
            className={`px-3 py-1 text-xs rounded-md ${ansicht === 'jahr' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Jährlich
          </button>
        </div>
      </div>

      {ansicht === 'monat' ? (
        <div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-green-600">+ Mieteinnahmen</span>
              <span className="font-semibold text-green-600">{formatCurrency(a(monatsDaten.einnahmen))}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span className="text-red-500">- Nebenkosten</span>
              <span className="text-red-500">{formatCurrency(a(monatsDaten.nebenkosten))}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span className="text-red-500">- Instandhaltung</span>
              <span className="text-red-500">{formatCurrency(a(monatsDaten.instandhaltung))}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span className="text-red-500">- Verwaltung</span>
              <span className="text-red-500">{formatCurrency(a(monatsDaten.verwaltung))}</span>
            </div>
            {monatsDaten.hausgeld > 0 && (
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- WEG / Hausgeld</span>
                <span className="text-red-500">{formatCurrency(a(monatsDaten.hausgeld))}</span>
              </div>
            )}
            {monatsDaten.strom > 0 && (
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- Strom</span>
                <span className="text-red-500">{formatCurrency(a(monatsDaten.strom))}</span>
              </div>
            )}
            {monatsDaten.internet > 0 && (
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- Internet</span>
                <span className="text-red-500">{formatCurrency(a(monatsDaten.internet))}</span>
              </div>
            )}
            {/* Kreditrate aufgeschlüsselt */}
            <div className="border-t border-b py-2 my-1">
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- Zinsen</span>
                <span className="text-red-500">{formatCurrency(a(monatsDaten.zinsen))}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-blue-500">- Tilgung <span className="text-xs text-gray-400">(Vermögensaufbau)</span></span>
                <span className="text-blue-500">{formatCurrency(a(monatsDaten.tilgung))}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm border-t border-dashed">
                <span className="text-gray-600">= Kreditrate gesamt</span>
                <span className="font-semibold text-gray-600">{formatCurrency(a(monatsDaten.kreditrate))}</span>
              </div>
            </div>

            {/* Bausparvertrag Sparrate */}
            {monatsDaten.bauspar > 0 && (
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-orange-500">- Bauspar-Sparrate <span className="text-xs text-gray-400">(Ansparphase)</span></span>
                <span className="text-orange-500">{formatCurrency(a(monatsDaten.bauspar))}</span>
              </div>
            )}

            {/* Cashflow-Vergleich */}
            <div className="space-y-2 mt-3">
              {/* Cashflow OHNE Tilgung (nur Zinsen) */}
              <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${monatsDaten.cashflowOhneTilgung >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div>
                  <span className="font-semibold text-sm">Cashflow vor Tilgung</span>
                  <span className="text-xs text-gray-500 block">Miete - Kosten - Zinsen</span>
                </div>
                <span className={`text-lg font-bold ${monatsDaten.cashflowOhneTilgung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monatsDaten.cashflowOhneTilgung >= 0 ? '+' : ''}{formatCurrency(a(monatsDaten.cashflowOhneTilgung))}
                </span>
              </div>

              {/* Cashflow MIT Tilgung */}
              <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${monatsDaten.cashflowMitTilgung >= 0 ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                <div>
                  <span className="font-semibold">Cashflow nach Tilgung</span>
                  <span className="text-xs text-gray-500 block">Miete - Kosten - Kreditrate</span>
                </div>
                <span className={`text-xl font-bold ${monatsDaten.cashflowMitTilgung >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {monatsDaten.cashflowMitTilgung >= 0 ? '+' : ''}{formatCurrency(a(monatsDaten.cashflowMitTilgung))}
                </span>
              </div>
            </div>
          </div>

          {/* Jahresübersicht */}
          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Jährlich vor Tilgung</div>
              <div className={`font-semibold ${monatsDaten.cashflowOhneTilgung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monatsDaten.cashflowOhneTilgung >= 0 ? '+' : ''}{formatCurrency(a(monatsDaten.cashflowOhneTilgung * 12))}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Jährlich nach Tilgung</div>
              <div className={`font-semibold ${monatsDaten.cashflowMitTilgung >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {monatsDaten.cashflowMitTilgung >= 0 ? '+' : ''}{formatCurrency(a(monatsDaten.cashflowMitTilgung * 12))}
              </div>
            </div>
          </div>

          {/* Hinweis */}
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 <strong>Vor Tilgung</strong> zeigt den tatsächlichen Geldfluss ohne Vermögensaufbau.
            Die Tilgung ({formatCurrency(a(monatsDaten.tilgung))}/Monat) baut Eigenkapital auf.
          </div>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Jahr</th>
                  <th className="text-right p-2 text-green-600">Einnahmen</th>
                  <th className="text-right p-2 text-red-500">Kosten</th>
                  <th className="text-right p-2 text-red-600">Kredit</th>
                  <th className="text-right p-2 text-orange-500">Invest.</th>
                  <th className="text-right p-2 text-orange-600">Bauspar</th>
                  <th className="text-right p-2 font-semibold">Cashflow</th>
                  <th className="text-right p-2 text-blue-600">Kumuliert</th>
                </tr>
              </thead>
              <tbody>
                {cashflowDaten.map(d => (
                  <tr key={d.jahr} className={d.jahr === aktuellesJahr ? 'bg-blue-50' : ''}>
                    <td className="p-2 font-semibold">{d.jahr}</td>
                    <td className="p-2 text-right text-green-600">{formatCurrency(Math.round(d.einnahmen * anteilFaktor))}</td>
                    <td className="p-2 text-right text-red-500">{formatCurrency(Math.round(d.kosten * anteilFaktor))}</td>
                    <td className="p-2 text-right text-red-600">{formatCurrency(Math.round(d.kreditrate * anteilFaktor))}</td>
                    <td className="p-2 text-right text-orange-500">{d.investitionen > 0 ? formatCurrency(Math.round(d.investitionen * anteilFaktor)) : '-'}</td>
                    <td className="p-2 text-right text-orange-600">{d.bauspar > 0 ? formatCurrency(Math.round(d.bauspar * anteilFaktor)) : '-'}</td>
                    <td className={`p-2 text-right font-semibold ${d.cashflow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {d.cashflow >= 0 ? '+' : ''}{formatCurrency(Math.round(d.cashflow * anteilFaktor))}
                    </td>
                    <td className={`p-2 text-right ${d.kumuliert >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.round(d.kumuliert * anteilFaktor))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Steuerberechnung Komponente - Jahresbezogen mit Investitionen & Finanzierung

export default CashflowUebersicht;
