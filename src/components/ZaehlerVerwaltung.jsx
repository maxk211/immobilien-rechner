import { useState } from 'react';
import { Gauge, RefreshCw, Pencil, X, ChevronUp, ChevronDown } from 'lucide-react';
import { showConfirm } from '../utils/confirm.jsx';
import { ZAEHLER_TYPEN } from '../constants/index.js';

const ZaehlerVerwaltung = ({ params, updateParams }) => {
  const zaehler = params.zaehler || [];
  const [expandedId, setExpandedId] = useState(null);
  const [neuerZaehlerTyp, setNeuerZaehlerTyp] = useState(null); // zeigt Formular
  const [neuerZaehlerForm, setNeuerZaehlerForm] = useState({ bezeichnung: '', zaehlernummer: '', einheit: '' });
  const [ableseModal, setAbleseModal] = useState(null); // { zaehlerId }
  const [ableseForm, setAbleseForm] = useState({ datum: new Date().toISOString().split('T')[0], stand: '', notiz: '', istTausch: false, altStand: '' });
  const [editAblesung, setEditAblesung] = useState(null); // { zaehlerId, ableseId }

  const saveZaehler = (neu) => updateParams({ ...params, zaehler: neu });

  const handleZaehlerHinzufuegen = () => {
    if (!neuerZaehlerTyp) return;
    const typInfo = ZAEHLER_TYPEN.find(t => t.id === neuerZaehlerTyp);
    const neuer = {
      id: `z_${Date.now()}`,
      typ: neuerZaehlerTyp,
      bezeichnung: neuerZaehlerForm.bezeichnung || `${typInfo.label} ${zaehler.filter(z => z.typ === neuerZaehlerTyp).length + 1}`,
      zaehlernummer: neuerZaehlerForm.zaehlernummer || '',
      einheit: neuerZaehlerForm.einheit || typInfo.einheit,
      aktiv: true,
      ablesungen: [],
    };
    saveZaehler([...zaehler, neuer]);
    setNeuerZaehlerTyp(null);
    setNeuerZaehlerForm({ bezeichnung: '', zaehlernummer: '', einheit: '' });
    setExpandedId(neuer.id);
  };

  const handleZaehlerDeaktivieren = (id) => {
    saveZaehler(zaehler.map(z => z.id === id ? { ...z, aktiv: false } : z));
  };

  const handleZaehlerLoeschen = async (id) => {
    if (!(await showConfirm('Zähler wirklich löschen?'))) return;
    saveZaehler(zaehler.filter(z => z.id !== id));
  };

  const handleAbleseOeffnen = (zaehlerId) => {
    setAbleseModal({ zaehlerId });
    setAbleseForm({ datum: new Date().toISOString().split('T')[0], stand: '', notiz: '', istTausch: false, altStand: '' });
    setEditAblesung(null);
  };

  const handleEditOeffnen = (zaehlerId, ablesung) => {
    setAbleseModal({ zaehlerId });
    setAbleseForm({ datum: ablesung.datum, stand: ablesung.stand, notiz: ablesung.notiz || '', istTausch: ablesung.istTausch || false, altStand: ablesung.altStand || '' });
    setEditAblesung({ zaehlerId, ableseId: ablesung.id });
  };

  const handleAbleseSpeichern = () => {
    if (!ableseModal || ableseForm.stand === '') return;
    const neueAblesung = {
      id: editAblesung ? editAblesung.ableseId : `a_${Date.now()}`,
      datum: ableseForm.datum,
      stand: parseFloat(ableseForm.stand),
      notiz: ableseForm.notiz,
      istTausch: ableseForm.istTausch,
      altStand: ableseForm.istTausch && ableseForm.altStand !== '' ? parseFloat(ableseForm.altStand) : null,
    };
    saveZaehler(zaehler.map(z => {
      if (z.id !== ableseModal.zaehlerId) return z;
      const ablesungen = editAblesung
        ? z.ablesungen.map(a => a.id === editAblesung.ableseId ? neueAblesung : a)
        : [...(z.ablesungen || []), neueAblesung];
      return { ...z, ablesungen };
    }));
    setAbleseModal(null);
    setEditAblesung(null);
  };

  const handleAbleseLoeschen = (zaehlerId, ableseId) => {
    saveZaehler(zaehler.map(z =>
      z.id === zaehlerId ? { ...z, ablesungen: z.ablesungen.filter(a => a.id !== ableseId) } : z
    ));
  };

  // Verbrauch zwischen zwei Ablesungen (sortiert nach Datum)
  const berechneVerbrauch = (ablesungen) => {
    if (!ablesungen || ablesungen.length < 2) return null;
    const sorted = [...ablesungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
    const result = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      // Bei Tausch: Verbrauch ab Anfangsstand des neuen Zählers (= curr.stand, kein Rückschluss auf Vorgänger möglich)
      const verbrauch = curr.istTausch ? null : curr.stand - prev.stand;
      result.push({ von: prev.datum, bis: curr.datum, verbrauch, istTausch: curr.istTausch });
    }
    return result;
  };

  const farbeKlassen = {
    amber: { border: 'border-honey-200', bg: 'bg-honey-50', badge: 'bg-honey-100 text-honey-700', btn: 'bg-honey-500 hover:bg-honey-600' },
    blue:  { border: 'border-clay-200',  bg: 'bg-clay-50',  badge: 'bg-clay-100 text-clay-700',  btn: 'bg-clay-500 hover:bg-clay-600'  },
    red:   { border: 'border-brick-200',   bg: 'bg-brick-50',   badge: 'bg-brick-100 text-brick-700',    btn: 'bg-brick-500 hover:bg-brick-600'    },
  };

  return (
    <div className="space-y-5">
      {/* Header + Neuen Zähler hinzufügen */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-base font-bold text-cream-800">Zählerverwaltung</div>
          <div className="text-xs text-cream-400">Strom, Wasser, Heizung — beliebig viele Zähler pro Typ</div>
        </div>
        <div className="flex gap-2">
          {ZAEHLER_TYPEN.map(t => (
            <button key={t.id} onClick={() => { setNeuerZaehlerTyp(t.id); setNeuerZaehlerForm({ bezeichnung: '', zaehlernummer: '', einheit: t.einheit }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-cream-200 bg-white rounded-xl hover:bg-cream-50 transition-colors">
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Neuer Zähler Formular */}
      {neuerZaehlerTyp && (() => {
        const typInfo = ZAEHLER_TYPEN.find(t => t.id === neuerZaehlerTyp);
        const fb = farbeKlassen[typInfo.farbe];
        return (
          <div className={`rounded-2xl border ${fb.border} ${fb.bg} p-4 space-y-3`}>
            <div className="font-semibold text-sm text-cream-700">{typInfo.icon} Neuer {typInfo.label}-Zähler</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-cream-500 mb-1">Bezeichnung</label>
                <input type="text" value={neuerZaehlerForm.bezeichnung}
                  onChange={e => setNeuerZaehlerForm(f => ({...f, bezeichnung: e.target.value}))}
                  placeholder={`${typInfo.label} 1`}
                  className="w-full px-2 py-1.5 border border-cream-300 rounded-lg text-sm focus:ring-2 focus:ring-clay-400" />
              </div>
              <div>
                <label className="block text-xs text-cream-500 mb-1">Zählernummer</label>
                <input type="text" value={neuerZaehlerForm.zaehlernummer}
                  onChange={e => setNeuerZaehlerForm(f => ({...f, zaehlernummer: e.target.value}))}
                  placeholder="z.B. 12345678"
                  className="w-full px-2 py-1.5 border border-cream-300 rounded-lg text-sm focus:ring-2 focus:ring-clay-400" />
              </div>
              <div>
                <label className="block text-xs text-cream-500 mb-1">Einheit</label>
                <input type="text" value={neuerZaehlerForm.einheit}
                  onChange={e => setNeuerZaehlerForm(f => ({...f, einheit: e.target.value}))}
                  placeholder={typInfo.einheit}
                  className="w-full px-2 py-1.5 border border-cream-300 rounded-lg text-sm focus:ring-2 focus:ring-clay-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleZaehlerHinzufuegen}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg ${fb.btn} transition-colors`}>
                Zähler anlegen
              </button>
              <button onClick={() => setNeuerZaehlerTyp(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-white border border-cream-200 text-cream-500 rounded-lg hover:bg-cream-50">
                Abbrechen
              </button>
            </div>
          </div>
        );
      })()}

      {/* Zähler-Liste */}
      {zaehler.length === 0 && !neuerZaehlerTyp && (
        <div className="text-center py-12 text-cream-400">
          <div className="flex justify-center mb-3"><Gauge size={40} className="text-cream-300" /></div>
          <div className="font-medium">Noch keine Zähler angelegt</div>
          <div className="text-sm mt-1">Füge oben einen Strom-, Wasser- oder Heizungszähler hinzu</div>
        </div>
      )}

      {ZAEHLER_TYPEN.map(typInfo => {
        const typZaehler = zaehler.filter(z => z.typ === typInfo.id);
        if (typZaehler.length === 0) return null;
        const fb = farbeKlassen[typInfo.farbe];
        return (
          <div key={typInfo.id} className="space-y-3">
            <div className={`text-xs font-bold uppercase tracking-widest ${fb.badge.split(' ')[1]} flex items-center gap-1.5`}>
              {typInfo.icon} {typInfo.label}
            </div>
            {typZaehler.map(z => {
              const isExpanded = expandedId === z.id;
              const sorted = [...(z.ablesungen || [])].sort((a, b) => new Date(b.datum) - new Date(a.datum));
              const letzteAblesung = sorted[0];
              const verbrauchListe = berechneVerbrauch(z.ablesungen);
              return (
                <div key={z.id} className={`rounded-2xl border ${fb.border} bg-white overflow-hidden`}>
                  {/* Zähler-Header */}
                  <div className={`flex items-center justify-between px-4 py-3 ${fb.bg} cursor-pointer`}
                    onClick={() => setExpandedId(isExpanded ? null : z.id)}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${fb.badge}`}>{z.einheit}</span>
                      <div>
                        <div className="font-semibold text-sm text-cream-800">{z.bezeichnung}</div>
                        {z.zaehlernummer && <div className="text-xs text-cream-400">Nr. {z.zaehlernummer}</div>}
                      </div>
                      {!z.aktiv && <span className="text-xs bg-cream-200 text-cream-500 px-2 py-0.5 rounded-full">Inaktiv / Getauscht</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {letzteAblesung && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-cream-800">{letzteAblesung.stand.toLocaleString('de-DE')} {z.einheit}</div>
                          <div className="text-xs text-cream-400">{new Date(letzteAblesung.datum).toLocaleDateString('de-DE')}</div>
                        </div>
                      )}
                      <span className="text-cream-400">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 space-y-4">
                      {/* Aktionen */}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleAbleseOeffnen(z.id)}
                          className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg ${fb.btn} transition-colors`}>
                          + Ablesung eintragen
                        </button>
                        {z.aktiv && (
                          <button onClick={() => handleZaehlerDeaktivieren(z.id)}
                            className="px-3 py-1.5 text-xs font-semibold border border-honey-200 text-honey-600 bg-honey-50 rounded-lg hover:bg-honey-100">
                            Als getauscht markieren
                          </button>
                        )}
                        <button onClick={() => handleZaehlerLoeschen(z.id)}
                          className="px-3 py-1.5 text-xs font-semibold border border-brick-200 text-brick-500 bg-white rounded-lg hover:bg-brick-50">
                          Löschen
                        </button>
                      </div>

                      {/* Ablesungen */}
                      {sorted.length === 0 ? (
                        <div className="text-xs text-cream-400 italic py-2">Noch keine Ablesungen — füge die erste Ablesung hinzu</div>
                      ) : (
                        <div className="space-y-2">
                          {sorted.map((a, idx) => {
                            const verbrauch = verbrauchListe
                              ? verbrauchListe.find(v => v.bis === a.datum)
                              : null;
                            return (
                              <div key={a.id} className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${a.istTausch ? 'border-honey-200 bg-honey-50' : 'border-cream-100 bg-cream-50'}`}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-cream-800">
                                      {a.stand.toLocaleString('de-DE')} {z.einheit}
                                    </span>
                                    <span className="text-xs text-cream-400">{new Date(a.datum).toLocaleDateString('de-DE')}</span>
                                    {a.istTausch && (
                                      <span className="text-xs bg-honey-100 text-honey-700 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1"><RefreshCw size={11} /> Zählertausch</span>
                                    )}
                                    {verbrauch && !verbrauch.istTausch && verbrauch.verbrauch != null && (
                                      <span className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">
                                        Verbrauch: {verbrauch.verbrauch.toLocaleString('de-DE')} {z.einheit}
                                      </span>
                                    )}
                                  </div>
                                  {a.istTausch && a.altStand != null && (
                                    <div className="text-xs text-honey-600 mt-0.5">Alter Zähler Endstand: {a.altStand.toLocaleString('de-DE')} {z.einheit}</div>
                                  )}
                                  {a.notiz && <div className="text-xs text-cream-500 mt-0.5">{a.notiz}</div>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => handleEditOeffnen(z.id, a)}
                                    className="text-xs text-clay-500 hover:text-clay-700 px-2 py-1 rounded-lg hover:bg-clay-50"><Pencil size={12} /></button>
                                  <button onClick={() => handleAbleseLoeschen(z.id, a.id)}
                                    className="text-xs text-brick-400 hover:text-brick-600 px-2 py-1 rounded-lg hover:bg-brick-50"><X size={12} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Ablesung Modal */}
      {ableseModal && (() => {
        const z = zaehler.find(z => z.id === ableseModal.zaehlerId);
        if (!z) return null;
        const typInfo = ZAEHLER_TYPEN.find(t => t.id === z.typ);
        const fb = farbeKlassen[typInfo.farbe];
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="font-bold text-cream-800 flex items-center gap-1">{editAblesung ? <><Pencil size={14} /> Ablesung bearbeiten</> : '+ Ablesung eintragen'}</div>
              <div className="text-xs text-cream-500">{typInfo.icon} {z.bezeichnung} {z.zaehlernummer ? `· Nr. ${z.zaehlernummer}` : ''}</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-cream-500 mb-1">Datum</label>
                  <input type="date" value={ableseForm.datum}
                    onChange={e => setAbleseForm(f => ({...f, datum: e.target.value}))}
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:ring-2 focus:ring-clay-400" />
                </div>
                <div>
                  <label className="block text-xs text-cream-500 mb-1">Zählerstand ({z.einheit})</label>
                  <input type="number" step="0.001" value={ableseForm.stand}
                    onChange={e => setAbleseForm(f => ({...f, stand: e.target.value}))}
                    placeholder="z.B. 12345"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:ring-2 focus:ring-clay-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-cream-500 mb-1">Notiz (optional)</label>
                <input type="text" value={ableseForm.notiz}
                  onChange={e => setAbleseForm(f => ({...f, notiz: e.target.value}))}
                  placeholder="z.B. Jahresablesung, Mieterübergabe…"
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:ring-2 focus:ring-clay-400" />
              </div>

              {/* Zählertausch */}
              <div className={`rounded-xl border p-3 space-y-2 ${ableseForm.istTausch ? 'border-honey-300 bg-honey-50' : 'border-cream-200 bg-cream-50'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={ableseForm.istTausch}
                    onChange={e => setAbleseForm(f => ({...f, istTausch: e.target.checked, altStand: ''}))}
                    className="rounded" />
                  <span className="text-sm font-semibold text-cream-700 flex items-center gap-1"><RefreshCw size={13} /> Zählertausch bei dieser Ablesung</span>
                </label>
                {ableseForm.istTausch && (
                  <div>
                    <label className="block text-xs text-honey-700 mb-1">Endstand alter Zähler ({z.einheit})</label>
                    <input type="number" step="0.001" value={ableseForm.altStand}
                      onChange={e => setAbleseForm(f => ({...f, altStand: e.target.value}))}
                      placeholder="Letzter Stand des alten Zählers"
                      className="w-full px-3 py-2 border border-honey-300 rounded-xl text-sm focus:ring-2 focus:ring-honey-400 bg-white" />
                    <div className="text-xs text-honey-600 mt-1">Der eingetragene Zählerstand oben ist der Anfangsstand des neuen Zählers.</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleAbleseSpeichern} disabled={ableseForm.stand === ''}
                  className={`flex-1 py-2 text-sm font-bold text-white rounded-xl ${fb.btn} disabled:opacity-40 transition-colors`}>
                  Speichern
                </button>
                <button onClick={() => { setAbleseModal(null); setEditAblesung(null); }}
                  className="px-4 py-2 text-sm font-semibold border border-cream-200 text-cream-600 rounded-xl hover:bg-cream-50">
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BausparManager — Bausparverträge verwalten
// ─────────────────────────────────────────────────────────────

export default ZaehlerVerwaltung;
