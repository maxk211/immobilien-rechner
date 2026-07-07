import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete } from '../utils/miete.js';
import { berechneZinsUndTilgung } from '../utils/berechnung.js';

const Steuerberechnung = ({ params, ergebnis, immobilie, onUpdateParams, anteilFaktor = 1 }) => {
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
  const afaAnpassungen = params.afaAnpassungen || [];
  const afaModus = params.afaModus || 'linear';
  const afaDegressivWechseljahr = params.afaDegressivWechseljahr || null;
  const istDegressiv = afaModus === 'degressiv';
  const fahrtkostenModus = params.fahrtkostenModus || 'pauschal';
  const fahrtenProMonat = params.fahrtenProMonat || 0;
  const entfernungKm = params.entfernungKm || 0;
  const kmPauschale = params.kmPauschale || 0.30;
  const fahrtenListe = params.fahrtenListe || [];
  const investitionen = params.investitionen || [];
  // Neue Anlage-V-Felder
  const grundsteuerMonat = params.grundsteuerMonat || 0;
  const versicherungMonat = params.versicherungMonat || 0;

  // AfA-Rate für ein bestimmtes Jahr bestimmen
  // Phasen überschreiben den Basis-afaSatz ab dem jeweiligen vonJahr
  const getAfaSatzFuerJahr = (jahr) => {
    if (afaAnpassungen.length === 0) return afaSatz;
    const gueltig = afaAnpassungen
      .filter(a => a.vonJahr <= jahr)
      .sort((a, b) => b.vonJahr - a.vonJahr);
    return gueltig.length > 0 ? gueltig[0].afaSatz : afaSatz;
  };

  // Degressive AfA (§ 7 Abs. 5a EStG): 5% vom Restbuchwert, iterativ vom Kaufjahr
  // Wechseljahr: ab diesem Jahr linear (Restbuchwert / verbleibende Nutzungsdauer)
  const degressiveAfaFuerJahr = (basiswert, targetJahr) => {
    if (!basiswert || targetJahr < kaufjahr) return { afa: 0, restbuchwert: basiswert };
    const nutzungsdauer = afaSatz > 0 ? Math.round(100 / afaSatz) : 50; // lineare Referenz-ND
    let restbuchwert = basiswert;
    let linearAfaProJahr = null; // wird beim Wechsel fixiert

    for (let j = kaufjahr; j <= targetJahr; j++) {
      let afa;
      if (afaDegressivWechseljahr && j >= afaDegressivWechseljahr) {
        if (linearAfaProJahr === null) {
          const verbleibendeJahre = Math.max(1, nutzungsdauer - (afaDegressivWechseljahr - kaufjahr));
          linearAfaProJahr = restbuchwert / verbleibendeJahre;
        }
        afa = Math.min(linearAfaProJahr, restbuchwert);
      } else {
        afa = restbuchwert * 0.05;
      }
      if (j === targetJahr) return { afa, restbuchwert: Math.max(0, restbuchwert - afa) };
      restbuchwert = Math.max(0, restbuchwert - afa);
    }
    return { afa: 0, restbuchwert };
  };

  const a = (v) => Math.round(v * anteilFaktor);
  const isGbR = anteilFaktor !== 1;

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
    const jahresKaltmiete = (histMieteSteuer?.kaltmiete != null ? histMieteSteuer.kaltmiete : getAktuelleMiete(params)) * 12;

    // NK vom Mieter (Umlagen) — Anlage V Zeile 6
    const nkModus = params.vermietungsmodell || 'kaltmiete';
    const nkBetrag = nkModus === 'kaltmiete_nk' ? (params.nebenkostenVomMieter || 0) : 0;
    const jahresNK = nkBetrag * 12;
    const jahresMiete = jahresKaltmiete; // Kaltmiete für Rechnung — NK separat

    // Laufende Kosten (Werbungskosten) — aufgeteilt für Anlage V
    const jahresInstandhaltung = (params.instandhaltung || 0) * 12;
    const jahresVerwaltung = (params.verwaltung || 0) * 12;
    const jahresHausgeld = (params.hausgeld || 0) * 12;
    const jahresGrundsteuer = grundsteuerMonat * 12;
    const jahresVersicherung = versicherungMonat * 12;
    const jahresNebenkosten = (params.nebenkosten || 0) * 12; // sonstige Betriebskosten (§ 9 EStG Z. 50)
    const laufendeKosten = jahresInstandhaltung + jahresVerwaltung + jahresHausgeld + jahresGrundsteuer + jahresVersicherung + jahresNebenkosten;

    // Finanzierungskosten (nur Zinsen - Tilgung ist nicht absetzbar!)
    // Exakte Berechnung mit Anschlussfinanzierungs-Unterstützung (monatsgenaue Iteration)
    const zinsResult = berechneZinsUndTilgung(params, jahr);
    const jahresZinsen = zinsResult?.zinsen ?? 0;
    const jahresTilgung = zinsResult?.tilgung ?? 0;
    const restschuld = zinsResult?.restschuldEnde ?? 0;

    // AfA Basis-Berechnung
    const gebaeudeAnteil = params.kaufpreis * (gebaeudeAnteilProzent / 100);

    // AfA-relevante Investitionen (immer linear, unabhängig vom Modus)
    const afaInvestitionenBisJahr = investitionen.filter(inv => {
      const invJahr = new Date(inv.datum).getFullYear();
      const kat = steuerKategorien[inv.kategorie || 'erhaltung'];
      return invJahr <= jahr && kat?.steuer === 'afa';
    });
    const zusaetzlicheAfABasis = afaInvestitionenBisJahr.reduce((sum, inv) => sum + inv.betrag, 0);

    let jahresAfa, gueltigerAfaSatz, afaBemessungsgrundlage, restbuchwert;
    if (istDegressiv) {
      // Degressiv: 5% vom Restbuchwert, iterativ
      const deg = degressiveAfaFuerJahr(gebaeudeAnteil, jahr);
      jahresAfa = deg.afa + zusaetzlicheAfABasis * (afaSatz / 100); // Investitionen linear dazu
      restbuchwert = deg.restbuchwert;
      gueltigerAfaSatz = 5.0; // Anzeige-Satz
      afaBemessungsgrundlage = gebaeudeAnteil; // Ursprungsbasis zur Anzeige
    } else {
      afaBemessungsgrundlage = gebaeudeAnteil + zusaetzlicheAfABasis;
      gueltigerAfaSatz = getAfaSatzFuerJahr(jahr);
      jahresAfa = afaBemessungsgrundlage * (gueltigerAfaSatz / 100);
      restbuchwert = null;
    }

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

    // Steuerliche Berechnung — NK vom Mieter ist Einnahme UND Werbungskosten (Durchlaufposten)
    // In der Praxis: NK-Einnahmen müssen deklariert werden, NK-Ausgaben sind Werbungskosten
    // Vereinfacht: NK-Einnahmen + NK-Ausgaben heben sich auf → hier nur Überschuss relevant
    const gesamtEinnahmen = jahresMiete + jahresNK;
    const absetzbareKosten = jahresAfa + jahresZinsen + laufendeKosten + jahresFahrtkosten + (bereinigt ? 0 : sofortAbsetzbar);
    const zuVersteuern = gesamtEinnahmen - absetzbareKosten;
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
      // Einnahmen (Anlage V)
      einnahmen: Math.round(jahresMiete),          // Kaltmiete
      nkEinnahmen: Math.round(jahresNK),           // Z. 6 — NK vom Mieter
      gesamtEinnahmen: Math.round(gesamtEinnahmen),
      // Werbungskosten (Anlage V)
      zinsen: Math.round(jahresZinsen),            // Z. 9 — Schuldzinsen
      afa: Math.round(jahresAfa),                  // Z. 13/14 — AfA
      afaBemessungsgrundlage: Math.round(afaBemessungsgrundlage),
      gueltigerAfaSatz,
      restbuchwert: restbuchwert !== null ? Math.round(restbuchwert) : null,
      instandhaltung: Math.round(jahresInstandhaltung), // Z. 33 — Erhaltungsaufwand laufend
      verwaltung: Math.round(jahresVerwaltung),    // Z. 34 — Verwaltungskosten
      hausgeld: Math.round(jahresHausgeld),        // Z. 35 — Hausgeld/WEG
      grundsteuer: Math.round(jahresGrundsteuer),  // Z. 34 — Grundsteuer
      versicherung: Math.round(jahresVersicherung),// Z. 35 — Versicherungen
      nebenkosten: Math.round(jahresNebenkosten),  // Z. 50 — Sonstige Werbungskosten
      fahrtkosten: Math.round(jahresFahrtkosten),  // Z. 40 — Fahrtkosten
      investitionenSofort: Math.round(sofortAbsetzbar), // Z. 33 — Erhaltungsaufwand einmalig
      investitionenAfa: Math.round(afaRelevant),
      investitionenNichtRelevant: Math.round(nichtRelevant),
      investitionenGesamt: investitionenDiesesJahr,
      laufendeKosten: Math.round(laufendeKosten),
      absetzbareKosten: Math.round(absetzbareKosten),
      zuVersteuern: Math.round(zuVersteuern),      // Z. 54 — Einkünfte V+V
      steuerEffekt: Math.round(steuerEffekt),
      restschuld: Math.round(restschuld),           // Restschuld zum Jahresende (exakt, phasenaware)
      tilgung: Math.round(jahresTilgung),           // Tilgung dieses Jahres (exakt)
      einmaleffekte: Math.round(einmaleffekte)
    };
  };

  const selectedDaten = berechneJahresSteuer(selectedJahr, showEinmaleffekteHerausrechnen);
  const selectedDatenReal = berechneJahresSteuer(selectedJahr, false);
  const afaJahre = afaSatz > 0 ? Math.round(100 / afaSatz) : 0;

  // Fahrten für gewähltes Jahr
  const fahrtenSelectedJahr = fahrtenListe.filter(f => new Date(f.datum).getFullYear() === selectedJahr);

  // ── Anlage V Excel-Export ─────────────────────────────────────────────────
  const exportAnlageV = () => {
    const immoName = params.name || params.adresse || 'Immobilie';
    const wb = XLSX.utils.book_new();

    // Sheet 1: Jahresübersicht alle Jahre
    const headerRow = [
      'Position (Anlage V)', 'Zeile', ...verfuegbareJahre
    ];

    const alleJahreDaten = verfuegbareJahre.map(j => berechneJahresSteuer(j, false));

    const rows = [
      headerRow,
      [],
      ['A. EINNAHMEN (§ 21 EStG)', '', ...verfuegbareJahre.map(() => '')],
      ['Mieteinnahmen (Kaltmiete)', 'Z. 4–5', ...alleJahreDaten.map(d => d.einnahmen)],
      ['Nebenkosten vom Mieter (Umlagen)', 'Z. 6', ...alleJahreDaten.map(d => d.nkEinnahmen)],
      ['Summe Einnahmen', '', ...alleJahreDaten.map(d => d.gesamtEinnahmen)],
      [],
      ['B. WERBUNGSKOSTEN (§ 9 EStG)', '', ...verfuegbareJahre.map(() => '')],
      ['Schuldzinsen', 'Z. 9', ...alleJahreDaten.map(d => d.zinsen)],
      ['AfA Gebäude', 'Z. 13', ...alleJahreDaten.map(d => d.afa)],
      [`AfA-Satz: ${afaSatz}% | Bemessungsgrundlage: ${formatCurrency(params.kaufpreis * (gebaeudeAnteilProzent / 100))}`, 'Info', ...verfuegbareJahre.map(() => '')],
      ['Erhaltungsaufwand (laufend)', 'Z. 33a', ...alleJahreDaten.map(d => d.instandhaltung)],
      ['Erhaltungsaufwand (einmalig)', 'Z. 33b', ...alleJahreDaten.map(d => d.investitionenSofort)],
      ['Grundsteuer', 'Z. 34', ...alleJahreDaten.map(d => d.grundsteuer)],
      ['Versicherungen', 'Z. 35', ...alleJahreDaten.map(d => d.versicherung)],
      ['Hausgeld / WEG-Rücklagen', 'Z. 36', ...alleJahreDaten.map(d => d.hausgeld)],
      ['Verwaltungskosten', 'Z. 37', ...alleJahreDaten.map(d => d.verwaltung)],
      ['Fahrtkosten (§ 9 Abs. 1 EStG)', 'Z. 40', ...alleJahreDaten.map(d => d.fahrtkosten)],
      ['Sonstige Betriebskosten', 'Z. 50', ...alleJahreDaten.map(d => d.nebenkosten)],
      ['Summe Werbungskosten', 'Z. 53', ...alleJahreDaten.map(d => d.absetzbareKosten)],
      [],
      ['C. ERGEBNIS', '', ...verfuegbareJahre.map(() => '')],
      ['Einkünfte aus V+V (Überschuss/Verlust)', 'Z. 54', ...alleJahreDaten.map(d => d.zuVersteuern)],
      [`Steuereffekt bei ${steuersatz}% Steuersatz`, 'Info', ...alleJahreDaten.map(d => d.steuerEffekt)],
      [],
      ['D. NACHRICHTLICH (nicht in Anlage V)', '', ...verfuegbareJahre.map(() => '')],
      ['Tilgung (nur Cashflow, nicht absetzbar)', '—', ...alleJahreDaten.map(d => d.tilgung ?? Math.round((ergebnis.monatlicheRate * 12) - d.zinsen))],
      ['Restschuld zum Jahresende', '—', ...alleJahreDaten.map(d => d.restschuld)],
      ['AfA-relevante Investitionen (Herstellungskosten)', '—', ...alleJahreDaten.map(d => d.investitionenAfa)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Spaltenbreiten
    ws['!cols'] = [
      { wch: 42 }, { wch: 8 },
      ...verfuegbareJahre.map(() => ({ wch: 14 }))
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Anlage V Übersicht');

    // Sheet 2: Detailblatt für ausgewähltes Jahr
    if (selectedDaten) {
      const d = selectedDaten;
      const detailRows = [
        [`Anlage V — ${immoName} — Steuerjahr ${selectedJahr}`],
        [],
        ['A. EINNAHMEN'],
        ['Mieteinnahmen (Kaltmiete)', d.einnahmen],
        ['Nebenkosten vom Mieter', d.nkEinnahmen],
        ['Summe Einnahmen', d.gesamtEinnahmen],
        [],
        ['B. WERBUNGSKOSTEN'],
        ['Schuldzinsen (Z. 9)', d.zinsen],
        [`AfA Gebäude (Z. 13) — ${d.gueltigerAfaSatz}% von ${formatCurrency(d.afaBemessungsgrundlage)}`, d.afa],
        ['Erhaltungsaufwand laufend (Z. 33)', d.instandhaltung],
        ['Erhaltungsaufwand einmalig (Z. 33)', d.investitionenSofort],
        ['Grundsteuer (Z. 34)', d.grundsteuer],
        ['Versicherungen (Z. 35)', d.versicherung],
        ['Hausgeld / WEG (Z. 36)', d.hausgeld],
        ['Verwaltungskosten (Z. 37)', d.verwaltung],
        ['Fahrtkosten §9 (Z. 40)', d.fahrtkosten],
        ['Sonstige Betriebskosten (Z. 50)', d.nebenkosten],
        ['Summe Werbungskosten (Z. 53)', d.absetzbareKosten],
        [],
        ['C. ERGEBNIS'],
        ['Einkünfte aus V+V (Z. 54)', d.zuVersteuern],
        [`Steuereffekt (${steuersatz}%)`, d.steuerEffekt],
        [],
        ['D. FAHRTENNACHWEIS (§ 9 Abs. 1 EStG)'],
        ['Datum', 'Zweck', 'km', 'Betrag'],
        ...fahrtenSelectedJahr.map(f => [
          new Date(f.datum).toLocaleDateString('de-DE'),
          f.grund || '',
          f.km * 2,
          Math.round(f.km * 2 * kmPauschale)
        ]),
        fahrtenSelectedJahr.length === 0
          ? ['(keine Fahrten in diesem Jahr erfasst)']
          : ['Summe', '', '', Math.round(d.fahrtkosten)],
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
      ws2['!cols'] = [{ wch: 50 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws2, `Detail ${selectedJahr}`);
    }

    XLSX.writeFile(wb, `Anlage_V_${immoName.replace(/[^a-z0-9]/gi, '_')}_${selectedJahr}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header mit Jahresauswahl */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3 mb-4">
          <h3 className="font-bold text-lg text-gray-800">📋 Steuerberechnung</h3>
          {isGbR && (
            <div className="mt-2 mb-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700 font-medium">
              🏛 GbR: Steuerwerte zeigen Ihren {Math.round(anteilFaktor * 100)}%-Anteil
            </div>
          )}
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

        {/* Zusätzliche Werbungskosten für Anlage V */}
        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Weitere Werbungskosten (Anlage V)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">🏛 Grundsteuer / Monat</label>
              <div className="flex items-center gap-1">
                <input type="number" min="0" step="5" value={grundsteuerMonat}
                  onChange={(e) => updateSteuerParams({ grundsteuerMonat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border rounded-lg text-base sm:text-sm text-right" />
                <span className="text-xs text-gray-500">€</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">🛡 Versicherungen / Monat</label>
              <div className="flex items-center gap-1">
                <input type="number" min="0" step="5" value={versicherungMonat}
                  onChange={(e) => updateSteuerParams({ versicherungMonat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border rounded-lg text-base sm:text-sm text-right" />
                <span className="text-xs text-gray-500">€</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2">
            Hausgeld, Verwaltung und Instandhaltungsrücklage werden aus den Immobilien-Stammdaten übernommen.
          </div>
        </div>
      </div>

      {/* ── Anlage V Formular-Ansicht ─────────────────────────────────────── */}
      {selectedDaten && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
            <div>
              <div className="font-bold text-sm">📋 Anlage V — Einkünfte aus Vermietung und Verpachtung</div>
              <div className="text-slate-400 text-xs mt-0.5">Steuerjahr {selectedJahr} · §21 EStG</div>
            </div>
            <button
              onClick={exportAnlageV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              ⬇ Excel-Export
            </button>
          </div>

          {isGbR && (
            <div className="px-4 py-2 bg-violet-50 border-b border-violet-200 text-xs text-violet-700 font-medium">
              🏛 GbR: Werte zeigen Ihren {Math.round(anteilFaktor * 100)}%-Anteil
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {/* A. EINNAHMEN */}
            <div className="px-4 py-2 bg-green-50">
              <div className="text-[11px] font-bold text-green-700 uppercase tracking-wide mb-1.5">A. Einnahmen</div>
              <AnlageVZeile zeile="Z. 4–5" label="Mieteinnahmen (Kaltmiete)" betrag={a(selectedDaten.einnahmen)} color="green" />
              {selectedDaten.nkEinnahmen > 0 && (
                <AnlageVZeile zeile="Z. 6" label="Nebenkosten vom Mieter (Umlagen)" betrag={a(selectedDaten.nkEinnahmen)} color="green" />
              )}
              <AnlageVZeile zeile="Σ" label="Summe Einnahmen" betrag={a(selectedDaten.gesamtEinnahmen)} color="green" bold />
            </div>

            {/* B. WERBUNGSKOSTEN */}
            <div className="px-4 py-2">
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-1.5">B. Werbungskosten</div>
              <AnlageVZeile zeile="Z. 9" label="Schuldzinsen" betrag={a(selectedDaten.zinsen)} color="red" />
              <AnlageVZeile
                zeile="Z. 13"
                label={`AfA Gebäude (${selectedDaten.gueltigerAfaSatz}% von ${formatCurrency(a(selectedDaten.afaBemessungsgrundlage))})`}
                betrag={a(selectedDaten.afa)}
                color="red"
                badge={selectedDaten.gueltigerAfaSatz !== afaSatz ? 'angepasst' : null}
              />
              {selectedDaten.investitionenSofort > 0 && (
                <AnlageVZeile zeile="Z. 33" label="Erhaltungsaufwand (einmalig)" betrag={a(selectedDaten.investitionenSofort)} color="orange" badge="Einmaleffekt" />
              )}
              {selectedDaten.instandhaltung > 0 && (
                <AnlageVZeile zeile="Z. 33" label="Erhaltungsaufwand (laufend)" betrag={a(selectedDaten.instandhaltung)} color="red" />
              )}
              {selectedDaten.grundsteuer > 0 && (
                <AnlageVZeile zeile="Z. 34" label="Grundsteuer" betrag={a(selectedDaten.grundsteuer)} color="red" />
              )}
              {selectedDaten.versicherung > 0 && (
                <AnlageVZeile zeile="Z. 35" label="Versicherungen" betrag={a(selectedDaten.versicherung)} color="red" />
              )}
              {selectedDaten.hausgeld > 0 && (
                <AnlageVZeile zeile="Z. 36" label="Hausgeld / WEG" betrag={a(selectedDaten.hausgeld)} color="red" />
              )}
              {selectedDaten.verwaltung > 0 && (
                <AnlageVZeile zeile="Z. 37" label="Verwaltungskosten" betrag={a(selectedDaten.verwaltung)} color="red" />
              )}
              {selectedDaten.fahrtkosten > 0 && (
                <AnlageVZeile zeile="Z. 40" label="Fahrtkosten (§ 9 Abs. 1)" betrag={a(selectedDaten.fahrtkosten)} color="red" />
              )}
              {selectedDaten.nebenkosten > 0 && (
                <AnlageVZeile zeile="Z. 50" label="Sonstige Betriebskosten" betrag={a(selectedDaten.nebenkosten)} color="red" />
              )}
              <AnlageVZeile zeile="Z. 53" label="Summe Werbungskosten" betrag={a(selectedDaten.absetzbareKosten)} color="red" bold />
            </div>

            {/* C. ERGEBNIS */}
            <div className={`px-4 py-3 ${selectedDaten.zuVersteuern < 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-gray-600">C. Ergebnis</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">Z. 54 — Einkünfte aus V+V</div>
                  <div className={`text-2xl font-black mt-0.5 ${selectedDaten.zuVersteuern < 0 ? 'text-emerald-700' : 'text-gray-800'}`}>
                    {selectedDaten.zuVersteuern < 0 ? '−' : '+'}{formatCurrency(Math.abs(a(selectedDaten.zuVersteuern)))}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {selectedDaten.zuVersteuern < 0 ? 'steuerlicher Verlust → mindert andere Einkünfte' : 'steuerlicher Überschuss → erhöht Steuerlast'}
                  </div>
                </div>
                <div className={`text-right rounded-xl px-4 py-2 ${selectedDaten.steuerEffekt > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <div className="text-xs text-gray-500">{selectedDaten.steuerEffekt > 0 ? 'Steuerlast' : 'Steuerersparnis'}</div>
                  <div className={`text-lg font-black ${selectedDaten.steuerEffekt > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {selectedDaten.steuerEffekt > 0 ? '−' : '+'}{formatCurrency(Math.abs(a(selectedDaten.steuerEffekt)))}
                  </div>
                  <div className="text-[10px] text-gray-400">bei {steuersatz}% Steuersatz</div>
                </div>
              </div>
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
              <span className="font-bold text-red-700">{formatCurrency(a(selectedDaten.zinsen))}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium text-gray-600">Tilgung</span>
                <span className="text-xs text-gray-500 block">nur Cashflow, keine Steuerwirkung</span>
              </div>
              <span className="font-bold text-gray-500">{formatCurrency(a(selectedDaten.tilgung ?? (ergebnis.monatlicheRate * 12) - selectedDaten.zinsen))}</span>
            </div>
          </div>
        )}
        <div className="mt-3 p-2 bg-purple-50 rounded text-xs text-purple-700">
          💡 <strong>Tilgung verbessert Vermögen, senkt aber nicht die Steuer.</strong> Nur Zinsen sind absetzbar.
        </div>
      </div>

      {/* AfA Einstellungen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4">📉 AfA-Einstellungen</h4>

        {/* Gebäudeanteil */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gebäudeanteil (AfA-Bemessungsgrundlage)</label>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="100" step="0.5" value={gebaeudeAnteilProzent}
                onChange={(e) => updateSteuerParams({ gebaeudeAnteilProzent: parseFloat(e.target.value) || 0 })}
                className="w-16 px-2 py-1.5 border rounded-lg text-base sm:text-sm text-right font-semibold" />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <span className="text-gray-300">=</span>
            <div className="flex items-center gap-1">
              <input type="number" min="0" step="1000"
                value={Math.round(params.kaufpreis * (gebaeudeAnteilProzent / 100))}
                onChange={(e) => {
                  const absWert = parseFloat(e.target.value) || 0;
                  const neuProzent = params.kaufpreis > 0 ? (absWert / params.kaufpreis) * 100 : 0;
                  updateSteuerParams({ gebaeudeAnteilProzent: Math.min(100, Math.round(neuProzent * 10) / 10) });
                }}
                className="w-28 px-2 py-1.5 border border-blue-300 rounded-lg text-base sm:text-sm text-right bg-blue-50 font-semibold" />
              <span className="text-sm text-gray-500">€</span>
            </div>
            <span className="text-xs text-gray-400">(Prozent oder €-Betrag, beides synchronisiert sich)</span>
            {isGbR && <span className="text-xs text-violet-600">Ihr Anteil: {formatCurrency(a(Math.round(params.kaufpreis * (gebaeudeAnteilProzent / 100))))}</span>}
          </div>
        </div>

        {/* AfA-Modus Toggle */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AfA-Methode</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateSteuerParams({ afaModus: 'linear' })}
              className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold text-left transition-all ${!istDegressiv ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <div className="font-bold mb-0.5">📉 Linear</div>
              <div className="opacity-70 font-normal">Gleichbleibender % vom Kaufpreis</div>
            </button>
            <button onClick={() => updateSteuerParams({ afaModus: 'degressiv' })}
              className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold text-left transition-all ${istDegressiv ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <div className="font-bold mb-0.5">📈 Degressiv 5%</div>
              <div className="opacity-70 font-normal">§ 7 Abs. 5a EStG · Neubau ab 10/2023</div>
            </button>
          </div>
        </div>

        {/* Basis-AfA + Phasen */}
        <div>
          {istDegressiv ? (
            /* Degressiv-Modus UI */
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <div className="font-bold mb-1">5% degressiv vom Restbuchwert (§ 7 Abs. 5a EStG)</div>
                <div className="space-y-0.5 text-emerald-700">
                  <div>Gebäudewert: <strong>{formatCurrency(params.kaufpreis * (gebaeudeAnteilProzent / 100))}</strong></div>
                  <div>AfA {selectedJahr}: <strong>{formatCurrency(a(selectedDaten?.afa ?? 0))}</strong></div>
                  {selectedDaten?.restbuchwert != null && (
                    <div>Restbuchwert Ende {selectedJahr}: <strong>{formatCurrency(a(selectedDaten.restbuchwert))}</strong></div>
                  )}
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">Wechsel zu linearer AfA</span>
                  <span className="text-xs text-gray-400">optional</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => updateSteuerParams({ afaDegressivWechseljahr: null })}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-semibold transition-colors ${!afaDegressivWechseljahr ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-500 hover:border-gray-500'}`}>
                    Kein Wechsel
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Ab Jahr:</span>
                    <input type="number" min={kaufjahr + 1} max={kaufjahr + 50} step={1}
                      value={afaDegressivWechseljahr || ''}
                      placeholder={String(kaufjahr + 15)}
                      onChange={(e) => updateSteuerParams({ afaDegressivWechseljahr: parseInt(e.target.value) || null })}
                      className="w-20 px-2 py-1 border-2 border-gray-300 rounded-lg text-base sm:text-sm text-right font-bold focus:border-emerald-400" />
                  </div>
                  {afaDegressivWechseljahr && <span className="text-xs text-gray-400">→ dann linear auf Restbuchwert</span>}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 font-semibold mb-1.5">AfA-Verlauf (erste 10 Jahre)</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    {Array.from({ length: 10 }, (_, i) => kaufjahr + i).map(j => {
                      const deg = degressiveAfaFuerJahr(params.kaufpreis * (gebaeudeAnteilProzent / 100), j);
                      const istWechsel = afaDegressivWechseljahr && j === afaDegressivWechseljahr;
                      return (
                        <span key={j} className={`${j === selectedJahr ? 'font-bold text-emerald-800' : 'text-gray-500'}`}>
                          {j}: {formatCurrency(deg.afa)}{istWechsel ? ' ↩' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                <span>Nutzungsdauer-Referenz (für Wechsel zu linear):</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="0" max="10" step="0.1" value={afaSatz}
                    onChange={(e) => updateSteuerParams({ afaSatz: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-right text-xs font-semibold" />
                  <span>% = {afaSatz > 0 ? Math.round(100/afaSatz) : '∞'} Jahre</span>
                </div>
              </div>
            </div>
          ) : (
            /* Linear-Modus (bisheriges UI) */
            <>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">AfA-Satz</label>
          <div className="flex items-start gap-4 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-bold text-slate-600 px-1.5 py-0.5 bg-slate-200 rounded">Ab Kauf ({kaufjahr})</span>
                <span className="text-xs text-slate-400">Basis-Satz</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <input type="number" min="0" max="10" step="0.1" value={afaSatz}
                    onChange={(e) => updateSteuerParams({ afaSatz: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 border-2 border-slate-300 rounded-lg text-base sm:text-sm text-right font-bold focus:border-indigo-400" />
                  <span className="text-sm text-gray-600">% p.a.</span>
                </div>
                <span className="text-xs text-gray-400">= {afaSatz > 0 ? Math.round(100/afaSatz) : '∞'} Jahre linear</span>
                <div className="flex gap-1 ml-auto">
                  {[[2.0,'2% (Standard, nach 1924)'],[2.5,'2,5% (vor 1925)'],[3.0,'3% (nach 2022)']].map(([v, label]) => (
                    <button key={v} onClick={() => updateSteuerParams({ afaSatz: v })} title={label}
                      className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${afaSatz === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600'}`}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Phasen */}
          {afaAnpassungen.length > 0 && (
            <div className="space-y-2 mb-3">
              {afaAnpassungen
                .sort((a, b) => a.vonJahr - b.vonJahr)
                .map((phase) => {
                  const isAktiv = getAfaSatzFuerJahr(selectedJahr) === phase.afaSatz && phase.vonJahr <= selectedJahr;
                  const rndJahre = phase.afaSatz > 0 ? Math.round(100 / phase.afaSatz) : 0;
                  return (
                    <div key={phase.id} className={`p-3 rounded-xl border-2 transition-all ${isAktiv ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          {/* Ab Jahr + Satz */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500 font-medium">Ab Jahr</span>
                            <input type="number" min={kaufjahr} max={aktuellesJahr + 20} step={1}
                              value={phase.vonJahr}
                              onChange={(e) => {
                                const updated = afaAnpassungen.map(a =>
                                  a.id === phase.id ? { ...a, vonJahr: parseInt(e.target.value) || kaufjahr } : a
                                );
                                updateSteuerParams({ afaAnpassungen: updated });
                              }}
                              className="w-20 px-2 py-1 border-2 border-gray-300 rounded-lg text-base sm:text-sm text-right font-bold focus:border-violet-400" />
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center gap-1">
                              <input type="number" min="0" max="20" step="0.1"
                                value={phase.afaSatz}
                                onChange={(e) => {
                                  const updated = afaAnpassungen.map(a =>
                                    a.id === phase.id ? { ...a, afaSatz: parseFloat(e.target.value) || 0 } : a
                                  );
                                  updateSteuerParams({ afaAnpassungen: updated });
                                }}
                                className="w-20 px-2 py-1 border-2 border-violet-300 bg-white rounded-lg text-base sm:text-sm text-right font-bold text-violet-700 focus:border-violet-500" />
                              <span className="text-sm text-gray-600">% p.a.</span>
                            </div>
                            <span className="text-xs text-gray-400">= {rndJahre} Jahre</span>
                            {isAktiv && (
                              <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-semibold">Aktiv für {selectedJahr}</span>
                            )}
                          </div>

                          {/* Grundlage */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Grundlage</span>
                            <select
                              value={phase.grundlage || 'sonstiges'}
                              onChange={(e) => {
                                const updated = afaAnpassungen.map(a =>
                                  a.id === phase.id ? { ...a, grundlage: e.target.value } : a
                                );
                                updateSteuerParams({ afaAnpassungen: updated });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white">
                              <option value="restnutzungsdauer">Restnutzungsdauergutachten</option>
                              <option value="denkmal">Denkmal-AfA (§ 7i)</option>
                              <option value="neubau">Neubau / § 7b</option>
                              <option value="sonstiges">Sonstiges</option>
                            </select>

                            {/* Restnutzungsdauer-Helfer */}
                            {phase.grundlage === 'restnutzungsdauer' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400">RND</span>
                                <input type="number" min="1" max="80" step="1"
                                  value={phase.restnutzungsdauer || ''}
                                  placeholder="z.B. 25"
                                  onChange={(e) => {
                                    const rnd = parseInt(e.target.value) || 0;
                                    const neuSatz = rnd > 0 ? Math.round(100 / rnd * 10) / 10 : phase.afaSatz;
                                    const updated = afaAnpassungen.map(a =>
                                      a.id === phase.id ? { ...a, restnutzungsdauer: rnd, afaSatz: neuSatz } : a
                                    );
                                    updateSteuerParams({ afaAnpassungen: updated });
                                  }}
                                  className="w-16 px-2 py-1 border border-amber-300 bg-amber-50 rounded-lg text-xs text-right font-semibold" />
                                <span className="text-xs text-gray-400">Jahre → {phase.restnutzungsdauer > 0 ? (100/phase.restnutzungsdauer).toFixed(2) : '?'}%</span>
                              </div>
                            )}

                            {/* Gutachten-Datum */}
                            {(phase.grundlage === 'restnutzungsdauer' || phase.grundlage === 'denkmal') && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400">Gutachten</span>
                                <input type="date"
                                  value={phase.gutachtenDatum || ''}
                                  onChange={(e) => {
                                    const updated = afaAnpassungen.map(a =>
                                      a.id === phase.id ? { ...a, gutachtenDatum: e.target.value } : a
                                    );
                                    updateSteuerParams({ afaAnpassungen: updated });
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded-lg text-xs" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Löschen */}
                        <button
                          onClick={() => updateSteuerParams({ afaAnpassungen: afaAnpassungen.filter(a => a.id !== phase.id) })}
                          className="text-gray-300 hover:text-red-500 text-lg leading-none transition-colors mt-0.5">
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Phase hinzufügen */}
          <button
            onClick={() => {
              const letztePhase = afaAnpassungen.sort((a, b) => b.vonJahr - a.vonJahr)[0];
              const neuesJahr = letztePhase ? letztePhase.vonJahr + 1 : aktuellesJahr;
              updateSteuerParams({
                afaAnpassungen: [...afaAnpassungen, {
                  id: Date.now(),
                  vonJahr: neuesJahr,
                  afaSatz: 4.0,
                  grundlage: 'restnutzungsdauer',
                  restnutzungsdauer: 25,
                  gutachtenDatum: '',
                }]
              });
            }}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-violet-400 hover:text-violet-600 text-xs font-semibold transition-all">
            + AfA-Änderung hinzufügen (z.B. Restnutzungsdauergutachten)
          </button>

          {/* Phasen-Übersicht für das gewählte Jahr */}
          {afaAnpassungen.length > 0 && (
            <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-800">
              <div className="font-semibold mb-1.5">📋 Gültiger AfA-Satz je Jahr</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {verfuegbareJahre.map(j => {
                  const satz = getAfaSatzFuerJahr(j);
                  return (
                    <span key={j} className={`${j === selectedJahr ? 'font-bold text-violet-900' : 'text-violet-600'}`}>
                      {j}: {satz}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-3 p-2 bg-blue-50 rounded">
          {istDegressiv
            ? <>💡 <strong>Degressiv AfA (§ 7 Abs. 5a EStG):</strong> 5% vom Restbuchwert, jedes Jahr sinkend. Nur für Neubau-Wohngebäude (Baubeginn nach 01.10.2023 oder Erwerb nach 31.12.2023). Wechsel zu linear jederzeit möglich.</>
            : <>💡 <strong>AfA ist ein Recheneffekt, kein Geldabfluss.</strong> Standard: 2% (50 J.) | vor 1925: 2,5% (40 J.) | nach 2022: 3% (33 J.){afaAnpassungen.length > 0 && <span className="block mt-0.5 text-violet-700">💜 Bei Restnutzungsdauergutachten: RND eingeben → AfA-Satz wird automatisch berechnet (100 ÷ RND).</span>}</>
          }
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
                className="w-full px-2 py-1 border rounded text-base sm:text-sm text-right" />
              <span className="text-xs text-gray-500">km</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">km-Pauschale</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="1" step="0.01" value={kmPauschale}
                onChange={(e) => updateSteuerParams({ kmPauschale: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-base sm:text-sm text-right" />
              <span className="text-xs text-gray-500">€</span>
            </div>
          </div>
        </div>

        {fahrtkostenModus === 'pauschal' ? (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fahrten pro Monat</label>
            <input type="number" min="0" max="30" value={fahrtenProMonat}
              onChange={(e) => updateSteuerParams({ fahrtenProMonat: parseFloat(e.target.value) || 0 })}
              className="w-24 px-2 py-1 border rounded text-base sm:text-sm text-right" />
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

// ── Anlage V Zeilen-Hilfskomponente ──────────────────────────────────────────
function AnlageVZeile({ zeile, label, betrag, color = 'gray', bold = false, badge = null }) {
  const colors = {
    green: 'text-green-700',
    red: 'text-red-600',
    orange: 'text-orange-600',
    gray: 'text-gray-700',
  };
  return (
    <div className={`flex justify-between items-center py-1 ${bold ? 'border-t border-gray-200 mt-1 pt-1.5' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] text-gray-400 font-mono w-10 shrink-0">{zeile}</span>
        <span className={`text-xs ${bold ? 'font-bold' : ''} ${colors[color]} truncate`}>{label}</span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold shrink-0">{badge}</span>
        )}
      </div>
      <span className={`text-xs font-${bold ? 'black' : 'semibold'} ${colors[color]} shrink-0 ml-2`}>
        {betrag > 0 ? formatCurrency(betrag) : '—'}
      </span>
    </div>
  );
}

export default Steuerberechnung;
