import { useState, useMemo, useEffect } from 'react';
import { Home, AlertTriangle, ClipboardList, Upload, BarChart3, Download, Calculator, Archive, Heart, PartyPopper, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, ReferenceLine } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { supabase, loadImmobilien, saveImmobilie, deleteImmobilie, loadMieter, saveMieter, deleteMieter, loadNKAbrechnungen, saveNKAbrechnung, deleteNKAbrechnung, loadKalkulationen, saveKalkulation, deleteKalkulation } from './supabaseClient';
import Auth from './Auth';
import LandingPage from './LandingPage';
import { formatCurrency, formatPercent } from './utils/format.js';
import { getAktuelleMiete, getAktuelleWarmmiete, getAktuelleUntermiete, berechneHistorischenArbitrageCashflow } from './utils/miete.js';
import { schaetzeImmobilienwert, berechneWertsteigerungSeitKauf, berechneRestschuld, berechneJahresRateFuerPhasen, berechneRendite, berechneMtlCashflow, berechneImmoVermoegenswerte, berechneJahresZinsenFuerSteuer } from './utils/berechnung.js';
import { showConfirm, ConfirmDialog } from './utils/confirm.jsx';
import { ZAEHLER_TYPEN, NK_KOSTENPOSITIONEN_DEFAULTS, NK_STANDARD_POSITIONEN, CHANGELOG_VERSION, CHANGELOG_EINTRAEGE } from './constants/index.js';
import InputSliderCombo from './components/InputSliderCombo.jsx';
import MieterDashboard from './components/MieterDashboard';
import MieterFormular from './components/MieterFormular';
import MieterAuszug from './components/MieterAuszug';
import NKAbrechnungListe from './components/NKAbrechnungListe';
import NKAbrechnungFormular from './components/NKAbrechnungFormular';
import NKAbrechnungDetail from './components/NKAbrechnungDetail';
import MehrfamilienhausDetail from './components/MehrfamilienhausDetail';
import MietimmobilieDetail from './components/MietimmobilieDetail';
import KaufnebenkostenManager from './components/KaufnebenkostenManager';
import MietKostenManager from './components/MietKostenManager';
import CashflowUebersicht from './components/CashflowUebersicht';
import Steuerberechnung from './components/Steuerberechnung';
import ReparaturenInvestitionen from './components/ReparaturenInvestitionen';
import ZaehlerVerwaltung from './components/ZaehlerVerwaltung';
import BausparManager from './components/BausparManager';
import ZahlungErfassenForm from './components/ZahlungErfassenForm';
import MieteinnahmenTracker from './components/MieteinnahmenTracker';
import NKAbrechnungTab from './components/NKAbrechnungTab';
import NKAbrechnungForm from './components/NKAbrechnungForm';
import NKAbrechnungModal from './components/NKAbrechnungModal';
import KautionsManager from './components/KautionsManager';
import ImmobilienDetail from './components/ImmobilienDetail';
import { ModalErrorBoundary } from './components/ErrorBoundary';
import { ImpressumDatenschutzLinks } from './components/ImpressumDatenschutz';
import KalkulationsModal from './components/KalkulationsModal';
import ImmobilienFormular from './components/ImmobilienFormular';
import ImmobilienKarte from './components/ImmobilienKarte';
import PortfolioOverview from './components/PortfolioOverview';
import PortfolioZiele from './components/PortfolioZiele';
import VermieterTodos from './components/VermieterTodos';
import UpgradeModal from './components/UpgradeModal';
import { useSubscription } from './hooks/useSubscription';



function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Subscription-Status — solange PAYMENTS_LIVE=false ist isPro immer true
  const { isPro, canAddImmo, openCheckout } = useSubscription(session, portfolio.length);
  const [showForm, setShowForm] = useState(false);
  const [showKalkulation, setShowKalkulation] = useState(false);
  const [selectedImmobilie, setSelectedImmobilie] = useState(null);
  const [initialTab, setInitialTab] = useState(null);
  const [editImmobilie, setEditImmobilie] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'
  const [activeView, setActiveView] = useState('portfolio'); // 'portfolio' | 'mieter'
  const [mieterListe, setMieterListe] = useState([]);
  const [showMieterForm, setShowMieterForm] = useState(false);
  const [editMieter, setEditMieter] = useState(null);
  const [selectedMieter, setSelectedMieter] = useState(null);
  const [nkAbrechnungen, setNkAbrechnungen] = useState([]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSelbstauskunftModal, setShowSelbstauskunftModal] = useState(false);
  const [selbstauskunftDaten, setSelbstauskunftDaten] = useState(() => {
    try {
      const saved = localStorage.getItem('selbstauskunft_daten');
      return saved ? JSON.parse(saved) : {
        name: '', familienstand: 'ledig', wohnsituation: 'zur Miete',
        anschrift: '', taetigkeit: '',
        bargeld: '', bargeldBeschreibung: '',
        depot: '', depotBeschreibung: '',
        beteiligungWert: '', beteiligungBeschreibung: '',
        sonstigeVerbindlichkeiten: 'Keine sonstigen Verbindlichkeiten außerhalb der Immobilien-Darlehen.',
      };
    } catch(e) {
      return { name: '', familienstand: 'ledig', wohnsituation: 'zur Miete', anschrift: '', taetigkeit: '', bargeld: '', bargeldBeschreibung: '', depot: '', depotBeschreibung: '', beteiligungWert: '', beteiligungBeschreibung: '', sonstigeVerbindlichkeiten: '' };
    }
  });

  // Changelog einmalig anzeigen wenn neue Version
  useEffect(() => {
    try {
      const seenVersion = localStorage.getItem('changelogVersion');
      if (seenVersion !== CHANGELOG_VERSION) {
        setShowChangelog(true);
      }
    } catch(e) { /* localStorage nicht verfügbar */ }
  }, []);

  // Auth State überwachen
  useEffect(() => {
    // Aktuelle Session abrufen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Auth State Changes abonnieren
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Daten aus Supabase laden wenn eingeloggt
  useEffect(() => {
    if (session) {
      loadPortfolioFromDB();
      loadMieterFromDB();
      loadNKFromDB();
    } else {
      setPortfolio([]);
      setMieterListe([]);
      setNkAbrechnungen([]);
    }
  }, [session]);

  // Portfolio aus Datenbank laden
  const loadPortfolioFromDB = async () => {
    try {
      setSyncStatus('syncing');
      const data = await loadImmobilien();
      setPortfolio(data);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setSyncStatus('error');
    }
  };

  // Mieter aus Datenbank laden
  const loadMieterFromDB = async () => {
    try {
      const data = await loadMieter();
      setMieterListe(data);
    } catch (error) {
      console.error('Fehler beim Laden der Mieter:', error);
    }
  };

  // NK-Abrechnungen laden
  const loadNKFromDB = async () => {
    try {
      const data = await loadNKAbrechnungen();
      setNkAbrechnungen(data);
    } catch (error) {
      console.error('Fehler beim Laden der NK-Abrechnungen:', error);
    }
  };

  const handleSaveNK = async (data) => {
    try {
      const saved = await saveNKAbrechnung(data);
      if (data.id) {
        setNkAbrechnungen(prev => prev.map(a => a.id === data.id ? saved : a));
        toast.success('NK-Abrechnung aktualisiert ✓');
      } else {
        setNkAbrechnungen(prev => [saved, ...prev]);
        toast.success('NK-Abrechnung gespeichert ✓');
      }
    } catch (error) {
      toast.error('Fehler beim Speichern der NK-Abrechnung: ' + error.message);
    }
  };

  const handleDeleteNK = async (id) => {
    try {
      await deleteNKAbrechnung(id);
      setNkAbrechnungen(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error('Fehler beim Löschen: ' + error.message);
    }
  };

  const handleSaveMieter = async (data) => {
    try {
      setSyncStatus('syncing');
      const saved = await saveMieter(data);
      if (data.id) {
        setMieterListe(prev => prev.map(m => m.id === data.id ? saved : m));
        toast.success('Mieter aktualisiert ✓');
      } else {
        setMieterListe(prev => [saved, ...prev]);
        toast.success('Mieter gespeichert ✓');
      }
      setShowMieterForm(false);
      setEditMieter(null);
      setSyncStatus('idle');
    } catch (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
      setSyncStatus('error');
    }
  };

  const handleDeleteMieter = async (id) => {
    if (!(await showConfirm('Mieter wirklich löschen?'))) return;
    try {
      await deleteMieter(id);
      setMieterListe(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      toast.error('Fehler beim Löschen: ' + error.message);
    }
  };

  const handleSave = async (data) => {
    try {
      setSyncStatus('syncing');
      let saved;
      if (editImmobilie) {
        saved = await saveImmobilie({ ...data, id: editImmobilie.id });
        setPortfolio(prev => prev.map(i => i.id === editImmobilie.id ? saved : i));
        setEditImmobilie(null);
        toast.success('Immobilie aktualisiert ✓');
        setShowForm(false); // beim Bearbeiten direkt schließen
      } else {
        saved = await saveImmobilie(data);
        setPortfolio(prev => [...prev, saved]);
        toast.success('Immobilie gespeichert ✓');
        // Formular bleibt offen — ImmobilienFormular zeigt den Nachfrage-Dialog
      }
      setSyncStatus('idle');
      return saved; // wichtig: gespeicherte Immobilie zurückgeben
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setSyncStatus('error');
      toast.error('Fehler beim Speichern: ' + error.message);
      return null;
    }
  };

  const handleDelete = async (id) => {
    if (!(await showConfirm('Immobilie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'))) return;
    try {
      setSyncStatus('syncing');
      await deleteImmobilie(id);
      setPortfolio(prev => prev.filter(i => i.id !== id));
      setSyncStatus('idle');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      setSyncStatus('error');
      toast.error('Fehler beim Löschen: ' + error.message);
    }
  };

  // Logout Funktion
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ─── PDF Selbstauskunft ──────────────────────────────────────────────────────
  const handleSelbstauskunft = () => setShowSelbstauskunftModal(true);

  const generateSelbstauskunftPDF = (daten) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const W = 210;
    const H = 297;
    const heute = new Date();
    const datumStr = heute.toLocaleDateString('de-DE');
    const ORANGE = [180, 100, 20];
    const ORANGE_LIGHT = [254, 248, 240];
    const BLUE_LIGHT = [219, 234, 254];
    let y = 14;

    // ── Titel ────────────────────────────────────────────────────────────────
    pdf.setFontSize(17); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(20, 30, 50);
    pdf.text('Selbstauskunft – Vermögens- & Immobilienübersicht', 14, y);
    y += 6;
    pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 100, 100);
    pdf.text(`${daten.name} · Stand ${datumStr}`, 14, y);
    y += 7;

    // ── Persönliche Daten ────────────────────────────────────────────────────
    pdf.autoTable({
      startY: y,
      body: [
        [
          { content: 'Name', styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT } },
          { content: daten.name },
          { content: 'Familienstand', styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT } },
          { content: daten.familienstand },
          { content: 'Wohnsituation', styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT } },
          { content: daten.wohnsituation },
        ],
        [
          { content: 'Anschrift', styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT } },
          { content: daten.anschrift, colSpan: 2 },
          { content: 'Tätigkeit', styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT } },
          { content: daten.taetigkeit, colSpan: 2 },
        ],
      ],
      styles: { fontSize: 7.5, cellPadding: 2 },
      theme: 'plain',
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 38 },
        2: { cellWidth: 24 }, 3: { cellWidth: 30 },
        4: { cellWidth: 24 }, 5: { cellWidth: 44 },
      },
      margin: { left: 14, right: 14 },
    });
    y = pdf.lastAutoTable.finalY + 7;

    // ── Immobilien-Portfolio ──────────────────────────────────────────────────
    const kaufimmos = portfolio.filter(i => i.immobilienTyp !== 'mietimmobilie');
    pdf.setFontSize(10.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...ORANGE);
    pdf.text(`Immobilien-Portfolio (${kaufimmos.length} Objekte)`, 14, y);
    y += 4;

    const immoRows = kaufimmos.map((immo, idx) => {
      const phase0 = (immo.finanzierungsphasen || [])[0];
      const startDatum = phase0?.kreditStartDatum || immo.kaufdatum;
      const zinsbindung = phase0?.zinsbindung || 10;
      let zinsbindungBisStr = '—';
      if (startDatum && immo.kaufpreis) {
        const d = new Date(startDatum);
        d.setFullYear(d.getFullYear() + zinsbindung);
        zinsbindungBisStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }
      const miete = getAktuelleMiete(immo);
      const rendite = berechneRendite({ ...immo, kaltmiete: miete });
      const rate = rendite.monatlicheRate || 0;
      const nominalbetrag = immo.kaufpreis ? Math.max(0, Math.round(immo.kaufpreis - (immo.eigenkapital || 0))) : 0;
      const bank = phase0?.kreditinstitut || '—';
      const tilgPA = phase0?.anfangstilgung ?? immo.tilgung ?? 2;
      const zinsPA = phase0?.sollzinssatz ?? immo.zinssatz ?? 4;
      const kaufdatumStr = immo.kaufdatum
        ? (() => { const d = new Date(immo.kaufdatum); return `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })()
        : '—';
      const typ = immo.immobilienTyp === 'mehrfamilienhaus' ? 'MFH' : immo.immobilienTyp === 'gewerblich' ? 'Gew.' : 'ETW';
      return [
        idx + 1,
        immo.name || immo.adresse || '—',
        typ,
        immo.anzahlWohnungen || 1,
        immo.wohnflaeche ? `${immo.wohnflaeche}` : '—',
        kaufdatumStr,
        immo.kaufpreis ? `${Math.round(immo.kaufpreis).toLocaleString('de-DE')} €` : '—',
        `${Math.round(immo.geschaetzterWert || immo.kaufpreis || 0).toLocaleString('de-DE')} €`,
        miete > 0 ? `${Math.round(miete)} €` : '—',
        bank,
        nominalbetrag > 0 ? `${nominalbetrag.toLocaleString('de-DE')} €` : '—',
        rate > 0 ? `${rate.toFixed(0)} €` : '—',
        immo.kaufpreis ? `${tilgPA.toFixed(2)} %` : '—',
        immo.kaufpreis ? `${zinsPA.toFixed(2)} %` : '—',
        zinsbindungBisStr,
      ];
    });

    const gesamtKaufpreis = kaufimmos.reduce((s, i) => s + (i.kaufpreis || 0), 0);
    const gesamtVerkehrswert = kaufimmos.reduce((s, i) => s + (i.geschaetzterWert || i.kaufpreis || 0), 0);
    const gesamtMiete = kaufimmos.reduce((s, i) => s + getAktuelleMiete(i), 0);
    const gesamtRate = kaufimmos.reduce((s, i) => {
      const r = berechneRendite({ ...i, kaltmiete: getAktuelleMiete(i) });
      return s + (r.monatlicheRate || 0);
    }, 0);

    immoRows.push([
      { content: 'Summe', colSpan: 6, styles: { fontStyle: 'bold', fillColor: ORANGE_LIGHT } },
      { content: `${Math.round(gesamtKaufpreis).toLocaleString('de-DE')} €`, styles: { fontStyle: 'bold', fillColor: ORANGE_LIGHT, halign: 'right' } },
      { content: `${Math.round(gesamtVerkehrswert).toLocaleString('de-DE')} €`, styles: { fontStyle: 'bold', fillColor: ORANGE_LIGHT, halign: 'right' } },
      { content: `${Math.round(gesamtMiete)} €`, styles: { fontStyle: 'bold', fillColor: ORANGE_LIGHT, halign: 'right' } },
      { content: '', styles: { fillColor: ORANGE_LIGHT } },
      { content: '', styles: { fillColor: ORANGE_LIGHT } },
      { content: `${gesamtRate.toFixed(0)} €`, styles: { fontStyle: 'bold', fillColor: ORANGE_LIGHT, halign: 'right' } },
      { content: '', styles: { fillColor: ORANGE_LIGHT } },
      { content: '', styles: { fillColor: ORANGE_LIGHT } },
      { content: '', styles: { fillColor: ORANGE_LIGHT } },
    ]);

    pdf.autoTable({
      startY: y,
      head: [['#', 'Adresse', 'Art', 'WE', 'Wfl.\nm²', 'Kauf-\ndatum', 'Kaufpreis €', 'Verkehrs-\nwert €', 'Kaltm.\n€/Mon.', 'Bank', 'Nominal-\nbetrag €', 'Rate\n€/Mon.', 'Tilg.\np.a.', 'Zins\np.a.', 'Zinsb.\nbis']],
      body: immoRows,
      styles: { fontSize: 6.2, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: 'bold', fontSize: 6.2, valign: 'bottom' },
      alternateRowStyles: { fillColor: [253, 250, 245] },
      columnStyles: {
        0: { cellWidth: 5, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 7, halign: 'center' },
        3: { cellWidth: 5, halign: 'center' },
        4: { cellWidth: 8, halign: 'right' },
        5: { cellWidth: 10, halign: 'center' },
        6: { cellWidth: 17, halign: 'right' },
        7: { cellWidth: 17, halign: 'right' },
        8: { cellWidth: 12, halign: 'right' },
        9: { cellWidth: 14 },
        10: { cellWidth: 16, halign: 'right' },
        11: { cellWidth: 10, halign: 'right' },
        12: { cellWidth: 9, halign: 'right' },
        13: { cellWidth: 9, halign: 'right' },
        14: { cellWidth: 11, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
    y = pdf.lastAutoTable.finalY + 7;

    // ── Sonstige Vermögenswerte + Vermögens-Kennzahlen (nebeneinander) ────────
    const bargeld = parseFloat(daten.bargeld) || 0;
    const depot = parseFloat(daten.depot) || 0;
    const beteiligung = parseFloat(daten.beteiligungWert) || 0;
    const summeSonstige = bargeld + depot + beteiligung;
    const gesamtMietePA = gesamtMiete * 12;
    const gesamtRatePA = gesamtRate * 12;
    const nettoCF = gesamtMietePA - gesamtRatePA;
    const wertzuwachs = gesamtVerkehrswert - gesamtKaufpreis;
    const bruttoVermoegen = gesamtVerkehrswert + summeSonstige;

    pdf.setFontSize(9.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...ORANGE);
    pdf.text('Sonstige Vermögenswerte', 14, y);
    pdf.text('Vermögens-Kennzahlen', W / 2 + 4, y);
    y += 3;

    const linksStartY = y;
    pdf.autoTable({
      startY: linksStartY,
      head: [['Position', 'Institut / Erläuterung', 'Wert']],
      body: [
        ['Bargeld / Bankguthaben', daten.bargeldBeschreibung || '—', bargeld > 0 ? `${Math.round(bargeld).toLocaleString('de-DE')} €` : '—'],
        ['Depot (Aktien & ETFs)', daten.depotBeschreibung || '—', depot > 0 ? `${Math.round(depot).toLocaleString('de-DE')} €` : '—'],
        ['Beteiligung', daten.beteiligungBeschreibung || '—', beteiligung > 0 ? `${Math.round(beteiligung).toLocaleString('de-DE')} €` : '—'],
        [
          { content: 'Summe sonstige Vermögenswerte', colSpan: 2, styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT } },
          { content: `${Math.round(summeSonstige).toLocaleString('de-DE')} €`, styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT, halign: 'right' } },
        ],
      ],
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 36 }, 2: { cellWidth: 16, halign: 'right' } },
      margin: { left: 14, right: W / 2 + 3 },
    });
    const linksEndeY = pdf.lastAutoTable.finalY;

    pdf.autoTable({
      startY: linksStartY,
      head: [['Kennzahl', 'Wert']],
      body: [
        ['Mieteinnahmen p.a. (kalt)', `${Math.round(gesamtMietePA).toLocaleString('de-DE')} €`],
        ['Darlehensraten p.a. (gesamt)', `${Math.round(gesamtRatePA).toLocaleString('de-DE')} €`],
        [
          { content: 'Netto-Cashflow p.a. (vor Steuern, Instandhaltung)', styles: { fontStyle: 'bold' } },
          { content: `${Math.round(nettoCF).toLocaleString('de-DE')} €`, styles: { fontStyle: 'bold', halign: 'right' } },
        ],
        ['Kaufpreise (Summe)', `${Math.round(gesamtKaufpreis).toLocaleString('de-DE')} €`],
        ['Aktueller Verkehrswert (Summe)', `${Math.round(gesamtVerkehrswert).toLocaleString('de-DE')} €`],
        [
          { content: 'Wertzuwachs Immobilien', styles: { fontStyle: 'bold' } },
          { content: `${wertzuwachs >= 0 ? '+' : ''}${Math.round(wertzuwachs).toLocaleString('de-DE')} €`, styles: { fontStyle: 'bold', textColor: wertzuwachs >= 0 ? [22, 163, 74] : [220, 38, 38], halign: 'right' } },
        ],
        ['+ Sonstige Vermögenswerte (Bargeld, Depot, Beteiligung)', `+${Math.round(summeSonstige).toLocaleString('de-DE')} €`],
        [
          { content: 'Brutto-Vermögensbestand gesamt', styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT } },
          { content: `${Math.round(bruttoVermoegen).toLocaleString('de-DE')} €`, styles: { fontStyle: 'bold', fillColor: BLUE_LIGHT, halign: 'right' } },
        ],
      ],
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 20, halign: 'right' } },
      margin: { left: W / 2 + 4, right: 14 },
    });
    const rechtsEndeY = pdf.lastAutoTable.finalY;
    y = Math.max(linksEndeY, rechtsEndeY) + 6;

    // ── Sonstige Verbindlichkeiten ─────────────────────────────────────────────
    pdf.setFontSize(9.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...ORANGE);
    pdf.text('Sonstige Verbindlichkeiten', 14, y);
    y += 3;
    pdf.autoTable({
      startY: y,
      body: [[daten.sonstigeVerbindlichkeiten || 'Keine sonstigen Verbindlichkeiten außerhalb der Immobilien-Darlehen.']],
      styles: { fontSize: 7.5, cellPadding: 2 },
      theme: 'plain',
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      margin: { left: 14, right: 14 },
    });
    y = pdf.lastAutoTable.finalY + 10;

    // ── Unterschrift ──────────────────────────────────────────────────────────
    if (y > H - 25) { pdf.addPage(); y = 20; }
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 30, 30);
    const ort = (() => {
      const adresse = daten.anschrift || '';
      // Bevorzuge "PLZ Stadtname"-Muster (z.B. "93047 Regensburg")
      const plzMatch = adresse.match(/\b\d{5}\s+([A-ZÄÖÜ][a-zäöüßA-ZÄÖÜ\-]+(?:[\s\-][A-ZÄÖÜ]?[a-zäöüßA-ZÄÖÜ\-]+)*)/);
      if (plzMatch) return plzMatch[1];
      // Fallback: letztes nicht-leeres Komma-Segment ohne führende Zahlen
      const parts = adresse.split(',').map(p => p.trim()).filter(Boolean);
      for (let i = parts.length - 1; i >= 0; i--) {
        const stripped = parts[i].replace(/^\d+\s*/, '');
        if (stripped && !/^\d+$/.test(stripped)) return stripped;
      }
      return adresse.split(/\s+/).filter(t => !/^\d+$/.test(t)).pop() || '';
    })();
    pdf.text(`Ort, Datum: ${ort ? ort + ', ' : ''}${datumStr}`, 14, y);
    pdf.text('Unterschrift: ______________________________', 120, y);

    // ── Footer ────────────────────────────────────────────────────────────────
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150, 150, 150);
      pdf.text(`Seite ${i} von ${pageCount}  ·  Immobilien Portfolio App  ·  ${datumStr}`, W / 2, H - 7, { align: 'center' });
      pdf.text('Diese Aufstellung dient zur internen Übersicht und stellt keine offizielle Bankauskunft dar.', W / 2, H - 3, { align: 'center' });
    }

    pdf.save(`Selbstauskunft_Immobilien_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Portfolio als JSON

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      portfolio: portfolio
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `immobilien-portfolio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Portfolio aus JSON
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        // Validierung
        if (!importData.portfolio || !Array.isArray(importData.portfolio)) {
          toast.error('Ungültiges Dateiformat — bitte eine gültige Export-Datei wählen.');
          return;
        }

        // Frage ob hinzufügen
        const choice = await showConfirm(
          `${importData.portfolio.length} Immobilie(n) gefunden. Zum bestehenden Portfolio hinzufügen?`,
          { danger: false }
        );

        if (choice) {
          setSyncStatus('syncing');
          let importedCount = 0;

          // Jede Immobilie einzeln in die Datenbank speichern
          for (const immo of importData.portfolio) {
            try {
              // ID entfernen damit eine neue erstellt wird
              const { id, ...immoData } = immo;
              const created = await saveImmobilie(immoData);
              setPortfolio(prev => [...prev, created]);
              importedCount++;
            } catch (err) {
              console.error('Fehler beim Importieren einer Immobilie:', err);
            }
          }

          setSyncStatus('idle');
          toast.success(`${importedCount} Immobilie(n) erfolgreich importiert!`);
        }
      } catch (error) {
        toast.error('Fehler beim Importieren: ' + error.message);
        setSyncStatus('error');
      }
    };
    reader.readAsText(file);
    // Reset input für erneuten Import
    event.target.value = '';
  };

  // Steuer-Export Funktion
  const handleSteuerExport = (jahr) => {
    if (!jahr) {
      jahr = new Date().getFullYear();
    }

    // Immobilien die im gewählten Jahr aktiv waren (erworben vor/in dem Jahr und noch nicht aufgegeben vor dem Jahr)
    const kaufimmobilien = portfolio.filter(i => {
      if (i.immobilienTyp === 'mietimmobilie') return false;
      // Muss vor oder in dem Jahr erworben worden sein
      if (i.kaufdatum && new Date(i.kaufdatum).getFullYear() > jahr) return false;
      // Wenn aufgegeben: darf nicht VOR dem Exportjahr aufgegeben worden sein
      if (i.aktiv === false && i.aufgabedatum && new Date(i.aufgabedatum).getFullYear() < jahr) return false;
      return true;
    });
    const mietimmobilien = portfolio.filter(i => {
      if (i.immobilienTyp !== 'mietimmobilie') return false;
      if (i.mietvertragStart && new Date(i.mietvertragStart).getFullYear() > jahr) return false;
      // Wenn Mietvertragsende vor dem Exportjahr: nicht anzeigen
      if (i.mietvertragEnde && new Date(i.mietvertragEnde).getFullYear() < jahr) return false;
      if (i.aktiv === false && i.aufgabedatum && new Date(i.aufgabedatum).getFullYear() < jahr) return false;
      return true;
    });

    // Pro-rata Faktor: berücksichtigt Kauf- UND Aufgabedatum innerhalb des Exportjahres
    const berechneFaktorFuerImmo = (startDatum, endDatum, exportJahr) => {
      let startMonat = 0;  // Januaar = 0
      let endMonat = 11;   // Dezember = 11

      if (startDatum) {
        const d = new Date(startDatum);
        if (d.getFullYear() > exportJahr) return 0;
        if (d.getFullYear() === exportJahr) startMonat = d.getMonth();
      }

      if (endDatum) {
        const d = new Date(endDatum);
        if (d.getFullYear() < exportJahr) return 0;
        if (d.getFullYear() === exportJahr) endMonat = d.getMonth();
      }

      return (endMonat - startMonat + 1) / 12;
    };

    // Jahres-Arbitrage berechnen unter Berücksichtigung von Mietanpassungen (Mietimmobilien)
    const berechneJahresArbitrage = (immo, exportJahr) => {
      const startDatum = immo.mietvertragStart || null;
      // Enddatum: Mietvertragsende hat Vorrang, sonst Aufgabedatum
      const endDatum = immo.mietvertragEnde ||
        ((immo.aktiv === false && immo.aufgabedatum) ? immo.aufgabedatum : null);

      let startMonat = 0;
      let endMonat = 11;

      if (startDatum) {
        const d = new Date(startDatum);
        if (d.getFullYear() > exportJahr) return { einnahmen: 0, eigeneWarmmiete: 0, faktor: 0 };
        if (d.getFullYear() === exportJahr) startMonat = d.getMonth();
      }
      if (endDatum) {
        const d = new Date(endDatum);
        if (d.getFullYear() < exportJahr) return { einnahmen: 0, eigeneWarmmiete: 0, faktor: 0 };
        if (d.getFullYear() === exportJahr) endMonat = d.getMonth();
      }

      const monate = endMonat - startMonat + 1;
      const faktor = monate / 12;
      const anpassungen = immo.mietAnpassungen || [];

      if (anpassungen.length === 0) {
        return {
          einnahmen: (immo.anzahlZimmerVermietet || 0) * (immo.untermieteProZimmer || 0) * monate,
          eigeneWarmmiete: (immo.eigeneWarmmiete || 0) * monate,
          faktor
        };
      }

      const sorted = [...anpassungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
      let gesamtEinnahmen = 0;
      let gesamtWarmmiete = 0;

      for (let m = startMonat; m <= endMonat; m++) {
        const monatDatum = new Date(exportJahr, m, 15);
        let gueltige = null;
        for (const a of sorted) {
          if (new Date(a.datum) <= monatDatum) gueltige = a;
        }
        const untermiete = gueltige?.untermieteProZimmer ?? (immo.untermieteProZimmer || 0);
        const warmmiete = gueltige?.eigeneWarmmiete ?? (immo.eigeneWarmmiete || 0);
        gesamtEinnahmen += (immo.anzahlZimmerVermietet || 0) * untermiete;
        gesamtWarmmiete += warmmiete;
      }

      return { einnahmen: gesamtEinnahmen, eigeneWarmmiete: gesamtWarmmiete, faktor };
    };

    // Jahresmiete berechnen unter Berücksichtigung von Mietanpassungen + Eigentumsdauer
    const berechneJahresmiete = (immo, exportJahr) => {
      const startDatum = immo.kaufdatum || null;
      const endDatum = (immo.aktiv === false && immo.aufgabedatum) ? immo.aufgabedatum : null;

      let startMonat = 0;
      let endMonat = 11;

      if (startDatum) {
        const d = new Date(startDatum);
        if (d.getFullYear() > exportJahr) return 0;
        if (d.getFullYear() === exportJahr) startMonat = d.getMonth();
      }
      if (endDatum) {
        const d = new Date(endDatum);
        if (d.getFullYear() < exportJahr) return 0;
        if (d.getFullYear() === exportJahr) endMonat = d.getMonth();
      }

      const anpassungen = immo.mietAnpassungen || [];
      if (anpassungen.length === 0) {
        // Keine Anpassungen: Basiskaltmiete × Anzahl Monate
        return (immo.kaltmiete || 0) * (endMonat - startMonat + 1);
      }

      // Mit Anpassungen: pro Monat die jeweils gültige Miete ermitteln
      const sorted = [...anpassungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
      let gesamtmiete = 0;
      for (let m = startMonat; m <= endMonat; m++) {
        const monatDatum = new Date(exportJahr, m, 15);
        let gueltige = null;
        for (const a of sorted) {
          if (new Date(a.datum) <= monatDatum) gueltige = a;
        }
        gesamtmiete += gueltige ? gueltige.kaltmiete : (immo.kaltmiete || 0);
      }
      return gesamtmiete;
    };

    // Excel Workbook erstellen
    const wb = XLSX.utils.book_new();

    // ==================== ÜBERSICHT ====================
    const uebersichtData = [
      ['STEUERLICHE ÜBERSICHT ' + jahr],
      ['Erstellt am:', new Date().toLocaleDateString('de-DE')],
      [''],
      ['ZUSAMMENFASSUNG'],
      [''],
      ['Position', 'Betrag (€)', 'Hinweis'],
    ];

    // Einzelne Kostentöpfe für detaillierte Übersicht
    let gesamtEinnahmen = 0;
    let sumSchuldzinsen = 0;
    let sumInstandhaltung = 0;
    let sumVerwaltung = 0;
    let sumHausgeld = 0;
    let sumStrom = 0;
    let sumInternet = 0;
    let sumFahrtkosten = 0;
    let sumErhaltungsaufwand = 0;

    // Berechne Summen
    kaufimmobilien.forEach(immo => {
      const endDatum = (immo.aktiv === false && immo.aufgabedatum) ? immo.aufgabedatum : null;
      const faktor = berechneFaktorFuerImmo(immo.kaufdatum, endDatum, jahr);
      const kaufpreis = immo.kaufpreis || 0;

      const kaltmiete = berechneJahresmiete(immo, jahr);
      gesamtEinnahmen += kaltmiete;

      // Annuitätisch korrekte Schuldzinsen (sinken mit steigender Tilgung, phasenbewusst)
      sumSchuldzinsen   += berechneJahresZinsenFuerSteuer(immo, jahr) * faktor;
      sumInstandhaltung += (immo.instandhaltung || 0) * 12 * faktor;
      sumVerwaltung     += (immo.verwaltung || 0) * 12 * faktor;
      sumHausgeld       += (immo.hausgeld || 0) * 12 * faktor;
      sumStrom          += (immo.strom || 0) * 12 * faktor;
      sumInternet       += (immo.internet || 0) * 12 * faktor;

      const fahrtenProMonat = immo.fahrtenProMonat || 0;
      const entfernungKm = immo.entfernungKm || 0;
      const kmPauschale = immo.kmPauschale || 0.30;
      sumFahrtkosten += fahrtenProMonat * 12 * faktor * entfernungKm * 2 * kmPauschale;

      const investitionen = immo.investitionen || [];
      sumErhaltungsaufwand += investitionen
        .filter(inv => inv.kategorie === 'erhaltung' && new Date(inv.datum).getFullYear() === jahr)
        .reduce((sum, inv) => sum + inv.betrag, 0);
    });

    const gesamtWerbungskosten = sumSchuldzinsen + sumInstandhaltung + sumVerwaltung + sumHausgeld + sumStrom + sumInternet + sumFahrtkosten + sumErhaltungsaufwand;

    // Arbitrage-Einkünfte (pro-rata ab Mietbeginn)
    let arbitrageEinnahmen = 0;
    let arbWarmmiete = 0;
    let arbStrom = 0;
    let arbInternet = 0;
    let arbGEZ = 0;
    mietimmobilien.forEach(immo => {
      const arb = berechneJahresArbitrage(immo, jahr);
      arbitrageEinnahmen += arb.einnahmen;
      arbWarmmiete += arb.eigeneWarmmiete;
      arbStrom     += (immo.arbitrageStrom || 0) * 12 * arb.faktor;
      arbInternet  += (immo.arbitrageInternet || 0) * 12 * arb.faktor;
      arbGEZ       += (immo.arbitrageGEZ || 0) * 12 * arb.faktor;
    });
    const arbitrageAusgaben = arbWarmmiete + arbStrom + arbInternet + arbGEZ;

    const steuerlichesErgebnis = gesamtEinnahmen - gesamtWerbungskosten + (arbitrageEinnahmen - arbitrageAusgaben);

    // ── Übersicht aufbauen ──────────────────────────────────────────
    if (kaufimmobilien.length > 0) {
      uebersichtData.push(
        ['── KAUFIMMOBILIEN ──', '', ''],
        ['Mieteinnahmen', gesamtEinnahmen.toFixed(2), 'Kaltmiete (Summe aller Kaufimmobilien)'],
        ['', '', ''],
        ['  Schuldzinsen', (-sumSchuldzinsen).toFixed(2), 'Fremdkapitalzinsen'],
        ['  Instandhaltung', (-sumInstandhaltung).toFixed(2), 'Rücklagen & lfd. Instandhaltung'],
        ['  Verwaltungskosten', (-sumVerwaltung).toFixed(2), 'Hausverwaltung'],
        ['  Hausgeld / WEG', (-sumHausgeld).toFixed(2), 'Monatliches Hausgeld'],
        ['  Strom', (-sumStrom).toFixed(2), 'Stromkosten (Vermieter)'],
        ['  Internet', (-sumInternet).toFixed(2), 'Internetkosten (Vermieter)'],
        ['  Fahrtkosten', (-sumFahrtkosten).toFixed(2), 'Km-Pauschale für Fahrten zur Immobilie'],
        ['  Erhaltungsaufwand', (-sumErhaltungsaufwand).toFixed(2), 'Tatsächliche Reparaturen im Jahr'],
        ['  AfA', '(Steuerberater)', 'Wird durch Steuerberater berechnet'],
        ['Werbungskosten gesamt', (-gesamtWerbungskosten).toFixed(2), 'ohne AfA'],
        ['Ergebnis Kaufimmobilien', (gesamtEinnahmen - gesamtWerbungskosten).toFixed(2), ''],
        ['', '', '']
      );
    }

    if (mietimmobilien.length > 0) {
      uebersichtData.push(
        ['── MIETIMMOBILIEN (ARBITRAGE) ──', '', ''],
        ['Einnahmen Untervermietung', arbitrageEinnahmen.toFixed(2), 'Summe aller Untervermietungen'],
        ['', '', ''],
        ['  Eigene Warmmiete', (-arbWarmmiete).toFixed(2), 'Miete an Vermieter'],
        ['  Strom', (-arbStrom).toFixed(2), 'Stromkosten'],
        ['  Internet', (-arbInternet).toFixed(2), 'Internetkosten'],
        ['  GEZ / Rundfunkbeitrag', (-arbGEZ).toFixed(2), '18,36 €/Monat Standard'],
        ['Ausgaben gesamt', (-arbitrageAusgaben).toFixed(2), ''],
        ['Ergebnis Arbitrage', (arbitrageEinnahmen - arbitrageAusgaben).toFixed(2), ''],
        ['', '', '']
      );
    }

    uebersichtData.push(
      ['══ STEUERLICHES ERGEBNIS GESAMT ══', steuerlichesErgebnis.toFixed(2), steuerlichesErgebnis < 0 ? '→ Verlust (steuermindernd)' : '→ Gewinn (zu versteuern)']
    );

    const wsUebersicht = XLSX.utils.aoa_to_sheet(uebersichtData);
    wsUebersicht['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsUebersicht, 'Übersicht');

    // ==================== KAUFIMMOBILIEN DETAIL ====================
    if (kaufimmobilien.length > 0) {
      const detailHeader = [
        'Immobilie', 'Adresse', 'Kaufpreis €', 'Kaltmiete/Jahr €',
        'Schuldzinsen €', 'Instandhaltung €', 'Verwaltung €',
        'Hausgeld €', 'Strom €', 'Internet €', 'Fahrtkosten €',
        'Erhaltungsaufwand €', 'Summe Werbungskosten €', 'Ergebnis €',
        'Hinweis'
      ];

      const detailData = [detailHeader];

      kaufimmobilien.forEach(immo => {
        const endDatum = (immo.aktiv === false && immo.aufgabedatum) ? immo.aufgabedatum : null;
        const faktor = berechneFaktorFuerImmo(immo.kaufdatum, endDatum, jahr);
        const monate = Math.round(faktor * 12);
        const kaufpreis = immo.kaufpreis || 0;

        const kaltmieteJahr = berechneJahresmiete(immo, jahr);

        // Schuldzinsen (annuitätisch korrekt, phasenbewusst)
        const schuldzinsenJahr = berechneJahresZinsenFuerSteuer(immo, jahr) * faktor;

        // Kosten (pro-rata)
        const instandhaltung = (immo.instandhaltung || 0) * 12 * faktor;
        const verwaltung = (immo.verwaltung || 0) * 12 * faktor;
        const hausgeld = (immo.hausgeld || 0) * 12 * faktor;
        const strom = (immo.strom || 0) * 12 * faktor;
        const internet = (immo.internet || 0) * 12 * faktor;

        // Fahrtkosten (pro-rata)
        const fahrtenProMonat = immo.fahrtenProMonat || 0;
        const entfernungKm = immo.entfernungKm || 0;
        const kmPauschale = immo.kmPauschale || 0.30;
        const fahrtkosten = fahrtenProMonat * 12 * faktor * entfernungKm * 2 * kmPauschale;

        // Erhaltungsaufwand: tatsächliche Ausgaben (kein pro-rata)
        const investitionen = immo.investitionen || [];
        const erhaltungsaufwand = investitionen
          .filter(inv => inv.kategorie === 'erhaltung' && new Date(inv.datum).getFullYear() === jahr)
          .reduce((sum, inv) => sum + inv.betrag, 0);

        const summeWerbungskosten = schuldzinsenJahr + instandhaltung + verwaltung + hausgeld + strom + internet + fahrtkosten + erhaltungsaufwand;
        const ergebnisVorAfa = kaltmieteJahr - summeWerbungskosten;

        detailData.push([
          immo.name || 'Unbenannt',
          `${immo.plz || ''} ${immo.adresse || ''}`,
          kaufpreis.toFixed(2),
          kaltmieteJahr.toFixed(2) + (faktor < 1 ? ` (${monate} Mon.)` : ''),
          schuldzinsenJahr.toFixed(2) + (faktor < 1 ? ` (${monate} Mon.)` : ''),
          instandhaltung.toFixed(2),
          verwaltung.toFixed(2),
          hausgeld.toFixed(2),
          strom.toFixed(2),
          internet.toFixed(2),
          fahrtkosten.toFixed(2),
          erhaltungsaufwand.toFixed(2),
          summeWerbungskosten.toFixed(2),
          ergebnisVorAfa.toFixed(2),
          'AfA wird durch Steuerberater berechnet'
        ]);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail['!cols'] = Array(15).fill({ wch: 14 });
      wsDetail['!cols'][0] = { wch: 20 };
      wsDetail['!cols'][1] = { wch: 25 };
      wsDetail['!cols'][14] = { wch: 35 };
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Kaufimmobilien');
    }

    // ==================== MIETIMMOBILIEN (ARBITRAGE) ====================
    if (mietimmobilien.length > 0) {
      const arbitrageHeader = [
        'Immobilie', 'Adresse', 'Eigene Miete/Jahr €',
        'Strom/Jahr €', 'Internet/Jahr €', 'GEZ/Jahr €',
        'Einnahmen/Jahr €', 'Gewinn/Jahr €'
      ];

      const arbitrageData = [arbitrageHeader];

      mietimmobilien.forEach(immo => {
        const arb = berechneJahresArbitrage(immo, jahr);
        const strom = (immo.arbitrageStrom || 0) * 12 * arb.faktor;
        const internet = (immo.arbitrageInternet || 0) * 12 * arb.faktor;
        const gez = (immo.arbitrageGEZ || 0) * 12 * arb.faktor;
        const einnahmen = arb.einnahmen;
        const eigeneMiete = arb.eigeneWarmmiete;
        const gewinn = einnahmen - eigeneMiete - strom - internet - gez;

        arbitrageData.push([
          immo.name || 'Unbenannt',
          `${immo.plz || ''} ${immo.adresse || ''}`,
          eigeneMiete.toFixed(2),
          strom.toFixed(2),
          internet.toFixed(2),
          gez.toFixed(2),
          einnahmen.toFixed(2),
          gewinn.toFixed(2)
        ]);
      });

      const wsArbitrage = XLSX.utils.aoa_to_sheet(arbitrageData);
      wsArbitrage['!cols'] = Array(8).fill({ wch: 16 });
      wsArbitrage['!cols'][0] = { wch: 20 };
      wsArbitrage['!cols'][1] = { wch: 25 };
      XLSX.utils.book_append_sheet(wb, wsArbitrage, 'Mietimmobilien');
    }

    // ==================== INVESTITIONEN ====================
    const alleInvestitionen = [];
    kaufimmobilien.forEach(immo => {
      const investitionen = immo.investitionen || [];
      investitionen.forEach(inv => {
        if (new Date(inv.datum).getFullYear() === jahr) {
          alleInvestitionen.push({
            immobilie: immo.name || 'Unbenannt',
            ...inv
          });
        }
      });
    });

    if (alleInvestitionen.length > 0) {
      const invHeader = ['Immobilie', 'Datum', 'Beschreibung', 'Kategorie', 'Betrag €', 'Steuerliche Behandlung'];
      const kategorieLabels = {
        'erhaltung': 'Erhaltungsaufwand',
        'herstellung': 'Herstellungskosten',
        'anschaffung': 'Anschaffungsnebenkosten',
        'modernisierung': 'Modernisierung',
        'nicht_relevant': 'Nicht steuerlich relevant'
      };
      const steuerBehandlung = {
        'erhaltung': 'Sofort absetzbar',
        'herstellung': 'Über AfA abschreiben',
        'anschaffung': 'Erhöht AfA-Bemessungsgrundlage',
        'modernisierung': 'Über AfA abschreiben',
        'nicht_relevant': 'Keine Steuerwirkung'
      };

      const invData = [invHeader];
      alleInvestitionen.forEach(inv => {
        invData.push([
          inv.immobilie,
          new Date(inv.datum).toLocaleDateString('de-DE'),
          inv.beschreibung || '',
          kategorieLabels[inv.kategorie] || inv.kategorie,
          inv.betrag.toFixed(2),
          steuerBehandlung[inv.kategorie] || ''
        ]);
      });

      const wsInv = XLSX.utils.aoa_to_sheet(invData);
      wsInv['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsInv, 'Investitionen');
    }

    // Excel speichern
    XLSX.writeFile(wb, `Steuer-Export-${jahr}.xlsx`);

    // ==================== PDF ERSTELLEN ====================
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Titel
    pdf.setFontSize(20);
    pdf.text(`Steuerliche Übersicht ${jahr}`, 105, 20, { align: 'center' });

    pdf.setFontSize(10);
    pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 105, 28, { align: 'center' });

    // Zusammenfassung
    pdf.setFontSize(14);
    pdf.text('Zusammenfassung', 14, 45);

    pdf.autoTable({
      startY: 50,
      head: [['Position', 'Betrag', 'Hinweis']],
      body: [
        ['Mieteinnahmen (Kaufimmobilien)', formatCurrency(gesamtEinnahmen), 'Kaltmiete × 12 Monate'],
        ['Werbungskosten', formatCurrency(-gesamtWerbungskosten), 'Zinsen, Kosten (AfA durch Steuerberater)'],
        ['Arbitrage-Einnahmen', formatCurrency(arbitrageEinnahmen), 'Untervermietung'],
        ['Arbitrage-Ausgaben', formatCurrency(-arbitrageAusgaben), 'Miete + Nebenkosten'],
        ['', '', ''],
        ['STEUERLICHES ERGEBNIS', formatCurrency(steuerlichesErgebnis), steuerlichesErgebnis < 0 ? 'Verlust' : 'Gewinn']
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        1: { halign: 'right' }
      }
    });

    // Kaufimmobilien Details
    if (kaufimmobilien.length > 0) {
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Kaufimmobilien - Details', 14, 20);

      const kaufRows = kaufimmobilien.map(immo => {
        const kaltmieteJahr = getAktuelleMiete(immo) * 12;
        const kaufpreis = immo.kaufpreis || 0;
        const afaJahr = kaufpreis * ((immo.gebaeudeAnteilProzent || 80) / 100) * ((immo.afaSatz || 2) / 100);
        // Schuldzinsen annuitätisch korrekt für das ausgewählte Jahr
        const schuldzinsen = berechneJahresZinsenFuerSteuer(immo, jahr);
        const sonstigeKosten = ((immo.instandhaltung || 0) + (immo.verwaltung || 0) + (immo.hausgeld || 0) + (immo.strom || 0) + (immo.internet || 0)) * 12;

        return [
          immo.name || 'Unbenannt',
          formatCurrency(kaltmieteJahr),
          formatCurrency(afaJahr),
          formatCurrency(schuldzinsen),
          formatCurrency(sonstigeKosten)
        ];
      });

      pdf.autoTable({
        startY: 25,
        head: [['Immobilie', 'Einnahmen', 'AfA', 'Schuldzinsen', 'Sonst. Kosten']],
        body: kaufRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });
    }

    // Mietimmobilien Details
    if (mietimmobilien.length > 0) {
      const yPos = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 20 : 25;
      if (yPos > 250) pdf.addPage();

      pdf.setFontSize(14);
      pdf.text('Mietimmobilien (Arbitrage) - Details', 14, yPos > 250 ? 20 : yPos);

      const mietRows = mietimmobilien.map(immo => {
        // aktuelle Werte aus mietAnpassungen
        const einnahmen = (immo.anzahlZimmerVermietet || 0) * getAktuelleUntermiete(immo) * 12;
        const ausgaben = (getAktuelleWarmmiete(immo) + (immo.arbitrageStrom || 0) + (immo.arbitrageInternet || 0) + (immo.arbitrageGEZ || 0)) * 12;
        return [
          immo.name || 'Unbenannt',
          formatCurrency(einnahmen),
          formatCurrency(ausgaben),
          formatCurrency(einnahmen - ausgaben)
        ];
      });

      pdf.autoTable({
        startY: yPos > 250 ? 25 : yPos + 5,
        head: [['Immobilie', 'Einnahmen', 'Ausgaben', 'Gewinn']],
        body: mietRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [142, 68, 173] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
    }

    // Hinweis
    pdf.setFontSize(8);
    pdf.setTextColor(128);
    const finalY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 15 : 280;
    pdf.text('Hinweis: Diese Übersicht dient als Grundlage für die Steuererklärung. Bitte prüfen Sie alle Angaben mit Ihrem Steuerberater.', 14, Math.min(finalY, 280));

    pdf.save(`Steuer-Uebersicht-${jahr}.pdf`);

    toast.success(`Steuer-Export ${jahr} erstellt: Excel + PDF heruntergeladen ✓`);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"><Home size={32} className="text-white" /></div>
          <div className="animate-spin h-6 w-6 border-3 border-indigo-400 border-t-transparent rounded-full mx-auto" style={{borderWidth:'3px'}}></div>
          <p className="mt-4 text-slate-400 text-sm">Portfolio wird geladen…</p>
        </div>
      </div>
    );
  }

  // Landing Page oder Auth wenn nicht eingeloggt
  if (!session) {
    if (showAuth) return <Auth />;
    return (
      <LandingPage
        onGetStarted={() => setShowAuth(true)}
        onLogin={() => setShowAuth(true)}
      />
    );
  }

  // Aktive vs. inaktive Immobilien für Dashboard
  const heute = new Date();
  const isInaktiv = (i) =>
    i.aktiv === false ||
    (i.immobilienTyp === 'mietimmobilie' && i.mietvertragEnde && new Date(i.mietvertragEnde) < heute);
  const aktiveImmobilien = portfolio.filter(i => !isInaktiv(i));
  const inaktiveImmobilien = portfolio.filter(i => isInaktiv(i));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notifications */}
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' },
        success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
        error: { duration: 5000 }
      }} />
      {/* Custom Confirm Dialog */}
      <ConfirmDialog />
      {/* Upgrade Modal — wird nur angezeigt wenn PAYMENTS_LIVE=true und User Free Tier */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onCheckout={() => { setShowUpgradeModal(false); openCheckout(); }}
        />
      )}
      {/* Changelog Popup */}
      {showChangelog && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-indigo-500"><PartyPopper size={28} /></div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Was ist neu?</h2>
                <p className="text-xs text-gray-400">Version {CHANGELOG_VERSION}</p>
              </div>
            </div>
            <ul className="space-y-2.5 mb-6">
              {CHANGELOG_EINTRAEGE.map((e, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="text-base leading-snug">{e.emoji}</span>
                  <span className="text-gray-700 leading-snug">{e.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                try { localStorage.setItem('changelogVersion', CHANGELOG_VERSION); } catch(e) {}
                setShowChangelog(false);
              }}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Alles klar!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center"><Home size={18} className="text-white" /></div>
            <div>
              <div className="font-bold text-white text-base leading-tight">Immobilien Portfolio</div>
              <div className="text-slate-400 text-xs hidden sm:block">Rendite · Cashflow · Wertentwicklung</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <div className="animate-spin h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                Sync…
              </div>
            )}
            {syncStatus === 'error' && (
              <span className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={12} /> Sync-Fehler</span>
            )}
            <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
              {/* Mobile: Avatar-Button tippt direkt auf Logout-Dropdown */}
              <div className="relative group">
                <button className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-indigo-500 transition-colors"
                  title="Account">
                  {session.user.email.charAt(0).toUpperCase()}
                </button>
                {/* Dropdown — sichtbar auf Mobile via group-focus-within, auf Desktop via group-hover */}
                <div className="absolute right-0 top-9 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50 overflow-hidden">
                  <div className="px-3 py-2 text-xs text-slate-400 truncate border-b border-slate-700">{session.user.email}</div>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <PortfolioOverview portfolio={portfolio} />
        <VermieterTodos
          portfolio={portfolio}
          mieterListe={mieterListe}
          nkAbrechnungen={nkAbrechnungen}
          onSelectImmobilie={(immo, tab) => { setSelectedImmobilie(immo); setInitialTab(tab || null); }}
        />

        {/* Navigation & Actions Bar */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveView('portfolio')}
              className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 ${activeView === 'portfolio' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Home size={15} /> Immobilien
              {portfolio.length > 0 && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeView === 'portfolio' ? 'bg-white/20' : 'bg-gray-100'}`}>{aktiveImmobilien.length}</span>}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Desktop: alle Buttons sichtbar */}
            {portfolio.length > 0 && (
              <>
                <button
                  onClick={handleSelbstauskunft}
                  className="hidden sm:flex px-3 py-2 bg-white border border-violet-200 text-violet-700 rounded-xl hover:bg-violet-50 items-center gap-1.5 text-sm shadow-sm transition-colors font-semibold"
                >
                  <ClipboardList size={16} /> Selbstauskunft
                </button>
                <button
                  onClick={handleExport}
                  className="hidden sm:flex px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 items-center gap-1.5 text-sm shadow-sm transition-colors"
                >
                  <Upload size={16} /> Export
                </button>
                <div className="relative group hidden sm:block">
                  <button className="px-3 py-2 bg-white border border-gray-200 text-emerald-700 rounded-xl hover:bg-emerald-50 flex items-center gap-1.5 text-sm shadow-sm transition-colors">
                    <BarChart3 size={16} /> Steuer-Export
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <button key={year} onClick={() => handleSteuerExport(year)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 text-gray-700 border-b border-gray-100 last:border-0">
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="hidden sm:flex px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 items-center gap-1.5 text-sm shadow-sm transition-colors cursor-pointer">
                  <Download size={16} /> Import
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                {/* Mobile: Mehr-Menü */}
                <div className="relative group sm:hidden">
                  <button className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm shadow-sm font-semibold">
                    ⋯ Mehr
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50 overflow-hidden">
                    <button onClick={handleSelbstauskunft} className="w-full text-left px-4 py-3 text-sm text-violet-700 hover:bg-violet-50 border-b border-gray-100 font-semibold flex items-center gap-1.5"><ClipboardList size={15} /> Selbstauskunft</button>
                    <button onClick={handleExport} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-1.5"><Upload size={15} /> Daten exportieren</button>
                    {[...Array(3)].map((_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <button key={year} onClick={() => handleSteuerExport(year)} className="w-full text-left px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 border-b border-gray-100 last:border-0 flex items-center gap-1.5">
                          <BarChart3 size={15} /> Steuer {year}
                        </button>
                      );
                    })}
                    <label className="w-full flex items-center gap-1.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <Download size={15} /> Import
                      <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => setShowKalkulation(true)}
              className="hidden sm:flex px-3 py-2 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl hover:bg-violet-100 items-center gap-1.5 text-sm shadow-sm transition-colors"
            >
              <Calculator size={16} /> Kalkulation
            </button>
            <button
              onClick={() => canAddImmo ? setShowForm(true) : setShowUpgradeModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-700 flex items-center gap-1.5 text-sm font-semibold shadow-sm transition-colors"
            >
              + Neue Immobilie
            </button>
          </div>
        </div>

        {activeView === 'portfolio' && (portfolio.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-16 text-center shadow-sm border border-gray-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5"><Home size={40} className="text-indigo-400" /></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Noch keine Immobilien</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">Füge deine erste Immobilie hinzu, um Rendite und Cashflow zu berechnen.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-sm transition-colors"
            >
              + Erste Immobilie hinzufügen
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {aktiveImmobilien.map(immobilie => (
                <ImmobilienKarte
                  key={immobilie.id}
                  immobilie={immobilie}
                  mieterListe={mieterListe}
                  onClick={() => { setSelectedImmobilie(immobilie); setInitialTab(null); }}
                  onDelete={() => handleDelete(immobilie.id)}
                  onEdit={() => { setEditImmobilie(immobilie); setShowForm(true); }}
                />
              ))}
            </div>
            {inaktiveImmobilien.length > 0 && (
              <details className="mt-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-2 select-none">
                  <Archive size={16} />
                  Inaktive / beendete Immobilien ({inaktiveImmobilien.length})
                </summary>
                <div className="px-5 pb-5 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-55 grayscale">
                    {inaktiveImmobilien.map(immobilie => (
                      <ImmobilienKarte
                        key={immobilie.id}
                        immobilie={immobilie}
                        mieterListe={mieterListe}
                        onClick={() => { setSelectedImmobilie(immobilie); setInitialTab(null); }}
                        onDelete={() => handleDelete(immobilie.id)}
                        onEdit={() => { setEditImmobilie(immobilie); setShowForm(true); }}
                      />
                    ))}
                  </div>
                </div>
              </details>
            )}
          </>
        ))}

      </main>

      {showForm && (
        <ModalErrorBoundary onClose={() => { setShowForm(false); setEditImmobilie(null); }}>
          <ImmobilienFormular
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditImmobilie(null); }}
            onOpenDetail={(immo) => {
              setShowForm(false);
              setEditImmobilie(null);
              setSelectedImmobilie(immo);
              setInitialTab(null);
            }}
            initialData={editImmobilie}
          />
        </ModalErrorBoundary>
      )}

      {showKalkulation && (
        <ModalErrorBoundary onClose={() => setShowKalkulation(false)}>
          <KalkulationsModal onClose={() => setShowKalkulation(false)} />
        </ModalErrorBoundary>
      )}

      {selectedImmobilie && (
        <ModalErrorBoundary
          key={`${selectedImmobilie?.id}-${initialTab ?? 'default'}`}
          onClose={() => { setSelectedImmobilie(null); setInitialTab(null); }}
          resetKey={selectedImmobilie?.id}
        >
          <ImmobilienDetail
            immobilie={selectedImmobilie}
            initialTab={initialTab}
            onClose={() => { setSelectedImmobilie(null); setInitialTab(null); }}
            onEdit={() => { setEditImmobilie(selectedImmobilie); setSelectedImmobilie(null); setShowForm(true); }}
            onSave={async (data) => {
              try {
                setSyncStatus('syncing');
                const updated = await saveImmobilie({ ...data, id: selectedImmobilie.id });
                setPortfolio(prev => prev.map(i => i.id === selectedImmobilie.id ? updated : i));
                setSelectedImmobilie(updated);
                setSyncStatus('idle');
                toast.success('Gespeichert ✓');
              } catch (error) {
                console.error('Fehler beim Speichern:', error);
                setSyncStatus('error');
                toast.error('Fehler beim Speichern: ' + error.message);
              }
            }}
            mieterListe={mieterListe}
            onSaveMieter={handleSaveMieter}
            onDeleteMieter={handleDeleteMieter}
            nkAbrechnungen={nkAbrechnungen}
            onSaveNK={handleSaveNK}
            onDeleteNK={handleDeleteNK}
            portfolio={portfolio}
          />
        </ModalErrorBoundary>
      )}

      {/* ── Selbstauskunft Modal ───────────────────────────────────────────────── */}
      {showSelbstauskunftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-amber-700 text-white px-5 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList size={18} /> Selbstauskunft generieren</h2>
                <p className="text-amber-200 text-xs mt-0.5">Angaben werden lokal gespeichert und beim nächsten Mal vorausgefüllt</p>
              </div>
              <button onClick={() => setShowSelbstauskunftModal(false)} className="text-white hover:text-amber-200"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Persönliche Daten */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-3">👤 Persönliche Angaben</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Name (Vor- und Nachname)</label>
                    <input type="text" value={selbstauskunftDaten.name} placeholder="David Schmidbauer"
                      onChange={e => setSelbstauskunftDaten(d => ({ ...d, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Familienstand</label>
                    <select value={selbstauskunftDaten.familienstand}
                      onChange={e => setSelbstauskunftDaten(d => ({ ...d, familienstand: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400">
                      {['ledig', 'verheiratet', 'geschieden', 'verwitwet', 'eingetragene Lebenspartnerschaft'].map(v =>
                        <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Wohnsituation</label>
                    <select value={selbstauskunftDaten.wohnsituation}
                      onChange={e => setSelbstauskunftDaten(d => ({ ...d, wohnsituation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400">
                      {['zur Miete', 'im Eigentum', 'bei Familie / Eltern', 'sonstiges'].map(v =>
                        <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Anschrift</label>
                    <input type="text" value={selbstauskunftDaten.anschrift} placeholder="Musterstraße 1, 12345 Musterstadt"
                      onChange={e => setSelbstauskunftDaten(d => ({ ...d, anschrift: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Tätigkeit / Beruf</label>
                    <input type="text" value={selbstauskunftDaten.taetigkeit} placeholder="z.B. Geschäftsführer / 100 % Gesellschafter …"
                      onChange={e => setSelbstauskunftDaten(d => ({ ...d, taetigkeit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>
              </div>

              {/* Sonstige Vermögenswerte */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-emerald-800 mb-3">💰 Sonstige Vermögenswerte</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bargeld / Bankguthaben (€)</label>
                      <input type="number" value={selbstauskunftDaten.bargeld} placeholder="0"
                        onChange={e => setSelbstauskunftDaten(d => ({ ...d, bargeld: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Institut / Erläuterung</label>
                      <input type="text" value={selbstauskunftDaten.bargeldBeschreibung} placeholder="z.B. N26, Trade Republic"
                        onChange={e => setSelbstauskunftDaten(d => ({ ...d, bargeldBeschreibung: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Depot / Aktien & ETFs (€)</label>
                      <input type="number" value={selbstauskunftDaten.depot} placeholder="0"
                        onChange={e => setSelbstauskunftDaten(d => ({ ...d, depot: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Institut / Erläuterung</label>
                      <input type="text" value={selbstauskunftDaten.depotBeschreibung} placeholder="z.B. Scalable, Trade Republic"
                        onChange={e => setSelbstauskunftDaten(d => ({ ...d, depotBeschreibung: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Beteiligung (€ Wert)</label>
                      <input type="number" value={selbstauskunftDaten.beteiligungWert} placeholder="0"
                        onChange={e => setSelbstauskunftDaten(d => ({ ...d, beteiligungWert: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Beschreibung</label>
                      <input type="text" value={selbstauskunftDaten.beteiligungBeschreibung} placeholder="z.B. GmbH via Holding (100 %)"
                        onChange={e => setSelbstauskunftDaten(d => ({ ...d, beteiligungBeschreibung: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </div>
                  {(parseFloat(selbstauskunftDaten.bargeld)||0) + (parseFloat(selbstauskunftDaten.depot)||0) + (parseFloat(selbstauskunftDaten.beteiligungWert)||0) > 0 && (
                    <div className="bg-emerald-100 rounded-lg px-3 py-2 text-sm font-bold text-emerald-800">
                      Summe sonstige Vermögenswerte: {((parseFloat(selbstauskunftDaten.bargeld)||0) + (parseFloat(selbstauskunftDaten.depot)||0) + (parseFloat(selbstauskunftDaten.beteiligungWert)||0)).toLocaleString('de-DE')} €
                    </div>
                  )}
                </div>
              </div>

              {/* Sonstige Verbindlichkeiten */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5"><AlertTriangle size={14} /> Sonstige Verbindlichkeiten</label>
                <textarea value={selbstauskunftDaten.sonstigeVerbindlichkeiten} rows={2}
                  onChange={e => setSelbstauskunftDaten(d => ({ ...d, sonstigeVerbindlichkeiten: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowSelbstauskunftModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">
                Abbrechen
              </button>
              <button
                onClick={() => {
                  try { localStorage.setItem('selbstauskunft_daten', JSON.stringify(selbstauskunftDaten)); } catch(e) {}
                  setShowSelbstauskunftModal(false);
                  generateSelbstauskunftPDF(selbstauskunftDaten);
                }}
                className="flex-1 px-4 py-3 bg-amber-700 text-white rounded-xl hover:bg-amber-800 font-semibold flex items-center justify-center gap-2">
                <Download size={16} /> PDF generieren
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="flex items-center justify-center gap-1">Erstellt mit <Heart size={14} className="text-red-400" /> für Immobilieninvestoren</p>
          <p className="text-sm mt-2">Alle Berechnungen ohne Gewähr. Keine Anlageberatung.</p>
          <div className="mt-3 flex justify-center">
            <ImpressumDatenschutzLinks className="text-gray-500 hover:text-gray-300" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
