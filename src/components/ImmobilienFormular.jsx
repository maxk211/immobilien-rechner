import { useState, useMemo } from 'react';
import {
  Home, Building2, ArrowLeftRight, Settings, ChevronUp,
  ParkingCircle, Car, Shuffle, BedDouble, TrendingDown,
  BarChart3, Zap, TrendingUp, ClipboardList, Wallet,
  User, Users, Check, X, Gift, Landmark, Globe, Tv, Search,
  Plus, CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/format.js';
import { schaetzeImmobilienwert, berechneRendite, berechneMtlCashflow } from '../utils/berechnung.js';

const ImmobilienFormular = ({ onSave, onClose, onOpenDetail, initialData }) => {
  // Beim Bearbeiten direkt alle Details zeigen, beim Anlegen erst auf Basis-Modus
  const [showDetails, setShowDetails] = useState(!!initialData);
  // Schnellstart vs. Expertenansicht
  const [formModus, setFormModus] = useState(initialData ? 'experte' : 'schnell');
  // Nach Schnellstart-Speichern: gespeicherte Immobilie für Nachfrage-Dialog
  const [gespeicherteImmo, setGespeicherteImmo] = useState(null);
  const [formData, setFormData] = useState(initialData || {
    name: '',
    plz: '',
    adresse: '',
    immobilienTyp: 'kaufimmobilie', // NEU: kaufimmobilie oder mietimmobilie
    objektart: 'eigentumswohnung',
    zustand: 'gut',
    wohnflaeche: 80,
    grundstueck: 0,
    zimmer: 3,
    baujahr: 2000,
    stockwerk: 1,
    energieeffizienz: 'C',
    balkon: false,
    garage: false,
    keller: false,
    kaufpreis: 300000,
    eigenkapital: 60000,
    geschenkt: false,               // Immobilie als Schenkung erhalten (kein Kaufpreis, kein Kredit)
    vollEigenfinanziert: false,     // 100 % aus eigenen Mitteln, kein Fremdkapital
    kaltmiete: 1000,
    vermietungsmodell: 'kaltmiete', // 'kaltmiete', 'kaltmiete_nk', 'warmmiete'
    nebenkostenVomMieter: 0,        // Monatliche NK-Vorauszahlung vom Mieter
    kaufdatum: '',
    zinssatz: 4.0,
    tilgung: 2.0,
    laufzeit: 25,
    zinsbindung: 10,
    finanzierungsModus: 'berechnet', // 'berechnet' oder 'festRate'
    monatlicherBetrag: null,
    // Mietimmobilie / Arbitrage spezifische Felder
    eigeneWarmmiete: 1500,        // Was man selbst zahlt (warm)
    anzahlZimmerVermietet: 3,     // Anzahl Zimmer die untervermietet werden
    untermieteProZimmer: 600,     // Warmmiete pro Zimmer von Untermietern
    // Aufgeschlüsselte Kosten für Steuerberater
    arbitrageStrom: 0,            // Stromkosten monatlich
    arbitrageInternet: 0,         // Internetkosten monatlich
    arbitrageGEZ: 18.36,          // GEZ/Rundfunkbeitrag monatlich (Standard: 18,36€)
    mietvertragStart: '',         // Startdatum des Mietvertrags
    aktiv: true,                  // Immobilie aktiv oder aufgegeben
    aufgabedatum: '',             // Datum der Aufgabe/Verkauf
    mietAnpassungen: [],          // [{datum, kaltmiete}] Miethistorie mit Datum
    // Eigentumsstruktur
    eigentumsform: 'allein',      // 'allein' oder 'gbr'
    userAnteil: 100,              // Anteil des Users in % (bei GbR)
    stellplatz: {
      vorhanden: false,
      typ: 'tiefgarage',
      anzahl: 1,
      kaufpreisAnteil: 0,
      monatlicheMiete: 0,
      istVermietet: true,
    },
    gbrPartner: [],               // [{name, anteil}] weitere GbR-Gesellschafter
  });

  const schaetzung = useMemo(() => schaetzeImmobilienwert(formData), [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Zahl-Inputs: leeres Feld bleibt leer (kein Auto-0)
  const numInp = (v, fb = 0) => v === '' ? '' : (parseFloat(v) || fb);
  const intInp = (v, fb = 0) => v === '' ? '' : (parseInt(v) || fb);
  // Beim Speichern: '' → Fallback-Zahl
  const toN = (v, fb = 0) => { const x = parseFloat(v); return isNaN(x) ? fb : x; };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-xl shadow-2xl sm:max-w-2xl h-[93vh] sm:max-h-[90vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-cream-200 rounded-full"></div>
        </div>
        <div className="p-4 sm:p-6 border-b border-cream-200 flex-shrink-0">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h2 className="text-xl font-bold text-cream-800">
              {initialData ? 'Immobilie bearbeiten' : 'Neue Immobilie'}
            </h2>
            <button onClick={onClose} className="text-cream-400 hover:text-cream-600 mt-0.5 flex-shrink-0">
              <X size={20}/>
            </button>
          </div>
          {/* Modus-Auswahl — nur bei neuen Immobilien */}
          {!initialData && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormModus('schnell')}
                className={`relative flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                  formModus === 'schnell'
                    ? 'border-clay-500 bg-clay-50 shadow-sm'
                    : 'border-cream-200 bg-white hover:border-cream-300 hover:bg-cream-50'
                }`}
              >
                {formModus === 'schnell' && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-clay-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" strokeWidth={3}/>
                  </span>
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${formModus === 'schnell' ? 'bg-clay-500 text-white' : 'bg-cream-100 text-cream-500'}`}>
                  <Zap size={16}/>
                </div>
                <span className={`text-sm font-bold leading-tight ${formModus === 'schnell' ? 'text-clay-700' : 'text-cream-700'}`}>Schnellstart</span>
                <span className="text-xs text-cream-400 mt-0.5 leading-tight">Nur das Wichtigste · ca. 2 Min.</span>
              </button>
              <button
                type="button"
                onClick={() => setFormModus('experte')}
                className={`relative flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                  formModus === 'experte'
                    ? 'border-clay-500 bg-clay-50 shadow-sm'
                    : 'border-cream-200 bg-white hover:border-cream-300 hover:bg-cream-50'
                }`}
              >
                {formModus === 'experte' && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-clay-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" strokeWidth={3}/>
                  </span>
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${formModus === 'experte' ? 'bg-clay-500 text-white' : 'bg-cream-100 text-cream-500'}`}>
                  <Settings size={16}/>
                </div>
                <span className={`text-sm font-bold leading-tight ${formModus === 'experte' ? 'text-clay-700' : 'text-cream-700'}`}>Alle Details</span>
                <span className="text-xs text-cream-400 mt-0.5 leading-tight">Vollständige Eingabe</span>
              </button>
            </div>
          )}
        </div>

        {/* ── SCHNELLSTART-MODUS ─────────────────────────────────────────── */}
        {formModus === 'schnell' && (
          <div className="p-5 space-y-5 overflow-y-auto flex-grow">
            {/* Immobilientyp */}
            <div className="bg-gradient-to-r from-clay-50 to-clay-50 p-4 rounded-lg border border-clay-100">
              <label className="block text-sm font-medium text-cream-700 mb-2">Immobilientyp</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'kaufimmobilie')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'kaufimmobilie'
                      ? 'border-clay-500 bg-clay-50 text-clay-700'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className="flex justify-center mb-1"><Home size={20}/></div>
                  <div className="font-semibold text-sm">Kaufimmobilie</div>
                  <div className="hidden sm:block text-xs text-cream-500">Eigene Immobilie vermieten</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'mehrfamilienhaus')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'mehrfamilienhaus'
                      ? 'border-honey-500 bg-honey-50 text-honey-700'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className="flex justify-center mb-1"><Building2 size={20}/></div>
                  <div className="font-semibold text-sm">Mehrfamilien&shy;haus</div>
                  <div className="hidden sm:block text-xs text-cream-500">Mehrere Wohnungen verwalten</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'mietimmobilie')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'mietimmobilie'
                      ? 'border-clay-500 bg-clay-50 text-clay-700'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className="flex justify-center mb-1"><ArrowLeftRight size={20}/></div>
                  <div className="font-semibold text-sm">Mietimmobilie</div>
                  <div className="hidden sm:block text-xs text-cream-500">Arbitrage: Anmieten &amp; Untervermieten</div>
                </button>
              </div>
            </div>

            {/* Basis */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-cream-500 uppercase tracking-wide">Basis</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-cream-700 mb-1">Bezeichnung</label>
                  <input type="text" value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                    placeholder="z.B. Wohnung München Schwabing" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cream-700 mb-1">PLZ</label>
                  <input type="text" value={formData.plz}
                    onChange={e => handleChange('plz', e.target.value)}
                    className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                    placeholder="80331" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-cream-700 mb-1">Adresse <span className="text-brick-400">*</span></label>
                  <input type="text" value={formData.adresse}
                    onChange={e => handleChange('adresse', e.target.value)}
                    className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                    placeholder="Musterstraße 12" />
                </div>
              </div>
            </div>

            {/* Finanzen */}
            {formData.immobilienTyp !== 'mietimmobilie' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cream-500 uppercase tracking-wide">Finanzen</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Kaufpreis (€)</label>
                    <input type="number" value={formData.kaufpreis ?? ''}
                      onChange={e => handleChange('kaufpreis', numInp(e.target.value))}
                      className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                      placeholder="300000" />
                  </div>
                  {formData.immobilienTyp !== 'mehrfamilienhaus' && (
                    <div>
                      <label className="block text-sm font-medium text-cream-700 mb-1">Kaltmiete (€/Mon.)</label>
                      <input type="number" value={formData.kaltmiete ?? ''}
                        onChange={e => handleChange('kaltmiete', numInp(e.target.value))}
                        className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                        placeholder="1000" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MFH: Wohnungen (vereinfacht) */}
            {formData.immobilienTyp === 'mehrfamilienhaus' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-cream-500 uppercase tracking-wide">Wohneinheiten</h3>
                  {(formData.wohnungen || []).length > 0 && (
                    <span className="text-xs text-honey-600 font-semibold bg-honey-50 px-2 py-0.5 rounded-full">
                      {formatCurrency((formData.wohnungen||[]).reduce((s,w)=>s+(Number(w.kaltmiete)||0),0))}/mo gesamt
                    </span>
                  )}
                </div>
                {(formData.wohnungen || []).map((w, idx) => (
                  <div key={idx} className="bg-honey-50 border border-honey-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-honey-700">Wohneinheit {idx + 1}</span>
                      <button type="button" onClick={() => handleChange('wohnungen', (formData.wohnungen||[]).filter((_,i)=>i!==idx))}
                        className="text-brick-400 hover:text-brick-600 transition-colors text-xs px-1">
                        <X size={14}/>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-cream-500 mb-0.5">Bezeichnung</label>
                        <input type="text" placeholder="z.B. EG links"
                          value={w.name || ''} onChange={e => { const wu = [...(formData.wohnungen||[])]; wu[idx]={...wu[idx], name: e.target.value}; handleChange('wohnungen', wu); }}
                          className="w-full px-2 py-2 border border-cream-300 rounded-lg text-sm focus:ring-2 focus:ring-honey-400 bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-cream-500 mb-0.5">Kaltmiete (€/Mon.)</label>
                        <input type="number" placeholder="z.B. 800"
                          value={w.kaltmiete === 0 || w.kaltmiete === '' ? '' : w.kaltmiete}
                          onChange={e => { const wu = [...(formData.wohnungen||[])]; wu[idx]={...wu[idx], kaltmiete: numInp(e.target.value)}; handleChange('wohnungen', wu); }}
                          className="w-full px-2 py-2 border border-cream-300 rounded-lg text-sm focus:ring-2 focus:ring-honey-400 bg-white text-right" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button"
                  onClick={() => handleChange('wohnungen', [...(formData.wohnungen||[]), { name: '', kaltmiete: '', wohnflaeche: '' }])}
                  className="w-full py-2.5 border-2 border-dashed border-honey-300 rounded-xl text-sm text-honey-600 hover:border-honey-400 hover:bg-honey-50 transition-all flex items-center justify-center gap-1.5 font-medium">
                  <Plus size={14}/> Wohneinheit hinzufügen
                </button>
              </div>
            )}

            {/* Mietimmobilie */}
            {formData.immobilienTyp === 'mietimmobilie' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cream-500 uppercase tracking-wide">Arbitrage</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-cream-700 mb-1">Eigene Warmmiete (€/Mon.)</label>
                    <input type="number" value={formData.eigeneWarmmiete ?? ''}
                      onChange={e => handleChange('eigeneWarmmiete', numInp(e.target.value))}
                      className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                      placeholder="1500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Zimmer vermietet</label>
                    <input type="number" value={formData.anzahlZimmerVermietet ?? ''}
                      onChange={e => handleChange('anzahlZimmerVermietet', intInp(e.target.value))}
                      className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                      placeholder="3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Preis/Zimmer (€/Mon.)</label>
                    <input type="number" value={formData.untermieteProZimmer ?? ''}
                      onChange={e => handleChange('untermieteProZimmer', numInp(e.target.value))}
                      className="w-full px-3 py-2.5 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base"
                      placeholder="600" />
                  </div>
                </div>
              </div>
            )}

            {/* Finanzierung (nur für Kauf/MFH) */}
            {formData.immobilienTyp !== 'mietimmobilie' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cream-500 uppercase tracking-wide">Finanzierung</h3>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors">
                  <input type="checkbox" checked={!!formData.kreditLaeuftBereits}
                    onChange={e => handleChange('kreditLaeuftBereits', e.target.checked)}
                    className="w-4 h-4 accent-clay-600" />
                  <div>
                    <span className="text-sm font-semibold text-cream-800">Kredit läuft bereits</span>
                    <p className="text-xs text-cream-500">Ich kenne meine aktuelle Restschuld und Rate</p>
                  </div>
                </label>
                {formData.kreditLaeuftBereits ? (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-clay-50 rounded-xl border border-clay-100">
                    <div>
                      <label className="block text-xs font-medium text-cream-600 mb-1">Restschuld (€)</label>
                      <input type="number" value={formData.aktuelleRestschuld ?? ''}
                        onChange={e => handleChange('aktuelleRestschuld', numInp(e.target.value))}
                        className="w-full px-2.5 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                        placeholder="85000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-cream-600 mb-1">Rate (€/Mon.)</label>
                      <input type="number" value={formData.kreditMonatsrate ?? ''}
                        onChange={e => handleChange('kreditMonatsrate', numInp(e.target.value))}
                        className="w-full px-2.5 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                        placeholder="650" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-cream-600 mb-1">Eigenkapital (€)</label>
                      <input type="number" value={formData.eigenkapital ?? ''}
                        onChange={e => handleChange('eigenkapital', numInp(e.target.value))}
                        className="w-full px-2.5 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                        placeholder="60000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-cream-600 mb-1">Zinssatz (% p.a.)</label>
                      <input type="number" step="0.1" value={formData.zinssatz ?? ''}
                        onChange={e => handleChange('zinssatz', numInp(e.target.value))}
                        className="w-full px-2.5 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                        placeholder="4.0" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EXPERTENANSICHT ─────────────────────────────────────────────── */}
        {formModus === 'experte' && (
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {/* Immobilientyp Auswahl */}
            <div className="bg-gradient-to-r from-clay-50 to-clay-50 p-4 rounded-lg border border-clay-100">
              <label className="block text-sm font-medium text-cream-700 mb-2">Immobilientyp</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'kaufimmobilie')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'kaufimmobilie'
                      ? 'border-clay-500 bg-clay-50 text-clay-700'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className="flex justify-center mb-1"><Home size={20}/></div>
                  <div className="font-semibold text-sm">Kaufimmobilie</div>
                  <div className="hidden sm:block text-xs text-cream-500">Eigene Immobilie vermieten</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'mehrfamilienhaus')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'mehrfamilienhaus'
                      ? 'border-honey-500 bg-honey-50 text-honey-700'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className="flex justify-center mb-1"><Building2 size={20}/></div>
                  <div className="font-semibold text-sm">Mehrfamilien&shy;haus</div>
                  <div className="hidden sm:block text-xs text-cream-500">Mehrere Wohnungen verwalten</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'mietimmobilie')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'mietimmobilie'
                      ? 'border-clay-500 bg-clay-50 text-clay-700'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className="flex justify-center mb-1"><ArrowLeftRight size={20}/></div>
                  <div className="font-semibold text-sm">Mietimmobilie</div>
                  <div className="hidden sm:block text-xs text-cream-500">Arbitrage: Anmieten & Untervermieten</div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-cream-700">Grunddaten</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cream-700 mb-1">Name/Bezeichnung</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    placeholder={formData.immobilienTyp === 'mietimmobilie' ? 'z.B. Mitarbeiter-WG München' : 'z.B. Wohnung München'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cream-700 mb-1">PLZ</label>
                  <input
                    type="text"
                    value={formData.plz}
                    onChange={(e) => handleChange('plz', e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    placeholder="z.B. 80331"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-cream-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    placeholder="z.B. Musterstraße 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cream-700 mb-1">
                    {formData.immobilienTyp === 'mietimmobilie' ? 'Mietvertrag seit' : 'Kaufdatum'}
                  </label>
                  <input
                    type="date"
                    value={formData.immobilienTyp === 'mietimmobilie' ? formData.mietvertragStart : formData.kaufdatum}
                    onChange={(e) => handleChange(formData.immobilienTyp === 'mietimmobilie' ? 'mietvertragStart' : 'kaufdatum', e.target.value)}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* MFH: Wohnungsaufteilung direkt nach Grunddaten — das Wichtigste zuerst */}
            {formData.immobilienTyp === 'mehrfamilienhaus' && (
              <div className="bg-honey-50 p-4 rounded-xl border-2 border-honey-300">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-honey-800 flex items-center gap-1"><Building2 size={16}/>Wohnungsaufteilung</h3>
                    <p className="text-xs text-honey-600 mt-0.5">Fläche, Zimmer und Kaltmiete ergeben sich automatisch aus der Summe der WEs</p>
                  </div>
                  <button type="button"
                    onClick={() => {
                      const neu = (formData.wohnungen || []).concat({
                        id: Date.now(),
                        name: `WE ${(formData.wohnungen || []).length + 1}`,
                        wohnflaeche: 60,
                        kaltmiete: 800,
                        etage: '',
                        mieterName: '',
                        mietbeginn: '',
                        kautionBetrag: 0,
                        kautionBezahlt: false,
                        forderungen: [],
                        mietAnpassungen: [],
                      });
                      handleChange('wohnungen', neu);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-honey-600 text-white rounded-lg hover:bg-honey-700 flex items-center gap-1">
                    + Wohnung
                  </button>
                </div>
                {(!formData.wohnungen || formData.wohnungen.length === 0) ? (
                  <div className="text-center py-5 text-honey-600 text-sm bg-white/60 rounded-xl border border-honey-100">
                    <div className="flex justify-center mb-1"><Home size={32} className="text-honey-400"/></div>
                    <p>Noch keine Wohneinheiten — klicke "+ Wohnung" zum Anlegen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(formData.wohnungen || []).map((w, idx) => (
                      <div key={w.id || idx} className="bg-white rounded-xl border border-honey-200 p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-honey-800 flex items-center gap-1"><Home size={14}/>WE {idx + 1}</span>
                          <button type="button"
                            onClick={() => handleChange('wohnungen', (formData.wohnungen || []).filter((_, i) => i !== idx))}
                            className="ml-auto text-brick-400 hover:text-brick-600 text-xs px-1.5 py-0.5 rounded">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-cream-500 mb-0.5">Bezeichnung</label>
                            <input type="text" value={w.name || ''}
                              onChange={e => { const neu = [...(formData.wohnungen || [])]; neu[idx] = { ...neu[idx], name: e.target.value }; handleChange('wohnungen', neu); }}
                              className="w-full px-2 py-1.5 text-sm border border-cream-300 rounded-lg" placeholder="z.B. EG links" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-cream-500 mb-0.5">Etage</label>
                            <input type="text" value={w.etage || ''}
                              onChange={e => { const neu = [...(formData.wohnungen || [])]; neu[idx] = { ...neu[idx], etage: e.target.value }; handleChange('wohnungen', neu); }}
                              className="w-full px-2 py-1.5 text-sm border border-cream-300 rounded-lg" placeholder="z.B. EG, 1. OG" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-cream-500 mb-0.5">Fläche (m²)</label>
                            <input type="number" value={w.wohnflaeche || ''}
                              onChange={e => { const neu = [...(formData.wohnungen || [])]; neu[idx] = { ...neu[idx], wohnflaeche: numInp(e.target.value) }; handleChange('wohnungen', neu); }}
                              className="w-full px-2 py-1.5 text-sm border border-cream-300 rounded-lg text-right" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-cream-500 mb-0.5">Kaltmiete (€/mo)</label>
                            <input type="number" value={w.kaltmiete || ''}
                              onChange={e => { const neu = [...(formData.wohnungen || [])]; neu[idx] = { ...neu[idx], kaltmiete: numInp(e.target.value) }; handleChange('wohnungen', neu); }}
                              className="w-full px-2 py-1.5 text-sm border border-cream-300 rounded-lg text-right" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-honey-100 rounded-xl px-4 py-2 flex justify-between items-center text-sm">
                      <span className="text-honey-800 font-semibold">{(formData.wohnungen || []).length} Wohneinheiten gesamt</span>
                      <span className="font-black text-honey-900">
                        {formatCurrency((formData.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0))}/mo · {(formData.wohnungen || []).reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0)} m²
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Optionale Details — hinter Toggle ──────────────────────── */}
            {!showDetails && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="w-full py-3 border-2 border-dashed border-cream-300 rounded-xl text-sm font-semibold text-cream-500 hover:border-clay-400 hover:text-clay-600 transition-all flex items-center justify-center gap-2"
              >
                <Settings size={16}/> Erweiterte Details anzeigen
                <span className="text-xs font-normal opacity-60">(Objektdetails, Eigentumsstruktur, Vermietungsmodell, Stellplatz)</span>
              </button>
            )}

            {showDetails && (<>

            {/* MFH: Gebäudedaten — nur auf Gebäudeebene (kein Stockwerk/Balkon/Zimmer — kommen aus Wohnungen) */}
            {formData.immobilienTyp === 'mehrfamilienhaus' && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-cream-700">Gebäudedaten</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Zustand</label>
                    <select value={formData.zustand} onChange={(e) => handleChange('zustand', e.target.value)} className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-honey-500 text-base sm:text-sm">
                      <option value="neuwertig">Neuwertig</option>
                      <option value="sehr gut">Sehr gut</option>
                      <option value="gut">Gut</option>
                      <option value="normal">Normal</option>
                      <option value="renovierungsbedürftig">Renovierungsbedürftig</option>
                      <option value="sanierungsbedürftig">Sanierungsbedürftig</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Baujahr</label>
                    <input type="number" value={formData.baujahr} onChange={(e) => handleChange('baujahr', intInp(e.target.value, 2000))} className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-honey-500 text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Grundstück (m²)</label>
                    <input type="number" value={formData.grundstueck} onChange={(e) => handleChange('grundstueck', numInp(e.target.value))} className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-honey-500 text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Energieeffizienz</label>
                    <select value={formData.energieeffizienz} onChange={(e) => handleChange('energieeffizienz', e.target.value)} className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-honey-500 text-base sm:text-sm">
                      {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(e => (<option key={e} value={e}>{e}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Objektdetails - nur für Kaufimmobilie (ETW/EFH/Reihenhaus etc.) */}
            {formData.immobilienTyp === 'kaufimmobilie' && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-cream-700">Objektdetails</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Objektart</label>
                    <select
                      value={formData.objektart}
                      onChange={(e) => handleChange('objektart', e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    >
                      <option value="eigentumswohnung">Eigentumswohnung</option>
                      <option value="einfamilienhaus">Einfamilienhaus</option>
                      <option value="doppelhaushälfte">Doppelhaushälfte</option>
                      <option value="reihenhaus">Reihenhaus</option>
                      <option value="grundstück">Grundstück</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Zustand</label>
                    <select
                      value={formData.zustand}
                      onChange={(e) => handleChange('zustand', e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    >
                      <option value="neuwertig">Neuwertig</option>
                      <option value="sehr gut">Sehr gut</option>
                      <option value="gut">Gut</option>
                      <option value="normal">Normal</option>
                      <option value="renovierungsbedürftig">Renovierungsbedürftig</option>
                      <option value="sanierungsbedürftig">Sanierungsbedürftig</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Wohnfläche (m²)</label>
                    <input
                      type="number"
                      value={formData.wohnflaeche}
                      onChange={(e) => handleChange('wohnflaeche', numInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Grundstück (m²)</label>
                    <input
                      type="number"
                      value={formData.grundstueck}
                      onChange={(e) => handleChange('grundstueck', numInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Zimmer</label>
                    <input
                      type="number"
                      value={formData.zimmer}
                      onChange={(e) => handleChange('zimmer', numInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Baujahr</label>
                    <input
                      type="number"
                      value={formData.baujahr}
                      onChange={(e) => handleChange('baujahr', intInp(e.target.value, 2000))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Stockwerk</label>
                    <input
                      type="number"
                      value={formData.stockwerk}
                      onChange={(e) => handleChange('stockwerk', intInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Energieeffizienz</label>
                    <select
                      value={formData.energieeffizienz}
                      onChange={(e) => handleChange('energieeffizienz', e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    >
                      {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.balkon}
                      onChange={(e) => handleChange('balkon', e.target.checked)}
                      className="w-4 h-4 text-clay-600"
                    />
                    <span className="text-sm text-cream-700">Balkon/Terrasse</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.garage}
                      onChange={(e) => handleChange('garage', e.target.checked)}
                      className="w-4 h-4 text-clay-600"
                    />
                    <span className="text-sm text-cream-700">Garage/Stellplatz</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.keller}
                      onChange={(e) => handleChange('keller', e.target.checked)}
                      className="w-4 h-4 text-clay-600"
                    />
                    <span className="text-sm text-cream-700">Keller</span>
                  </label>
                </div>
              </div>
            )}

            {/* Objektdetails für Mietimmobilie - vereinfacht */}
            {formData.immobilienTyp === 'mietimmobilie' && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-cream-700">Objektdetails</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Wohnfläche (m²)</label>
                    <input
                      type="number"
                      value={formData.wohnflaeche}
                      onChange={(e) => handleChange('wohnflaeche', numInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Gesamtzahl Zimmer</label>
                    <input
                      type="number"
                      value={formData.zimmer}
                      onChange={(e) => handleChange('zimmer', numInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Marktwert - nur für Kaufimmobilie / MFH */}
            {(formData.immobilienTyp === 'kaufimmobilie' || formData.immobilienTyp === 'mehrfamilienhaus') && (
              <div className="bg-clay-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-clay-800">Aktueller Marktwert</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-cream-700 mb-1">Geschätzter Wert (€)</label>
                  <input
                    type="number"
                    value={formData.geschaetzterWert || ''}
                    onChange={(e) => handleChange('geschaetzterWert', numInp(e.target.value))}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    placeholder="z.B. 350000"
                  />
                </div>
                <a
                  href={`https://www.homeday.de/de/preisatlas/${formData.plz ? '?search=' + formData.plz : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-clay-600 text-white rounded-lg hover:bg-clay-700 text-sm"
                >
                  <Search size={14}/> Preis bei Homeday recherchieren
                </a>
                <p className="text-xs text-clay-600 mt-2">
                  Recherchiere den aktuellen Marktwert und trage ihn oben ein.
                </p>
              </div>
            )}

            {/* Finanzdaten für Kaufimmobilie / MFH */}
            {(formData.immobilienTyp === 'kaufimmobilie' || formData.immobilienTyp === 'mehrfamilienhaus') && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-cream-700">Finanzdaten</h3>
                {/* Finanzierungsart — Schenkung oder Eigenfinanzierung */}
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all ${formData.geschenkt ? 'border-honey-400 bg-honey-50' : 'border-cream-200 hover:border-cream-300 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={formData.geschenkt || false}
                      onChange={(e) => {
                        const g = e.target.checked;
                        handleChange('geschenkt', g);
                        if (g) {
                          handleChange('eigenkapital', formData.kaufpreis);
                          handleChange('finanzierungsModus', 'berechnet');
                          handleChange('vollEigenfinanziert', false);
                        }
                      }}
                      className="w-4 h-4 rounded accent-honey-500 mt-0.5 shrink-0"
                    />
                    <div>
                      <span className="font-semibold text-honey-800 text-sm flex items-center gap-1"><Gift size={14}/>Schenkung / Erbschaft</span>
                      <p className="text-xs text-honey-600 mt-0.5">Kein Kaufpreis — trage den Verkehrswert ein.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all ${formData.vollEigenfinanziert ? 'border-sage-400 bg-sage-50' : 'border-cream-200 hover:border-cream-300 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={formData.vollEigenfinanziert || false}
                      onChange={(e) => {
                        const v = e.target.checked;
                        handleChange('vollEigenfinanziert', v);
                        if (v) {
                          handleChange('eigenkapital', formData.kaufpreis);
                          handleChange('geschenkt', false);
                        }
                      }}
                      className="w-4 h-4 rounded accent-sage-500 mt-0.5 shrink-0"
                    />
                    <div>
                      <span className="font-semibold text-sage-800 text-sm flex items-center gap-1"><Wallet size={14}/>100 % Eigenkapital</span>
                      <p className="text-xs text-sage-600 mt-0.5">Kein Kredit — vollständig aus eigenen Mitteln.</p>
                    </div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">
                      {formData.geschenkt ? 'Verkehrswert / Schenkungswert (€)' : 'Kaufpreis (€)'}
                    </label>
                    <input
                      type="number"
                      value={formData.kaufpreis}
                      onChange={(e) => {
                        const v = numInp(e.target.value);
                        handleChange('kaufpreis', v);
                        if (formData.geschenkt || formData.vollEigenfinanziert) handleChange('eigenkapital', v === '' ? '' : v);
                      }}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  {!formData.geschenkt && !formData.vollEigenfinanziert && (
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">Eigenkapital (€)</label>
                    <input
                      type="number"
                      value={formData.eigenkapital}
                      onChange={(e) => handleChange('eigenkapital', numInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  )}
                  {formData.vollEigenfinanziert && !formData.geschenkt && (
                    <div className="flex items-end pb-1">
                      <div className="w-full px-3 py-2.5 border border-sage-200 bg-sage-50 rounded-lg text-sm font-bold text-sage-800 flex items-center justify-between">
                        <span>EK = Kaufpreis</span>
                        <span className="text-xs font-normal text-sage-600">kein Kredit</span>
                      </div>
                    </div>
                  )}
                  {/* Kredit läuft bereits — Toggle */}
                  {!formData.geschenkt && !formData.vollEigenfinanziert && (
                    <label className="col-span-2 flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={!!formData.kreditLaeuftBereits}
                        onChange={e => handleChange('kreditLaeuftBereits', e.target.checked)}
                        className="w-4 h-4 accent-clay-600"
                      />
                      <div>
                        <span className="text-sm font-semibold text-cream-800">Kredit läuft bereits</span>
                        <p className="text-xs text-cream-500">Ich kenne meine aktuelle Restschuld und monatliche Rate</p>
                      </div>
                    </label>
                  )}
                {/* Finanzierungskonditionen — nur wenn nicht geschenkt und nicht vollständig eigenfinanziert */}
                {!formData.geschenkt && !formData.vollEigenfinanziert && !formData.kreditLaeuftBereits && <div className="col-span-2 mt-2 p-4 bg-clay-50 rounded-lg border border-clay-200">
                  <h4 className="text-sm font-semibold text-clay-800 mb-3 flex items-center gap-1"><Landmark size={14}/>Finanzierung</h4>
                  {/* Modus Toggle */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[['berechnet','Rate berechnen'],['festRate','Feste Rate (Bankvertrag)']].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => handleChange('finanzierungsModus', val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${formData.finanzierungsModus === val ? 'border-clay-500 bg-white text-clay-700' : 'border-cream-200 bg-white text-cream-500'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-cream-600 mb-1">Zinssatz</label>
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={15} step={0.1} value={formData.zinssatz}
                          onChange={(e) => handleChange('zinssatz', numInp(e.target.value))}
                          className="w-full px-2 py-1.5 border border-cream-300 rounded text-sm text-right" />
                        <span className="text-xs text-cream-500">%</span>
                      </div>
                    </div>
                    {formData.finanzierungsModus === 'berechnet' ? (
                      <>
                        <div>
                          <label className="block text-xs text-cream-600 mb-1">Anfangstilgung</label>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={10} step={0.5} value={formData.tilgung}
                              onChange={(e) => handleChange('tilgung', numInp(e.target.value))}
                              className="w-full px-2 py-1.5 border border-cream-300 rounded text-sm text-right" />
                            <span className="text-xs text-cream-500">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-cream-600 mb-1">Gesamtlaufzeit</label>
                          <div className="flex items-center gap-1">
                            <input type="number" min={5} max={40} step={1} value={formData.laufzeit}
                              onChange={(e) => handleChange('laufzeit', intInp(e.target.value, 25))}
                              className="w-full px-2 py-1.5 border border-cream-300 rounded text-sm text-right" />
                            <span className="text-xs text-cream-500">J.</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs text-cream-600 mb-1">Monatl. Rate (fest)</label>
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} step={10} value={formData.monatlicherBetrag || ''}
                            placeholder="z.B. 650"
                            onChange={(e) => handleChange('monatlicherBetrag', e.target.value === '' ? '' : (parseFloat(e.target.value) || null))}
                            className="w-full px-2 py-1.5 border-2 border-clay-400 bg-white rounded text-sm text-right font-semibold" />
                          <span className="text-xs text-cream-500">€</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-cream-600 mb-1">Zinsbindung</label>
                      <div className="flex items-center gap-1">
                        <input type="number" min={1} max={30} step={1} value={formData.zinsbindung}
                          onChange={(e) => handleChange('zinsbindung', intInp(e.target.value, 10))}
                          className="w-full px-2 py-1.5 border border-cream-300 rounded text-sm text-right" />
                        <span className="text-xs text-cream-500">J.</span>
                      </div>
                    </div>
                  </div>
                  {/* Rate-Vorschau */}
                  {formData.finanzierungsModus === 'berechnet' && formData.zinssatz > 0 && formData.eigenkapital >= 0 && (
                    (() => {
                      const kaufnkFaktor = 1 + ((formData.kaufnebenkosten || 10) / 100);
                      const kredit = Math.max(0, formData.kaufpreis * kaufnkFaktor - formData.eigenkapital);
                      const mz = formData.zinssatz / 100 / 12;
                      const lm = (formData.laufzeit || 25) * 12;
                      const rate = kredit > 0 && mz > 0 ? kredit * (mz * Math.pow(1+mz,lm)) / (Math.pow(1+mz,lm)-1) : 0;
                      return rate > 0 ? (
                        <p className="text-xs text-clay-700 mt-2 font-semibold">
                          ≈ Monatliche Rate: {new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(rate)}
                          <span className="font-normal text-clay-500 ml-1">(bei ca. {new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(kredit)} Kredit)</span>
                        </p>
                      ) : null;
                    })()
                  )}
                </div>}

                {/* Laufender Kredit: direkte Eingabe */}
                {!formData.geschenkt && !formData.vollEigenfinanziert && formData.kreditLaeuftBereits && (
                  <div className="col-span-2">
                    <div className="space-y-3 p-4 bg-clay-50 rounded-xl border border-clay-100">
                      <p className="text-xs font-semibold text-clay-700 uppercase tracking-wide">Laufender Kredit</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-cream-700 mb-1">Aktuelle Restschuld (€)</label>
                          <input type="number" value={formData.aktuelleRestschuld ?? ''}
                            onChange={e => handleChange('aktuelleRestschuld', numInp(e.target.value))}
                            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                            placeholder="z.B. 85000" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-cream-700 mb-1">Monatliche Rate (€)</label>
                          <input type="number" value={formData.kreditMonatsrate ?? ''}
                            onChange={e => handleChange('kreditMonatsrate', numInp(e.target.value))}
                            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                            placeholder="z.B. 650" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-cream-700 mb-1">Zinssatz (% p.a.)</label>
                          <input type="number" step="0.1" value={formData.zinssatz ?? ''}
                            onChange={e => handleChange('zinssatz', numInp(e.target.value))}
                            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                            placeholder="z.B. 3.5" />
                          <p className="text-xs text-cream-400 mt-1">Für Zinsen-Berechnung (Steuer)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-cream-700 mb-1">Zinsbindung bis (Jahr)</label>
                          <input type="number" value={formData.zinsbindungBis ?? ''}
                            onChange={e => handleChange('zinsbindungBis', intInp(e.target.value))}
                            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                            placeholder={String(new Date().getFullYear() + 5)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                  {formData.immobilienTyp === 'mehrfamilienhaus' ? (
                    <div>
                      <label className="block text-sm font-medium text-cream-700 mb-1">Kaltmiete gesamt (aus Wohnungen)</label>
                      <div className="w-full px-3 py-2.5 border border-cream-200 bg-honey-50 rounded-lg text-sm font-bold text-honey-800 flex items-center justify-between">
                        <span>{formatCurrency((formData.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0))}/mo</span>
                        <span className="text-xs font-normal text-honey-600">{(formData.wohnungen || []).length} WE · automatisch</span>
                      </div>
                    </div>
                  ) : (
                  <div>
                    <label className="block text-sm font-medium text-cream-700 mb-1">
                      {formData.vermietungsmodell === 'warmmiete' ? 'Warmmiete (€/Monat)' : 'Kaltmiete (€/Monat)'}
                    </label>
                    <input
                      type="number"
                      value={formData.kaltmiete}
                      onChange={(e) => handleChange('kaltmiete', numInp(e.target.value))}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                    />
                  </div>
                  )}
                </div>

                {/* Vermietungsmodell — nur für Einzel-Kaufimmobilie: bei MFH wird die Miete pro
                    Wohnung erfasst, ein Modell auf Gebäudeebene wird von den Berechnungen
                    (berechneMtlCashflow etc.) bewusst nicht berücksichtigt (siehe berechnung.js) */}
                {formData.immobilienTyp !== 'mehrfamilienhaus' && (
                <div className="mt-4 bg-clay-50 p-3 rounded-lg border border-clay-100">
                  <label className="block text-sm font-semibold text-clay-800 mb-2 flex items-center gap-1"><Home size={14}/>Vermietungsmodell</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { value: 'kaltmiete', label: 'Kaltmiete', desc: 'Mieter zahlt nur Kaltmiete' },
                      { value: 'kaltmiete_nk', label: 'Kaltmiete + NK', desc: 'Mieter zahlt NK-Vorauszahlung' },
                      { value: 'warmmiete', label: 'Warmmiete', desc: 'Inklusivmiete, alles drin' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange('vermietungsmodell', opt.value)}
                        className={`p-2 rounded-lg border-2 text-xs transition-all text-left ${
                          formData.vermietungsmodell === opt.value
                            ? 'border-clay-500 bg-white text-clay-700 font-semibold'
                            : 'border-cream-200 bg-white text-cream-600 hover:border-cream-300'
                        }`}
                      >
                        <div className="font-semibold mb-0.5">{opt.label}</div>
                        <div className="text-cream-400">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  {formData.vermietungsmodell === 'kaltmiete' && (
                    <p className="text-xs text-clay-600 flex items-center gap-1"><ClipboardList size={12}/>Betriebskosten werden via Nebenkostenabrechnung auf Mieter umgelegt (cashflow-neutral)</p>
                  )}
                  {formData.vermietungsmodell === 'kaltmiete_nk' && (
                    <div>
                      <p className="text-xs text-clay-600 mb-2 flex items-center gap-1"><ClipboardList size={12}/>Mieter zahlt NK-Vorauszahlung direkt an dich</p>
                      <label className="block text-xs font-medium text-cream-700 mb-1">NK-Vorauszahlung vom Mieter (€/Monat)</label>
                      <input
                        type="number"
                        value={formData.nebenkostenVomMieter || 0}
                        onChange={(e) => handleChange('nebenkostenVomMieter', numInp(e.target.value))}
                        className="w-full px-3 py-2 border border-clay-300 rounded-lg focus:ring-2 focus:ring-clay-500 text-base sm:text-sm"
                        placeholder="z.B. 200"
                      />
                    </div>
                  )}
                  {formData.vermietungsmodell === 'warmmiete' && (
                    <p className="text-xs text-clay-600 flex items-center gap-1"><ClipboardList size={12}/>Vermieter trägt alle Betriebskosten (Hausgeld, Strom etc.) aus der Warmmiete</p>
                  )}
                </div>
                )}
              </div>
            )}

            {/* GbR Eigentumsstruktur - nur für Kaufimmobilie / MFH */}
            {(formData.immobilienTyp === 'kaufimmobilie' || formData.immobilienTyp === 'mehrfamilienhaus') && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-cream-700">Eigentumsstruktur</h3>

                {/* Toggle Alleineigentümer / GbR */}
                <div className="flex gap-2 mb-4">
                  {[
                    { value: 'allein', label: 'Alleineigentümer', icon: <User size={14}/>, desc: 'Du bist alleiniger Eigentümer' },
                    { value: 'gbr',    label: 'GbR',              icon: <Users size={14}/>, desc: 'Gesellschaft bürgerlichen Rechts' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleChange('eigentumsform', opt.value);
                        if (opt.value === 'allein') {
                          handleChange('userAnteil', 100);
                          handleChange('gbrPartner', []);
                        } else if (formData.eigentumsform === 'allein') {
                          // Beim ersten Wechsel zu GbR: einen leeren Partner vorschlagen
                          handleChange('userAnteil', 50);
                          handleChange('gbrPartner', [{ name: '', anteil: 50 }]);
                        }
                      }}
                      className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                        formData.eigentumsform === opt.value
                          ? 'border-clay-500 bg-clay-50'
                          : 'border-cream-200 bg-white hover:border-cream-300'
                      }`}
                    >
                      <div className={`font-semibold text-sm flex items-center gap-1 ${formData.eigentumsform === opt.value ? 'text-clay-700' : 'text-cream-700'}`}>
                        {opt.icon}{opt.label}
                      </div>
                      <div className="text-xs text-cream-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* GbR Konfiguration */}
                {formData.eigentumsform === 'gbr' && (() => {
                  const gesamtAnteil = (formData.userAnteil ?? 0) + (formData.gbrPartner || []).reduce((s, p) => s + (parseFloat(p.anteil) || 0), 0);
                  const restAnteil = Math.max(0, 100 - gesamtAnteil);
                  const anteilOk = Math.abs(gesamtAnteil - 100) < 0.01;

                  return (
                    <div className="bg-clay-50 rounded-xl p-4 border border-clay-100 space-y-3">
                      <p className="text-xs text-clay-600 font-medium">
                        Gib die Anteile aller Gesellschafter an. Dein Anteil fließt in alle Berechnungen ein.
                      </p>

                      {/* User eigener Anteil */}
                      <div className="bg-white rounded-lg p-3 border border-clay-200 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-cream-800">Ich</span>
                            <span className="text-xs bg-clay-600 text-white px-2 py-0.5 rounded-full font-semibold">Ich</span>
                          </div>
                          <p className="text-xs text-cream-500">Dein persönlicher Anteil</p>
                        </div>
                        <div className="flex items-center gap-1 w-28">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={formData.userAnteil ?? 100}
                            onChange={(e) => handleChange('userAnteil', numInp(e.target.value))}
                            className="w-full px-2 py-1.5 border border-clay-300 rounded-lg text-sm text-right font-semibold focus:ring-2 focus:ring-clay-500"
                          />
                          <span className="text-sm text-cream-500 font-semibold">%</span>
                        </div>
                      </div>

                      {/* Weitere Gesellschafter */}
                      {(formData.gbrPartner || []).map((partner, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-cream-200 flex items-center gap-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={partner.name}
                              onChange={(e) => {
                                const updated = [...formData.gbrPartner];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                handleChange('gbrPartner', updated);
                              }}
                              placeholder={`Gesellschafter ${idx + 1}`}
                              className="w-full px-2 py-1.5 border border-cream-300 rounded-lg text-sm focus:ring-2 focus:ring-clay-400"
                            />
                          </div>
                          <div className="flex items-center gap-1 w-28">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={partner.anteil}
                              onChange={(e) => {
                                const updated = [...formData.gbrPartner];
                                updated[idx] = { ...updated[idx], anteil: numInp(e.target.value) };
                                handleChange('gbrPartner', updated);
                              }}
                              className="w-full px-2 py-1.5 border border-cream-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-clay-400"
                            />
                            <span className="text-sm text-cream-500 font-semibold">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.gbrPartner.filter((_, i) => i !== idx);
                              handleChange('gbrPartner', updated);
                            }}
                            className="text-brick-400 hover:text-brick-600 px-1"
                            title="Gesellschafter entfernen"
                          >
                            <X size={16}/>
                          </button>
                        </div>
                      ))}

                      {/* Partner hinzufügen */}
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('gbrPartner', [
                            ...(formData.gbrPartner || []),
                            { name: '', anteil: Math.max(0, Math.round(restAnteil * 10) / 10) },
                          ]);
                        }}
                        className="w-full py-2 rounded-lg border-2 border-dashed border-clay-300 text-clay-600 text-sm font-semibold hover:bg-clay-100 transition-colors"
                      >
                        + Gesellschafter hinzufügen
                      </button>

                      {/* Summen-Anzeige */}
                      <div className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm font-semibold ${
                        anteilOk ? 'bg-sage-50 text-sage-700 border border-sage-200' : 'bg-honey-50 text-honey-700 border border-honey-200'
                      }`}>
                        <span>Gesamt:</span>
                        <span className="flex items-center gap-1">{anteilOk ? <><Check size={12}/>100 %</> : `${gesamtAnteil.toFixed(1)} % — ${Math.abs(100 - gesamtAnteil).toFixed(1)} % ${gesamtAnteil < 100 ? 'fehlen' : 'zu viel'}`}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Stellplatz - nur für Kauf / MFH */}
            {(formData.immobilienTyp === 'kaufimmobilie' || formData.immobilienTyp === 'mehrfamilienhaus') && (() => {
              const sp = formData.stellplatz || {};
              const updateSp = (updates) => handleChange('stellplatz', { ...sp, ...updates });
              return (
                <div className="bg-cream-50 border border-cream-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-cream-700 flex items-center gap-1"><ParkingCircle size={16}/>Stellplatz</h3>
                    <button
                      type="button"
                      onClick={() => updateSp({ vorhanden: !sp.vorhanden })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sp.vorhanden ? 'bg-clay-600' : 'bg-cream-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sp.vorhanden ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {sp.vorhanden ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-cream-500 mb-1">Typ</label>
                          <select
                            value={sp.typ || 'tiefgarage'}
                            onChange={e => updateSp({ typ: e.target.value })}
                            className="w-full px-2 py-2 border rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-clay-500"
                          >
                            <option value="tiefgarage">Tiefgarage</option>
                            <option value="aussen">Außen</option>
                            <option value="carport">Carport</option>
                            <option value="doppelparker">Doppelparker</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-cream-500 mb-1">Anzahl</label>
                          <input type="number" min={1} max={20}
                            value={sp.anzahl || 1}
                            onChange={e => updateSp({ anzahl: intInp(e.target.value, 1) })}
                            className="w-full px-2 py-2 border rounded-lg text-base sm:text-sm text-right focus:ring-2 focus:ring-clay-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-cream-500 mb-1">Kaufpreis-Anteil (€)</label>
                          <input type="number" min={0} step={1000}
                            value={sp.kaufpreisAnteil || 0}
                            onChange={e => updateSp({ kaufpreisAnteil: numInp(e.target.value) })}
                            className="w-full px-2 py-2 border rounded-lg text-base sm:text-sm text-right focus:ring-2 focus:ring-clay-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-cream-500 mb-1">Miete/SP/Mo (€)</label>
                          <input type="number" min={0} step={5}
                            value={sp.monatlicheMiete || 0}
                            onChange={e => updateSp({ monatlicheMiete: numInp(e.target.value) })}
                            className="w-full px-2 py-2 border rounded-lg text-base sm:text-sm text-right focus:ring-2 focus:ring-clay-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-cream-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!sp.istVermietet}
                          onChange={e => updateSp({ istVermietet: e.target.checked })}
                          className="rounded"
                        />
                        Stellplatz ist vermietet
                      </label>
                    </div>
                  ) : (
                    <p className="text-sm text-cream-400">Kein Stellplatz vorhanden.</p>
                  )}
                </div>
              );
            })()}


            {/* Arbitrage-Daten für Mietimmobilie */}
            {formData.immobilienTyp === 'mietimmobilie' && (
              <div className="bg-clay-50 p-4 rounded-lg border border-clay-200">
                <h3 className="text-lg font-semibold mb-3 text-clay-800 flex items-center gap-1"><ArrowLeftRight size={16}/>Arbitrage-Kalkulation</h3>
                <p className="text-sm text-clay-600 mb-4">
                  Berechne deinen Cashflow aus der Untervermietung an Mitarbeiter oder Gäste (Warmmiete).
                </p>

                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-cream-700 mb-2 flex items-center gap-1"><TrendingDown size={14}/>Deine Mietkosten</h4>
                    <div>
                      <label className="block text-sm font-medium text-cream-700 mb-1">Eigene Warmmiete (€/Monat)</label>
                      <input
                        type="number"
                        value={formData.eigeneWarmmiete}
                        onChange={(e) => handleChange('eigeneWarmmiete', numInp(e.target.value))}
                        className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500"
                        placeholder="z.B. 1500"
                      />
                      <p className="text-xs text-cream-500 mt-1">Die Miete, die du an den Vermieter zahlst (inkl. Nebenkosten)</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-cream-700 mb-2 flex items-center gap-1"><BedDouble size={14}/>Untervermietung</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-cream-700 mb-1">Vermietete Zimmer</label>
                        <input
                          type="number"
                          value={formData.anzahlZimmerVermietet}
                          onChange={(e) => handleChange('anzahlZimmerVermietet', intInp(e.target.value))}
                          className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500"
                          min="0"
                          max={formData.zimmer}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cream-700 mb-1">Miete pro Zimmer (€)</label>
                        <input
                          type="number"
                          value={formData.untermieteProZimmer}
                          onChange={(e) => handleChange('untermieteProZimmer', numInp(e.target.value))}
                          className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500"
                          placeholder="z.B. 600"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-cream-500 mt-1">Warmmiete pro Zimmer, die deine Untermieter zahlen</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-cream-700 mb-2 flex items-center gap-1"><BarChart3 size={14}/>Zusätzliche Kosten (für Steuerberater)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-cream-600 mb-1 flex items-center gap-1"><Zap size={12}/>Strom (€/Mon.)</label>
                        <input
                          type="number"
                          value={formData.arbitrageStrom || 0}
                          onChange={(e) => handleChange('arbitrageStrom', numInp(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-cream-600 mb-1 flex items-center gap-1"><Globe size={12}/>Internet (€/Mon.)</label>
                        <input
                          type="number"
                          value={formData.arbitrageInternet || 0}
                          onChange={(e) => handleChange('arbitrageInternet', numInp(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-cream-600 mb-1 flex items-center gap-1"><Tv size={12}/>GEZ (€/Mon.)</label>
                        <input
                          type="number"
                          value={formData.arbitrageGEZ ?? 18.36}
                          onChange={(e) => handleChange('arbitrageGEZ', numInp(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-500"
                          placeholder="18.36"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-cream-500 mt-2">
                      Summe: {formatCurrency((formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36))}/Monat
                    </p>
                  </div>

                  {/* Vorschau-Berechnung */}
                  <div className="bg-gradient-to-r from-sage-50 to-sage-50 p-4 rounded-lg border border-sage-200">
                    <h4 className="text-sm font-semibold text-sage-800 mb-3 flex items-center gap-1"><TrendingUp size={14}/>Cashflow-Vorschau</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-cream-600">Einnahmen ({formData.anzahlZimmerVermietet || 0} × {formatCurrency(formData.untermieteProZimmer || 0)}):</span>
                        <span className="font-semibold text-sage-600">+{formatCurrency((formData.anzahlZimmerVermietet || 0) * (formData.untermieteProZimmer || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cream-600">Eigene Miete:</span>
                        <span className="font-semibold text-brick-600">-{formatCurrency(formData.eigeneWarmmiete || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cream-600">Strom / Internet / GEZ:</span>
                        <span className="font-semibold text-brick-600">-{formatCurrency((formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36))}</span>
                      </div>
                      <div className="border-t border-sage-300 pt-2 mt-2">
                        <div className="flex justify-between text-base">
                          <span className="font-semibold text-cream-700">Monatlicher Cashflow:</span>
                          {(() => {
                            const einnahmen = (formData.anzahlZimmerVermietet || 0) * (formData.untermieteProZimmer || 0);
                            const zusatzkosten = (formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36);
                            const ausgaben = (formData.eigeneWarmmiete || 0) + zusatzkosten;
                            const cashflow = einnahmen - ausgaben;
                            return (
                              <span className={`font-bold ${cashflow >= 0 ? 'text-sage-600' : 'text-brick-600'}`}>
                                {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-cream-500">Jährlicher Cashflow:</span>
                          {(() => {
                            const einnahmen = (formData.anzahlZimmerVermietet || 0) * (formData.untermieteProZimmer || 0);
                            const zusatzkosten = (formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36);
                            const ausgaben = (formData.eigeneWarmmiete || 0) + zusatzkosten;
                            const cashflow = (einnahmen - ausgaben) * 12;
                            return (
                              <span className={`font-semibold ${cashflow >= 0 ? 'text-sage-600' : 'text-brick-600'}`}>
                                {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Ende Erweiterte Details ─────────────────────────────────── */}
            {showDetails && (
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="w-full py-2 text-xs text-cream-400 hover:text-cream-600 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronUp size={14}/> Erweiterte Details ausblenden
              </button>
            )}
            </>)}
          </div>
        </div>
        )}

        <div className="p-6 border-t border-cream-200 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-cream-700 bg-cream-100 rounded-lg hover:bg-cream-200"
            >
              Abbrechen
            </button>
            <button
              onClick={async () => {
                // Finanzierungskonditionen in erste Phase übertragen (Feldnamen müssen zur Finanzierungstab-Logik passen)
                const erstePhase = {
                  id: 1,
                  name: 'Erstfinanzierung',
                  darlehensTyp: 'annuitaet',
                  sollzinssatz: toN(formData.zinssatz, 4.0),
                  anfangstilgung: toN(formData.tilgung, 2.0),
                  zinsbindung: toN(formData.zinsbindung, 10),
                  monatlicherBetrag: formData.finanzierungsModus === 'festRate'
                    ? (formData.monatlicherBetrag === '' || formData.monatlicherBetrag == null ? null : toN(formData.monatlicherBetrag, null))
                    : null,
                  monatlicheTilgung: null,
                  tilgungssatz: 2.0,
                  laufzeit: 10,
                  sondertilgungJaehrlich: 0,
                  restschuldOverride: null,
                  aktiv: true,
                };
                // MFH: Kaltmiete, Fläche und Zimmeranzahl automatisch aus Wohnungen ableiten
                const mfhAggregat = formData.immobilienTyp === 'mehrfamilienhaus' ? {
                  kaltmiete: (formData.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0),
                  wohnflaeche: (formData.wohnungen || []).reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0),
                  zimmer: (formData.wohnungen || []).length,
                  objektart: 'mehrfamilienhaus',
                } : {};
                // 100 % Eigenkapital: kein Kredit — Eigenkapital = Kaufpreis
                const ekAggregat = (formData.vollEigenfinanziert && !formData.geschenkt) ? {
                  eigenkapital: formData.kaufpreis,
                } : {};
                // Numerische Felder normalisieren: '' → Fallback-Zahl
                const datenZumSpeichern = {
                  ...formData,
                  kaufpreis:              toN(formData.kaufpreis),
                  eigenkapital:           toN(formData.eigenkapital),
                  kaltmiete:              toN(formData.kaltmiete),
                  nebenkostenVomMieter:   toN(formData.nebenkostenVomMieter),
                  zinssatz:               toN(formData.zinssatz, 4.0),
                  tilgung:                toN(formData.tilgung, 2.0),
                  laufzeit:               toN(formData.laufzeit, 25),
                  zinsbindung:            toN(formData.zinsbindung, 10),
                  wohnflaeche:            toN(formData.wohnflaeche),
                  grundstueck:            toN(formData.grundstueck),
                  zimmer:                 toN(formData.zimmer),
                  baujahr:                toN(formData.baujahr, 2000),
                  stockwerk:              toN(formData.stockwerk),
                  geschaetzterWert:       toN(formData.geschaetzterWert),
                  userAnteil:             toN(formData.userAnteil, 100),
                  eigeneWarmmiete:        toN(formData.eigeneWarmmiete),
                  anzahlZimmerVermietet:  toN(formData.anzahlZimmerVermietet),
                  untermieteProZimmer:    toN(formData.untermieteProZimmer),
                  arbitrageStrom:         toN(formData.arbitrageStrom),
                  arbitrageInternet:      toN(formData.arbitrageInternet),
                  arbitrageGEZ:           toN(formData.arbitrageGEZ, 18.36),
                  gbrPartner: (formData.gbrPartner || []).map(p => ({ ...p, anteil: toN(p.anteil) })),
                  stellplatz: formData.stellplatz ? {
                    ...formData.stellplatz,
                    kaufpreisAnteil:   toN(formData.stellplatz.kaufpreisAnteil),
                    monatlicheMiete:   toN(formData.stellplatz.monatlicheMiete),
                    anzahl:            toN(formData.stellplatz.anzahl, 1),
                  } : formData.stellplatz,
                  kreditLaeuftBereits: !!formData.kreditLaeuftBereits,
                  aktuelleRestschuld: toN(formData.aktuelleRestschuld),
                  kreditMonatsrate:   toN(formData.kreditMonatsrate),
                  zinsbindungBis:     formData.zinsbindungBis ? parseInt(formData.zinsbindungBis) : null,
                  ...mfhAggregat,
                  ...ekAggregat,
                  finanzierungsphasen: [erstePhase],
                  wohnungen: (formData.wohnungen || []).map(w => ({
                    ...w,
                    wohnflaeche: toN(w.wohnflaeche),
                    kaltmiete:   toN(w.kaltmiete),
                  })),
                };

                if (formModus === 'schnell' && !initialData) {
                  // Schnellstart: Speichern, dann Nachfrage-Dialog zeigen
                  const saved = await onSave(datenZumSpeichern);
                  if (saved) setGespeicherteImmo(saved);
                } else {
                  // Expertenansicht oder Bearbeiten: direkt speichern + schließen
                  await onSave(datenZumSpeichern);
                  onClose();
                }
              }}
              className="px-4 py-2 text-white bg-clay-600 rounded-lg hover:bg-clay-700"
            >
              {formModus === 'schnell' && !initialData ? 'Speichern →' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>

      {/* Nachfrage nach Schnellstart-Speichern */}
      {gespeicherteImmo && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-sage-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-center text-cream-900 mb-1">
              Immobilie gespeichert!
            </h3>
            {(() => {
              // Sofortiges Ergebnis zeigen statt nur die Speicherung zu bestätigen —
              // das eigentliche "Aha" ist ja die berechnete Rendite/der Cashflow.
              const immo = gespeicherteImmo;
              if (immo.immobilienTyp === 'mietimmobilie') {
                const cf = berechneMtlCashflow(immo);
                return (
                  <div className="flex justify-center mb-4 mt-3">
                    <div className="bg-cream-50 rounded-xl px-6 py-3 text-center">
                      <div className="text-[10px] font-semibold text-cream-400 uppercase tracking-wide">Cashflow/Monat</div>
                      <div className={`text-xl font-black ${cf >= 0 ? 'text-sage-600' : 'text-brick-600'}`}>{cf >= 0 ? '+' : ''}{formatCurrency(cf)}</div>
                    </div>
                  </div>
                );
              }
              const gesamtMiete = immo.immobilienTyp === 'mehrfamilienhaus'
                ? (immo.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0)
                : (immo.kaltmiete || 0);
              if (!immo.kaufpreis || !gesamtMiete) return null;
              const ergebnis = berechneRendite({ ...immo, kaltmiete: gesamtMiete });
              const cashflow = berechneMtlCashflow({ ...immo, kaltmiete: gesamtMiete });
              return (
                <div className="flex justify-center gap-3 mb-4 mt-3">
                  <div className="bg-cream-50 rounded-xl px-4 py-3 text-center flex-1">
                    <div className="text-[10px] font-semibold text-cream-400 uppercase tracking-wide">Bruttorendite</div>
                    <div className="text-xl font-black text-sage-600">{formatPercent(ergebnis.bruttorendite)}</div>
                  </div>
                  <div className="bg-cream-50 rounded-xl px-4 py-3 text-center flex-1">
                    <div className="text-[10px] font-semibold text-cream-400 uppercase tracking-wide">Cashflow/Monat</div>
                    <div className={`text-xl font-black ${cashflow >= 0 ? 'text-sage-600' : 'text-brick-600'}`}>{cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}</div>
                  </div>
                </div>
              );
            })()}
            <p className="text-sm text-cream-500 text-center mb-6">
              Details ergänzen für noch genauere Werte — Objektdaten, Eigentumsstruktur, Stellplatz und mehr?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const immo = gespeicherteImmo;
                  setGespeicherteImmo(null);
                  onOpenDetail?.(immo);
                }}
                className="w-full py-3 bg-clay-600 hover:bg-clay-700 text-white rounded-xl font-semibold transition-colors"
              >
                Ja, Details ergänzen
              </button>
              <button
                onClick={() => {
                  setGespeicherteImmo(null);
                  onClose();
                }}
                className="w-full py-3 bg-cream-100 hover:bg-cream-200 text-cream-700 rounded-xl font-semibold transition-colors"
              >
                Nein, zur Übersicht
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Immobilien-Karte Komponente

export default ImmobilienFormular;
