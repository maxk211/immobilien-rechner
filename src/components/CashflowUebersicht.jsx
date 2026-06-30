import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete } from '../utils/miete.js';
import { berechneJahresRateFuerPhasen, berechneZinsUndTilgung } from '../utils/berechnung.js';

// ── Hilfsfunktion: Zeile in Tabelle ─────────────────────────────────────────
function CfZeile({ label, monat, jahr, color = 'gray', einzug = false, bold = false, separator = false, plus = false, hideZero = false }) {
  if (hideZero && !monat && !jahr) return null;
  const colors = {
    green: 'text-emerald-600',
    red: 'text-red-500',
    blue: 'text-blue-600',
    orange: 'text-orange-500',
    gray: 'text-gray-700',
  };
  const textClass = `${colors[color]} ${bold ? 'font-bold' : ''}`;
  const sign = (v) => v > 0 && plus ? '+' : v < 0 ? '−' : '';
  const fmt = (v) => v == null ? '—' : `${sign(v)}${formatCurrency(Math.abs(v))}`;

  return (
    <>
      {separator && <tr><td colSpan={3}><div className="border-t border-gray-200 my-0.5" /></td></tr>}
      <tr className={bold ? 'bg-gray-50' : ''}>
        <td className={`py-1.5 pr-2 text-xs ${textClass} ${einzug ? 'pl-4' : 'pl-1'}`}>{label}</td>
        <td className={`py-1.5 text-right text-xs ${textClass} font-${bold ? 'bold' : 'medium'} pr-3`}>{fmt(monat)}</td>
        <td className={`py-1.5 text-right text-xs ${textClass} font-${bold ? 'bold' : 'medium'} pr-1`}>{fmt(jahr)}</td>
      </tr>
    </>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
const CashflowUebersicht = ({ params, ergebnis, immobilie, investitionen = [], anteilFaktor = 1 }) => {
  const [tab, setTab] = useState('aktuell'); // 'aktuell' | 'verlauf'

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();
  const a = (v) => Math.round((v || 0) * anteilFaktor);
  const isGbR = anteilFaktor !== 1;

  // ── Kreditdetails (Zins/Tilgungs-Split) — aktueller Monat exakt berechnet ──
  const kreditDetails = useMemo(() => {
    const heute = new Date();
    // Exakte Berechnung: tatsächliche Restschuld dieses Monats (Phasenwechsel berücksichtigt)
    const result = berechneZinsUndTilgung(params, heute.getFullYear(), heute.getMonth());
    if (result && ergebnis.monatlicheRate > 0) {
      const zinsen = Math.min(result.zinsen, ergebnis.monatlicheRate); // Zinsen nie > Rate
      return {
        zinsen: Math.max(0, zinsen),
        tilgung: Math.max(0, ergebnis.monatlicheRate - zinsen),
        gesamt: ergebnis.monatlicheRate,
      };
    }
    // Fallback: Phasen-Start-Restschuld (wie bisher)
    const effZinssatz = ergebnis.effZinssatz ?? (params.zinssatz ?? 4.0);
    const effRestschuld = ergebnis.effRestschuld ?? (() => {
      const kauf = params.kaufnebenkosten ?? 10;
      const kNKAbs = params.kaufpreis * (kauf / 100);
      const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
        ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
        : (params.eigenkapital ?? 0);
      return params.finanzierungsbetrag ?? Math.max(0, params.kaufpreis + kNKAbs - gesamtEK);
    })();
    const monatsZinsen = effRestschuld * (effZinssatz / 100 / 12);
    return {
      zinsen: Math.max(0, Math.round(monatsZinsen)),
      tilgung: Math.max(0, Math.round(ergebnis.monatlicheRate - monatsZinsen)),
      gesamt: ergebnis.monatlicheRate,
    };
  }, [ergebnis, params]);

  // ── Jahreszins/-tilgung: exakte Summe der 12 Monate (nicht × 12!) ──────────
  const jahresKredit = useMemo(() => {
    const result = berechneZinsUndTilgung(params, aktuellesJahr);
    if (!result || ergebnis.monatlicheRate <= 0) return null;
    return {
      zinsen: result.zinsen,
      tilgung: Math.max(0, ergebnis.monatlicheRate * 12 - result.zinsen),
      gesamt: ergebnis.monatlicheRate * 12,
    };
  }, [params, ergebnis, aktuellesJahr]);

  // ── Monatswerte für aktuelles Jahr ─────────────────────────────────────────
  const monat = useMemo(() => {
    const histKosten = (params.mietHistorie || {})[`${aktuellesJahr}`] || {};
    const sp = params.stellplatz;
    const stellplatz = (sp?.vorhanden && sp?.istVermietet)
      ? (sp.monatlicheMiete || 0) * (sp.anzahl || 1) : 0;
    const nkVomMieter = params.vermietungsmodell === 'kaltmiete_nk' ? (params.nebenkostenVomMieter || 0) : 0;

    const einnahmen = getAktuelleMiete(params);
    const nk       = histKosten.nebenkosten    ?? (params.nebenkosten    || 0);
    const inst     = histKosten.instandhaltung ?? (params.instandhaltung || 0);
    const verw     = histKosten.verwaltung     ?? (params.verwaltung     || 0);
    const hg       = histKosten.hausgeld       ?? (params.hausgeld       || 0);
    const strom    = histKosten.strom          ?? (params.strom          || 0);
    const internet = histKosten.internet       ?? (params.internet       || 0);
    const bauspar  = (params.bausparvertraege || [])
      .filter(b => !b.zuteilungsreifAb || new Date(b.zuteilungsreifAb) > new Date())
      .reduce((s, b) => s + (parseFloat(b.monatlicheSparrate) || 0), 0);

    const gesamtEinnahmen    = einnahmen + stellplatz + nkVomMieter;
    const gesamtBetrieb      = nk + inst + verw + hg + strom + internet;
    const vorTilgung         = gesamtEinnahmen - gesamtBetrieb - kreditDetails.zinsen;
    const vorTilgungMitBS    = vorTilgung - bauspar; // inkl. Bauspar-Sparrate
    const nachTilgung        = gesamtEinnahmen - gesamtBetrieb - kreditDetails.gesamt - bauspar;

    return {
      einnahmen, stellplatz, nkVomMieter, nk, inst, verw, hg, strom, internet,
      zinsen: kreditDetails.zinsen, tilgung: kreditDetails.tilgung,
      kreditrate: kreditDetails.gesamt, bauspar,
      gesamtEinnahmen, gesamtBetrieb,
      vorTilgung: vorTilgungMitBS, // "vor Tilgung" = nach Zinsen, vor Tilgungsanteil
      nachTilgung,
      sp, spAnzahl: sp?.anzahl || 1,
    };
  }, [params, kreditDetails, aktuellesJahr]);

  // ── Jahresverlaufsdaten ────────────────────────────────────────────────────
  const verlaufDaten = useMemo(() => {
    const daten = [];
    let kumuliert = 0;
    const phasen = params.finanzierungsphasen;
    const kreditStartStr = phasen?.[0]?.kreditStartDatum || params.kaufdatum;
    const kreditStartJahr = kreditStartStr ? new Date(kreditStartStr).getFullYear() : kaufjahr;
    const cfFK = (() => {
      const kauf = params.kaufnebenkosten ?? 10;
      const kNKAbs = params.kaufpreis * (kauf / 100);
      const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
        ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
        : (params.eigenkapital ?? 0);
      return params.finanzierungsbetrag ?? Math.max(0, params.kaufpreis + kNKAbs - gesamtEK);
    })();

    for (let jahr = kaufjahr; jahr <= aktuellesJahr + 5; jahr++) {
      const histMiete  = (params.mietHistorie || {})[`${jahr}`];
      const histKosten = (params.mietHistorie || {})[`${jahr}`] || {};
      const basisMiete = getAktuelleMiete(params);
      const kaltmiete  = (histMiete?.kaltmiete != null ? histMiete.kaltmiete : basisMiete);
      const nkVM = params.vermietungsmodell === 'kaltmiete_nk' ? (params.nebenkostenVomMieter || 0) : 0;
      const sp = params.stellplatz;
      const stellplatz = (sp?.vorhanden && sp?.istVermietet)
        ? (sp.monatlicheMiete || 0) * (sp.anzahl || 1) : 0;

      const einnahmen = (kaltmiete + nkVM + stellplatz) * 12;
      const nk     = (histKosten.nebenkosten    ?? (params.nebenkosten    || 0)) * 12;
      const inst   = (histKosten.instandhaltung ?? (params.instandhaltung || 0)) * 12;
      const verw   = (histKosten.verwaltung     ?? (params.verwaltung     || 0)) * 12;
      const hg     = (histKosten.hausgeld       ?? (params.hausgeld       || 0)) * 12;
      const strom  = (histKosten.strom          ?? (params.strom          || 0)) * 12;
      const inet   = (histKosten.internet       ?? (params.internet       || 0)) * 12;
      const betrieb = nk + inst + verw + hg + strom + inet;

      const monatsRate = berechneJahresRateFuerPhasen(phasen, cfFK, kreditStartJahr, jahr, ergebnis.monatlicheRate);
      const kreditrate = monatsRate * 12;
      const bauspar = (params.bausparvertraege || [])
        .filter(b => !b.zuteilungsreifAb || new Date(b.zuteilungsreifAb) > new Date(jahr, 11, 31))
        .reduce((s, b) => s + (parseFloat(b.monatlicheSparrate) || 0), 0) * 12;
      const einmalInvest = investitionen
        .filter(inv => new Date(inv.datum).getFullYear() === jahr)
        .reduce((sum, inv) => sum + inv.betrag, 0);

      const cashflow = einnahmen - betrieb - kreditrate - bauspar - einmalInvest;
      kumuliert += cashflow;

      daten.push({
        jahr,
        einnahmen: Math.round(einnahmen),
        betrieb: Math.round(betrieb),
        kreditrate: Math.round(kreditrate),
        bauspar: Math.round(bauspar),
        investitionen: Math.round(einmalInvest),
        cashflow: Math.round(cashflow),
        kumuliert: Math.round(kumuliert),
        istVorjahr: jahr < aktuellesJahr,
        istAktuell: jahr === aktuellesJahr,
        istPrognose: jahr > aktuellesJahr,
      });
    }
    return daten;
  }, [params, ergebnis, kaufjahr, aktuellesJahr, investitionen]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-800">💰 Cashflow-Übersicht</h3>
          {isGbR && (
            <span className="text-[10px] text-violet-600 font-medium">
              🏛 GbR — Ihr {Math.round(anteilFaktor * 100)}%-Anteil
            </span>
          )}
        </div>
        {/* Tab Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
          <button
            onClick={() => setTab('aktuell')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${tab === 'aktuell' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {aktuellesJahr}
          </button>
          <button
            onClick={() => setTab('verlauf')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${tab === 'verlauf' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Verlauf & Prognose
          </button>
        </div>
      </div>

      {/* ── TAB: Aktuelles Jahr ─────────────────────────────────────────────── */}
      {tab === 'aktuell' && (
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2 pl-1">Position</th>
                <th className="text-right pb-2 pr-3">Monatlich</th>
                <th className="text-right pb-2 pr-1">Jährlich</th>
              </tr>
            </thead>
            <tbody>
              {/* EINNAHMEN */}
              <tr><td colSpan={3} className="pt-1 pb-0.5 pl-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Einnahmen</td></tr>
              <CfZeile label="Kaltmiete" color="green" monat={a(monat.einnahmen)} jahr={a(monat.einnahmen * 12)} />
              {monat.stellplatz > 0 && (
                <CfZeile
                  label={`🅿️ Stellplatz${monat.spAnzahl > 1 ? ` (${monat.spAnzahl}×)` : ''}`}
                  color="green" einzug
                  monat={a(monat.stellplatz)} jahr={a(monat.stellplatz * 12)}
                />
              )}
              {monat.nkVomMieter > 0 && (
                <CfZeile label="NK vom Mieter (Umlagen)" color="green" einzug
                  monat={a(monat.nkVomMieter)} jahr={a(monat.nkVomMieter * 12)} />
              )}
              <CfZeile label="Σ Einnahmen" color="green" bold separator
                monat={a(monat.gesamtEinnahmen)} jahr={a(monat.gesamtEinnahmen * 12)} />

              {/* BETRIEBSKOSTEN */}
              <tr><td colSpan={3} className="pt-3 pb-0.5 pl-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Bewirtschaftungskosten</td></tr>
              <CfZeile label="Nebenkosten" color="red" monat={a(monat.nk)} jahr={a(monat.nk * 12)} hideZero />
              <CfZeile label="Instandhaltung" color="red" monat={a(monat.inst)} jahr={a(monat.inst * 12)} hideZero />
              <CfZeile label="Verwaltung" color="red" monat={a(monat.verw)} jahr={a(monat.verw * 12)} hideZero />
              <CfZeile label="Hausgeld / WEG" color="red" monat={a(monat.hg)} jahr={a(monat.hg * 12)} hideZero />
              <CfZeile label="Strom" color="red" monat={a(monat.strom)} jahr={a(monat.strom * 12)} hideZero />
              <CfZeile label="Internet" color="red" monat={a(monat.internet)} jahr={a(monat.internet * 12)} hideZero />
              <CfZeile label="Σ Betrieb" color="red" bold separator
                monat={a(monat.gesamtBetrieb)} jahr={a(monat.gesamtBetrieb * 12)} />

              {/* FINANZIERUNG */}
              <tr><td colSpan={3} className="pt-3 pb-0.5 pl-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Finanzierung</td></tr>
              <CfZeile label="Schuldzinsen" color="red"
                monat={a(monat.zinsen)}
                jahr={a(jahresKredit?.zinsen ?? monat.zinsen * 12)} />
              <CfZeile label="Tilgung (Eigenkapitalaufbau)" color="blue" einzug
                monat={a(monat.tilgung)}
                jahr={a(jahresKredit?.tilgung ?? monat.tilgung * 12)} />
              <CfZeile label="Kreditrate gesamt" color="red" bold separator
                monat={a(monat.kreditrate)}
                jahr={a(jahresKredit?.gesamt ?? monat.kreditrate * 12)} />
              {monat.bauspar > 0 && (
                <CfZeile label="Bauspar-Sparrate (Ansparphase)" color="orange"
                  monat={a(monat.bauspar)} jahr={a(monat.bauspar * 12)} />
              )}
            </tbody>
          </table>

          {/* Cashflow-Ergebnis-Block */}
          <div className="mt-4 space-y-2">
            {(() => {
              // Jahreszahlen mit exakten Zinssummen (nicht × 12)
              const jZinsen = jahresKredit?.zinsen ?? monat.zinsen * 12;
              const jGesamt = jahresKredit?.gesamt ?? monat.kreditrate * 12;
              const vorTilgungJahr = a(monat.gesamtEinnahmen) * 12
                - a(monat.gesamtBetrieb) * 12
                - a(jZinsen)
                - a(monat.bauspar) * 12;
              const nachTilgungJahr = a(monat.gesamtEinnahmen) * 12
                - a(monat.gesamtBetrieb) * 12
                - a(jGesamt)
                - a(monat.bauspar) * 12;
              return (
                <>
                  {/* Cashflow vor Tilgung */}
                  <div className={`rounded-xl border px-4 py-3 flex justify-between items-center ${monat.vorTilgung >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div>
                      <div className="font-bold text-sm text-gray-800">Cashflow vor Tilgung</div>
                      <div className="text-[11px] text-gray-500">Einnahmen − Betrieb − Zinsen{monat.bauspar > 0 ? ' − Bauspar' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black ${monat.vorTilgung >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {monat.vorTilgung >= 0 ? '+' : ''}{formatCurrency(a(monat.vorTilgung))}
                        <span className="text-xs font-normal text-gray-400">/Mo</span>
                      </div>
                      <div className={`text-sm font-semibold ${vorTilgungJahr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {vorTilgungJahr >= 0 ? '+' : ''}{formatCurrency(Math.abs(vorTilgungJahr))}
                        <span className="text-xs font-normal text-gray-400">/Jahr</span>
                      </div>
                    </div>
                  </div>

                  {/* Cashflow nach Tilgung */}
                  <div className={`rounded-xl border px-4 py-3 flex justify-between items-center ${monat.nachTilgung >= 0 ? 'bg-emerald-100 border-emerald-300' : 'bg-red-100 border-red-300'}`}>
                    <div>
                      <div className="font-bold text-sm text-gray-800">Cashflow nach Tilgung</div>
                      <div className="text-[11px] text-gray-500">Einnahmen − Betrieb − Kreditrate{monat.bauspar > 0 ? ' − Bauspar' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black ${monat.nachTilgung >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {monat.nachTilgung >= 0 ? '+' : ''}{formatCurrency(a(monat.nachTilgung))}
                        <span className="text-xs font-normal text-gray-400">/Mo</span>
                      </div>
                      <div className={`text-sm font-semibold ${nachTilgungJahr >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {nachTilgungJahr >= 0 ? '+' : ''}{formatCurrency(Math.abs(nachTilgungJahr))}
                        <span className="text-xs font-normal text-gray-400">/Jahr</span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Info zu Tilgung */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <span className="font-semibold">Zur Tilgung:</span> Der Tilgungsanteil ({formatCurrency(a(monat.tilgung))}/Mo) ist kein Verlust — er baut
            Eigenkapital auf. Der Cashflow <em>vor</em> Tilgung zeigt, ob die Immobilie
            aus eigener Kraft alle laufenden Kosten + Zinsen trägt.
            {monat.bauspar > 0 && (
              <span className="block mt-1">
                <span className="font-semibold">Bauspar-Sparrate</span> ({formatCurrency(a(monat.bauspar))}/Mo) ist
                ebenfalls Eigenkapitalaufbau, wird aber im Cashflow berücksichtigt
                da es ein echter monatlicher Geldabfluss ist.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Verlauf & Prognose ─────────────────────────────────────────── */}
      {tab === 'verlauf' && (
        <div className="p-4">
          {/* Disclaimer */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="font-bold">⚠️ Hinweis zu historischen Werten:</span> Die Vorjahres-Cashflows
            sind nur korrekt, wenn Miethistorie und Kostenwerte für die jeweiligen Jahre
            im System gepflegt wurden. Andernfalls werden die aktuellen Basiswerte
            hochgerechnet — was von der Realität abweichen kann.
          </div>

          {/* Mobile: Karten */}
          <div className="sm:hidden space-y-2">
            {verlaufDaten.map(d => (
              <div key={d.jahr} className={`rounded-xl border p-3 ${
                d.istAktuell ? 'bg-blue-50 border-blue-300' :
                d.istPrognose ? 'bg-gray-50 border-dashed border-gray-200' :
                'bg-white border-gray-100'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${d.istAktuell ? 'text-blue-700' : d.istPrognose ? 'text-gray-400' : 'text-gray-700'}`}>
                      {d.jahr}
                    </span>
                    {d.istAktuell && <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">Aktuell</span>}
                    {d.istPrognose && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Prognose</span>}
                    {d.istVorjahr && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Vorjahr</span>}
                  </div>
                  <span className={`font-black text-base ${d.cashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {d.cashflow >= 0 ? '+' : ''}{formatCurrency(Math.round(d.cashflow * anteilFaktor))}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-gray-400 mb-0.5">Einnahmen</div>
                    <div className="text-emerald-600 font-semibold">{formatCurrency(Math.round(d.einnahmen * anteilFaktor))}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-0.5">Betrieb + Kredit</div>
                    <div className="text-red-500 font-semibold">{formatCurrency(Math.round((d.betrieb + d.kreditrate) * anteilFaktor))}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-0.5">Kumuliert</div>
                    <div className={`font-semibold ${d.kumuliert >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.round(d.kumuliert * anteilFaktor))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Tabelle */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left p-2 font-semibold rounded-l">Jahr</th>
                  <th className="text-right p-2 text-emerald-600 font-semibold">Einnahmen</th>
                  <th className="text-right p-2 text-red-500 font-semibold">Betrieb</th>
                  <th className="text-right p-2 text-red-600 font-semibold">Kreditrate</th>
                  <th className="text-right p-2 text-orange-500 font-semibold">Invest.</th>
                  <th className="text-right p-2 text-orange-600 font-semibold">Bauspar</th>
                  <th className="text-right p-2 font-bold text-gray-800">Cashflow</th>
                  <th className="text-right p-2 text-blue-600 font-semibold rounded-r">Kumuliert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verlaufDaten.map(d => (
                  <tr key={d.jahr} className={`${
                    d.istAktuell ? 'bg-blue-50 font-semibold' :
                    d.istPrognose ? 'text-gray-400 bg-gray-50/50' :
                    'hover:bg-gray-50'
                  }`}>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <span>{d.jahr}</span>
                        {d.istAktuell && <span className="text-[9px] bg-blue-200 text-blue-800 px-1 py-0.5 rounded-full font-bold">Aktuell</span>}
                        {d.istPrognose && <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded-full">Prognose</span>}
                        {d.istVorjahr && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">Vorjahr</span>}
                      </div>
                    </td>
                    <td className="p-2 text-right text-emerald-600">{formatCurrency(Math.round(d.einnahmen * anteilFaktor))}</td>
                    <td className="p-2 text-right text-red-500">{formatCurrency(Math.round(d.betrieb * anteilFaktor))}</td>
                    <td className="p-2 text-right text-red-600">{formatCurrency(Math.round(d.kreditrate * anteilFaktor))}</td>
                    <td className="p-2 text-right text-orange-500">{d.investitionen > 0 ? formatCurrency(Math.round(d.investitionen * anteilFaktor)) : '—'}</td>
                    <td className="p-2 text-right text-orange-600">{d.bauspar > 0 ? formatCurrency(Math.round(d.bauspar * anteilFaktor)) : '—'}</td>
                    <td className={`p-2 text-right font-bold ${d.cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
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

          <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
            Prognose-Jahre verwenden aktuelle Miet- und Kostenwerte als Basis.
            Zinsänderungen bei Anschlussfinanzierungen werden aus den Finanzierungsphasen übernommen.
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowUebersicht;
