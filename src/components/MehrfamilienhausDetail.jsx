import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';
import { berechneRendite } from '../utils/berechnung.js';
import {
  Building2, BarChart3, Key, Wallet, MapPin, Pencil, X, Check,
  CheckCircle2, AlertTriangle, User, Trash2, Lightbulb, Circle,
} from 'lucide-react';

// Manche targetTabs aus VermieterTodos existieren im MFH nicht → auf nächstbestes mappen
const MFH_TAB_MAP = { mieter: 'gebaeude', mieteinnahmen: 'uebersicht', nkabrechnung: 'uebersicht' };

const MehrfamilienhausDetail = ({ immobilie, onClose, onEdit, onSave, initialTab }) => {
  const [activeTab, setActiveTab] = useState(() => initialTab ? (MFH_TAB_MAP[initialTab] ?? initialTab) : 'gebaeude');
  const [wohnungen, setWohnungen] = useState(immobilie.wohnungen || []);
  const [showWohnungForm, setShowWohnungForm] = useState(false);
  const [editWohnungIdx, setEditWohnungIdx] = useState(null);
  const [wohnungForm, setWohnungForm] = useState({ name: '', etage: '', wohnflaeche: 0, kaltmiete: 0, mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: 0, kautionBezahlt: false });
  const [hasChanges, setHasChanges] = useState(false);

  // Aggregierte Werte
  const gesamtKaltmiete = wohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
  const gesamtFlaeche = wohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
  const belegtWE = wohnungen.filter(w => w.mieterName && !w.mietende).length;
  const leerstandWE = wohnungen.length - belegtWE;
  const auslastung = wohnungen.length > 0 ? Math.round(belegtWE / wohnungen.length * 100) : 0;
  const kautionOffenAnzahl = wohnungen.filter(w => w.kautionBetrag > 0 && !w.kautionBezahlt).length;

  // Aggregiert kaltmiete/wohnflaeche/zimmer aus Wohnungen für konsistente DB-Daten
  const aggregiereUndSpeichere = (neueWohnungen) => {
    const kaltmiete = neueWohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
    const wohnflaeche = neueWohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
    const zimmer = neueWohnungen.length;
    onSave({ ...immobilie, wohnungen: neueWohnungen, kaltmiete, wohnflaeche, zimmer });
  };

  const saveWohnung = () => {
    const neu = [...wohnungen];
    if (editWohnungIdx !== null) neu[editWohnungIdx] = { ...neu[editWohnungIdx], ...wohnungForm };
    else neu.push({ id: Date.now(), forderungen: [], mietAnpassungen: [], ...wohnungForm });
    setWohnungen(neu);
    setShowWohnungForm(false);
    setHasChanges(false);
    // Auto-Save: sofort persistieren, kein manueller Speichern-Button nötig
    aggregiereUndSpeichere(neu);
  };

  const deleteWohnung = (idx) => {
    if (!confirm('Wohnung wirklich löschen?')) return;
    const neu = wohnungen.filter((_, i) => i !== idx);
    setWohnungen(neu);
    setHasChanges(false);
    // Auto-Save: sofort persistieren
    aggregiereUndSpeichere(neu);
  };

  const openWohnungForm = (idx = null) => {
    setEditWohnungIdx(idx);
    setWohnungForm(idx !== null ? { ...wohnungen[idx] } : { name: '', etage: '', wohnflaeche: 0, kaltmiete: 0, mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: 0, kautionBezahlt: false });
    setShowWohnungForm(true);
  };

  const handleSave = () => {
    aggregiereUndSpeichere(wohnungen);
    setHasChanges(false);
  };

  // Wohnungen nach Etage sortieren
  const etageOrder = (e) => {
    if (!e) return 999;
    const map = { 'dg': -1, 'dachgeschoss': -1 };
    const lower = e.toLowerCase();
    if (map[lower] !== undefined) return map[lower];
    const match = lower.match(/(\d+)/);
    if (match) return parseInt(match[1]);
    if (lower.includes('eg') || lower.includes('erdgeschoss')) return 0;
    return 998;
  };
  const sortiertNachEtage = [...wohnungen]
    .map((w, idx) => ({ ...w, originalIdx: idx }))
    .sort((a, b) => etageOrder(b.etage) - etageOrder(a.etage)); // höchste Etage oben

  // Etagen-Gruppen
  const etageGruppen = sortiertNachEtage.reduce((acc, w) => {
    const key = w.etage || 'Ohne Etagenangabe';
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  const belegungFarbe = (w) => {
    if (!w.mieterName) return 'border-red-200 bg-red-50';
    if (w.mietende && new Date(w.mietende) < new Date()) return 'border-gray-200 bg-gray-50';
    return 'border-emerald-200 bg-emerald-50';
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-5xl h-[93vh] sm:h-[95vh] flex flex-col overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-4 sm:px-5 pt-3 sm:pt-5 pb-4 text-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Building2 size={22}/>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">MFH · {wohnungen.length} WE</span>
                {kautionOffenAnzahl > 0 && (
                  <span className="text-xs font-semibold bg-red-500/80 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-300"/> {kautionOffenAnzahl}× Kaution offen</span>
                )}
              </div>
              <h2 className="text-base sm:text-xl font-black truncate">{immobilie.name}</h2>
              {immobilie.adresse && <p className="text-sm text-white/80 mt-0.5 flex items-center gap-1"><MapPin size={12}/> {immobilie.adresse}</p>}
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {onEdit && (
                <button onClick={onEdit}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl text-sm font-semibold transition-colors"
                  title="Stammdaten bearbeiten">
                  <Pencil size={14} className="inline mr-1"/>Bearbeiten
                </button>
              )}
              {hasChanges && (
                <button onClick={handleSave} className="px-3 py-1.5 bg-white text-amber-700 rounded-xl text-xs font-bold shadow-sm">
                  Speichern
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"><X size={20}/></button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
            <div className="bg-white/20 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-white/70">Kaltmiete gesamt</p>
              <p className="text-sm sm:text-lg font-black">{formatCurrency(gesamtKaltmiete)}/mo</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-white/70">Gesamtfläche</p>
              <p className="text-sm sm:text-lg font-black">{gesamtFlaeche} m²</p>
            </div>
            <div className={`${auslastung < 80 ? 'bg-red-400/30' : 'bg-white/20'} rounded-xl p-2 sm:p-3 text-center`}>
              <p className="text-[10px] sm:text-xs text-white/70">Auslastung</p>
              <p className="text-sm sm:text-lg font-black">{auslastung} %</p>
              <p className="text-[10px] text-white/60">{belegtWE}/{wohnungen.length} WE</p>
            </div>
            <div className={`${leerstandWE > 0 ? 'bg-red-400/30' : 'bg-white/20'} rounded-xl p-2 sm:p-3 text-center`}>
              <p className="text-[10px] sm:text-xs text-white/70">Leerstand</p>
              <p className="text-sm sm:text-lg font-black">{leerstandWE} WE</p>
              <p className="text-[10px] text-white/60">−{formatCurrency(wohnungen.filter(w => !w.mieterName).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0))}/mo</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 flex-shrink-0 overflow-x-auto">
          {[
            { id: 'gebaeude',   icon: <Building2 size={13}/>, label: 'Gebäude' },
            { id: 'uebersicht', icon: <BarChart3 size={13}/>, label: 'Übersicht' },
            { id: 'kaution',    icon: <Key size={13}/>, label: `Kaution${kautionOffenAnzahl > 0 ? ` (${kautionOffenAnzahl})` : ''}` },
            { id: 'cashflow',   icon: <Wallet size={13}/>, label: 'Cashflow' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap min-w-max ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              <span className="flex items-center justify-center gap-1">{tab.icon}{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">

          {/* ── GEBÄUDE TAB ─────────────────────────────────────────────────────── */}
          {activeTab === 'gebaeude' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Wohneinheiten nach Etage</p>
                <button onClick={() => openWohnungForm()}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                  + Wohnung
                </button>
              </div>

              {wohnungen.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <Building2 size={48} className="mx-auto mb-3 text-gray-300"/>
                  <p className="text-base font-semibold">Noch keine Wohneinheiten</p>
                  <p className="text-sm mt-1">Füge deine Wohneinheiten hinzu</p>
                  <button onClick={() => openWohnungForm()}
                    className="mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600">
                    + Erste Wohnung anlegen
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Gebäudevisualisierung — Etagen von oben nach unten */}
                  {Object.entries(etageGruppen).map(([etage, wes]) => (
                    <div key={etage}>
                      {/* Etagen-Trennlinie */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {etage}
                        </span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>

                      {/* WEs dieser Etage */}
                      <div className={`grid gap-3 ${wes.length === 1 ? 'grid-cols-1' : wes.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        {wes.map((w) => {
                          const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date());
                          const ausgezogen = w.mietende && new Date(w.mietende) < new Date();
                          return (
                            <div key={w.id || w.originalIdx}
                              className={`rounded-2xl border-2 p-3 sm:p-4 transition-all hover:shadow-md cursor-pointer ${belegt ? 'border-emerald-200 bg-emerald-50/50' : ausgezogen ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50/50'}`}
                              onClick={() => openWohnungForm(w.originalIdx)}>

                              {/* Status-Badge */}
                              <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${belegt ? 'bg-emerald-100 text-emerald-700' : ausgezogen ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'}`}>
                                  {belegt ? <span className='flex items-center gap-0.5'><Check size={10}/>Vermietet</span> : ausgezogen ? 'Ausgezogen' : <span className='flex items-center gap-0.5'><AlertTriangle size={10}/>Leerstand</span>}
                                </span>
                                <button
                                  onClick={e => { e.stopPropagation(); deleteWohnung(w.originalIdx); }}
                                  className="text-gray-300 hover:text-red-500 text-xs p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Löschen"><X size={12}/></button>
                              </div>

                              {/* WE-Name + Größe */}
                              <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{w.name || `WE ${w.originalIdx + 1}`}</p>
                              {w.wohnflaeche > 0 && <p className="text-xs text-gray-400 mt-0.5">{w.wohnflaeche} m²</p>}

                              {/* Miete */}
                              <p className={`text-base sm:text-xl font-black mt-2 ${belegt ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {belegt ? formatCurrency(Number(w.kaltmiete) || 0) : '—'}
                                {belegt && <span className="text-xs font-normal text-gray-400">/mo</span>}
                              </p>

                              {/* Mieter */}
                              {w.mieterName && (
                                <p className="text-xs text-gray-600 mt-1 truncate flex items-center gap-1"><User size={10}/> {w.mieterName}</p>
                              )}
                              {w.mietbeginn && belegt && (
                                <p className="text-[10px] text-gray-400">seit {new Date(w.mietbeginn).toLocaleDateString('de-DE')}</p>
                              )}

                              {/* Kaution */}
                              {w.kautionBetrag > 0 && (
                                <span className={`mt-2 inline-block text-[10px] px-1.5 py-0.5 rounded-full ${w.kautionBezahlt ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                  {w.kautionBezahlt ? <CheckCircle2 size={12} className='text-emerald-600 inline mr-0.5'/> : <span className='inline-block w-2 h-2 rounded-full bg-red-500 mr-0.5'/>} Kaution {formatCurrency(w.kautionBetrag)}
                                </span>
                              )}

                              {/* Bearbeiten */}
                              <div className="mt-2 pt-2 border-t border-current border-opacity-10 flex justify-between items-center">
                                <span className="text-[10px] text-gray-400">Klicken zum Bearbeiten</span>
                                <Pencil size={12} className="text-gray-300"/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ÜBERSICHT TAB ───────────────────────────────────────────────────── */}
          {activeTab === 'uebersicht' && (
            <div className="space-y-4">
              {/* Auslastungsbalken */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Belegungsübersicht</p>
                <div className="flex rounded-full overflow-hidden h-4 mb-3">
                  <div style={{ width: `${auslastung}%` }} className="bg-emerald-500 transition-all" />
                  <div style={{ width: `${100 - auslastung}%` }} className="bg-red-200 transition-all" />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5"><Check size={12}/> {belegtWE} belegt</span>
                  <span className="text-red-500 font-semibold flex items-center gap-0.5"><AlertTriangle size={12}/> {leerstandWE} leer</span>
                </div>
              </div>

              {/* Wohnungsliste als Tabelle */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alle Wohneinheiten</p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-2 px-4 text-gray-400 font-semibold">Wohnung</th>
                      <th className="text-right py-2 px-2 text-gray-400 font-semibold hidden sm:table-cell">m²</th>
                      <th className="text-right py-2 px-2 text-gray-400 font-semibold">Miete</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-semibold">Mieter</th>
                      <th className="text-center py-2 px-2 text-gray-400 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {wohnungen.map((w, idx) => {
                      const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date());
                      return (
                        <tr key={w.id || idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => openWohnungForm(idx)}>
                          <td className="py-2 px-4">
                            <span className="font-semibold text-gray-800">{w.name || `WE ${idx + 1}`}</span>
                            {w.etage && <span className="text-gray-400 ml-1">· {w.etage}</span>}
                          </td>
                          <td className="py-2 px-2 text-right text-gray-500 hidden sm:table-cell">{w.wohnflaeche > 0 ? `${w.wohnflaeche} m²` : '—'}</td>
                          <td className={`py-2 px-2 text-right font-bold ${belegt ? 'text-emerald-600' : 'text-gray-300'}`}>
                            {belegt ? formatCurrency(Number(w.kaltmiete) || 0) : '—'}
                          </td>
                          <td className="py-2 px-3 text-gray-600 truncate max-w-[120px]">{w.mieterName || <span className="text-red-400">Kein Mieter</span>}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${belegt ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {belegt ? <Check size={12}/> : <Circle size={12}/>}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="py-2 px-4 font-bold text-gray-700">Gesamt ({wohnungen.length} WE)</td>
                      <td className="py-2 px-2 text-right font-semibold text-gray-600 hidden sm:table-cell">{gesamtFlaeche} m²</td>
                      <td className="py-2 px-2 text-right font-black text-emerald-700">{formatCurrency(gesamtKaltmiete)}</td>
                      <td colSpan={2} className="py-2 px-2 text-right text-xs text-gray-400">{auslastung} % Auslastung</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Finanzielle KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">Soll-Miete (100 %)</p>
                  <p className="text-xl font-black text-gray-800">{formatCurrency(wohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0))}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(wohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0) * 12)}/Jahr</p>
                </div>
                <div className={`border rounded-xl p-4 shadow-sm ${leerstandWE > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-xs text-gray-400 mb-1">Mietausfall (Leerstand)</p>
                  <p className={`text-xl font-black ${leerstandWE > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {leerstandWE > 0 ? '−' : ''}{formatCurrency(wohnungen.filter(w => !w.mieterName).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-400">{leerstandWE} WE leer</p>
                </div>
              </div>
            </div>
          )}

          {/* ── KAUTION TAB ─────────────────────────────────────────────────────── */}
          {activeTab === 'kaution' && (
            <div className="space-y-3">
              {wohnungen.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Erst Wohnungen anlegen, dann Kaution verwalten.</p>
              )}
              {wohnungen.map((w, idx) => {
                const kStatus = !w.kautionBetrag ? 'keine' : w.kautionBezahlt ? 'bezahlt' : 'offen';
                return (
                  <div key={w.id || idx} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{w.name || `WE ${idx + 1}`}</p>
                      <p className="text-sm text-gray-500">{w.mieterName || <span className="text-red-400">Kein Mieter</span>}</p>
                    </div>
                    <div className="text-right">
                      {kStatus === 'keine' && <span className="text-xs text-gray-400">Keine Kaution</span>}
                      {kStatus === 'offen' && <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full"><span className='inline-block w-2 h-2 rounded-full bg-red-500 mr-1'/>{Number(w.kautionBetrag).toLocaleString('de-DE')} € offen</span>}
                      {kStatus === 'bezahlt' && <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full"><CheckCircle2 size={12} className='text-emerald-700 inline mr-0.5'/>{Number(w.kautionBetrag).toLocaleString('de-DE')} € bezahlt</span>}
                    </div>
                  </div>
                );
              })}
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 border border-amber-100">
                <Lightbulb size={14} className="inline mr-1"/> Kaution je Wohnung bearbeiten: Gebäude-Tab → Wohnung anklicken
              </div>
            </div>
          )}

          {/* ── CASHFLOW TAB ────────────────────────────────────────────────────── */}
          {activeTab === 'cashflow' && (
            <div className="space-y-4">
              {(() => {
                const ergebnis = berechneRendite({ ...immobilie, kaltmiete: gesamtKaltmiete });
                const kreditrate = ergebnis.monatlicheRate || 0;
                const instandhaltung = immobilie.instandhaltung || 0;
                const verwaltung = immobilie.verwaltung || 0;
                const hausgeld = immobilie.hausgeld || 0;
                const kosten = instandhaltung + verwaltung + hausgeld + kreditrate;
                const cashflow = gesamtKaltmiete - kosten;
                const leerstandKosten = wohnungen.filter(w => !w.mieterName).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);

                return (
                  <>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Monatlicher Cashflow (alle WE)</p>
                      </div>
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-50 text-sm">
                          <tr>
                            <td className="py-3 px-4 text-gray-600">+ Kaltmiete (IST — {belegtWE} WE belegt)</td>
                            <td className="py-3 px-4 text-right font-semibold text-emerald-600">+{formatCurrency(gesamtKaltmiete)}</td>
                          </tr>
                          {leerstandKosten > 0 && (
                            <tr className="bg-red-50/50">
                              <td className="py-3 px-4 text-red-500"><Circle size={10} className="inline mr-1"/> Mietausfall Leerstand ({leerstandWE} WE)</td>
                              <td className="py-3 px-4 text-right font-semibold text-red-500">−{formatCurrency(leerstandKosten)}</td>
                            </tr>
                          )}
                          {instandhaltung > 0 && <tr><td className="py-2 px-4 text-gray-500">− Instandhaltung</td><td className="py-2 px-4 text-right text-red-500">−{formatCurrency(instandhaltung)}</td></tr>}
                          {verwaltung > 0 && <tr><td className="py-2 px-4 text-gray-500">− Verwaltung</td><td className="py-2 px-4 text-right text-red-500">−{formatCurrency(verwaltung)}</td></tr>}
                          {hausgeld > 0 && <tr><td className="py-2 px-4 text-gray-500">− Hausgeld</td><td className="py-2 px-4 text-right text-red-500">−{formatCurrency(hausgeld)}</td></tr>}
                          {kreditrate > 0 && <tr><td className="py-2 px-4 text-gray-500">− Kreditrate</td><td className="py-2 px-4 text-right text-red-500">−{formatCurrency(kreditrate)}</td></tr>}
                          <tr className={`border-t-2 ${cashflow >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <td className={`py-3 px-4 font-black text-base ${cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>= Netto-Cashflow</td>
                            <td className={`py-3 px-4 text-right font-black text-lg ${cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}/mo
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[['Monat', cashflow], ['Jahr', cashflow * 12], ['10 Jahre', cashflow * 120]].map(([label, val]) => (
                        <div key={label} className={`rounded-xl p-3 text-center border ${val >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                          <p className="text-xs text-gray-400 mb-1">{label}</p>
                          <p className={`text-base font-black ${val >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {val >= 0 ? '+' : ''}{formatCurrency(val)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Wohnung Form Modal */}
      {showWohnungForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4">
          <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-xl sm:max-w-md max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
              <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editWohnungIdx !== null ? <><Pencil size={16} className="inline mr-1"/>{wohnungen[editWohnungIdx]?.name || 'Wohnung'} bearbeiten</> : '+ Wohnung hinzufügen'}
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Bezeichnung</label>
                    <input value={wohnungForm.name} onChange={e => setWohnungForm({...wohnungForm, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" placeholder="z.B. WE 1, EG links" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Etage</label>
                    <input value={wohnungForm.etage || ''} onChange={e => setWohnungForm({...wohnungForm, etage: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" placeholder="z.B. EG, 1. OG, DG" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Wohnfläche (m²)</label>
                    <input type="number" value={wohnungForm.wohnflaeche} onChange={e => setWohnungForm({...wohnungForm, wohnflaeche: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kaltmiete (€/mo)</label>
                    <input type="number" value={wohnungForm.kaltmiete} onChange={e => setWohnungForm({...wohnungForm, kaltmiete: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mieter/in</label>
                  <input value={wohnungForm.mieterName} onChange={e => setWohnungForm({...wohnungForm, mieterName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" placeholder="Name des Mieters" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mietbeginn</label>
                    <input type="date" value={wohnungForm.mietbeginn} onChange={e => setWohnungForm({...wohnungForm, mietbeginn: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mietende</label>
                    <input type="date" value={wohnungForm.mietende} onChange={e => setWohnungForm({...wohnungForm, mietende: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" />
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1"><Key size={12}/> Kaution</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Betrag (€)</label>
                      <input type="number" value={wohnungForm.kautionBetrag} onChange={e => setWohnungForm({...wohnungForm, kautionBetrag: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right" />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={wohnungForm.kautionBezahlt} onChange={e => setWohnungForm({...wohnungForm, kautionBezahlt: e.target.checked})} className="w-4 h-4 rounded accent-emerald-500" />
                        <span className="text-sm text-gray-700">Bezahlt</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowWohnungForm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-semibold">Abbrechen</button>
              {editWohnungIdx !== null && (
                <button onClick={() => { deleteWohnung(editWohnungIdx); setShowWohnungForm(false); }}
                  className="py-3 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100"><Trash2 size={16}/></button>
              )}
              <button onClick={saveWohnung} className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MehrfamilienhausDetail;
