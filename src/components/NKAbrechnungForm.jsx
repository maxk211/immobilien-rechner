import { useState } from 'react';
import { Wallet, TrendingDown, X, Check, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { NK_KOSTENPOSITIONEN_DEFAULTS } from '../constants/index.js';
import { erstelleMieterschreiben } from '../utils/mieterschreiben.js';

// Phase 8b (Gegencheck-Nachzug): Abschnitt 3.8 verlangt einen echten geführten
// Ablauf in vier Schritten — Zeitraum wählen → Kosten erfassen → Ergebnis
// prüfen → Mieterschreiben erstellen — statt eines Einzelformulars mit
// nachträglich angehängtem PDF-Button. Die Abrechnung wird beim Übergang von
// Schritt 3 zu Schritt 4 gespeichert, damit Schritt 4 auf einem echten,
// bereits persistierten Datensatz das Mieterschreiben erzeugt.
const SCHRITTE = [
  { id: 'zeitraum', label: 'Zeitraum' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'ergebnis', label: 'Ergebnis' },
  { id: 'mieterschreiben', label: 'Mieterschreiben' },
];

const NKAbrechnungForm = ({ abrechnung, onSave, onCancel, mieterListe = [], immobilie }) => {
  const [form, setForm] = useState({
    ...abrechnung,
    kostenpositionen: abrechnung.kostenpositionen?.length > 0
      ? abrechnung.kostenpositionen
      : NK_KOSTENPOSITIONEN_DEFAULTS.map(pos => ({ ...pos, gesamtkosten: 0, mieteranteil: 100 })),
  });
  // Beim Bearbeiten einer bestehenden (bereits gespeicherten) Abrechnung direkt
  // bei "Ergebnis prüfen" einsteigen statt wieder bei Schritt 1 anzufangen.
  const [schrittIdx, setSchrittIdx] = useState(abrechnung.id ? 2 : 0);
  const [gespeichert, setGespeichert] = useState(!!abrechnung.id);
  const [pdfLaeuft, setPdfLaeuft] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updatePos = (key, field, value) => setForm(prev => ({
    ...prev,
    kostenpositionen: prev.kostenpositionen.map(p => p.key === key ? { ...p, [field]: value } : p)
  }));

  const gesamtkosten = form.kostenpositionen.reduce((s, k) => s + (parseFloat(k.gesamtkosten) * (parseFloat(k.mieteranteil) / 100) || 0), 0);
  const saldo = (parseFloat(form.vorauszahlungen) || 0) - gesamtkosten;
  const istErstattung = saldo > 0;

  const schritt = SCHRITTE[schrittIdx].id;

  const weiter = () => setSchrittIdx(i => Math.min(i + 1, SCHRITTE.length - 1));
  const zurueck = () => setSchrittIdx(i => Math.max(i - 1, 0));

  const speichernUndWeiter = () => {
    // onSave gibt den persistierten Datensatz zurück (inkl. neu vergebener id
    // bei einer Neuanlage) — der Assistent übernimmt diese id, damit Schritt 4
    // dieselbe Abrechnung aktualisiert statt versehentlich eine zweite anzulegen.
    const saved = onSave(form) || form;
    setForm(saved);
    setGespeichert(true);
    weiter();
  };

  const mieterschreibenErstellen = async () => {
    setPdfLaeuft(true);
    try {
      await erstelleMieterschreiben(form, immobilie);
      const neu = { ...form, status: 'verschickt' };
      const saved = onSave(neu) || neu;
      setForm(saved);
    } finally {
      setPdfLaeuft(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">NK-Abrechnung {form.abrechnungsjahr}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"><X size={14} /> Abbrechen</button>
        </div>

        {/* Schritt-Anzeige */}
        <div className="flex items-center gap-1 mb-5">
          {SCHRITTE.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => { if (i <= schrittIdx || gespeichert) setSchrittIdx(i); }}
                disabled={i > schrittIdx && !gespeichert}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  i === schrittIdx
                    ? 'bg-indigo-600 text-white'
                    : i < schrittIdx || gespeichert
                      ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer'
                      : 'bg-gray-50 text-gray-300 cursor-default'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${i === schrittIdx ? 'bg-white/20' : i < schrittIdx || gespeichert ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  {i < schrittIdx || (gespeichert && i < 3) ? <Check size={10} /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < SCHRITTE.length - 1 && <div className={`flex-1 h-px mx-1 ${i < schrittIdx ? 'bg-indigo-200' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        {/* Schritt 1: Zeitraum wählen */}
        {schritt === 'zeitraum' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Für welchen Zeitraum und welchen Mieter erstellst du die Abrechnung?</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Abrechnungsjahr</label>
                <input type="number" value={form.abrechnungsjahr || ''} onChange={e => update('abrechnungsjahr', parseInt(e.target.value) || form.abrechnungsjahr)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm text-right" />
                <p className="text-[10px] text-gray-400 mt-1">Zeitraum: 01.01.–31.12.{form.abrechnungsjahr}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mieter</label>
                <input type="text" value={form.mieterName || ''} onChange={e => update('mieterName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm" placeholder="Name des Mieters"
                  list="nkabrechnung-mieter-liste" />
                <datalist id="nkabrechnung-mieter-liste">
                  {mieterListe.map(m => <option key={m.id} value={m.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mieterfläche (m²)</label>
                <input type="number" value={form.wohnflaeche || ''} onChange={e => update('wohnflaeche', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm text-right" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gesamtfläche (m²)</label>
                <input type="number" value={form.gesamtflaeche || ''} onChange={e => update('gesamtflaeche', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm text-right" />
              </div>
            </div>
          </div>
        )}

        {/* Schritt 2: Kosten erfassen */}
        {schritt === 'kosten' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vorauszahlungen gesamt (€)</label>
              <input type="number" step="0.01" value={form.vorauszahlungen || ''} onChange={e => update('vorauszahlungen', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-base sm:text-sm font-bold text-right" />
            </div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kostenpositionen</h4>
            <div className="space-y-2">
              {form.kostenpositionen.map(pos => (
                <div key={pos.key} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-sm text-gray-700 flex items-center gap-1 font-medium">
                      <span>{pos.icon}</span>
                      <span>{pos.label}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-600 min-w-[60px] text-right">
                      {pos.gesamtkosten > 0 ? formatCurrency(pos.gesamtkosten * pos.mieteranteil / 100) : '—'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <input type="number" step="0.01" value={pos.gesamtkosten || ''} placeholder="0"
                        onChange={e => updatePos(pos.key, 'gesamtkosten', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-base sm:text-sm text-right" />
                      <span className="text-xs text-gray-400 flex-shrink-0">€ gesamt</span>
                    </div>
                    <div className="flex items-center gap-1 w-28">
                      <input type="number" min={0} max={100} value={pos.mieteranteil}
                        onChange={e => updatePos(pos.key, 'mieteranteil', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-200 bg-gray-50 rounded text-base sm:text-sm text-right" />
                      <span className="text-xs text-gray-400 flex-shrink-0">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schritt 3: Ergebnis prüfen */}
        {schritt === 'ergebnis' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Prüfe das Ergebnis, bevor du die Abrechnung speicherst.</p>
            <div className="space-y-1.5">
              {form.kostenpositionen.filter(k => k.gesamtkosten > 0).map(pos => (
                <div key={pos.key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{pos.icon} {pos.label}</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(pos.gesamtkosten * pos.mieteranteil / 100)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gesamtkosten Mieteranteil</span>
                <span className="font-bold">{formatCurrency(gesamtkosten)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">− Vorauszahlungen</span>
                <span className="font-bold text-indigo-600">−{formatCurrency(form.vorauszahlungen || 0)}</span>
              </div>
              <div className={`flex justify-between font-bold text-sm p-3 rounded-xl ${istErstattung ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                <span className="flex items-center gap-1">{istErstattung ? <><Wallet size={14} /> Erstattung an Mieter</> : <><TrendingDown size={14} /> Nachzahlung vom Mieter</>}</span>
                <span>{formatCurrency(Math.abs(saldo))}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notizen</label>
              <textarea value={form.notizen || ''} onChange={e => update('notizen', e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm resize-none" />
            </div>
          </div>
        )}

        {/* Schritt 4: Mieterschreiben erstellen */}
        {schritt === 'mieterschreiben' && (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center"><Mail size={36} className="text-indigo-300" /></div>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Die Abrechnung {form.abrechnungsjahr} für {form.mieterName || 'den Mieter'} ist gespeichert.
              Jetzt das Schreiben mit Kostenaufstellung und Ergebnis als PDF erstellen.
            </p>
            <button
              onClick={mieterschreibenErstellen}
              disabled={pdfLaeuft}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Mail size={15} /> {pdfLaeuft ? 'Wird erstellt…' : form.status === 'verschickt' ? 'Erneut erstellen' : 'Mieterschreiben erstellen (PDF)'}
            </button>
            {form.status === 'verschickt' && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1"><Check size={12} /> Als "Verschickt" markiert</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          {schrittIdx > 0 && (
            <button onClick={zurueck} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <ChevronLeft size={14} /> Zurück
            </button>
          )}
          {schritt === 'zeitraum' && (
            <button onClick={weiter} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-1">
              Weiter: Kosten erfassen <ChevronRight size={14} />
            </button>
          )}
          {schritt === 'kosten' && (
            <button onClick={weiter} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-1">
              Weiter: Ergebnis prüfen <ChevronRight size={14} />
            </button>
          )}
          {schritt === 'ergebnis' && (
            <button onClick={speichernUndWeiter} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-1">
              Speichern & weiter: Mieterschreiben <ChevronRight size={14} />
            </button>
          )}
          {schritt === 'mieterschreiben' && (
            <button onClick={onCancel} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-1">
              <Check size={14} /> Fertig
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NKAbrechnungForm;
