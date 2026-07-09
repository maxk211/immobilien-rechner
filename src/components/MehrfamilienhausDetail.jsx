import { useState, useMemo } from 'react';
import { TabErrorBoundary } from './ErrorBoundary';
import { formatCurrency } from '../utils/format.js';
import { berechneRendite } from '../utils/berechnung.js';
import CashflowUebersicht from './CashflowUebersicht';
import BausparManager from './BausparManager';
import Steuerberechnung from './Steuerberechnung';
import ReparaturenInvestitionen from './ReparaturenInvestitionen';
import ZaehlerVerwaltung from './ZaehlerVerwaltung';
import MieteinnahmenTracker from './MieteinnahmenTracker';
import NKAbrechnungTab from './NKAbrechnungTab';
import MieterDashboard from './MieterDashboard';
import MietKostenManager from './MietKostenManager';
import KaufnebenkostenManager from './KaufnebenkostenManager';
import { uploadDokument, deleteDokument, getDokumentUrl } from '../supabaseClient';
import {
  Building2, BarChart3, Wallet, Users, Wrench, MapPin, Pencil, X, Check,
  CheckCircle2, AlertTriangle, User, FileText, Key, Plus, Lightbulb,
  Landmark, CalendarDays, Circle, Trash2, Upload, Download, Loader2,
} from 'lucide-react';

// ─── Dokumente-Tab (inline, identisch zu KaufimmobilieDetail) ─────────────────
const DOK_TYPEN = ['Kaufvertrag', 'Mietvertrag', 'NK-Abrechnung', 'Grundriss', 'Energieausweis', 'Versicherung', 'Handwerker-Rechnung', 'Fotos', 'Sonstiges'];

const DokumenteTab = ({ immobilie, dokumente, onDokumentUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadFehler, setUploadFehler] = useState('');
  const [gewaehltTyp, setGewaehltTyp] = useState('Sonstiges');
  const [dragOver, setDragOver] = useState(false);
  const [ladeId, setLadeId] = useState(null);

  const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploadFehler('');
    setUploading(true);
    try {
      const neueDokumente = [];
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) { setUploadFehler(`"${file.name}" ist zu groß (max. 20 MB)`); continue; }
        const meta = await uploadDokument(immobilie.id, file, gewaehltTyp);
        neueDokumente.push(meta);
      }
      if (neueDokumente.length > 0) onDokumentUpdate([...dokumente, ...neueDokumente]);
    } catch (e) {
      setUploadFehler(`Upload fehlgeschlagen: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    setLadeId(doc.id);
    try {
      const url = await getDokumentUrl(doc.path);
      if (url) window.open(url, '_blank');
      else alert('Dokument nicht mehr verfügbar.');
    } catch (e) { alert(`Fehler: ${e.message}`); } finally { setLadeId(null); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`"${doc.name}" wirklich löschen?`)) return;
    try {
      await deleteDokument(doc.path);
      onDokumentUpdate(dokumente.filter(d => d.id !== doc.id));
    } catch (e) { alert(`Löschen fehlgeschlagen: ${e.message}`); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5"><FileText size={16}/> Dokumente</h3>
          <p className="text-xs text-slate-500 mt-0.5">Verträge, Abrechnungen & Unterlagen zum Gebäude</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-semibold">{dokumente.length} Datei{dokumente.length !== 1 ? 'en' : ''}</span>
      </div>
      <div className="bg-white border-2 border-dashed rounded-xl p-5 space-y-3 transition-colors"
        style={{ borderColor: dragOver ? '#f59e0b' : '#cbd5e1', background: dragOver ? '#fffbeb' : undefined }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}>
        <div className="flex flex-wrap gap-1.5">
          {DOK_TYPEN.map(t => (
            <button key={t} onClick={() => setGewaehltTyp(t)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${gewaehltTyp === t ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t}
            </button>
          ))}
        </div>
        <label className={`flex items-center justify-center gap-3 py-4 rounded-xl cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-amber-50'}`}>
          <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          {uploading ? <Loader2 size={20} className="animate-spin text-amber-600"/> : <Upload size={20} className="text-amber-500"/>}
          <span className="text-sm font-semibold text-slate-600">
            {uploading ? 'Wird hochgeladen…' : 'Datei auswählen oder hierher ziehen'}
          </span>
        </label>
        {uploadFehler && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12}/>{uploadFehler}</p>}
      </div>
      {dokumente.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <FileText size={40} className="mx-auto mb-2 text-slate-300"/>
          <p className="text-sm">Noch keine Dokumente hochgeladen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dokumente.map(doc => (
            <div key={doc.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-amber-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400">{doc.typ} · {formatBytes(doc.size)} · {doc.datum ? new Date(doc.datum).toLocaleDateString('de-DE') : '—'}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleDownload(doc)} disabled={ladeId === doc.id}
                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Herunterladen">
                  {ladeId === doc.id ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                </button>
                <button onClick={() => handleDelete(doc)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Löschen">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Tab-Mapping: externe initialTab-Werte → interne Tab-IDs ────────────────
const MFH_TAB_MAP = {
  mieter: 'mieter', mieteinnahmen: 'mieteinnahmen', nkabrechnung: 'nkabrechnung',
  kaution: 'kaution', cashflow: 'cashflow', investitionen: 'investitionen',
  zaehler: 'zaehler', dokumente: 'dokumente', steuern: 'steuern', bauspar: 'bauspar',
  finanzierung: 'finanzierung', uebersicht: 'uebersicht',
};

// ─── MehrfamilienhausDetail ───────────────────────────────────────────────────
const MehrfamilienhausDetail = ({
  immobilie, onClose, onEdit, onSave, initialTab,
  mieterListe = [], onSaveMieter, onDeleteMieter,
  nkAbrechnungen = [], onSaveNK, onDeleteNK,
  portfolio = [],
}) => {
  const [activeTab, setActiveTab] = useState(() =>
    initialTab ? (MFH_TAB_MAP[initialTab] ?? initialTab) : 'wohnungen'
  );
  const [params, setParams] = useState(immobilie);
  const [hasChanges, setHasChanges] = useState(false);
  const [wohnungen, setWohnungen] = useState(immobilie.wohnungen || []);
  const [showWohnungForm, setShowWohnungForm] = useState(false);
  const [editWohnungIdx, setEditWohnungIdx] = useState(null);
  const [wohnungForm, setWohnungForm] = useState({
    name: '', etage: '', wohnflaeche: 0, kaltmiete: 0,
    mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: 0, kautionBezahlt: false,
  });

  const updateParams = (newParams) => { setParams(newParams); setHasChanges(true); };

  // Aggregierte Werte aus Wohnungen
  const gesamtKaltmiete = wohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
  const gesamtFlaeche   = wohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
  const belegtWE        = wohnungen.filter(w => w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date())).length;
  const leerstandWE     = wohnungen.length - belegtWE;
  const auslastung      = wohnungen.length > 0 ? Math.round(belegtWE / wohnungen.length * 100) : 0;
  const kautionOffenAnzahl = wohnungen.filter(w => w.kautionBetrag > 0 && !w.kautionBezahlt).length;
  const aktiveMieterAnzahl = (mieterListe || []).filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length;

  // Rendite-Berechnung mit aggregierter Kaltmiete
  const ergebnis = useMemo(() => berechneRendite({ ...params, kaltmiete: gesamtKaltmiete }), [params, gesamtKaltmiete]);

  // Auto-Save: Wohnungsänderung sofort persistieren + Aggregat aktualisieren
  const aggregiereUndSpeichere = (neueWohnungen) => {
    const kaltmiete  = neueWohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
    const wohnflaeche = neueWohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
    const zimmer     = neueWohnungen.length;
    const updated    = { ...params, wohnungen: neueWohnungen, kaltmiete, wohnflaeche, zimmer };
    setParams(prev => ({ ...prev, kaltmiete, wohnflaeche, zimmer }));
    onSave(updated);
  };

  const saveWohnung = () => {
    const neu = [...wohnungen];
    if (editWohnungIdx !== null) neu[editWohnungIdx] = { ...neu[editWohnungIdx], ...wohnungForm };
    else neu.push({ id: Date.now(), forderungen: [], mietAnpassungen: [], ...wohnungForm });
    setWohnungen(neu);
    setShowWohnungForm(false);
    setHasChanges(false);
    aggregiereUndSpeichere(neu);
  };

  const deleteWohnung = (idx) => {
    if (!confirm('Wohnung wirklich löschen?')) return;
    const neu = wohnungen.filter((_, i) => i !== idx);
    setWohnungen(neu);
    setHasChanges(false);
    aggregiereUndSpeichere(neu);
  };

  const handleSave = () => {
    const kaltmiete  = wohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
    const wohnflaeche = wohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
    const zimmer     = wohnungen.length;
    onSave({ ...params, wohnungen, kaltmiete, wohnflaeche, zimmer });
    setHasChanges(false);
  };

  const openWohnungForm = (idx = null) => {
    setEditWohnungIdx(idx);
    setWohnungForm(idx !== null ? { ...wohnungen[idx] } : {
      name: '', etage: '', wohnflaeche: 0, kaltmiete: 0,
      mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: 0, kautionBezahlt: false,
    });
    setShowWohnungForm(true);
  };

  // Etagen-Sortierung (höchste Etage oben)
  const etageOrder = (e) => {
    if (!e) return 999;
    const lower = e.toLowerCase();
    if (['dg','dachgeschoss'].includes(lower)) return -1;
    const m = lower.match(/(\d+)/);
    if (m) return parseInt(m[1]);
    if (lower.includes('eg') || lower.includes('erdgeschoss')) return 0;
    return 998;
  };
  const sortiertNachEtage = [...wohnungen]
    .map((w, idx) => ({ ...w, originalIdx: idx }))
    .sort((a, b) => etageOrder(b.etage) - etageOrder(a.etage));
  const etageGruppen = sortiertNachEtage.reduce((acc, w) => {
    const key = w.etage || 'Ohne Etagenangabe';
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  // ── Tab-Gruppen ─────────────────────────────────────────────────────────────
  const GRUPPEN = [
    { id: 'wohnungen',  icon: <Building2 size={13}/>, label: 'Wohnungen', first: 'wohnungen', subs: null },
    { id: 'uebersicht', icon: <BarChart3 size={13}/>,  label: 'Übersicht', first: 'uebersicht', subs: null },
    { id: 'finanzen',   icon: <Wallet size={13}/>,     label: 'Finanzen',  first: 'cashflow',
      subs: [
        { id: 'cashflow',     label: 'Cashflow' },
        { id: 'finanzierung', label: 'Finanzierung' },
        { id: 'bauspar',      label: 'Bauspar' },
        { id: 'steuern',      label: 'Steuern' },
      ]
    },
    { id: 'vermietung', icon: <Users size={13}/>,      label: 'Vermietung', first: 'mieteinnahmen',
      subs: [
        { id: 'mieteinnahmen', label: 'Einnahmen' },
        { id: 'mieter',        label: aktiveMieterAnzahl > 0 ? `Mieter (${aktiveMieterAnzahl})` : 'Mieter' },
        { id: 'nkabrechnung',  label: 'NK-Abrechnung' },
        { id: 'kaution',       label: kautionOffenAnzahl > 0 ? `Kaution (${kautionOffenAnzahl})` : 'Kaution' },
      ]
    },
    { id: 'objekt',     icon: <Wrench size={13}/>,     label: 'Objekt', first: 'investitionen',
      subs: [
        { id: 'investitionen', label: 'Investitionen' },
        { id: 'zaehler',       label: 'Zähler' },
        { id: 'dokumente',     label: 'Dokumente' },
      ]
    },
  ];
  const aktiveGruppe = GRUPPEN.find(g =>
    g.id === activeTab || g.subs?.some(s => s.id === activeTab)
  ) ?? GRUPPEN[0];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-[1400px] h-[93vh] sm:h-[95vh] flex flex-col overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex-shrink-0 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Building2 size={18}/>
                  <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">MFH · {wohnungen.length} WE</span>
                  {kautionOffenAnzahl > 0 && (
                    <span className="text-xs font-semibold bg-red-500/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-300"/> {kautionOffenAnzahl}× Kaution offen
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-2xl font-black truncate">{immobilie.name}</h2>
                {(immobilie.plz || immobilie.adresse) && (
                  <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1"><MapPin size={12}/> {immobilie.plz} {immobilie.adresse}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                {onEdit && (
                  <button onClick={onEdit}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl text-sm font-semibold transition-colors">
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
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-4 bg-white border-b border-gray-200 divide-x divide-gray-100">
            <div className="px-2 sm:px-4 py-2 sm:py-3">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Kaltmiete/mo</div>
              <div className="text-sm sm:text-xl font-black text-slate-700">{formatCurrency(gesamtKaltmiete)}</div>
            </div>
            <div className="px-2 sm:px-4 py-2 sm:py-3">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Auslastung</div>
              <div className={`text-sm sm:text-xl font-black ${auslastung < 80 ? 'text-red-600' : 'text-emerald-600'}`}>{auslastung} %</div>
              <div className="text-[10px] text-gray-400">{belegtWE}/{wohnungen.length} WE</div>
            </div>
            <div className="px-2 sm:px-4 py-2 sm:py-3">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Brutto-Rendite</div>
              <div className="text-sm sm:text-xl font-black text-slate-700">
                {isFinite(ergebnis.bruttorendite) ? `${ergebnis.bruttorendite.toFixed(2)} %` : '—'}
              </div>
            </div>
            <div className="px-2 sm:px-4 py-2 sm:py-3">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Gesamtfläche</div>
              <div className="text-sm sm:text-xl font-black text-slate-700">{gesamtFlaeche} m²</div>
            </div>
          </div>
        </div>

        {/* Tab-Inhalt */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6 pb-6">

          {/* ── Tab-Navigation ───────────────────────────────────────────────── */}
          <div className="sticky top-0 z-20 bg-white -mx-3 sm:-mx-6 px-3 sm:px-6 pt-3 sm:pt-4 pb-2 mb-4 border-b border-slate-100">
            {/* Haupt-Tabs */}
            <div className={`grid grid-cols-5 gap-1 bg-slate-100 rounded-xl p-1`}>
              {GRUPPEN.map(g => (
                <button key={g.id} onClick={() => setActiveTab(g.first ?? g.id)}
                  className={`py-2 px-1 text-[10px] sm:text-sm font-semibold rounded-lg transition-all text-center leading-tight ${
                    aktiveGruppe.id === g.id
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  <span className="flex items-center justify-center gap-1">{g.icon}{g.label}</span>
                </button>
              ))}
            </div>
            {/* Sub-Tabs */}
            {aktiveGruppe.subs && (
              <div className="flex gap-0.5 sm:gap-1 mt-2 bg-amber-50 rounded-xl p-1 overflow-x-auto">
                {aktiveGruppe.subs.map(s => (
                  <button key={s.id} onClick={() => setActiveTab(s.id)}
                    className={`flex-shrink-0 sm:flex-1 py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-sm font-semibold rounded-lg transition-all text-center whitespace-nowrap ${
                      activeTab === s.id
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-amber-500 hover:text-amber-700 hover:bg-amber-100'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <TabErrorBoundary resetKey={activeTab}>

          {/* ── WOHNUNGEN TAB ────────────────────────────────────────────────── */}
          {activeTab === 'wohnungen' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Wohneinheiten nach Etage</p>
                <button onClick={() => openWohnungForm()}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-1">
                  <Plus size={13}/> Wohnung
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
                  {Object.entries(etageGruppen).map(([etage, wes]) => (
                    <div key={etage}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-gray-200"/>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{etage}</span>
                        <div className="h-px flex-1 bg-gray-200"/>
                      </div>
                      <div className={`grid gap-3 ${wes.length === 1 ? 'grid-cols-1' : wes.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        {wes.map((w) => {
                          const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date());
                          const ausgezogen = w.mietende && new Date(w.mietende) < new Date();
                          return (
                            <div key={w.id || w.originalIdx}
                              className={`rounded-2xl border-2 p-3 sm:p-4 transition-all hover:shadow-md cursor-pointer ${belegt ? 'border-emerald-200 bg-emerald-50/50' : ausgezogen ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50/50'}`}
                              onClick={() => openWohnungForm(w.originalIdx)}>
                              <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${belegt ? 'bg-emerald-100 text-emerald-700' : ausgezogen ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'}`}>
                                  {belegt ? <span className='flex items-center gap-0.5'><Check size={10}/>Vermietet</span> : ausgezogen ? 'Ausgezogen' : <span className='flex items-center gap-0.5'><AlertTriangle size={10}/>Leerstand</span>}
                                </span>
                                <button onClick={e => { e.stopPropagation(); deleteWohnung(w.originalIdx); }}
                                  className="text-gray-300 hover:text-red-500 p-0.5 rounded" title="Löschen">
                                  <X size={12}/>
                                </button>
                              </div>
                              <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{w.name || `WE ${w.originalIdx + 1}`}</p>
                              {w.wohnflaeche > 0 && <p className="text-xs text-gray-400 mt-0.5">{w.wohnflaeche} m²</p>}
                              <p className={`text-base sm:text-xl font-black mt-2 ${belegt ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {belegt ? formatCurrency(Number(w.kaltmiete) || 0) : '—'}
                                {belegt && <span className="text-xs font-normal text-gray-400">/mo</span>}
                              </p>
                              {w.mieterName && <p className="text-xs text-gray-600 mt-1 truncate flex items-center gap-1"><User size={10}/> {w.mieterName}</p>}
                              {w.mietbeginn && belegt && <p className="text-[10px] text-gray-400">seit {new Date(w.mietbeginn).toLocaleDateString('de-DE')}</p>}
                              {w.kautionBetrag > 0 && (
                                <span className={`mt-2 inline-block text-[10px] px-1.5 py-0.5 rounded-full ${w.kautionBezahlt ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                  {w.kautionBezahlt ? <CheckCircle2 size={12} className='text-emerald-600 inline mr-0.5'/> : <span className='inline-block w-2 h-2 rounded-full bg-red-500 mr-0.5'/>}
                                  Kaution {formatCurrency(w.kautionBetrag)}
                                </span>
                              )}
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

          {/* ── ÜBERSICHT TAB ────────────────────────────────────────────────── */}
          {activeTab === 'uebersicht' && (
            <div className="space-y-4">
              {/* Auslastungsbalken */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Belegungsübersicht</p>
                <div className="flex rounded-full overflow-hidden h-4 mb-3">
                  <div style={{ width: `${auslastung}%` }} className="bg-emerald-500 transition-all"/>
                  <div style={{ width: `${100 - auslastung}%` }} className="bg-red-200 transition-all"/>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5"><Check size={12}/> {belegtWE} belegt</span>
                  <span className="text-red-500 font-semibold flex items-center gap-0.5"><AlertTriangle size={12}/> {leerstandWE} leer</span>
                </div>
              </div>
              {/* Wohnungstabelle */}
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
                        <tr key={w.id || idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => { openWohnungForm(idx); }}>
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
              {/* Finanz-KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">Soll-Miete (100 %)</p>
                  <p className="text-xl font-black text-gray-800">{formatCurrency(gesamtKaltmiete)}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(gesamtKaltmiete * 12)}/Jahr</p>
                </div>
                <div className={`border rounded-xl p-4 shadow-sm ${leerstandWE > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-xs text-gray-400 mb-1">Mietausfall (Leerstand)</p>
                  <p className={`text-xl font-black ${leerstandWE > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {leerstandWE > 0 ? '−' : ''}{formatCurrency(wohnungen.filter(w => !w.mieterName || (w.mietende && new Date(w.mietende) < new Date())).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-400">{leerstandWE} WE leer</p>
                </div>
                {immobilie.kaufpreis > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">Kaufpreis</p>
                    <p className="text-xl font-black text-gray-800">{formatCurrency(immobilie.kaufpreis)}</p>
                    {immobilie.kaufdatum && <p className="text-xs text-gray-400">gekauft {new Date(immobilie.kaufdatum).toLocaleDateString('de-DE')}</p>}
                  </div>
                )}
                {(immobilie.geschaetzterWert || immobilie.kaufpreis) > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">Aktueller Wert</p>
                    <p className="text-xl font-black text-indigo-700">{formatCurrency(immobilie.geschaetzterWert || immobilie.kaufpreis)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FINANZEN: CASHFLOW ───────────────────────────────────────────── */}
          {activeTab === 'cashflow' && (
            <>
              <MietKostenManager params={params} updateParams={updateParams} immobilie={immobilie} hasChanges={hasChanges} setHasChanges={setHasChanges}/>
              <CashflowUebersicht params={{ ...params, kaltmiete: gesamtKaltmiete }} ergebnis={ergebnis} immobilie={immobilie} investitionen={params.investitionen} anteilFaktor={1}/>
            </>
          )}

          {/* ── FINANZEN: FINANZIERUNG ───────────────────────────────────────── */}
          {activeTab === 'finanzierung' && (() => {
            const kaufnebenkostenAbsolut = params.kaufpreis * ((params.kaufnebenkosten ?? 10) / 100);
            const gesamtinvestition = params.kaufpreis + kaufnebenkostenAbsolut;
            const ekFuerNebenkosten = params.ekFuerNebenkosten ?? kaufnebenkostenAbsolut;
            const ekFuerKaufpreis   = params.ekFuerKaufpreis ?? 0;
            const gesamtEK          = ekFuerNebenkosten + ekFuerKaufpreis;
            const berechneterKredit = Math.max(0, gesamtinvestition - gesamtEK);

            const finanzierungsphasen = params.finanzierungsphasen || [{
              id: 1, name: 'Erstfinanzierung', darlehensTyp: 'annuitaet',
              sollzinssatz: params.zinssatz ?? 4.0, anfangstilgung: params.tilgung ?? 2.0,
              monatlicherBetrag: null, zinsbindung: 10, monatlicheTilgung: null,
              tilgungssatz: 2.0, laufzeit: 10, sondertilgungJaehrlich: 0, restschuldOverride: null,
            }];

            const berechnePhase = (phase, startKredit) => {
              const monatszins = (phase.sollzinssatz || 0) / 100 / 12;
              const typ = phase.darlehensTyp || 'annuitaet';
              if (typ === 'annuitaet') {
                const rate = phase.monatlicherBetrag > 0 ? phase.monatlicherBetrag : startKredit * (monatszins + (phase.anfangstilgung || 2) / 100 / 12);
                const zb = (phase.zinsbindung || 10) * 12;
                let rs = startKredit, gZ = 0, gT = 0;
                const eZ = startKredit * monatszins;
                const eT = Math.max(0, rate - eZ);
                for (let m = 0; m < zb && rs > 0; m++) {
                  const mz = rs * monatszins; const t = Math.min(Math.max(0, rate - mz), rs);
                  gZ += mz; gT += t; rs -= t;
                  if ((m+1) % 12 === 0 && phase.sondertilgungJaehrlich > 0) rs = Math.max(0, rs - phase.sondertilgungJaehrlich);
                }
                let laufzeitJ = null;
                if (monatszins > 0 && rate > startKredit * monatszins) {
                  const n = Math.ceil(Math.log(rate / (rate - startKredit * monatszins)) / Math.log(1 + monatszins));
                  laufzeitJ = (n / 12).toFixed(1);
                }
                const atP = startKredit > 0 ? (eT / startKredit * 100 * 12) : 0;
                return { rate: Math.round(rate), erstZinsen: Math.round(eZ), erstTilgung: Math.round(eT), anfangstilgungProzent: atP, restschuldNachZinsbindung: Math.round(rs), gesamtZinsen: Math.round(gZ), gesamtTilgung: Math.round(gT), gesamtlaufzeitJahre: laufzeitJ };
              }
              if (typ === 'tilgung') {
                const mt = phase.monatlicheTilgung > 0 ? phase.monatlicheTilgung : startKredit * (phase.tilgungssatz || 2) / 100 / 12;
                const zb = (phase.zinsbindung || 10) * 12;
                let rs = startKredit, gZ = 0;
                const eZ = startKredit * monatszins; const eR = eZ + mt;
                for (let m = 0; m < zb && rs > 0; m++) {
                  const mz = rs * monatszins; const t = Math.min(mt, rs);
                  gZ += mz; rs -= t;
                  if ((m+1) % 12 === 0 && phase.sondertilgungJaehrlich > 0) rs = Math.max(0, rs - phase.sondertilgungJaehrlich);
                }
                const lZ = rs * monatszins; const lR = lZ + Math.min(mt, rs);
                return { monatsTilgung: Math.round(mt), erstRate: Math.round(eR), letzteRate: Math.round(lR), erstZinsen: Math.round(eZ), restschuldNachZinsbindung: Math.round(rs), gesamtZinsen: Math.round(gZ) };
              }
              if (typ === 'endfaellig') {
                const lm = (phase.laufzeit || 10) * 12;
                const mZ = Math.round(startKredit * monatszins);
                return { monatlicherZins: mZ, gesamtZinsen: Math.round(mZ * lm), restschuldNachZinsbindung: Math.round(startKredit), rueckzahlungEnde: Math.round(startKredit) };
              }
              return {};
            };

            const erstePhaseStart = finanzierungsphasen[0]?.kreditStartDatum || params.kaufdatum;
            const kaufjahrF = erstePhaseStart ? new Date(erstePhaseStart).getFullYear() : new Date().getFullYear();
            let aktRS = params.finanzierungsbetrag ?? berechneterKredit;
            let aktStartjahr = kaufjahrF;
            const phasenBerechnet = finanzierungsphasen.map((phase, i) => {
              const sk = (i > 0 && phase.restschuldOverride != null) ? phase.restschuldOverride : aktRS;
              const b = berechnePhase(phase, sk);
              const lz = phase.darlehensTyp === 'endfaellig' ? (phase.laufzeit || 10) : (phase.zinsbindung || 10);
              const res = { ...phase, startjahr: aktStartjahr, startKredit: Math.round(sk), ...b };
              aktRS = b.restschuldNachZinsbindung ?? sk;
              aktStartjahr += lz;
              return res;
            });

            const updatePhase = (id, updates) => {
              const updated = finanzierungsphasen.map(p => p.id === id ? { ...p, ...updates } : p);
              updateParams({ ...params, finanzierungsphasen: updated, zinssatz: updated[0]?.sollzinssatz ?? params.zinssatz });
            };
            const addPhase = () => {
              const letzte = phasenBerechnet[phasenBerechnet.length - 1];
              updateParams({ ...params, finanzierungsphasen: [...finanzierungsphasen, {
                id: Date.now(), name: `Anschlussfinanzierung ${finanzierungsphasen.length}`,
                darlehensTyp: letzte?.darlehensTyp || 'annuitaet',
                sollzinssatz: (letzte?.sollzinssatz ?? 4) + 0.5,
                anfangstilgung: letzte?.anfangstilgung ?? 2, monatlicherBetrag: null, zinsbindung: 10,
                monatlicheTilgung: null, tilgungssatz: letzte?.tilgungssatz ?? 2, laufzeit: 10,
                sondertilgungJaehrlich: 0, restschuldOverride: letzte?.restschuldNachZinsbindung ?? null,
              }] });
            };
            const deletePhase = (id) => {
              if (finanzierungsphasen.length <= 1) return;
              updateParams({ ...params, finanzierungsphasen: finanzierungsphasen.filter(p => p.id !== id) });
            };
            const typLabels = { annuitaet: 'Annuitätendarlehen', tilgung: 'Tilgungsdarlehen', endfaellig: 'Endfälliges Darlehen' };

            return (
              <div className="space-y-5">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <KaufnebenkostenManager params={params} updateParams={updateParams} kaufpreis={params.kaufpreis}/>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4 flex items-center gap-1"><Wallet size={14}/> Eigenkapitaleinsatz</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">EK für Kaufnebenkosten</label>
                        <span className="text-xs text-gray-400">max. {formatCurrency(kaufnebenkostenAbsolut)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={kaufnebenkostenAbsolut} step={1000} value={ekFuerNebenkosten}
                          onChange={e => updateParams({ ...params, ekFuerNebenkosten: parseFloat(e.target.value) })} className="flex-1"/>
                        <input type="number" value={Math.round(ekFuerNebenkosten)}
                          onChange={e => updateParams({ ...params, ekFuerNebenkosten: Math.min(kaufnebenkostenAbsolut, parseFloat(e.target.value) || 0) })}
                          className="w-28 px-2 py-1 border rounded text-right text-base sm:text-sm"/>
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">EK für Kaufpreis</label>
                        <span className="text-xs text-gray-400">{params.kaufpreis > 0 ? ((ekFuerKaufpreis / params.kaufpreis) * 100).toFixed(1) : 0}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={params.kaufpreis} step={5000} value={ekFuerKaufpreis}
                          onChange={e => updateParams({ ...params, ekFuerKaufpreis: parseFloat(e.target.value) })} className="flex-1"/>
                        <input type="number" value={Math.round(ekFuerKaufpreis)}
                          onChange={e => updateParams({ ...params, ekFuerKaufpreis: Math.min(params.kaufpreis, parseFloat(e.target.value) || 0) })}
                          className="w-28 px-2 py-1 border rounded text-right text-base sm:text-sm"/>
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-800">Gesamt-EK: {formatCurrency(gesamtEK)}</span>
                    <span className="text-xs text-gray-500">{gesamtinvestition > 0 ? ((gesamtEK / gesamtinvestition) * 100).toFixed(1) : 0}% der Gesamtinvestition</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1"><Landmark size={14}/> Kredit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Kreditbetrag</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step={1000} value={params.finanzierungsbetrag ?? berechneterKredit}
                          onChange={e => updateParams({ ...params, finanzierungsbetrag: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg text-lg font-bold text-right focus:ring-2 focus:ring-amber-400"/>
                        <span className="text-gray-500">€</span>
                      </div>
                      <button onClick={() => updateParams({ ...params, finanzierungsbetrag: null })} className="text-xs text-amber-600 hover:underline mt-1">
                        ↺ Auto ({formatCurrency(berechneterKredit)})
                      </button>
                    </div>
                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div><span className="text-gray-400 text-xs">Kaufpreis</span><br/><strong>{formatCurrency(params.kaufpreis)}</strong></div>
                      <div className="text-gray-300">+</div>
                      <div><span className="text-gray-400 text-xs">Nebenkosten</span><br/><strong>{formatCurrency(kaufnebenkostenAbsolut)}</strong></div>
                      <div className="text-gray-300">−</div>
                      <div><span className="text-gray-400 text-xs">Eigenkapital</span><br/><strong>{formatCurrency(gesamtEK)}</strong></div>
                      <div className="text-gray-300">=</div>
                      <div><span className="text-gray-400 text-xs">Kredit (berechnet)</span><br/><strong className="text-amber-700">{formatCurrency(berechneterKredit)}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {phasenBerechnet.map((phase, idx) => {
                    const typ = phase.darlehensTyp || 'annuitaet';
                    const pStart = idx === 0 ? (phase.kreditStartDatum || params.kaufdatum) : null;
                    let zbWarnung = null;
                    if (pStart && typ !== 'endfaellig') {
                      const abl = new Date(pStart); abl.setFullYear(abl.getFullYear() + (phase.zinsbindung || 10));
                      const heute = new Date(); const monate = (abl - heute) / (1000 * 60 * 60 * 24 * 30.44);
                      if (monate <= 12 && monate >= 0) zbWarnung = { ablaufDatum: abl, monateZumAblauf: Math.ceil(monate), kritisch: monate <= 3 };
                      else if (monate < 0) zbWarnung = { ablaufDatum: abl, monateZumAblauf: 0, abgelaufen: true, kritisch: true };
                    }
                    return (
                      <div key={phase.id} className={`bg-white border-2 rounded-2xl p-5 shadow-sm ${idx === 0 ? 'border-amber-200' : 'border-gray-200'}`}>
                        {zbWarnung && (
                          <div className={`mb-4 p-3 rounded-xl flex items-start gap-3 ${zbWarnung.abgelaufen ? 'bg-red-100 border border-red-300' : zbWarnung.kritisch ? 'bg-orange-100 border border-orange-300' : 'bg-amber-50 border border-amber-200'}`}>
                            <AlertTriangle size={18} className={zbWarnung.abgelaufen ? 'text-red-600' : 'text-amber-600'}/>
                            <div>
                              <p className={`text-sm font-bold ${zbWarnung.abgelaufen ? 'text-red-800' : zbWarnung.kritisch ? 'text-orange-800' : 'text-amber-800'}`}>
                                {zbWarnung.abgelaufen ? 'Zinsbindung bereits abgelaufen!' : `Zinsbindung läuft in ${zbWarnung.monateZumAblauf} Monat${zbWarnung.monateZumAblauf !== 1 ? 'en' : ''} aus`}
                              </p>
                              <p className={`text-xs mt-0.5 ${zbWarnung.abgelaufen ? 'text-red-700' : 'text-amber-700'}`}>
                                {zbWarnung.abgelaufen ? `Ablauf war am ${zbWarnung.ablaufDatum.toLocaleDateString('de-DE')} — Anschlussfinanzierung notwendig!` : `Ablauf am ${zbWarnung.ablaufDatum.toLocaleDateString('de-DE')} — jetzt vorbereiten!`}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-600 text-white' : 'bg-gray-400 text-white'}`}>Phase {idx + 1}</span>
                            <input type="text" value={phase.name} onChange={e => updatePhase(phase.id, { name: e.target.value })}
                              className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-amber-500 focus:outline-none text-base"/>
                            {phase.startjahr && <span className="text-xs text-gray-400">ab {phase.startjahr}</span>}
                          </div>
                          {idx > 0 && <button onClick={() => deletePhase(phase.id)} className="text-red-400 hover:text-red-600 text-sm">Entfernen</button>}
                        </div>
                        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <label className="block text-xs font-semibold text-slate-600 mb-1"><Landmark size={12} className='inline mr-1'/>Kreditinstitut / Bank</label>
                          <input type="text" value={phase.kreditinstitut || ''} placeholder="z.B. Sparkasse, Deutsche Bank …"
                            onChange={e => updatePhase(phase.id, { kreditinstitut: e.target.value })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-amber-400 bg-white"/>
                        </div>
                        {idx === 0 && (
                          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <label className="block text-xs font-semibold text-slate-600 mb-1"><CalendarDays size={12} className='inline mr-1'/>Kreditstartdatum</label>
                            <div className="flex items-center gap-2">
                              <input type="date" value={phase.kreditStartDatum || ''} onChange={e => updatePhase(phase.id, { kreditStartDatum: e.target.value || null })}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-amber-400"/>
                              {phase.kreditStartDatum && <button onClick={() => updatePhase(phase.id, { kreditStartDatum: null })} className="text-xs text-slate-500 hover:underline">↺ Kaufdatum</button>}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {Object.entries(typLabels).map(([val, label]) => (
                            <button key={val} type="button" onClick={() => updatePhase(phase.id, { darlehensTyp: val })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${typ === val ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                        {idx > 0 && (
                          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <label className="block text-xs font-semibold text-amber-800 mb-1"><Landmark size={12} className='inline mr-1'/>Restschuld laut Bank (Startbetrag)</label>
                            <div className="flex items-center gap-2">
                              <input type="number" step={1000} value={phase.restschuldOverride ?? ''}
                                placeholder={`Berechnet: ${formatCurrency(phasenBerechnet[idx-1]?.restschuldNachZinsbindung ?? 0)}`}
                                onChange={e => updatePhase(phase.id, { restschuldOverride: e.target.value === '' ? null : parseFloat(e.target.value) || 0 })}
                                className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-base sm:text-sm"/>
                              <span className="text-sm text-gray-500">€</span>
                              {phase.restschuldOverride != null && <button onClick={() => updatePhase(phase.id, { restschuldOverride: null })} className="text-xs text-amber-600 hover:underline">Auto</button>}
                            </div>
                          </div>
                        )}
                        {typ === 'annuitaet' && (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                              {[['Sollzinssatz p.a.', 'sollzinssatz', 0, 15, 0.01, '%'], ['Anfangstilgung p.a.', 'anfangstilgung', 0, 20, 0.1, '%'], ['Zinsbindung', 'zinsbindung', 1, 30, 1, 'J.']].map(([label, field, min, max, step, unit]) => (
                                <div key={field}>
                                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                  <div className="flex items-center gap-1">
                                    <input type="number" min={min} max={max} step={step} value={phase[field] ?? (field === 'zinsbindung' ? 10 : field === 'anfangstilgung' ? 2 : 4)}
                                      onChange={e => updatePhase(phase.id, { [field]: parseFloat(e.target.value) || 0 })}
                                      className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-amber-400"/>
                                    <span className="text-xs text-gray-400">{unit}</span>
                                  </div>
                                </div>
                              ))}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Monatl. Rate (optional)</label>
                                <div className="flex items-center gap-1">
                                  <input type="number" min={0} step={10} value={phase.monatlicherBetrag || ''} placeholder={phase.rate ? String(phase.rate) : 'Berechnet'}
                                    onChange={e => updatePhase(phase.id, { monatlicherBetrag: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                                    className="w-full px-2 py-2 border-2 border-amber-200 bg-amber-50 rounded-lg text-right font-bold focus:border-amber-500"/>
                                  <span className="text-xs text-gray-400">€</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Sondertilgung/Jahr</label>
                                <div className="flex items-center gap-1">
                                  <input type="number" min={0} step={1000} value={phase.sondertilgungJaehrlich || 0}
                                    onChange={e => updatePhase(phase.id, { sondertilgungJaehrlich: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm"/>
                                  <span className="text-xs text-gray-400">€</span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-amber-50 rounded-xl text-center text-sm">
                              <div><div className="text-xs text-gray-400 mb-1">Startbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Monatl. Rate</div><div className="font-bold text-amber-700">{formatCurrency(phase.rate)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Zinsen (Monat 1)</div><div className="font-bold text-orange-600">{formatCurrency(phase.erstZinsen)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Tilgung (Monat 1)</div><div className="font-bold text-emerald-600">{formatCurrency(phase.erstTilgung)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Restschuld nach {phase.zinsbindung||10}J.</div>
                                <div className={`font-bold ${phase.restschuldNachZinsbindung===0?'text-emerald-600':'text-orange-600'}`}>
                                  {phase.restschuldNachZinsbindung===0?<span className='flex items-center justify-center gap-1'><Check size={14}/>Abbezahlt</span>:formatCurrency(phase.restschuldNachZinsbindung)}
                                </div>
                              </div>
                            </div>
                            {phase.gesamtZinsen > 0 && (
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>Gezahlte Zinsen in {phase.zinsbindung||10}J.: <strong className="text-orange-600">{formatCurrency(phase.gesamtZinsen)}</strong></span>
                                <span>Getilgt: <strong className="text-emerald-600">{formatCurrency(phase.gesamtTilgung)}</strong></span>
                              </div>
                            )}
                          </>
                        )}
                        {typ === 'tilgung' && (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                              <div><label className="block text-xs text-gray-500 mb-1">Sollzinssatz p.a.</label>
                                <div className="flex items-center gap-1"><input type="number" min={0} max={15} step={0.01} value={phase.sollzinssatz ?? 4} onChange={e => updatePhase(phase.id, { sollzinssatz: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold"/><span className="text-xs text-gray-400">%</span></div></div>
                              <div><label className="block text-xs text-gray-500 mb-1">Tilgungssatz p.a.</label>
                                <div className="flex items-center gap-1"><input type="number" min={0} max={20} step={0.1} value={phase.tilgungssatz ?? 2} onChange={e => updatePhase(phase.id, { tilgungssatz: parseFloat(e.target.value) || 0, monatlicheTilgung: null })} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm"/><span className="text-xs text-gray-400">%</span></div></div>
                              <div><label className="block text-xs text-gray-500 mb-1">Zinsbindung</label>
                                <div className="flex items-center gap-1"><input type="number" min={1} max={30} value={phase.zinsbindung ?? 10} onChange={e => updatePhase(phase.id, { zinsbindung: parseInt(e.target.value) || 10 })} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm"/><span className="text-xs text-gray-400">J.</span></div></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-purple-50 rounded-xl text-center text-sm">
                              <div><div className="text-xs text-gray-400 mb-1">Startbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Tilgung/Monat</div><div className="font-bold text-purple-700">{formatCurrency(phase.monatsTilgung)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Rate Monat 1 → Ende</div><div className="font-bold text-indigo-700">{formatCurrency(phase.erstRate)} → {formatCurrency(phase.letzteRate)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Restschuld nach {phase.zinsbindung||10}J.</div><div className={`font-bold ${phase.restschuldNachZinsbindung===0?'text-emerald-600':'text-orange-600'}`}>{phase.restschuldNachZinsbindung===0?'Abbezahlt':formatCurrency(phase.restschuldNachZinsbindung)}</div></div>
                            </div>
                          </>
                        )}
                        {typ === 'endfaellig' && (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                              <div><label className="block text-xs text-gray-500 mb-1">Sollzinssatz p.a.</label><div className="flex items-center gap-1"><input type="number" min={0} max={15} step={0.01} value={phase.sollzinssatz ?? 4} onChange={e => updatePhase(phase.id, { sollzinssatz: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold"/><span className="text-xs text-gray-400">%</span></div></div>
                              <div><label className="block text-xs text-gray-500 mb-1">Laufzeit</label><div className="flex items-center gap-1"><input type="number" min={1} max={30} value={phase.laufzeit ?? 10} onChange={e => updatePhase(phase.id, { laufzeit: parseInt(e.target.value) || 10 })} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm"/><span className="text-xs text-gray-400">J.</span></div></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-red-50 rounded-xl text-center text-sm">
                              <div><div className="text-xs text-gray-400 mb-1">Darlehensbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Monatl. Zinszahlung</div><div className="font-bold text-orange-600">{formatCurrency(phase.monatlicherZins)}</div><div className="text-[10px] text-gray-400">keine Tilgung!</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Gesamtzinskosten</div><div className="font-bold text-red-600">{formatCurrency(phase.gesamtZinsen)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Rückzahlung nach {phase.laufzeit||10}J.</div><div className="font-bold text-red-700">{formatCurrency(phase.rueckzahlungEnde)}</div></div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={addPhase} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-amber-400 hover:text-amber-600 text-sm font-semibold transition-all">
                  + Anschlussfinanzierung hinzufügen
                </button>
              </div>
            );
          })()}

          {/* ── FINANZEN: BAUSPAR ────────────────────────────────────────────── */}
          {activeTab === 'bauspar' && (
            <BausparManager params={params} updateParams={updateParams}/>
          )}

          {/* ── FINANZEN: STEUERN ────────────────────────────────────────────── */}
          {activeTab === 'steuern' && (
            <Steuerberechnung params={{ ...params, kaltmiete: gesamtKaltmiete }} ergebnis={ergebnis} immobilie={{ ...immobilie, ...params, kaltmiete: gesamtKaltmiete }} onUpdateParams={updateParams} anteilFaktor={1}/>
          )}

          {/* ── VERMIETUNG: EINNAHMEN ────────────────────────────────────────── */}
          {activeTab === 'mieteinnahmen' && (
            <MieteinnahmenTracker
              params={{ ...params, kaltmiete: gesamtKaltmiete }}
              updateParams={updateParams}
              immobilie={immobilie}
              mieterListe={(mieterListe || []).filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false)}
            />
          )}

          {/* ── VERMIETUNG: MIETER ───────────────────────────────────────────── */}
          {activeTab === 'mieter' && (
            <MieterDashboard
              mieterListe={(mieterListe || []).filter(m => m.immobilie_id === immobilie.id)}
              portfolio={[{ ...immobilie, wohnungen }]}
              onDelete={onDeleteMieter}
              onSave={onSaveMieter}
              nkAbrechnungen={nkAbrechnungen}
              onSaveNK={onSaveNK}
              onDeleteNK={onDeleteNK}
              immobilieDokumente={params.dokumente || []}
              onDokumentUpdate={async (neueDokumente) => {
                const updated = { ...params, dokumente: neueDokumente };
                updateParams(updated);
                await onSave({ ...updated, wohnungen });
              }}
            />
          )}

          {/* ── VERMIETUNG: NK-ABRECHNUNG ────────────────────────────────────── */}
          {activeTab === 'nkabrechnung' && (
            <NKAbrechnungTab params={params} updateParams={updateParams} immobilie={immobilie}/>
          )}

          {/* ── VERMIETUNG: KAUTION ──────────────────────────────────────────── */}
          {activeTab === 'kaution' && (
            <div className="space-y-3">
              {wohnungen.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Key size={40} className="mx-auto mb-2 text-gray-300"/>
                  <p className="text-sm">Erst Wohnungen anlegen, dann Kaution verwalten.</p>
                  <button onClick={() => setActiveTab('wohnungen')} className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600">
                    → Zu Wohnungen
                  </button>
                </div>
              ) : (
                wohnungen.map((w, idx) => {
                  const kStatus = !w.kautionBetrag ? 'keine' : w.kautionBezahlt ? 'bezahlt' : 'offen';
                  return (
                    <div key={w.id || idx} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
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
                      {/* Inline-Bearbeitung */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-0.5">Kaution (€)</label>
                          <input type="number" value={w.kautionBetrag || ''} placeholder="0"
                            onChange={e => {
                              const neu = [...wohnungen]; neu[idx] = { ...neu[idx], kautionBetrag: parseFloat(e.target.value) || 0 };
                              setWohnungen(neu); aggregiereUndSpeichere(neu);
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-300 text-right"/>
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!w.kautionBezahlt}
                              onChange={e => {
                                const neu = [...wohnungen]; neu[idx] = { ...neu[idx], kautionBezahlt: e.target.checked };
                                setWohnungen(neu); aggregiereUndSpeichere(neu);
                              }}
                              className="w-4 h-4 rounded accent-emerald-500"/>
                            <span className="text-sm text-gray-700">Bezahlt</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 border border-amber-100 flex items-center gap-1">
                <Lightbulb size={14}/> Vollständige Mieterdaten → Wohnungen-Tab → Wohnung anklicken
              </div>
            </div>
          )}

          {/* ── OBJEKT: INVESTITIONEN ────────────────────────────────────────── */}
          {activeTab === 'investitionen' && (
            <ReparaturenInvestitionen
              immobilie={{ ...immobilie, investitionen: params.investitionen }}
              onUpdate={(updated) => updateParams({ ...params, investitionen: updated.investitionen })}
            />
          )}

          {/* ── OBJEKT: ZÄHLER ───────────────────────────────────────────────── */}
          {activeTab === 'zaehler' && (
            <ZaehlerVerwaltung params={params} updateParams={(neu) => updateParams(neu)}/>
          )}

          {/* ── OBJEKT: DOKUMENTE ────────────────────────────────────────────── */}
          {activeTab === 'dokumente' && (
            <DokumenteTab
              immobilie={immobilie}
              dokumente={params.dokumente || []}
              onDokumentUpdate={async (neueDokumente) => {
                const updated = { ...params, dokumente: neueDokumente };
                updateParams(updated);
                await onSave({ ...updated, wohnungen });
              }}
            />
          )}

          </TabErrorBoundary>
        </div>
      </div>

      {/* ── Wohnung bearbeiten / hinzufügen ──────────────────────────────────── */}
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
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" placeholder="z.B. WE 1, EG links"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Etage</label>
                    <input value={wohnungForm.etage || ''} onChange={e => setWohnungForm({...wohnungForm, etage: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" placeholder="z.B. EG, 1. OG, DG"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Wohnfläche (m²)</label>
                    <input type="number" value={wohnungForm.wohnflaeche} onChange={e => setWohnungForm({...wohnungForm, wohnflaeche: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kaltmiete (€/mo)</label>
                    <input type="number" value={wohnungForm.kaltmiete} onChange={e => setWohnungForm({...wohnungForm, kaltmiete: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mieter/in</label>
                  <input value={wohnungForm.mieterName || ''} onChange={e => setWohnungForm({...wohnungForm, mieterName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm" placeholder="Name des Mieters"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mietbeginn</label>
                    <input type="date" value={wohnungForm.mietbeginn || ''} onChange={e => setWohnungForm({...wohnungForm, mietbeginn: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mietende</label>
                    <input type="date" value={wohnungForm.mietende || ''} onChange={e => setWohnungForm({...wohnungForm, mietende: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm"/>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1"><Key size={12}/> Kaution</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Betrag (€)</label>
                      <input type="number" value={wohnungForm.kautionBetrag || 0} onChange={e => setWohnungForm({...wohnungForm, kautionBetrag: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right"/>
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!wohnungForm.kautionBezahlt} onChange={e => setWohnungForm({...wohnungForm, kautionBezahlt: e.target.checked})} className="w-4 h-4 rounded accent-emerald-500"/>
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
                  className="py-3 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100">
                  <Trash2 size={16}/>
                </button>
              )}
              <button onClick={saveWohnung} className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MehrfamilienhausDetail;
