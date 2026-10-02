import { useState, useEffect, useRef } from 'react';
import KostenZahler from './KostenZahler';
import JetztDran from './JetztDran';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleWarmmiete, getAktuelleUntermiete, berechneHistorischenArbitrageCashflow, berechneMietStatusFuerMonat, arbitrageZusatzkosten, arbitrageKostenText } from '../utils/miete.js';
import ObjektUeberlaufMenu from './ObjektUeberlaufMenu';
import { DetailNavigation, ZurueckZumCockpit, KennzahlenZeile } from './DetailNavigation';
import MieterDashboard from './MieterDashboard';
import MieteinnahmenTracker from './MieteinnahmenTracker';
import ArbitrageCashflow from './ArbitrageCashflow';
import ArbitrageSteuern from './ArbitrageSteuern';
import NachforderungenManager from './NachforderungenManager';
import { uploadDokument, deleteDokument, getDokumentUrl } from '../supabaseClient';
import {
  BarChart3, Wallet, User, FileText, Receipt, MapPin, AlertTriangle,
  Pencil, X, Check, TrendingUp, RefreshCw, Upload, Download, Trash2,
  FolderOpen, Loader2, Zap, Globe, Key, Lightbulb, ClipboardList,
  CalendarDays, Settings,
} from 'lucide-react';
import ZahlInput from './ZahlInput';

// ─── Dokumente-Tab (Arbitrage) ────────────────────────────────────────────────
const ARB_DOK_TYPEN = ['Hauptmietvertrag', 'Untermietvertrag', 'Stromvertrag', 'WLAN-Vertrag', 'GEZ-Dokument', 'Übergabeprotokoll', 'Kaution', 'Versicherung', 'Sonstiges'];

const ArbitrageDokumenteTab = ({ immobilie, dokumente, onDokumentUpdate }) => {
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
    } catch (e) { alert(`Fehler: ${e.message}`); }
    finally { setLadeId(null); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`"${doc.name}" wirklich löschen?`)) return;
    try {
      await deleteDokument(doc.path);
      onDokumentUpdate(dokumente.filter(d => d.id !== doc.id));
    } catch (e) { alert(`Löschen fehlgeschlagen: ${e.message}`); }
  };

  // Dokumente nach Typ gruppieren
  const gruppen = ARB_DOK_TYPEN.reduce((acc, typ) => {
    const liste = dokumente.filter(d => d.typ === typ);
    if (liste.length > 0) acc.push({ typ, liste });
    return acc;
  }, []);
  const sonstige = dokumente.filter(d => !ARB_DOK_TYPEN.includes(d.typ));
  if (sonstige.length > 0) gruppen.push({ typ: 'Sonstiges', liste: sonstige });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5"><FileText size={16}/> Dokumente</h3>
          <p className="text-xs text-slate-500 mt-0.5">Mietvertrag, Untermietverträge & alle weiteren Unterlagen</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-semibold">
          {dokumente.length} Datei{dokumente.length !== 1 ? 'en' : ''}
        </span>
      </div>

      {/* Upload-Bereich */}
      <div
        className="bg-white border-2 border-dashed rounded-xl p-5 space-y-3 transition-colors"
        style={{ borderColor: dragOver ? '#10b981' : '#cbd5e1', background: dragOver ? '#ecfdf5' : undefined }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}>

        {/* Typ-Auswahl */}
        <div className="flex flex-wrap gap-1.5">
          {ARB_DOK_TYPEN.map(t => (
            <button key={t} onClick={() => setGewaehltTyp(t)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                gewaehltTyp === t ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <label className={`flex flex-col items-center justify-center gap-2 cursor-pointer py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            {uploading ? <Loader2 size={24} className="animate-spin text-emerald-400"/> : <Upload size={24} className="text-emerald-400"/>}
          </div>
          <p className="text-sm font-semibold text-slate-700">{uploading ? 'Wird hochgeladen…' : 'Datei hochladen'}</p>
          <p className="text-xs text-slate-400">{uploading ? 'Bitte warten' : 'Klicken oder Datei hierher ziehen · max. 20 MB'}</p>
          <input type="file" multiple className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.zip"
            onChange={e => handleFiles(e.target.files)} />
        </label>

        {uploadFehler && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center flex items-center justify-center gap-1"><AlertTriangle size={14}/>{uploadFehler}</div>
        )}
      </div>

      {/* Dokumentenliste — nach Typ gruppiert */}
      {dokumente.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <FolderOpen size={36} className="mx-auto mb-2 text-slate-300"/>
          <p className="text-sm font-medium">Noch keine Dokumente hochgeladen</p>
          <p className="text-xs mt-1">Lade deinen Mietvertrag, Untermietverträge, Strom- & WLAN-Verträge hoch</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gruppen.map(({ typ, liste }) => (
            <div key={typ}>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-slate-400"/>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{typ}</span>
                <span className="text-xs text-slate-400">({liste.length})</span>
              </div>
              <div className="space-y-1.5">
                {[...liste].reverse().map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-emerald-200 hover:shadow-sm transition-all group">
                    <FileText size={16} className="flex-shrink-0 text-slate-400"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400">{formatBytes(doc.groesse)}</span>
                        <span className="text-xs text-slate-400">{new Date(doc.hochgeladenAm).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleDownload(doc)} disabled={ladeId === doc.id}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50" title="Öffnen">
                        {ladeId === doc.id ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                      </button>
                      <button onClick={() => handleDelete(doc)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" title="Löschen">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MietimmobilieDetail = ({ immobilie, onClose, onEdit, onSave, mieterListe = [], onSaveMieter, onDeleteMieter, nkAbrechnungen = [], onSaveNK, onDeleteNK, portfolio = [], initialTab, aufgaben = [], onAlleErinnerungen, onDeleteImmobilie }) => {
  const [params, setParams] = useState({
    eigeneWarmmiete: immobilie.eigeneWarmmiete || 0,
    anzahlZimmerVermietet: immobilie.anzahlZimmerVermietet || 0,
    untermieteProZimmer: immobilie.untermieteProZimmer || 0,
    // Aufgeschlüsselte Kosten für Steuerberater
    arbitrageStrom: immobilie.arbitrageStrom || 0,
    arbitrageInternet: immobilie.arbitrageInternet || 0,
    arbitrageSonstige: immobilie.arbitrageSonstige || 0,
    arbitrageHeizung: immobilie.arbitrageHeizung || 0,
    kostenZahler: immobilie.kostenZahler || {},
    arbitrageGEZ: immobilie.arbitrageGEZ ?? 18.36,
    wohnflaeche: immobilie.wohnflaeche || '',
    zimmer: immobilie.zimmer || '',
    mietvertragStart: immobilie.mietvertragStart || '',
    mietvertragEnde: immobilie.mietvertragEnde || '',
    name: immobilie.name || '',
    plz: immobilie.plz || '',
    adresse: immobilie.adresse || '',
    // Mietanpassungen: [{datum, eigeneWarmmiete?, untermieteProZimmer?}]
    mietAnpassungen: immobilie.mietAnpassungen || [],
    mietEingaenge: immobilie.mietEingaenge || [],
    steuersatz: immobilie.steuersatz || 42,
    dauerauftrag: immobilie.dauerauftrag || false,
    dauerauftragBetrag: immobilie.dauerauftragBetrag || 0,
    dokumente: immobilie.dokumente || [],
    mieteFaelligkeitstag: immobilie.mieteFaelligkeitstag ?? 3,
    aktiv: immobilie.aktiv !== false,
    aufgabedatum: immobilie.aufgabedatum || '',
    nkAbrechnungen: immobilie.nkAbrechnungen || [],
    nachforderungen: immobilie.nachforderungen || [],
  });
  const [hasChanges, setHasChanges] = useState(false);
  // Deep-Links aus Erinnerungen auf die neuen Reiter abbilden
  const MIET_TAB_MAP = { mieteinnahmen: 'mieteingaenge', kaution: 'mieter', dokumente: 'objekt', stammdaten: 'objekt' };
  const [activeTab, setActiveTab] = useState(() => (initialTab && (MIET_TAB_MAP[initialTab] || initialTab)) || 'uebersicht');
  const eigeneAufgaben = aufgaben.filter(t => t.immoId === immobilie.id);
  // Abschnitt 7.3: Scrollposition sprang beim Tab-Wechsel nicht nach oben.
  const scrollContainerRef = useRef(null);
  useEffect(() => { scrollContainerRef.current?.scrollTo(0, 0); }, [activeTab]);

  const updateParams = (newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({ ...immobilie, ...params });
    setHasChanges(false);
  };

  // Mietvertragsende prüfen
  const vertragsende = params.mietvertragEnde ? new Date(params.mietvertragEnde) : null;
  const heute = new Date();
  const vertragsBeendet = vertragsende && vertragsende < heute;

  // Aktuelle Werte aus mietAnpassungen (historisch korrekt, neuster Wert ≤ heute)
  const aktWarmmiete = getAktuelleWarmmiete(params);
  const aktUntermiete = getAktuelleUntermiete(params);

  // Berechnungen — wenn Vertrag beendet: laufender Cashflow = 0
  const einnahmen = vertragsBeendet ? 0 : params.anzahlZimmerVermietet * aktUntermiete;
  const zusatzkosten = vertragsBeendet ? 0 : arbitrageZusatzkosten(params);
  const ausgaben = vertragsBeendet ? 0 : aktWarmmiete + zusatzkosten;
  const monatsCashflow = einnahmen - ausgaben;
  const jahresCashflow = monatsCashflow * 12;

  // Bisheriger Cashflow: Monat-für-Monat mit historisch korrekten Werten je Anpassungsperiode
  const mietvertragStart = params.mietvertragStart ? new Date(params.mietvertragStart) : null;
  const bisWann = vertragsende && vertragsende < heute ? vertragsende : heute;
  const monateSeitStart = mietvertragStart
    ? Math.max(0, Math.floor((bisWann - mietvertragStart) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const bisherigeCashflowGesamt = mietvertragStart
    ? berechneHistorischenArbitrageCashflow(params, mietvertragStart, bisWann)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-5xl h-[93vh] sm:h-[95vh] flex flex-col overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
        </div>
        {/* Header */}
        <div className="flex-shrink-0 overflow-hidden">
          <div className="bg-ink px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
            <div className="flex justify-between items-start">
              <ZurueckZumCockpit sichtbar={activeTab !== 'uebersicht'} onClick={() => setActiveTab('uebersicht')} />
              <div className={`flex-1 min-w-0 ${activeTab !== 'uebersicht' ? 'ml-3' : ''}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/90">Angemietet · untervermietet</span>
                  {vertragsBeendet && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/80 text-white flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-300"/> Vertrag beendet {new Date(params.mietvertragEnde).toLocaleDateString('de-DE')}</span>
                  )}
                  {vertragsende && !vertragsBeendet && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/80 text-amber-900 flex items-center gap-1"><Loader2 size={11}/> Endet {new Date(params.mietvertragEnde).toLocaleDateString('de-DE')}</span>
                  )}
                  {params.aktiv === false && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-500/60 text-white">
                      Abgegeben {params.aufgabedatum ? new Date(params.aufgabedatum).toLocaleDateString('de-DE') : ''}
                    </span>
                  )}
                  {params.aktiv !== false && eigeneAufgaben.length > 0 && (
                    <button onClick={() => setActiveTab('uebersicht')}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${eigeneAufgaben.some(a => a.priority === 'rot') ? 'bg-red-500/25 text-red-200' : eigeneAufgaben.some(a => a.priority === 'gelb') ? 'bg-amber-500/25 text-amber-200' : 'bg-white/10 text-white/80'}`}>
                      {eigeneAufgaben.length} offene{eigeneAufgaben.length === 1 ? 'r Punkt' : ' Punkte'}
                    </button>
                  )}
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white truncate">{params.name || 'Mietimmobilie'}</h2>
                {(params.plz || params.adresse) && (
                  <p className="text-slate-300 text-sm mt-0.5 flex items-center gap-1"><MapPin size={12}/> {params.plz} {params.adresse}</p>
                )}
                {(() => {
                  const eckdaten = [
                    params.wohnflaeche ? `${params.wohnflaeche} m²` : null,
                    Number(params.zimmer) > 0 ? `${params.zimmer} Zimmer` : null, // B13: −1/0 = unbekannt → ausblenden
                    params.anzahlZimmerVermietet ? `${params.anzahlZimmerVermietet} untervermietet` : null,
                    params.mietvertragStart ? `Hauptmietvertrag seit ${new Date(params.mietvertragStart).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}` : null,
                  ].filter(Boolean);
                  return eckdaten.length > 0 ? <p className="text-slate-400 text-xs mt-0.5">{eckdaten.join(' · ')}</p> : null;
                })()}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <ObjektUeberlaufMenu
                  aktiv={params.aktiv}
                  onAufgeben={(datum) => updateParams({ aktiv: false, aufgabedatum: datum })}
                  onReaktivieren={() => updateParams({ aktiv: true, aufgabedatum: '' })}
                  onLoeschen={onDeleteImmobilie}
                  bestaetigenText="Die Wohnung wird aus dem aktiven Portfolio genommen. Daten bleiben für den Steuerexport erhalten."
                />
                {onEdit && (
                  <button onClick={() => setActiveTab('objekt')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-xl text-sm font-semibold transition-colors"
                    title="Stammdaten bearbeiten">
                    Bearbeiten
                  </button>
                )}
                {hasChanges && (
                  <button onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm transition-colors">
                    Speichern
                  </button>
                )}
<button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"><X size={20}/></button>
              </div>
            </div>
          </div>
          {/* KPI Strip — im Cockpit groß, sonst kompakte Zeile */}
          {activeTab !== 'uebersicht' ? (
            <KennzahlenZeile eintraege={[
              ['Cashflow', `${monatsCashflow >= 0 ? '+' : ''}${formatCurrency(monatsCashflow)}/Mo`, monatsCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'],
              ['Jährlich', `${jahresCashflow >= 0 ? '+' : ''}${formatCurrency(jahresCashflow)}`],
              ['Bisher', formatCurrency(bisherigeCashflowGesamt)],
            ]} />
          ) : (
          <div className="grid grid-cols-3 bg-white border-b border-gray-200 divide-x divide-gray-100">
            <div className="px-2 sm:px-5 py-2 sm:py-3">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Monatl.</div>
              <div className={`text-sm sm:text-xl font-black ${monatsCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {monatsCashflow >= 0 ? '+' : ''}{formatCurrency(monatsCashflow)}
              </div>
            </div>
            <div className="px-2 sm:px-5 py-2 sm:py-3">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Jährlich</div>
              <div className={`text-sm sm:text-xl font-black ${jahresCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow)}
              </div>
            </div>
            <div className="px-2 sm:px-5 py-2 sm:py-3">
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Bisher gesamt</div>
              <div className="text-sm sm:text-xl font-black text-emerald-700">
                {bisherigeCashflowGesamt >= 0 ? '+' : ''}{formatCurrency(bisherigeCashflowGesamt)}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400">{monateSeitStart} Mo.</div>
            </div>
          </div>
          )}
          {/* Tab-Navigation — Abschnitt 2: Cockpit · Zahlen · Vermietung · Objekt */}
          {(() => {
            const anzahlMieter = mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length;
            const GRUPPEN = [
              { id: 'uebersicht', icon: <BarChart3 size={13}/>, label: 'Cockpit', first: 'uebersicht', subs: null },
              { id: 'zahlen', icon: <Wallet size={13}/>, label: 'Zahlen', first: 'cashflow', subs: [
                { id: 'cashflow', label: 'Cashflow' }, { id: 'steuern', label: 'Steuern' },
              ] },
              { id: 'vermietung', icon: <User size={13}/>, label: 'Vermietung', first: 'mieteingaenge', subs: [
                { id: 'mieteingaenge', label: 'Mieteingänge' }, { id: 'mieter', label: anzahlMieter > 0 ? `Mieter (${anzahlMieter})` : 'Mieter' },
              ] },
              { id: 'objekt', icon: <FileText size={13}/>, label: 'Objekt', first: 'objekt', subs: null },
            ];
            const aktiv = GRUPPEN.find(g => g.id === activeTab || g.subs?.some(x => x.id === activeTab) || (g.id === 'objekt' && activeTab === 'dokumente')) || GRUPPEN[0];
            return <DetailNavigation gruppen={GRUPPEN} aktiveGruppeId={aktiv.id} activeTab={activeTab} onSelect={setActiveTab} />;
          })()}
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6 bg-canvas">
          {/* Mieteingänge Tab */}
          {activeTab === 'mieteingaenge' && (() => {
            // Angepasste params für MieteinnahmenTracker:
            // - kaltmiete = Gesamt-Einnahmen aus Untervermietung (N × Zimmermiete)
            // - mietAnpassungen auf Kaltmiete-Format mappen (historisch korrekte Erwartungsbeträge)
            const anpassungenFuerTracker = (params.mietAnpassungen || []).map(anp => ({
              datum: anp.datum,
              kaltmiete: anp.untermieteProZimmer != null
                ? (anp.untermieteProZimmer * params.anzahlZimmerVermietet)
                : undefined,
            })).filter(a => a.kaltmiete != null);

            // Basis-Einnahmen ohne Anpassungen — damit der Fallback in getMieteForMonat
            // für Monate VOR der ersten Anpassung den richtigen (alten) Wert nimmt.
            const basisEinnahmen = params.anzahlZimmerVermietet * params.untermieteProZimmer;

            const trackerParams = {
              ...params,
              kaltmiete: basisEinnahmen,
              vermietungsmodell: 'warmmiete',
              // dauerauftrag + dauerauftragBetrag aus params — NICHT überschreiben
              nebenkostenVomMieter: 0,
              mietEingaenge: params.mietEingaenge || [],
              mietAnpassungen: anpassungenFuerTracker,
            };

            const trackerImmo = {
              ...immobilie,
              kaufdatum: params.mietvertragStart || immobilie.kaufdatum || null,
            };

            return (
              <div>
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                  <Lightbulb size={16} className="text-emerald-700 flex-shrink-0"/>
                  <p className="text-xs text-emerald-800">
                    Hier trackst du die eingehenden Zahlungen deiner Untermieter. Erwartet werden monatlich <strong>{formatCurrency(einnahmen)}</strong> ({params.anzahlZimmerVermietet} Zimmer × {formatCurrency(aktUntermiete)}).
                  </p>
                </div>
                <MieteinnahmenTracker
                  params={trackerParams}
                  updateParams={(neu) => {
                    // Mieteingänge sofort speichern — rückwirkendes Abhaken soll nicht an
                    // einem vergessenen "Speichern" scheitern
                    const upd = { mietEingaenge: neu.mietEingaenge, dauerauftrag: neu.dauerauftrag, dauerauftragBetrag: neu.dauerauftragBetrag };
                    setParams(prev => ({ ...prev, ...upd }));
                    onSave({ ...immobilie, ...params, ...upd });
                  }}
                  immobilie={trackerImmo}
                  mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id)}
                />
                <div className="mt-6">
                  <NachforderungenManager
                    liste={params.nachforderungen || []}
                    onChange={(liste) => {
                      setParams(prev => ({ ...prev, nachforderungen: liste }));
                      onSave({ ...immobilie, ...params, nachforderungen: liste });
                    }}
                    mieterNamen={mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).map(m => m.name).filter(Boolean)}
                  />
                </div>
              </div>
            );
          })()}

          {/* Cashflow Tab */}
          {activeTab === 'cashflow' && (
            // Abschnitt 3.3 + Leitsatz 1: Ergebnisse über bzw. neben den Eingaben.
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
              <div className="order-1 lg:order-2 lg:col-span-2 space-y-4">
          {/* Cashflow-Aufschlüsselung */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 ">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">Cashflow-Aufschlüsselung</h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
                <span className="text-sm text-gray-600">
                  Einnahmen — {params.anzahlZimmerVermietet} Zimmer × {formatCurrency(aktUntermiete)}
                </span>
                <span className="text-sm font-bold text-emerald-600">+{formatCurrency(einnahmen)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
                <span className="text-sm text-gray-600">Eigene Warmmiete</span>
                <span className="text-sm font-bold text-red-500">−{formatCurrency(aktWarmmiete)}</span>
              </div>
              {zusatzkosten > 0 && (
                <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
                  <span className="text-sm text-gray-600">
                    Nebenkosten
                    <span className="text-xs text-gray-400 ml-2">
                      {arbitrageKostenText(params, formatCurrency)}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-red-500">−{formatCurrency(zusatzkosten)}</span>
                </div>
              )}
              <div className={`flex justify-between items-center pt-3 font-black text-base ${monatsCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <span>= Monatlicher Cashflow</span>
                <span>{monatsCashflow >= 0 ? '+' : ''}{formatCurrency(monatsCashflow)}</span>
              </div>
            </div>
          </div>

                <ArbitrageCashflow params={params} />
              </div>
              <div className="order-2 lg:order-1 lg:col-span-3">
            {/* Finanzdaten */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1"><Wallet size={14}/> Arbitrage-Kalkulation</h3>
              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <label className="block text-sm font-medium text-red-700 mb-1">Eigene Warmmiete (€/Monat)</label>
                  <ZahlInput
                    type="number"
                    value={params.eigeneWarmmiete}
                    onChange={(e) => updateParams({ eigeneWarmmiete: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg font-semibold"
                  />
                  <p className="text-xs text-red-600 mt-1">Die Miete, die du an den Vermieter zahlst</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <label className="block text-sm font-medium text-green-700 mb-2">Untervermietung</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Vermietete Zimmer</label>
                      <ZahlInput
                        type="number"
                        value={params.anzahlZimmerVermietet}
                        onChange={(e) => updateParams({ anzahlZimmerVermietet: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="0"
                        max={params.zimmer}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Miete pro Zimmer (€)</label>
                      <ZahlInput
                        type="number"
                        value={params.untermieteProZimmer}
                        onChange={(e) => updateParams({ untermieteProZimmer: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Einnahmen: {params.anzahlZimmerVermietet} × {formatCurrency(aktUntermiete)} = <strong>{formatCurrency(einnahmen)}</strong>
                    {aktUntermiete !== params.untermieteProZimmer && (
                      <span className="text-gray-400 ml-1">(Basis: {formatCurrency(params.untermieteProZimmer)} → Anpassung aktiv)</span>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Settings size={14}/> Zusätzliche Kosten</label>
                  <p className="text-[11px] text-gray-500 mb-2">Pro Position: Betrag im Monat und wer ihn zahlt. Zahlt dein Untermieter oder die Firma direkt, zählt die Position nicht als deine Kosten — auch rückwirkend ab einem Datum.</p>
                  <div className="space-y-2">
                    {[
                      ['arbitrageStrom', 'Strom', 0],
                      ['arbitrageHeizung', 'Heizung (eigener Vertrag)', 0],
                      ['arbitrageInternet', 'Internet', 0],
                      ['arbitrageGEZ', 'Rundfunkbeitrag', 18.36],
                      ['arbitrageSonstige', 'Weitere Kosten (z. B. Reinigung)', 0],
                    ].map(([feld, label, std]) => (
                      <div key={feld} className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-xs font-semibold text-gray-700">{label}</label>
                          <div className="flex items-center gap-1">
                            <ZahlInput type="number" min="0" step="0.01"
                              value={feld === 'arbitrageGEZ' ? (params.arbitrageGEZ ?? std) : (params[feld] || 0)}
                              onChange={(e) => updateParams({ [feld]: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 text-base sm:text-sm text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                            <span className="text-xs text-gray-400">€</span>
                          </div>
                        </div>
                        <KostenZahler params={params} feld={feld} onChange={(kz) => updateParams({ kostenZahler: kz })} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Deine Kosten heute: <strong>{formatCurrency(zusatzkosten)}</strong>/Monat · <strong>{formatCurrency(zusatzkosten * 12)}</strong>/Jahr
                  </p>
                </div>

                {/* Mietanpassungen */}
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-yellow-800 flex items-center gap-1"><CalendarDays size={13}/> Mietanpassungen</label>
                    <button
                      type="button"
                      onClick={() => {
                        const neu = { datum: new Date().toISOString().split('T')[0], eigeneWarmmiete: params.eigeneWarmmiete, untermieteProZimmer: params.untermieteProZimmer };
                        updateParams({ mietAnpassungen: [...(params.mietAnpassungen || []), neu] });
                      }}
                      className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-2 py-1 rounded"
                    >
                      + Anpassung
                    </button>
                  </div>
                  <p className="text-[10px] text-yellow-700 mb-2">Trage Änderungen an deiner Miete oder Untermiete mit Datum ein – wird für den korrekten Steuerexport verwendet.</p>
                  {(params.mietAnpassungen || []).length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic bg-white p-2 rounded border border-yellow-100">Keine Anpassungen → aktuelle Werte gelten durchgehend</p>
                  ) : (
                    <div className="space-y-2">
                      {(params.mietAnpassungen || [])
                        .map((anp, originalIdx) => ({ ...anp, originalIdx }))
                        .sort((a, b) => new Date(a.datum) - new Date(b.datum))
                        .map((anp) => (
                          <div key={anp.originalIdx} className="bg-white rounded border border-yellow-200 p-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] text-gray-500 w-10 shrink-0">Datum</span>
                              <input
                                type="date"
                                value={anp.datum}
                                onChange={(e) => {
                                  const neu = [...(params.mietAnpassungen || [])];
                                  neu[anp.originalIdx] = { ...neu[anp.originalIdx], datum: e.target.value };
                                  updateParams({ mietAnpassungen: neu });
                                }}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const neu = (params.mietAnpassungen || []).filter((_, i) => i !== anp.originalIdx);
                                  updateParams({ mietAnpassungen: neu });
                                }}
                                className="text-red-400 hover:text-red-600 px-1 shrink-0"
                              >
                                <X size={12}/>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-600 shrink-0">Warmmiete</span>
                                <ZahlInput
                                  type="number"
                                  value={anp.eigeneWarmmiete ?? ''}
                                  placeholder="—"
                                  onChange={(e) => {
                                    const neu = [...(params.mietAnpassungen || [])];
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                    neu[anp.originalIdx] = { ...neu[anp.originalIdx], eigeneWarmmiete: val };
                                    updateParams({ mietAnpassungen: neu });
                                  }}
                                  className="w-full text-xs border border-red-200 rounded px-1 py-0.5 text-right"
                                />
                                <span className="text-[10px] text-gray-400">€</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-green-600 shrink-0">Untermiete</span>
                                <ZahlInput
                                  type="number"
                                  value={anp.untermieteProZimmer ?? ''}
                                  placeholder="—"
                                  onChange={(e) => {
                                    const neu = [...(params.mietAnpassungen || [])];
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                    neu[anp.originalIdx] = { ...neu[anp.originalIdx], untermieteProZimmer: val };
                                    updateParams({ mietAnpassungen: neu });
                                  }}
                                  className="w-full text-xs border border-green-200 rounded px-1 py-0.5 text-right"
                                />
                                <span className="text-[10px] text-gray-400">€</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
              </div>
            </div>
          )}

          {/* Steuern Tab */}
          {activeTab === 'steuern' && (
            <ArbitrageSteuern
              params={params}
              onUpdateParams={(neu) => updateParams(neu)}
            />
          )}

          {/* Mieter Tab */}
          {activeTab === 'mieter' && (
            <MieterDashboard
              mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id)}
              portfolio={[immobilie]}
              onDelete={onDeleteMieter}
              onSave={onSaveMieter}
              nkAbrechnungen={nkAbrechnungen}
              onSaveNK={onSaveNK}
              onDeleteNK={onDeleteNK}
              onMieteingaengeClick={() => setActiveTab('mieteingaenge')}
            />
          )}
          {/* ── COCKPIT (Abschnitt 3.2) — nur lesen und handeln ─────────────────
              Die Eingaben (Kalkulation, Mietanpassungen, Stammdaten) sind nach
              Zahlen · Cashflow bzw. Objekt gewandert (Leitsatz 2). */}
          {activeTab === 'uebersicht' && (() => {
            const MONATE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
            const jahr = heute.getFullYear();
            const startJahr = mietvertragStart ? mietvertragStart.getFullYear() : jahr;
            const startMonat = mietvertragStart ? mietvertragStart.getMonth() + 1 : 1;
            const aktiveUntermieter = mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false);
            const bucheMonat = (monatNr) => {
              const datum = new Date(jahr, monatNr - 1, Math.min(heute.getDate(), 28)).toISOString().split('T')[0];
              const neu = { ...params, mietEingaenge: [...(params.mietEingaenge || []), { id: Date.now(), datum, betrag: einnahmen, typ: 'kaltmiete', notiz: '' }] };
              setParams(neu);
              onSave({ ...immobilie, ...neu });
            };
            return (
            <div className="space-y-4">
              {/* Jetzt dran — je Aufgabe die passende Handlung (Teil 1) */}
              {(() => {
                const hinweise = [...eigeneAufgaben];
                if (vertragsende && !vertragsBeendet && (vertragsende - heute) / (1000 * 60 * 60 * 24 * 30.44) <= 6) {
                  hinweise.unshift({ id: 'hauptmietvertrag-ende', priority: 'gelb', titel: `Hauptmietvertrag endet am ${vertragsende.toLocaleDateString('de-DE')}`, sub: 'Untermieter rechtzeitig informieren', targetTab: 'objekt' });
                }
                return (
                  <JetztDran aufgaben={hinweise} onAlle={onAlleErinnerungen} handler={{
                    onOeffnen: (tab) => setActiveTab(MIET_TAB_MAP[tab] ?? (tab === 'mieteinnahmen' ? 'mieteingaenge' : tab)),
                    // Untermiete des laufenden Monats direkt abhaken
                    onEingegangen: einnahmen > 0 ? () => bucheMonat(heute.getMonth() + 1) : null,
                    onFelder: (felder) => { setParams(prev => ({ ...prev, ...felder })); onSave({ ...immobilie, ...params, ...felder }); },
                  }} />
                );
              })()}

              {/* Mieteingänge — 12 Monatsfelder, Klick bucht direkt */}
              {!vertragsBeendet && einnahmen > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mieteingänge {jahr}</p>
                    <button onClick={() => setActiveTab('mieteingaenge')} className="text-xs font-semibold text-indigo-600 hover:underline">Alle ansehen →</button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                    {MONATE.map((name, idx) => {
                      const m = idx + 1;
                      const vorStart = jahr === startJahr && m < startMonat || jahr < startJahr;
                      const zukunft = m > heute.getMonth() + 1;
                      if (vorStart || zukunft) return <div key={m} className="rounded-lg border border-dashed border-gray-200 py-2 text-center text-[10px] text-gray-300">{name}</div>;
                      const st = berechneMietStatusFuerMonat(params.mietEingaenge, jahr, m, einnahmen, params.dauerauftrag).status;
                      const ok = st === 'bezahlt' || st === 'dauerauftrag';
                      const nochNichtFaellig = jahr === heute.getFullYear() && m === heute.getMonth() + 1 && heute.getDate() <= (params.mieteFaelligkeitstag ?? 3);
                      return (
                        <button key={m} onClick={() => { if (!ok) bucheMonat(m); }}
                          title={ok ? 'Eingegangen' : nochNichtFaellig ? `Fällig am ${params.mieteFaelligkeitstag ?? 3}. — klicken zum Abhaken` : 'Überfällig — klicken zum Abhaken'}
                          className={`rounded-lg py-2 text-center text-[10px] font-bold transition-colors ${ok ? 'bg-emerald-100 text-emerald-700' : st === 'teilweise' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : nochNichtFaellig ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  {/* Cashflow pro Monat */}
                  <button onClick={() => setActiveTab('cashflow')} className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cashflow pro Monat</p>
                      <span className="text-xs text-indigo-600 font-semibold">Details anzeigen →</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div><div className="text-[10px] text-gray-400">Einnahmen</div><div className="text-sm font-bold text-emerald-600">{formatCurrency(einnahmen)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Eigene Miete</div><div className="text-sm font-bold text-red-500">-{formatCurrency(vertragsBeendet ? 0 : aktWarmmiete)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Nebenkosten</div><div className="text-sm font-bold text-red-500">-{formatCurrency(zusatzkosten)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Ergebnis</div><div className={`text-base font-black ${monatsCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{monatsCashflow >= 0 ? '+' : ''}{formatCurrency(monatsCashflow)}</div></div>
                    </div>
                  </button>

                  {/* Bisher & Prognose (nur lesen) */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-3">Bisher & Prognose</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                      <div><div className="text-[10px] text-gray-400">Bisher ({monateSeitStart} Mo.)</div><div className="text-sm font-bold text-emerald-700">{formatCurrency(bisherigeCashflowGesamt)}</div></div>
                      {[[1,'1 Jahr'],[2,'2 Jahre'],[3,'3 Jahre'],[5,'5 Jahre']].map(([mult, label]) => (
                        <div key={mult}><div className="text-[10px] text-gray-400">{label}</div><div className={`text-sm font-bold ${jahresCashflow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow * mult)}</div></div>
                      ))}
                    </div>
                  </div>

                  {/* Mieter */}
                  <button onClick={() => setActiveTab('mieter')} className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><User size={12}/> Untermieter · {aktiveUntermieter.length}/{params.anzahlZimmerVermietet || 0} Zimmer</p>
                      <span className="text-xs text-indigo-600 font-semibold">Details →</span>
                    </div>
                    {aktiveUntermieter.length === 0 ? (
                      <p className="text-sm text-gray-400">Noch keine Untermieter erfasst.</p>
                    ) : (
                      <div className="divide-y divide-gray-50 text-sm">
                        {aktiveUntermieter.map(m => (
                          <div key={m.id} className="flex items-center justify-between gap-2 py-1.5">
                            <span className="font-semibold text-gray-800 truncate">{m.name}</span>
                            <span className="text-gray-500 truncate">{m.zimmer_bezeichnung || ''}</span>
                            <span className="text-gray-500 shrink-0">{m.mietbeginn ? `seit ${new Date(m.mietbeginn).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}` : ''}</span>
                            <span className="font-semibold text-gray-700 shrink-0">{Number(m.kaltmiete) > 0 ? formatCurrency(Number(m.kaltmiete)) : '—'}</span>
                            <span className="text-[10px] shrink-0">{Number(m.kaution_betrag) > 0 ? (m.kaution_bezahlt ? <span className="text-emerald-600">Kaution ✓</span> : <span className="text-red-500">Kaution offen</span>) : <span className="text-gray-300">keine Kaution</span>}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                </div>

                {/* Hauptmietvertrag — rechte Spalte (bei der Mietimmobilie statt Finanzierung) */}
                <button onClick={() => setActiveTab('objekt')} className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors h-fit">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Hauptmietvertrag</p>
                    <span className="text-xs text-indigo-600 font-semibold">Öffnen →</span>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div><span className="text-[10px] text-gray-400 block">Eigene Warmmiete</span><span className="text-lg font-black text-gray-800">{formatCurrency(aktWarmmiete)}</span></div>
                    <div><span className="text-[10px] text-gray-400 block">Seit</span><span className="font-semibold">{mietvertragStart ? mietvertragStart.toLocaleDateString('de-DE') : '—'}</span></div>
                    <div><span className="text-[10px] text-gray-400 block">Endet</span><span className={`font-semibold ${vertragsBeendet ? 'text-red-600' : ''}`}>{vertragsende ? vertragsende.toLocaleDateString('de-DE') : 'unbefristet'}</span></div>
                  </div>
                </button>
              </div>
            </div>
            );
          })()}

          {/* ── OBJEKT — Abschnitt 3.9: eine Seite mit Sprungleiste links ── */}
          {(activeTab === 'objekt' || activeTab === 'dokumente') && (
            <div className="lg:flex lg:gap-6 lg:items-start">
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mb-5 lg:mb-0 lg:w-48 lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
                {[['miet-objekt-stammdaten', 'Stammdaten & Mietvertrag'], ['miet-objekt-dokumente', 'Dokumente']].map(([anchorId, label]) => (
                  <button key={anchorId}
                    onClick={() => document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors whitespace-nowrap lg:text-left">
                    {label}
                  </button>
                ))}
              </nav>
              <div className="flex-1 min-w-0 space-y-5">
                <div id="miet-objekt-stammdaten">
            {/* Grunddaten */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1"><MapPin size={14}/> Stammdaten & Hauptmietvertrag</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name/Bezeichnung</label>
                  <input
                    type="text"
                    value={params.name}
                    onChange={(e) => updateParams({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    placeholder="z.B. Mitarbeiter-WG München"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">PLZ</label>
                    <input
                      type="text"
                      value={params.plz}
                      onChange={(e) => updateParams({ plz: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mietvertrag seit</label>
                    <input
                      type="date"
                      value={params.mietvertragStart}
                      onChange={(e) => updateParams({ mietvertragStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mietvertragsende</label>
                    <input
                      type="date"
                      value={params.mietvertragEnde}
                      onChange={(e) => updateParams({ mietvertragEnde: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${vertragsBeendet ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {params.mietvertragEnde && (
                      <button
                        type="button"
                        onClick={() => updateParams({ mietvertragEnde: '' })}
                        className="text-xs text-gray-400 hover:text-red-500 mt-1 flex items-center gap-1"
                      >
                        <X size={12}/> Datum entfernen
                      </button>
                    )}
                  </div>
                  <div className="flex items-end pb-2">
                    {vertragsBeendet && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                        Cashflow wird ab Vertragsende nicht mehr berechnet.
                      </div>
                    )}
                    {vertragsende && !vertragsBeendet && (
                      <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                        Noch {Math.ceil((vertragsende - heute) / (1000 * 60 * 60 * 24 * 30))} Monate verbleibend.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={params.adresse}
                    onChange={(e) => updateParams({ adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    placeholder="Musterstraße 123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Wohnfläche (m²)</label>
                    <ZahlInput
                      type="number"
                      value={params.wohnflaeche}
                      onChange={(e) => updateParams({ wohnflaeche: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gesamtzahl Zimmer</label>
                    <ZahlInput
                      type="number"
                      value={Number(params.zimmer) > 0 ? params.zimmer : ""}
                      onChange={(e) => { const v = parseInt(e.target.value); updateParams({ zimmer: v >= 1 ? v : '' }); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

                </div>
                <div id="miet-objekt-dokumente">
                  <ArbitrageDokumenteTab
                    immobilie={immobilie}
                    dokumente={params.dokumente || []}
                    onDokumentUpdate={async (neueDokumente) => {
                      const updated = { ...params, dokumente: neueDokumente };
                      updateParams({ dokumente: neueDokumente });
                      await onSave({ ...immobilie, ...updated });
                      setHasChanges(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MietimmobilieDetail;
