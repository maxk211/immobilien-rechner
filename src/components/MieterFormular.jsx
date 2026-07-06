import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/format.js';
import { uploadDokument, deleteDokument, getDokumentUrl } from '../supabaseClient';

const MIETER_DOK_TYPEN = ['Mietvertrag', 'Personalausweis', 'Selbstauskunft', 'Bonitätsnachweis', 'SCHUFA-Auskunft', 'Übergabeprotokoll', 'Kautionsquittung', 'Sonstiges'];
const MIETER_DOK_ICONS = { 'Mietvertrag': '📋', 'Personalausweis': '🪪', 'Selbstauskunft': '📝', 'Bonitätsnachweis': '💳', 'SCHUFA-Auskunft': '🔍', 'Übergabeprotokoll': '🔑', 'Kautionsquittung': '🧾', 'Sonstiges': '📎' };

const MieterFormular = ({ mieter, portfolio, onSave, onClose, immobilieDokumente = [], onDokumentUpdate }) => {
  const [activeTab, setActiveTab] = useState('stammdaten');
  const [form, setForm] = useState({
    id: mieter?.id || null,
    immobilieId: mieter?.immobilie_id || (portfolio[0]?.id || ''),
    name: mieter?.name || '',
    email: mieter?.email || '',
    telefon: mieter?.telefon || '',
    zimmerBezeichnung: mieter?.zimmer_bezeichnung || '',
    mietbeginn: mieter?.mietbeginn || '',
    mietende: mieter?.mietende || '',
    kaltmiete: mieter?.kaltmiete || '',
    kautionBetrag: mieter?.kaution_betrag || '',
    kautionBezahlt: mieter?.kaution_bezahlt || false,
    kautionBezahltAm: mieter?.kaution_bezahlt_am || '',
    mahnstufe: mieter?.mahnstufe || 0,
    letzteMahnungAm: mieter?.letzte_mahnung_am || '',
    notizen: mieter?.notizen || '',
    aktiv: mieter?.aktiv !== false,
    // Neue Mietvertrag-Felder
    vertragstyp: mieter?.vertragstyp || 'unbefristet',
    kuendigungsfrist: mieter?.kuendigungsfrist || '3 Monate',
    naechsteAnpassungDatum: mieter?.naechste_anpassung_datum || mieter?.naechsteAnpassungDatum || '',
    mietanpassungenMieter: mieter?.mietanpassungen_mieter || mieter?.mietanpassungenMieter || [],
    letzteMieterhoehung: mieter?.letzte_mieterhoehung || mieter?.letzteMieterhoehung || '',
  });
  const [saving, setSaving] = useState(false);
  const [newAnpassung, setNewAnpassung] = useState({ datum: '', betrag: '', grund: '' });

  // Dokumente-Tab State
  const [dokTyp, setDokTyp] = useState('Mietvertrag');
  const [pendingFiles, setPendingFiles] = useState([]); // { file, typ } — für neuen Mieter
  const [dokUploading, setDokUploading] = useState(false);
  const [dokFehler, setDokFehler] = useState('');
  const [dokDragOver, setDokDragOver] = useState(false);
  const [ladeId, setLadeId] = useState(null);

  // Dokumente dieses Mieters aus der Immobilien-Dokumentenliste
  const mieterDokumente = mieter?.id
    ? immobilieDokumente.filter(d => d.mieterId === mieter.id)
    : [];

  const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDokFiles = async (files) => {
    if (!files || files.length === 0) return;
    setDokFehler('');
    const immo = portfolio.find(i => String(i.id) === String(form.immobilieId));
    if (!immo?.id) { setDokFehler('Zuerst Immobilie auswählen'); return; }

    if (mieter?.id) {
      // Bestehender Mieter → sofort hochladen
      setDokUploading(true);
      try {
        const neu = [];
        for (const file of Array.from(files)) {
          if (file.size > 20 * 1024 * 1024) { setDokFehler(`"${file.name}" zu groß (max. 20 MB)`); continue; }
          const meta = await uploadDokument(immo.id, file, dokTyp, { id: mieter.id, name: mieter.name });
          neu.push(meta);
        }
        if (neu.length > 0 && onDokumentUpdate) {
          await onDokumentUpdate([...immobilieDokumente, ...neu]);
        }
      } catch (e) {
        setDokFehler(`Upload fehlgeschlagen: ${e.message}`);
      } finally {
        setDokUploading(false);
      }
    } else {
      // Neuer Mieter → Dateien puffern, Upload nach Speichern
      const valide = Array.from(files).filter(f => {
        if (f.size > 20 * 1024 * 1024) { setDokFehler(`"${f.name}" zu groß (max. 20 MB)`); return false; }
        return true;
      });
      setPendingFiles(prev => [...prev, ...valide.map(f => ({ file: f, typ: dokTyp }))]);
    }
  };

  const removePending = (idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));

  const handleDokDownload = async (doc) => {
    setLadeId(doc.id);
    try {
      const url = await getDokumentUrl(doc.path);
      if (url) window.open(url, '_blank');
      else alert('Nicht mehr verfügbar.');
    } catch (e) { alert(e.message); }
    finally { setLadeId(null); }
  };

  const handleDokDelete = async (doc) => {
    if (!window.confirm(`"${doc.name}" löschen?`)) return;
    try {
      await deleteDokument(doc.path);
      if (onDokumentUpdate) await onDokumentUpdate(immobilieDokumente.filter(d => d.id !== doc.id));
    } catch (e) { alert(e.message); }
  };

  // Wohnfläche aus gewählter Immobilie für €/qm Berechnung
  const gewaehltesObjekt = portfolio.find(i => String(i.id) === String(form.immobilieId));
  const wohnflaeche = gewaehltesObjekt?.wohnflaeche || 0;
  const kaltmieteNum = parseFloat(form.kaltmiete) || 0;
  const preisProQm = wohnflaeche > 0 && kaltmieteNum > 0 ? (kaltmieteNum / wohnflaeche).toFixed(2) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name ist Pflicht'); return; }
    if (!form.immobilieId) { toast.error('Bitte eine Immobilie auswählen'); return; }
    setSaving(true);
    try {
      const savedMieter = await onSave(form);
      // Gepufferte Dokumente für neuen Mieter jetzt hochladen
      if (pendingFiles.length > 0 && onDokumentUpdate) {
        const mieterMeta = {
          id: savedMieter?.id || mieter?.id || form.id || 'unbekannt',
          name: form.name,
        };
        const immo = portfolio.find(i => String(i.id) === String(form.immobilieId));
        if (immo?.id) {
          const neu = [];
          for (const { file, typ } of pendingFiles) {
            try {
              const meta = await uploadDokument(immo.id, file, typ, mieterMeta);
              neu.push(meta);
            } catch (e) { console.error('Upload fehlgeschlagen:', e); }
          }
          if (neu.length > 0) await onDokumentUpdate([...immobilieDokumente, ...neu]);
        }
      }
    } finally { setSaving(false); }
  };

  const addMietanpassung = () => {
    if (!newAnpassung.datum || !newAnpassung.betrag) return;
    const entry = { id: Date.now(), datum: newAnpassung.datum, betrag: parseFloat(newAnpassung.betrag), grund: newAnpassung.grund };
    const sorted = [...form.mietanpassungenMieter, entry].sort((a, b) => new Date(a.datum) - new Date(b.datum));
    setForm(f => ({ ...f, mietanpassungenMieter: sorted }));
    setNewAnpassung({ datum: '', betrag: '', grund: '' });
  };

  const removeMietanpassung = (id) => {
    setForm(f => ({ ...f, mietanpassungenMieter: f.mietanpassungenMieter.filter(a => a.id !== id) }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col justify-end sm:flex-row sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-xl shadow-2xl sm:max-w-2xl h-[93vh] sm:h-[95vh] flex flex-col overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
        </div>
        {/* Header */}
        <div className="flex-shrink-0 bg-blue-700 text-white px-4 sm:px-5 py-4 sm:py-5 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold">{form.id ? 'Mieter bearbeiten' : 'Neuer Mieter'}</h2>
          <button onClick={onClose} className="text-white text-2xl hover:text-blue-200">&times;</button>
        </div>

        {/* Tab-Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-2 sm:px-4 flex-shrink-0 overflow-x-auto">
          {[
            { id: 'stammdaten',     labelMobile: '👤 Daten',    label: '👤 Stammdaten' },
            { id: 'mietvertrag',    labelMobile: '📄 Vertrag',  label: '📄 Mietvertrag' },
            { id: 'mietanpassungen',labelMobile: '📈 Miete',    label: '📈 Anpassungen' },
            { id: 'dokumente',      labelMobile: `📎 Docs${pendingFiles.length > 0 ? ` (${pendingFiles.length})` : mieterDokumente.length > 0 ? ` (${mieterDokumente.length})` : ''}`, label: `📎 Dokumente${pendingFiles.length > 0 ? ` (${pendingFiles.length})` : mieterDokumente.length > 0 ? ` (${mieterDokumente.length})` : ''}` },
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 sm:flex-1 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors text-center whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span className="sm:hidden">{tab.labelMobile}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-5">
          {/* Immobilie (immer sichtbar) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Immobilie *</label>
            <select value={form.immobilieId} onChange={e => setForm({...form, immobilieId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" required>
              <option value="">— Immobilie wählen —</option>
              {portfolio.map(i => <option key={i.id} value={i.id}>{i.name || i.adresse || i.plz}</option>)}
            </select>
          </div>

          {/* === TAB: STAMMDATEN === */}
          {activeTab === 'stammdaten' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">👤 Stammdaten</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Telefon</label>
                    <input type="tel" value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Zimmer / Einheit</label>
                    <input type="text" value={form.zimmerBezeichnung} onChange={e => setForm({...form, zimmerBezeichnung: e.target.value})}
                      placeholder="z.B. Zimmer 2, Ganze Wohnung, EG links"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                  </div>
                </div>
              </div>

              {/* Mahnwesen */}
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-800 mb-3">⚠️ Mahnwesen</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mahnstufe</label>
                    <select value={form.mahnstufe} onChange={e => setForm({...form, mahnstufe: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm">
                      <option value={0}>Keine Mahnung</option>
                      <option value={1}>1. Mahnung</option>
                      <option value={2}>2. Mahnung</option>
                      <option value={3}>Letzte Mahnung</option>
                    </select>
                  </div>
                  {form.mahnstufe > 0 && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Letzte Mahnung am</label>
                      <input type="date" value={form.letzteMahnungAm} onChange={e => setForm({...form, letzteMahnungAm: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Notizen</label>
                <textarea value={form.notizen} onChange={e => setForm({...form, notizen: e.target.value})}
                  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                  placeholder="Besonderheiten, Vereinbarungen, etc." />
              </div>
            </>
          )}

          {/* === TAB: MIETVERTRAG === */}
          {activeTab === 'mietvertrag' && (
            <>
              {/* Vertragstyp */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-3">📋 Vertragsart</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Vertragstyp</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: 'unbefristet', label: '♾️ Unbefristet' },
                        { val: 'befristet', label: '📅 Befristet' },
                        { val: 'staffel', label: '📈 Staffelmiete' },
                        { val: 'index', label: '📊 Indexmiete' },
                      ].map(opt => (
                        <button key={opt.val} type="button"
                          onClick={() => setForm(f => ({ ...f, vertragstyp: opt.val }))}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${form.vertragstyp === opt.val ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kündigungsfrist</label>
                    <select value={form.kuendigungsfrist} onChange={e => setForm({...form, kuendigungsfrist: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm">
                      <option value="3 Monate">3 Monate</option>
                      <option value="6 Monate">6 Monate</option>
                      <option value="12 Monate">12 Monate</option>
                      <option value="individuell">Individuell</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nächste Anpassung</label>
                    <input type="date" value={form.naechsteAnpassungDatum} onChange={e => setForm({...form, naechsteAnpassungDatum: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                  </div>
                </div>
              </div>

              {/* Mietdetails */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">💶 Mietkonditionen</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mietbeginn</label>
                    <input type="date" value={form.mietbeginn} onChange={e => setForm({...form, mietbeginn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mietende (opt.)</label>
                    <input type="date" value={form.mietende} onChange={e => setForm({...form, mietende: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kaltmiete (€/Mon.)</label>
                    <input type="number" value={form.kaltmiete} onChange={e => setForm({...form, kaltmiete: parseFloat(e.target.value) || ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" step="10" />
                  </div>
                  <div className="flex flex-col justify-end">
                    {preisProQm ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <div className="text-xl font-black text-emerald-700">{preisProQm} €/m²</div>
                        <div className="text-xs text-emerald-500 mt-0.5">bei {wohnflaeche} m² Wohnfläche</div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 text-center text-xs text-gray-400">
                        €/m² erscheint wenn Kaltmiete + Fläche bekannt
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Kaution */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-3">🔑 Kaution</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kautionshöhe (€)</label>
                    <input type="number" value={form.kautionBetrag} onChange={e => setForm({...form, kautionBetrag: parseFloat(e.target.value) || ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.kautionBezahlt} onChange={e => setForm({...form, kautionBezahlt: e.target.checked})}
                        className="w-4 h-4 rounded accent-blue-600" />
                      <span className="text-sm text-gray-700">Bezahlt</span>
                    </label>
                  </div>
                  {form.kautionBezahlt && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bezahlt am</label>
                      <input type="date" value={form.kautionBezahltAm} onChange={e => setForm({...form, kautionBezahltAm: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* === TAB: MIETANPASSUNGEN === */}
          {activeTab === 'mietanpassungen' && (
            <>
              {/* Aktuelle Miete + €/qm */}
              {kaltmieteNum > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-blue-700">{formatCurrency(kaltmieteNum)}</div>
                    <div className="text-xs text-blue-500 font-semibold mt-1">Aktuelle Kaltmiete/Mo.</div>
                  </div>
                  {preisProQm && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-emerald-700">{preisProQm} €/m²</div>
                      <div className="text-xs text-emerald-500 font-semibold mt-1">bei {wohnflaeche} m² Wohnfläche</div>
                    </div>
                  )}
                </div>
              )}

              {/* Anpassungs-Historie */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">📅 Mietanpassungen Historie</p>
                </div>
                {form.mietanpassungenMieter.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Noch keine Mietanpassungen erfasst</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {[...form.mietanpassungenMieter].reverse().map(a => {
                      const qmPreis = wohnflaeche > 0 ? (a.betrag / wohnflaeche).toFixed(2) : null;
                      return (
                        <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{formatCurrency(a.betrag)}/Mo.
                              {qmPreis && <span className="ml-2 text-xs text-gray-400 font-normal">({qmPreis} €/m²)</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {new Date(a.datum).toLocaleDateString('de-DE')}
                              {a.grund && <span className="ml-2 text-gray-400">· {a.grund}</span>}
                            </div>
                          </div>
                          <button type="button" onClick={() => removeMietanpassung(a.id)}
                            className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50">✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Neue Anpassung hinzufügen */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 uppercase mb-3">+ Neue Mietanpassung</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Gültig ab</label>
                    <input type="date" value={newAnpassung.datum} onChange={e => setNewAnpassung(a => ({ ...a, datum: e.target.value }))}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-1 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Neue Kaltmiete (€)</label>
                    <input type="number" value={newAnpassung.betrag} onChange={e => setNewAnpassung(a => ({ ...a, betrag: e.target.value }))}
                      placeholder="0" step="10"
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-400 text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Grund (opt.)</label>
                    <input type="text" value={newAnpassung.grund} onChange={e => setNewAnpassung(a => ({ ...a, grund: e.target.value }))}
                      placeholder="z.B. Mietspiegel"
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-1 focus:ring-blue-400" />
                  </div>
                </div>
                {newAnpassung.betrag && wohnflaeche > 0 && (
                  <div className="mt-2 text-xs text-emerald-600 font-semibold">
                    = {(parseFloat(newAnpassung.betrag) / wohnflaeche).toFixed(2)} €/m²
                  </div>
                )}
                <button type="button" onClick={addMietanpassung}
                  disabled={!newAnpassung.datum || !newAnpassung.betrag}
                  className="mt-3 w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40">
                  Anpassung hinzufügen
                </button>
              </div>

              {/* Letzte formale Mieterhöhung */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">📜 Letzte Mieterhöhung nach § 558 BGB</p>
                <p className="text-xs text-amber-600 mb-3">Datum der letzten formalen Mieterhöhung (Grundlage für 3-Jahres-Kappungsgrenze)</p>
                <input type="date" value={form.letzteMieterhoehung}
                  onChange={e => setForm({ ...form, letzteMieterhoehung: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 text-base sm:text-sm bg-white" />
                {form.letzteMieterhoehung && (() => {
                  const letzte = new Date(form.letzteMieterhoehung);
                  const naechste = new Date(letzte);
                  naechste.setFullYear(naechste.getFullYear() + 3);
                  const heute = new Date();
                  const monateVerbleibend = (naechste - heute) / (1000 * 60 * 60 * 24 * 30.44);
                  return (
                    <div className={`mt-2 text-xs font-semibold ${monateVerbleibend <= 0 ? 'text-emerald-700' : monateVerbleibend <= 3 ? 'text-amber-700' : 'text-amber-600'}`}>
                      {monateVerbleibend <= 0
                        ? '✅ Nächste Mieterhöhung ist jetzt möglich'
                        : `Nächste Mieterhöhung möglich ab: ${naechste.toLocaleDateString('de-DE')} (in ${Math.ceil(monateVerbleibend)} Mon.)`}
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* === TAB: DOKUMENTE === */}
          {activeTab === 'dokumente' && (
            <div className="space-y-4">
              {/* Typ-Auswahl */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Dokumenttyp auswählen:</p>
                <div className="flex flex-wrap gap-1.5">
                  {MIETER_DOK_TYPEN.map(t => (
                    <button key={t} type="button" onClick={() => setDokTyp(t)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                        dokTyp === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {MIETER_DOK_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload-Zone */}
              <div
                className="border-2 border-dashed rounded-xl p-4 transition-colors"
                style={{ borderColor: dokDragOver ? '#3b82f6' : '#d1d5db', background: dokDragOver ? '#eff6ff' : '#f9fafb' }}
                onDragOver={e => { e.preventDefault(); setDokDragOver(true); }}
                onDragLeave={() => setDokDragOver(false)}
                onDrop={e => { e.preventDefault(); setDokDragOver(false); handleDokFiles(e.dataTransfer.files); }}>
                <label className={`flex flex-col items-center gap-2 cursor-pointer ${dokUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-2xl">{dokUploading ? '⏳' : '📤'}</span>
                  <p className="text-sm font-semibold text-gray-700">{dokUploading ? 'Wird hochgeladen…' : 'Datei hochladen'}</p>
                  <p className="text-xs text-gray-400">
                    {mieter?.id ? 'Klicken oder Datei hierher ziehen · max. 20 MB' : 'Wird beim Speichern des Mieters hochgeladen'}
                  </p>
                  <input type="file" multiple className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.zip"
                    onChange={e => handleDokFiles(e.target.files)} />
                </label>
                {dokFehler && <p className="text-xs text-red-600 text-center mt-2">⚠️ {dokFehler}</p>}
              </div>

              {/* Pending Files (nur bei neuem Mieter) */}
              {pendingFiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-700 mb-1">⏳ Wird beim Speichern hochgeladen:</p>
                  {pendingFiles.map((pf, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <span className="text-base">{MIETER_DOK_ICONS[pf.typ] || '📎'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{pf.file.name}</p>
                        <p className="text-xs text-amber-600">{pf.typ} · {formatBytes(pf.file.size)}</p>
                      </div>
                      <button type="button" onClick={() => removePending(idx)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bereits hochgeladene Dokumente (bestehender Mieter) */}
              {mieterDokumente.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Hochgeladene Dokumente:</p>
                  {mieterDokumente.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 group">
                      <span className="text-base">{MIETER_DOK_ICONS[doc.typ] || '📎'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.typ} · {formatBytes(doc.groesse)} · {new Date(doc.hochgeladenAm).toLocaleDateString('de-DE')}</p>
                      </div>
                      <button type="button" onClick={() => handleDokDownload(doc)} disabled={ladeId === doc.id}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50" title="Herunterladen">
                        {ladeId === doc.id ? '⏳' : '⬇️'}
                      </button>
                      <button type="button" onClick={() => handleDokDelete(doc)}
                        className="p-1 text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Löschen">
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {mieterDokumente.length === 0 && pendingFiles.length === 0 && !mieter?.id && (
                <p className="text-xs text-gray-400 text-center py-2">
                  💡 Du kannst schon jetzt Dokumente auswählen — sie werden zusammen mit dem Mieter gespeichert.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold disabled:opacity-50">
              {saving ? 'Speichern...' : saving && pendingFiles.length > 0 ? 'Speichern & Hochladen...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MieterFormular;
