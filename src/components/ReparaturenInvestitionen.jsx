import { useState, useMemo } from 'react';
import { Wrench, Home, ClipboardList, Leaf, Package, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';

const ReparaturenInvestitionen = ({ immobilie, onUpdate }) => {
  const [investitionen, setInvestitionen] = useState(immobilie.investitionen || []);
  const [showForm, setShowForm] = useState(false);
  const [neueInvestition, setNeueInvestition] = useState({
    datum: new Date().toISOString().split('T')[0],
    beschreibung: '',
    betrag: '',
    kategorie: 'erhaltung'
  });

  const kategorien = {
    'erhaltung': { label: 'Erhaltungsaufwand', color: 'orange', icon: <Wrench size={14}/>, steuer: 'sofort', hint: 'Sofort absetzbar im Zahlungsjahr' },
    'herstellung': { label: 'Herstellungskosten', color: 'blue', icon: <Home size={14}/>, steuer: 'afa', hint: 'Erhöht AfA-Bemessungsgrundlage' },
    'anschaffung': { label: 'Anschaffungsnebenk.', color: 'purple', icon: <ClipboardList size={14}/>, steuer: 'afa', hint: 'Erhöht AfA-Bemessungsgrundlage' },
    'modernisierung': { label: 'Modernisierung', color: 'green', icon: <Leaf size={14}/>, steuer: 'afa', hint: 'Wird über AfA abgeschrieben' },
    'nicht_relevant': { label: 'Nicht steuerlich', color: 'gray', icon: <Package size={14}/>, steuer: 'keine', hint: 'Keine Steuerwirkung' }
  };

  const handleAdd = () => {
    if (!neueInvestition.beschreibung || !neueInvestition.betrag) return;

    const updated = [...investitionen, {
      id: Date.now(),
      ...neueInvestition,
      betrag: parseFloat(neueInvestition.betrag)
    }];
    setInvestitionen(updated);
    onUpdate({ ...immobilie, investitionen: updated });
    setNeueInvestition({
      datum: new Date().toISOString().split('T')[0],
      beschreibung: '',
      betrag: '',
      kategorie: 'erhaltung'
    });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const updated = investitionen.filter(i => i.id !== id);
    setInvestitionen(updated);
    onUpdate({ ...immobilie, investitionen: updated });
  };

  const gesamtNachKategorie = useMemo(() => {
    const summen = {};
    investitionen.forEach(inv => {
      summen[inv.kategorie] = (summen[inv.kategorie] || 0) + inv.betrag;
    });
    return summen;
  }, [investitionen]);

  const gesamtInvestitionen = investitionen.reduce((sum, inv) => sum + inv.betrag, 0);

  // ── 15%-Regel (§ 6 Abs. 1 Nr. 1a EStG) ──────────────────────────────────
  // Reparaturen innerhalb von 3 Jahren nach Kauf dürfen max. 15% des
  // Gebäudewerts (Kaufpreis ohne Grundstück) betragen — sonst werden sie
  // zu "anschaffungsnahen Herstellungskosten" (nur noch via AfA absetzbar).
  const regel15 = useMemo(() => {
    const kaufdatum = immobilie.kaufdatum;
    const kaufpreis = immobilie.kaufpreis || 0;
    const grundstueck = immobilie.grundstueck || 0;
    const gebaeudewert = kaufpreis - grundstueck;

    if (!kaufdatum || gebaeudewert <= 0) return null;

    const kauf = new Date(kaufdatum);
    const fensterEnde = new Date(kauf);
    fensterEnde.setFullYear(fensterEnde.getFullYear() + 3);
    const heute = new Date();

    // Nur relevant wenn noch im 3-Jahres-Fenster oder kürzlich abgelaufen
    const nochImFenster = heute <= fensterEnde;
    const abgelaufenSeit = nochImFenster ? 0 : Math.floor((heute - fensterEnde) / (1000 * 60 * 60 * 24 * 30.44));
    if (abgelaufenSeit > 6) return null; // Fenster vor >6 Monaten abgelaufen → ausblenden

    // Relevante Kosten: Erhaltungsaufwand, Modernisierung, Herstellungskosten
    // (nicht: Anschaffungsnebenkosten, nicht_relevant)
    const relevantKategorien = ['erhaltung', 'modernisierung', 'herstellung'];
    const relevantKosten = investitionen
      .filter(inv => {
        const d = new Date(inv.datum);
        return d >= kauf && d <= fensterEnde && relevantKategorien.includes(inv.kategorie);
      })
      .reduce((sum, inv) => sum + inv.betrag, 0);

    const grenze = gebaeudewert * 0.15;
    const prozent = grenze > 0 ? Math.min((relevantKosten / grenze) * 100, 100) : 0;
    const restBis15 = Math.max(0, grenze - relevantKosten);
    const ueberschritten = relevantKosten > grenze;
    const warnung = !ueberschritten && prozent >= 75;

    const monate = Math.max(0, Math.ceil((fensterEnde - heute) / (1000 * 60 * 60 * 24 * 30.44)));

    return { gebaeudewert, grenze, relevantKosten, prozent, restBis15, ueberschritten, warnung, nochImFenster, monate };
  }, [investitionen, immobilie.kaufdatum, immobilie.kaufpreis, immobilie.grundstueck]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-1"><Wrench size={16} /> Reparaturen & Investitionen</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          + Hinzufügen
        </button>
      </div>

      {/* 15%-Regel Banner */}
      {regel15 && (
        <div className={`rounded-xl p-3 mb-4 border ${
          regel15.ueberschritten
            ? 'bg-red-50 border-red-300'
            : regel15.warnung
              ? 'bg-amber-50 border-amber-300'
              : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="font-bold text-sm">
                {regel15.ueberschritten ? <AlertCircle size={14} className="inline mr-1"/> : regel15.warnung ? <AlertTriangle size={14} className="inline mr-1"/> : <Info size={14} className="inline mr-1"/>} 15%-Regel (§ 6 Abs. 1 Nr. 1a EStG)
              </span>
              <div className={`text-xs mt-0.5 ${regel15.ueberschritten ? 'text-red-700' : regel15.warnung ? 'text-amber-700' : 'text-indigo-700'}`}>
                {regel15.ueberschritten
                  ? 'Grenze überschritten — Kosten werden zu Herstellungskosten (AfA statt Sofortabzug)!'
                  : regel15.warnung
                    ? `Achtung: ${regel15.prozent.toFixed(0)}% der Grenze erreicht — noch ${formatCurrency(regel15.restBis15)} Spielraum`
                    : regel15.nochImFenster
                      ? `3-Jahres-Fenster läuft noch ${regel15.monate} Monate — Grenze im Blick behalten`
                      : 'Fenster kürzlich abgelaufen — Endstand der Kosten'}
              </div>
            </div>
            <div className={`text-right shrink-0 text-xs font-bold ${regel15.ueberschritten ? 'text-red-700' : regel15.warnung ? 'text-amber-700' : 'text-indigo-700'}`}>
              {formatCurrency(regel15.relevantKosten)}<br />
              <span className="font-normal text-gray-500">/ {formatCurrency(regel15.grenze)}</span>
            </div>
          </div>
          {/* Fortschrittsbalken */}
          <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${regel15.ueberschritten ? 'bg-red-500' : regel15.warnung ? 'bg-amber-400' : 'bg-indigo-500'}`}
              style={{ width: `${regel15.prozent}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            Gebäudewert (ohne Grundstück): {formatCurrency(regel15.gebaeudewert)} · Grenze: 15% = {formatCurrency(regel15.grenze)}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Datum</label>
              <input
                type="date"
                value={neueInvestition.datum}
                onChange={(e) => setNeueInvestition({...neueInvestition, datum: e.target.value})}
                className="w-full px-2 py-1 border rounded text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kategorie</label>
              <select
                value={neueInvestition.kategorie}
                onChange={(e) => setNeueInvestition({...neueInvestition, kategorie: e.target.value})}
                className="w-full px-2 py-1 border rounded text-base sm:text-sm"
              >
                {Object.entries(kategorien).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Beschreibung</label>
            <input
              type="text"
              value={neueInvestition.beschreibung}
              onChange={(e) => setNeueInvestition({...neueInvestition, beschreibung: e.target.value})}
              placeholder="z.B. Neue Heizung, Dachsanierung..."
              className="w-full px-2 py-1 border rounded text-base sm:text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Betrag (€)</label>
            <input
              type="number"
              value={neueInvestition.betrag}
              onChange={(e) => setNeueInvestition({...neueInvestition, betrag: e.target.value})}
              placeholder="z.B. 5000"
              className="w-full px-2 py-1 border rounded text-base sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
              Speichern
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Zusammenfassung */}
      {investitionen.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Gesamt investiert:</span>
            <span className="text-lg font-bold text-orange-600">{formatCurrency(gesamtInvestitionen)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gesamtNachKategorie).map(([kat, summe]) => (
              <span key={kat} className={`text-xs px-2 py-1 rounded bg-${kategorien[kat].color}-100 text-${kategorien[kat].color}-700`}>
                {kategorien[kat].icon} {formatCurrency(summe)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="overflow-y-auto">
        {investitionen.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            Noch keine Reparaturen oder Investitionen erfasst
          </div>
        ) : (
          <div className="space-y-2">
            {investitionen.sort((a, b) => new Date(b.datum) - new Date(a.datum)).map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span>{kategorien[inv.kategorie]?.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{inv.beschreibung}</div>
                    <div className="text-xs text-gray-500">{new Date(inv.datum).toLocaleDateString('de-DE')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-orange-600">{formatCurrency(inv.betrag)}</span>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



export default ReparaturenInvestitionen;
