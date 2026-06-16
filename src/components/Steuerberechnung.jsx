import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete } from '../utils/miete.js';

const Steuerberechnung = ({ params, ergebnis, immobilie, onUpdateParams }) => {
  const aktuellesJahr = new Date().getFullYear();
  const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : aktuellesJahr;

  const [selectedJahr, setSelectedJahr] = useState(aktuellesJahr);
  const [showEinmaleffekteHerausrechnen, setShowEinmaleffekteHerausrechnen] = useState(false);
  const [showFahrtForm, setShowFahrtForm] = useState(false);
  const [neueFahrt, setNeueFahrt] = useState({
    datum: new Date().toISOString().split('T')[0],
    grund: '',
    km: params.entfernungKm || 0
  });

  // Werte aus params lesen (persistent)
  const steuersatz = params.steuersatz || 42;
  const gebaeudeAnteilProzent = params.gebaeudeAnteilProzent || 80;
  const afaSatz = params.afaSatz || 2.0;
  const fahrtkostenModus = params.fahrtkostenModus || 'pauschal';
  const fahrtenProMonat = params.fahrtenProMonat || 0;
  const entfernungKm = params.entfernungKm || 0;
  const kmPauschale = params.kmPauschale || 0.30;
  const fahrtenListe = params.fahrtenListe || [];
  const investitionen = params.investitionen || [];

  const fahrtGruende = ['Wohnungsbesichtigung', 'Mieterkontakt', 'Reparatur/Handwerker', 'Zählerablesung', 'Übergabe/Abnahme', 'Kontrolle', 'Sonstiges'];

  // Investitions-Kategorien mit steuerlicher Behandlung
  const steuerKategorien = {
    'erhaltung': { label: 'Erhaltungsaufwand', steuer: 'sofort', icon: '⚠️' },
    'herstellung': { label: 'Herstellungskosten', steuer: 'afa', icon: '🔁' },
    'anschaffung': { label: 'Anschaffungsnebenk.', steuer: 'afa', icon: '🔁' },
    'modernisierung': { label: 'Modernisierung', steuer: 'afa', icon: '🏗' },
    'nicht_relevant': { label: 'Nicht steuerlich', steuer: 'keine', icon: '📦' }
  };

  // Helper zum Aktualisieren der params
  const updateSteuerParams = (updates) => {
    if (onUpdateParams) {
      onUpdateParams({ ...params, ...updates });
    }
  };

  const handleAddFahrt = () => {
    if (!neueFahrt.datum || !neueFahrt.km) return;
    const updated = [...fahrtenListe, { ...neueFahrt, id: Date.now() }];
    updateSteuerParams({ fahrtenListe: updated });
    setNeueFahrt({ datum: new Date().toISOString().split('T')[0], grund: '', km: entfernungKm || 0 });
    setShowFahrtForm(false);
  };

  const handleDeleteFahrt = (id) => {
    updateSteuerParams({ fahrtenListe: fahrtenListe.filter(f => f.id !== id) });
  };

  // Jahre für Auswahl generieren
  const verfuegbareJahre = [];
  for (let j = kaufjahr; j <= aktuellesJahr + 2; j++) {
    verfuegbareJahre.push(j);
  }

  // Berechne Steuer für ein bestimmtes Jahr
  const berechneJahresSteuer = (jahr, bereinigt = false) => {
    const jahreIndex = jahr - kaufjahr;
    if (jahreIndex < 0) return null;

    // Mieteinnahmen: mietHistorie[Jahr].kaltmiete falls händisch, sonst Basismiete
    const histMieteSteuer = (params.mietHistorie || {})[`${jahr}`];
    const jahresMiete = (histMieteSteuer?.kaltmiete != null ? histMieteSteuer.kaltmiete : getAktuelleMiete(params)) * 12;

    // Laufende Kosten (Werbungskosten)
    const laufendeKosten = (params.instandhaltung + params.verwaltung + (params.hausgeld || 0)) * 12;

    // Finanzierungskosten (nur Zinsen - Tilgung ist nicht absetzbar!)
    const zinssatz = params.zinssatz ?? 4.0;
    const kaufnebenkosten = params.kaufnebenkosten ?? 10;
    const kaufnebenkostenAbsolut = params.kaufpreis * (kaufnebenkosten / 100);
    const gesamtinvestition = params.kaufpreis + kaufnebenkostenAbsolut;
    const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
      ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
      : (params.eigenkapital ?? params.kaufpreis * 0.2);
    const anfangsFremdkapital = params.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);

    // Restschuld für dieses Jahr berechnen
    const monatszins = zinssatz / 100 / 12;
    const laufzeit = params.laufzeit ?? 25;
    let annuitaet = 0;
    if (anfangsFremdkapital > 0 && monatszins > 0) {
      annuitaet = anfangsFremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) / (Math.pow(1 + monatszins, laufzeit * 12) - 1);
    }

    let restschuld = anfangsFremdkapital;
    for (let m = 0; m < jahreIndex * 12 && restschuld > 0; m++) {
      const monatsZinsen = restschuld * monatszins;
      const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
      restschuld = Math.max(0, restschuld - monatsTilgung);
    }

    // Zinsen für dieses Jahr
    let jahresZinsen = 0;
    for (let m = 0; m < 12 && restschuld > 0; m++) {
      const monatsZinsen = restschuld * monatszins;
      jahresZinsen += monatsZinsen;
      const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
      restschuld = Math.max(0, restschuld - monatsTilgung);
    }

    // AfA Basis-Berechnung
    const gebaeudeAnteil = params.kaufpreis * (gebaeudeAnteilProzent / 100);
    let afaBemessungsgrundlage = gebaeudeAnteil;

    // AfA-relevante Investitionen aus Vorjahren hinzurechnen
    const afaInvestitionenBisJahr = investitionen.filter(inv => {
      const invJahr = new Date(inv.datum).getFullYear();
      const kat = steuerKategorien[inv.kategorie || 'erhaltung'];
      return invJahr <= jahr && kat?.steuer === 'afa';
    });
    const zusaetzlicheAfABasis = afaInvestitionenBisJahr.reduce((sum, inv) => sum + inv.betrag, 0);
    afaBemessungsgrundlage += zusaetzlicheAfABasis;

    const jahresAfa = afaBemessungsgrundlage * (afaSatz / 100);

    // Investitionen dieses Jahres
    const investitionenDiesesJahr = investitionen.filter(inv => new Date(inv.datum).getFullYear() === jahr);
    const sofortAbsetzbar = investitionenDiesesJahr
      .filter(inv => steuerKategorien[inv.kategorie || 'erhaltung']?.steuer === 'sofort')
      .reduce((sum, inv) => sum + inv.betrag, 0);
    const afaRelevant = investitionenDiesesJahr
      .filter(inv => steuerKategorien[inv.kategorie || 'erhaltung']?.steuer === 'afa')
      .reduce((sum, inv) => sum + inv.betrag, 0);
    const nichtRelevant = investitionenDiesesJahr
      .filter(inv => steuerKategorien[inv.kategorie || 'erhaltung']?.steuer === 'keine')
      .reduce((sum, inv) => sum + inv.betrag, 0);

    // Fahrtkosten für dieses Jahr
    let jahresFahrtkosten = 0;
    if (fahrtkostenModus === 'pauschal') {
      jahresFahrtkosten = fahrtenProMonat * 12 * entfernungKm * 2 * kmPauschale;
    } else {
      const fahrtenDiesesJahr = fahrtenListe.filter(f => new Date(f.datum).getFullYear() === jahr);
      jahresFahrtkosten = fahrtenDiesesJahr.reduce((sum, f) => sum + (f.km * 2 * kmPauschale), 0);
    }

    // Bereinigung: Einmaleffekte herausrechnen
    const einmaleffekte = bereinigt ? sofortAbsetzbar : 0;

    // Steuerliche Berechnung
    const absetzbareKosten = jahresAfa + jahresZinsen + laufendeKosten + jahresFahrtkosten + (bereinigt ? 0 : sofortAbsetzbar);
    const zuVersteuern = jahresMiete - absetzbareKosten;
    const steuerEffekt = zuVersteuern * (steuersatz / 100);

    // Jahr-Typ bestimmen
    let jahrTyp = 'normal';
    if (investitionenDiesesJahr.length > 0 && (sofortAbsetzbar + afaRelevant) > jahresMiete * 0.5) {
      jahrTyp = 'investition';
    } else if (jahresZinsen > jahresMiete * 0.7) {
      jahrTyp = 'finanzierung';
    }

    return {
      jahr,
      jahrTyp,
      einnahmen: Math.round(jahresMiete),
      laufendeKosten: Math.round(laufendeKosten),
      zinsen: Math.round(jahresZinsen),
      afa: Math.round(jahresAfa),
      afaBemessungsgrundlage: Math.round(afaBemessungsgrundlage),
      fahrtkosten: Math.round(jahresFahrtkosten),
      investitionenSofort: Math.round(sofortAbsetzbar),
      investitionenAfa: Math.round(afaRelevant),
      investitionenNichtRelevant: Math.round(nichtRelevant),
      investitionenGesamt: investitionenDiesesJahr,
      absetzbareKosten: Math.round(absetzbareKosten),
      zuVersteuern: Math.round(zuVersteuern),
      steuerEffekt: Math.round(steuerEffekt),
      restschuld: Math.round(restschuld),
      einmaleffekte: Math.round(einmaleffekte)
    };
  };

  const selectedDaten = berechneJahresSteuer(selectedJahr, showEinmaleffekteHerausrechnen);
  const selectedDatenReal = berechneJahresSteuer(selectedJahr, false);
  const afaJahre = afaSatz > 0 ? Math.round(100 / afaSatz) : 0;

  // Fahrten für gewähltes Jahr
  const fahrtenSelectedJahr = fahrtenListe.filter(f => new Date(f.datum).getFullYear() === selectedJahr);

  return (
    <div className="space-y-4">
      {/* Header mit Jahresauswahl */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="font-bold text-lg text-gray-800">📋 Steuerberechnung</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Steuerjahr:</span>
            <div className="flex flex-wrap gap-1">
              {verfuegbareJahre.map(j => {
                const jDaten = berechneJahresSteuer(j);
                const isInvest = jDaten?.jahrTyp === 'investition';
                const isFinanz = jDaten?.jahrTyp === 'finanzierung';
                return (
                  <button
                    key={j}
                    onClick={() => setSelectedJahr(j)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      selectedJahr === j
                        ? 'bg-blue-600 text-white font-semibold'
                        : isInvest
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : isFinanz
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isInvest ? 'Investitionsjahr' : isFinanz ? 'Finanzierungsstarkes Jahr' : 'Normales Jahr'}
                  >
                    {j}
                    {isInvest && ' 🔨'}
                    {isFinanz && ' 🏦'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Jahr-Typ Badge */}
        {selectedDaten && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            selectedDaten.jahrTyp === 'investition' ? 'bg-orange-100 text-orange-700' :
            selectedDaten.jahrTyp === 'finanzierung' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {selectedDaten.jahrTyp === 'investition' && '🔨 Investitionsjahr'}
            {selectedDaten.jahrTyp === 'finanzierung' && '🏦 Finanzierungsstarkes Jahr'}
            {selectedDaten.jahrTyp === 'normal' && '📊 Normales Vermietungsjahr'}
          </div>
        )}

        {/* Persönlicher Steuersatz */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Persönlicher Steuersatz</label>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="45" value={steuersatz}
              onChange={(e) => updateSteuerParams({ steuersatz: parseInt(e.target.value) })}
              className="flex-1" />
            <span className="w-12 text-right font-semibold">{steuersatz}%</span>
          </div>
        </div>
      </div>

      {/* Transparente Steuerformel */}
      {selectedDaten && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">📊 Steuerliche Berechnung {selectedJahr}</h4>

          <div className="space-y-2 text-sm">
            {/* Einnahmen */}
            <div className="flex justify-between items-center py-2 border-b border-green-200 bg-green-50 px-3 rounded">
              <span className="text-green-700 font-medium">+ Mieteinnahmen</span>
              <span className="font-semibold text-green-700">{formatCurrency(selectedDaten.einnahmen)}</span>
            </div>

            {/* Kosten */}
            <div className="flex justify-between items-center py-1 px-3">
              <span className="text-red-600">− Laufende Kosten <span className="text-xs text-gray-400">(Inst., Verw., Hausgeld)</span></span>
              <span className="text-red-600">{formatCurrency(selectedDaten.laufendeKosten)}</span>
            </div>

            <div className="flex justify-between items-center py-1 px-3">
              <span className="text-red-600">− Schuldzinsen <span className="text-xs text-gray-400">(nicht Tilgung!)</span></span>
              <span className="text-red-600">{formatCurrency(selectedDaten.zinsen)}</span>
            </div>

            {selectedDaten.fahrtkosten > 0 && (
              <div className="flex justify-between items-center py-1 px-3">
                <span className="text-red-600">− Fahrtkosten</span>
                <span className="text-red-600">{formatCurrency(selectedDaten.fahrtkosten)}</span>
              </div>
            )}

            {selectedDaten.investitionenSofort > 0 && (
              <div className="flex justify-between items-center py-1 px-3 bg-orange-50 rounded">
                <span className="text-orange-600">− Erhaltungsaufwand <span className="text-xs">⚠️ Einmaleffekt</span></span>
                <span className="text-orange-600">{formatCurrency(selectedDaten.investitionenSofort)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 px-3">
              <span className="text-red-600">− AfA <span className="text-xs text-gray-400">({afaSatz}% von {formatCurrency(selectedDaten.afaBemessungsgrundlage)})</span></span>
              <span className="text-red-600">{formatCurrency(selectedDaten.afa)}</span>
            </div>

            {/* Ergebnis */}
            <div className="flex justify-between items-center py-2 px-3 border-t-2 border-gray-300 mt-2">
              <span className="font-semibold">= Steuerlicher Überschuss/Verlust</span>
              <span className={`font-bold ${selectedDaten.zuVersteuern >= 0 ? 'text-gray-800' : 'text-green-600'}`}>
                {formatCurrency(selectedDaten.zuVersteuern)}
              </span>
            </div>

            {/* Steuereffekt */}
            <div className={`flex justify-between items-center py-3 px-4 rounded-lg mt-2 ${selectedDaten.steuerEffekt > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div>
                <span className="font-semibold">{selectedDaten.steuerEffekt > 0 ? 'Steuerlast' : 'Steuerersparnis'}</span>
                <span className="text-xs text-gray-500 block">bei {steuersatz}% Steuersatz</span>
              </div>
              <span className={`text-xl font-bold ${selectedDaten.steuerEffekt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedDaten.steuerEffekt > 0 ? '−' : '+'}{formatCurrency(Math.abs(selectedDaten.steuerEffekt))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bereinigtes Ergebnis Toggle */}
      {selectedDaten && selectedDaten.investitionenSofort > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEinmaleffekteHerausrechnen}
                onChange={(e) => setShowEinmaleffekteHerausrechnen(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium text-yellow-800">Einmaleffekte herausrechnen</span>
            </label>
          </div>
          {showEinmaleffekteHerausrechnen && (
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div className="bg-white p-3 rounded">
                <div className="text-xs text-gray-500">Real ({selectedJahr})</div>
                <div className={`font-bold ${selectedDatenReal.steuerEffekt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedDatenReal.steuerEffekt > 0 ? '−' : '+'}{formatCurrency(Math.abs(selectedDatenReal.steuerEffekt))}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-xs text-gray-500">Bereinigt (ohne Einmaleffekte)</div>
                <div className={`font-bold ${selectedDaten.steuerEffekt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedDaten.steuerEffekt > 0 ? '−' : '+'}{formatCurrency(Math.abs(selectedDaten.steuerEffekt))}
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-yellow-700 mt-2">
            💡 So würde sich die Immobilie in einem normalen Jahr darstellen (ohne {formatCurrency(selectedDaten.investitionenSofort)} Erhaltungsaufwand).
          </p>
        </div>
      )}

      {/* Investitionen & steuerliche Behandlung */}
      {selectedDaten && selectedDaten.investitionenGesamt.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">🔧 Investitionen {selectedJahr} & steuerliche Behandlung</h4>
          <div className="space-y-2">
            {selectedDaten.investitionenGesamt.map(inv => {
              const kat = steuerKategorien[inv.kategorie || 'erhaltung'];
              return (
                <div key={inv.id} className={`flex justify-between items-center p-2 rounded text-sm ${
                  kat?.steuer === 'sofort' ? 'bg-orange-50' :
                  kat?.steuer === 'afa' ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{kat?.icon}</span>
                    <div>
                      <div className="font-medium">{inv.beschreibung}</div>
                      <div className="text-xs text-gray-500">{kat?.label}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(inv.betrag)}</div>
                    <div className="text-xs text-gray-500">
                      {kat?.steuer === 'sofort' && 'Sofort absetzbar'}
                      {kat?.steuer === 'afa' && `AfA über ${afaJahre} Jahre`}
                      {kat?.steuer === 'keine' && 'Keine Steuerwirkung'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedDaten.investitionenAfa > 0 && (
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              🔁 <strong>{formatCurrency(selectedDaten.investitionenAfa)}</strong> erhöhen die AfA-Bemessungsgrundlage und wirken über {afaJahre} Jahre.
            </div>
          )}
        </div>
      )}

      {/* Finanzierung Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">🏦 Finanzierungskosten {selectedJahr}</h4>
        {selectedDaten && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-red-50 rounded">
              <div>
                <span className="font-medium text-red-700">Schuldzinsen</span>
                <span className="text-xs text-red-600 block">steuerlich absetzbar</span>
              </div>
              <span className="font-bold text-red-700">{formatCurrency(selectedDaten.zinsen)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium text-gray-600">Tilgung</span>
                <span className="text-xs text-gray-500 block">nur Cashflow, keine Steuerwirkung</span>
              </div>
              <span className="font-bold text-gray-500">{formatCurrency((ergebnis.monatlicheRate * 12) - selectedDaten.zinsen)}</span>
            </div>
          </div>
        )}
        <div className="mt-3 p-2 bg-purple-50 rounded text-xs text-purple-700">
          💡 <strong>Tilgung verbessert Vermögen, senkt aber nicht die Steuer.</strong> Nur Zinsen sind absetzbar.
        </div>
      </div>

      {/* AfA Einstellungen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">📉 AfA-Einstellungen</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Gebäudeanteil (AfA-Basis)</label>
            <div className="flex items-center gap-1 mb-1">
              <input type="number" min="0" max="100" step="0.5" value={gebaeudeAnteilProzent}
                onChange={(e) => updateSteuerParams({ gebaeudeAnteilProzent: parseFloat(e.target.value) || 0 })}
                className="w-16 px-2 py-1 border rounded text-sm text-right" />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="number" min="0" step="1000"
                value={Math.round(params.kaufpreis * (gebaeudeAnteilProzent / 100))}
                onChange={(e) => {
                  const absWert = parseFloat(e.target.value) || 0;
                  const neuProzent = params.kaufpreis > 0 ? (absWert / params.kaufpreis) * 100 : 0;
                  updateSteuerParams({ gebaeudeAnteilProzent: Math.min(100, Math.round(neuProzent * 10) / 10) });
                }}
                className="w-24 px-2 py-1 border border-blue-300 rounded text-sm text-right bg-blue-50" />
              <span className="text-sm text-gray-600">€</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Prozent oder €-Betrag eingeben — beides synchronisiert sich</div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">AfA-Satz</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="10" step="0.5" value={afaSatz}
                onChange={(e) => updateSteuerParams({ afaSatz: parseFloat(e.target.value) || 0 })}
                className="w-20 px-2 py-1 border rounded text-sm text-right" />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{afaJahre} Jahre linear</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-3 p-2 bg-blue-50 rounded">
          💡 <strong>AfA ist ein Recheneffekt, kein Geldabfluss.</strong> Standard: 2% (50 J.) oder 2,5% vor 1925 (40 J.)
        </div>
      </div>

      {/* Fahrtkosten */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800">🚗 Fahrtkosten {selectedJahr}</h4>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => updateSteuerParams({ fahrtkostenModus: 'pauschal' })}
              className={`px-2 py-1 text-xs rounded-md ${fahrtkostenModus === 'pauschal' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}>
              Pauschal
            </button>
            <button onClick={() => updateSteuerParams({ fahrtkostenModus: 'manuell' })}
              className={`px-2 py-1 text-xs rounded-md ${fahrtkostenModus === 'manuell' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}>
              Einzeln
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Entfernung (einfach)</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" value={entfernungKm}
                onChange={(e) => updateSteuerParams({ entfernungKm: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-sm text-right" />
              <span className="text-xs text-gray-500">km</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">km-Pauschale</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="1" step="0.01" value={kmPauschale}
                onChange={(e) => updateSteuerParams({ kmPauschale: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-sm text-right" />
              <span className="text-xs text-gray-500">€</span>
            </div>
          </div>
        </div>

        {fahrtkostenModus === 'pauschal' ? (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fahrten pro Monat</label>
            <input type="number" min="0" max="30" value={fahrtenProMonat}
              onChange={(e) => updateSteuerParams({ fahrtenProMonat: parseFloat(e.target.value) || 0 })}
              className="w-24 px-2 py-1 border rounded text-sm text-right" />
            {fahrtenProMonat > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                = {fahrtenProMonat} × 12 × {entfernungKm} km × 2 × {kmPauschale.toFixed(2)} € = <strong>{formatCurrency(fahrtenProMonat * 12 * entfernungKm * 2 * kmPauschale)}</strong>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Fahrten in {selectedJahr}: {fahrtenSelectedJahr.length}</span>
              <button onClick={() => setShowFahrtForm(!showFahrtForm)}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                + Fahrt
              </button>
            </div>
            {showFahrtForm && (
              <div className="bg-gray-50 p-2 rounded border mb-2">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Datum</label>
                    <input type="date" value={neueFahrt.datum}
                      onChange={(e) => setNeueFahrt({...neueFahrt, datum: e.target.value})}
                      className="w-full px-2 py-1 border rounded text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">km</label>
                    <input type="number" value={neueFahrt.km}
                      onChange={(e) => setNeueFahrt({...neueFahrt, km: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 border rounded text-xs text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Grund</label>
                    <select value={neueFahrt.grund}
                      onChange={(e) => setNeueFahrt({...neueFahrt, grund: e.target.value})}
                      className="w-full px-2 py-1 border rounded text-xs">
                      <option value="">Auswählen...</option>
                      {fahrtGruende.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddFahrt} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Speichern</button>
                  <button onClick={() => setShowFahrtForm(false)} className="px-2 py-1 bg-gray-300 text-xs rounded">Abbrechen</button>
                </div>
              </div>
            )}
            {fahrtenSelectedJahr.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {fahrtenSelectedJahr.sort((a, b) => new Date(b.datum) - new Date(a.datum)).map(f => (
                  <div key={f.id} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded">
                    <span>{new Date(f.datum).toLocaleDateString('de-DE')} - {f.grund || 'Ohne Grund'}</span>
                    <div className="flex items-center gap-2">
                      <span>{f.km} km ({formatCurrency(f.km * 2 * kmPauschale)})</span>
                      <button onClick={() => handleDeleteFahrt(f.id)} className="text-red-400 hover:text-red-600">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hinweise */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-2">💡 Steuer-Tipps</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Investitionen</strong> wirken steuerlich nicht immer sofort – Herstellungskosten werden über AfA verteilt.</li>
          <li>• <strong>Zinsen</strong> senken die Steuer – Tilgung nicht (nur Vermögensaufbau).</li>
          <li>• <strong>AfA</strong> ist ein Recheneffekt, kein Geldabfluss – mindert aber die Steuerlast.</li>
          <li>• <strong>Einmalige Investitionen</strong> (Erhaltungsaufwand) können einzelne Jahre stark verzerren.</li>
        </ul>
        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          ⚠️ Vereinfachte Berechnung. Konsultieren Sie einen Steuerberater für verbindliche Auskünfte.
        </div>
      </div>
    </div>
  );
};

// Reparaturen & Investitionen Komponente

export default Steuerberechnung;
