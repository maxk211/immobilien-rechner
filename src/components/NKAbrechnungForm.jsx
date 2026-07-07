import { useState } from 'react';
import { Wallet, TrendingDown, X } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { NK_KOSTENPOSITIONEN_DEFAULTS } from '../constants/index.js';

const NKAbrechnungForm = ({ abrechnung, onSave, onCancel }) => {
  const [form, setForm] = useState({
    ...abrechnung,
    kostenpositionen: abrechnung.kostenpositionen?.length > 0
      ? abrechnung.kostenpositionen
      : NK_KOSTENPOSITIONEN_DEFAULTS.map(pos => ({ ...pos, gesamtkosten: 0, mieteranteil: 100 })),
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updatePos = (key, field, value) => setForm(prev => ({
    ...prev,
    kostenpositionen: prev.kostenpositionen.map(p => p.key === key ? { ...p, [field]: value } : p)
  }));

  const gesamtkosten = form.kostenpositionen.reduce((s, k) => s + (parseFloat(k.gesamtkosten) * (parseFloat(k.mieteranteil) / 100) || 0), 0);
  const saldo = (parseFloat(form.vorauszahlungen) || 0) - gesamtkosten;
  const istErstattung = saldo > 0;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">NK-Abrechnung {form.abrechnungsjahr}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"><X size={14} /> Abbrechen</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mieter Name</label>
            <input type="text" value={form.mieterName || ''} onChange={e => update('mieterName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm" placeholder="Name des Mieters" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vorauszahlungen (€)</label>
            <input type="number" step="0.01" value={form.vorauszahlungen || ''} onChange={e => update('vorauszahlungen', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-base sm:text-sm font-bold text-right" />
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

        {/* Kostenpositionen */}
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Kostenpositionen</h4>
        <div className="space-y-2">
          {form.kostenpositionen.map(pos => (
            <div key={pos.key} className="py-2 border-b border-gray-50 last:border-0">
              {/* Label */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-sm text-gray-700 flex items-center gap-1 font-medium">
                  <span>{pos.icon}</span>
                  <span>{pos.label}</span>
                </div>
                <div className="text-xs font-semibold text-gray-600 min-w-[60px] text-right">
                  {pos.gesamtkosten > 0 ? formatCurrency(pos.gesamtkosten * pos.mieteranteil / 100) : '—'}
                </div>
              </div>
              {/* Inputs nebeneinander */}
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

        {/* Saldo */}
        <div className="mt-5 border-t border-gray-200 pt-4 space-y-2">
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

        <div className="mt-4">
          <label className="block text-xs text-gray-500 mb-1">Notizen</label>
          <textarea value={form.notizen || ''} onChange={e => update('notizen', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm resize-none" />
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Abbrechen</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">
            Abrechnung speichern
          </button>
        </div>
      </div>
    </div>
  );
};

// NK-Abrechnung Erfassen: Erstattung oder Nachzahlung mit optionaler Ratenzahlung

export default NKAbrechnungForm;
