import { useState, useMemo } from 'react';
import { TabErrorBoundary } from './ErrorBoundary';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete } from '../utils/miete.js';
import { berechneWertsteigerungSeitKauf, berechneRendite } from '../utils/berechnung.js';
import InputSliderCombo from './InputSliderCombo.jsx';
import MieterDashboard from './MieterDashboard';
import KaufnebenkostenManager from './KaufnebenkostenManager';
import MietKostenManager from './MietKostenManager';
import CashflowUebersicht from './CashflowUebersicht';
import Steuerberechnung from './Steuerberechnung';
import ReparaturenInvestitionen from './ReparaturenInvestitionen';
import ZaehlerVerwaltung from './ZaehlerVerwaltung';
import BausparManager from './BausparManager';
import MieteinnahmenTracker from './MieteinnahmenTracker';
import NKAbrechnungTab from './NKAbrechnungTab';
import KautionsManager from './KautionsManager';
import { uploadDokument, deleteDokument, getDokumentUrl } from '../supabaseClient';

// ─── Dokumente-Tab ────────────────────────────────────────────────────────────
const DOK_TYPEN = ['Kaufvertrag', 'Mietvertrag', 'NK-Abrechnung', 'Grundriss', 'Energieausweis', 'Versicherung', 'Handwerker-Rechnung', 'Fotos', 'Sonstiges'];
const DOK_ICONS = { 'Kaufvertrag': '📜', 'Mietvertrag': '📋', 'NK-Abrechnung': '💡', 'Grundriss': '🏗️', 'Energieausweis': '⚡', 'Versicherung': '🛡️', 'Handwerker-Rechnung': '🔧', 'Fotos': '📷', 'Sonstiges': '📎' };

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
        if (file.size > 20 * 1024 * 1024) {
          setUploadFehler(`"${file.name}" ist zu groß (max. 20 MB)`);
          continue;
        }
        const meta = await uploadDokument(immobilie.id, file, gewaehltTyp);
        neueDokumente.push(meta);
      }
      if (neueDokumente.length > 0) {
        onDokumentUpdate([...dokumente, ...neueDokumente]);
      }
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
    } catch (e) {
      alert(`Fehler: ${e.message}`);
    } finally {
      setLadeId(null);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`"${doc.name}" wirklich löschen?`)) return;
    try {
      await deleteDokument(doc.path);
      onDokumentUpdate(dokumente.filter(d => d.id !== doc.id));
    } catch (e) {
      alert(`Löschen fehlgeschlagen: ${e.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">📎 Dokumente</h3>
          <p className="text-xs text-slate-500 mt-0.5">Verträge, Abrechnungen & Unterlagen zur Immobilie</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-semibold">
          {dokumente.length} Datei{dokumente.length !== 1 ? 'en' : ''}
        </span>
      </div>

      {/* Upload-Bereich */}
      <div
        className="bg-white border-2 border-dashed rounded-xl p-5 space-y-3 transition-colors"
        style={{ borderColor: dragOver ? '#6366f1' : '#cbd5e1', background: dragOver ? '#eef2ff' : undefined }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}>

        {/* Typ-Auswahl */}
        <div className="flex flex-wrap gap-1.5">
          {DOK_TYPEN.map(t => (
            <button key={t} onClick={() => setGewaehltTyp(t)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                gewaehltTyp === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {DOK_ICONS[t]} {t}
            </button>
          ))}
        </div>

        <label className={`flex flex-col items-center justify-center gap-2 cursor-pointer py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-2xl">
            {uploading ? '⏳' : '📤'}
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {uploading ? 'Wird hochgeladen…' : 'Datei hochladen'}
          </p>
          <p className="text-xs text-slate-400">
            {uploading ? 'Bitte warten' : 'Klicken oder Datei hierher ziehen · max. 20 MB'}
          </p>
          <input type="file" multiple className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.zip"
            onChange={e => handleFiles(e.target.files)} />
        </label>

        {uploadFehler && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
            ⚠️ {uploadFehler}
          </div>
        )}
      </div>

      {/* Dokumentenliste */}
      {dokumente.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p className="text-3xl mb-2">🗂️</p>
          <p className="text-sm">Noch keine Dokumente hochgeladen</p>
          <p className="text-xs mt-1">PDF, Bilder, Word- & Excel-Dateien werden unterstützt</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...dokumente].reverse().map(doc => (
            <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <span className="text-xl flex-shrink-0">{DOK_ICONS[doc.typ] || '📎'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{doc.typ}</span>
                  <span className="text-xs text-slate-400">{formatBytes(doc.groesse)}</span>
                  <span className="text-xs text-slate-400">{new Date(doc.hochgeladenAm).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleDownload(doc)} disabled={ladeId === doc.id}
                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                  title="Herunterladen">
                  {ladeId === doc.id ? '⏳' : '⬇️'}
                </button>
                <button onClick={() => handleDelete(doc)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Löschen">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const KaufimmobilieDetail = ({ immobilie, onClose, onSave, mieterListe = [], onSaveMieter, onDeleteMieter, nkAbrechnungen = [], onSaveNK, onDeleteNK, portfolio = [] }) => {
  const initialWert = immobilie.geschaetzterWert || immobilie.kaufpreis;
  const initialQmPreis = immobilie.wohnflaeche > 0 ? Math.round(initialWert / immobilie.wohnflaeche) : 0;

  // Berechne initiale EK-Werte basierend auf altem eigenkapital
  const initKaufnebenkosten = immobilie.kaufpreis * ((immobilie.kaufnebenkosten ?? 10) / 100);
  const initEkFuerNebenkosten = immobilie.ekFuerNebenkosten ?? initKaufnebenkosten;
  const initEkFuerKaufpreis = immobilie.ekFuerKaufpreis ?? (immobilie.eigenkapital ? Math.max(0, immobilie.eigenkapital - initKaufnebenkosten) : 0);

  // ── ALLE HOOKS ZUERST (vor jedem return) ────────────────────────────────────
  const [params, setParams] = useState({
    kaufpreis: immobilie.kaufpreis,
    kaufdatum: immobilie.kaufdatum || '',
    // Objektdetails
    wohnflaeche: immobilie.wohnflaeche || 80,
    zimmer: immobilie.zimmer || 3,
    baujahr: immobilie.baujahr || 2000,
    // Neue EK-Aufteilung
    ekFuerNebenkosten: initEkFuerNebenkosten,
    ekFuerKaufpreis: initEkFuerKaufpreis,
    eigenkapital: immobilie.eigenkapital,
    zinssatz: immobilie.zinssatz ?? 4.0,
    tilgung: immobilie.tilgung ?? 2.0,
    laufzeit: immobilie.laufzeit ?? 25,
    kaltmiete: immobilie.kaltmiete,
    nebenkosten: immobilie.nebenkosten ?? 0,
    instandhaltung: immobilie.instandhaltung ?? 100,
    verwaltung: immobilie.verwaltung ?? 30,
    hausgeld: immobilie.hausgeld ?? 0,
    strom: immobilie.strom ?? 0,
    internet: immobilie.internet ?? 0,
    vermietungsmodell: immobilie.vermietungsmodell || 'kaltmiete',
    nebenkostenVomMieter: immobilie.nebenkostenVomMieter ?? 0,
    wertsteigerung: immobilie.wertsteigerung ?? 2.0,
    mietsteigerung: immobilie.mietsteigerung ?? 1.5,
    kaufnebenkosten: immobilie.kaufnebenkosten ?? 10,
    kaufnebenkostenModus: immobilie.kaufnebenkostenModus || 'prozent',
    kaufnebenkostenPositionen: immobilie.kaufnebenkostenPositionen || null,
    bundesland: immobilie.bundesland || 'bayern',
    finanzierungsbetrag: immobilie.finanzierungsbetrag ?? null,
    finanzierungsphasen: immobilie.finanzierungsphasen || [
      {
        id: 1,
        name: 'Erstfinanzierung',
        zinsbindung: immobilie.laufzeit ?? 10,
        zinssatz: immobilie.zinssatz ?? 4.0,
        tilgung: immobilie.tilgung ?? 2.0,
        sondertilgungJaehrlich: 0,
        aktiv: true
      }
    ],
    geschaetzterWert: initialWert,
    mietModus: immobilie.mietModus || 'automatisch',
    mietHistorie: immobilie.mietHistorie || {},
    mietEingaenge: immobilie.mietEingaenge || [],
    steuersatz: immobilie.steuersatz || 42,
    gebaeudeAnteilProzent: immobilie.gebaeudeAnteilProzent || 80,
    afaSatz: immobilie.afaSatz || 2.0,
    fahrtkostenModus: immobilie.fahrtkostenModus || 'pauschal',
    fahrtenProMonat: immobilie.fahrtenProMonat || 0,
    entfernungKm: immobilie.entfernungKm || 0,
    kmPauschale: immobilie.kmPauschale || 0.30,
    fahrtenListe: immobilie.fahrtenListe || [],
    investitionen: immobilie.investitionen || [],
    aktiv: immobilie.aktiv !== false,
    aufgabedatum: immobilie.aufgabedatum || '',
    mietAnpassungen: immobilie.mietAnpassungen || [],
    dauerauftrag: immobilie.dauerauftrag || false,
    dauerauftragBetrag: immobilie.dauerauftragBetrag || immobilie.kaltmiete || 0,
    zaehler: immobilie.zaehler || [],
    bausparvertraege: immobilie.bausparvertraege || [],
    afaAnpassungen: immobilie.afaAnpassungen || [],
    eigentumsform: immobilie.eigentumsform || 'allein',
    userAnteil: immobilie.userAnteil ?? 100,
    gbrPartner: immobilie.gbrPartner || [],
    stellplatz: immobilie.stellplatz || {
      vorhanden: false,
      typ: 'tiefgarage',
      anzahl: 1,
      kaufpreisAnteil: 0,
      monatlicheMiete: 0,
      istVermietet: true,
    },
    dokumente: immobilie.dokumente || [],
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [qmPreis, setQmPreis] = useState(initialQmPreis.toString());
  const [activeTab, setActiveTab] = useState('uebersicht');

  const updateParams = (newParams) => {
    setParams(newParams);
    setHasChanges(true);
  };

  const handleQmPreisChange = (value) => {
    setQmPreis(value);
    const numValue = parseFloat(value) || 0;
    const flaeche = params.wohnflaeche || immobilie.wohnflaeche || 80;
    if (numValue > 0 && flaeche > 0) {
      const neuerWert = Math.round(numValue * flaeche);
      updateParams({...params, geschaetzterWert: neuerWert});
    }
  };

  const handleGesamtwertChange = (value) => {
    const numValue = parseFloat(value) || 0;
    updateParams({...params, geschaetzterWert: numValue});
    const flaeche = params.wohnflaeche || immobilie.wohnflaeche || 80;
    if (numValue > 0 && flaeche > 0) {
      setQmPreis(Math.round(numValue / flaeche).toString());
    }
  };

  const handleSave = () => {
    const gesamtEK = (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0);
    onSave({ ...immobilie, ...params, eigenkapital: gesamtEK });
    setHasChanges(false);
  };

  const ergebnis = useMemo(() => berechneRendite({ ...params, kaltmiete: getAktuelleMiete(params) }), [params]);
  const aktuellerWert = params.geschaetzterWert || immobilie.kaufpreis;
  const immobilieMitAktuellemKaufdatum = { ...immobilie, kaufdatum: params.kaufdatum };
  const wertsteigerungSeitKauf = berechneWertsteigerungSeitKauf(immobilieMitAktuellemKaufdatum, aktuellerWert);

  const wertentwicklungDaten = useMemo(() => {
    if (!params.kaufdatum || !immobilie.kaufpreis) return [];
    const kaufjahr = new Date(params.kaufdatum).getFullYear();
    const aktuellesJahr = new Date().getFullYear();
    const kaufpreis = immobilie.kaufpreis;
    const wert = aktuellerWert || kaufpreis;
    const wertsteigerungRate = (params.wertsteigerung || 2.0) / 100;
    const jahreSeitKauf = Math.max(0, aktuellesJahr - kaufjahr);
    const daten = [];

    for (let i = 0; i <= jahreSeitKauf; i++) {
      const fortschritt = jahreSeitKauf > 0 ? i / jahreSeitKauf : 1;
      daten.push({
        jahr: kaufjahr + i,
        wert: Math.round(kaufpreis + (wert - kaufpreis) * fortschritt),
        projektion: null,
        kaufpreis: kaufpreis,
      });
    }

    for (let i = 1; i <= 10; i++) {
      daten.push({
        jahr: aktuellesJahr + i,
        wert: null,
        projektion: Math.round(wert * Math.pow(1 + wertsteigerungRate, i)),
        kaufpreis: kaufpreis,
      });
    }

    return daten;
  }, [params.kaufdatum, params.wertsteigerung, immobilie.kaufpreis, aktuellerWert]);

  const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : new Date().getFullYear();
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const isGbR = params.eigentumsform === 'gbr';
  const anteilFaktor = isGbR ? (params.userAnteil ?? 100) / 100 : 1;
  const anteil = (v) => Math.round(v * anteilFaktor);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-6xl h-[93vh] sm:h-[95vh] flex flex-col overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
        </div>
        {/* Header */}
        <div className="flex-shrink-0 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">🏠 Kaufimmobilie</span>
                  {isGbR && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      🏛 GbR · {params.userAnteil}% Ihr Anteil
                    </span>
                  )}
                  {params.aktiv === false && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-500/60 text-white">
                      Aufgegeben {params.aufgabedatum ? new Date(params.aufgabedatum).toLocaleDateString('de-DE') : ''}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white truncate">{immobilie.name}</h2>
                {(immobilie.plz || immobilie.adresse) && (
                  <p className="text-slate-300 text-sm mt-0.5">📍 {immobilie.plz} {immobilie.adresse}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {params.aktiv === false ? (
                  <button onClick={() => { updateParams({...params, aktiv: true, aufgabedatum: ''}); }}
                    className="px-3 py-1.5 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                    ✓ Reaktivieren
                  </button>
                ) : (
                  <details className="relative">
                    <summary className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl text-sm font-semibold cursor-pointer list-none transition-colors">
                      Aufgeben
                    </summary>
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-20 w-72">
                      <p className="text-sm font-bold text-gray-800 mb-1">Immobilie aufgeben</p>
                      <p className="text-xs text-gray-400 mb-3">Daten bleiben für den Steuerexport erhalten.</p>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Datum der Aufgabe</label>
                      <input type="date" defaultValue={new Date().toISOString().split('T')[0]} id="aufgabedatum-input"
                        className="w-full px-2 py-1.5 border rounded-xl text-sm mb-3 focus:ring-2 focus:ring-red-400" />
                      <button onClick={() => { const datum = document.getElementById('aufgabedatum-input').value; updateParams({...params, aktiv: false, aufgabedatum: datum}); }}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold">
                        Immobilie aufgeben
                      </button>
                    </div>
                  </details>
                )}
                {hasChanges && (
                  <button onClick={handleSave}
                    className="px-4 py-2 bg-white text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm shadow-sm transition-colors">
                    Speichern
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white text-2xl leading-none">&times;</button>
              </div>
            </div>
          </div>
          {/* KPI Strip */}
          {(() => {
            const fmtKPI = (v) => (!isFinite(v) || isNaN(v)) ? '—' : `${v.toFixed(2)} %`;
            return (
              <div className="grid grid-cols-3 bg-white border-b border-gray-200 divide-x divide-gray-100">
                <div className="px-2 sm:px-4 py-2 sm:py-3">
                  <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Brutto</div>
                  <div className="text-base sm:text-xl font-black text-slate-700">{fmtKPI(ergebnis.bruttorendite)}</div>
                </div>
                <div className="px-2 sm:px-4 py-2 sm:py-3">
                  <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Netto</div>
                  <div className="text-base sm:text-xl font-black text-emerald-600">{fmtKPI(ergebnis.nettorendite)}</div>
                </div>
                <div className="px-2 sm:px-4 py-2 sm:py-3">
                  <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">EK-Rendite</div>
                  <div className="text-base sm:text-xl font-black text-amber-700">{fmtKPI(ergebnis.eigenkapitalRendite)}</div>
                </div>
                {isGbR && (
                  <div className="col-span-3 px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold">🏛 GbR-Modus:</span>
                    <span>Alle Euro-Beträge zeigen Ihren {params.userAnteil}%-Anteil</span>
                    <span className="ml-auto text-violet-400">Rendite-% bleiben unverändert (berechnet auf Ihren EK-Anteil)</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6 pb-6">
          {/* Tab-Navigation — 2-stufig: 4 Haupt-Tabs + kontextuelle Sub-Tabs */}
          {(() => {
            const aktiveMieterAnzahl = mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length;
            const GRUPPEN = [
              { id: 'uebersicht', label: '📊 Übersicht',  first: 'uebersicht', subs: null },
              { id: 'finanzen',   label: '💰 Finanzen',    first: 'cashflow',
                subs: [
                  { id: 'cashflow',    label: 'Cashflow' },
                  { id: 'finanzierung',label: 'Finanzierung' },
                  { id: 'bauspar',     label: 'Bauspar' },
                  { id: 'steuern',     label: 'Steuern' },
                ]
              },
              { id: 'vermietung', label: '👥 Vermietung',  first: 'mieteinnahmen',
                subs: [
                  { id: 'mieteinnahmen', label: 'Einnahmen' },
                  { id: 'mieter',        label: aktiveMieterAnzahl > 0 ? `Mieter (${aktiveMieterAnzahl})` : 'Mieter' },
                  { id: 'nkabrechnung',  label: 'NK-Abrechnung' },
                  { id: 'kaution',       label: 'Kaution' },
                ]
              },
              { id: 'objekt', label: '🔧 Objekt', first: 'investitionen',
                subs: [
                  { id: 'investitionen', label: 'Investitionen' },
                  { id: 'zaehler',       label: 'Zähler' },
                  { id: 'dokumente',     label: '📎 Dokumente' },
                ]
              },
            ];
            const aktiveGruppe = GRUPPEN.find(g =>
              g.id === 'uebersicht' ? activeTab === 'uebersicht' : g.subs?.some(s => s.id === activeTab)
            ) || GRUPPEN[0];

            return (
              <div className="sticky top-0 z-20 bg-white -mx-3 sm:-mx-6 px-3 sm:px-6 pt-3 sm:pt-5 pb-2 mb-4 border-b border-slate-100">
                {/* Haupt-Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100 rounded-xl p-1">
                  {GRUPPEN.map(g => (
                    <button key={g.id} onClick={() => setActiveTab(g.first)}
                      className={`py-2 px-1 text-[11px] sm:text-sm font-semibold rounded-lg transition-all text-center leading-tight ${
                        aktiveGruppe.id === g.id
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}>
                      {g.label}
                    </button>
                  ))}
                </div>
                {/* Sub-Tabs */}
                {aktiveGruppe.subs && (
                  <div className="flex gap-0.5 sm:gap-1 mt-2 bg-indigo-50 rounded-xl p-1">
                    {aktiveGruppe.subs.map(s => (
                      <button key={s.id} onClick={() => setActiveTab(s.id)}
                        className={`flex-1 py-1.5 sm:py-2 px-1 sm:px-3 text-[10px] sm:text-sm font-semibold rounded-lg transition-all text-center leading-tight ${
                          activeTab === s.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Tab-Inhalte — in TabErrorBoundary eingewickelt:
              resetKey=activeTab setzt die Boundary automatisch zurück wenn
              der User auf einen anderen Tab wechselt */}
          <TabErrorBoundary resetKey={activeTab}>
          {activeTab === 'uebersicht' && (
            <div className="space-y-5">
              {/* Marktwert & Wertsteigerung */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3">Aktueller Marktwert</h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preis pro m² eingeben</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={qmPreis}
                        onChange={(e) => handleQmPreisChange(e.target.value)}
                        className="w-32 px-3 py-2 text-base sm:text-lg font-bold text-blue-600 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        placeholder="4000"
                      />
                      <span className="text-sm font-bold text-blue-600">€/m²</span>
                      <span className="text-gray-400">×</span>
                      <span className="text-sm text-gray-600">{params.wohnflaeche} m²</span>
                      <span className="text-gray-400">=</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Berechneter Gesamtwert</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={params.geschaetzterWert || ''}
                        onChange={(e) => handleGesamtwertChange(e.target.value)}
                        className="w-40 px-3 py-2 text-base sm:text-xl font-bold text-blue-600 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        placeholder="350000"
                      />
                      <span className="text-xl font-bold text-blue-600">€</span>
                    </div>
                  </div>
                  <a
                    href={`https://www.homeday.de/de/preisatlas/${immobilie.plz ? '?search=' + immobilie.plz : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <span>🔍</span> Preis bei Homeday recherchieren
                  </a>
                  <p className="text-xs text-gray-500 mt-2">Trage den qm-Preis von Homeday ein → Gesamtwert wird automatisch berechnet.</p>
                </div>

                {wertsteigerungSeitKauf && (
                  <div className={`p-5 rounded-2xl border ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      Wertsteigerung seit Kauf
                    </h3>
                    <div className={`text-3xl font-bold ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? '+' : ''}{formatCurrency(wertsteigerungSeitKauf.absoluteSteigerung)}
                    </div>
                    {isGbR && (
                      <div className="text-xs text-indigo-600 font-semibold mt-1">
                        Ihr Anteil: {formatCurrency(anteil(wertsteigerungSeitKauf.absoluteSteigerung))}
                      </div>
                    )}
                    <div className={`text-sm ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {wertsteigerungSeitKauf.prozentSteigerung >= 0 ? '+' : ''}{wertsteigerungSeitKauf.prozentSteigerung.toFixed(1)}% in {wertsteigerungSeitKauf.jahreSeitKauf.toFixed(1)} Jahren
                    </div>
                    <div className="text-xs text-gray-500 mt-1 mb-3">
                      Jährliche Rendite: {wertsteigerungSeitKauf.jaehrlicheRendite.toFixed(2)}% p.a.
                    </div>
                    {wertentwicklungDaten.length > 0 && (
                      <>
                        <div className="flex gap-3 text-[10px] text-gray-400 mb-1">
                          <span className="flex items-center gap-1"><span className="inline-block w-3 h-px bg-blue-500"></span>Historisch</span>
                          <span className="flex items-center gap-1"><span className="inline-block w-3 h-px bg-green-400"></span>Projektion ({params.wertsteigerung ?? 2}% p.a.)</span>
                          <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-400"></span>Kaufpreis</span>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <AreaChart data={wertentwicklungDaten} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradWert" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                            <XAxis dataKey="jahr" tick={{ fontSize: 9 }} />
                            <YAxis tickFormatter={(v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : (v/1000).toFixed(0)+'k'} tick={{ fontSize: 9 }} width={42} />
                            <Tooltip
                              formatter={(value, name) => [
                                value ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value) : '–',
                                name === 'wert' ? 'Marktwert' : name === 'projektion' ? 'Projektion' : 'Kaufpreis'
                              ]}
                              labelFormatter={(label) => `Jahr ${label}`}
                            />
                            <Area type="monotone" dataKey="wert" stroke="#2563eb" strokeWidth={2} fill="url(#gradWert)" dot={false} name="wert" connectNulls={false} />
                            <Area type="monotone" dataKey="projektion" stroke="#10b981" strokeWidth={2} strokeDasharray="5 3" fill="url(#gradProj)" dot={false} name="projektion" connectNulls={false} />
                            <ReferenceLine y={immobilie.kaufpreis} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" label={{ value: formatCurrency(immobilie.kaufpreis), position: 'insideTopLeft', fontSize: 9, fill: '#f59e0b' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-green-100">
                          <div><span className="text-gray-400">Kaufpreis </span><span className="font-semibold text-gray-700">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(immobilie.kaufpreis)}</span></div>
                          <div><span className="text-gray-400">In 10 Jahren </span><span className="font-semibold text-green-600">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(aktuellerWert * Math.pow(1 + (params.wertsteigerung || 2) / 100, 10)))}</span></div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Objektdetails */}
              <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">Objektdetails</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Wohnfläche</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={params.wohnflaeche}
                        onChange={(e) => {
                          const neueFlaeche = parseFloat(e.target.value) || 0;
                          updateParams({...params, wohnflaeche: neueFlaeche});
                          if (neueFlaeche > 0 && params.geschaetzterWert > 0) {
                            setQmPreis(Math.round(params.geschaetzterWert / neueFlaeche).toString());
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right text-base sm:text-sm"
                        min={1}
                      />
                      <span className="text-gray-500">m²</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Zimmer</label>
                    <input
                      type="number"
                      value={params.zimmer}
                      onChange={(e) => updateParams({...params, zimmer: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right text-base sm:text-sm"
                      min={1}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Baujahr</label>
                    <input
                      type="number"
                      value={params.baujahr}
                      onChange={(e) => updateParams({...params, baujahr: parseInt(e.target.value) || 2000})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right text-base sm:text-sm"
                      min={1800}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              {/* Stellplatz */}
              {(() => {
                const sp = params.stellplatz || {};
                const updateSp = (updates) => updateParams({ ...params, stellplatz: { ...sp, ...updates } });
                const STELLPLATZ_TYPEN = [
                  { value: 'tiefgarage', label: '🏢 Tiefgarage' },
                  { value: 'aussen', label: '🅿️ Außenstellplatz' },
                  { value: 'carport', label: '🚗 Carport' },
                  { value: 'doppelparker', label: '🔀 Doppelparker' },
                ];
                const jahresEinnahmen = (sp.vorhanden && sp.istVermietet)
                  ? (sp.monatlicheMiete || 0) * (sp.anzahl || 1) * 12 : 0;
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 sm:p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">🅿️ Stellplatz</h3>
                      <button
                        type="button"
                        onClick={() => updateSp({ vorhanden: !sp.vorhanden })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sp.vorhanden ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sp.vorhanden ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {sp.vorhanden && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Typ</label>
                            <select
                              value={sp.typ || 'tiefgarage'}
                              onChange={e => updateSp({ typ: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              {STELLPLATZ_TYPEN.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Anzahl Stellplätze</label>
                            <input
                              type="number" min={1} max={20}
                              value={sp.anzahl || 1}
                              onChange={e => updateSp({ anzahl: parseInt(e.target.value) || 1 })}
                              className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Kaufpreis-Anteil</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min={0} step={1000}
                                value={sp.kaufpreisAnteil || 0}
                                onChange={e => updateSp({ kaufpreisAnteil: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-500">€</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Im Kaufpreis enthalten</p>
                          </div>
                        </div>

                        {/* Vermietung */}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Stellplatz vermieten</span>
                            <button
                              type="button"
                              onClick={() => updateSp({ istVermietet: !sp.istVermietet })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sp.istVermietet ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sp.istVermietet ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                          {sp.istVermietet && (
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Miete pro Stellplatz / Monat</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number" min={0} step={5}
                                    value={sp.monatlicheMiete || 0}
                                    onChange={e => updateSp({ monatlicheMiete: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg text-base sm:text-sm text-right font-bold focus:ring-2 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-gray-500">€</span>
                                </div>
                              </div>
                              {sp.anzahl > 1 && (
                                <div className="text-center bg-emerald-50 rounded-xl px-3 py-2">
                                  <div className="text-xs text-gray-400">Gesamt</div>
                                  <div className="font-bold text-emerald-700">{formatCurrency((sp.monatlicheMiete || 0) * sp.anzahl)}/Mo</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Summary */}
                        {jahresEinnahmen > 0 && (
                          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                            <span className="text-sm text-emerald-700 font-medium">🅿️ Stellplatz-Mieteinnahmen</span>
                            <div className="text-right">
                              <div className="font-bold text-emerald-700">{formatCurrency((sp.monatlicheMiete || 0) * (sp.anzahl || 1))}/Mo</div>
                              <div className="text-xs text-emerald-600">{formatCurrency(jahresEinnahmen)}/Jahr</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!sp.vorhanden && (
                      <p className="text-sm text-gray-400">Kein Stellplatz vorhanden oder inbegriffen.</p>
                    )}
                  </div>
                );
              })()}

              {/* Prognose */}
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Prognose</h3>
                <InputSliderCombo label="Wertsteigerung p.a." value={params.wertsteigerung} onChange={(v) => updateParams({...params, wertsteigerung: v})} min={0} max={5} step={0.1} unit="%" />
              </div>

              {/* Eigentumsstruktur / GbR */}
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">🏛 Eigentumsstruktur</h3>

                {/* Toggle */}
                <div className="flex gap-2 mb-4">
                  {[['allein','👤 Alleineigentümer'],['gbr','🏛 GbR / Gemeinschaft']].map(([val, label]) => (
                    <button key={val} onClick={() => {
                      const updates = { eigentumsform: val };
                      if (val === 'gbr' && (params.gbrPartner || []).length === 0) {
                        updates.gbrPartner = [{ id: Date.now(), name: 'Ich', anteil: 100, isUser: true }];
                        updates.userAnteil = 100;
                      }
                      updateParams({ ...params, ...updates });
                    }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        params.eigentumsform === val
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>

                {params.eigentumsform === 'gbr' && (() => {
                  const partner = params.gbrPartner || [];
                  const summe = partner.reduce((s, p) => s + (parseFloat(p.anteil) || 0), 0);
                  const userPartner = partner.find(p => p.isUser);

                  const updatePartner = (id, changes) => {
                    const updated = partner.map(p => p.id === id ? { ...p, ...changes } : p);
                    const userP = updated.find(p => p.isUser);
                    updateParams({ ...params, gbrPartner: updated, userAnteil: userP ? (parseFloat(userP.anteil) || 0) : params.userAnteil });
                  };
                  const addPartner = () => {
                    const restanteil = Math.max(0, 100 - summe);
                    updateParams({ ...params, gbrPartner: [...partner, { id: Date.now(), name: '', anteil: restanteil, isUser: false }] });
                  };
                  const removePartner = (id) => {
                    const updated = partner.filter(p => p.id !== id);
                    const userP = updated.find(p => p.isUser);
                    updateParams({ ...params, gbrPartner: updated, userAnteil: userP ? (parseFloat(userP.anteil) || 0) : 0 });
                  };

                  return (
                    <div>
                      {/* Gesellschafter-Liste */}
                      <div className="space-y-2 mb-3">
                        {partner.map(p => (
                          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${p.isUser ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                            {p.isUser && <span className="text-xs font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full shrink-0">Ich</span>}
                            <input
                              type="text"
                              value={p.name}
                              placeholder={p.isUser ? 'Ihr Name' : 'Name Gesellschafter'}
                              onChange={e => updatePartner(p.id, { name: e.target.value })}
                              className={`flex-1 px-3 py-1.5 border rounded-lg text-base sm:text-sm bg-white ${p.isUser ? 'border-indigo-300 font-semibold' : 'border-gray-300'}`}
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number" min="0" max="100" step="0.5"
                                value={p.anteil}
                                onChange={e => updatePartner(p.id, { anteil: parseFloat(e.target.value) || 0 })}
                                className={`w-16 px-2 py-1.5 border rounded-lg text-base sm:text-sm text-right font-bold ${p.isUser ? 'border-indigo-400 bg-white text-indigo-700' : 'border-gray-300'}`}
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                            {!p.isUser && (
                              <button onClick={() => removePartner(p.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none transition-colors">×</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Summen-Validierung */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-3 ${Math.abs(summe - 100) < 0.1 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span>Summe aller Anteile</span>
                        <span className="font-bold">{summe.toFixed(1)}% {Math.abs(summe - 100) < 0.1 ? '✓' : '≠ 100%'}</span>
                      </div>

                      {/* + Gesellschafter */}
                      <button onClick={addPartner}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-all mb-4">
                        + Gesellschafter hinzufügen
                      </button>

                      {/* Ihr Anteil Highlight */}
                      {userPartner && (
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                          <div className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">Ihr Anteil an dieser Immobilie</div>
                          <div className="flex items-baseline gap-3">
                            <div className="text-3xl font-black">{userPartner.anteil}%</div>
                            <div className="text-sm opacity-80">
                              ≙ {formatCurrency(Math.round(immobilie.kaufpreis * (parseFloat(userPartner.anteil) || 0) / 100))} Kaufpreis-Anteil
                            </div>
                          </div>
                          <div className="text-xs mt-2 opacity-70">Alle Cashflow-, Steuer- und Vermögenswerte werden mit diesem Faktor berechnet.</div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {params.eigentumsform === 'allein' && (
                  <p className="text-sm text-gray-400">Du bist alleiniger Eigentümer. Alle Werte gelten zu 100%.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'finanzierung' && (() => {
            const kaufnebenkostenAbsolut = params.kaufpreis * ((params.kaufnebenkosten ?? 10) / 100);
            const gesamtinvestition = params.kaufpreis + kaufnebenkostenAbsolut;
            const ekFuerNebenkosten = params.ekFuerNebenkosten ?? kaufnebenkostenAbsolut;
            const ekFuerKaufpreis = params.ekFuerKaufpreis ?? 0;
            const gesamtEK = ekFuerNebenkosten + ekFuerKaufpreis;
            const berechneterKredit = Math.max(0, gesamtinvestition - gesamtEK);
            const kreditbetrag = params.finanzierungsbetrag ?? berechneterKredit;

            const finanzierungsphasen = params.finanzierungsphasen || [{
              id: 1, name: 'Erstfinanzierung', darlehensTyp: 'annuitaet',
              sollzinssatz: params.zinssatz ?? 4.0, anfangstilgung: params.tilgung ?? 2.0,
              monatlicherBetrag: null, zinsbindung: 10,
              monatlicheTilgung: null, tilgungssatz: 2.0, laufzeit: 10,
              sondertilgungJaehrlich: 0, restschuldOverride: null,
            }];

            const berechnePhase = (phase, startKredit) => {
              const monatszins = (phase.sollzinssatz || 0) / 100 / 12;
              const typ = phase.darlehensTyp || 'annuitaet';

              if (typ === 'annuitaet') {
                const rate = phase.monatlicherBetrag > 0
                  ? phase.monatlicherBetrag
                  : startKredit * (monatszins + (phase.anfangstilgung || 2) / 100 / 12);
                const zinsbindungMonate = (phase.zinsbindung || 10) * 12;
                let restschuld = startKredit, gesamtZinsen = 0, gesamtTilgung = 0;
                const erstZinsen = startKredit * monatszins;
                const erstTilgung = Math.max(0, rate - erstZinsen);
                for (let m = 0; m < zinsbindungMonate && restschuld > 0; m++) {
                  const mz = restschuld * monatszins;
                  const t = Math.min(Math.max(0, rate - mz), restschuld);
                  gesamtZinsen += mz; gesamtTilgung += t; restschuld -= t;
                  if ((m+1) % 12 === 0 && phase.sondertilgungJaehrlich > 0)
                    restschuld = Math.max(0, restschuld - phase.sondertilgungJaehrlich);
                }
                let gesamtlaufzeitJahre = null;
                if (monatszins > 0 && rate > startKredit * monatszins) {
                  const n = Math.ceil(Math.log(rate / (rate - startKredit * monatszins)) / Math.log(1 + monatszins));
                  gesamtlaufzeitJahre = (n / 12).toFixed(1);
                }
                const anfangstilgungProzent = startKredit > 0 ? (erstTilgung / startKredit * 100 * 12) : 0;
                return { rate: Math.round(rate), erstZinsen: Math.round(erstZinsen), erstTilgung: Math.round(erstTilgung),
                  anfangstilgungProzent, restschuldNachZinsbindung: Math.round(restschuld),
                  gesamtZinsen: Math.round(gesamtZinsen), gesamtTilgung: Math.round(gesamtTilgung), gesamtlaufzeitJahre };
              }

              if (typ === 'tilgung') {
                const monatsTilgung = phase.monatlicheTilgung > 0
                  ? phase.monatlicheTilgung
                  : startKredit * (phase.tilgungssatz || 2) / 100 / 12;
                const zinsbindungMonate = (phase.zinsbindung || 10) * 12;
                let restschuld = startKredit, gesamtZinsen = 0;
                const erstZinsen = startKredit * monatszins;
                const erstRate = erstZinsen + monatsTilgung;
                for (let m = 0; m < zinsbindungMonate && restschuld > 0; m++) {
                  const mz = restschuld * monatszins;
                  const t = Math.min(monatsTilgung, restschuld);
                  gesamtZinsen += mz; restschuld -= t;
                  if ((m+1) % 12 === 0 && phase.sondertilgungJaehrlich > 0)
                    restschuld = Math.max(0, restschuld - phase.sondertilgungJaehrlich);
                }
                const letzteZinsen = restschuld * monatszins;
                const letzteRate = letzteZinsen + Math.min(monatsTilgung, restschuld);
                return { monatsTilgung: Math.round(monatsTilgung), erstRate: Math.round(erstRate),
                  letzteRate: Math.round(letzteRate), erstZinsen: Math.round(erstZinsen),
                  restschuldNachZinsbindung: Math.round(restschuld), gesamtZinsen: Math.round(gesamtZinsen) };
              }

              if (typ === 'endfaellig') {
                const laufzeitMonate = (phase.laufzeit || 10) * 12;
                const monatlicherZins = Math.round(startKredit * monatszins);
                return { monatlicherZins, gesamtZinsen: Math.round(monatlicherZins * laufzeitMonate),
                  restschuldNachZinsbindung: Math.round(startKredit), rueckzahlungEnde: Math.round(startKredit) };
              }
              return {};
            };

            const erstePhaseStartDatum = finanzierungsphasen[0]?.kreditStartDatum || params.kaufdatum;
            const kaufjahrFinanz = erstePhaseStartDatum ? new Date(erstePhaseStartDatum).getFullYear() : new Date().getFullYear();
            let aktuelleRestschuld = kreditbetrag;
            let aktuellesStartjahr = kaufjahrFinanz;
            const phasenMitBerechnung = finanzierungsphasen.map((phase, i) => {
              const startKredit = (i > 0 && phase.restschuldOverride != null)
                ? phase.restschuldOverride : aktuelleRestschuld;
              const berechnung = berechnePhase(phase, startKredit);
              const laufzeit = phase.darlehensTyp === 'endfaellig' ? (phase.laufzeit || 10) : (phase.zinsbindung || 10);
              const result = { ...phase, startjahr: aktuellesStartjahr, startKredit: Math.round(startKredit), ...berechnung };
              aktuelleRestschuld = berechnung.restschuldNachZinsbindung ?? startKredit;
              aktuellesStartjahr += laufzeit;
              return result;
            });

            const updatePhase = (id, updates) => {
              const updated = finanzierungsphasen.map(p => p.id === id ? { ...p, ...updates } : p);
              updateParams({ ...params, finanzierungsphasen: updated,
                zinssatz: updated[0]?.sollzinssatz ?? params.zinssatz,
              });
            };
            const addPhase = () => {
              const letzte = phasenMitBerechnung[phasenMitBerechnung.length - 1];
              updateParams({ ...params, finanzierungsphasen: [...finanzierungsphasen, {
                id: Date.now(), name: `Anschlussfinanzierung ${finanzierungsphasen.length}`,
                darlehensTyp: letzte?.darlehensTyp || 'annuitaet',
                sollzinssatz: (letzte?.sollzinssatz ?? 4) + 0.5,
                anfangstilgung: letzte?.anfangstilgung ?? 2,
                monatlicherBetrag: null, zinsbindung: 10,
                monatlicheTilgung: null, tilgungssatz: letzte?.tilgungssatz ?? 2, laufzeit: 10,
                sondertilgungJaehrlich: 0,
                restschuldOverride: letzte?.restschuldNachZinsbindung ?? null,
              }] });
            };
            const deletePhase = (id) => {
              if (finanzierungsphasen.length <= 1) return;
              updateParams({ ...params, finanzierungsphasen: finanzierungsphasen.filter(p => p.id !== id) });
            };

            return (
              <div className="space-y-5">

                {/* Kaufnebenkosten */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <KaufnebenkostenManager
                    params={params}
                    updateParams={updateParams}
                    kaufpreis={params.kaufpreis}
                  />
                </div>

                {/* Eigenkapital */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4">💰 Eigenkapitaleinsatz</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">EK für Kaufnebenkosten</label>
                        <span className="text-xs text-gray-400">max. {formatCurrency(kaufnebenkostenAbsolut)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={kaufnebenkostenAbsolut} step={1000}
                          value={ekFuerNebenkosten}
                          onChange={e => updateParams({ ...params, ekFuerNebenkosten: parseFloat(e.target.value) })}
                          className="flex-1" />
                        <input type="number" value={Math.round(ekFuerNebenkosten)}
                          onChange={e => updateParams({ ...params, ekFuerNebenkosten: Math.min(kaufnebenkostenAbsolut, parseFloat(e.target.value) || 0) })}
                          className="w-28 px-2 py-1 border rounded text-right text-base sm:text-sm" />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                      {ekFuerNebenkosten < kaufnebenkostenAbsolut && (
                        <p className="text-xs text-orange-600 mt-1">⚠ {formatCurrency(kaufnebenkostenAbsolut - ekFuerNebenkosten)} Nebenkosten werden mitfinanziert</p>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">EK für Kaufpreis</label>
                        <span className="text-xs text-gray-400">{params.kaufpreis > 0 ? ((ekFuerKaufpreis / params.kaufpreis) * 100).toFixed(1) : 0}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={params.kaufpreis} step={5000}
                          value={ekFuerKaufpreis}
                          onChange={e => updateParams({ ...params, ekFuerKaufpreis: parseFloat(e.target.value) })}
                          className="flex-1" />
                        <input type="number" value={Math.round(ekFuerKaufpreis)}
                          onChange={e => updateParams({ ...params, ekFuerKaufpreis: Math.min(params.kaufpreis, parseFloat(e.target.value) || 0) })}
                          className="w-28 px-2 py-1 border rounded text-right text-base sm:text-sm" />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-800">Gesamt-EK: {formatCurrency(gesamtEK)}</span>
                    <span className="text-xs text-gray-500">{gesamtinvestition > 0 ? ((gesamtEK / gesamtinvestition) * 100).toFixed(1) : 0}% der Gesamtinvestition</span>
                  </div>
                </div>

                {/* Kreditbetrag */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">🏦 Kredit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Kreditbetrag</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step={1000}
                          value={params.finanzierungsbetrag ?? berechneterKredit}
                          onChange={e => updateParams({ ...params, finanzierungsbetrag: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-lg font-bold text-right focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                      <button onClick={() => updateParams({ ...params, finanzierungsbetrag: null })}
                        className="text-xs text-blue-500 hover:underline mt-1">
                        ↺ Auto ({formatCurrency(berechneterKredit)})
                      </button>
                    </div>
                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400 text-xs">Kaufpreis</span><br/>
                        <strong>{formatCurrency(params.kaufpreis)}</strong>
                        {params.stellplatz?.vorhanden && params.stellplatz?.kaufpreisAnteil > 0 && (
                          <div className="text-xs text-blue-500 mt-0.5">davon 🅿️ {formatCurrency(params.stellplatz.kaufpreisAnteil)} SP</div>
                        )}
                      </div>
                      <div className="text-gray-300">+</div>
                      <div><span className="text-gray-400 text-xs">Nebenkosten</span><br/><strong>{formatCurrency(kaufnebenkostenAbsolut)}</strong></div>
                      <div className="text-gray-300">−</div>
                      <div><span className="text-gray-400 text-xs">Eigenkapital</span><br/><strong>{formatCurrency(gesamtEK)}</strong></div>
                      <div className="text-gray-300">=</div>
                      <div><span className="text-gray-400 text-xs">Kredit (berechnet)</span><br/><strong className="text-blue-700">{formatCurrency(berechneterKredit)}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Finanzierungsphasen */}
                <div className="space-y-4">
                  {phasenMitBerechnung.map((phase, idx) => {
                    const typ = phase.darlehensTyp || 'annuitaet';
                    const typLabels = { annuitaet: '📊 Annuitätendarlehen', tilgung: '📉 Tilgungsdarlehen', endfaellig: '🔚 Endfälliges Darlehen' };
                    const pStartDatum = idx === 0
                      ? (phase.kreditStartDatum || params.kaufdatum)
                      : null;
                    let zinsbindungsWarnung = null;
                    if (pStartDatum && typ !== 'endfaellig') {
                      const ablaufDatum = new Date(pStartDatum);
                      ablaufDatum.setFullYear(ablaufDatum.getFullYear() + (phase.zinsbindung || 10));
                      const heute2 = new Date();
                      const monateZumAblauf = (ablaufDatum - heute2) / (1000 * 60 * 60 * 24 * 30.44);
                      if (monateZumAblauf <= 12 && monateZumAblauf >= 0) {
                        zinsbindungsWarnung = { ablaufDatum, monateZumAblauf: Math.ceil(monateZumAblauf), kritisch: monateZumAblauf <= 3 };
                      } else if (monateZumAblauf < 0) {
                        zinsbindungsWarnung = { ablaufDatum, monateZumAblauf: 0, abgelaufen: true, kritisch: true };
                      }
                    }
                    return (
                    <div key={phase.id} className={`bg-white border-2 rounded-2xl p-5 shadow-sm ${idx === 0 ? 'border-blue-200' : 'border-gray-200'}`}>
                      {zinsbindungsWarnung && (
                        <div className={`mb-4 p-3 rounded-xl flex items-start gap-3 ${zinsbindungsWarnung.abgelaufen ? 'bg-red-100 border border-red-300' : zinsbindungsWarnung.kritisch ? 'bg-orange-100 border border-orange-300' : 'bg-amber-50 border border-amber-200'}`}>
                          <span className="text-xl">{zinsbindungsWarnung.abgelaufen ? '🚨' : '⚠️'}</span>
                          <div>
                            <p className={`text-sm font-bold ${zinsbindungsWarnung.abgelaufen ? 'text-red-800' : zinsbindungsWarnung.kritisch ? 'text-orange-800' : 'text-amber-800'}`}>
                              {zinsbindungsWarnung.abgelaufen
                                ? 'Zinsbindung bereits abgelaufen!'
                                : `Zinsbindung läuft in ${zinsbindungsWarnung.monateZumAblauf} Monat${zinsbindungsWarnung.monateZumAblauf !== 1 ? 'en' : ''} aus`}
                            </p>
                            <p className={`text-xs mt-0.5 ${zinsbindungsWarnung.abgelaufen ? 'text-red-700' : 'text-amber-700'}`}>
                              {zinsbindungsWarnung.abgelaufen
                                ? `Ablauf war am ${zinsbindungsWarnung.ablaufDatum.toLocaleDateString('de-DE')} — Anschlussfinanzierung notwendig!`
                                : `Ablauf am ${zinsbindungsWarnung.ablaufDatum.toLocaleDateString('de-DE')} — Anschlussfinanzierung vorbereiten!`}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>Phase {idx + 1}</span>
                          <input type="text" value={phase.name}
                            onChange={e => updatePhase(phase.id, { name: e.target.value })}
                            className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-base" />
                          {phase.startjahr && <span className="text-xs text-gray-400">ab {phase.startjahr}</span>}
                        </div>
                        {idx > 0 && <button onClick={() => deletePhase(phase.id)} className="text-red-400 hover:text-red-600 text-sm">Entfernen</button>}
                      </div>
                      {/* Kreditinstitut */}
                      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">🏦 Kreditinstitut / Bank</label>
                        <input type="text" value={phase.kreditinstitut || ''}
                          placeholder="z.B. PSD Bank, Deutsche Bank …"
                          onChange={e => updatePhase(phase.id, { kreditinstitut: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-400 bg-white" />
                      </div>

                      {idx === 0 && (
                        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">📅 Kreditstartdatum <span className="font-normal text-slate-400">(falls abweichend vom Kaufdatum)</span></label>
                          <div className="flex items-center gap-2">
                            <input type="date" value={phase.kreditStartDatum || ''}
                              placeholder={params.kaufdatum || ''}
                              onChange={e => updatePhase(phase.id, { kreditStartDatum: e.target.value || null })}
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-400" />
                            {phase.kreditStartDatum && (
                              <button onClick={() => updatePhase(phase.id, { kreditStartDatum: null })} className="text-xs text-slate-500 hover:underline">↺ Kaufdatum verwenden</button>
                            )}
                            {!phase.kreditStartDatum && params.kaufdatum && (
                              <span className="text-xs text-slate-400">Aktuell: {new Date(params.kaufdatum).toLocaleDateString('de-DE')}</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mb-4 flex-wrap">
                        {Object.entries(typLabels).map(([val, label]) => (
                          <button key={val} type="button"
                            onClick={() => updatePhase(phase.id, { darlehensTyp: val })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${typ === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {label}
                          </button>
                        ))}
                      </div>

                      {idx > 0 && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <label className="block text-xs font-semibold text-amber-800 mb-1">🏦 Tatsächliche Restschuld (Startbetrag laut Bank)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" step={1000} value={phase.restschuldOverride ?? ''}
                              placeholder={`Berechnet: ${formatCurrency(phasenMitBerechnung[idx-1]?.restschuldNachZinsbindung ?? 0)}`}
                              onChange={e => updatePhase(phase.id, { restschuldOverride: e.target.value === '' ? null : parseFloat(e.target.value) || 0 })}
                              className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-base sm:text-sm" />
                            <span className="text-sm text-gray-500">€</span>
                            {phase.restschuldOverride != null && (
                              <button onClick={() => updatePhase(phase.id, { restschuldOverride: null })} className="text-xs text-amber-600 hover:underline">Auto</button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── ANNUITÄTENDARLEHEN ── */}
                      {typ === 'annuitaet' && (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Sollzinssatz p.a.</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} max={15} step={0.01} value={phase.sollzinssatz ?? 4}
                                  onChange={e => updatePhase(phase.id, { sollzinssatz: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-blue-400" />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Anfangstilgung p.a.</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} max={20} step={0.1} value={phase.anfangstilgung ?? 2}
                                  onChange={e => updatePhase(phase.id, { anfangstilgung: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm focus:border-blue-400" />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Monatl. Rate (optional)</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} step={10} value={phase.monatlicherBetrag || ''}
                                  placeholder={phase.rate ? String(phase.rate) : 'Berechnet'}
                                  onChange={e => updatePhase(phase.id, { monatlicherBetrag: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                                  className="w-full px-2 py-2 border-2 border-blue-200 bg-blue-50 rounded-lg text-right font-bold focus:border-blue-500" />
                                <span className="text-xs text-gray-400">€</span>
                              </div>
                              <p className="text-[10px] text-blue-500 mt-0.5">Leer = aus Zinssatz + Tilgung berechnet</p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Zinsbindung</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={1} max={30} step={1} value={phase.zinsbindung ?? 10}
                                  onChange={e => updatePhase(phase.id, { zinsbindung: parseInt(e.target.value) || 10 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">J.</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Sondertilgung/Jahr</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} step={1000} value={phase.sondertilgungJaehrlich || 0}
                                  onChange={e => updatePhase(phase.id, { sondertilgungJaehrlich: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">€</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-blue-50 rounded-xl text-center text-sm">
                            <div><div className="text-xs text-gray-400 mb-1">Startbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Monatl. Rate</div><div className="font-bold text-blue-700">{formatCurrency(phase.rate)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Zinsen (Monat 1)</div><div className="font-bold text-orange-600">{formatCurrency(phase.erstZinsen)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Tilgung (Monat 1)</div><div className="font-bold text-emerald-600">{formatCurrency(phase.erstTilgung)}<div className="text-[10px] text-gray-400">{(phase.anfangstilgungProzent||0).toFixed(2)}% p.a.</div></div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Restschuld nach {phase.zinsbindung||10}J.</div>
                              <div className={`font-bold ${phase.restschuldNachZinsbindung===0?'text-emerald-600':'text-orange-600'}`}>{phase.restschuldNachZinsbindung===0?'✓ Abbezahlt':formatCurrency(phase.restschuldNachZinsbindung)}</div>
                              {phase.gesamtlaufzeitJahre && <div className="text-[10px] text-gray-400">Gesamtlaufzeit: {phase.gesamtlaufzeitJahre}J.</div>}
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

                      {/* ── TILGUNGSDARLEHEN ── */}
                      {typ === 'tilgung' && (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Sollzinssatz p.a.</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} max={15} step={0.01} value={phase.sollzinssatz ?? 4}
                                  onChange={e => updatePhase(phase.id, { sollzinssatz: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-blue-400" />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Tilgungssatz p.a.</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} max={20} step={0.1} value={phase.tilgungssatz ?? 2}
                                  onChange={e => updatePhase(phase.id, { tilgungssatz: parseFloat(e.target.value) || 0, monatlicheTilgung: null })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Oder: feste monatl. Tilgung</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} step={10} value={phase.monatlicheTilgung || ''}
                                  placeholder="Berechnet"
                                  onChange={e => updatePhase(phase.id, { monatlicheTilgung: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                                  className="w-full px-2 py-2 border-2 border-blue-200 bg-blue-50 rounded-lg text-right font-bold focus:border-blue-500" />
                                <span className="text-xs text-gray-400">€</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Zinsbindung</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={1} max={30} step={1} value={phase.zinsbindung ?? 10}
                                  onChange={e => updatePhase(phase.id, { zinsbindung: parseInt(e.target.value) || 10 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">J.</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Sondertilgung/Jahr</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} step={1000} value={phase.sondertilgungJaehrlich || 0}
                                  onChange={e => updatePhase(phase.id, { sondertilgungJaehrlich: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">€</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-purple-50 rounded-xl text-center text-sm">
                            <div><div className="text-xs text-gray-400 mb-1">Startbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Feste Tilgung/Monat</div><div className="font-bold text-purple-700">{formatCurrency(phase.monatsTilgung)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Rate Monat 1 → Ende</div><div className="font-bold text-blue-700">{formatCurrency(phase.erstRate)} → {formatCurrency(phase.letzteRate)}</div><div className="text-[10px] text-gray-400">Rate sinkt über Zeit</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Restschuld nach {phase.zinsbindung||10}J.</div>
                              <div className={`font-bold ${phase.restschuldNachZinsbindung===0?'text-emerald-600':'text-orange-600'}`}>{phase.restschuldNachZinsbindung===0?'✓ Abbezahlt':formatCurrency(phase.restschuldNachZinsbindung)}</div>
                            </div>
                          </div>
                          {phase.gesamtZinsen > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                              Gezahlte Zinsen in {phase.zinsbindung||10}J.: <strong className="text-orange-600">{formatCurrency(phase.gesamtZinsen)}</strong>
                            </div>
                          )}
                        </>
                      )}

                      {/* ── ENDFÄLLIGES DARLEHEN ── */}
                      {typ === 'endfaellig' && (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Sollzinssatz p.a.</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} max={15} step={0.01} value={phase.sollzinssatz ?? 4}
                                  onChange={e => updatePhase(phase.id, { sollzinssatz: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-blue-400" />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Laufzeit</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={1} max={30} step={1} value={phase.laufzeit ?? 10}
                                  onChange={e => updatePhase(phase.id, { laufzeit: parseInt(e.target.value) || 10 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">J.</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-red-50 rounded-xl text-center text-sm">
                            <div><div className="text-xs text-gray-400 mb-1">Darlehensbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Monatl. Zinszahlung</div><div className="font-bold text-orange-600">{formatCurrency(phase.monatlicherZins)}</div><div className="text-[10px] text-gray-400">keine Tilgung!</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Gesamtzinskosten</div><div className="font-bold text-red-600">{formatCurrency(phase.gesamtZinsen)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Rückzahlung nach {phase.laufzeit||10}J.</div><div className="font-bold text-red-700">{formatCurrency(phase.rueckzahlungEnde)}</div><div className="text-[10px] text-gray-400">voller Betrag auf einmal</div></div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                  })}
                </div>

                <button onClick={addPhase}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm font-semibold transition-all">
                  + Anschlussfinanzierung hinzufügen
                </button>

              </div>
            );
          })()}

          {activeTab === 'bauspar' && (
            <BausparManager params={params} updateParams={updateParams} />
          )}

          {activeTab === 'mieteinnahmen' && (
            <MieteinnahmenTracker
              params={params}
              updateParams={updateParams}
              immobilie={immobilie}
              mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false)}
            />
          )}

          {activeTab === 'cashflow' && (
            <>
              <MietKostenManager
                params={params}
                updateParams={updateParams}
                immobilie={immobilie}
                hasChanges={hasChanges}
                setHasChanges={setHasChanges}
              />
              <CashflowUebersicht
                params={params}
                ergebnis={ergebnis}
                immobilie={immobilie}
                investitionen={params.investitionen}
                anteilFaktor={anteilFaktor}
              />
            </>
          )}

          {activeTab === 'steuern' && (
            <Steuerberechnung
              params={params}
              ergebnis={ergebnis}
              immobilie={{...immobilie, ...params}}
              onUpdateParams={updateParams}
              anteilFaktor={anteilFaktor}
            />
          )}

          {activeTab === 'investitionen' && (
            <ReparaturenInvestitionen
              immobilie={{...immobilie, investitionen: params.investitionen}}
              onUpdate={(updated) => {
                updateParams({...params, investitionen: updated.investitionen});
              }}
            />
          )}

          {activeTab === 'nkabrechnung' && (
            <NKAbrechnungTab
              params={params}
              updateParams={updateParams}
              immobilie={immobilie}
            />
          )}

          {activeTab === 'kaution' && (
            <KautionsManager
              params={params}
              updateParams={updateParams}
            />
          )}

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

          {activeTab === 'zaehler' && (
            <ZaehlerVerwaltung
              params={params}
              updateParams={(neu) => updateParams(neu)}
            />
          )}

          {activeTab === 'dokumente' && (
            <DokumenteTab
              immobilie={immobilie}
              dokumente={params.dokumente || []}
              onDokumentUpdate={async (neueDokumente) => {
                const updated = { ...params, dokumente: neueDokumente };
                updateParams(updated);
                await onSave(updated);
              }}
            />
          )}
          </TabErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default KaufimmobilieDetail;
