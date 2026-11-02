import { useState } from 'react';
import { Plus, Landmark, Trash2 } from 'lucide-react';
import FinanzierungsReiter from './FinanzierungsReiter';
import { formatCurrency } from '../utils/format.js';
import { darlehensListe, darlehenAlsObjekt, weitereDarlehen } from '../utils/darlehen.js';
import { beleihbarFrei } from '../utils/kapital.js';

// Mehrere parallel laufende Darlehen je Objekt (beliebig viele).
// Darlehen 1 = immo.finanzierungsphasen; weitere in immo.weitereDarlehen, jedes mit eigenen
// Konditionen, eigener Laufzeit und eigenen Anschlussfinanzierungen (Phasen-Kette je Darlehen).
// Für jedes Darlehen läuft derselbe Finanzierungs-Reiter wie bisher — nur auf dieses Darlehen.

export const ZWECK = {
  kauf: 'Teil der Kauffinanzierung',
  modernisierung: 'Modernisierung / Sanierung',
  sonstiges: 'Sonstiges',
};

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-500';
const jahreZwischen = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / (365.25 * 864e5)));

// Darlehen 1: Reiter ohne die weiteren Darlehen (sonst würde er die Summe zeigen), Änderungen
// zurück mit den weiteren Darlehen speichern. Wird Darlehen 1 entfernt, rückt Darlehen 2 nach.
export function HauptDarlehenReiter({ params, updateParams, ...rest }) {
  const extras = params.weitereDarlehen || [];
  return (
    <FinanzierungsReiter {...rest} params={{ ...params, weitereDarlehen: [] }}
      updateParams={(p) => {
        if (!(p.finanzierungsphasen || []).length && extras.length) {
          const [naechstes, ...rest2] = extras;
          updateParams({ ...p, finanzierungsphasen: naechstes.phasen || [], finanzierungsbetrag: naechstes.betrag, vollEigenfinanziert: false, weitereDarlehen: rest2 });
        } else {
          updateParams({ ...p, weitereDarlehen: extras });
        }
      }} />
  );
}

function NeuesDarlehen({ onAnlegen, onAbbrechen }) {
  const [f, setF] = useState({ name: '', zweck: '', betrag: '', typ: 'annuitaet', sollzins: '', kenne: 'tilgung', tilgung: '', rate: '', start: '', zbBis: '' });
  const [fehler, setFehler] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const n = (v) => Number(String(v).replace(',', '.'));
  const anlegen = () => {
    const fehlt = [];
    if (!f.name.trim()) fehlt.push('Bezeichnung/Bank');
    if (!f.zweck) fehlt.push('Wofür');
    if (!(n(f.betrag) > 0)) fehlt.push('Darlehensbetrag');
    if (!(n(f.sollzins) >= 0) || f.sollzins === '') fehlt.push('Sollzins');
    if (f.typ !== 'endfaellig' && f.kenne === 'tilgung' && !(n(f.tilgung) > 0)) fehlt.push('Tilgung');
    if (f.typ !== 'endfaellig' && f.kenne === 'rate' && !(n(f.rate) > 0)) fehlt.push('Monatsrate');
    if (!f.start) fehlt.push('Kreditbeginn');
    if (!f.zbBis) fehlt.push(f.typ === 'endfaellig' ? 'Laufzeit bis' : 'Zinsbindung bis');
    if (fehlt.length) { setFehler(`Bitte ausfüllen: ${fehlt.join(', ')}`); return; }
    const jahre = jahreZwischen(f.start, f.zbBis);
    const betrag = n(f.betrag);
    const phase = {
      id: Date.now(), name: f.name.trim(), kreditinstitut: f.name.trim(), darlehensTyp: f.typ,
      sollzinssatz: n(f.sollzins),
      anfangstilgung: f.typ === 'endfaellig' ? 0 : f.kenne === 'tilgung' ? n(f.tilgung) : Math.max(0, n(f.rate) * 12 / betrag * 100 - n(f.sollzins)),
      monatlicherBetrag: f.typ !== 'endfaellig' && f.kenne === 'rate' ? n(f.rate) : null,
      tilgungssatz: f.typ === 'tilgung' ? n(f.tilgung) : undefined,
      zinsbindung: jahre, laufzeit: jahre, zinsbindungBis: f.zbBis, zinsbindungBisBestaetigt: true,
      kreditStartDatum: f.start, monatlicheTilgung: null, sondertilgungJaehrlich: 0, restschuldOverride: null,
    };
    onAnlegen({ id: Date.now() + 1, name: f.name.trim(), zweck: f.zweck, betrag, phasen: [phase] });
  };
  return (
    <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
      <div className="text-sm font-extrabold text-gray-900">Weiteres Darlehen</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-gray-500">Bank / Bezeichnung <span className="text-indigo-600">*</span>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="z. B. KfW 261 oder Sparkasse II" className={`${inputCls} mt-0.5`} />
        </label>
        <label className="text-xs text-gray-500">Darlehensbetrag € <span className="text-indigo-600">*</span>
          <input type="number" min="0" step="1000" value={f.betrag} onChange={e => set('betrag', e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Wofür? <span className="text-indigo-600">*</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.entries(ZWECK).map(([k, l]) => (
            <button key={k} type="button" onClick={() => set('zweck', k)} className={`text-left rounded-xl border-2 px-3 py-2 text-sm font-semibold ${f.zweck === k ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 text-gray-700'}`}>{l}</button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-1">Nur Darlehen, die den Kauf mitfinanziert haben, verringern das eingesetzte Eigenkapital in der Eigenkapitalrendite.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs text-gray-500">Darlehensart
          <select value={f.typ} onChange={e => set('typ', e.target.value)} className={`${inputCls} mt-0.5`}>
            <option value="annuitaet">Annuität</option><option value="tilgung">Tilgungsdarlehen</option><option value="endfaellig">Endfällig</option>
          </select>
        </label>
        <label className="text-xs text-gray-500">Sollzins % p. a. <span className="text-indigo-600">*</span>
          <input type="number" min="0" step="0.01" value={f.sollzins} onChange={e => set('sollzins', e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
        {f.typ !== 'endfaellig' && (
          <div className="text-xs text-gray-500">
            <div className="flex gap-2 mb-0.5">
              <button type="button" onClick={() => set('kenne', 'tilgung')} className={`font-semibold ${f.kenne === 'tilgung' ? 'text-indigo-700 underline' : ''}`}>Tilgung %</button>
              {f.typ === 'annuitaet' && <button type="button" onClick={() => set('kenne', 'rate')} className={`font-semibold ${f.kenne === 'rate' ? 'text-indigo-700 underline' : ''}`}>oder Rate €</button>}
            </div>
            {f.kenne === 'rate' && f.typ === 'annuitaet'
              ? <input type="number" min="0" step="1" value={f.rate} onChange={e => set('rate', e.target.value)} placeholder="Monatsrate" className={inputCls} />
              : <input type="number" min="0" step="0.1" value={f.tilgung} onChange={e => set('tilgung', e.target.value)} placeholder="Anfangstilgung" className={inputCls} />}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-gray-500">Kreditbeginn <span className="text-indigo-600">*</span>
          <input type="date" value={f.start} onChange={e => set('start', e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
        <label className="text-xs text-gray-500">{f.typ === 'endfaellig' ? 'Laufzeit bis' : 'Zinsbindung bis'} <span className="text-indigo-600">*</span>
          <input type="date" value={f.zbBis} onChange={e => set('zbBis', e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
      </div>
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onAbbrechen} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold">Abbrechen</button>
        <button type="button" onClick={anlegen} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">Darlehen anlegen</button>
      </div>
    </div>
  );
}

export default function WeitereDarlehen({ params, updateParams, marktwert, cashflowNachTilgung = 0 }) {
  const [neu, setNeu] = useState(false);
  const extras = params.weitereDarlehen || [];
  const hauptVorhanden = (params.finanzierungsphasen || []).length > 0;
  const liste = darlehensListe(params);
  const setzeExtras = (l) => updateParams({ ...params, weitereDarlehen: l });
  if (!hauptVorhanden && !extras.length) return null;

  const summe = (f) => liste.reduce((s, d) => s + (d.verlauf.abbezahltHeute ? 0 : f(d.verlauf)), 0);
  const rsGesamt = liste.reduce((s, d) => s + d.verlauf.restschuldHeute, 0);

  return (
    <div className="space-y-4">
      {weitereDarlehen(params).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Landmark size={16} className="text-indigo-600" />
            <span className="text-sm font-extrabold text-gray-900">Alle Darlehen zusammen</span>
            <span className="text-xs text-gray-400">fließt so in Cashflow, Steuer und Vermögen ein</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
                <tr><th className="text-left px-4 py-2">Darlehen</th><th className="text-right px-3 py-2">Restschuld</th><th className="text-right px-3 py-2">Rate</th><th className="text-right px-3 py-2">Zins</th><th className="text-right px-4 py-2">Tilgung</th></tr>
              </thead>
              <tbody>
                {liste.map(d => (
                  <tr key={d.idx} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-semibold text-gray-800">{d.name}{d.idx > 0 && d.zweck && <span className="ml-1.5 text-[10px] font-bold text-gray-400">{ZWECK[d.zweck]}</span>}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(d.verlauf.restschuldHeute)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(d.verlauf.abbezahltHeute ? 0 : d.verlauf.rateHeute)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(d.verlauf.abbezahltHeute ? 0 : d.verlauf.zinsHeute)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(d.verlauf.abbezahltHeute ? 0 : d.verlauf.tilgungHeute)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-extrabold">
                  <td className="px-4 py-2">Gesamt</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(rsGesamt)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(summe(v => v.rateHeute))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(summe(v => v.zinsHeute))}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(summe(v => v.tilgungHeute))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {marktwert > 0 && <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">Beleihbar frei über alle Darlehen: <strong>{formatCurrency(beleihbarFrei(marktwert, rsGesamt))}</strong> (Schätzung)</div>}
        </div>
      )}

      {extras.map((d, i) => (
        <div key={d.id ?? i} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">Darlehen {i + 2}</span>
            <input value={d.name || ''} onChange={e => setzeExtras(extras.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              aria-label="Bezeichnung" className="px-2 py-1 border border-gray-200 rounded-lg text-sm font-semibold" />
            <select value={d.zweck || ''} onChange={e => setzeExtras(extras.map((x, j) => j === i ? { ...x, zweck: e.target.value } : x))}
              aria-label="Wofür" className="px-2 py-1 border border-gray-200 rounded-lg text-xs">
              <option value="" disabled>Wofür?</option>
              {Object.entries(ZWECK).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button type="button" onClick={() => { if (window.confirm(`${d.name || 'Dieses Darlehen'} entfernen? Rate, Restschuld und Zinsen dieses Darlehens werden gelöscht.`)) setzeExtras(extras.filter((_, j) => j !== i)); }}
              className="ml-auto p-1.5 text-gray-300 hover:text-red-600" aria-label="Darlehen entfernen"><Trash2 size={14} /></button>
          </div>
          <FinanzierungsReiter bezeichnung={`Darlehen ${i + 2}`} params={darlehenAlsObjekt(params, d)} marktwert={marktwert} cashflowNachTilgung={cashflowNachTilgung}
            updateParams={(p) => {
              const phasen = p.finanzierungsphasen || [];
              if (!phasen.length) { setzeExtras(extras.filter((_, j) => j !== i)); return; }
              setzeExtras(extras.map((x, j) => j === i ? { ...x, phasen, betrag: p.finanzierungsbetrag ?? x.betrag } : x));
            }} />
        </div>
      ))}

      {neu
        ? <NeuesDarlehen onAbbrechen={() => setNeu(false)} onAnlegen={(d) => { setzeExtras([...extras, d]); setNeu(false); }} />
        : (
          <button type="button" onClick={() => setNeu(true)}
            className="w-full py-3 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 hover:border-indigo-400 text-sm font-semibold flex items-center justify-center gap-1.5">
            <Plus size={16} /> Weiteres Darlehen hinzufügen
            <span className="text-xs font-normal text-gray-400">— läuft parallel, eigene Konditionen</span>
          </button>
        )}
    </div>
  );
}
