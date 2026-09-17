import { useState } from 'react';
import { FileText, X, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';

const NKAbrechnungModal = ({ onClose, onSave, abrechnungsjahr }) => {
  const [typ, setTyp] = useState('nachzahlung'); // 'nachzahlung' = Mieter zahlt nach, 'erstattung' = Vermieter erstattet
  const [gesamtbetrag, setGesamtbetrag] = useState('');
  const [abjahr, setAbjahr] = useState(abrechnungsjahr || new Date().getFullYear() - 1);
  const [zahlungsmodus, setZahlungsmodus] = useState('sofort'); // 'sofort' | 'raten'
  const [anzahlRaten, setAnzahlRaten] = useState(3);
  const [ersteFaelligkeit, setErsteFaelligkeit] = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notiz, setNotiz] = useState('');

  const betrag = parseFloat(gesamtbetrag) || 0;
  const ratenBetrag = anzahlRaten > 0 ? Math.round((betrag / anzahlRaten) * 100) / 100 : betrag;

  const handleSave = () => {
    if (!betrag) return;
    let raten = [];
    if (zahlungsmodus === 'sofort') {
      raten = [{ id: 1, faelligDatum: ersteFaelligkeit, betrag, bezahlt: false, bezahltAm: null }];
    } else {
      const startDatum = new Date(ersteFaelligkeit);
      for (let i = 0; i < anzahlRaten; i++) {
        const faellig = new Date(startDatum);
        faellig.setMonth(faellig.getMonth() + i);
        const istLetzte = i === anzahlRaten - 1;
        const ratBetrag = istLetzte ? Math.round((betrag - ratenBetrag * (anzahlRaten - 1)) * 100) / 100 : ratenBetrag;
        raten.push({ id: i + 1, faelligDatum: faellig.toISOString().split('T')[0], betrag: ratBetrag, bezahlt: false, bezahltAm: null });
      }
    }
    onSave({ id: Date.now(), typ, gesamtbetrag: betrag, abrechnungsjahr: abjahr, zahlungsmodus, raten, notiz, erstellt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-cream-800 flex items-center gap-2"><FileText size={18} /> NK-Abrechnung erfassen</h3>
          <button onClick={onClose} className="text-cream-400 hover:text-cream-600"><X size={18} /></button>
        </div>

        {/* Typ */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-cream-600 mb-2">Abrechnungsergebnis</label>
          <div className="grid grid-cols-2 gap-2">
            {[['nachzahlung', <span key="nz" className="flex items-center gap-1"><TrendingDown size={14} /> Nachzahlung</span>, 'Mieter muss nachzahlen'], ['erstattung', <span key="er" className="flex items-center gap-1"><Wallet size={14} /> Erstattung</span>, 'Du erstattest dem Mieter']].map(([val, label, desc]) => (
              <button key={val} type="button" onClick={() => setTyp(val)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${typ === val ? (val === 'nachzahlung' ? 'border-sage-500 bg-sage-50' : 'border-honey-400 bg-honey-50') : 'border-cream-200'}`}>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-cream-500">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Abrechnungsjahr + Betrag */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-cream-500 mb-1">Abrechnungsjahr</label>
            <input type="number" value={abjahr} onChange={e => setAbjahr(parseInt(e.target.value) || abrechnungsjahr)}
              className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm font-semibold" />
          </div>
          <div>
            <label className="block text-xs text-cream-500 mb-1">Gesamtbetrag (€)</label>
            <input type="number" step="0.01" value={gesamtbetrag} onChange={e => setGesamtbetrag(e.target.value)}
              placeholder="z.B. 350"
              className="w-full px-3 py-2 border-2 border-clay-300 rounded-lg text-sm font-bold text-right" />
          </div>
        </div>

        {/* Zahlungsmodus */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-cream-600 mb-2">Zahlungsart</label>
          <div className="flex gap-2">
            {[['sofort', 'Einmalzahlung'], ['raten', 'Ratenzahlung']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setZahlungsmodus(val)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${zahlungsmodus === val ? 'border-clay-500 bg-clay-50 text-clay-700' : 'border-cream-200 text-cream-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Erste Fälligkeit */}
        <div className={`grid gap-3 mb-4 ${zahlungsmodus === 'raten' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label className="block text-xs text-cream-500 mb-1">{zahlungsmodus === 'raten' ? '1. Fälligkeit' : 'Fälligkeit'}</label>
            <input type="date" value={ersteFaelligkeit} onChange={e => setErsteFaelligkeit(e.target.value)}
              className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm" />
          </div>
          {zahlungsmodus === 'raten' && (
            <div>
              <label className="block text-xs text-cream-500 mb-1">Anzahl Raten</label>
              <input type="number" min={2} max={24} value={anzahlRaten} onChange={e => setAnzahlRaten(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm font-semibold" />
            </div>
          )}
        </div>
        {zahlungsmodus === 'raten' && betrag > 0 && (
          <div className="mb-4 p-3 bg-clay-50 rounded-xl text-xs text-clay-700">
            {anzahlRaten}× {formatCurrency(ratenBetrag)} monatlich (Fälligkeit jeden 1.)
          </div>
        )}

        {/* Notiz */}
        <div className="mb-5">
          <label className="block text-xs text-cream-500 mb-1">Notiz (optional)</label>
          <input type="text" value={notiz} onChange={e => setNotiz(e.target.value)} placeholder="z.B. NK-Abrechnung 2024"
            className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm" />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-cream-300 rounded-lg text-sm text-cream-600 hover:bg-cream-50">Abbrechen</button>
          <button onClick={handleSave} disabled={!betrag}
            className="flex-1 py-2 bg-clay-600 text-white rounded-lg text-sm font-bold hover:bg-clay-700 disabled:opacity-40">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Kautionsmanagement ───────────────────────────────────────────────────────

export default NKAbrechnungModal;
