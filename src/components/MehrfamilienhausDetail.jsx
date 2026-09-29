import { useState, useMemo, useEffect, useRef } from 'react';
import JetztDran from './JetztDran';
import { WasDuHierTunKannst } from './MieterSeitenleiste';
import { erstelleZahlungserinnerung } from '../utils/mahnung.js';
import { TabErrorBoundary } from './ErrorBoundary';
import { formatCurrency } from '../utils/format.js';
import { berechneRendite, berechneWertsteigerungSeitKauf } from '../utils/berechnung.js';
import { berechneMietStatusFuerMonat } from '../utils/miete.js';
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
import ObjektUeberlaufMenu from './ObjektUeberlaufMenu';
import { DetailNavigation, ZurueckZumCockpit, KennzahlenZeile } from './DetailNavigation';
import { phasenZeitraeume, finanzierungsStatus } from '../utils/finanzierung.js';
import { beleihbarFrei, getBeleihungsgrenze } from '../utils/kapital.js';
import InputSliderCombo from './InputSliderCombo.jsx';
import { uploadDokument, deleteDokument, getDokumentUrl } from '../supabaseClient';
import {
  Building2, BarChart3, Wallet, Users, Wrench, MapPin, Pencil, X, Check,
  CheckCircle2, AlertTriangle, User, FileText, Key, Plus, Lightbulb,
  Landmark, CalendarDays, Circle, Trash2, Upload, Download, Loader2,
  Shield, Zap, Wifi, CreditCard, MoreHorizontal, TrendingUp, TrendingDown, Search,
} from 'lucide-react';

// ─── Dokumente-Tab (inline, identisch zu KaufimmobilieDetail) ─────────────────
const DOK_TYPEN = ['Kaufvertrag', 'Teilungserklärung', 'WEG-Protokoll', 'Grundbuchauszug', 'Darlehensvertrag', 'Mietvertrag', 'NK-Abrechnung', 'Grundriss', 'Energieausweis', 'Versicherung', 'Handwerker-Rechnung', 'Fotos', 'Sonstiges'];

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
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${gewaehltTyp === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t}
            </button>
          ))}
        </div>
        <label className={`flex items-center justify-center gap-3 py-4 rounded-xl cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-indigo-50'}`}>
          <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          {uploading ? <Loader2 size={20} className="animate-spin text-indigo-600"/> : <Upload size={20} className="text-indigo-500"/>}
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
              <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-indigo-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400">{doc.typ} · {formatBytes(doc.groesse)} · {doc.hochgeladenAm ? new Date(doc.hochgeladenAm).toLocaleDateString('de-DE') : '—'}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleDownload(doc)} disabled={ladeId === doc.id}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Herunterladen">
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

// ─── Kostenkategorien je Wohneinheit ─────────────────────────────────────────
const KOSTEN_FELDER = [
  { key: 'hausverwaltung', label: 'Hausverwaltung',           icon: Building2, farbe: 'blue'   },
  { key: 'instandhaltung', label: 'Rücklage für Reparaturen',  icon: Wrench,    farbe: 'orange' },
  { key: 'grundsteuer',    label: 'Grundsteuer (Anteil)',      icon: Landmark,  farbe: 'purple' },
  { key: 'versicherung',   label: 'Versicherung (Anteil)',     icon: Shield,    farbe: 'teal'   },
  { key: 'strom',          label: 'Strom / Heizung (Anteil)', icon: Zap,       farbe: 'yellow' },
  { key: 'internet',       label: 'Internet / Kabel TV',       icon: Wifi,      farbe: 'cyan'   },
  { key: 'sonstige',       label: 'Sonstige Kosten',           icon: MoreHorizontal, farbe: 'gray' },
  // kreditAnteil wird auto-berechnet aus Finanzierungsphase × Flächenanteil
];

// ─── Tab-Mapping: externe initialTab-Werte → interne Tab-IDs ────────────────
const MFH_TAB_MAP = {
  mieter: 'mieter', mieteinnahmen: 'mieteinnahmen', nkabrechnung: 'nkabrechnung',
  // Abschnitt 2: Kaution ist ein Block im Mieter-Reiter, Bauspar ein Block in Finanzierung
  kaution: 'mieter', cashflow: 'cashflow', investitionen: 'investitionen',
  zaehler: 'zaehler', dokumente: 'dokumente', steuern: 'steuern', bauspar: 'finanzierung',
  finanzierung: 'finanzierung', uebersicht: 'uebersicht', stammdaten: 'stammdaten',
  kaufwert: 'kaufwert', wohnungen: 'wohnungen',
};
// Abschnitt 3.9: Objekt ist EINE Seite mit Sprungleiste — diese IDs sind nur noch
// Sprungziele innerhalb dieser Seite (Deep-Links aus Erinnerungen/Cockpit).
const MFH_OBJEKT_IDS = ['stammdaten', 'kaufwert', 'investitionen', 'zaehler', 'dokumente'];

// ─── MehrfamilienhausDetail ───────────────────────────────────────────────────
const MehrfamilienhausDetail = ({
  immobilie, onClose, onEdit, onSave, initialTab,
  mieterListe = [], onSaveMieter, onDeleteMieter,
  nkAbrechnungen = [], onSaveNK, onDeleteNK,
  portfolio = [], aufgaben = [],
}) => {
  const [activeTab, setActiveTab] = useState(() =>
    initialTab ? (MFH_TAB_MAP[initialTab] ?? initialTab) : 'uebersicht'
  );
  // Abschnitt 7.3: Scrollposition sprang beim Tab-Wechsel nicht nach oben.
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
    if (MFH_OBJEKT_IDS.includes(activeTab) && activeTab !== 'stammdaten') {
      requestAnimationFrame(() => {
        document.getElementById(`mfh-objekt-${activeTab}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [activeTab]);
  const [params, setParams] = useState(immobilie);
  const [hasChanges, setHasChanges] = useState(false);
  const [cfWE, setCfWE] = useState('gesamt');       // aktive WE im Cashflow-Tab
  const [einnahmenWE, setEinnahmenWE] = useState(0); // aktive WE im Einnahmen-Tab
  const [wohnungen, setWohnungen] = useState(immobilie.wohnungen || []);
  const [showWohnungForm, setShowWohnungForm] = useState(false);
  const [editWohnungIdx, setEditWohnungIdx] = useState(null);
  const [wohnungForm, setWohnungForm] = useState({
    name: '', etage: '', wohnflaeche: '', kaltmiete: '',
    mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: '', kautionBezahlt: false,
  });

  const updateParams = (newParams) => { setParams(newParams); setHasChanges(true); };
  // Abschnitt 3.9 Kauf & Wert: Marktwert = m²-Preis × Gesamtfläche aller Wohnungen
  const [qmPreis, setQmPreis] = useState(() => {
    const fl = (immobilie.wohnungen || []).reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
    return immobilie.geschaetzterWert && fl > 0 ? String(Math.round(immobilie.geschaetzterWert / fl)) : '';
  });

  // Aggregierte Werte aus Wohnungen
  const gesamtKaltmiete = wohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
  const gesamtFlaeche   = wohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
  // Leerstand nur anzeigen wenn schon mal ein Mieter eingetragen war
  const hatteJeMieter   = (w) => !!(w.mieterName || w.mietende || w.mietbeginn);
  const belegtWE        = wohnungen.filter(w => w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date())).length;
  const leerstandWE     = wohnungen.filter(w => hatteJeMieter(w) && !(w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date()))).length;

  // Vermieter-Aufgaben, gefiltert auf diese Immobilie (bereits rot→gelb→grau sortiert)
  const eigeneAufgaben = aufgaben.filter(t => t.immoId === immobilie.id);
  const naechsteAufgabe = eigeneAufgaben.find(t => t.priority !== 'grau') || eigeneAufgaben[0] || null;

  // Cashflow-Ampel: wie viele der belegten Wohnungen haben diesen Monat schon Miete verbucht?
  // Nutzt berechneMietStatusFuerMonat (utils/miete.js) — dieselbe Funktion wie der
  // Mieteinnahmen-Tab und die Kaufimmobilien-Ampel, damit eine Teilzahlung hier nicht
  // fälschlich als "eingegangen" zählt. MFH-Wohnungen laufen nie über Dauerauftrag.
  const heute = new Date();
  const belegteWohnungenListe = wohnungen.filter(w => w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date()));
  const wohnungenMitMieteImMonat = belegteWohnungenListe.filter(w => {
    const status = berechneMietStatusFuerMonat(w.mietEingaenge, heute.getFullYear(), heute.getMonth() + 1, Number(w.kaltmiete) || 0, false).status;
    return status === 'bezahlt';
  }).length;
  const alleMietenEingegangen = belegteWohnungenListe.length > 0 && wohnungenMitMieteImMonat === belegteWohnungenListe.length;

  // Ein-Klick Abhaken pro Wohnung direkt aus der Übersicht — kein Umweg über den
  // Einnahmen-Tab nötig. Speichert sofort (aggregiereUndSpeichere persistiert direkt).
  const handleWohnungMieteAbhaken = (wIdx) => {
    const heuteISO = new Date().toISOString().split('T')[0];
    const w = wohnungen[wIdx];
    const neuerEingang = { id: Date.now(), datum: heuteISO, betrag: Number(w.kaltmiete) || 0, typ: 'kaltmiete', notiz: '' };
    const neu = [...wohnungen];
    neu[wIdx] = { ...neu[wIdx], mietEingaenge: [...(neu[wIdx].mietEingaenge || []), neuerEingang] };
    setWohnungen(neu);
    aggregiereUndSpeichere(neu);
  };

  // Cockpit: alle noch offenen Wohnungen des laufenden Monats in einem Schritt buchen
  const handleAlleWohnungenAbhaken = () => {
    const heuteISO = new Date().toISOString().split('T')[0];
    const neu = wohnungen.map((w, i) => {
      const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date());
      if (!belegt) return w;
      const erwartet = Number(w.kaltmiete) || 0;
      const st = berechneMietStatusFuerMonat(w.mietEingaenge, heute.getFullYear(), heute.getMonth() + 1, erwartet, false);
      if (st.status === 'bezahlt' || erwartet <= 0) return w;
      const rest = Math.max(0, erwartet - (st.summe || 0));
      return { ...w, mietEingaenge: [...(w.mietEingaenge || []), { id: Date.now() + i, datum: heuteISO, betrag: rest, typ: 'kaltmiete', notiz: '' }] };
    });
    setWohnungen(neu);
    aggregiereUndSpeichere(neu);
  };

  const auslastung      = wohnungen.length > 0 ? Math.round(belegtWE / wohnungen.length * 100) : 0;
  const kautionOffenAnzahl = wohnungen.filter(w => w.kautionBetrag > 0 && !w.kautionBezahlt).length;
  const aktiveMieterAnzahl = (mieterListe || []).filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length;

  // Aggregierte Kosten aus allen WE-kosten-Objekten (für berechneRendite)
  const aggregierteWEKosten = useMemo(() => wohnungen.reduce((acc, w) => {
    const k = w.kosten || {};
    return {
      instandhaltung: acc.instandhaltung + (Number(k.instandhaltung) || 0),
      verwaltung:     acc.verwaltung     + (Number(k.hausverwaltung) || 0),
      strom:          acc.strom          + (Number(k.strom)          || 0),
      internet:       acc.internet       + (Number(k.internet)       || 0),
      // Grundsteuer + Versicherung → hausgeld (monatlich)
      hausgeld:       acc.hausgeld       + (Number(k.grundsteuer)    || 0) + (Number(k.versicherung) || 0),
      // Sonstige → nebenkosten (monatlich)
      nebenkosten:    acc.nebenkosten    + (Number(k.sonstige)       || 0),
    };
  }, { instandhaltung: 0, verwaltung: 0, strom: 0, internet: 0, hausgeld: 0, nebenkosten: 0 }), [wohnungen]);

  // Rendite-Berechnung: kaltmiete + alle per-WE-Kosten korrekt aggregiert
  // Bug-Fix: vermietungsmodell/nebenkostenVomMieter auf Gebäudeebene werden bei MFH
  // bewusst NICHT berücksichtigt (Miete wird pro Wohnung erfasst) — konsistent mit
  // berechneMtlCashflow() in utils/berechnung.js, das MFH explizit davon ausschließt.
  // Ohne diesen Reset hätte ein (z.B. aus einer alten Erfassung) gesetztes
  // vermietungsmodell='kaltmiete_nk' die NK-Vorauszahlung hier zusätzlich als Einnahme
  // gezählt — in der Portfolio-Übersicht/-Kachel aber nicht, da dort inkonsistent.
  const ergebnis = useMemo(() => berechneRendite({
    ...params,
    kaltmiete:     gesamtKaltmiete,
    instandhaltung: aggregierteWEKosten.instandhaltung,
    verwaltung:     aggregierteWEKosten.verwaltung,
    strom:          aggregierteWEKosten.strom,
    internet:       aggregierteWEKosten.internet,
    hausgeld:       aggregierteWEKosten.hausgeld,
    nebenkosten:    aggregierteWEKosten.nebenkosten,
    vermietungsmodell: 'kaltmiete',
    nebenkostenVomMieter: 0,
  }), [params, gesamtKaltmiete, aggregierteWEKosten]);

  // Wertsteigerung seit Kauf — gleiche Logik/Helper wie bei Kaufimmobilie,
  // damit beide Immobilientypen die Kennzahl konsistent ausweisen.
  const aktuellerWertMFH = params.geschaetzterWert || params.kaufpreis || 0;
  const wertsteigerungSeitKauf = berechneWertsteigerungSeitKauf(
    { ...immobilie, kaufdatum: params.kaufdatum, kaufpreis: params.kaufpreis },
    aktuellerWertMFH
  );

  // Aktive Finanzierungsphase berechnen — identische Logik wie Finanzierung-Tab
  // Ergebnis: { rate, zinsen, tilgung, kreditbetrag, typ, zinssatz }
  const aktivePhaseBerechnung = useMemo(() => {
    const phasen = params.finanzierungsphasen;
    if (!phasen || phasen.length === 0) return null;
    const kaufnebenkostenAbsolut = (params.kaufpreis || 0) * ((params.kaufnebenkosten ?? 10) / 100);
    const gesamtinvestition = (params.kaufpreis || 0) + kaufnebenkostenAbsolut;
    const ekGesamt = (params.ekFuerNebenkosten ?? kaufnebenkostenAbsolut) + (params.ekFuerKaufpreis ?? 0);
    const berechneterKredit = Math.max(0, gesamtinvestition - ekGesamt);
    const kreditbetrag = params.finanzierungsbetrag ?? berechneterKredit;
    if (kreditbetrag <= 0) return null;
    const phase = phasen[0];
    const typ = phase.darlehensTyp || 'annuitaet';
    const monatszins = (phase.sollzinssatz || 0) / 100 / 12;
    let rate = 0, zinsen = 0, tilgung = 0;
    if (typ === 'annuitaet') {
      zinsen = Math.round(kreditbetrag * monatszins);
      rate = phase.monatlicherBetrag > 0
        ? phase.monatlicherBetrag
        : Math.round(kreditbetrag * (monatszins + (phase.anfangstilgung || 2) / 100 / 12));
      tilgung = Math.max(0, rate - zinsen);
    } else if (typ === 'tilgung') {
      zinsen = Math.round(kreditbetrag * monatszins);
      const mt = phase.monatlicheTilgung > 0
        ? phase.monatlicheTilgung
        : Math.round(kreditbetrag * (phase.tilgungssatz || 2) / 100 / 12);
      tilgung = mt; rate = zinsen + tilgung;
    } else { // endfaellig
      zinsen = Math.round(kreditbetrag * monatszins);
      tilgung = 0; rate = zinsen;
    }
    return { rate, zinsen, tilgung, kreditbetrag, typ, zinssatz: phase.sollzinssatz, phaseName: phase.name || 'Erstfinanzierung' };
  }, [params]);

  // Auto-Save: Wohnungsänderung sofort persistieren + Aggregat aktualisieren
  const aggregiereUndSpeichere = (neueWohnungen) => {
    const kaltmiete   = neueWohnungen.reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0);
    const wohnflaeche = neueWohnungen.reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0);
    const zimmer      = neueWohnungen.length;
    // params-Snapshot zum Zeitpunkt des Calls in updated einfrieren
    setParams(prev => {
      const updated = { ...prev, wohnungen: neueWohnungen, kaltmiete, wohnflaeche, zimmer };
      onSave(updated);       // mit aktuellem prev (nicht stale closure)
      return { ...prev, kaltmiete, wohnflaeche, zimmer };
    });
    setHasChanges(false);    // alles ist persistiert
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

  // Kosten einer einzelnen WE updaten + sofort persistieren
  const updateWohnungKosten = (idx, neueKosten) => {
    const neu = [...wohnungen];
    neu[idx] = { ...neu[idx], kosten: neueKosten };
    setWohnungen(neu);
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
      name: '', etage: '', wohnflaeche: '', kaltmiete: '',
      mieterName: '', mietbeginn: '', mietende: '', kautionBetrag: '', kautionBezahlt: false,
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
  // Abschnitt 2: Cockpit · Zahlen (Cashflow, Finanzierung, Steuern) · Vermietung
  // (Mieteingänge, Mieter, Nebenkosten) · Objekt (eine Seite). "Wohnungen" ist beim
  // Mehrfamilienhaus zusätzlich nötig (Verwaltung der Wohneinheiten) und steht
  // deshalb als eigener Reiter direkt nach dem Cockpit.
  const GRUPPEN = [
    { id: 'uebersicht', icon: <BarChart3 size={13}/>,  label: 'Cockpit', first: 'uebersicht', subs: null },
    { id: 'wohnungen',  icon: <Building2 size={13}/>, label: 'Wohnungen', first: 'wohnungen', subs: null },
    { id: 'finanzen',   icon: <Wallet size={13}/>,     label: 'Zahlen',  first: 'cashflow',
      subs: [
        { id: 'cashflow',     label: 'Cashflow' },
        { id: 'finanzierung', label: 'Finanzierung' },
        { id: 'steuern',      label: 'Steuern' },
      ]
    },
    { id: 'vermietung', icon: <Users size={13}/>,      label: 'Vermietung', first: 'mieteinnahmen',
      subs: [
        { id: 'mieteinnahmen', label: 'Mieteingänge' },
        { id: 'mieter',        label: aktiveMieterAnzahl > 0 ? `Mieter (${aktiveMieterAnzahl})` : 'Mieter' },
        { id: 'nkabrechnung',  label: 'Nebenkosten' },
      ]
    },
    { id: 'objekt',     icon: <Wrench size={13}/>,     label: 'Objekt', first: 'stammdaten', subs: null },
  ];
  const aktiveGruppe = GRUPPEN.find(g =>
    g.id === 'objekt' ? MFH_OBJEKT_IDS.includes(activeTab)
    : g.id === activeTab || g.subs?.some(s => s.id === activeTab)
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
          <div className="bg-ink px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 text-white">
            <div className="flex justify-between items-start">
              <ZurueckZumCockpit sichtbar={activeTab !== 'uebersicht'} onClick={() => setActiveTab('uebersicht')} />
              <div className={`flex-1 min-w-0 ${activeTab !== 'uebersicht' ? 'ml-3' : ''}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold bg-white/10 text-white/90 px-2 py-0.5 rounded-md">Mehrfamilienhaus · {wohnungen.length} WE</span>
                  {params.aktiv === false && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-500/60 text-white">
                      Verkauft/abgegeben {params.aufgabedatum ? new Date(params.aufgabedatum).toLocaleDateString('de-DE') : ''}
                    </span>
                  )}
                  {params.aktiv !== false && eigeneAufgaben.length > 0 && (
                    <button onClick={() => setActiveTab('uebersicht')}
                      title={`${eigeneAufgaben.length} offene${eigeneAufgaben.length === 1 ? 'r Punkt' : ' Punkte'}`}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${
                        eigeneAufgaben.some(a => a.priority === 'rot') ? 'bg-red-500/25 text-red-200'
                        : eigeneAufgaben.some(a => a.priority === 'gelb') ? 'bg-amber-500/25 text-amber-200' : 'bg-white/10 text-white/80'
                      }`}>
                      {eigeneAufgaben.length} offene{eigeneAufgaben.length === 1 ? 'r Punkt' : ' Punkte'}
                    </button>
                  )}
                  {kautionOffenAnzahl > 0 && (
                    <span className="text-xs font-semibold bg-red-500/25 text-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-300"/> {kautionOffenAnzahl}× Kaution offen
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-2xl font-black truncate">{immobilie.name}</h2>
                {(immobilie.plz || immobilie.adresse) && (
                  <p className="text-slate-300 text-sm mt-0.5 flex items-center gap-1"><MapPin size={12}/> {immobilie.plz} {immobilie.adresse}</p>
                )}
                {/* Abschnitt 3.2: Eckdaten im Kopf — nur erfasste Werte */}
                {(() => {
                  const eckdaten = [
                    wohnungen.length > 0 ? `${wohnungen.length} Wohneinheiten` : null,
                    gesamtFlaeche > 0 ? `${gesamtFlaeche} m²` : null,
                    params.baujahr ? `Baujahr ${params.baujahr}` : null,
                    params.kaufdatum ? `gekauft ${new Date(params.kaufdatum).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}` : null,
                  ].filter(Boolean);
                  return eckdaten.length > 0 ? <p className="text-slate-400 text-xs mt-0.5">{eckdaten.join(' · ')}</p> : null;
                })()}
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <ObjektUeberlaufMenu
                  aktiv={params.aktiv}
                  onAufgeben={(datum) => updateParams({ ...params, aktiv: false, aufgabedatum: datum })}
                  onReaktivieren={() => updateParams({ ...params, aktiv: true, aufgabedatum: '' })}
                />
                {onEdit && (
                  <button onClick={onEdit}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-xl text-sm font-semibold transition-colors">
                    Bearbeiten
                  </button>
                )}
                {hasChanges && (
                  <button onClick={handleSave} className="px-3 py-1.5 bg-white text-indigo-700 rounded-xl text-xs font-bold shadow-sm">
                    Speichern
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"><X size={20}/></button>
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          {(() => {
            const fmtKPI = (v) => (!isFinite(v) || isNaN(v)) ? '—' : `${v.toFixed(2)} %`;
            const wsPositiv = wertsteigerungSeitKauf && wertsteigerungSeitKauf.absoluteSteigerung >= 0;
            const ekNv = ergebnis.eigenkapitalRendite == null || ergebnis.ekRenditeNichtAussagekraeftig;
            if (activeTab !== 'uebersicht') {
              return (
                <KennzahlenZeile eintraege={[
                  ['Kaltmiete', `${formatCurrency(gesamtKaltmiete)}/Mo`],
                  ['Auslastung', `${auslastung} %`, auslastung < 80 ? 'text-red-600' : 'text-emerald-600'],
                  ['Brutto', fmtKPI(ergebnis.bruttorendite)],
                  ['Netto', fmtKPI(ergebnis.nettorendite), 'text-emerald-600'],
                  ['EK-Rendite', ekNv ? 'n. v.' : fmtKPI(ergebnis.eigenkapitalRendite), ekNv ? 'text-gray-400' : 'text-gray-900'],
                ]} />
              );
            }
            return (
              <div className="bg-white border-b border-gray-200">
                {/* Zeile 1: Betriebskennzahlen */}
                <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Kaltmiete/mo</div>
                    <div className="text-sm sm:text-xl font-black text-slate-700">{formatCurrency(gesamtKaltmiete)}</div>
                  </div>
                  <div className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Auslastung</div>
                    <div className={`text-sm sm:text-xl font-black ${auslastung < 80 ? 'text-red-600' : 'text-emerald-600'}`}>{auslastung} %</div>
                    <div className="text-[10px] text-gray-400">{belegtWE}/{wohnungen.length} WE</div>
                  </div>
                </div>
                {/* Zeile 2: Rendite-Kennzahlen — gleiches Muster wie Kaufimmobilie */}
                <div className="grid grid-cols-4 divide-x divide-gray-100">
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
                    {/* Abschnitt 7.5: kein EK erfasst → "n. v." in Grau statt irreführender "0,00%" */}
                    <div className={`text-base sm:text-xl font-black ${ergebnis.eigenkapitalRendite == null || ergebnis.ekRenditeNichtAussagekraeftig ? 'text-gray-400' : 'text-indigo-700'}`}>
                      {ergebnis.eigenkapitalRendite == null || ergebnis.ekRenditeNichtAussagekraeftig ? 'n. v.' : fmtKPI(ergebnis.eigenkapitalRendite)}
                    </div>
                    {ergebnis.eigenkapitalRendite == null && <div className="text-[10px] text-gray-400">kein Eigenkapital eingesetzt</div>}
                    {ergebnis.ekRenditeNichtAussagekraeftig && <div className="text-[10px] text-gray-400">kaum Eigenkapital — nicht aussagekräftig</div>}
                  </div>
                  <div className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Wertsteigerung</div>
                    {wertsteigerungSeitKauf ? (
                      <>
                        <div className={`text-base sm:text-xl font-black ${wsPositiv ? 'text-emerald-600' : 'text-red-600'}`}>
                          {wsPositiv ? '+' : ''}{wertsteigerungSeitKauf.prozentSteigerung.toFixed(1)} %
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {wsPositiv ? '+' : ''}{formatCurrency(wertsteigerungSeitKauf.absoluteSteigerung)}
                        </div>
                      </>
                    ) : (
                      <div className="text-base sm:text-xl font-black text-gray-300">—</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tab-Inhalt */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6 pb-6 bg-canvas">

          {/* ── Tab-Navigation (Optik aus den UX-Mockups) ── */}
          <div className="-mx-3 sm:-mx-6 mb-5 sticky top-0 z-20">
            <DetailNavigation gruppen={GRUPPEN} aktiveGruppeId={aktiveGruppe.id} activeTab={activeTab} onSelect={setActiveTab} />
          </div>

          <TabErrorBoundary resetKey={activeTab}>

          {/* ── WOHNUNGEN TAB ────────────────────────────────────────────────── */}
          {activeTab === 'wohnungen' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Wohneinheiten nach Etage</p>
                <button onClick={() => openWohnungForm()}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                  <Plus size={13}/> Wohnung
                </button>
              </div>
              {wohnungen.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <Building2 size={48} className="mx-auto mb-3 text-gray-300"/>
                  <p className="text-base font-semibold">Noch keine Wohneinheiten</p>
                  <p className="text-sm mt-1">Füge deine Wohneinheiten hinzu</p>
                  <button onClick={() => openWohnungForm()}
                    className="mt-4 px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold text-sm hover:bg-indigo-600">
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
                              className={`rounded-2xl border-2 p-3 sm:p-4 transition-all hover:shadow-md cursor-pointer ${belegt ? 'border-emerald-200 bg-emerald-50/50' : ausgezogen ? 'border-gray-200 bg-gray-50' : hatteJeMieter(w) ? 'border-red-200 bg-red-50/50' : 'border-blue-100 bg-blue-50/30'}`}
                              onClick={() => openWohnungForm(w.originalIdx)}>
                              <div className="flex items-start justify-between mb-2">
                                {(() => {
                                  const jeMieter = hatteJeMieter(w);
                                  if (belegt) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5"><Check size={10}/>Vermietet</span>;
                                  if (ausgezogen) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Ausgezogen</span>;
                                  if (jeMieter) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5"><AlertTriangle size={10}/>Leerstand</span>;
                                  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-400">Noch kein Mieter</span>;
                                })()}
                                <button onClick={e => { e.stopPropagation(); deleteWohnung(w.originalIdx); }}
                                  className="text-gray-300 hover:text-red-500 p-0.5 rounded" title="Löschen">
                                  <X size={12}/>
                                </button>
                              </div>
                              <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{w.name || `WE ${w.originalIdx + 1}`}</p>
                              {w.wohnflaeche > 0 && <p className="text-xs text-gray-400 mt-0.5">{w.wohnflaeche} m²</p>}
                              <p className={`text-base sm:text-xl font-black mt-2 ${belegt ? 'text-emerald-700' : (Number(w.kaltmiete) > 0 ? 'text-slate-500' : 'text-gray-300')}`}>
                                {Number(w.kaltmiete) > 0 ? formatCurrency(Number(w.kaltmiete)) : '—'}
                                {Number(w.kaltmiete) > 0 && <span className="text-xs font-normal text-gray-400">/mo</span>}
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

          {/* ── COCKPIT (Abschnitt 3.2) ─────────────────────────────────────────
              Nur lesen und handeln: keine Eingabefelder außer dem Abhaken der Miete.
              Gleicher Aufbau wie bei der Kaufimmobilie, Mieteingänge pro Wohnung. */}
          {activeTab === 'uebersicht' && (() => {
            const monatlicheKosten = wohnungen.reduce((s, w) => s + KOSTEN_FELDER.reduce((k, f) => k + (Number((w.kosten || {})[f.key]) || 0), 0), 0);
            const monatlicheRate = aktivePhaseBerechnung?.rate || 0;
            const monatlichesErgebnis = gesamtKaltmiete - monatlicheKosten - monatlicheRate;
            const restschuld = ergebnis.effRestschuld || 0;
            const fremdkapital = ergebnis.fremdkapital || aktivePhaseBerechnung?.kreditbetrag || 0;
            const tilgungsfortschritt = fremdkapital > 0 ? Math.max(0, Math.min(100, 100 - (restschuld / fremdkapital) * 100)) : 0;
            const finStatusCockpit = finanzierungsStatus(params);
            const zinsbindungBisText = finStatusCockpit?.letzte?.ende
              ? finStatusCockpit.letzte.ende.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) + (finStatusCockpit.letzte.endeGeschaetzt ? ' (ungeprüft)' : '')
              : null;
            const jaehrlicheZinsen = restschuld * (ergebnis.effZinssatz || 0) / 100;
            const jaehrlicheTilgung = Math.max(0, monatlicheRate * 12 - jaehrlicheZinsen);
            const schuldenfreiCa = jaehrlicheTilgung > 0 && restschuld > 0 ? `ca. ${heute.getFullYear() + Math.round(restschuld / jaehrlicheTilgung)}` : null;
            const nettoEK = aktuellerWertMFH - restschuld;
            const offeneWE = belegteWohnungenListe.filter(w => berechneMietStatusFuerMonat(w.mietEingaenge, heute.getFullYear(), heute.getMonth() + 1, Number(w.kaltmiete) || 0, false).status !== 'bezahlt');
            return (
            <div className="space-y-4">
              {/* Jetzt dran — je Aufgabe die passende Handlung (Teil 1) */}
              <JetztDran
                aufgaben={eigeneAufgaben}
                handler={{
                  onOeffnen: (tab) => setActiveTab(MFH_TAB_MAP[tab] ?? tab),
                  onEingegangen: offeneWE.length > 0 ? () => handleAlleWohnungenAbhaken() : null,
                }}
              />

              {/* Mieteingänge des laufenden Monats — pro Wohnung abhakbar */}
              {belegteWohnungenListe.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Mieteingänge {heute.toLocaleDateString('de-DE', { month: 'long' })} · {wohnungenMitMieteImMonat}/{belegteWohnungenListe.length}
                    </span>
                    <div className="flex items-center gap-3">
                      {offeneWE.length > 1 && (
                        <button onClick={handleAlleWohnungenAbhaken} className="text-xs font-semibold text-emerald-600 hover:underline">Alle als eingegangen buchen</button>
                      )}
                      <button onClick={() => setActiveTab('mieteinnahmen')} className="text-xs font-semibold text-indigo-600 hover:underline">Alle ansehen →</button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {belegteWohnungenListe.map((w) => {
                      const wIdx = wohnungen.indexOf(w);
                      const erwartet = Number(w.kaltmiete) || 0;
                      const mietStatus = berechneMietStatusFuerMonat(w.mietEingaenge, heute.getFullYear(), heute.getMonth() + 1, erwartet, false);
                      const eintrag = mietStatus.zahlungen[mietStatus.zahlungen.length - 1] || null;
                      return (
                        <div key={w.id || wIdx} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{w.name || `WE ${wIdx + 1}`}</div>
                            <div className="text-xs text-gray-400 truncate">{w.mieterName}</div>
                          </div>
                          {mietStatus.status === 'bezahlt' ? (
                            <div className="text-right shrink-0">
                              <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1 justify-end"><CheckCircle2 size={14}/> {formatCurrency(mietStatus.summe)}</div>
                              {eintrag && <div className="text-[10px] text-gray-400">{new Date(eintrag.datum).toLocaleDateString('de-DE')}</div>}
                            </div>
                          ) : mietStatus.status === 'teilweise' ? (
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <span className="text-xs font-semibold text-amber-600">~ {formatCurrency(mietStatus.summe)} von {formatCurrency(erwartet)}</span>
                              <button onClick={() => handleWohnungMieteAbhaken(wIdx)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1">
                                <Check size={12}/> Rest ({formatCurrency(Math.max(0, erwartet - mietStatus.summe))})
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleWohnungMieteAbhaken(wIdx)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                                <Check size={12}/> Erhalten ({formatCurrency(erwartet)})
                              </button>
                              {heute.getDate() > (params.mieteFaelligkeitstag ?? 3) && (
                                <button onClick={() => erstelleZahlungserinnerung({
                                    mieterName: w.mieterName,
                                    objektAdresse: [params.adresse, w.name, params.plz].filter(Boolean).join(', '),
                                    monatLabel: heute.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
                                    betrag: erwartet,
                                    faelligAm: new Date(heute.getFullYear(), heute.getMonth(), params.mieteFaelligkeitstag ?? 3),
                                  })}
                                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 text-xs font-bold rounded-lg transition-colors">
                                  Mahnen
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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
                      <div><div className="text-[10px] text-gray-400">Einnahmen</div><div className="text-sm font-bold text-emerald-600">{formatCurrency(gesamtKaltmiete)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Betrieb</div><div className="text-sm font-bold text-red-500">-{formatCurrency(monatlicheKosten)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Kreditrate</div><div className="text-sm font-bold text-red-500">-{formatCurrency(monatlicheRate)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Ergebnis</div><div className={`text-base font-black ${monatlichesErgebnis >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{monatlichesErgebnis >= 0 ? '+' : ''}{formatCurrency(monatlichesErgebnis)}</div></div>
                    </div>
                    {/* Teil 3, Abschnitt 9: Cashflow vor und nach Tilgung */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-baseline justify-between gap-2 text-xs">
                      <span className="text-gray-500">Nach Tilgung <strong className={monatlichesErgebnis >= 0 ? 'text-emerald-600' : 'text-red-600'}>{monatlichesErgebnis >= 0 ? '+' : ''}{formatCurrency(monatlichesErgebnis)}</strong></span>
                      <span className="text-gray-500">Vor Tilgung <strong className={monatlichesErgebnis + jaehrlicheTilgung / 12 >= 0 ? 'text-emerald-600' : 'text-red-600'}>{monatlichesErgebnis + jaehrlicheTilgung / 12 >= 0 ? '+' : ''}{formatCurrency(monatlichesErgebnis + jaehrlicheTilgung / 12)}</strong></span>
                      <span className="text-gray-400">{jaehrlicheTilgung > 0 ? `davon ${formatCurrency(jaehrlicheTilgung / 12)} Tilgung — baut Eigenkapital auf` : 'schuldenfrei, keine Tilgung'}</span>
                    </div>
                  </button>

                  {/* Wert & Eigenkapital */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Wert & Eigenkapital</p>
                      <button onClick={() => setActiveTab('kaufwert')} className="text-xs font-semibold text-indigo-700 hover:underline">Wert aktualisieren →</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div><div className="text-[10px] text-gray-400">Marktwert</div><div className="text-sm font-bold text-indigo-800">{aktuellerWertMFH > 0 ? formatCurrency(aktuellerWertMFH) : '—'}</div></div>
                      <div><div className="text-[10px] text-gray-400">Kaufpreis</div><div className="text-sm font-bold text-gray-600">{params.kaufpreis ? formatCurrency(params.kaufpreis) : '—'}</div></div>
                      <div>
                        <div className="text-[10px] text-gray-400">Wertsteigerung</div>
                        <div className={`text-sm font-bold ${wertsteigerungSeitKauf && wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {wertsteigerungSeitKauf ? `${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? '+' : ''}${wertsteigerungSeitKauf.prozentSteigerung.toFixed(1)} %` : '—'}
                        </div>
                      </div>
                      <div><div className="text-[10px] text-gray-400" title="Marktwert minus Restschuld">Dein Anteil</div><div className="text-sm font-bold text-indigo-800">{aktuellerWertMFH > 0 ? formatCurrency(nettoEK) : '—'}</div></div>
                    </div>
                    {aktuellerWertMFH > 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 flex items-baseline justify-between gap-2" title={`${getBeleihungsgrenze()} % vom Marktwert minus Restschuld — was eine Bank dir darauf noch geben würde. Grenze änderbar im Menü oben rechts auf der Startseite.`}>
                        <span className="text-xs font-semibold text-emerald-700">Beleihbar frei <span className="font-normal text-gray-400">bei {getBeleihungsgrenze()} %</span></span>
                        <span className="text-sm font-black text-emerald-700">{formatCurrency(beleihbarFrei(aktuellerWertMFH, restschuld))}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">
                      {params.geschaetzterWertDatum ? `Zuletzt aktualisiert am ${new Date(params.geschaetzterWertDatum).toLocaleDateString('de-DE')}` : 'Marktwert noch nie aktualisiert'}
                    </p>
                  </div>

                  {/* Mieter / Belegung — Karte klicken → Wohnungen */}
                  <button onClick={() => setActiveTab('wohnungen')} className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><User size={12}/> Mieter · {belegtWE}/{wohnungen.length} WE belegt ({auslastung} %)</p>
                      <span className="text-xs text-indigo-600 font-semibold">Details →</span>
                    </div>
                    {wohnungen.length === 0 ? (
                      <p className="text-sm text-gray-400">Noch keine Wohnungen angelegt.</p>
                    ) : (
                      <div className="divide-y divide-gray-50 text-sm">
                        {wohnungen.map((w, idx) => {
                          const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date());
                          return (
                            <div key={w.id || idx} className="flex items-center justify-between gap-2 py-1.5">
                              <span className="font-semibold text-gray-800 truncate">{w.name || `WE ${idx + 1}`}</span>
                              <span className={`truncate ${belegt ? 'text-gray-600' : 'text-red-400'}`}>{belegt ? w.mieterName : (hatteJeMieter(w) ? 'Leerstand' : 'noch nie vermietet')}</span>
                              <span className="text-gray-500 shrink-0">{w.mietbeginn && belegt ? `seit ${new Date(w.mietbeginn).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}` : ''}</span>
                              <span className="font-semibold text-gray-700 shrink-0">{Number(w.kaltmiete) > 0 ? formatCurrency(Number(w.kaltmiete)) : '—'}</span>
                              <span className="text-[10px] shrink-0">{Number(w.kautionBetrag) > 0 ? (w.kautionBezahlt ? <span className="text-emerald-600">Kaution ✓</span> : <span className="text-red-500">Kaution offen</span>) : <span className="text-gray-300">keine Kaution</span>}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                </div>

                {/* Finanzierung — rechte Spalte */}
                {fremdkapital > 0 && (
                  <button onClick={() => setActiveTab('finanzierung')} className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors h-fit">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Finanzierung</p>
                      <span className="text-xs text-indigo-600 font-semibold">Öffnen →</span>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <div className="text-[10px] text-gray-400">Restschuld</div>
                        <div className="text-lg font-black text-gray-800">{formatCurrency(restschuld)}</div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${tilgungsfortschritt}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-[10px] text-gray-400 block">Zins</span><span className="font-semibold">{Number(ergebnis.effZinssatz || aktivePhaseBerechnung?.zinssatz || 0).toFixed(2)} %</span></div>
                        <div><span className="text-[10px] text-gray-400 block">Rate</span><span className="font-semibold">{formatCurrency(monatlicheRate)}</span></div>
                      </div>
                      {zinsbindungBisText && <div><span className="text-[10px] text-gray-400 block">Zinsbindung bis</span><span className="font-semibold text-sm">{zinsbindungBisText}</span></div>}
                      {schuldenfreiCa && <div><span className="text-[10px] text-gray-400 block">Schuldenfrei</span><span className="font-semibold text-sm">{schuldenfreiCa}</span></div>}
                    </div>
                  </button>
                )}
              </div>
            </div>
            );
          })()}

          {/* ── FINANZEN: CASHFLOW (per Wohneinheit) ─────────────────────── */}
          {activeTab === 'cashflow' && (() => {
            // Aktuelle Kreditrate aus Finanzierungsphase oder Fallback
            const kreditrate = (() => {
              const ph = params.finanzierungsphasen?.[0];
              if (ph?.rate) return ph.rate;
              if (ph?.sollzinssatz && ph?.anfangstilgung) {
                const sk = params.finanzierungsbetrag ?? 0;
                const mz = ph.sollzinssatz / 100 / 12;
                return sk > 0 ? Math.round(sk * (mz + (ph.anfangstilgung / 100 / 12))) : 0;
              }
              return params.kredit_monatsrate || 0;
            })();

            // Aggregierte Werte für Gesamt-Tab
            const weKosten = wohnungen.map((w, idx) => {
              const k = w.kosten || {};
              const sumK = KOSTEN_FELDER.reduce((s, f) => s + (Number(k[f.key]) || 0), 0);
              // Flächenanteil: Basis für Kredit-Aufteilung
              const anteil = gesamtFlaeche > 0 && Number(w.wohnflaeche) > 0
                ? Number(w.wohnflaeche) / gesamtFlaeche
                : 1 / Math.max(wohnungen.length, 1);
              const kreditAnteilig = aktivePhaseBerechnung
                ? Math.round(aktivePhaseBerechnung.rate * anteil)
                : 0;
              const zinsenAnteilig  = aktivePhaseBerechnung ? Math.round(aktivePhaseBerechnung.zinsen  * anteil) : 0;
              const tilgungAnteilig = aktivePhaseBerechnung ? Math.round(aktivePhaseBerechnung.tilgung * anteil) : 0;
              return {
                idx, name: w.name || `WE ${idx + 1}`,
                kaltmiete: Number(w.kaltmiete) || 0,
                kosten: k, sumKosten: sumK,
                anteil, kreditAnteilig, zinsenAnteilig, tilgungAnteilig,
                cashflow: (Number(w.kaltmiete) || 0) - sumK - kreditAnteilig,
              };
            });
            const totalKaltmiete = weKosten.reduce((s, wk) => s + wk.kaltmiete, 0);
            const totalKosten    = weKosten.reduce((s, wk) => s + wk.sumKosten, 0);
            const totalKredit    = aktivePhaseBerechnung?.rate || 0;
            const totalCashflow  = totalKaltmiete - totalKosten - totalKredit;

            return (
              <div className="space-y-4">
                {/* WE-Tab-Leiste */}
                <div className="flex gap-1 overflow-x-auto bg-indigo-50 rounded-xl p-1 -mx-1 px-1">
                  {wohnungen.map((w, idx) => {
                    const wk = weKosten[idx];
                    return (
                      <button key={idx} onClick={() => setCfWE(idx)}
                        className={`flex-shrink-0 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-0.5 ${cfWE === idx ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}>
                        <span>{w.name || `WE ${idx + 1}`}</span>
                        <span className={`text-[10px] font-normal ${cfWE === idx ? 'text-white/70' : wk.cashflow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {wk.cashflow >= 0 ? '+' : ''}{formatCurrency(wk.cashflow)}
                        </span>
                      </button>
                    );
                  })}
                  <button onClick={() => setCfWE('gesamt')}
                    className={`flex-shrink-0 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-0.5 ${cfWE === 'gesamt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}>
                    <span>Gesamt</span>
                    <span className={`text-[10px] font-normal ${cfWE === 'gesamt' ? 'text-white/70' : totalCashflow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {totalCashflow >= 0 ? '+' : ''}{formatCurrency(totalCashflow)}
                    </span>
                  </button>
                </div>

                {wohnungen.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Building2 size={40} className="mx-auto mb-2 text-gray-300"/>
                    <p className="text-sm">Erst Wohnungen anlegen, dann Cashflow eintragen.</p>
                    <button onClick={() => setActiveTab('wohnungen')} className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600">→ Zu Wohnungen</button>
                  </div>
                )}

                {/* ── Einzel-WE-Ansicht ─────────────────────────────────────── */}
                {cfWE !== 'gesamt' && typeof cfWE === 'number' && cfWE < wohnungen.length && (() => {
                  const w   = wohnungen[cfWE];
                  const wk  = weKosten[cfWE];
                  const k   = w.kosten || {};
                  const cf  = wk.cashflow;
                  const anteilFlaeche = wk.anteil;

                  return (
                    <div className="space-y-4">
                      {/* WE-Kopf */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{w.name || `WE ${cfWE + 1}`}</p>
                          {w.etage && <p className="text-xs text-gray-400">{w.etage}</p>}
                          {w.mieterName && <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5"><User size={12}/>{w.mieterName}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600">{formatCurrency(Number(w.kaltmiete) || 0)}</p>
                          <p className="text-xs text-gray-400">Kaltmiete / Monat</p>
                          {Number(w.wohnflaeche) > 0 && <p className="text-xs text-gray-400">{w.wohnflaeche} m²</p>}
                        </div>
                      </div>

                      {/* Cashflow-Ergebnis — Leitsatz 1: Ergebnis über den Eingaben */}
                      <div className={`rounded-2xl p-5 border-2 ${cf >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-gray-700 flex items-center gap-1.5">
                            {cf >= 0 ? <TrendingUp size={16} className="text-emerald-500"/> : <TrendingDown size={16} className="text-red-500"/>}
                            Monatlicher Cashflow
                          </span>
                          <span className={`text-2xl font-black ${cf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {cf >= 0 ? '+' : ''}{formatCurrency(cf)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1 border-t border-gray-200/60 pt-2">
                          <div className="flex justify-between">
                            <span>Einnahmen (Kaltmiete):</span>
                            <span className="text-emerald-600 font-semibold">+{formatCurrency(Number(w.kaltmiete)||0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Betriebskosten:</span>
                            <span className="text-red-500 font-semibold">−{formatCurrency(wk.sumKosten)}</span>
                          </div>
                          {wk.kreditAnteilig > 0 && (
                            <div className="flex justify-between">
                              <span>Kreditrate anteilig ({Math.round(anteilFlaeche * 100)} %):</span>
                              <span className="text-indigo-600 font-semibold">−{formatCurrency(wk.kreditAnteilig)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="font-semibold text-gray-700">Jahrescashflow:</span>
                            <span className={`font-black ${cf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{cf >= 0 ? '+' : ''}{formatCurrency(cf * 12)}</span>
                          </div>
                          {wk.zinsenAnteilig > 0 && (
                            <div className="flex justify-between text-[10px] text-emerald-500 pt-0.5">
                              <span>davon steuerlich absetzbar (Zinsen):</span>
                              <span className="font-semibold">{formatCurrency(wk.zinsenAnteilig * 12)} / Jahr</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Kosteneingabe */}
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monatliche Kosten</p>
                        </div>
                        {KOSTEN_FELDER.map(f => {
                          const Icon = f.icon;
                          return (
                            <div key={f.key} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer" htmlFor={`kosten-${cfWE}-${f.key}`}>
                                <Icon size={14} className="text-gray-400 flex-shrink-0"/>
                                {f.label}
                              </label>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input id={`kosten-${cfWE}-${f.key}`} type="number" min={0} step={1}
                                  value={k[f.key] || ''}
                                  placeholder="0"
                                  onChange={e => updateWohnungKosten(cfWE, { ...k, [f.key]: parseFloat(e.target.value) || 0 })}
                                  className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-right text-base sm:text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"/>
                                <span className="text-xs text-gray-400 w-8">€/mo</span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-t border-red-100">
                          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1"><TrendingDown size={14} className="text-red-500"/>Summe Kosten</span>
                          <span className="font-black text-red-600 text-base">−{formatCurrency(wk.sumKosten)}</span>
                        </div>
                      </div>

                      {/* Finanzierung anteilig (auto-berechnet) */}
                      {aktivePhaseBerechnung ? (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl overflow-hidden">
                          <div className="bg-indigo-100 px-4 py-2.5 border-b border-indigo-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                              <CreditCard size={13}/>Finanzierung anteilig
                            </span>
                            <span className="text-[10px] text-indigo-500 bg-white/60 px-2 py-0.5 rounded-full">
                              {Number(w.wohnflaeche) > 0 && gesamtFlaeche > 0
                                ? `${w.wohnflaeche} m² / ${gesamtFlaeche} m² = ${Math.round(anteilFlaeche * 100)} %`
                                : `1 / ${wohnungen.length} WE = ${Math.round(anteilFlaeche * 100)} %`}
                            </span>
                          </div>
                          {/* Gesamte Kreditrate oben */}
                          <div className="px-4 py-2 flex justify-between text-xs text-gray-400 bg-white/40 border-b border-indigo-100">
                            <span>Kreditrate gesamt ({aktivePhaseBerechnung.phaseName})</span>
                            <span className="font-semibold">{formatCurrency(aktivePhaseBerechnung.rate)} / mo</span>
                          </div>
                          {/* Zinsen-Anteil */}
                          <div className="px-4 py-2.5 border-b border-indigo-100 flex justify-between items-center">
                            <div>
                              <span className="text-sm text-gray-700">Zinsen anteilig</span>
                              <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-semibold">steuerlich absetzbar</span>
                            </div>
                            <span className="text-sm font-semibold text-orange-600">−{formatCurrency(wk.zinsenAnteilig)}</span>
                          </div>
                          {/* Tilgungs-Anteil */}
                          <div className="px-4 py-2.5 border-b border-indigo-100 flex justify-between items-center">
                            <span className="text-sm text-gray-700">Tilgung anteilig</span>
                            <span className="text-sm font-semibold text-blue-600">−{formatCurrency(wk.tilgungAnteilig)}</span>
                          </div>
                          {/* Rate-Summe */}
                          <div className="px-4 py-3 bg-indigo-100/60 flex justify-between items-center">
                            <span className="text-sm font-bold text-indigo-800 flex items-center gap-1"><TrendingDown size={13}/>Rate anteilig gesamt</span>
                            <span className="font-black text-indigo-700 text-base">−{formatCurrency(wk.kreditAnteilig)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
                          <Lightbulb size={13}/>
                          Finanzierungsdaten im Tab "Finanzierung" hinterlegen → Kredit-Anteil wird automatisch berechnet.
                        </div>
                      )}

                    </div>
                  );
                })()}

                {/* ── Gesamt-Ansicht ───────────────────────────────────────── */}
                {cfWE === 'gesamt' && wohnungen.length > 0 && (
                  <div className="space-y-4">
                    {/* KPI-Karten */}
                    <div className={`grid gap-3 ${totalKredit > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Gesamtmiete</p>
                        <p className="text-base sm:text-xl font-black text-emerald-600">{formatCurrency(totalKaltmiete)}</p>
                        <p className="text-[10px] text-gray-400">/Monat</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Betriebskosten</p>
                        <p className="text-base sm:text-xl font-black text-red-600">−{formatCurrency(totalKosten)}</p>
                        <p className="text-[10px] text-gray-400">/Monat</p>
                      </div>
                      {totalKredit > 0 && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 sm:p-4 text-center">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Kreditrate</p>
                          <p className="text-base sm:text-xl font-black text-indigo-600">−{formatCurrency(totalKredit)}</p>
                          <p className="text-[10px] text-gray-400">/Monat</p>
                        </div>
                      )}
                      <div className={`border-2 rounded-xl p-3 sm:p-4 text-center ${totalCashflow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Cashflow gesamt</p>
                        <p className={`text-base sm:text-xl font-black ${totalCashflow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {totalCashflow >= 0 ? '+' : ''}{formatCurrency(totalCashflow)}
                        </p>
                        <p className="text-[10px] text-gray-400">/Monat</p>
                      </div>
                    </div>

                    {/* WE-Vergleichstabelle */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cashflow je Wohneinheit — Klicken zum Bearbeiten</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                            <th className="text-left py-2 px-4 font-semibold">Wohnung</th>
                            <th className="text-right py-2 px-2 font-semibold">Miete</th>
                            <th className="text-right py-2 px-2 font-semibold hidden sm:table-cell">Kosten</th>
                            {totalKredit > 0 && <th className="text-right py-2 px-2 font-semibold hidden sm:table-cell">Kredit</th>}
                            <th className="text-right py-2 px-4 font-semibold">Cashflow</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {weKosten.map((wk) => (
                            <tr key={wk.idx} className="hover:bg-indigo-50/50 cursor-pointer transition-colors" onClick={() => setCfWE(wk.idx)}>
                              <td className="py-2.5 px-4">
                                <span className="font-semibold text-gray-800">{wk.name}</span>
                                {wohnungen[wk.idx]?.mieterName && <span className="text-xs text-gray-400 ml-1.5 hidden sm:inline">· {wohnungen[wk.idx].mieterName}</span>}
                                {Number(wohnungen[wk.idx]?.wohnflaeche) > 0 && (
                                  <span className="text-[10px] text-indigo-400 ml-1.5 hidden sm:inline">{Math.round(wk.anteil * 100)} %</span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-right text-emerald-600 font-semibold">{formatCurrency(wk.kaltmiete)}</td>
                              <td className="py-2.5 px-2 text-right text-red-400 hidden sm:table-cell">−{formatCurrency(wk.sumKosten)}</td>
                              {totalKredit > 0 && <td className="py-2.5 px-2 text-right text-indigo-400 hidden sm:table-cell">−{formatCurrency(wk.kreditAnteilig)}</td>}
                              <td className={`py-2.5 px-4 text-right font-black ${wk.cashflow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {wk.cashflow >= 0 ? '+' : ''}{formatCurrency(wk.cashflow)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td className="py-2.5 px-4 font-black text-gray-800">Gesamt ({wohnungen.length} WE)</td>
                            <td className="py-2.5 px-2 text-right font-black text-emerald-700">{formatCurrency(totalKaltmiete)}</td>
                            <td className="py-2.5 px-2 text-right font-black text-red-600 hidden sm:table-cell">−{formatCurrency(totalKosten)}</td>
                            {totalKredit > 0 && <td className="py-2.5 px-2 text-right font-black text-indigo-600 hidden sm:table-cell">−{formatCurrency(totalKredit)}</td>}
                            <td className={`py-2.5 px-4 text-right font-black text-lg ${totalCashflow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                              {totalCashflow >= 0 ? '+' : ''}{formatCurrency(totalCashflow)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Kostenkategorien-Übersicht */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kostenaufstellung Gesamt</p>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {KOSTEN_FELDER.map(f => {
                          const Icon = f.icon;
                          const sumKat = weKosten.reduce((s, wk) => s + (Number(wk.kosten[f.key]) || 0), 0);
                          if (sumKat === 0) return null;
                          return (
                            <div key={f.key} className="flex items-center justify-between px-4 py-2.5">
                              <span className="text-sm text-gray-600 flex items-center gap-2"><Icon size={13} className="text-gray-400"/>{f.label}</span>
                              <span className="text-sm font-semibold text-red-500">−{formatCurrency(sumKat)}</span>
                            </div>
                          );
                        })}
                        {KOSTEN_FELDER.every(f => weKosten.every(wk => !wk.kosten[f.key])) && (
                          <div className="px-4 py-6 text-center text-sm text-gray-400">
                            Noch keine Kosten eingetragen — WE anklicken zum Bearbeiten
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Jahresübersicht */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Jahresübersicht</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Jahresmiete:</span>
                          <span className="font-semibold text-emerald-600">+{formatCurrency(totalKaltmiete * 12)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Betriebskosten:</span>
                          <span className="font-semibold text-red-500">−{formatCurrency(totalKosten * 12)}</span>
                        </div>
                        {totalKredit > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Finanzierung (Kreditrate):</span>
                              <span className="font-semibold text-indigo-600">−{formatCurrency(totalKredit * 12)}</span>
                            </div>
                            {aktivePhaseBerechnung && (
                              <div className="flex justify-between items-center pl-3 text-xs text-gray-400">
                                <span>davon Zinsen (steuerlich absetzbar):</span>
                                <span className="font-medium text-emerald-500">{formatCurrency(aktivePhaseBerechnung.zinsen * 12)} / Jahr</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="font-bold text-slate-700">Jahres-Cashflow:</span>
                          <span className={`font-black text-lg ${totalCashflow >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {totalCashflow >= 0 ? '+' : ''}{formatCurrency(totalCashflow * 12)}
                          </span>
                        </div>
                        {params.kaufpreis > 0 && totalCashflow !== 0 && (
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-gray-400">Cash-on-Cash (auf Kaufpreis):</span>
                            <span className={`text-xs font-semibold ${totalCashflow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {((totalCashflow * 12 / params.kaufpreis) * 100).toFixed(2)} %
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
              // KfW- und Bauspardarlehen rechnen wie ein Annuitätendarlehen (wie bei der Kaufimmobilie)
              const typ = ['kfw', 'bauspardarlehen'].includes(phase.darlehensTyp) ? 'annuitaet' : (phase.darlehensTyp || 'annuitaet');
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

            const zeitraeume = phasenZeitraeume({ ...params, finanzierungsphasen });
            const finStatus = finanzierungsStatus({ ...params, finanzierungsphasen });
            const updatePhase = (id, updatesRoh) => {
              const updates = (('zinsbindung' in updatesRoh || 'laufzeit' in updatesRoh) && !('zinsbindungBis' in updatesRoh))
                ? { ...updatesRoh, zinsbindungBis: null, zinsbindungBisBestaetigt: false } : updatesRoh;
              const updated = finanzierungsphasen.map(p => p.id === id ? { ...p, ...updates } : p);
              updateParams({ ...params, finanzierungsphasen: updated, zinssatz: updated[0]?.sollzinssatz ?? params.zinssatz });
            };
            const setZinsbindungBis = (phase, idx, datum) => {
              const z = zeitraeume[idx];
              const upd = { zinsbindungBis: datum || null, zinsbindungBisBestaetigt: !!datum };
              if (datum && z?.start) {
                const jahre = Math.max(1, Math.round((new Date(datum) - z.start) / (1000 * 60 * 60 * 24 * 365.25)));
                if (phase.darlehensTyp === 'endfaellig') upd.laufzeit = jahre; else upd.zinsbindung = jahre;
              }
              updatePhase(phase.id, upd);
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
            const typLabels = { annuitaet: 'Annuitätendarlehen', tilgung: 'Tilgungsdarlehen', endfaellig: 'Endfälliges Darlehen', kfw: 'KfW-Darlehen', bauspardarlehen: 'Bauspardarlehen' };
            const kreditbetragAktuell = params.finanzierungsbetrag ?? berechneterKredit;
            const unfinanziert = Math.max(0, gesamtinvestition - gesamtEK - kreditbetragAktuell);

            return (
              <div className="space-y-5">
                {/* Abschnitt 3.4: Gesamtinvestition mit Warnung, wenn ein Teil weder als
                    Eigenkapital noch über den Kredit abgebildet ist */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1"><Wallet size={14}/> Gesamtinvestition</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><div className="text-xs text-gray-400 mb-0.5">Kaufpreis</div><div className="font-bold text-gray-800">{formatCurrency(params.kaufpreis || 0)}</div></div>
                    <div><div className="text-xs text-gray-400 mb-0.5">Kaufnebenkosten</div><div className="font-bold text-gray-800">{formatCurrency(kaufnebenkostenAbsolut || 0)}</div></div>
                    <div><div className="text-xs text-gray-400 mb-0.5">Eigenkapital</div><div className="font-bold text-green-700">{formatCurrency(gesamtEK)}</div></div>
                    <div><div className="text-xs text-gray-400 mb-0.5">Summe</div><div className="font-bold text-indigo-700">{formatCurrency(gesamtinvestition || 0)}</div></div>
                  </div>
                  {unfinanziert > 1 && (
                    <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-orange-50 border-t border-orange-200 rounded-b-2xl">
                      <p className="text-xs text-orange-700 flex items-start gap-1.5">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5"/>
                        <span><strong>{formatCurrency(unfinanziert)}</strong> sind weder als Eigenkapital hinterlegt noch über den Kredit finanziert. Dadurch wirkt die EK-Rendite besser, als sie tatsächlich ist — Kreditbetrag unten prüfen.</span>
                      </p>
                    </div>
                  )}
                </div>
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
                          className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg text-lg font-bold text-right focus:ring-2 focus:ring-indigo-400"/>
                        <span className="text-gray-500">€</span>
                      </div>
                      <button onClick={() => updateParams({ ...params, finanzierungsbetrag: null })} className="text-xs text-indigo-600 hover:underline mt-1">
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
                      <div><span className="text-gray-400 text-xs">Kredit (berechnet)</span><br/><strong className="text-indigo-700">{formatCurrency(berechneterKredit)}</strong></div>
                    </div>
                  </div>
                </div>

                {finStatus?.luecke && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    Zwischen {finStatus.luecke.von.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })} und {finStatus.luecke.bis.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })} fehlt eine Finanzierung — Startdatum der Folgephase prüfen.
                  </div>
                )}
                {finStatus?.stufe === 'grau' && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    Die Zinsbindung endet in {Math.ceil(finStatus.monate)} Monaten. Ein Forward-Darlehen kannst du bis zu 60 Monate vorher abschließen.
                  </div>
                )}
                <div className="space-y-4">
                  {phasenBerechnet.map((phase, idx) => {
                    const typ = ['kfw', 'bauspardarlehen'].includes(phase.darlehensTyp) ? 'annuitaet' : (phase.darlehensTyp || 'annuitaet');
                    const zr = zeitraeume[idx];
                    let zbWarnung = null;
                    if (idx === phasenBerechnet.length - 1 && finStatus && zr?.ende && (finStatus.stufe === 'rot' || finStatus.stufe === 'gelb')) {
                      zbWarnung = { ablaufDatum: zr.ende, monateZumAblauf: Math.max(0, Math.ceil(finStatus.monate)), abgelaufen: finStatus.stufe === 'rot', kritisch: finStatus.monate < 12 };
                    }
                    return (
                      <div key={phase.id} className={`bg-white border-2 rounded-2xl p-5 shadow-sm ${idx === 0 ? 'border-indigo-200' : 'border-gray-200'}`}>
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
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-400 text-white'}`}>Phase {idx + 1}</span>
                            <input type="text" value={phase.name} onChange={e => updatePhase(phase.id, { name: e.target.value })}
                              className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none text-base"/>
                            {phase.startjahr && <span className="text-xs text-gray-400">ab {phase.startjahr}</span>}
                          </div>
                          {idx > 0 && <button onClick={() => deletePhase(phase.id)} className="text-red-400 hover:text-red-600 text-sm">Entfernen</button>}
                        </div>
                        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <label className="block text-xs font-semibold text-slate-600 mb-2"><Landmark size={12} className='inline mr-1'/>Bank</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Kreditinstitut</label>
                              <input type="text" value={phase.kreditinstitut || ''} placeholder="z.B. Sparkasse, Deutsche Bank …"
                                onChange={e => updatePhase(phase.id, { kreditinstitut: e.target.value })}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white"/>
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Darlehensnummer</label>
                              <input type="text" value={phase.darlehensnummer || ''} placeholder="z.B. 1234567890"
                                onChange={e => updatePhase(phase.id, { darlehensnummer: e.target.value })}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white"/>
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Ansprechpartner</label>
                              <input type="text" value={phase.ansprechpartner || ''} placeholder="Name des Beraters"
                                onChange={e => updatePhase(phase.id, { ansprechpartner: e.target.value })}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white"/>
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Kontakt (Telefon/E-Mail)</label>
                              <input type="text" value={phase.ansprechpartnerKontakt || ''} placeholder="z.B. 089 12345 oder max@bank.de"
                                onChange={e => updatePhase(phase.id, { ansprechpartnerKontakt: e.target.value })}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white"/>
                            </div>
                            <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] text-slate-400">Darlehensvertrag als PDF hinterlegen</span>
                              <button type="button" onClick={() => setActiveTab('dokumente')}
                                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 flex-shrink-0">
                                <FileText size={11}/> In Dokumente hochladen →
                              </button>
                            </div>
                          </div>
                        </div>
                        {idx === 0 && (
                          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <label className="block text-xs font-semibold text-slate-600 mb-1"><CalendarDays size={12} className='inline mr-1'/>Auszahlungsdatum</label>
                            <div className="flex items-center gap-2">
                              <input type="date" value={phase.kreditStartDatum || ''} onChange={e => updatePhase(phase.id, { kreditStartDatum: e.target.value || null })}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400"/>
                              {phase.kreditStartDatum && <button onClick={() => updatePhase(phase.id, { kreditStartDatum: null })} className="text-xs text-slate-500 hover:underline">↺ Kaufdatum</button>}
                            </div>
                          </div>
                        )}
                        <div className={`mb-4 p-3 rounded-xl border ${zr?.endeGeschaetzt ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            <CalendarDays size={12} className='inline mr-1'/>{phase.darlehensTyp === 'endfaellig' ? 'Laufzeit bis' : 'Zinsbindung bis'}
                            {zr?.endeGeschaetzt && <span className="ml-2 font-normal text-amber-700">geschätzt — bitte mit dem Kreditvertrag abgleichen</span>}
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input type="date" value={phase.zinsbindungBis || (zr?.ende ? zr.ende.toISOString().split('T')[0] : '')}
                              onChange={e => setZinsbindungBis(phase, idx, e.target.value)}
                              className={`px-3 py-1.5 border rounded-lg text-base sm:text-sm ${zr?.endeGeschaetzt ? 'border-amber-400' : 'border-slate-300'}`}/>
                            {zr?.endeGeschaetzt && zr?.ende && (
                              <button type="button" onClick={() => setZinsbindungBis(phase, idx, zr.ende.toISOString().split('T')[0])}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100">Stimmt so</button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {Object.entries(typLabels).map(([val, label]) => (
                            <button key={val} type="button" onClick={() => updatePhase(phase.id, { darlehensTyp: val })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${(phase.darlehensTyp || 'annuitaet') === val ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                        {(phase.darlehensTyp === 'kfw' || phase.darlehensTyp === 'bauspardarlehen') && (
                          <p className="text-[11px] text-gray-400 -mt-2 mb-4">
                            Rechnet wie ein Annuitätendarlehen (konstante Rate) — {phase.darlehensTyp === 'kfw' ? 'für Förderkonditionen im Detail bitte den Darlehensvertrag prüfen.' : 'nach Zuteilung entsprechen die Konditionen dem Bausparvertrag.'}
                          </p>
                        )}
                        {idx > 0 && (
                          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <label className="block text-xs font-semibold text-indigo-800 mb-1"><Landmark size={12} className='inline mr-1'/>Restschuld laut Bank (Startbetrag)</label>
                            <div className="flex items-center gap-2">
                              <input type="number" step={1000} value={phase.restschuldOverride ?? ''}
                                placeholder={`Berechnet: ${formatCurrency(phasenBerechnet[idx-1]?.restschuldNachZinsbindung ?? 0)}`}
                                onChange={e => updatePhase(phase.id, { restschuldOverride: e.target.value === '' ? null : parseFloat(e.target.value) || 0 })}
                                className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-base sm:text-sm"/>
                              <span className="text-sm text-gray-500">€</span>
                              {phase.restschuldOverride != null && <button onClick={() => updatePhase(phase.id, { restschuldOverride: null })} className="text-xs text-indigo-600 hover:underline">Auto</button>}
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
                                      className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-indigo-400"/>
                                    <span className="text-xs text-gray-400">{unit}</span>
                                  </div>
                                </div>
                              ))}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Monatl. Rate (optional)</label>
                                <div className="flex items-center gap-1">
                                  <input type="number" min={0} step={10} value={phase.monatlicherBetrag || ''} placeholder={phase.rate ? String(phase.rate) : 'Berechnet'}
                                    onChange={e => updatePhase(phase.id, { monatlicherBetrag: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                                    className="w-full px-2 py-2 border-2 border-indigo-200 bg-indigo-50 rounded-lg text-right font-bold focus:border-indigo-500"/>
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
                                <div className="flex items-center gap-1 mt-1">
                                  <input type="number" min={0} max={100} step={1} value={phase.sondertilgungErlaubtProzent || ''}
                                    placeholder="lt. Vertrag"
                                    onChange={e => updatePhase(phase.id, { sondertilgungErlaubtProzent: e.target.value === '' ? null : parseFloat(e.target.value) })}
                                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-right text-xs" />
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">% erlaubt/Jahr</span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-indigo-50 rounded-xl text-center text-sm">
                              <div><div className="text-xs text-gray-400 mb-1">Startbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                              <div><div className="text-xs text-gray-400 mb-1">Monatl. Rate</div><div className="font-bold text-indigo-700">{formatCurrency(phase.rate)}</div></div>
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
                <button onClick={addPhase} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 text-sm font-semibold transition-all">
                  + Anschlussfinanzierung planen
                </button>

                {/* Abschnitt 3.4: Bausparvertrag als Block in Finanzierung (kein eigener Reiter mehr) */}
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Bausparvertrag</h3>
                  <BausparManager params={params} updateParams={updateParams}/>
                </div>
              </div>
            );
          })()}

          {/* ── FINANZEN: STEUERN ────────────────────────────────────────────── */}
          {activeTab === 'steuern' && (
            <Steuerberechnung params={{ ...params, kaltmiete: gesamtKaltmiete }} ergebnis={ergebnis} immobilie={{ ...immobilie, ...params, kaltmiete: gesamtKaltmiete }} onUpdateParams={updateParams} anteilFaktor={1}/>
          )}

          {/* ── VERMIETUNG: EINNAHMEN (per Wohneinheit) ──────────────────── */}
          {activeTab === 'mieteinnahmen' && (() => {
            const MONATE_KURZ = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
            const aktJahr = new Date().getFullYear();

            return (
              <div className="space-y-4">
                {/* WE-Tab-Leiste */}
                {wohnungen.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Building2 size={40} className="mx-auto mb-2 text-gray-300"/>
                    <p className="text-sm">Erst Wohnungen mit Mieter anlegen.</p>
                    <button onClick={() => setActiveTab('wohnungen')} className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600">→ Zu Wohnungen</button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 overflow-x-auto bg-indigo-50 rounded-xl p-1 -mx-1 px-1">
                      {wohnungen.map((w, idx) => {
                        const eingaenge = w.mietEingaenge || [];
                        const diesJahr = eingaenge.filter(e => new Date(e.datum).getFullYear() === aktJahr).length;
                        return (
                          <button key={idx} onClick={() => setEinnahmenWE(idx)}
                            className={`flex-shrink-0 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-0.5 ${einnahmenWE === idx ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}>
                            <span>{w.name || `WE ${idx + 1}`}</span>
                            <span className={`text-[10px] font-normal ${einnahmenWE === idx ? 'text-white/70' : 'text-gray-400'}`}>
                              {diesJahr}/12 Monate
                            </span>
                          </button>
                        );
                      })}
                      <button onClick={() => setEinnahmenWE('gesamt')}
                        className={`flex-shrink-0 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-0.5 ${einnahmenWE === 'gesamt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}>
                        <span>Gesamt</span>
                        <span className={`text-[10px] font-normal ${einnahmenWE === 'gesamt' ? 'text-white/70' : 'text-gray-400'}`}>alle WE</span>
                      </button>
                    </div>

                    {/* Einzel-WE: MieteinnahmenTracker mit WE-spezifischen Daten */}
                    {einnahmenWE !== 'gesamt' && typeof einnahmenWE === 'number' && einnahmenWE < wohnungen.length && (() => {
                      const w = wohnungen[einnahmenWE];
                      // Per-WE params: Kaltmiete, Anpassungen und Eingänge aus der Wohnung
                      const weParams = {
                        ...params,
                        kaltmiete: Number(w.kaltmiete) || 0,
                        mietAnpassungen: w.mietAnpassungen || [],
                        mietEingaenge: w.mietEingaenge || [],
                        dauerauftrag: false,
                        vermietungsmodell: 'kaltmiete',
                      };
                      // Mietbeginn als Startdatum für die Jahresauswahl im Tracker
                      const weImmobilie = {
                        ...immobilie,
                        kaufdatum: w.mietbeginn || immobilie.kaufdatum,
                      };
                      // updateParams zurückschreiben in wohnungen[idx]
                      const weUpdateParams = (neueParams) => {
                        const neu = [...wohnungen];
                        neu[einnahmenWE] = {
                          ...neu[einnahmenWE],
                          mietAnpassungen: neueParams.mietAnpassungen ?? neu[einnahmenWE].mietAnpassungen,
                          mietEingaenge: neueParams.mietEingaenge ?? neu[einnahmenWE].mietEingaenge,
                        };
                        setWohnungen(neu);
                        aggregiereUndSpeichere(neu);
                      };

                      return (
                        <div>
                          {/* WE-Info-Header */}
                          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                            <div>
                              <p className="font-bold text-gray-800">{w.name || `WE ${einnahmenWE + 1}`}</p>
                              {w.mieterName && <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><User size={12}/>{w.mieterName}{w.mietbeginn && ` · seit ${new Date(w.mietbeginn).toLocaleDateString('de-DE')}`}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black text-emerald-600">{formatCurrency(Number(w.kaltmiete) || 0)}</p>
                              <p className="text-xs text-gray-400">Kaltmiete / Monat</p>
                            </div>
                          </div>
                          {/* key erzwingt Re-Mount beim WE-Wechsel → frischer useState-Zustand */}
                          <MieteinnahmenTracker
                            key={`we-einnahmen-${einnahmenWE}`}
                            params={weParams}
                            updateParams={weUpdateParams}
                            immobilie={weImmobilie}
                            mieterListe={[]}
                          />
                        </div>
                      );
                    })()}

                    {/* Gesamt-Einnahmen-Übersicht */}
                    {einnahmenWE === 'gesamt' && (() => {
                      const [gJahr, setGJahr] = useState(aktJahr);
                      const MONATE = Array.from({ length: 12 }, (_, i) => i + 1);
                      const rows = MONATE.map(m => {
                        const erwartet = wohnungen.reduce((s, w) => {
                          const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date(gJahr, m - 1, 15));
                          const gestartet = !w.mietbeginn || new Date(w.mietbeginn) <= new Date(gJahr, m - 1, 28);
                          return s + (belegt && gestartet ? (Number(w.kaltmiete) || 0) : 0);
                        }, 0);
                        const erhalten = wohnungen.reduce((s, w) => {
                          const we = (w.mietEingaenge || []).filter(e => {
                            const d = new Date(e.datum);
                            return d.getFullYear() === gJahr && d.getMonth() + 1 === m;
                          });
                          return s + we.reduce((ss, e) => ss + (Number(e.betrag) || 0), 0);
                        }, 0);
                        const diff = erhalten - erwartet;
                        const istVergangen = gJahr < aktJahr || (gJahr === aktJahr && m <= new Date().getMonth() + 1);
                        return { m, erwartet, erhalten, diff, istVergangen };
                      });
                      const totalErwartet = rows.reduce((s, r) => s + (r.istVergangen ? r.erwartet : 0), 0);
                      const totalErhalten = rows.reduce((s, r) => s + r.erhalten, 0);

                      return (
                        <div className="space-y-4">
                          {/* Jahresauswahl */}
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-gray-500 font-semibold">Jahr:</span>
                            {[aktJahr - 1, aktJahr, aktJahr + 1].filter(j => j >= (immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : aktJahr)).map(j => (
                              <button key={j} onClick={() => setGJahr(j)}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg ${gJahr === j ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {j}
                              </button>
                            ))}
                          </div>
                          {/* KPI-Karten */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-gray-400 mb-1">Soll (bisher)</p>
                              <p className="text-base font-black text-gray-700">{formatCurrency(totalErwartet)}</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-gray-400 mb-1">Eingegangen</p>
                              <p className="text-base font-black text-emerald-600">{formatCurrency(totalErhalten)}</p>
                            </div>
                            <div className={`border rounded-xl p-3 text-center ${totalErhalten >= totalErwartet ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                              <p className="text-[10px] text-gray-400 mb-1">Differenz</p>
                              <p className={`text-base font-black ${totalErhalten >= totalErwartet ? 'text-emerald-600' : 'text-red-600'}`}>
                                {totalErhalten >= totalErwartet ? '+' : ''}{formatCurrency(totalErhalten - totalErwartet)}
                              </p>
                            </div>
                          </div>
                          {/* Monatsübersicht */}
                          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monatsübersicht {gJahr} — alle WE</p>
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400 border-b border-gray-100">
                                  <th className="text-left py-2 px-4 font-semibold">Monat</th>
                                  <th className="text-right py-2 px-2 font-semibold">Soll</th>
                                  <th className="text-right py-2 px-2 font-semibold">Erhalten</th>
                                  <th className="text-right py-2 px-4 font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {rows.map(r => (
                                  <tr key={r.m} className={!r.istVergangen ? 'opacity-40' : ''}>
                                    <td className="py-2 px-4 font-semibold text-gray-700">{MONATE_KURZ[r.m - 1]}</td>
                                    <td className="py-2 px-2 text-right text-gray-500">{r.erwartet > 0 ? formatCurrency(r.erwartet) : '—'}</td>
                                    <td className={`py-2 px-2 text-right font-semibold ${r.erhalten > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                                      {r.erhalten > 0 ? formatCurrency(r.erhalten) : '—'}
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                      {!r.istVergangen ? <span className="text-gray-300">—</span>
                                        : r.erwartet === 0 ? <span className="text-gray-300">—</span>
                                        : r.erhalten >= r.erwartet
                                          ? <span className="text-emerald-600 font-bold flex items-center gap-0.5 justify-end"><Check size={11}/>OK</span>
                                          : r.erhalten > 0
                                            ? <span className="text-orange-500 font-semibold">Teilzahlung</span>
                                            : <span className="text-red-500 font-semibold flex items-center gap-0.5 justify-end"><AlertTriangle size={11}/>Offen</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                                  <td className="py-2 px-4 text-gray-700">Gesamt</td>
                                  <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(totalErwartet)}</td>
                                  <td className="py-2 px-2 text-right text-emerald-700">{formatCurrency(totalErhalten)}</td>
                                  <td className={`py-2 px-4 text-right ${totalErhalten >= totalErwartet ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {totalErhalten >= totalErwartet ? '+' : ''}{formatCurrency(totalErhalten - totalErwartet)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          <p className="text-xs text-gray-400 text-center">Zahlungen pro WE erfassen → WE-Tab anklicken</p>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            );
          })()}

          {/* ── VERMIETUNG: MIETER ───────────────────────────────────────────── */}
          {activeTab === 'mieter' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 min-w-0">
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
                setHasChanges(false); // bereits persistiert — "ungespeichert"-Hinweis nicht fälschlich stehen lassen
              }}
              onMieteingaengeClick={() => setActiveTab('mieteinnahmen')}
                onNebenkostenClick={() => setActiveTab('nkabrechnung')}
            />
            </div>
            <WasDuHierTunKannst
              onNebenkosten={() => setActiveTab('nkabrechnung')}
              onMieteingaenge={() => setActiveTab('mieteinnahmen')}
            />
            </div>
          )}

          {/* ── VERMIETUNG: NK-ABRECHNUNG ────────────────────────────────────── */}
          {activeTab === 'nkabrechnung' && (
            <NKAbrechnungTab params={params} updateParams={updateParams} immobilie={immobilie}/>
          )}

          {/* ── VERMIETUNG: KAUTION — Abschnitt 3.7: Block auf der Mieter-Seite ── */}
          {activeTab === 'mieter' && (
            <div className="space-y-3 mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">Kaution je Wohnung</h3>
              {wohnungen.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Key size={40} className="mx-auto mb-2 text-gray-300"/>
                  <p className="text-sm">Erst Wohnungen anlegen, dann Kaution verwalten.</p>
                  <button onClick={() => setActiveTab('wohnungen')} className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600">
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
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 text-right"/>
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

          {/* ── OBJEKT — Abschnitt 3.9: eine Seite mit Sprungleiste links ────────── */}
          {MFH_OBJEKT_IDS.includes(activeTab) && (() => {
            const setQm = (value) => {
              setQmPreis(value);
              const n = parseFloat(value) || 0;
              if (n > 0 && gesamtFlaeche > 0) {
                updateParams({ ...params, geschaetzterWert: Math.round(n * gesamtFlaeche), geschaetzterWertDatum: new Date().toISOString().split('T')[0] });
              }
            };
            const setWert = (value) => {
              const n = parseFloat(value) || 0;
              updateParams({ ...params, geschaetzterWert: n, geschaetzterWertDatum: new Date().toISOString().split('T')[0] });
              if (n > 0 && gesamtFlaeche > 0) setQmPreis(String(Math.round(n / gesamtFlaeche)));
            };
            const feld = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 text-base sm:text-sm bg-white';
            return (
            <div className="lg:flex lg:gap-6 lg:items-start">
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mb-5 lg:mb-0 lg:w-48 lg:shrink-0 lg:sticky lg:top-36 lg:self-start">
                {[
                  ['mfh-objekt-stammdaten', 'Stammdaten'],
                  ['mfh-objekt-kaufwert', 'Kauf & Wert'],
                  ['mfh-objekt-weg', 'WEG & Verwaltung'],
                  ['mfh-objekt-investitionen', 'Investitionen'],
                  ['mfh-objekt-zaehler', 'Zähler'],
                  ['mfh-objekt-dokumente', 'Dokumente'],
                  ['mfh-objekt-eigentum', 'Eigentum & Prognose'],
                ].map(([anchorId, label]) => (
                  <button key={anchorId}
                    onClick={() => document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors whitespace-nowrap lg:text-left">
                    {label}
                  </button>
                ))}
              </nav>
              <div className="flex-1 min-w-0 space-y-5">
                {/* Stammdaten */}
                <div id="mfh-objekt-stammdaten" className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Stammdaten</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div><label className="block text-sm text-gray-600 mb-1">Objektart</label><div className="px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50">Mehrfamilienhaus</div></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Wohneinheiten</label><div className="px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50">{wohnungen.length}</div></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Wohnfläche gesamt</label><div className="px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50">{gesamtFlaeche > 0 ? `${gesamtFlaeche} m²` : '—'}</div><p className="text-[10px] text-gray-400 mt-0.5">Summe der Wohnungen</p></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Baujahr</label>
                      <input type="number" value={params.baujahr || ''} onChange={e => updateParams({ ...params, baujahr: e.target.value === '' ? '' : (parseInt(e.target.value) || '') })} className={feld}/></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Heizungsart</label>
                      <select value={params.heizungsart || ''} onChange={e => updateParams({ ...params, heizungsart: e.target.value })} className={feld}>
                        <option value="">nicht angegeben</option>
                        {['Gas', 'Öl', 'Fernwärme', 'Wärmepumpe', 'Pellets/Holz', 'Elektro/Nachtspeicher', 'Sonstige'].map(h => <option key={h} value={h}>{h}</option>)}
                      </select></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Energieausweis gültig bis</label>
                      <input type="date" value={params.energieausweisGueltigBis || ''} onChange={e => updateParams({ ...params, energieausweisGueltigBis: e.target.value })} className={feld}/></div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={!!params.keller} onChange={e => updateParams({ ...params, keller: e.target.checked })} className="w-4 h-4 accent-indigo-600"/>
                        Keller vorhanden
                      </label>
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={!!params.garage} onChange={e => updateParams({ ...params, garage: e.target.checked })} className="w-4 h-4 accent-indigo-600"/>
                        Stellplatz / Garage
                      </label>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3">Bezeichnung, Straße, PLZ und Ort ändern über „Bearbeiten“ oben rechts. Etage, Fläche und Miete je Wohnung im Reiter „Wohnungen“.</p>
                </div>

                {/* Kauf & Wert */}
                <div id="mfh-objekt-kaufwert" className="bg-indigo-50 border border-indigo-100 p-4 sm:p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3">Kauf & Wert</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div><label className="block text-sm text-gray-600 mb-1">Kaufdatum</label>
                      <input type="date" value={params.kaufdatum || ''} onChange={e => updateParams({ ...params, kaufdatum: e.target.value })} className={feld}/></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Kaufpreis</label>
                      <div className="px-3 py-2 border border-indigo-100 rounded-lg text-sm bg-white/60 font-semibold text-gray-800">{params.kaufpreis ? formatCurrency(params.kaufpreis) : '—'}</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Änderung über „Bearbeiten“ (wirkt auf die Finanzierung)</p></div>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preis pro m²</label>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <input type="number" value={qmPreis} onChange={e => setQm(e.target.value)}
                      className="w-32 px-3 py-2 text-base sm:text-lg font-bold text-indigo-700 border border-indigo-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400"/>
                    <span className="text-sm font-bold text-indigo-700">€/m²</span>
                    <span className="text-gray-400">×</span>
                    <span className="text-sm text-gray-600">{gesamtFlaeche > 0 ? `${gesamtFlaeche} m²` : 'Wohnflächen der Wohnungen fehlen'}</span>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marktwert</label>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="number" value={params.geschaetzterWert || ''} onChange={e => setWert(e.target.value)}
                      className="w-44 px-3 py-2 text-base sm:text-xl font-bold text-indigo-700 border border-indigo-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400"/>
                    <span className="text-xl font-bold text-indigo-700">€</span>
                  </div>
                  <a href={`https://www.homeday.de/de/preisatlas/${immobilie.plz ? '?search=' + immobilie.plz : ''}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                    <Search size={14}/> Preis bei Homeday recherchieren
                  </a>
                  <p className="text-xs text-gray-400 mt-2">
                    {params.geschaetzterWertDatum ? `Zuletzt aktualisiert am ${new Date(params.geschaetzterWertDatum).toLocaleDateString('de-DE')}` : 'Noch nie aktualisiert'}
                  </p>
                </div>

                {/* WEG & Verwaltung */}
                <div id="mfh-objekt-weg" className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">WEG & Verwaltung</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-sm text-gray-600 mb-1">Hausverwaltung</label>
                      <input type="text" value={params.hausverwaltungName || ''} onChange={e => updateParams({ ...params, hausverwaltungName: e.target.value })} className={feld}/></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Ansprechpartner</label>
                      <input type="text" value={params.hausverwaltungAnsprechpartner || ''} onChange={e => updateParams({ ...params, hausverwaltungAnsprechpartner: e.target.value })} className={feld}/></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Kontakt (Telefon/E-Mail)</label>
                      <input type="text" value={params.hausverwaltungKontakt || ''} onChange={e => updateParams({ ...params, hausverwaltungKontakt: e.target.value })} className={feld}/></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Miteigentumsanteil <span className="text-gray-400 text-xs">(nur bei WEG)</span></label>
                      <input type="text" value={params.miteigentumsanteil || ''} onChange={e => updateParams({ ...params, miteigentumsanteil: e.target.value })} className={feld}/></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Nächste Eigentümerversammlung <span className="text-gray-400 text-xs">(nur bei WEG)</span></label>
                      <input type="date" value={params.naechsteEigentuemerversammlung || ''} onChange={e => updateParams({ ...params, naechsteEigentuemerversammlung: e.target.value })} className={feld}/></div>
                  </div>
                </div>

                {/* Investitionen */}
                <div id="mfh-objekt-investitionen">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide pt-2 mb-3">Investitionen</h3>
                  <ReparaturenInvestitionen
                    immobilie={{ ...immobilie, investitionen: params.investitionen }}
                    onUpdate={(updated) => updateParams({ ...params, investitionen: updated.investitionen })}
                  />
                </div>

                {/* Zähler */}
                <div id="mfh-objekt-zaehler">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide pt-2 mb-3">Zähler</h3>
                  <ZaehlerVerwaltung params={params} updateParams={(neu) => updateParams(neu)}/>
                </div>

                {/* Dokumente */}
                <div id="mfh-objekt-dokumente">
                  <DokumenteTab
                    immobilie={immobilie}
                    dokumente={params.dokumente || []}
                    onDokumentUpdate={async (neueDokumente) => {
                      const updated = { ...params, dokumente: neueDokumente };
                      updateParams(updated);
                      await onSave({ ...updated, wohnungen });
                      setHasChanges(false);
                    }}
                  />
                </div>

                {/* Eigentum & Prognose */}
                <div id="mfh-objekt-eigentum" className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Eigentum & Prognose</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Eigentumsform: <strong>{params.eigentumsform === 'gbr' ? `Gemeinschaft (GbR), Ihr Anteil ${params.userAnteil ?? 100} %` : 'Alleineigentum'}</strong>
                    <span className="text-xs text-gray-400 ml-2">— ändern über „Bearbeiten“</span>
                  </p>
                  <InputSliderCombo label="Angenommene Wertsteigerung p.a." value={params.wertsteigerung ?? 0} onChange={(v) => updateParams({ ...params, wertsteigerung: v })} min={0} max={5} step={0.1} unit="%" />
                </div>
              </div>
            </div>
            );
          })()}

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
                    <input type="number" value={wohnungForm.wohnflaeche ?? ''} onChange={e => setWohnungForm({...wohnungForm, wohnflaeche: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0)})}
                      className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kaltmiete (€/mo)</label>
                    <input type="number" value={wohnungForm.kaltmiete ?? ''} onChange={e => setWohnungForm({...wohnungForm, kaltmiete: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0)})}
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
                      <input type="number" value={wohnungForm.kautionBetrag || ''} onChange={e => setWohnungForm({...wohnungForm, kautionBetrag: parseFloat(e.target.value) || 0})}
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
              <button onClick={saveWohnung} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MehrfamilienhausDetail;
