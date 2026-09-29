import { useState, useMemo, useEffect, useRef } from 'react';
import { TabErrorBoundary } from './ErrorBoundary';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuellerWert, berechneMietStatusFuerMonat } from '../utils/miete.js';
import { berechneWertsteigerungSeitKauf, berechneRendite, kostenStruktur, berechneMtlCashflow } from '../utils/berechnung.js';
import { darlehensVerlauf } from '../utils/darlehen.js';
import FinanzierungsReiter from './FinanzierungsReiter';
import PlausiPruefung from './PlausiPruefung';
import { pruefeImmobilie, zaehle, brauchtErinnerung } from '../utils/plausibilitaet.js';
import InputSliderCombo from './InputSliderCombo.jsx';
import MieterDashboard from './MieterDashboard';
import MieterhoeungModal from './MieterhoeungModal';
import JetztDran from './JetztDran';
import { MietanpassungenTabelle, WasDuHierTunKannst } from './MieterSeitenleiste';
import { erstelleZahlungserinnerung } from '../utils/mahnung.js';
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
import InfoHint from './InfoHint';
import { DetailNavigation, ZurueckZumCockpit, KennzahlenZeile } from './DetailNavigation';
import { phasenZeitraeume, finanzierungsStatus } from '../utils/finanzierung.js';
import { beleihbarFrei, getBeleihungsgrenze } from '../utils/kapital.js';
import { uploadDokument, deleteDokument, getDokumentUrl } from '../supabaseClient';
import {
  BarChart3, Wallet, Users, Wrench, Home, Landmark, MapPin, AlertTriangle,
  Pencil, X, Check, CheckCircle2, ParkingCircle, Car, FileText, CalendarDays,
  TrendingUp, TrendingDown, Building2, Key, User, Search, Upload, Download,
  Trash2, FolderOpen, Loader2, ClipboardList, Zap, Receipt, Hash, MoreVertical,
} from 'lucide-react';

// ─── Dokumente-Tab ────────────────────────────────────────────────────────────
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
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5"><FileText size={16}/> Dokumente</h3>
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
              {t}
            </button>
          ))}
        </div>

        <label className={`flex flex-col items-center justify-center gap-2 cursor-pointer py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
            {uploading ? <Loader2 size={24} className="animate-spin text-indigo-400"/> : <Upload size={24} className="text-indigo-400"/>}
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
            <AlertTriangle size={14} className="inline mr-1"/>{uploadFehler}
          </div>
        )}
      </div>

      {/* Dokumentenliste */}
      {dokumente.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FolderOpen size={32} className="mx-auto mb-2 text-slate-300"/>
          <p className="text-sm">Noch keine Dokumente hochgeladen</p>
          <p className="text-xs mt-1">PDF, Bilder, Word- & Excel-Dateien werden unterstützt</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...dokumente].reverse().map(doc => (
            <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <FileText size={18} className="flex-shrink-0 text-slate-400"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{doc.typ}</span>
                  {doc.mieterName && (
                    <span className="text-xs bg-blue-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium"><User size={10} className="inline mr-0.5"/> {doc.mieterName}</span>
                  )}
                  <span className="text-xs text-slate-400">{formatBytes(doc.groesse)}</span>
                  <span className="text-xs text-slate-400">{new Date(doc.hochgeladenAm).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleDownload(doc)} disabled={ladeId === doc.id}
                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                  title="Herunterladen">
                  {ladeId === doc.id ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                </button>
                <button onClick={() => handleDelete(doc)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Löschen">
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

// Abschnitt 3.9: die vier ehemaligen Objekt-Subtabs sind jetzt Abschnitte einer
// einzigen Seite mit Sprungleiste. Diese IDs bleiben als interne Deep-Link-Ziele
// gültig (z.B. VermieterTodos targetTab 'investitionen'), lösen aber alle
// dieselbe zusammengeführte Objekt-Seite aus und scrollen zum passenden Anker.
const OBJEKT_TAB_IDS = ['stammdaten', 'investitionen', 'zaehler', 'dokumente'];

const KaufimmobilieDetail = ({ immobilie, onClose, onEdit, onSave, mieterListe = [], onSaveMieter, onDeleteMieter, nkAbrechnungen = [], onSaveNK, onDeleteNK, portfolio = [], initialTab, aufgaben = [] }) => {
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
    // Gegencheck 2: keine Blanko-Werte (vorher 80 m² / 3 Zimmer / Baujahr 2000,
    // die beim nächsten Speichern mit in die Datenbank geschrieben wurden).
    wohnflaeche: immobilie.wohnflaeche || '',
    zimmer: immobilie.zimmer || '',
    baujahr: immobilie.baujahr || '',
    // Neue EK-Aufteilung
    ekFuerNebenkosten: initEkFuerNebenkosten,
    ekFuerKaufpreis: initEkFuerKaufpreis,
    eigenkapital: immobilie.eigenkapital,
    zinssatz: immobilie.zinssatz ?? 4.0,
    tilgung: immobilie.tilgung ?? 2.0,
    laufzeit: immobilie.laufzeit ?? 25,
    kaltmiete: immobilie.kaltmiete,
    nebenkosten: immobilie.nebenkosten ?? 0,
    // Kein geschätzter Standardwert mehr — vorher wurden hier 100€/30€
    // "blanko" (also ohne dass der Nutzer sie je eingegeben hat) als
    // Instandhaltung/Verwaltung hinterlegt. Fehlt ein Wert, ist er jetzt
    // schlicht 0 — genau wie bei Hausgeld, Strom, Internet, Nebenkosten.
    instandhaltung: immobilie.instandhaltung ?? 0,
    verwaltung: immobilie.verwaltung ?? 0,
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
    bundesland: immobilie.bundesland || '', // Phase H: kein stiller Vorgabewert — Adresse oder Auswahl
    finanzierungsbetrag: immobilie.finanzierungsbetrag ?? null,
    finanzierungsphasen: immobilie.finanzierungsphasen || [
      {
        id: 1,
        name: 'Erstfinanzierung',
        darlehensTyp: 'annuitaet',
        zinsbindung: immobilie.laufzeit ?? 10,
        sollzinssatz: immobilie.zinssatz ?? 4.0,
        anfangstilgung: immobilie.tilgung ?? 2.0,
        monatlicherBetrag: null,
        sondertilgungJaehrlich: 0,
        restschuldOverride: null,
        aktiv: true
      }
    ],
    geschaetzterWert: initialWert,
    // Datum der letzten Marktwert-Pflege — wird automatisch gesetzt, sobald der
    // qm-Preis oder Gesamtwert geändert wird (siehe handleQmPreisChange/
    // handleGesamtwertChange). Grundlage für die spätere "Marktwert veraltet"-Erinnerung.
    geschaetzterWertDatum: immobilie.geschaetzterWertDatum || null,
    // Fälligkeitstag der Miete — Grundlage für "verspätet"/"Miete offen"-Erkennung,
    // war bisher hart auf den 5. codiert (siehe MieteinnahmenTracker).
    mieteFaelligkeitstag: immobilie.mieteFaelligkeitstag ?? 3,
    mietModus: immobilie.mietModus || 'automatisch',
    mietHistorie: immobilie.mietHistorie || {},
    mietEingaenge: immobilie.mietEingaenge || [],
    steuersatz: immobilie.steuersatz || 42,
    gebaeudeAnteilProzent: immobilie.gebaeudeAnteilProzent || 80,
    afaModus: immobilie.afaModus || 'linear',
    afaDegressivWechseljahr: immobilie.afaDegressivWechseljahr || null,
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
    grundsteuerMonat: immobilie.grundsteuerMonat || 0,
    versicherungMonat: immobilie.versicherungMonat || 0,
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
    // Gegencheck 2: Zusatzdaten (seit Migration 012 dauerhaft gespeichert) —
    // müssen hier aus der Immobilie übernommen werden, sonst zeigt die Oberfläche
    // nach dem Neuladen leere Felder, obwohl die Daten gespeichert sind.
    nkAbrechnungen: immobilie.nkAbrechnungen || [],
    kautionen: immobilie.kautionen || [],
    etage: immobilie.etage || '',
    energieausweisGueltigBis: immobilie.energieausweisGueltigBis || '',
    heizungsart: immobilie.heizungsart || '',
    keller: immobilie.keller || false,
    hausverwaltungName: immobilie.hausverwaltungName || '',
    hausverwaltungAnsprechpartner: immobilie.hausverwaltungAnsprechpartner || '',
    hausverwaltungKontakt: immobilie.hausverwaltungKontakt || '',
    miteigentumsanteil: immobilie.miteigentumsanteil || '',
    naechsteEigentuemerversammlung: immobilie.naechsteEigentuemerversammlung || '',
    // Phase E: Kostenstruktur — nicht umlagefähig startet leer (null), nie geschätzt vorbelegt
    hausgeldNichtUmlagefaehig: immobilie.hausgeldNichtUmlagefaehig ?? null,
    kontofuehrung: immobilie.kontofuehrung || 0,
    weitereKostenAktiv: immobilie.weitereKostenAktiv ?? null,
    weitereKostenChips: immobilie.weitereKostenChips || [],
    plausiBestaetigt: immobilie.plausiBestaetigt || {},
    feldHerkunft: immobilie.feldHerkunft || {},
    kostenZahler: immobilie.kostenZahler || {},
    heizung: immobilie.heizung || 0,
    rundfunk: immobilie.rundfunk || 0,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [qmPreis, setQmPreis] = useState(initialQmPreis.toString());
  const [activeTab, setActiveTab] = useState(() => (initialTab === 'pruefen' ? 'uebersicht' : initialTab) || 'uebersicht');
  const [showPlausi, setShowPlausi] = useState(initialTab === 'pruefen');
  const [mieterhoeungMieter, setMieterhoeungMieter] = useState(null); // Mieterhöhungs-Modal
  const [finanzDetailsOffen, setFinanzDetailsOffen] = useState(false);
  // Abschnitt 7.3: Scrollposition sprang beim Tab-Wechsel nicht nach oben —
  // Inhalt konnte mitten in einer langen Ansicht (z.B. Finanzierung) hängen bleiben.
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
    // Abschnitt 3.9: Deep-Links auf einzelne Objekt-Abschnitte (z.B. aus den
    // Vermieter-Aufgaben, targetTab 'investitionen'/'zaehler'/'dokumente') springen
    // zusätzlich zum passenden Anker innerhalb der zusammengeführten Objekt-Seite.
    if (OBJEKT_TAB_IDS.includes(activeTab) && activeTab !== 'stammdaten') {
      requestAnimationFrame(() => {
        document.getElementById(`objekt-${activeTab}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [activeTab]);

  // Abschnitt 6 + 7.2: "Aufgeben" hieß missverständlich wie "Aufgaben" (To-dos) und war
  // optisch gleichrangig neben "Bearbeiten" — jetzt "Verkauft oder abgegeben" im
  // Überlaufmenü, mit richtigem Escape/Klick-daneben/Abbrechen-Verhalten statt <details>.
  const [showUeberlaufMenu, setShowUeberlaufMenu] = useState(false);
  const [showAufgebenDialog, setShowAufgebenDialog] = useState(false);
  const [aufgabedatumEntwurf, setAufgabedatumEntwurf] = useState('');
  const ueberlaufRef = useRef(null);
  const aufgebenDialogRef = useRef(null);
  useEffect(() => {
    if (!showUeberlaufMenu && !showAufgebenDialog) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') { setShowUeberlaufMenu(false); setShowAufgebenDialog(false); } };
    const onClickOutside = (e) => {
      if (showUeberlaufMenu && ueberlaufRef.current && !ueberlaufRef.current.contains(e.target)) setShowUeberlaufMenu(false);
      if (showAufgebenDialog && aufgebenDialogRef.current && !aufgebenDialogRef.current.contains(e.target)) setShowAufgebenDialog(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [showUeberlaufMenu, showAufgebenDialog]);

  const updateParams = (newParams) => {
    setParams(newParams);
    setHasChanges(true);
  };
  // Phase G: Korrekturen/Bestätigungen aus der Plausibilitätsprüfung sofort speichern
  const speichereSofort = (neu) => {
    setParams(neu);
    const gesamtEK = (neu.ekFuerNebenkosten || 0) + (neu.ekFuerKaufpreis || 0);
    onSave({ ...immobilie, ...neu, eigenkapital: gesamtEK });
  };
  const plausiHinweise = useMemo(
    () => pruefeImmobilie({ ...immobilie, ...params }, { portfolio, mieter: mieterListe }),
    [params, portfolio, mieterListe] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const plausiZahl = zaehle(plausiHinweise);

  const handleQmPreisChange = (value) => {
    setQmPreis(value);
    const numValue = parseFloat(value) || 0;
    const flaeche = Number(params.wohnflaeche || immobilie.wohnflaeche) || 0;
    if (numValue > 0 && flaeche > 0) {
      const neuerWert = Math.round(numValue * flaeche);
      updateParams({...params, geschaetzterWert: neuerWert, geschaetzterWertDatum: new Date().toISOString().split('T')[0]});
    }
  };

  const handleGesamtwertChange = (value) => {
    const numValue = parseFloat(value) || 0;
    updateParams({...params, geschaetzterWert: numValue, geschaetzterWertDatum: new Date().toISOString().split('T')[0]});
    const flaeche = Number(params.wohnflaeche || immobilie.wohnflaeche) || 0;
    if (numValue > 0 && flaeche > 0) {
      setQmPreis(Math.round(numValue / flaeche).toString());
    }
  };

  const handleSave = () => {
    const gesamtEK = (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0);
    onSave({ ...immobilie, ...params, eigenkapital: gesamtEK });
    setHasChanges(false);
  };

  const ergebnis = useMemo(() => berechneRendite({
    ...params,
    kaltmiete: getAktuelleMiete(params),
    // Kosten-Anpassungen (Vermieterkosten + WEG/Betriebskosten) genauso wie
    // die Kaltmiete auf den aktuell gültigen, datumsbasierten Wert ziehen —
    // sonst würde die Rendite-KPI weiter den Basiswert zeigen.
    instandhaltung: getAktuellerWert(params, 'instandhaltung'),
    verwaltung: getAktuellerWert(params, 'verwaltung'),
    hausgeld: getAktuellerWert(params, 'hausgeld'),
    strom: getAktuellerWert(params, 'strom'),
    internet: getAktuellerWert(params, 'internet'),
    nebenkosten: getAktuellerWert(params, 'nebenkosten'),
  }), [params]);
  const stellplatzWert = (immobilie.stellplatz?.vorhanden && immobilie.stellplatz?.kaufpreisAnteil)
    ? (immobilie.stellplatz.kaufpreisAnteil * (immobilie.stellplatz.anzahl || 1))
    : 0;
  const aktuellerWert = (params.geschaetzterWert || immobilie.kaufpreis) + stellplatzWert; // params.geschaetzterWert = Wohnungswert, stellplatzWert wird addiert
  const immobilieMitAktuellemKaufdatum = { ...immobilie, kaufdatum: params.kaufdatum };
  const wertsteigerungSeitKauf = berechneWertsteigerungSeitKauf(immobilieMitAktuellemKaufdatum, aktuellerWert);


  const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : new Date().getFullYear();
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const isGbR = params.eigentumsform === 'gbr';
  const anteilFaktor = isGbR ? (params.userAnteil ?? 100) / 100 : 1;
  const anteil = (v) => Math.round(v * anteilFaktor);

  // Vermieter-Aufgaben, gefiltert auf diese Immobilie (bereits rot→gelb→grün sortiert) —
  // gerendert im Cockpit-Block "Jetzt dran" (Abschnitt 3.2) und als Badge im Kopf.
  const eigeneAufgaben = aufgaben.filter(t => t.immoId === immobilie.id);

  // Erwartete Monatsmiete — Basis für Cockpit-Mieteingänge-Grid und 1-Klick-Abhaken.
  // Nutzt dieselbe Status-Logik wie der Mieteinnahmen-Tab (berechneMietStatusFuerMonat),
  // damit hier nie ein anderer Status als dort angezeigt wird (z.B. bei Teilzahlungen).
  const heute = new Date();
  const aktiveMieterKaufobjekt = mieterListe.some(m => m.immobilie_id === immobilie.id && m.aktiv !== false);
  const nkVomMieterAmpel = params.vermietungsmodell === 'kaltmiete_nk' ? (params.nebenkostenVomMieter || 0) : 0;
  const erwarteterMietBetrag = params.dauerauftrag
    ? (params.dauerauftragBetrag || getAktuelleMiete(params) || 0)
    : getAktuelleMiete(params) + nkVomMieterAmpel;

  // Ein-Klick Abhaken direkt aus dem Cockpit — spart den Umweg über den Mieteinnahmen-Tab.
  // Speichert sofort (kein zusätzlicher "Speichern"-Klick nötig, wie bei jeder anderen Änderung hier).
  // Generalisiert auf beliebigen Monat/Jahr, damit auch das 12-Monats-Grid im Cockpit
  // (Abschnitt 3.2) jeden einzelnen Monat direkt abhaken kann, nicht nur den aktuellen.
  const handleMieteAbhakenFuerMonat = (jahr, monatNr, betrag) => {
    const tagImMonat = jahr === heute.getFullYear() && monatNr === heute.getMonth() + 1 ? heute.getDate() : 1;
    const datumISO = new Date(jahr, monatNr - 1, tagImMonat).toISOString().split('T')[0];
    const neuerEingang = { id: Date.now(), datum: datumISO, betrag, typ: 'kaltmiete', notiz: '' };
    const neueParams = { ...params, mietEingaenge: [...(params.mietEingaenge || []), neuerEingang] };
    setParams(neueParams);
    const gesamtEK = (neueParams.ekFuerNebenkosten || 0) + (neueParams.ekFuerKaufpreis || 0);
    onSave({ ...immobilie, ...neueParams, eigenkapital: gesamtEK });
  };
  const handleMieteAbhaken = () => handleMieteAbhakenFuerMonat(heute.getFullYear(), heute.getMonth() + 1, erwarteterMietBetrag);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-[1400px] h-[93vh] sm:h-[95vh] flex flex-col overflow-hidden">
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
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/90 flex items-center gap-1">Kaufimmobilie</span>
                  {isGbR && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                      <Landmark size={11}/> GbR · {params.userAnteil}% Ihr Anteil
                    </span>
                  )}
                  {params.aktiv === false && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-500/60 text-white">
                      Verkauft/abgegeben {params.aufgabedatum ? new Date(params.aufgabedatum).toLocaleDateString('de-DE') : ''}
                    </span>
                  )}
                  {params.aktiv !== false && eigeneAufgaben.length > 0 && (
                    <button onClick={() => setActiveTab('uebersicht')}
                      title={`${eigeneAufgaben.length} offene${eigeneAufgaben.length === 1 ? 'r Punkt' : ' Punkte'}`}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white flex items-center gap-1 ${
                        eigeneAufgaben.some(a => a.priority === 'rot') ? 'bg-red-500/25 text-red-200'
                        : eigeneAufgaben.some(a => a.priority === 'gelb') ? 'bg-amber-500/25 text-amber-200'
                        : 'bg-white/10 text-white/80'
                      }`}>
                      {eigeneAufgaben.length} offene{eigeneAufgaben.length === 1 ? 'r Punkt' : ' Punkte'}
                    </button>
                  )}
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white truncate">{immobilie.name}</h2>
                {(immobilie.plz || immobilie.adresse) && (
                  <p className="text-slate-300 text-sm mt-0.5 flex items-center gap-1"><MapPin size={12}/> {immobilie.plz} {immobilie.adresse}</p>
                )}
                {/* Abschnitt 3.2: Eckdaten im Kopf — nur tatsächlich erfasste Werte */}
                {(() => {
                  const eckdaten = [
                    params.wohnflaeche ? `${params.wohnflaeche} m²` : null,
                    params.zimmer ? `${params.zimmer} Zimmer` : null,
                    params.baujahr ? `Baujahr ${params.baujahr}` : null,
                    params.kaufdatum ? `gekauft ${new Date(params.kaufdatum).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}` : null,
                  ].filter(Boolean);
                  return eckdaten.length > 0 ? <p className="text-slate-400 text-xs mt-0.5">{eckdaten.join(' · ')}</p> : null;
                })()}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {params.aktiv === false ? (
                  <button onClick={() => { updateParams({...params, aktiv: true, aufgabedatum: ''}); }}
                    className="px-3 py-1.5 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-1">
                    <Check size={14}/> Reaktivieren
                  </button>
                ) : (
                  <div className="relative" ref={ueberlaufRef}>
                    <button onClick={() => setShowUeberlaufMenu(v => !v)} title="Weitere Aktionen"
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl transition-colors">
                      <MoreVertical size={16}/>
                    </button>
                    {showUeberlaufMenu && (
                      <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-20 w-56">
                        <button
                          onClick={() => { setAufgabedatumEntwurf(new Date().toISOString().split('T')[0]); setShowUeberlaufMenu(false); setShowAufgebenDialog(true); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium">
                          Verkauft oder abgegeben
                        </button>
                      </div>
                    )}
                    {showAufgebenDialog && (
                      <div ref={aufgebenDialogRef} className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-20 w-72">
                        <p className="text-sm font-bold text-gray-800 mb-1">Als verkauft oder abgegeben markieren</p>
                        <p className="text-xs text-gray-400 mb-3">Daten bleiben für den Steuerexport erhalten.</p>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Datum</label>
                        <input type="date" value={aufgabedatumEntwurf}
                          onChange={e => setAufgabedatumEntwurf(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-xl text-sm mb-3 focus:ring-2 focus:ring-red-400" />
                        <div className="flex gap-2">
                          <button onClick={() => setShowAufgebenDialog(false)}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold">
                            Abbrechen
                          </button>
                          <button onClick={() => { updateParams({...params, aktiv: false, aufgabedatum: aufgabedatumEntwurf}); setShowAufgebenDialog(false); }}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold">
                            Bestätigen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {hasChanges && (
                  <button onClick={handleSave}
                    className="px-4 py-2 bg-white text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm shadow-sm transition-colors">
                    Speichern
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => setActiveTab('stammdaten')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-xl text-sm font-semibold transition-colors"
                    title="Stammdaten bearbeiten">
                    Bearbeiten
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
                  ['Brutto', fmtKPI(ergebnis.bruttorendite)],
                  ['Netto', fmtKPI(ergebnis.nettorendite), 'text-emerald-600'],
                  ['EK-Rendite', ekNv ? 'n. v.' : fmtKPI(ergebnis.eigenkapitalRendite), ekNv ? 'text-gray-400' : 'text-gray-900'],
                  ['Wertsteigerung', wertsteigerungSeitKauf ? `${wsPositiv ? '+' : ''}${wertsteigerungSeitKauf.prozentSteigerung.toFixed(1)} %` : '—', wsPositiv ? 'text-emerald-600' : 'text-red-600'],
                ]} />
              );
            }
            return (
              <div className="grid grid-cols-4 bg-white border-b border-gray-200 divide-x divide-gray-100">
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
                  <div className={`text-base sm:text-xl font-black ${ergebnis.eigenkapitalRendite == null || ergebnis.ekRenditeNichtAussagekraeftig ? 'text-gray-400' : 'text-amber-700'}`}>
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
                        {wsPositiv ? '+' : ''}{formatCurrency(isGbR ? anteil(wertsteigerungSeitKauf.absoluteSteigerung) : wertsteigerungSeitKauf.absoluteSteigerung)}
                      </div>
                    </>
                  ) : (
                    <div className="text-base sm:text-xl font-black text-gray-300">—</div>
                  )}
                </div>
                {isGbR && (
                  <div className="col-span-4 px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold flex items-center gap-1"><Landmark size={12}/> GbR-Modus:</span>
                    <span>Alle Euro-Beträge zeigen Ihren {params.userAnteil}%-Anteil</span>
                    <span className="ml-auto text-violet-400">Rendite-% bleiben unverändert (berechnet auf Ihren EK-Anteil)</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6 pb-6 bg-canvas">
          {/* Tab-Navigation — 2-stufig: 4 Haupt-Tabs + kontextuelle Sub-Tabs */}
          {(() => {
            const aktiveMieterAnzahl = mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false).length;
            // Sub-Tabs ohne Daten dezent zurückstufen, statt gleichrangig neben den
            // aktiv genutzten Bereichen zu stehen — reduziert die gefühlte Komplexität
            // für Nutzer mit z.B. nur einer Wohnung ohne Bausparvertrag/Mieter.
            const HAT_DATEN = {
              mieter:       aktiveMieterAnzahl > 0,
              nkabrechnung: (nkAbrechnungen || []).length > 0,
            };
            // Abschnitt 7.4: dezent zurückgestufte Sub-Tabs waren ohne Erklärung
            // ausgegraut — Tooltip nennt den Grund statt den Nutzer raten zu lassen.
            const LEER_HINWEIS = {
              mieter:       'Noch kein aktiver Mieter hinterlegt',
              nkabrechnung: 'Noch keine Nebenkostenabrechnung erstellt',
            };
            // Abschnitt 2 (Navigation alt/neu): 4 Haupt-Reiter × max. 3 Unter-Reiter.
            // 'Übersicht' → 'Cockpit' (Reiter-Umbenennung aus Abschnitt 6), Bauspar
            // wandert als Block in Finanzierung (Abschnitt 3.4), Kaution als Block
            // in Mieter (Abschnitt 3.7) — beide sind ab hier keine eigenen Subtabs mehr.
            const GRUPPEN = [
              { id: 'uebersicht', icon: <BarChart3 size={13}/>, label: 'Cockpit',  first: 'uebersicht', subs: null },
              { id: 'finanzen',   icon: <Wallet size={13}/>,    label: 'Zahlen',    first: 'cashflow',
                subs: [
                  { id: 'cashflow',    label: 'Cashflow' },
                  { id: 'finanzierung',label: 'Finanzierung' },
                  { id: 'steuern',     label: 'Steuern' },
                ]
              },
              { id: 'vermietung', icon: <Users size={13}/>,     label: 'Vermietung',  first: 'mieteinnahmen',
                subs: [
                  { id: 'mieteinnahmen', label: 'Mieteingänge' },
                  { id: 'mieter',        label: aktiveMieterAnzahl > 0 ? `Mieter (${aktiveMieterAnzahl})` : 'Mieter' },
                  { id: 'nkabrechnung',  label: 'Nebenkosten' },
                ]
              },
              // Abschnitt 3.9: Objekt ist jetzt eine einzige Seite mit Sprungleiste
              // statt vier Unter-Reitern — OBJEKT_TAB_IDS weiter unten sind nur noch
              // interne Deep-Link-Ziele (z.B. aus den Vermieter-Aufgaben), keine
              // sichtbaren Subtabs mehr.
              { id: 'objekt', icon: <Wrench size={13}/>,       label: 'Objekt', first: 'stammdaten', subs: null },
            ];
            const aktiveGruppe = GRUPPEN.find(g =>
              g.id === 'uebersicht' ? activeTab === 'uebersicht'
              : g.id === 'objekt' ? OBJEKT_TAB_IDS.includes(activeTab)
              : g.subs?.some(s => s.id === activeTab)
            ) || GRUPPEN[0];

            return (
              <div className="-mx-3 sm:-mx-6 mb-5 sticky top-0 z-20">
                <DetailNavigation
                  gruppen={GRUPPEN}
                  aktiveGruppeId={aktiveGruppe.id}
                  activeTab={activeTab}
                  onSelect={setActiveTab}
                  leerHinweise={Object.fromEntries(Object.entries(HAT_DATEN).filter(([, v]) => v === false).map(([k]) => [k, LEER_HINWEIS[k]]))}
                />
              </div>
            );
          })()}

          {/* Tab-Inhalte — in TabErrorBoundary eingewickelt:
              resetKey=activeTab setzt die Boundary automatisch zurück wenn
              der User auf einen anderen Tab wechselt */}
          <TabErrorBoundary resetKey={activeTab}>
          {activeTab === 'uebersicht' && (() => {
            // Objekt-Cockpit (Abschnitt 3.2 UX-Umbau): ersetzt die alte Übersicht.
            // Reine Lese- + 1-Klick-Handlungsseite, keine Eingabefelder außer dem
            // Mieteingänge-Grid (siehe Leitsatz 2 im PDF). qm-Preis-Eingabe ist nach
            // Objekt·Stammdaten gewandert (siehe unten, activeTab === 'stammdaten').
            const MONATSNAMEN = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
            const jahrCockpit = heute.getFullYear();
            const kaufjahrCockpit = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : jahrCockpit;
            const kaufmonatCockpit = params.kaufdatum ? new Date(params.kaufdatum).getMonth() + 1 : 1;

            const ksCockpit = kostenStruktur(params, (f) => getAktuellerWert(params, f));
            const monatlicheEinnahmen = getAktuelleMiete(params) + ksCockpit.nkImCashflow + (ergebnis.stellplatzMonatsMiete || 0);
            const monatlicherBetrieb = ksCockpit.bewirtschaftung;
            const monatlicheRateCockpit = ergebnis.monatlicheRate || 0;
            const monatlichesErgebnis = ergebnis.cashflowMonatlich || 0;

            // Finanzierungs-Kurzfassung — "ca."-Schätzung für Tilgungstempo/Schuldenfreiheit,
            // exakte Berechnung inkl. Sondertilgungen bleibt im Finanzierung-Tab.
            // Zinsbindungsende der aktuell laufenden (letzten) Phase, als Datum;
            // ein nur geschätztes Datum wird als "ungeprüft" gekennzeichnet.
            const finStatusCockpit = finanzierungsStatus(params);
            const zinsbindungBisText = finStatusCockpit?.letzte?.ende
              ? finStatusCockpit.letzte.ende.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) + (finStatusCockpit.letzte.endeGeschaetzt ? ' (ungeprüft)' : '')
              : null;
            // Phase F: Restschuld/Tilgung/Schuldenfrei aus dem datumsgenauen Darlehensverlauf
            const verlaufCockpit = darlehensVerlauf(params);
            const rsHeuteCockpit = verlaufCockpit ? verlaufCockpit.restschuldHeute : (ergebnis.effRestschuld || 0);
            const jaehrlicheZinsen = verlaufCockpit ? verlaufCockpit.zinsenImJahr(jahrCockpit) : (ergebnis.effRestschuld || 0) * (ergebnis.effZinssatz || 0) / 100;
            const jaehrlicheTilgung = verlaufCockpit ? verlaufCockpit.tilgungImJahr(jahrCockpit) : Math.max(0, (monatlicheRateCockpit * 12) - jaehrlicheZinsen);
            const schuldenfreiCaText = verlaufCockpit?.abbezahltHeute ? 'bereits' : verlaufCockpit?.schuldenfrei ? `ca. ${verlaufCockpit.schuldenfrei.getFullYear()}` : (jaehrlicheTilgung > 0 && rsHeuteCockpit > 0)
              ? `ca. ${jahrCockpit + Math.round(rsHeuteCockpit / jaehrlicheTilgung)}`
              : null;
            const darlehenAnfang = verlaufCockpit ? verlaufCockpit.fk : (ergebnis.fremdkapital || 0);
            const tilgungsfortschrittProzent = darlehenAnfang > 0
              ? Math.max(0, Math.min(100, 100 - (rsHeuteCockpit / darlehenAnfang) * 100))
              : 0;

            const nettoEK = aktuellerWert - rsHeuteCockpit;
            const aktiverMieter = mieterListe.find(m => m.immobilie_id === immobilie.id && m.aktiv !== false);

            return (
            <div className="space-y-4">
              {/* Jetzt dran — je Aufgabe die passende Handlung (Teil 1) */}
              <JetztDran
                zusatz={brauchtErinnerung(plausiHinweise) ? (
                  <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${plausiZahl.rot > 0 ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-800 truncate">{plausiZahl.rot + plausiZahl.gelb} Zahlen prüfen</div>
                      <div className="text-xs text-gray-400 truncate">{plausiZahl.rot > 0 ? `${plausiZahl.rot} ${plausiZahl.rot === 1 ? 'Widerspruch' : 'Widersprüche'} · ` : ''}Auffällige Werte kurz bestätigen oder korrigieren</div>
                    </div>
                    <button onClick={() => setShowPlausi(true)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-700 shrink-0">Prüfen</button>
                  </div>
                ) : null}
                aufgaben={eigeneAufgaben.filter(a => !String(a.id).startsWith('plausi-'))}
                handler={{
                  onOeffnen: (tab) => setActiveTab(tab),
                  onEingegangen: () => handleMieteAbhaken(),
                  onMahnen: () => erstelleZahlungserinnerung({
                    mieterName: aktiverMieter?.name,
                    objektAdresse: [params.adresse, params.plz].filter(Boolean).join(', '),
                    monatLabel: heute.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
                    betrag: erwarteterMietBetrag,
                    faelligAm: new Date(heute.getFullYear(), heute.getMonth(), params.mieteFaelligkeitstag ?? 3),
                  }),
                  onDurchrechnen: () => setMieterhoeungMieter(aktiverMieter || {}),
                }}
              />

              {!brauchtErinnerung(plausiHinweise) && plausiHinweise.length > 0 && (
                <button onClick={() => setShowPlausi(true)} className="text-xs text-gray-500 hover:text-indigo-700 -mt-2">
                  Datenqualität: {plausiHinweise.length} Hinweis{plausiHinweise.length !== 1 ? 'e' : ''} ansehen →
                </button>
              )}

              {/* Mieteingänge — 12 Monatsfelder für das laufende Jahr, Klick bucht direkt */}
              {aktiveMieterKaufobjekt && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mieteingänge {jahrCockpit}</p>
                    <button onClick={() => setActiveTab('mieteinnahmen')} className="text-xs font-semibold text-indigo-600 hover:underline">Alle ansehen →</button>
                  </div>
                  {(() => {
                    const bisMonat = heute.getMonth() + 1;
                    const abMonat = jahrCockpit === kaufjahrCockpit ? kaufmonatCockpit : 1;
                    let ein = 0, soll = 0;
                    for (let m = abMonat; m <= bisMonat; m++) {
                      const st = berechneMietStatusFuerMonat(params.mietEingaenge, jahrCockpit, m, erwarteterMietBetrag, params.dauerauftrag);
                      soll += erwarteterMietBetrag;
                      ein += st.status === 'dauerauftrag' ? erwarteterMietBetrag : st.summe;
                    }
                    return <p className="text-xs text-gray-500 -mt-2 mb-2">{formatCurrency(ein)} von {formatCurrency(soll)} eingegangen</p>;
                  })()}
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                    {MONATSNAMEN.map((name, idx) => {
                      const monatNr = idx + 1;
                      const istVorKauf = jahrCockpit === kaufjahrCockpit && monatNr < kaufmonatCockpit;
                      const istZukunft = monatNr > (heute.getMonth() + 1);
                      if (istVorKauf || istZukunft) {
                        return <div key={monatNr} className="rounded-lg border border-dashed border-gray-200 py-1.5 text-center text-[10px] text-gray-300">{name}{istZukunft && !istVorKauf && <div className="text-[9px]">{formatCurrency(erwarteterMietBetrag)}</div>}</div>;
                      }
                      const statusMonat = berechneMietStatusFuerMonat(params.mietEingaenge, jahrCockpit, monatNr, erwarteterMietBetrag, params.dauerauftrag).status;
                      const istOk = statusMonat === 'bezahlt' || statusMonat === 'dauerauftrag';
                      return (
                        <button key={monatNr}
                          onClick={() => { if (!istOk) handleMieteAbhakenFuerMonat(jahrCockpit, monatNr, erwarteterMietBetrag); }}
                          title={istOk ? 'Eingegangen' : statusMonat === 'teilweise' ? 'Teilweise eingegangen — klicken zum Ergänzen' : 'Noch offen — klicken zum Abhaken'}
                          className={`rounded-lg py-2 text-center text-[10px] font-bold transition-colors ${
                            istOk ? 'bg-emerald-100 text-emerald-700'
                            : statusMonat === 'teilweise' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-red-50 text-red-500 hover:bg-red-100'
                          }`}>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Monat anklicken = abhaken. Dauerauftrag hinterlegt? Dann hakt renditly automatisch ab.</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  {/* Cashflow pro Monat */}
                  <button onClick={() => setActiveTab('cashflow')} className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cashflow pro Monat</p>
                      <span className="text-xs text-indigo-600 font-semibold">Details →</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div><div className="text-[10px] text-gray-400">Einnahmen</div><div className="text-sm font-bold text-emerald-600">{formatCurrency(monatlicheEinnahmen)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Betrieb</div><div className="text-sm font-bold text-red-500">-{formatCurrency(monatlicherBetrieb)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Kreditrate</div><div className="text-sm font-bold text-red-500">-{formatCurrency(monatlicheRateCockpit)}</div></div>
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
                      <button onClick={() => setActiveTab('stammdaten')} className="text-xs font-semibold text-indigo-600 hover:underline">Wert aktualisieren →</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div><div className="text-[10px] text-gray-400">Marktwert</div><div className="text-sm font-bold text-indigo-700">{formatCurrency(aktuellerWert)}</div></div>
                      <div><div className="text-[10px] text-gray-400">Kaufpreis</div><div className="text-sm font-bold text-gray-600">{formatCurrency(params.kaufpreis)}</div></div>
                      <div>
                        <div className="text-[10px] text-gray-400">Wertsteigerung</div>
                        <div className={`text-sm font-bold ${wertsteigerungSeitKauf && wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {wertsteigerungSeitKauf ? `${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? '+' : ''}${wertsteigerungSeitKauf.prozentSteigerung.toFixed(1)} %` : '—'}
                        </div>
                      </div>
                      <div><div className="text-[10px] text-gray-400" title="Marktwert minus Restschuld">Dein Anteil</div><div className="text-sm font-bold text-indigo-700">{formatCurrency(nettoEK)}</div></div>
                    </div>
                    {aktuellerWert > 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 flex items-baseline justify-between gap-2" title={`${getBeleihungsgrenze()} % vom Marktwert minus Restschuld — was eine Bank dir darauf noch geben würde. Grenze änderbar im Menü oben rechts auf der Startseite.`}>
                        <span className="text-xs font-semibold text-emerald-700">Beleihbar frei <span className="font-normal text-gray-400">bei {getBeleihungsgrenze()} %</span></span>
                        <span className="text-sm font-black text-emerald-700">{formatCurrency(beleihbarFrei(aktuellerWert, rsHeuteCockpit))}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">
                      {params.geschaetzterWertDatum ? `Zuletzt aktualisiert am ${new Date(params.geschaetzterWertDatum).toLocaleDateString('de-DE')}` : 'Marktwert noch nie aktualisiert'}
                    </p>
                  </div>

                  {/* Mieter-Karte */}
                  {aktiverMieter && (
                    <div className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><User size={12}/> Mieter</p>
                        <button onClick={() => setActiveTab('mieter')} className="text-xs text-indigo-600 font-semibold hover:underline">Details →</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div><div className="text-[10px] text-gray-400">Name</div><div className="text-sm font-semibold text-gray-800 truncate">{aktiverMieter.name}</div></div>
                        <div><div className="text-[10px] text-gray-400">Mietbeginn</div><div className="text-sm text-gray-700">{aktiverMieter.mietbeginn ? new Date(aktiverMieter.mietbeginn).toLocaleDateString('de-DE') : '—'}</div></div>
                        <div><div className="text-[10px] text-gray-400">Kaltmiete</div><div className="text-sm text-gray-700">{formatCurrency(getAktuelleMiete(params))}</div></div>
                        {params.vermietungsmodell === 'kaltmiete_nk' && (
                          <div><div className="text-[10px] text-gray-400">Nebenkosten-VZ</div><div className="text-sm text-gray-700">{formatCurrency(params.nebenkostenVomMieter || 0)}</div></div>
                        )}
                        <div><div className="text-[10px] text-gray-400">Kaution</div><div className="text-sm text-gray-700">{aktiverMieter.kaution_betrag ? formatCurrency(aktiverMieter.kaution_betrag) : '—'}</div></div>
                        <div><div className="text-[10px] text-gray-400">Letzte Erhöhung</div><div className="text-sm text-gray-700">{aktiverMieter.letzte_mieterhoehung ? new Date(aktiverMieter.letzte_mieterhoehung).toLocaleDateString('de-DE') : 'nicht hinterlegt'}</div></div>
                      </div>
                      {/* Teil 1: Mieter-Karte mit den zwei häufigsten Handlungen */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button onClick={() => setMieterhoeungMieter(aktiverMieter)}
                          className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                          Mieterhöhung
                        </button>
                        <button onClick={() => setActiveTab('nkabrechnung')}
                          className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                          NK-Abrechnung
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Finanzierung — rechte Spalte */}
                {(ergebnis.fremdkapital || 0) > 0 && (
                  <button onClick={() => setActiveTab('finanzierung')} className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors h-fit">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Finanzierung</p>
                      <span className="text-xs text-indigo-600 font-semibold">Öffnen →</span>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <div className="text-[10px] text-gray-400">Restschuld</div>
                        <div className="text-lg font-black text-gray-800">{formatCurrency(rsHeuteCockpit)}</div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${tilgungsfortschrittProzent}%` }} />
                        </div>
                        {darlehenAnfang > 0 && <div className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(Math.max(0, darlehenAnfang - rsHeuteCockpit))} von {formatCurrency(darlehenAnfang)} getilgt</div>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-[10px] text-gray-400 block">Zins</span><span className="font-semibold">{(ergebnis.effZinssatz || 0).toFixed(2)} %</span></div>
                        <div><span className="text-[10px] text-gray-400 block">Rate</span><span className="font-semibold">{formatCurrency(monatlicheRateCockpit)}</span></div>
                      </div>
                      {zinsbindungBisText && (
                        <div><span className="text-[10px] text-gray-400 block">Zinsbindung bis</span><span className="font-semibold text-sm">{zinsbindungBisText}</span></div>
                      )}
                      {schuldenfreiCaText && (
                        <div><span className="text-[10px] text-gray-400 block">Schuldenfrei</span><span className="font-semibold text-sm">{schuldenfreiCaText}</span></div>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>
            );
          })()}

          {OBJEKT_TAB_IDS.includes(activeTab) && (
            <div className="lg:flex lg:gap-6 lg:items-start">
              {/* Abschnitt 3.9: Sprungleiste LINKS (Desktop) statt vier Unter-Reitern —
                  mobil als horizontale Chip-Leiste oben. Scrollt nur innerhalb der Seite. */}
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mb-5 lg:mb-0 lg:w-48 lg:shrink-0 lg:sticky lg:top-36 lg:self-start">
                {[
                  ['objekt-stammdaten', 'Stammdaten'],
                  ['objekt-kaufwert', 'Kauf & Wert'],
                  ['objekt-weg', 'WEG & Verwaltung'],
                  ['objekt-investitionen', 'Investitionen'],
                  ['objekt-zaehler', 'Zähler'],
                  ['objekt-dokumente', 'Dokumente'],
                  ['objekt-eigentum', 'Eigentum & Prognose'],
                ].map(([anchorId, label]) => (
                  <button
                    key={anchorId}
                    onClick={() => document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors whitespace-nowrap lg:text-left"
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="flex-1 min-w-0 space-y-5">

              {/* Objektdetails */}
              <div id="objekt-stammdaten" />
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
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-right text-base sm:text-sm"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-right text-base sm:text-sm"
                      min={1}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Baujahr</label>
                    <input
                      type="number"
                      value={params.baujahr}
                      onChange={(e) => updateParams({...params, baujahr: e.target.value === '' ? '' : (parseInt(e.target.value) || '')})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-right text-base sm:text-sm"
                      min={1800}
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Objektart</label>
                    <select
                      value={params.objektart || 'eigentumswohnung'}
                      onChange={(e) => updateParams({...params, objektart: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    >
                      <option value="eigentumswohnung">Eigentumswohnung</option>
                      <option value="einfamilienhaus">Einfamilienhaus</option>
                      <option value="doppelhaushälfte">Doppelhaushälfte</option>
                      <option value="reihenhaus">Reihenhaus</option>
                      <option value="grundstück">Grundstück</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Etage</label>
                    <input
                      type="text"
                      value={params.etage || ''}
                      onChange={(e) => updateParams({...params, etage: e.target.value})}
                      placeholder="z.B. 2. OG"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Energieausweis gültig bis</label>
                    <input
                      type="date"
                      value={params.energieausweisGueltigBis || ''}
                      onChange={(e) => updateParams({...params, energieausweisGueltigBis: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                  {/* Abschnitt 3.9: Heizungsart + Keller fehlten in den Stammdaten */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Heizungsart</label>
                    <select
                      value={params.heizungsart || ''}
                      onChange={(e) => updateParams({...params, heizungsart: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm bg-white"
                    >
                      <option value="">nicht angegeben</option>
                      {['Gas', 'Öl', 'Fernwärme', 'Wärmepumpe', 'Pellets/Holz', 'Elektro/Nachtspeicher', 'Sonstige'].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={!!params.keller}
                        onChange={(e) => updateParams({...params, keller: e.target.checked})}
                        className="w-4 h-4 accent-indigo-600" />
                      Keller vorhanden
                    </label>
                  </div>
                </div>
              </div>

              {/* Marktwert — Abschnitt 3.2/3.9: qm-Preis-Eingabe ist von der alten Übersicht
                  hierher gewandert, ins Cockpit gehört nur noch die Kurzfassung (nur lesen). */}
              <div id="objekt-kaufwert" className="bg-indigo-50 border border-indigo-100 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3">Kauf & Wert</h3>
                {/* Abschnitt 3.9: Kaufdatum + Kaufpreis gehören in diesen Abschnitt */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Kaufdatum</label>
                    <input type="date" value={params.kaufdatum || ''}
                      onChange={(e) => updateParams({...params, kaufdatum: e.target.value})}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Kaufpreis</label>
                    <div className="px-3 py-2 border border-indigo-100 rounded-lg text-base sm:text-sm bg-white/60 font-semibold text-gray-800">
                      {params.kaufpreis ? formatCurrency(params.kaufpreis) : '—'}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Änderung über „Bearbeiten“ (wirkt auf die Finanzierung)</p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preis pro m² eingeben</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      value={qmPreis}
                      onChange={(e) => handleQmPreisChange(e.target.value)}
                      className="w-32 px-3 py-2 text-base sm:text-lg font-bold text-indigo-600 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      placeholder="4000"
                    />
                    <span className="text-sm font-bold text-indigo-600">€/m²</span>
                    <span className="text-gray-400">×</span>
                    <span className="text-sm text-gray-600">{params.wohnflaeche ? `${params.wohnflaeche} m²` : 'Wohnfläche fehlt (Stammdaten)'}</span>
                    <span className="text-gray-400">=</span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {stellplatzWert > 0 ? 'Wohnungswert' : 'Berechneter Gesamtwert'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={params.geschaetzterWert || ''}
                      onChange={(e) => handleGesamtwertChange(e.target.value)}
                      className="w-40 px-3 py-2 text-base sm:text-xl font-bold text-indigo-600 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      placeholder="350000"
                    />
                    <span className="text-xl font-bold text-indigo-600">€</span>
                  </div>
                  {stellplatzWert > 0 && (
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">+ {formatCurrency(stellplatzWert)}</span>
                        <span className="text-gray-400">Stellplatz (Kaufpreis)</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-indigo-600">
                        <span>= {formatCurrency(aktuellerWert)}</span>
                        <span className="font-normal text-gray-500">Gesamtwert</span>
                      </div>
                    </div>
                  )}
                </div>
                <a
                  href={`https://www.homeday.de/de/preisatlas/${immobilie.plz ? '?search=' + immobilie.plz : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  <Search size={14}/> Preis bei Homeday recherchieren
                </a>
                <p className="text-xs text-gray-500 mt-2">Trage den qm-Preis von Homeday ein → Gesamtwert wird automatisch berechnet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  {params.geschaetzterWertDatum
                    ? `Zuletzt aktualisiert am ${new Date(params.geschaetzterWertDatum).toLocaleDateString('de-DE')}`
                    : 'Noch nie aktualisiert'}
                </p>
              </div>

              {/* WEG & Verwaltung — Abschnitt 3.9 */}
              <div id="objekt-weg" className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4 flex items-center gap-1.5">WEG & Verwaltung <InfoHint text="WEG = Wohnungseigentümergemeinschaft. Bei Eigentumswohnungen verwaltet sie das gemeinsame Eigentum (z.B. Dach, Treppenhaus) und beschließt über Instandhaltung und Hausgeld." /></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hausverwaltung</label>
                    <input
                      type="text"
                      value={params.hausverwaltungName || ''}
                      onChange={(e) => updateParams({...params, hausverwaltungName: e.target.value})}
                      placeholder="Name der Verwaltung"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ansprechpartner</label>
                    <input
                      type="text"
                      value={params.hausverwaltungAnsprechpartner || ''}
                      onChange={(e) => updateParams({...params, hausverwaltungAnsprechpartner: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Kontakt (Telefon / E-Mail)</label>
                    <input
                      type="text"
                      value={params.hausverwaltungKontakt || ''}
                      onChange={(e) => updateParams({...params, hausverwaltungKontakt: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center gap-1">Miteigentumsanteil <InfoHint text="Rechnerischer Anteil an der Gesamtimmobilie (z.B. „45,32/1000“), meist aus der Teilungserklärung. Bestimmt u.a. den Kostenanteil am Hausgeld und das Stimmgewicht in der WEG." /></label>
                    <input
                      type="text"
                      value={params.miteigentumsanteil || ''}
                      onChange={(e) => updateParams({...params, miteigentumsanteil: e.target.value})}
                      placeholder="z.B. 45,32/1000"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nächste Eigentümerversammlung</label>
                    <input
                      type="date"
                      value={params.naechsteEigentuemerversammlung || ''}
                      onChange={(e) => updateParams({...params, naechsteEigentuemerversammlung: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stellplatz */}
              {(() => {
                const sp = params.stellplatz || {};
                const updateSp = (updates) => updateParams({ ...params, stellplatz: { ...sp, ...updates } });
                const STELLPLATZ_TYPEN = [
                  { value: 'tiefgarage', label: 'Tiefgarage' },
                  { value: 'aussen', label: 'Außenstellplatz' },
                  { value: 'carport', label: 'Carport' },
                  { value: 'doppelparker', label: 'Doppelparker' },
                ];
                const jahresEinnahmen = (sp.vorhanden && sp.istVermietet)
                  ? (sp.monatlicheMiete || 0) * (sp.anzahl || 1) * 12 : 0;
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 sm:p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><ParkingCircle size={14}/> Stellplatz</h3>
                      <button
                        type="button"
                        onClick={() => updateSp({ vorhanden: !sp.vorhanden })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sp.vorhanden ? 'bg-indigo-600' : 'bg-gray-300'}`}
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
                              className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-500"
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
                              className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Kaufpreis-Anteil</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min={0} step={1000}
                                value={sp.kaufpreisAnteil || 0}
                                onChange={e => updateSp({ kaufpreisAnteil: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border rounded-lg text-base sm:text-sm text-right focus:ring-2 focus:ring-indigo-500"
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
                            <span className="text-sm text-emerald-700 font-medium flex items-center gap-1"><ParkingCircle size={14}/> Stellplatz-Mieteinnahmen</span>
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

              {/* Investitionen — Abschnitt 3.9: jetzt Abschnitt dieser Seite statt
                  eigener Unter-Reiter. */}
              <div id="objekt-investitionen">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide pt-2 mb-3">Investitionen</h3>
                <ReparaturenInvestitionen
                  immobilie={{...immobilie, investitionen: params.investitionen}}
                  onUpdate={(updated) => {
                    updateParams({...params, investitionen: updated.investitionen});
                  }}
                />
              </div>

              {/* Zähler */}
              <div id="objekt-zaehler">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide pt-2 mb-3">Zähler</h3>
                <ZaehlerVerwaltung
                  params={params}
                  updateParams={(neu) => updateParams(neu)}
                />
              </div>

              {/* Dokumente */}
              <div id="objekt-dokumente">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide pt-2 mb-3">Dokumente</h3>
                <DokumenteTab
                  immobilie={immobilie}
                  dokumente={params.dokumente || []}
                  onDokumentUpdate={async (neueDokumente) => {
                    const updated = { ...params, dokumente: neueDokumente };
                    updateParams(updated);
                    await onSave(updated);
                    setHasChanges(false);
                  }}
                />
              </div>

              {/* Eigentum & Prognose — Abschnitt 3.9: Eigentumsform (allein/GbR) und
                  angenommene Wertsteigerung gehören inhaltlich zusammen. */}
              <h3 id="objekt-eigentum" className="text-sm font-bold text-slate-400 uppercase tracking-wide pt-2">Eigentum & Prognose</h3>

              {/* Prognose */}
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Prognose</h3>
                <InputSliderCombo label="Wertsteigerung p.a." value={params.wertsteigerung} onChange={(v) => updateParams({...params, wertsteigerung: v})} min={0} max={5} step={0.1} unit="%" />
              </div>

              {/* Eigentumsstruktur / GbR */}
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1"><Landmark size={14}/> Eigentumsstruktur</h3>

                {/* Toggle */}
                <div className="flex gap-2 mb-4">
                  {[['allein',<><User size={13}/> Alleineigentümer</>],['gbr',<><Landmark size={13}/> GbR / Gemeinschaft</>]].map(([val, label]) => (
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
                              <button onClick={() => removePartner(p.id)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={16}/></button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Summen-Validierung */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-3 ${Math.abs(summe - 100) < 0.1 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span>Summe aller Anteile</span>
                        <span className="font-bold">{summe.toFixed(1)}% {Math.abs(summe - 100) < 0.1 ? <Check size={14} className="inline"/> : '≠ 100%'}</span>
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
            // Abschnitt 3.4: Warnung, wenn ein Teil der Gesamtinvestition weder als
            // Eigenkapital noch über den (ggf. manuell gekappten) Kredit abgebildet
            // ist — sonst bleibt dieser Anteil "unsichtbar" und die EK-Rendite wirkt
            // besser, als sie ist (siehe PDF-Beispiel: 8.700 € nirgends abgebildet).
            const unfinanzierterBetrag = Math.max(0, gesamtinvestition - gesamtEK - kreditbetrag);

            const hatDarlehensVerlauf = !!darlehensVerlauf(params);
            const finanzierungsphasen = params.finanzierungsphasen || [{
              id: 1, name: 'Erstfinanzierung', darlehensTyp: 'annuitaet',
              sollzinssatz: params.zinssatz ?? 4.0, anfangstilgung: params.tilgung ?? 2.0,
              monatlicherBetrag: null, zinsbindung: 10,
              monatlicheTilgung: null, tilgungssatz: 2.0, laufzeit: 10,
              sondertilgungJaehrlich: 0, restschuldOverride: null,
            }];

            const berechnePhase = (phase, startKredit) => {
              const monatszins = (phase.sollzinssatz || 0) / 100 / 12;
              // KfW- und Bauspardarlehen laufen rechnerisch wie ein Annuitätendarlehen
              // (konstante Rate über die Zinsbindung) — keine eigene, ungeprüfte
              // Förder-/Bauspar-Zinsformel, um keine falschen Zahlen zu riskieren.
              const typ = ['kfw', 'bauspardarlehen'].includes(phase.darlehensTyp) ? 'annuitaet' : (phase.darlehensTyp || 'annuitaet');

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

            // Teil 3, Abschnitt 5.2 + 6: Zinsbindungsende als Datum, Warnung nur für die letzte Phase
            const zeitraeume = phasenZeitraeume({ ...params, finanzierungsphasen });
            const finStatus = finanzierungsStatus({ ...params, finanzierungsphasen });
            const setZinsbindungBis = (phase, idx, datum) => {
              const z = zeitraeume[idx];
              const upd = { zinsbindungBis: datum || null, zinsbindungBisBestaetigt: !!datum };
              // Jahre für die (jahresgenaue) Berechnung mitführen, damit Rate/Restschuld zum Datum passen
              if (datum && z?.start) {
                const jahre = Math.max(1, Math.round((new Date(datum) - z.start) / (1000 * 60 * 60 * 24 * 365.25)));
                if (phase.darlehensTyp === 'endfaellig') upd.laufzeit = jahre; else upd.zinsbindung = jahre;
              }
              updatePhase(phase.id, upd);
            };

            const updatePhase = (id, updatesRoh) => {
              // Wird die Zinsbindung in Jahren geändert, gilt ein zuvor gesetztes Datum nicht mehr
              const updates = (('zinsbindung' in updatesRoh || 'laufzeit' in updatesRoh) && !('zinsbindungBis' in updatesRoh))
                ? { ...updatesRoh, zinsbindungBis: null, zinsbindungBisBestaetigt: false } : updatesRoh;
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
            // Hinweis (Gegencheck 2): Ein "weiteres Darlehen" (parallel laufend) ist
            // bewusst NICHT als Button vorhanden. Die Rechenlogik kennt nur
            // nacheinander laufende Phasen — ein paralleles Darlehen als Phase
            // angehängt würde erst nach Ablauf der Zinsbindung beginnen, seine Rate
            // fehlte im heutigen Cashflow und die Zinsbindungs-Erinnerung des
            // Hauptdarlehens würde unterdrückt. Braucht eine Erweiterung der
            // Berechnung (siehe Bericht an den Nutzer).

            return (
              <div className="space-y-5">
                <FinanzierungsReiter params={params} updateParams={updateParams} marktwert={aktuellerWert}
                  cashflowNachTilgung={berechneMtlCashflow({ ...immobilie, ...params })} />


                {/* Gesamtinvestition — Abschnitt 3.4: neue Karte oben, mit Warnung
                    falls ein Teil (typischerweise die Kaufnebenkosten) weder als
                    Eigenkapital noch über den Kredit finanziert ist. */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1"><Wallet size={14}/> Gesamtinvestition</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><div className="text-xs text-gray-400 mb-0.5">Kaufpreis</div><div className="font-bold text-gray-800">{formatCurrency(params.kaufpreis)}</div></div>
                    <div><div className="text-xs text-gray-400 mb-0.5">Kaufnebenkosten</div><div className="font-bold text-gray-800">{formatCurrency(kaufnebenkostenAbsolut)}</div></div>
                    <div><div className="text-xs text-gray-400 mb-0.5">Eigenkapital</div><div className="font-bold text-green-700">{formatCurrency(gesamtEK)}</div></div>
                    <div><div className="text-xs text-gray-400 mb-0.5">Summe</div><div className="font-bold text-indigo-700">{formatCurrency(gesamtinvestition)}</div></div>
                  </div>
                  {unfinanzierterBetrag > 1 && (
                    <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-orange-50 border-t border-orange-200 rounded-b-2xl">
                      <p className="text-xs text-orange-700 flex items-start gap-1.5">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5"/>
                        <span><strong>{formatCurrency(unfinanzierterBetrag)}</strong> sind weder als Eigenkapital hinterlegt noch über den Kredit finanziert. Dadurch wirkt die EK-Rendite besser, als sie tatsächlich ist — Kreditbetrag unten prüfen.</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Teil 3: die Details stehen eingeklappt unter der Auswertung */}
                {hatDarlehensVerlauf && (
                  <button onClick={() => setFinanzDetailsOffen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-2xl text-left hover:border-gray-300">
                    <span>
                      <span className="block text-sm font-bold text-gray-800">Alle Eingaben im Detail</span>
                      <span className="block text-xs text-gray-400">Kaufnebenkosten, Eigenkapital, Kreditbetrag, Phasen, Bausparvertrag</span>
                    </span>
                    <span className="text-xs font-semibold text-indigo-600">{finanzDetailsOffen ? 'Zuklappen' : 'Aufklappen'}</span>
                  </button>
                )}
                {(finanzDetailsOffen || !hatDarlehensVerlauf) && (
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
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4 flex items-center gap-1"><Wallet size={14}/> Eigenkapitaleinsatz</h3>
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
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><AlertTriangle size={12}/> {formatCurrency(kaufnebenkostenAbsolut - ekFuerNebenkosten)} Nebenkosten werden mitfinanziert</p>
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
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1"><Landmark size={14}/> Kredit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Kreditbetrag</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step={1000}
                          value={params.finanzierungsbetrag ?? berechneterKredit}
                          onChange={e => updateParams({ ...params, finanzierungsbetrag: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg text-lg font-bold text-right focus:ring-2 focus:ring-indigo-400"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                      <button onClick={() => updateParams({ ...params, finanzierungsbetrag: null })}
                        className="text-xs text-indigo-500 hover:underline mt-1">
                        ↺ Auto ({formatCurrency(berechneterKredit)})
                      </button>
                    </div>
                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400 text-xs">Kaufpreis</span><br/>
                        <strong>{formatCurrency(params.kaufpreis)}</strong>
                        {params.stellplatz?.vorhanden && params.stellplatz?.kaufpreisAnteil > 0 && (
                          <div className="text-xs text-indigo-500 mt-0.5 flex items-center gap-0.5">davon <ParkingCircle size={11}/> {formatCurrency(params.stellplatz.kaufpreisAnteil)} SP</div>
                        )}
                      </div>
                      <div className="text-gray-300">+</div>
                      <div><span className="text-gray-400 text-xs">Nebenkosten</span><br/><strong>{formatCurrency(kaufnebenkostenAbsolut)}</strong></div>
                      <div className="text-gray-300">−</div>
                      <div><span className="text-gray-400 text-xs">Eigenkapital</span><br/><strong>{formatCurrency(gesamtEK)}</strong></div>
                      <div className="text-gray-300">=</div>
                      <div><span className="text-gray-400 text-xs">Kredit (berechnet)</span><br/><strong className="text-indigo-700">{formatCurrency(berechneterKredit)}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Finanzierungsphasen */}
                {finStatus?.luecke && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                    <span>Zwischen {finStatus.luecke.von.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })} und {finStatus.luecke.bis.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })} fehlt eine Finanzierung — Startdatum der Folgephase prüfen.</span>
                  </div>
                )}
                {finStatus?.stufe === 'grau' && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    Die Zinsbindung endet in {Math.ceil(finStatus.monate)} Monaten. Ein Forward-Darlehen kannst du bis zu 60 Monate vorher abschließen.
                  </div>
                )}
                <div className="space-y-4">
                  {phasenMitBerechnung.map((phase, idx) => {
                    // KfW/Bauspardarlehen nutzen für die Eingabefelder und Berechnung
                    // dieselbe Annuitäten-Logik — siehe Kommentar in berechnePhase().
                    const typ = ['kfw', 'bauspardarlehen'].includes(phase.darlehensTyp) ? 'annuitaet' : (phase.darlehensTyp || 'annuitaet');
                    const typLabels = { annuitaet: 'Annuitätendarlehen', tilgung: 'Tilgungsdarlehen', endfaellig: 'Endfälliges Darlehen', kfw: 'KfW-Darlehen', bauspardarlehen: 'Bauspardarlehen' };
                    const zr = zeitraeume[idx];
                    const istLetzte = idx === phasenMitBerechnung.length - 1;
                    // Warnung nur für die letzte Phase — frühere Phasen haben eine Folgephase (= Historie)
                    let zinsbindungsWarnung = null;
                    if (istLetzte && finStatus && zr?.ende && (finStatus.stufe === 'rot' || finStatus.stufe === 'gelb')) {
                      zinsbindungsWarnung = { ablaufDatum: zr.ende, monateZumAblauf: Math.max(0, Math.ceil(finStatus.monate)), abgelaufen: finStatus.stufe === 'rot', kritisch: finStatus.monate < 12, ungeprueft: zr.endeGeschaetzt };
                    }
                    return (
                    <div key={phase.id} className={`bg-white border-2 rounded-2xl p-5 shadow-sm ${idx === 0 ? 'border-indigo-200' : 'border-gray-200'}`}>
                      {zinsbindungsWarnung && (
                        <div className={`mb-4 p-3 rounded-xl flex items-start gap-3 ${zinsbindungsWarnung.abgelaufen ? 'bg-red-100 border border-red-300' : zinsbindungsWarnung.kritisch ? 'bg-orange-100 border border-orange-300' : 'bg-amber-50 border border-amber-200'}`}>
                          <span className="text-xl">{zinsbindungsWarnung.abgelaufen ? <AlertTriangle size={18} className='text-red-600'/> : <AlertTriangle size={18} className='text-amber-600'/>}</span>
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
                              {zinsbindungsWarnung.ungeprueft && ' (Datum ungeprüft — bitte unten bestätigen)'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-400 text-white'}`}>Phase {idx + 1}</span>
                          <input type="text" value={phase.name}
                            onChange={e => updatePhase(phase.id, { name: e.target.value })}
                            className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none text-base" />
                          {phase.startjahr && <span className="text-xs text-gray-400">ab {phase.startjahr}</span>}
                        </div>
                        {idx > 0 && <button onClick={() => deletePhase(phase.id)} className="text-red-400 hover:text-red-600 text-sm">Entfernen</button>}
                      </div>
                      {/* Bank: Kreditinstitut, Darlehensnummer, Ansprechpartner mit Kontakt */}
                      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="block text-xs font-semibold text-slate-600 mb-2"><Landmark size={12} className='inline mr-1'/>Bank</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Kreditinstitut</label>
                            <input type="text" value={phase.kreditinstitut || ''}
                              placeholder="z.B. PSD Bank, Deutsche Bank …"
                              onChange={e => updatePhase(phase.id, { kreditinstitut: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Darlehensnummer</label>
                            <input type="text" value={phase.darlehensnummer || ''}
                              placeholder="z.B. 1234567890"
                              onChange={e => updatePhase(phase.id, { darlehensnummer: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Ansprechpartner</label>
                            <input type="text" value={phase.ansprechpartner || ''}
                              placeholder="Name des Beraters"
                              onChange={e => updatePhase(phase.id, { ansprechpartner: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white" />
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-slate-400">Darlehensvertrag als PDF hinterlegen</span>
                            <button type="button" onClick={() => setActiveTab('dokumente')}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 flex-shrink-0">
                              <FileText size={11} /> In Dokumente hochladen →
                            </button>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Kontakt (Telefon/E-Mail)</label>
                            <input type="text" value={phase.ansprechpartnerKontakt || ''}
                              placeholder="z.B. 089 12345 oder max@bank.de"
                              onChange={e => updatePhase(phase.id, { ansprechpartnerKontakt: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 bg-white" />
                          </div>
                        </div>
                      </div>

                      {/* Auszahlungsdatum nur für die erste Phase als editierbares Feld:
                          spätere Phasen (Anschlussfinanzierungen) werden intern nur
                          jahresgenau verkettet (aktuellesStartjahr += Laufzeit der
                          Vorphase), nicht datumsgenau. Ein Auszahlungsdatum-Feld für
                          Folgephasen anzubieten, ohne dass es in die Berechnung
                          einfließt, wäre ein totes Feld — potenziell verwirrender als
                          gar keins. Eine datumsgenaue Verkettung wäre ein größerer,
                          hier nicht sicher verifizierbarer Umbau der Zins-/Tilgungs-
                          kette und daher bewusst nicht mit angefasst. */}
                      {idx === 0 && (
                        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <label className="block text-xs font-semibold text-slate-600 mb-1"><CalendarDays size={12} className='inline mr-1'/>Auszahlungsdatum <span className="font-normal text-slate-400">(Kreditstart, falls abweichend vom Kaufdatum)</span></label>
                          <div className="flex items-center gap-2">
                            <input type="date" value={phase.kreditStartDatum || ''}
                              placeholder={params.kaufdatum || ''}
                              onChange={e => updatePhase(phase.id, { kreditStartDatum: e.target.value || null })}
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400" />
                            {phase.kreditStartDatum && (
                              <button onClick={() => updatePhase(phase.id, { kreditStartDatum: null })} className="text-xs text-slate-500 hover:underline">↺ Kaufdatum verwenden</button>
                            )}
                            {!phase.kreditStartDatum && params.kaufdatum && (
                              <span className="text-xs text-slate-400">Aktuell: {new Date(params.kaufdatum).toLocaleDateString('de-DE')}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Zinsbindung bis — volles Datum (Teil 2, Fehler 5 / Teil 3, 5.2) */}
                      <div className={`mb-4 p-3 rounded-xl border ${zr?.endeGeschaetzt ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          <CalendarDays size={12} className='inline mr-1'/>{phase.darlehensTyp === 'endfaellig' ? 'Laufzeit bis' : 'Zinsbindung bis'}
                          {zr?.endeGeschaetzt && <span className="ml-2 font-normal text-amber-700">geschätzt — bitte mit dem Kreditvertrag abgleichen</span>}
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="date"
                            value={phase.zinsbindungBis || (zr?.ende ? zr.ende.toISOString().split('T')[0] : '')}
                            onChange={e => setZinsbindungBis(phase, idx, e.target.value)}
                            className={`px-3 py-1.5 border rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-400 ${zr?.endeGeschaetzt ? 'border-amber-400' : 'border-slate-300'}`} />
                          {zr?.endeGeschaetzt && zr?.ende && (
                            <button type="button" onClick={() => setZinsbindungBis(phase, idx, zr.ende.toISOString().split('T')[0])}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100">
                              Stimmt so
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Die Zinsbindung läuft ab Vertragsschluss bzw. Auszahlung, nicht ab Kaufdatum. An diesem Datum hängt die Erinnerung zur Anschlussfinanzierung.</p>
                      </div>

                      <div className="flex gap-2 mb-4 flex-wrap">
                        {Object.entries(typLabels).map(([val, label]) => (
                          <button key={val} type="button"
                            onClick={() => updatePhase(phase.id, { darlehensTyp: val })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${(phase.darlehensTyp || 'annuitaet') === val ? 'border-indigo-500 bg-blue-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
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
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <label className="block text-xs font-semibold text-amber-800 mb-1"><Landmark size={12} className='inline mr-1'/>Tatsächliche Restschuld (Startbetrag laut Bank)</label>
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
                                  className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-indigo-400" />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Anfangstilgung p.a.</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} max={20} step={0.1} value={phase.anfangstilgung ?? 2}
                                  onChange={e => updatePhase(phase.id, { anfangstilgung: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm focus:border-indigo-400" />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Monatl. Rate (optional)</label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} step={10} value={phase.monatlicherBetrag || ''}
                                  placeholder={phase.rate ? String(phase.rate) : 'Berechnet'}
                                  onChange={e => updatePhase(phase.id, { monatlicherBetrag: e.target.value === '' ? null : parseFloat(e.target.value) || null })}
                                  className="w-full px-2 py-2 border-2 border-indigo-200 bg-blue-50 rounded-lg text-right font-bold focus:border-indigo-500" />
                                <span className="text-xs text-gray-400">€</span>
                              </div>
                              <p className="text-[10px] text-indigo-500 mt-0.5">Leer = aus Zinssatz + Tilgung berechnet</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">Zinsbindung <InfoHint text="Zeitraum, für den der Sollzins festgeschrieben ist. Danach ist für die Restschuld eine Anschlussfinanzierung zu aktuellen Konditionen nötig." /></label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={1} max={30} step={1} value={phase.zinsbindung ?? 10}
                                  onChange={e => updatePhase(phase.id, { zinsbindung: parseInt(e.target.value) || 10 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">J.</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">Sondertilgung/Jahr <InfoHint text="Zusätzliche freiwillige Tilgung außer der Rate, die die Restschuld schneller reduziert. Viele Banken erlauben nur einen bestimmten Prozentsatz der Darlehenssumme pro Jahr — siehe Kreditvertrag." /></label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} step={1000} value={phase.sondertilgungJaehrlich || 0}
                                  onChange={e => updatePhase(phase.id, { sondertilgungJaehrlich: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
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
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-blue-50 rounded-xl text-center text-sm">
                            <div><div className="text-xs text-gray-400 mb-1">Startbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Monatl. Rate</div><div className="font-bold text-indigo-700">{formatCurrency(phase.rate)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Zinsen (Monat 1)</div><div className="font-bold text-orange-600">{formatCurrency(phase.erstZinsen)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Tilgung (Monat 1)</div><div className="font-bold text-emerald-600">{formatCurrency(phase.erstTilgung)}<div className="text-[10px] text-gray-400">{(phase.anfangstilgungProzent||0).toFixed(2)}% p.a.</div></div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Restschuld nach {phase.zinsbindung||10}J.</div>
                              <div className={`font-bold ${phase.restschuldNachZinsbindung===0?'text-emerald-600':'text-orange-600'}`}>{phase.restschuldNachZinsbindung===0?<span className='flex items-center justify-center gap-1'><Check size={14}/>Abbezahlt</span>:formatCurrency(phase.restschuldNachZinsbindung)}</div>
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
                                  className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-indigo-400" />
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
                                  className="w-full px-2 py-2 border-2 border-indigo-200 bg-blue-50 rounded-lg text-right font-bold focus:border-indigo-500" />
                                <span className="text-xs text-gray-400">€</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">Zinsbindung <InfoHint text="Zeitraum, für den der Sollzins festgeschrieben ist. Danach ist für die Restschuld eine Anschlussfinanzierung zu aktuellen Konditionen nötig." /></label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={1} max={30} step={1} value={phase.zinsbindung ?? 10}
                                  onChange={e => updatePhase(phase.id, { zinsbindung: parseInt(e.target.value) || 10 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
                                <span className="text-xs text-gray-400">J.</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">Sondertilgung/Jahr <InfoHint text="Zusätzliche freiwillige Tilgung außer der Rate, die die Restschuld schneller reduziert. Viele Banken erlauben nur einen bestimmten Prozentsatz der Darlehenssumme pro Jahr — siehe Kreditvertrag." /></label>
                              <div className="flex items-center gap-1">
                                <input type="number" min={0} step={1000} value={phase.sondertilgungJaehrlich || 0}
                                  onChange={e => updatePhase(phase.id, { sondertilgungJaehrlich: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-base sm:text-sm" />
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-purple-50 rounded-xl text-center text-sm">
                            <div><div className="text-xs text-gray-400 mb-1">Startbetrag</div><div className="font-bold">{formatCurrency(phase.startKredit)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Feste Tilgung/Monat</div><div className="font-bold text-purple-700">{formatCurrency(phase.monatsTilgung)}</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Rate Monat 1 → Ende</div><div className="font-bold text-indigo-700">{formatCurrency(phase.erstRate)} → {formatCurrency(phase.letzteRate)}</div><div className="text-[10px] text-gray-400">Rate sinkt über Zeit</div></div>
                            <div><div className="text-xs text-gray-400 mb-1">Restschuld nach {phase.zinsbindung||10}J.</div>
                              <div className={`font-bold ${phase.restschuldNachZinsbindung===0?'text-emerald-600':'text-orange-600'}`}>{phase.restschuldNachZinsbindung===0?<span className='flex items-center justify-center gap-1'><Check size={14}/>Abbezahlt</span>:formatCurrency(phase.restschuldNachZinsbindung)}</div>
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
                                  className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-right font-semibold focus:border-indigo-400" />
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
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 text-sm font-semibold transition-all">
                  + Anschlussfinanzierung planen
                </button>

                {/* Abschnitt 3.4: Bausparvertrag als eigener Block innerhalb von
                    Finanzierung statt eigenem Subtab — sichtbar bleibt er zusätzlich
                    im Cashflow (die Sparrate fließt dort automatisch als Zeile ein),
                    editierbar ist er nur hier. */}
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Bausparvertrag</h3>
                  <BausparManager params={params} updateParams={updateParams} />
                </div>

                                </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'mieteinnahmen' && (
            <MieteinnahmenTracker
              params={params}
              updateParams={(neu) => (neu.mietEingaenge !== params.mietEingaenge || neu.nkAbrechnungen !== params.nkAbrechnungen ? speichereSofort(neu) : updateParams(neu))}
              immobilie={immobilie}
              mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id && m.aktiv !== false)}
            />
          )}

          {activeTab === 'cashflow' && (
            // Abschnitt 3.3 + Leitsatz 1 (Gegencheck 2): Ergebnisse stehen über bzw.
            // neben den Eingaben, nie darunter. Mobil: Ergebnis zuerst. Desktop:
            // Eingaben links, Ergebnisleiste + Rechenweg rechts daneben.
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
              <div className="order-1 lg:order-2 lg:col-span-2">
                <CashflowUebersicht
                  params={params}
                  ergebnis={ergebnis}
                  immobilie={immobilie}
                  investitionen={params.investitionen}
                  anteilFaktor={anteilFaktor}
                  onOpenFinanzierung={() => setActiveTab('finanzierung')}
                />
              </div>
              <div className="order-2 lg:order-1 lg:col-span-3">
                <MietKostenManager
                  params={params}
                  updateParams={updateParams}
                  immobilie={immobilie}
                  hasChanges={hasChanges}
                  setHasChanges={setHasChanges}
                 plausi={plausiHinweise} />
              </div>
            </div>
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

          {activeTab === 'nkabrechnung' && (
            <NKAbrechnungTab
              params={params}
              updateParams={updateParams}
              immobilie={immobilie}
              mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id)}
            />
          )}

          {activeTab === 'mieter' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Teil 1: links Mieter + Mietanpassungen, rechts Kaution + "Was du hier tun kannst" */}
              <div className="lg:col-span-2 space-y-4 min-w-0">
              <MieterDashboard
                mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id)}
                portfolio={[immobilie]}
                onDelete={onDeleteMieter}
                onSave={onSaveMieter}
                nkAbrechnungen={nkAbrechnungen}
                onSaveNK={onSaveNK}
                onDeleteNK={onDeleteNK}
                immobilieDokumente={params.dokumente || []}
                onDokumentUpdate={async (neueDokumente) => {
                  const updated = { ...params, dokumente: neueDokumente };
                  updateParams(updated);
                  await onSave(updated);
                  setHasChanges(false); // bereits persistiert — "ungespeichert"-Hinweis nicht fälschlich stehen lassen
                }}
                onMieterhoeungClick={(mieter) => setMieterhoeungMieter(mieter)}
                onMieteingaengeClick={() => setActiveTab('mieteinnahmen')}
                onNebenkostenClick={() => setActiveTab('nkabrechnung')}
                onMietanpassungFuerImmobilie={async ({ datum, kaltmiete }) => {
                  // Zieht eine im Mieter-Tab erfasste Mietanpassung in die
                  // Immobilie-level mietAnpassungen nach, damit die Forderung im
                  // Einnahmen-Tab automatisch die neue Miete verwendet.
                  const neueAnpassungen = [...(params.mietAnpassungen || []), { datum, kaltmiete }];
                  const updated = { ...params, mietAnpassungen: neueAnpassungen };
                  updateParams(updated);
                  await onSave({ ...immobilie, ...updated });
                  setHasChanges(false); // bereits persistiert — "ungespeichert"-Hinweis nicht fälschlich stehen lassen
                }}
              />

              <MietanpassungenTabelle
                anpassungen={params.mietAnpassungen || []}
                basisMiete={Number(params.kaltmiete) || 0}
                onAdd={async ({ datum, kaltmiete, grund }) => {
                  const updated = { ...params, mietAnpassungen: [...(params.mietAnpassungen || []), { datum, kaltmiete, grund }] };
                  updateParams(updated);
                  await onSave({ ...immobilie, ...updated });
                  setHasChanges(false);
                  // Letzte Mieterhöhung beim aktiven Mieter nachziehen (Grundlage der Erinnerung)
                  const mAktiv = mieterListe.find(m => m.immobilie_id === immobilie.id && m.aktiv !== false);
                  if (mAktiv && grund !== 'Neuvermietung' && onSaveMieter) {
                    const bisher = mAktiv.letzte_mieterhoehung ? new Date(mAktiv.letzte_mieterhoehung) : null;
                    if (!bisher || new Date(datum) > bisher) {
                      await onSaveMieter({
                        ...mAktiv,
                        mietanpassungenMieter: mAktiv.mietanpassungen_mieter || [],
                        naechsteAnpassungDatum: mAktiv.naechste_anpassung_datum || '',
                        letzteMieterhoehung: datum,
                        kaltmiete,
                      });
                    }
                  }
                }}
              />
              </div>

              <div className="space-y-4">
                {/* Abschnitt 3.7: Kaution als Block auf der Mieter-Seite */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Kaution</h3>
                  <KautionsManager
                    params={params}
                    updateParams={updateParams}
                    mieterListe={mieterListe.filter(m => m.immobilie_id === immobilie.id)}
                  />
                </div>
                <WasDuHierTunKannst
                  onMieterhoehung={() => setMieterhoeungMieter(mieterListe.find(m => m.immobilie_id === immobilie.id && m.aktiv !== false) || {})}
                  onNebenkosten={() => setActiveTab('nkabrechnung')}
                  onMieteingaenge={() => setActiveTab('mieteinnahmen')}
                />
              </div>
            </div>
          )}

          {showPlausi && (
            <PlausiPruefung hinweise={plausiHinweise} params={params} updateParams={speichereSofort} onClose={() => setShowPlausi(false)} />
          )}

          {/* Mieterhöhungs-Modal — auch ohne Mieter-Datensatz (mieterhoeungMieter === {} oder echter Mieter) */}
          {mieterhoeungMieter !== null && (
            <MieterhoeungModal
              mieter={mieterhoeungMieter}
              immobilie={immobilie}
              onClose={() => setMieterhoeungMieter(null)}
              onSave={async (mieterUpdate, immoUpdate) => {
                // 1. Mieter aktualisieren — nur wenn echter Datensatz mit ID
                // WICHTIG: mieterhoeungMieter ist ein DB-Record (snake_case), aber onSaveMieter
                // erwartet camelCase. Deshalb explizit mappen statt nur zu spreaden.
                if (mieterUpdate && mieterhoeungMieter?.id) {
                  await onSaveMieter({
                    ...mieterhoeungMieter,
                    // camelCase-Felder die saveMieter erwartet:
                    mietanpassungenMieter: mieterhoeungMieter.mietanpassungen_mieter || [],
                    naechsteAnpassungDatum: mieterhoeungMieter.naechste_anpassung_datum || '',
                    letzteMieterhoehung: mieterUpdate.letzte_mieterhoehung,
                    kaltmiete: mieterUpdate.kaltmiete,
                  });
                }
                // 2. Immobilie: mietAnpassungen erweitern
                const neueAnpassung = immoUpdate.neueAnpassung;
                const neueAnpassungen = [
                  ...(params.mietAnpassungen || []),
                  { datum: neueAnpassung.datum, kaltmiete: neueAnpassung.kaltmiete },
                ];
                const updated = { ...params, mietAnpassungen: neueAnpassungen };
                updateParams(updated);
                await onSave(updated);
                setHasChanges(false); // bereits persistiert — "ungespeichert"-Hinweis nicht fälschlich stehen lassen
                setMieterhoeungMieter(null);
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
