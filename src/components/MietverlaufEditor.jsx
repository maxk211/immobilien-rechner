import { useState } from 'react';
import { Pencil, X, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { GRUENDE } from '../utils/kappung.js';
import { mietZeilen, mieteVor, istVorErster, setzeMietanpassung, entferneMietanpassung, eingabeAuswerten } from '../utils/mietverlauf.js';

// Mietverlauf eines Mietverhältnisses: rückwirkend eintragen, bearbeiten, löschen — mit Alt → Neu
// und Prozent. Arbeitet immer auf DER einen Liste (Objekt bzw. Wohnung), nie auf einer Kopie.
// quelle: { kaltmiete, mietAnpassungen }; onChange(neueMietAnpassungen) speichert.
const prozentText = (p) => (p == null ? '' : `${p > 0 ? '+' : ''}${p.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`);

// Eingabe einer Anpassung (neu oder bearbeiten). Auch für „Letzte Mieterhöhung“ im Mieterformular.
export function MietanpassungFormular({ quelle, initial = null, bearbeiteDatum = null, onSpeichern, onAbbrechen, kompakt = false, grundFest = null, titel = null }) {
  const [form, setForm] = useState(() => ({ datum: '', grund: grundFest || 'Mieterhöhung', vorher: '', neu: '', prozent: '', ...(initial || {}) }));
  const [fehler, setFehler] = useState('');
  const basis = bearbeiteDatum ? { ...quelle, mietAnpassungen: entferneMietanpassung(quelle.mietAnpassungen, bearbeiteDatum) } : quelle;
  const vorErster = form.datum ? istVorErster(basis, form.datum) : false;
  const altBekannt = form.datum ? mieteVor(basis, form.datum) : null;
  const e = eingabeAuswerten(form, altBekannt);
  const speichern = () => {
    const fehlt = [!form.datum && 'gültig ab', !(e?.neu > 0) && 'neue Kaltmiete oder %'].filter(Boolean);
    if (fehlt.length) { setFehler(`Bitte ausfüllen: ${fehlt.join(', ')}`); return; }
    // Vor allen bisherigen Einträgen ist die Miete davor nur als Ausgangsmiete bekannt — die steht bei
    // nachgetragenen Erhöhungen meist schon auf dem neuen Wert. Dann fragen statt falsch rechnen.
    if (vorErster && !/senk/i.test(form.grund) && e.vorherEingabe == null && !(altBekannt < e.neu)) {
      setFehler(`Wie hoch war die Miete vor dem ${new Date(form.datum).toLocaleDateString('de-DE')}? Hinterlegt sind ${formatCurrency(altBekannt || 0)} — bitte „Miete davor“ eintragen.`);
      return;
    }
    onSpeichern(setzeMietanpassung(quelle.mietAnpassungen, {
      datum: form.datum, kaltmiete: e.neu, grund: form.grund,
      vorher: vorErster && e.vorherEingabe != null ? e.vorherEingabe : null,
    }, bearbeiteDatum));
  };
  const feld = 'mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm bg-white';
  return (
    <div className="space-y-2">
      {titel && <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{titel}</p>}
      <div className={`grid grid-cols-2 ${kompakt ? '' : 'sm:grid-cols-5'} gap-2 items-end`}>
        <label className="text-xs text-gray-500">Gültig ab
          <input type="date" value={form.datum} onChange={ev => setForm({ ...form, datum: ev.target.value })} className={feld} />
        </label>
        {!grundFest && (
          <label className="text-xs text-gray-500">Grund
            <select value={form.grund} onChange={ev => setForm({ ...form, grund: ev.target.value })} className={feld}>
              {GRUENDE.map(g => <option key={g}>{g}</option>)}
            </select>
          </label>
        )}
        {vorErster && (
          <label className="text-xs text-gray-500">Miete davor
            <input type="text" inputMode="decimal" value={form.vorher} placeholder={`hinterlegt: ${altBekannt ?? 0}`} onChange={ev => setForm({ ...form, vorher: ev.target.value })} className={feld} />
          </label>
        )}
        <label className="text-xs text-gray-500">Neue Kaltmiete
          <input type="text" inputMode="decimal" value={form.neu} onChange={ev => setForm({ ...form, neu: ev.target.value, prozent: '' })} className={feld} />
        </label>
        <label className="text-xs text-gray-500">oder Erhöhung in %
          <input type="text" inputMode="decimal" value={form.prozent} onChange={ev => setForm({ ...form, prozent: ev.target.value, neu: '' })} className={feld} />
        </label>
      </div>
      {form.datum && e?.neu > 0 && e.alt > 0 && (
        <p className="text-xs text-gray-700">Alt <strong>{formatCurrency(e.alt)}</strong> → Neu <strong>{formatCurrency(e.neu)}</strong> <span className={e.neu >= e.alt ? 'text-emerald-700' : 'text-red-600'}>({prozentText(e.prozent)})</span>{vorErster && e.vorherEingabe == null ? <span className="text-gray-400"> · Alt = hinterlegte Ausgangsmiete</span> : null}</p>
      )}
      {fehler && <p className="text-xs text-red-600 font-semibold">{fehler}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={speichern} className="px-3 py-1.5 text-sm font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-700">Übernehmen</button>
        {onAbbrechen && <button type="button" onClick={onAbbrechen} className="px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100">Abbrechen</button>}
      </div>
    </div>
  );
}

export default function MietverlaufEditor({ quelle, onChange, titel = 'Mietanpassungen', hinweis = null, cfFuerMiete = null, kompakt = false }) {
  const [offen, setOffen] = useState(null); // null = zu; { datum?: Bearbeiten-Datum, initial }
  const zeilen = mietZeilen(quelle);
  const oeffnen = (z = null) => {
    if (!z) { setOffen({ key: Date.now() }); return; }
    const roh = (quelle.mietAnpassungen || []).find(a => String(a.datum).slice(0, 10) === z.datum) || {};
    setOffen({ key: Date.now(), datum: z.datum, initial: { datum: z.datum, grund: z.grund, vorher: z.erste && roh.vorher != null ? String(roh.vorher) : '', neu: String(z.neu), prozent: '' } });
  };
  const loeschen = (datum) => {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm(`Mietanpassung vom ${new Date(datum).toLocaleDateString('de-DE')} löschen?`)) return;
    onChange(entferneMietanpassung(quelle.mietAnpassungen, datum));
    if (offen?.datum === datum) setOffen(null);
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-800">{titel}</p>
          <p className="text-xs text-gray-400">{hinweis || 'Auch rückwirkend. Fließt in Cashflow, Mieteingänge, Steuer und Kappungsgrenze — überall dieselbe Zahl.'}</p>
        </div>
        <button type="button" onClick={() => (offen && !offen.datum ? setOffen(null) : oeffnen())}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 shrink-0 flex items-center gap-1">
          {offen && !offen.datum ? 'Abbrechen' : <><Plus size={12} /> Anpassung eintragen</>}
        </button>
      </div>

      {offen && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <MietanpassungFormular key={offen.key} quelle={quelle} initial={offen.initial} bearbeiteDatum={offen.datum || null} kompakt={kompakt}
            titel={offen.datum ? 'Anpassung bearbeiten' : 'Neue Anpassung'}
            onSpeichern={(liste) => { onChange(liste); setOffen(null); }} onAbbrechen={() => setOffen(null)} />
        </div>
      )}

      {zeilen.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-400">Noch keine Anpassung erfasst. Trag die letzte Erhöhung nach (auch rückwirkend) — dann rechnet renditly Sperrfrist und Kappungsgrenze automatisch.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wide text-gray-400 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Gültig ab</th>
                <th className="text-left px-2 py-2 font-semibold">Grund</th>
                <th className="text-right px-2 py-2 font-semibold">Alt</th>
                <th className="text-right px-2 py-2 font-semibold">Neu</th>
                {cfFuerMiete && <th className="text-right px-2 py-2 font-semibold hidden sm:table-cell">Cashflow ab dann</th>}
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...zeilen].reverse().map(z => (
                <tr key={z.datum} className={offen?.datum === z.datum ? 'bg-indigo-50/50' : ''}>
                  <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{new Date(z.datum).toLocaleDateString('de-DE')}{z.zukunft && <span className="ml-1 text-[10px] text-amber-600">angekündigt</span>}</td>
                  <td className="px-2 py-2 text-gray-500">{z.grund}</td>
                  <td className="px-2 py-2 text-right text-gray-400 tabular-nums">{z.alt > 0 ? formatCurrency(z.alt) : '—'}</td>
                  <td className="px-2 py-2 text-right font-semibold text-gray-800 tabular-nums whitespace-nowrap">
                    {formatCurrency(z.neu)}
                    {z.prozent != null && z.diff !== 0 && <span className={`ml-1 text-[10px] ${z.diff > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{prozentText(z.prozent)}</span>}
                  </td>
                  {cfFuerMiete && (() => {
                    const a = cfFuerMiete(z.alt), b = cfFuerMiete(z.neu);
                    const f = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatCurrency(Math.abs(Math.round(v)))}`;
                    return <td className="px-2 py-2 text-right text-[11px] whitespace-nowrap hidden sm:table-cell"><span className="line-through text-gray-400">{f(a.nach)}</span> <strong className={b.nach >= 0 ? 'text-emerald-700' : 'text-red-600'}>{f(b.nach)}</strong></td>;
                  })()}
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => oeffnen(z)} title="Bearbeiten" aria-label={`Anpassung ${z.datum} bearbeiten`} className="p-1 text-gray-400 hover:text-indigo-600"><Pencil size={13} /></button>
                    <button type="button" onClick={() => loeschen(z.datum)} title="Löschen" aria-label={`Anpassung ${z.datum} löschen`} className="p-1 text-gray-300 hover:text-red-500"><X size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
