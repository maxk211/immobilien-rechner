import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, Info } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import ZahlInput from './ZahlInput';
import { SU_ZWECK, zahlungenVon, verwendetSumme, nochNichtVerwendet } from '../utils/sonderumlage.js';

// Sonderumlagen der WEG + Erhaltungsrücklage über das Hausgeld (Objekt → WEG & Verwaltung).
// Cashflow: Abzug im Monat der Zahlung. Steuer: Erhaltung/Rücklage im Jahr, in dem die WEG das
// Geld ausgibt (BFH, 14.01.2025, IX R 19/24); Modernisierung über die AfA.

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-indigo-500';
const datum = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '—';
const neueId = () => Date.now() + Math.floor(Math.random() * 1000);

function VerwendungListe({ liste = [], onChange, hinweis }) {
  const [jahr, setJahr] = useState(String(new Date().getFullYear() - 1));
  const [betrag, setBetrag] = useState('');
  return (
    <div>
      {liste.length > 0 && (
        <ul className="space-y-1 mb-2">
          {liste.map((v, i) => (
            <li key={i} className="flex items-center justify-between text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <span><strong>{v.jahr}</strong> · {formatCurrency(Number(v.betrag) || 0)}</span>
              <button type="button" onClick={() => onChange(liste.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-600" aria-label="Eintrag löschen"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-gray-500">Jahr
          <input type="number" min="1990" max="2100" value={jahr} onChange={e => setJahr(e.target.value)} className={`${inputCls} w-24 mt-0.5`} />
        </label>
        <label className="text-xs text-gray-500">Betrag €
          <input type="number" min="0" step="1" value={betrag} onChange={e => setBetrag(e.target.value)} placeholder="z. B. 850" className={`${inputCls} w-32 mt-0.5`} />
        </label>
        <button type="button" disabled={!(Number(betrag) > 0) || !(Number(jahr) > 1900)}
          onClick={() => { onChange([...liste, { jahr: Math.round(Number(jahr)), betrag: Number(betrag) }]); setBetrag(''); }}
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold disabled:opacity-40">Hinzufügen</button>
      </div>
      {hinweis && <p className="text-[11px] text-gray-400 mt-1.5">{hinweis}</p>}
    </div>
  );
}

function Formular({ start, onSpeichern, onAbbrechen }) {
  const [f, setF] = useState(start);
  const [imSelbenJahr, setImSelbenJahr] = useState(false);
  const [fehler, setFehler] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const speichern = () => {
    if (!(Number(f.betrag) > 0) || !f.faelligAm) { setFehler('Bitte Betrag und Fälligkeit eintragen.'); return; }
    const raten = Math.max(1, Math.round(Number(f.raten) || 1));
    let neu = { ...f, betrag: Number(f.betrag), raten };
    if (imSelbenJahr && neu.zweck !== 'modernisierung' && !(neu.verwendung || []).length) {
      const z = zahlungenVon(neu);
      const jahre = [...new Set(z.map(x => x.jahr))];
      neu = { ...neu, verwendung: jahre.map(j => ({ jahr: j, betrag: z.filter(x => x.jahr === j).reduce((s, x) => s + x.betrag, 0) })) };
    }
    onSpeichern(neu);
  };
  return (
    <div className="bg-white border border-indigo-200 rounded-2xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs text-gray-500 sm:col-span-2">Wofür? (aus dem Beschluss)
          <input value={f.titel || ''} onChange={e => set('titel', e.target.value)} placeholder="z. B. Dachsanierung" className={`${inputCls} mt-0.5`} />
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {Object.entries(SU_ZWECK).map(([k, z]) => (
          <button key={k} type="button" onClick={() => set('zweck', k)}
            className={`text-left rounded-xl border-2 p-2.5 ${f.zweck === k ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="text-sm font-bold text-gray-900">{z.label}</div>
            <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{z.hint}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label className="block text-xs text-gray-500">Dein Anteil gesamt € <span className="text-indigo-600">*</span>
          <input type="number" min="0" step="1" value={f.betrag ?? ''} onChange={e => set('betrag', e.target.value)} placeholder="laut Beschluss" className={`${inputCls} mt-0.5`} />
        </label>
        <label className="block text-xs text-gray-500">Fällig ab <span className="text-indigo-600">*</span>
          <input type="date" value={f.faelligAm || ''} onChange={e => set('faelligAm', e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
        <label className="block text-xs text-gray-500">Monatsraten
          <input type="number" min="1" max="60" step="1" value={f.raten ?? 1} onChange={e => set('raten', e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
      </div>
      {f.zweck !== 'modernisierung' && !(start.verwendung || []).length && (
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={imSelbenJahr} onChange={e => setImSelbenJahr(e.target.checked)} className="mt-0.5" />
          <span>Die WEG führt die Maßnahme im selben Jahr aus und bezahlt sie damit <span className="block text-[11px] text-gray-400">Dann ist der Betrag im Zahlungsjahr absetzbar. Sonst später unter „Von der WEG verwendet“ eintragen (steht in der Jahresabrechnung).</span></span>
        </label>
      )}
      <label className="block text-xs text-gray-500">Notiz
        <input value={f.notiz || ''} onChange={e => set('notiz', e.target.value)} placeholder="z. B. Beschluss ETV 12.05." className={`${inputCls} mt-0.5`} />
      </label>
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onAbbrechen} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold">Abbrechen</button>
        <button type="button" onClick={speichern} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center gap-1"><Check size={14} /> Speichern</button>
      </div>
    </div>
  );
}

function Karte({ su, onAendern, onLoeschen }) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const [verwOffen, setVerwOffen] = useState(false);
  const z = zahlungenVon(su);
  const zweck = SU_ZWECK[su.zweck] || SU_ZWECK.erhaltung;
  if (bearbeiten) return <Formular start={su} onAbbrechen={() => setBearbeiten(false)} onSpeichern={(neu) => { onAendern(neu); setBearbeiten(false); }} />;
  const offen = nochNichtVerwendet(su);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-extrabold text-gray-900">{su.titel || 'Sonderumlage'}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${su.zweck === 'modernisierung' ? 'bg-blue-50 text-blue-700' : su.zweck === 'ruecklage' ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-700'}`}>{zweck.kurz}</span>
          </div>
          <div className="text-sm text-gray-600 mt-0.5">
            {formatCurrency(Number(su.betrag) || 0)}
            {z.length > 1 ? ` · ${z.length} Raten à ${formatCurrency(z[0].betrag)} ab ${datum(z[0].datum)}` : z[0] ? ` · fällig ${datum(z[0].datum)}` : ''}
          </div>
          {su.notiz && <div className="text-xs text-gray-400 mt-0.5">{su.notiz}</div>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={() => setBearbeiten(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600" aria-label="Bearbeiten"><Pencil size={14} /></button>
          <button type="button" onClick={() => { if (window.confirm('Diese Sonderumlage löschen?')) onLoeschen(); }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600" aria-label="Löschen"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
        {su.zweck === 'modernisierung'
          ? <>Steuer: über die AfA ab der Zahlung (wie Herstellungskosten).</>
          : <>Steuer: absetzbar im Jahr, in dem die WEG das Geld ausgibt. {verwendetSumme(su) > 0 && <>Bisher verwendet: <strong>{formatCurrency(verwendetSumme(su))}</strong>. </>}{offen > 0.5 && <span className="text-amber-700 font-semibold">Noch offen: {formatCurrency(offen)}.</span>}</>}
        {su.zweck !== 'modernisierung' && (
          <button type="button" onClick={() => setVerwOffen(v => !v)} className="ml-1 font-bold text-indigo-600 hover:underline">{verwOffen ? 'Schließen' : 'Von der WEG verwendet …'}</button>
        )}
      </div>
      {verwOffen && (
        <div className="mt-2">
          <VerwendungListe liste={su.verwendung || []} onChange={(v) => onAendern({ ...su, verwendung: v })}
            hinweis="Steht in der WEG-Jahresabrechnung: Ausgaben für die Maßnahme, dein Anteil. Ein Jahr kann mehrere Einträge haben." />
        </div>
      )}
    </div>
  );
}

export default function SonderumlagenManager({ params, updateParams }) {
  const [neu, setNeu] = useState(false);
  const liste = params.sonderumlagen || [];
  const setze = (l) => updateParams({ ...params, sonderumlagen: l });
  const ruecklageBekannt = params.hausgeldRuecklage !== null && params.hausgeldRuecklage !== undefined && params.hausgeldRuecklage !== '';
  return (
    <div id="objekt-sonderumlagen" className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">Sonderumlagen & Erhaltungsrücklage</h3>
        <p className="text-xs text-gray-500 mt-1 flex gap-1.5"><Info size={13} className="shrink-0 mt-0.5" />
          Geld, das in die Erhaltungsrücklage der WEG fließt, ist steuerlich erst absetzbar, wenn die WEG es für Reparaturen ausgibt (BFH, 14.01.2025, IX R 19/24). Im Cashflow zählt es, wenn du zahlst.</p>
      </div>

      {/* Erhaltungsrücklage über das Hausgeld */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="text-sm font-bold text-gray-900">Erhaltungsrücklage über das Hausgeld</div>
        <label className="block text-xs text-gray-500 max-w-xs">Davon Zuführung zur Erhaltungsrücklage (€ / Monat)
          <ZahlInput type="number" min="0" step="1" value={params.hausgeldRuecklage ?? ''} placeholder="aus dem Wirtschaftsplan"
            onChange={e => updateParams({ ...params, hausgeldRuecklage: e.target.value === '' ? null : Number(e.target.value) })}
            className={`${inputCls} mt-0.5`} />
        </label>
        {!ruecklageBekannt && Number(params.hausgeld) > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Nicht eingetragen — in der Steuer wird das Hausgeld deshalb voll angesetzt. Der Wert steht im Wirtschaftsplan („Zuführung Erhaltungsrücklage“, dein Anteil).</p>
        )}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Entnahmen für Erhaltung — dein Anteil laut Jahresabrechnung</div>
          <VerwendungListe liste={params.ruecklageVerwendung || []} onChange={(v) => updateParams({ ...params, ruecklageVerwendung: v })}
            hinweis="Diese Beträge sind im jeweiligen Jahr als Werbungskosten absetzbar." />
        </div>
      </div>

      {/* Sonderumlagen */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">Sonderumlagen {liste.length > 0 && <span className="text-gray-400 font-semibold">({liste.length})</span>}</div>
          {!neu && <button type="button" onClick={() => setNeu(true)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"><Plus size={14} /> Sonderumlage erfassen</button>}
        </div>
        {neu && <Formular start={{ id: neueId(), zweck: 'erhaltung', raten: 1, verwendung: [] }} onAbbrechen={() => setNeu(false)} onSpeichern={(su) => { setze([...liste, su]); setNeu(false); }} />}
        {liste.map(su => (
          <Karte key={su.id} su={su}
            onAendern={(n) => setze(liste.map(x => x.id === su.id ? n : x))}
            onLoeschen={() => setze(liste.filter(x => x.id !== su.id))} />
        ))}
        {liste.length === 0 && !neu && <p className="text-xs text-gray-400">Noch keine Sonderumlage. Beschließt die WEG eine, hier mit Betrag, Fälligkeit und Zweck eintragen — sie erscheint dann im Cashflow, in der Steuer und in „Was steht an“.</p>}
      </div>
    </div>
  );
}
