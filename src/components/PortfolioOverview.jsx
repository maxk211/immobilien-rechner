import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { beleihbarFrei, getBeleihungsgrenze } from '../utils/kapital.js';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuelleWarmmiete, getAktuelleUntermiete, getAktuellerWert } from '../utils/miete.js';
import { berechneMtlCashflow, berechneImmoVermoegenswerte, berechneRendite, getAktuellerGesamtwert, kostenStruktur } from '../utils/berechnung.js';
import PortfolioZiele from './PortfolioZiele';

const PortfolioOverview = ({ portfolio }) => {
  // Beleihungsgrenze ist einstellbar (Menü oben rechts) — bei Änderung neu rechnen
  const [grenze, setGrenze] = useState(getBeleihungsgrenze);
  useEffect(() => {
    const h = () => setGrenze(getBeleihungsgrenze());
    window.addEventListener('renditly-beleihungsgrenze', h);
    return () => window.removeEventListener('renditly-beleihungsgrenze', h);
  }, []);
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
    let gesamtBeleihbarFrei = 0;
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
        const zusatzkosten = vertragsLaeuft ? (immo.arbitrageStrom || 0) + (immo.arbitrageInternet || 0) + (immo.arbitrageGEZ ?? 18.36) + (immo.arbitrageSonstige || 0) : 0;
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
          gesamtBeleihbarFrei += beleihbarFrei(vw.marktwert, vw.restschuld, grenze);
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
          : kostenStruktur(immo, (f) => getAktuellerWert(immo, f)).bewirtschaftung;
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
      gesamtBeleihbarFrei,
      vermoegenProImmo,
    };
  }, [portfolio, grenze]);

  if (portfolio.length === 0) return null;

  // Teil 3, Abschnitt 3 + 9: vier Kennzahlen, Cashflow vor UND nach Tilgung.
  // "Vermögensaufbau pro Objekt" ist raus (steht in jedem Objekt selbst).
  const cfNach = stats.gesamtCashflowMonat;
  const tilgungMonat = stats.gesamtTilgungJahr / 12;
  const cfVor = cfNach + tilgungMonat;
  const vz = (v) => (v >= 0 ? '+' : '');
  const kachel = 'rounded-2xl bg-white border border-gray-200 p-3 sm:p-5 shadow-sm';
  const label = 'text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1';

  return (
    <div className="mb-6 sm:mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        {/* Cashflow / Monat — nach und vor Tilgung */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl bg-ink text-white p-3 sm:p-5 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Cashflow / Monat</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={`text-2xl sm:text-3xl font-black ${cfNach >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{vz(cfNach)}{formatCurrency(cfNach)}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mt-0.5">nach Tilgung</div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-black ${cfVor >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{vz(cfVor)}{formatCurrency(cfVor)}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mt-0.5">vor Tilgung</div>
            </div>
          </div>
          {tilgungMonat > 0 && (
            <p className="text-xs text-white/60 mt-3 leading-snug">
              {formatCurrency(tilgungMonat)} Tilgung pro Monat sind kein Verlust — sie bauen Eigenkapital auf.
            </p>
          )}
        </div>

        {/* Mieteinnahmen */}
        <div className={kachel}>
          <div className={label}>Mieteinnahmen</div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">{formatCurrency(stats.gesamtMieteMonat)}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">{formatCurrency(stats.gesamtMieteJahr)} p. a.</div>
        </div>

        {/* Portfoliowert */}
        <div className={kachel}>
          <div className={label}>Portfoliowert</div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">{formatCurrency(stats.gesamtWert)}</div>
          {stats.wertsteigerung !== 0 ? (
            <div className={`text-xs mt-1 font-semibold flex items-center gap-0.5 ${stats.wertsteigerung >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {stats.wertsteigerung >= 0 ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              {vz(stats.wertsteigerung)}{formatCurrency(stats.wertsteigerung)} über {stats.anzahlKaufimmobilien} Objekt{stats.anzahlKaufimmobilien !== 1 ? 'e' : ''}
            </div>
          ) : (
            <div className="text-xs text-gray-400 mt-1">{stats.anzahl} Objekt{stats.anzahl !== 1 ? 'e' : ''}</div>
          )}
        </div>

        {/* Dein Anteil am Portfolio + Beleihungsspielraum gesamt */}
        <div className={kachel}>
          <div className={label} title="Marktwert minus Restschuld — nicht frei verfügbar, nur über Verkauf oder Beleihung erreichbar">Dein Anteil am Portfolio</div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">{formatCurrency(stats.gesamtFreiesVermoegen)}</div>
          <div className="text-xs text-gray-400 mt-1">Marktwert − {formatCurrency(stats.gesamtRestschuld)} Restschuld</div>
          {stats.anzahlKaufimmobilien > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100" title={`${grenze} % vom Marktwert minus Restschuld, je Objekt mindestens 0. Grenze änderbar im Menü oben rechts.`}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Beleihungsspielraum gesamt</div>
              <div className="text-sm font-bold text-emerald-700">{formatCurrency(stats.gesamtBeleihbarFrei)} <span className="text-xs font-medium text-gray-400">bei {grenze} %</span></div>
            </div>
          )}
        </div>
      </div>

      {stats.anzahlKaufimmobilien > 0 && (
        <div className="mb-4">
          <PortfolioZiele portfolio={portfolio} inline />
        </div>
      )}
    </div>
  );
};



export default PortfolioOverview;
