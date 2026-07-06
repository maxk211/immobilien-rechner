import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleWarmmiete, getAktuelleUntermiete, berechneHistorischenArbitrageCashflow } from '../utils/miete.js';
import MieterDashboard from './MieterDashboard';
import MieteinnahmenTracker from './MieteinnahmenTracker';
import ArbitrageCashflow from './ArbitrageCashflow';
import ArbitrageSteuern from './ArbitrageSteuern';
import { uploadDokument, deleteDokument, getDokumentUrl } from '../supabaseClient';

// ─── Dokumente-Tab (Arbitrage) ────────────────────────────────────────────────
const ARB_DOK_TYPEN = ['Hauptmietvertrag', 'Untermietvertrag', 'Stromvertrag', 'WLAN-Vertrag', 'GEZ-Dokument', 'Übergabeprotokoll', 'Kaution', 'Versicherung', 'Sonstiges'];
const ARB_DOK_ICONS = {
  'Hauptmietvertrag': '📋', 'Untermietvertrag': '📄', 'Stromvertrag': '⚡',
  'WLAN-Vertrag': '🌐', 'GEZ-Dokument': '📺', 'Übergabeprotokoll': '🔑',
  'Kaution': '💰', 'Versicherung': '🛡️', 'Sonstiges': '📎',
};

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
          <h3 className="text-base font-bold text-slate-800">📎 Dokumente</h3>
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
              {ARB_DOK_ICONS[t]} {t}
            </button>
          ))}
        </div>

        <label className={`flex flex-col items-center justify-center gap-2 cursor-pointer py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
            {uploading ? '⏳' : '📤'}
          </div>
          <p className="text-sm font-semibold text-slate-700">{uploading ? 'Wird hochgeladen…' : 'Datei hochladen'}</p>
          <p className="text-xs text-slate-400">{uploading ? 'Bitte warten' : 'Klicken oder Datei hierher ziehen · max. 20 MB'}</p>
          <input type="file" multiple className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.zip"
            onChange={e => handleFiles(e.target.files)} />
        </label>

        {uploadFehler && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">⚠️ {uploadFehler}</div>
        )}
      </div>

      {/* Dokumentenliste — nach Typ gruppiert */}
      {dokumente.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-4xl mb-2">🗂️</p>
          <p className="text-sm font-medium">Noch keine Dokumente hochgeladen</p>
          <p className="text-xs mt-1">Lade deinen Mietvertrag, Untermietverträge, Strom- & WLAN-Verträge hoch</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gruppen.map(({ typ, liste }) => (
            <div key={typ}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{ARB_DOK_ICONS[typ] || '📎'}</span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{typ}</span>
                <span className="text-xs text-slate-400">({liste.length})</span>
              </div>
              <div className="space-y-1.5">
                {[...liste].reverse().map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-emerald-200 hover:shadow-sm transition-all group">
                    <span className="text-lg flex-shrink-0">{ARB_DOK_ICONS[doc.typ] || '📎'}</span>
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
                        {ladeId === doc.id ? '⏳' : '⬇️'}
                      </button>
                      <button onClick={() => handleDelete(doc)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" title="Löschen">
                        🗑️
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

const MietimmobilieDetail = ({ immobilie, onClose, onSave, mieterListe = [], onSaveMieter, onDeleteMieter, nkAbrechnungen = [], onSaveNK, onDeleteNK, portfolio = [] }) => {
  const [params, setParams] = useState({
    eigeneWarmmiete: immobilie.eigeneWarmmiete || 1500,
    anzahlZimmerVermietet: immobilie.anzahlZimmerVermietet || 3,
    untermieteProZimmer: immobilie.untermieteProZimmer || 600,
    // Aufgeschlüsselte Kosten für Steuerberater
    arbitrageStrom: immobilie.arbitrageStrom || 0,
    arbitrageInternet: immobilie.arbitrageInternet || 0,
    arbitrageGEZ: immobilie.arbitrageGEZ ?? 18.36,
    wohnflaeche: immobilie.wohnflaeche || 80,
    zimmer: immobilie.zimmer || 4,
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
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('uebersicht');

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
  const zusatzkosten = vertragsBeendet ? 0 : (params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36);
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
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">🔄 Arbitrage</span>
                  {vertragsBeendet && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/80 text-white">🔴 Vertrag beendet {new Date(params.mietvertragEnde).toLocaleDateString('de-DE')}</span>
                  )}
                  {vertragsende && !vertragsBeendet && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/80 text-amber-900">⏳ Endet {new Date(params.mietvertragEnde).toLocaleDateString('de-DE')}</span>
                  )}
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white truncate">{params.name || 'Mietimmobilie'}</h2>
                {(params.plz || params.adresse) && (
                  <p className="text-emerald-100 text-sm mt-0.5">📍 {params.plz} {params.adresse}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {hasChanges && (
                  <button onClick={handleSave}
                    className="px-4 py-2 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 font-bold text-sm shadow-sm transition-colors">
                    Speichern
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white text-2xl leading-none">&times;</button>
              </div>
            </div>
          </div>
          {/* KPI Strip */}
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
          {/* Tab-Navigation */}
          <div className="overflow-x-auto flex-shrink-0">
            <div className="flex gap-1 bg-slate-100 p-1 min-w-max">
              {[
                { id: 'uebersicht', label: '📊 Übersicht' },
                { id: 'mieteingaenge', label: '💶 Eingänge' },
                { id: 'cashflow', label: '📈 Cashflow' },
                { id: 'steuern', label: '🧾 Steuern' },
                { id: 'dokumente', label: `📎 Dokumente${params.dokumente?.length > 0 ? ` (${params.dokumente.length})` : ''}` },
                { id: 'mieter', label: `👤 Mieter${mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length > 0 ? ` (${mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length})` : ''}` },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 sm:px-4 text-[11px] sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6">
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
                  <span className="text-base">💡</span>
                  <p className="text-xs text-emerald-800">
                    Hier trackst du die eingehenden Zahlungen deiner Untermieter. Erwartet werden monatlich <strong>{formatCurrency(einnahmen)}</strong> ({params.anzahlZimmerVermietet} Zimmer × {formatCurrency(aktUntermiete)}).
                  </p>
                </div>
                <MieteinnahmenTracker
                  params={trackerParams}
                  updateParams={(neu) => updateParams({
                    mietEingaenge: neu.mietEingaenge,
                    dauerauftrag: neu.dauerauftrag,
                    dauerauftragBetrag: neu.dauerauftragBetrag,
                  })}
                  immobilie={trackerImmo}
                  mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id)}
                />
              </div>
            );
          })()}

          {/* Cashflow Tab */}
          {activeTab === 'cashflow' && (
            <ArbitrageCashflow params={params} />
          )}

          {/* Steuern Tab */}
          {activeTab === 'steuern' && (
            <ArbitrageSteuern
              params={params}
              onUpdateParams={(neu) => updateParams(neu)}
            />
          )}

          {/* Dokumente Tab */}
          {activeTab === 'dokumente' && (
            <ArbitrageDokumenteTab
              immobilie={immobilie}
              dokumente={params.dokumente || []}
              onDokumentUpdate={async (neueDokumente) => {
                const updated = { ...params, dokumente: neueDokumente };
                updateParams({ dokumente: neueDokumente });
                await onSave({ ...immobilie, ...updated });
              }}
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
            />
          )}
          {activeTab === 'uebersicht' && <>
          {/* Cashflow-Aufschlüsselung */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6">
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
                      Strom {formatCurrency(params.arbitrageStrom||0)} · Internet {formatCurrency(params.arbitrageInternet||0)} · GEZ {formatCurrency(params.arbitrageGEZ??18.36)}
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

          {/* Bearbeitungsbereich */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Grunddaten */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">📍 Grunddaten</h3>
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
                        className="text-xs text-gray-400 hover:text-red-500 mt-1"
                      >
                        ✕ Datum entfernen
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
                    <input
                      type="number"
                      value={params.wohnflaeche}
                      onChange={(e) => updateParams({ wohnflaeche: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gesamtzahl Zimmer</label>
                    <input
                      type="number"
                      value={params.zimmer}
                      onChange={(e) => updateParams({ zimmer: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Finanzdaten */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">💰 Arbitrage-Kalkulation</h3>
              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <label className="block text-sm font-medium text-red-700 mb-1">Eigene Warmmiete (€/Monat)</label>
                  <input
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
                      <input
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
                      <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">📊 Zusätzliche Kosten (für Steuerberater)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">⚡ Strom</label>
                      <input
                        type="number"
                        value={params.arbitrageStrom || 0}
                        onChange={(e) => updateParams({ arbitrageStrom: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">🌐 Internet</label>
                      <input
                        type="number"
                        value={params.arbitrageInternet || 0}
                        onChange={(e) => updateParams({ arbitrageInternet: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">📺 GEZ</label>
                      <input
                        type="number"
                        value={params.arbitrageGEZ ?? 18.36}
                        onChange={(e) => updateParams({ arbitrageGEZ: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="18.36"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Summe: <strong>{formatCurrency(zusatzkosten)}</strong>/Monat · <strong>{formatCurrency(zusatzkosten * 12)}</strong>/Jahr
                  </p>
                </div>

                {/* Mietanpassungen */}
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-yellow-800">📅 Mietanpassungen</label>
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
                                className="text-red-400 hover:text-red-600 text-xs px-1 shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-600 shrink-0">Warmmiete</span>
                                <input
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
                                <input
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

          {/* Prognose */}
          <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">📈 Kumulierter Cashflow</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[[1,'1 Jahr'],[2,'2 Jahre'],[3,'3 Jahre'],[5,'5 Jahre']].map(([mult, label]) => (
                <div key={mult} className={`rounded-xl p-4 text-center border ${jahresCashflow >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="text-xs text-gray-400 font-medium mb-1">{label}</div>
                  <div className={`text-lg font-black ${jahresCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow * mult)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>}
        </div>
      </div>
    </div>
  );
};

export default MietimmobilieDetail;
