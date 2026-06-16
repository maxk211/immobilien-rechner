import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { NK_STANDARD_POSITIONEN } from '../constants/index.js';

export function berechneMieteranteil(pos, mieterflaeche, gesamtflaeche, anzahlParteien) {
  const gesamt = Number(pos.gesamtkosten) || 0;
  if (!gesamt) return 0;
  if (pos.umlageschluessel === 'fest') return Number(pos.mieteranteil_fest) || 0;
  if (pos.umlageschluessel === 'kopf') return gesamtflaeche > 0 ? gesamt / (anzahlParteien || 1) : 0;
  // wohnflaeche (default)
  return gesamtflaeche > 0 ? gesamt * (mieterflaeche / gesamtflaeche) : 0;
}

const NKAbrechnungFormular = ({ mieter, portfolio, existingAbrechnung, onSave, onClose }) => {
  const immo = portfolio.find(i => i.id === mieter.immobilie_id);

  const [form, setForm] = useState(() => {
    if (existingAbrechnung) {
      return {
        abrechnungsjahr: existingAbrechnung.abrechnungsjahr || new Date().getFullYear() - 1,
        mieterflaeche: existingAbrechnung.mieterflaeche || '',
        gesamtflaeche: existingAbrechnung.gesamtflaeche || '',
        anzahlParteien: existingAbrechnung.anzahl_parteien || 1,
        kostenpositionen: existingAbrechnung.kostenpositionen || NK_STANDARD_POSITIONEN.map(p => ({...p})),
        vorauszahlungenGesamt: existingAbrechnung.vorauszahlungen_gesamt || '',
        status: existingAbrechnung.status || 'entwurf',
        notizen: existingAbrechnung.notizen || '',
      };
    }
    return {
      abrechnungsjahr: new Date().getFullYear() - 1,
      mieterflaeche: immo ? (immo.wohnflaeche || '') : '',
      gesamtflaeche: immo ? (immo.wohnflaeche || '') : '',
      anzahlParteien: 1,
      kostenpositionen: NK_STANDARD_POSITIONEN.map(p => ({...p})),
      vorauszahlungenGesamt: mieter.kaltmiete ? (Number(mieter.kaltmiete) * 0.2 * 12).toFixed(0) : '',
      status: 'entwurf',
      notizen: '',
    };
  });

  const [saving, setSaving] = useState(false);

  const mf = Number(form.mieterflaeche) || 0;
  const gf = Number(form.gesamtflaeche) || 0;
  const ap = Number(form.anzahlParteien) || 1;

  const gesamtMieteranteil = form.kostenpositionen.reduce((sum, pos) =>
    sum + berechneMieteranteil(pos, mf, gf, ap), 0);
  const vorauszahlungen = Number(form.vorauszahlungenGesamt) || 0;
  const ergebnis = gesamtMieteranteil - vorauszahlungen;

  const updatePos = (idx, field, value) => {
    setForm(f => ({
      ...f,
      kostenpositionen: f.kostenpositionen.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    }));
  };

  const addPos = () => {
    setForm(f => ({
      ...f,
      kostenpositionen: [...f.kostenpositionen, { bezeichnung: '', kategorie: 'sonstige', gesamtkosten: '', umlageschluessel: 'wohnflaeche', mieteranteil_fest: '' }]
    }));
  };

  const removePos = (idx) => {
    setForm(f => ({ ...f, kostenpositionen: f.kostenpositionen.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...(existingAbrechnung ? { id: existingAbrechnung.id } : {}),
        mieterId: mieter.id,
        immobilieId: mieter.immobilie_id,
        mieterName: mieter.name,
        immobilieName: immo ? (immo.name || immo.adresse || '') : '',
        ...form,
      });
    } finally { setSaving(false); }
  };

  const schluesselLabel = { wohnflaeche: 'Wohnfläche', kopf: 'Pro Partei', fest: 'Fester Betrag' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-teal-700 text-white p-5 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">📄 NK-Abrechnung: {mieter.name}</h2>
            <p className="text-teal-200 text-sm">{immo ? (immo.name || immo.adresse) : ''}</p>
          </div>
          <button onClick={onClose} className="text-white text-2xl hover:text-teal-200">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basisdaten */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Abrechnungsjahr</label>
              <input type="number" value={form.abrechnungsjahr}
                onChange={e => setForm(f => ({...f, abrechnungsjahr: parseInt(e.target.value)}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Mieterfl. (m²)</label>
              <input type="number" step="0.01" value={form.mieterflaeche}
                onChange={e => setForm(f => ({...f, mieterflaeche: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Gesamtfl. (m²)</label>
              <input type="number" step="0.01" value={form.gesamtflaeche}
                onChange={e => setForm(f => ({...f, gesamtflaeche: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Anz. Parteien</label>
              <input type="number" value={form.anzahlParteien}
                onChange={e => setForm(f => ({...f, anzahlParteien: parseInt(e.target.value) || 1}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" min="1" />
            </div>
          </div>

          {/* Anteil-Info */}
          {mf > 0 && gf > 0 && (
            <div className="bg-teal-50 rounded-lg px-4 py-2 text-sm text-teal-700">
              Mieteranteil nach Fläche: <strong>{((mf / gf) * 100).toFixed(1)} %</strong>
              {' '}({mf} m² von {gf} m²)
            </div>
          )}

          {/* Kostenpositionen */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">Kostenpositionen</p>
              <button type="button" onClick={addPos}
                className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200">
                + Position hinzufügen
              </button>
            </div>
            <div className="space-y-2">
              {form.kostenpositionen.map((pos, idx) => {
                const anteil = berechneMieteranteil(pos, mf, gf, ap);
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs text-gray-500 mb-1">Bezeichnung</label>
                        <input type="text" value={pos.bezeichnung}
                          onChange={e => updatePos(idx, 'bezeichnung', e.target.value)}
                          placeholder="z.B. Heizung"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500" />
                      </div>
                      <div className="col-span-5 md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Gesamtkosten (€)</label>
                        <input type="number" step="0.01" value={pos.gesamtkosten}
                          onChange={e => updatePos(idx, 'gesamtkosten', e.target.value)}
                          placeholder="0,00"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500" />
                      </div>
                      <div className="col-span-5 md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Schlüssel</label>
                        <select value={pos.umlageschluessel}
                          onChange={e => updatePos(idx, 'umlageschluessel', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500">
                          <option value="wohnflaeche">Wohnfläche</option>
                          <option value="kopf">Pro Partei</option>
                          <option value="fest">Fester Betrag</option>
                        </select>
                      </div>
                      {pos.umlageschluessel === 'fest' ? (
                        <div className="col-span-5 md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Mieteranteil (€)</label>
                          <input type="number" step="0.01" value={pos.mieteranteil_fest}
                            onChange={e => updatePos(idx, 'mieteranteil_fest', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500" />
                        </div>
                      ) : (
                        <div className="col-span-5 md:col-span-2 flex items-end pb-1.5">
                          <span className="text-sm text-teal-700 font-semibold">
                            = {anteil.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </span>
                        </div>
                      )}
                      <div className="col-span-2 md:col-span-1 flex items-end justify-end pb-0.5">
                        <button type="button" onClick={() => removePos(idx)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                      </div>
                    </div>
                    {pos.umlageschluessel === 'fest' && (
                      <div className="text-right text-xs text-teal-600 mt-1">
                        = {anteil.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vorauszahlungen + Ergebnis */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Gesamte NK-Kosten des Mieters:</span>
              <span className="font-bold text-gray-800">
                {gesamtMieteranteil.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">Geleistete Vorauszahlungen (€)</label>
                <input type="number" step="0.01" value={form.vorauszahlungenGesamt}
                  onChange={e => setForm(f => ({...f, vorauszahlungenGesamt: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-lg font-bold text-sm ${
              ergebnis > 0 ? 'bg-red-100 text-red-700' : ergebnis < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <span>{ergebnis > 0 ? '💸 Nachzahlung Mieter:' : ergebnis < 0 ? '💚 Guthaben Mieter:' : 'Ergebnis:'}</span>
              <span>{Math.abs(ergebnis).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
            </div>
          </div>

          {/* Status + Notizen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm">
                <option value="entwurf">Entwurf</option>
                <option value="versendet">Versendet</option>
                <option value="abgeschlossen">Abgeschlossen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Notizen</label>
              <input type="text" value={form.notizen} onChange={e => setForm(f => ({...f, notizen: e.target.value}))}
                placeholder="Interne Notizen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold disabled:opacity-50">
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NKAbrechnungFormular;
