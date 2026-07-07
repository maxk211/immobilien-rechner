import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/format.js';
import { loadKalkulationen, saveKalkulation, deleteKalkulation } from '../supabaseClient';
import {
  Calculator, X, Home, RefreshCw, FolderOpen, Loader, AlertTriangle,
  Pencil, Trash2, Hammer, Building2, Wallet, BarChart3, ClipboardList,
  TrendingUp, CheckCircle2, Lightbulb, Save, Wrench, Zap, Layers,
  Droplets, DoorOpen, Leaf, UtensilsCrossed, XCircle, Scale, FileText
} from 'lucide-react';

const KalkulationsModal = ({ onClose }) => {
  const [typ, setTyp] = useState('kauf'); // 'kauf' oder 'arbitrage'

  // Kauf-Parameter
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [nebenkosten, setNebenkosten] = useState(10);
  const [eigenkapital, setEigenkapital] = useState(60000);
  const [zinssatz, setZinssatz] = useState(4.0);
  const [tilgung, setTilgung] = useState(2.0);
  const [kaltmiete, setKaltmiete] = useState(1200);
  const [betriebskosten, setBetriebskosten] = useState(300);
  const [steuersatz, setSteuersatz] = useState(42);

  // Mietmodus für Kaufimmobilie
  const [mietmodus, setMietmodus] = useState('direkt'); // 'direkt' | 'qm' | 'zimmer'
  const [wohnflaecheKalk, setWohnflaecheKalk] = useState(80);
  const [mietPreisProQm, setMietPreisProQm] = useState(12);
  const [anzahlZimmerKauf, setAnzahlZimmerKauf] = useState(3);
  const [mietPreisProZimmer, setMietPreisProZimmer] = useState(400);

  // Sanierungskosten nach Gewerk
  const [sanierung, setSanierung] = useState({
    dach_fassade: 0, heizung_sanitaer: 0, elektro: 0,
    boeden_waende: 0, fliesen_bad: 0, fenster_tueren: 0,
    keller_garage: 0, aussenanlagen: 0, kueche: 0,
  });
  const [sanierungFinanziert, setSanierungFinanziert] = useState(true); // true = Kredit, false = EK

  const GEWERKE = [
    { id: 'dach_fassade',    label: 'Dach & Fassade',    icon: <Hammer size={16}/> },
    { id: 'heizung_sanitaer',label: 'Heizung & Sanitär', icon: <Wrench size={16}/> },
    { id: 'elektro',         label: 'Elektro',            icon: <Zap size={16}/> },
    { id: 'boeden_waende',   label: 'Böden & Wände',      icon: <Layers size={16}/> },
    { id: 'fliesen_bad',     label: 'Fliesen / Bad',      icon: <Droplets size={16}/> },
    { id: 'fenster_tueren',  label: 'Fenster & Türen',    icon: <DoorOpen size={16}/> },
    { id: 'keller_garage',   label: 'Keller & Garage',    icon: <Building2 size={16}/> },
    { id: 'aussenanlagen',   label: 'Außenanlagen',        icon: <Leaf size={16}/> },
    { id: 'kueche',          label: 'Küche',               icon: <UtensilsCrossed size={16}/> },
  ];

  // Arbitrage-Parameter
  const [eigeneWarmmiete, setEigeneWarmmiete] = useState(1500);
  const [anzahlZimmer, setAnzahlZimmer] = useState(3);
  const [mietProZimmer, setMietProZimmer] = useState(700);
  const [arbNebenkosten, setArbNebenkosten] = useState(150);

  // Gespeicherte Kalkulationen (Supabase — geräteübergreifend)
  const [showSaved, setShowSaved] = useState(false);
  const [savedCalcs, setSavedCalcs] = useState([]);
  const [kalkLoading, setKalkLoading] = useState(false);
  const [kalkError, setKalkError] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState(null); // ID der gerade überschriebenen Kalkulation

  // Berechnungen für Kaufimmobilie
  const kaufBerechnung = useMemo(() => {
    // Miete je nach Modus ermitteln
    const miete = mietmodus === 'qm'
      ? wohnflaecheKalk * mietPreisProQm
      : mietmodus === 'zimmer'
        ? anzahlZimmerKauf * mietPreisProZimmer
        : kaltmiete;

    // Sanierungskosten summieren
    const totalSanierung = Object.values(sanierung).reduce((s, v) => s + (Number(v) || 0), 0);

    const nebenkostenAbsolut = kaufpreis * (nebenkosten / 100);
    const gesamtinvestition = kaufpreis + nebenkostenAbsolut + totalSanierung;
    // Kreditbetrag hängt davon ab, ob Sanierung mitfinanziert wird oder aus EK kommt
    const kreditbetrag = sanierungFinanziert
      ? gesamtinvestition - eigenkapital                   // Sanierung im Kredit
      : kaufpreis + nebenkostenAbsolut - eigenkapital;     // Sanierung aus EK (reduziert verfügbares EK)
    const annuitaet = (zinssatz + tilgung) / 100;
    const monatlicheRate = (kreditbetrag * annuitaet) / 12;

    const monatlicheEinnahmen = miete;
    const monatlicheAusgaben = monatlicheRate + betriebskosten;
    const cashflowMonat = monatlicheEinnahmen - monatlicheAusgaben;

    // Steuerliche Berechnung
    const jahresMiete = miete * 12;
    const gebaeudeAnteil = kaufpreis * 0.8;
    const afaJahr = gebaeudeAnteil * 0.02;
    const zinsenJahr = kreditbetrag * (zinssatz / 100);
    const werbungskosten = afaJahr + zinsenJahr + (betriebskosten * 12);
    const zuVersteuern = jahresMiete - werbungskosten;
    const steuerEffekt = zuVersteuern * (steuersatz / 100);
    const cashflowNachSteuer = (cashflowMonat * 12) - steuerEffekt;

    const bruttoRendite = (jahresMiete / kaufpreis) * 100;
    const eigenkapitalRendite = eigenkapital > 0 ? (cashflowNachSteuer / eigenkapital) * 100 : 0;

    return {
      miete,
      totalSanierung,
      nebenkostenAbsolut,
      gesamtinvestition,
      kreditbetrag,
      monatlicheRate,
      cashflowMonat,
      jahresMiete,
      afaJahr,
      zinsenJahr,
      werbungskosten,
      zuVersteuern,
      steuerEffekt,
      cashflowNachSteuer,
      bruttoRendite,
      eigenkapitalRendite
    };
  }, [kaufpreis, nebenkosten, eigenkapital, zinssatz, tilgung, kaltmiete, betriebskosten, steuersatz,
      mietmodus, wohnflaecheKalk, mietPreisProQm, anzahlZimmerKauf, mietPreisProZimmer, sanierung, sanierungFinanziert]);

  // Berechnungen für Arbitrage
  const arbitrageBerechnung = useMemo(() => {
    const monatlicheEinnahmen = anzahlZimmer * mietProZimmer;
    const monatlicheAusgaben = eigeneWarmmiete + arbNebenkosten;
    const cashflowMonat = monatlicheEinnahmen - monatlicheAusgaben;
    const cashflowJahr = cashflowMonat * 12;

    // Steuerlich: Einkünfte müssen versteuert werden
    const zuVersteuern = cashflowJahr > 0 ? cashflowJahr : 0;
    const steuer = zuVersteuern * (steuersatz / 100);
    const nettoJahr = cashflowJahr - steuer;

    return {
      monatlicheEinnahmen,
      monatlicheAusgaben,
      cashflowMonat,
      cashflowJahr,
      zuVersteuern,
      steuer,
      nettoJahr
    };
  }, [eigeneWarmmiete, anzahlZimmer, mietProZimmer, arbNebenkosten, steuersatz]);

  const formatCurrency = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  // ---- Supabase: Kalkulationen laden ----
  useEffect(() => {
    const fetchCalcs = async () => {
      setKalkLoading(true);
      setKalkError('');
      try {
        // Vorhandene localStorage-Daten ggf. migrieren
        const local = JSON.parse(localStorage.getItem('immobilien_kalkulationen') || '[]');
        const remote = await loadKalkulationen();
        if (remote.length === 0 && local.length > 0) {
          // Einmalige Migration: lokale Einträge nach Supabase hochladen
          const migrated = await Promise.all(local.map(c => saveKalkulation(c)));
          setSavedCalcs(migrated);
          localStorage.removeItem('immobilien_kalkulationen');
        } else {
          setSavedCalcs(remote);
          localStorage.removeItem('immobilien_kalkulationen'); // aufräumen
        }
      } catch (e) {
        setKalkError('Kalkulationen konnten nicht geladen werden.');
        // Fallback: localStorage
        try {
          setSavedCalcs(JSON.parse(localStorage.getItem('immobilien_kalkulationen') || '[]'));
        } catch {}
      } finally {
        setKalkLoading(false);
      }
    };
    fetchCalcs();
  }, []);

  // ---- Speichern / Laden / Löschen ----
  const gatherParams = () => ({
    typ,
    kaufpreis, nebenkosten, eigenkapital, zinssatz, tilgung, kaltmiete, betriebskosten, steuersatz,
    mietmodus, wohnflaecheKalk, mietPreisProQm, anzahlZimmerKauf, mietPreisProZimmer,
    sanierung: { ...sanierung },
    sanierungFinanziert,
    eigeneWarmmiete, anzahlZimmer, mietProZimmer, arbNebenkosten,
  });

  const applyParams = (p) => {
    setTyp(p.typ || 'kauf');
    setKaufpreis(p.kaufpreis ?? 300000);
    setNebenkosten(p.nebenkosten ?? 10);
    setEigenkapital(p.eigenkapital ?? 60000);
    setZinssatz(p.zinssatz ?? 4.0);
    setTilgung(p.tilgung ?? 2.0);
    setKaltmiete(p.kaltmiete ?? 1200);
    setBetriebskosten(p.betriebskosten ?? 300);
    setSteuersatz(p.steuersatz ?? 42);
    setMietmodus(p.mietmodus || 'direkt');
    setWohnflaecheKalk(p.wohnflaecheKalk ?? 80);
    setMietPreisProQm(p.mietPreisProQm ?? 12);
    setAnzahlZimmerKauf(p.anzahlZimmerKauf ?? 3);
    setMietPreisProZimmer(p.mietPreisProZimmer ?? 400);
    setSanierung(p.sanierung || { dach_fassade:0, heizung_sanitaer:0, elektro:0, boeden_waende:0, fliesen_bad:0, fenster_tueren:0, keller_garage:0, aussenanlagen:0, kueche:0 });
    setSanierungFinanziert(p.sanierungFinanziert !== false);
    setEigeneWarmmiete(p.eigeneWarmmiete ?? 1500);
    setAnzahlZimmer(p.anzahlZimmer ?? 3);
    setMietProZimmer(p.mietProZimmer ?? 700);
    setArbNebenkosten(p.arbNebenkosten ?? 150);
  };

  const handleSave = async () => {
    const name = saveName.trim() || `Kalkulation ${new Date().toLocaleDateString('de-DE')}`;
    const kalk = { id: editingId || undefined, name, ...gatherParams() };
    setSaveDialogOpen(false);
    setSaveName('');
    setEditingId(null);
    try {
      const saved = await saveKalkulation(kalk);
      setSavedCalcs(prev =>
        editingId
          ? prev.map(c => c.id === editingId ? saved : c)
          : [saved, ...prev]
      );
    } catch (e) {
      toast.error('Fehler beim Speichern: ' + e.message);
    }
  };

  const handleLoad = (calc) => {
    applyParams(calc);
    setShowSaved(false);
  };

  const handleDelete = async (id) => {
    setSavedCalcs(prev => prev.filter(c => c.id !== id));
    try {
      await deleteKalkulation(id);
    } catch (e) {
      toast.error('Fehler beim Löschen: ' + e.message);
      // Rückgängig machen falls API-Fehler
      setSavedCalcs(prev => prev); // bleibt wie es ist
    }
  };

  const openSaveDialog = (calc = null) => {
    if (calc) {
      setSaveName(calc.name);
      setEditingId(calc.id);
    } else {
      setSaveName('');
      setEditingId(null);
    }
    setSaveDialogOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2"><Calculator size={24}/> Schnellkalkulation</h2>
              <p className="text-purple-200 text-sm">Prüfe ob sich eine Immobilie lohnt — speichere und lade Kalkulationen</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-purple-200"><X size={24}/></button>
          </div>

          {/* Typ-Auswahl + Gespeichert-Tab */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => { setTyp('kauf'); setShowSaved(false); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${!showSaved && typ === 'kauf' ? 'bg-white text-purple-700' : 'bg-purple-700 text-white hover:bg-purple-600'}`}
            >
              <Home size={16} className="inline mr-1"/>Kaufimmobilie
            </button>
            <button
              onClick={() => { setTyp('arbitrage'); setShowSaved(false); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${!showSaved && typ === 'arbitrage' ? 'bg-white text-purple-700' : 'bg-purple-700 text-white hover:bg-purple-600'}`}
            >
              <RefreshCw size={16} className="inline mr-1"/>Miet-Arbitrage
            </button>
            <button
              onClick={() => setShowSaved(v => !v)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ml-auto ${showSaved ? 'bg-white text-purple-700' : 'bg-purple-700 text-white hover:bg-purple-600'}`}
            >
              <FolderOpen size={16} className="inline mr-1"/>Gespeichert {savedCalcs.length > 0 && `(${savedCalcs.length})`}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* ===== Gespeicherte Kalkulationen ===== */}
          {showSaved ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-1"><FolderOpen size={18}/> Gespeicherte Kalkulationen</h3>
                <span className="text-sm text-gray-500">{savedCalcs.length} gespeichert</span>
              </div>
              {kalkLoading ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="flex justify-center mb-3"><Loader size={28} className="animate-spin text-gray-400"/></div>
                  <p className="text-sm">Kalkulationen werden geladen…</p>
                </div>
              ) : kalkError ? (
                <div className="text-center py-10 text-red-500">
                  <div className="flex justify-center mb-2"><AlertTriangle size={28} className="text-red-400"/></div>
                  <p className="text-sm font-medium">{kalkError}</p>
                </div>
              ) : savedCalcs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="flex justify-center mb-3"><FolderOpen size={40} className="text-gray-300"/></div>
                  <p className="font-medium">Noch keine Kalkulationen gespeichert</p>
                  <p className="text-sm mt-1">Erstelle eine Kalkulation und klicke auf „Speichern"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedCalcs.map(calc => {
                    const d = new Date(calc.savedAt);
                    const datum = d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
                    const uhr = d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
                    const typLabel = calc.typ === 'arbitrage'
                      ? <span className="inline-flex items-center gap-1"><RefreshCw size={11}/> Miet-Arbitrage</span>
                      : <span className="inline-flex items-center gap-1"><Home size={11}/> Kaufimmobilie</span>;
                    const betragLabel = calc.typ === 'arbitrage'
                      ? `EK: ${new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(calc.eigeneWarmmiete || 0)}/Mo.`
                      : `Kaufpreis: ${new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(calc.kaufpreis || 0)}`;
                    return (
                      <div key={calc.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 truncate">{calc.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{typLabel}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">{betragLabel} · {datum} {uhr}</div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleLoad(calc)}
                              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 font-semibold"
                            >
                              Laden
                            </button>
                            <button
                              onClick={() => openSaveDialog(calc)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                              title="Aktuellen Stand in dieser Kalkulation speichern"
                            >
                              <Pencil size={14}/>
                            </button>
                            <button
                              onClick={() => handleDelete(calc.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100"
                              title="Löschen"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : typ === 'kauf' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eingaben */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-1"><FileText size={16}/> Eingaben</h3>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm mb-3">Kaufdaten</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Kaufpreis</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={kaufpreis} onChange={(e) => setKaufpreis(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={10000} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Nebenkosten</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={nebenkosten} onChange={(e) => setNebenkosten(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={0.5} />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600">Eigenkapital</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={eigenkapital} onChange={(e) => setEigenkapital(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={5000} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm mb-3">Finanzierung</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Zinssatz</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={zinssatz} onChange={(e) => setZinssatz(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={0.1} />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Tilgung</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={tilgung} onChange={(e) => setTilgung(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={0.5} />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 text-sm mb-3">Einnahmen & Kosten</h4>
                  <div className="space-y-3">
                    {/* Mietmodus-Auswahl */}
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Mietberechnung</label>
                      <div className="flex gap-1">
                        {[{id:'direkt',label:'Direkt (€)'},{id:'qm',label:'pro m²'},{id:'zimmer',label:'pro Zimmer'}].map(m => (
                          <button key={m.id} onClick={() => setMietmodus(m.id)}
                            className={`flex-1 py-1 px-1 rounded text-xs font-semibold border transition-all ${mietmodus === m.id ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-yellow-50'}`}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {mietmodus === 'direkt' && (
                      <div>
                        <label className="text-xs text-gray-600">Kaltmiete/Monat</label>
                        <div className="flex items-center gap-1">
                          <input type="number" value={kaltmiete} onChange={(e) => setKaltmiete(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={50} />
                          <span className="text-xs">€</span>
                        </div>
                      </div>
                    )}

                    {mietmodus === 'qm' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Wohnfläche</label>
                            <div className="flex items-center gap-1">
                              <input type="number" value={wohnflaecheKalk} onChange={(e) => setWohnflaecheKalk(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={5} />
                              <span className="text-xs">m²</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Preis pro m²</label>
                            <div className="flex items-center gap-1">
                              <input type="number" value={mietPreisProQm} onChange={(e) => setMietPreisProQm(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={0.5} />
                              <span className="text-xs">€</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-100 border border-yellow-300 p-2 rounded text-center text-sm font-semibold text-yellow-900">
                          = {formatCurrency(wohnflaecheKalk * mietPreisProQm)}/Monat
                        </div>
                      </div>
                    )}

                    {mietmodus === 'zimmer' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Anzahl Zimmer</label>
                            <input type="number" value={anzahlZimmerKauf} onChange={(e) => setAnzahlZimmerKauf(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" min={1} max={20} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Miete/Zimmer</label>
                            <div className="flex items-center gap-1">
                              <input type="number" value={mietPreisProZimmer} onChange={(e) => setMietPreisProZimmer(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={50} />
                              <span className="text-xs">€</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-100 border border-yellow-300 p-2 rounded text-center text-sm font-semibold text-yellow-900">
                          = {formatCurrency(anzahlZimmerKauf * mietPreisProZimmer)}/Monat ({anzahlZimmerKauf} × {formatCurrency(mietPreisProZimmer)})
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-gray-600">Betriebskosten/Monat</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={betriebskosten} onChange={(e) => setBetriebskosten(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={25} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sanierungskosten */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-orange-800 text-sm flex items-center gap-1"><Hammer size={14}/> Sanierung & Renovierung</h4>
                    {kaufBerechnung.totalSanierung > 0 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSanierungFinanziert(true)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all ${sanierungFinanziert ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-orange-50'}`}
                          title="Sanierungskosten werden in den Kredit eingeschlossen"
                        >
                          <Building2 size={12} className="inline mr-1"/>Mitfinanziert
                        </button>
                        <button
                          onClick={() => setSanierungFinanziert(false)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all ${!sanierungFinanziert ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-orange-50'}`}
                          title="Sanierungskosten werden aus Eigenkapital bezahlt"
                        >
                          <Wallet size={12} className="inline mr-1"/>Aus EK
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {GEWERKE.map(g => (
                      <div key={g.id} className="flex items-center gap-2">
                        <span className="text-base w-5 flex-shrink-0">{g.icon}</span>
                        <label className="text-xs text-gray-600 flex-1">{g.label}</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={sanierung[g.id] || ''}
                            onChange={e => setSanierung(s => ({ ...s, [g.id]: Number(e.target.value) || 0 }))}
                            placeholder="0"
                            className="w-24 px-2 py-1 border rounded text-xs text-right focus:ring-1 focus:ring-orange-400"
                            step={500}
                            min={0}
                          />
                          <span className="text-xs text-gray-500">€</span>
                        </div>
                      </div>
                    ))}
                    {kaufBerechnung.totalSanierung > 0 && (
                      <div className="border-t border-orange-200 mt-3 pt-2 flex justify-between text-sm font-bold text-orange-800">
                        <span>Gesamt Sanierung:</span>
                        <span>{formatCurrency(kaufBerechnung.totalSanierung)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm mb-3">Steuer</h4>
                  <div>
                    <label className="text-xs text-gray-600">Persönlicher Steuersatz</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={steuersatz} onChange={(e) => setSteuersatz(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={1} />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ergebnisse */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-1"><BarChart3 size={16}/> Ergebnis</h3>

                {/* Investitions-Übersicht */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Kaufpreis:</span>
                    <span className="text-right font-semibold">{formatCurrency(kaufpreis)}</span>
                    <span className="text-gray-600">+ Nebenkosten ({nebenkosten}%):</span>
                    <span className="text-right font-semibold">{formatCurrency(kaufBerechnung.nebenkostenAbsolut)}</span>
                    {kaufBerechnung.totalSanierung > 0 && (<>
                      <span className="text-orange-700">
                        + Sanierung {sanierungFinanziert ? '(Kredit)' : '(EK)'}:
                      </span>
                      <span className="text-right font-semibold text-orange-700">{formatCurrency(kaufBerechnung.totalSanierung)}</span>
                    </>)}
                    <span className="text-gray-600">= Gesamtinvestition:</span>
                    <span className="text-right font-bold text-indigo-700">{formatCurrency(kaufBerechnung.gesamtinvestition)}</span>
                    {!sanierungFinanziert && kaufBerechnung.totalSanierung > 0 ? (<>
                      <span className="text-gray-600">- EK (Kaufpreis):</span>
                      <span className="text-right font-semibold text-green-600">{formatCurrency(eigenkapital)}</span>
                      <span className="text-gray-600">- EK (Sanierung):</span>
                      <span className="text-right font-semibold text-orange-600">{formatCurrency(kaufBerechnung.totalSanierung)}</span>
                      <span className="text-gray-500 text-xs">= EK gesamt:</span>
                      <span className="text-right text-xs font-semibold text-green-700">{formatCurrency(eigenkapital + kaufBerechnung.totalSanierung)}</span>
                    </>) : (<>
                      <span className="text-gray-600">- Eigenkapital:</span>
                      <span className="text-right font-semibold text-green-600">{formatCurrency(eigenkapital)}</span>
                    </>)}
                    <span className="text-gray-600">= Kreditbetrag:</span>
                    <span className="text-right font-bold">{formatCurrency(kaufBerechnung.kreditbetrag)}</span>
                  </div>
                </div>

                {/* Cashflow */}
                <div className={`p-4 rounded-lg ${kaufBerechnung.cashflowMonat >= 0 ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Wallet size={14}/> Monatlicher Cashflow</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                    <span>
                      {mietmodus === 'qm' ? `Kaltmiete (${wohnflaecheKalk}m² × ${mietPreisProQm}€)` :
                       mietmodus === 'zimmer' ? `Kaltmiete (${anzahlZimmerKauf} Zimmer)` :
                       'Kaltmiete'}:
                    </span>
                    <span className="text-right text-green-700">+{formatCurrency(kaufBerechnung.miete)}</span>
                    <span>Kreditrate:</span>
                    <span className="text-right text-red-700">-{formatCurrency(kaufBerechnung.monatlicheRate)}</span>
                    <span>Betriebskosten:</span>
                    <span className="text-right text-red-700">-{formatCurrency(betriebskosten)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Cashflow/Monat:</span>
                      <span className={`text-3xl font-bold ${kaufBerechnung.cashflowMonat >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {kaufBerechnung.cashflowMonat >= 0 ? '+' : ''}{formatCurrency(kaufBerechnung.cashflowMonat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                      <span>Cashflow/Jahr:</span>
                      <span className="font-semibold">{formatCurrency(kaufBerechnung.cashflowMonat * 12)}</span>
                    </div>
                  </div>
                </div>

                {/* Steuerliche Betrachtung */}
                <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><ClipboardList size={14}/> Steuerliche Betrachtung (jährlich)</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span>Mieteinnahmen ({formatCurrency(kaufBerechnung.miete)}/M.):</span>
                    <span className="text-right">{formatCurrency(kaufBerechnung.jahresMiete)}</span>
                    <span>- AfA (2% v. 80% Gebäude):</span>
                    <span className="text-right text-green-700">-{formatCurrency(kaufBerechnung.afaJahr)}</span>
                    <span>- Schuldzinsen:</span>
                    <span className="text-right text-green-700">-{formatCurrency(kaufBerechnung.zinsenJahr)}</span>
                    <span>- Betriebskosten:</span>
                    <span className="text-right text-green-700">-{formatCurrency(betriebskosten * 12)}</span>
                    <span className="font-semibold">= Zu versteuern:</span>
                    <span className={`text-right font-semibold ${kaufBerechnung.zuVersteuern < 0 ? 'text-green-700' : ''}`}>
                      {formatCurrency(kaufBerechnung.zuVersteuern)}
                    </span>
                    <span>Steuereffekt ({steuersatz}%):</span>
                    <span className={`text-right font-semibold ${kaufBerechnung.steuerEffekt < 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {kaufBerechnung.steuerEffekt >= 0 ? '-' : '+'}{formatCurrency(Math.abs(kaufBerechnung.steuerEffekt))}
                    </span>
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Cashflow nach Steuer/Jahr:</span>
                      <span className={`text-lg font-bold ${kaufBerechnung.cashflowNachSteuer >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(kaufBerechnung.cashflowNachSteuer)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Renditen */}
                <div className="bg-blue-100 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><TrendingUp size={14}/> Renditen</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-500">Bruttomietrendite</div>
                      <div className="text-xl font-bold text-indigo-700">{kaufBerechnung.bruttoRendite.toFixed(2)}%</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-500">EK-Rendite (n. Steuer)</div>
                      <div className={`text-xl font-bold ${kaufBerechnung.eigenkapitalRendite >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {kaufBerechnung.eigenkapitalRendite.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fazit */}
                <div className={`p-4 rounded-lg ${kaufBerechnung.cashflowNachSteuer >= 0 ? 'bg-green-200' : 'bg-yellow-200'}`}>
                  <div className="font-bold">
                    {kaufBerechnung.cashflowNachSteuer >= 0
                      ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={16}/> Cashflow-positiv!</span>
                      : <span className="inline-flex items-center gap-1"><AlertTriangle size={16}/> Cashflow-negativ</span>}
                  </div>
                  <p className="text-sm mt-1">
                    {kaufBerechnung.cashflowNachSteuer >= 0
                      ? `Die Immobilie erwirtschaftet ${formatCurrency(kaufBerechnung.cashflowNachSteuer)} Gewinn pro Jahr nach Steuern.`
                      : `Du musst ${formatCurrency(Math.abs(kaufBerechnung.cashflowNachSteuer))} pro Jahr zuschießen.`
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Arbitrage */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eingaben */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-1"><FileText size={16}/> Eingaben</h3>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 text-sm mb-3">Deine Mietkosten</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Deine Warmmiete/Monat</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={eigeneWarmmiete} onChange={(e) => setEigeneWarmmiete(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={50} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Zusatzkosten (Strom, Internet, GEZ)</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={arbNebenkosten} onChange={(e) => setArbNebenkosten(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={10} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm mb-3">Untervermietung</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Anzahl Zimmer zur Vermietung</label>
                      <input type="number" value={anzahlZimmer} onChange={(e) => setAnzahlZimmer(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" min={1} max={10} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Einnahmen pro Zimmer/Monat</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={mietProZimmer} onChange={(e) => setMietProZimmer(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={50} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm mb-3">Steuer</h4>
                  <div>
                    <label className="text-xs text-gray-600">Persönlicher Steuersatz</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={steuersatz} onChange={(e) => setSteuersatz(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={1} />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ergebnisse */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-1"><BarChart3 size={16}/> Ergebnis</h3>

                {/* Monatlicher Cashflow */}
                <div className={`p-4 rounded-lg ${arbitrageBerechnung.cashflowMonat >= 0 ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Wallet size={14}/> Monatlicher Cashflow</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                    <span>Einnahmen ({anzahlZimmer} × {formatCurrency(mietProZimmer)}):</span>
                    <span className="text-right text-green-700">+{formatCurrency(arbitrageBerechnung.monatlicheEinnahmen)}</span>
                    <span>Deine Warmmiete:</span>
                    <span className="text-right text-red-700">-{formatCurrency(eigeneWarmmiete)}</span>
                    <span>Zusatzkosten:</span>
                    <span className="text-right text-red-700">-{formatCurrency(arbNebenkosten)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Cashflow/Monat:</span>
                      <span className={`text-3xl font-bold ${arbitrageBerechnung.cashflowMonat >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {arbitrageBerechnung.cashflowMonat >= 0 ? '+' : ''}{formatCurrency(arbitrageBerechnung.cashflowMonat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                      <span>Cashflow/Jahr:</span>
                      <span className="font-semibold">{formatCurrency(arbitrageBerechnung.cashflowJahr)}</span>
                    </div>
                  </div>
                </div>

                {/* Steuerliche Betrachtung */}
                <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><ClipboardList size={14}/> Steuerliche Betrachtung</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span>Einkünfte/Jahr:</span>
                    <span className="text-right">{formatCurrency(arbitrageBerechnung.zuVersteuern)}</span>
                    <span>Einkommensteuer ({steuersatz}%):</span>
                    <span className="text-right text-red-700">-{formatCurrency(arbitrageBerechnung.steuer)}</span>
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Netto nach Steuer/Jahr:</span>
                      <span className={`text-lg font-bold ${arbitrageBerechnung.nettoJahr >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(arbitrageBerechnung.nettoJahr)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fazit */}
                <div className={`p-4 rounded-lg ${arbitrageBerechnung.cashflowMonat >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                  <div className="font-bold text-lg">
                    {arbitrageBerechnung.cashflowMonat > 0
                      ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={18}/> Profitabel!</span>
                      : arbitrageBerechnung.cashflowMonat === 0
                        ? <span className="inline-flex items-center gap-1"><Scale size={18}/> Break-Even</span>
                        : <span className="inline-flex items-center gap-1"><XCircle size={18}/> Nicht profitabel</span>}
                  </div>
                  <p className="text-sm mt-1">
                    {arbitrageBerechnung.cashflowMonat > 0
                      ? `Du verdienst ${formatCurrency(arbitrageBerechnung.nettoJahr)} netto pro Jahr und wohnst quasi kostenlos!`
                      : arbitrageBerechnung.cashflowMonat === 0
                        ? 'Du wohnst kostenlos, verdienst aber nichts zusätzlich.'
                        : `Du zahlst effektiv ${formatCurrency(Math.abs(arbitrageBerechnung.cashflowMonat))}/Monat für dein Wohnen.`
                    }
                  </p>
                </div>

                {/* Hinweis */}
                <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600">
                  <strong className="inline-flex items-center gap-1"><Lightbulb size={12}/> Hinweis:</strong> Bei Miet-Arbitrage prüfe unbedingt deinen Mietvertrag auf Untervermietungsrechte und informiere dich über lokale Regelungen.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 rounded-b-2xl">
          {/* Save-Dialog */}
          {saveDialogOpen && (
            <div className="px-5 pt-4 pb-3 border-b bg-purple-50">
              <p className="text-sm font-semibold text-purple-800 mb-2">
                {editingId
                  ? <span className="inline-flex items-center gap-1"><Pencil size={14}/> Kalkulation überschreiben</span>
                  : <span className="inline-flex items-center gap-1"><Save size={14}/> Kalkulation speichern</span>}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={`z.B. „Wohnung Berlin Mitte"`}
                  className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  autoFocus
                />
                <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700">
                  Speichern
                </button>
                <button onClick={() => { setSaveDialogOpen(false); setSaveName(''); setEditingId(null); }} className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300">
                  <X size={14}/>
                </button>
              </div>
            </div>
          )}
          <div className="p-4 flex justify-between items-center gap-3">
            <button
              onClick={() => openSaveDialog()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14}/> Kalkulation speichern
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KalkulationsModal;
