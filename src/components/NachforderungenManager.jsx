import { useState } from 'react';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Zap, X } from 'lucide-react';
import {
  nachforderungStand, gezahlt, restbetrag, sollImMonat, istImMonat, voraussichtlichFertig,
  anbieterEnde, rateEingegangen, restKomplett, mitZahlung, ohneZahlung, baueNachforderung,
  teileAuf, heuteKey, monatName,
} from '../utils/nachforderung.js';

// Nachforderung mit Ratenplan (z. B. Strom-Nachzahlung).
// Zwei Seiten: was von deinem Konto an den Anbieter geht, und was jeder Mieter
// mit einem monatlichen Zuschlag zurückzahlt. Getrennt von der Miete gebucht.

const eur = (v) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
const n = (v) => Number(v) || 0;
const naechsterMonat = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1); return heuteKey(d); };
const inputCls = 'w-full px-2.5 py-2 border border-gray-300 rounded-lg text-base sm:text-sm bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none';

function leeresFormular(mieterNamen) {
  return {
    titel: '', gesamt: '', eigenanteil: '', notiz: '',
    anbieterAktiv: true, anbieterBetrag: '', anbieterAb: '', anbieterMonate: '',
    mieterAb: naechsterMonat(),
    mieter: (mieterNamen.length ? mieterNamen : ['']).map(name => ({ name, anteil: '', zuschlag: '', ab: '' })),
  };
}
function ausNachforderung(nf) {
  return {
    id: nf.id, titel: nf.titel, gesamt: nf.gesamt, eigenanteil: nf.eigenanteil || '', notiz: nf.notiz || '',
    anbieterAktiv: !!nf.anbieter, anbieterBetrag: nf.anbieter?.betragMonat ?? '', anbieterAb: nf.anbieter?.ab || '', anbieterMonate: nf.anbieter?.monate ?? '',
    mieterAb: nf.mieter[0]?.ab || naechsterMonat(),
    mieter: nf.mieter.map(m => ({ ...m })),
  };
}

function Formular({ start, mieterNamen, onAbbrechen, onSpeichern }) {
  const [f, setF] = useState(start);
  const [fehler, setFehler] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setM = (i, k, v) => setF(p => ({ ...p, mieter: p.mieter.map((m, j) => j === i ? { ...m, [k]: v } : m) }));
  const rueckzahlen = Math.max(0, n(f.gesamt) - n(f.eigenanteil));
  const summeAnteile = f.mieter.reduce((s, m) => s + n(m.anteil), 0);
  const anbieterSumme = n(f.anbieterBetrag) * Math.max(1, Math.round(n(f.anbieterMonate) || 1));

  const aufteilen = () => {
    const namen = f.mieter.filter(m => (m.name || '').trim());
    const anteile = teileAuf(f.gesamt, f.eigenanteil, namen.length);
    let k = 0;
    setF(p => ({ ...p, mieter: p.mieter.map(m => (m.name || '').trim() ? { ...m, anteil: anteile[k++] } : m) }));
  };
  const speichern = () => {
    if (!(n(f.gesamt) > 0)) return setFehler('Bitte den Gesamtbetrag der Nachforderung eintragen.');
    if (n(f.eigenanteil) > n(f.gesamt)) return setFehler('Dein Eigenanteil ist größer als der Gesamtbetrag.');
    const aktive = f.mieter.filter(m => (m.name || '').trim());
    if (!aktive.length) return setFehler('Mindestens einen Mieter mit Namen eintragen.');
    if (aktive.some(m => !(n(m.anteil) > 0))) return setFehler('Jeder Mieter braucht einen Anteil — oder „Gleichmäßig aufteilen“ nutzen.');
    if (aktive.some(m => !(n(m.zuschlag) > 0))) return setFehler('Jeder Mieter braucht einen Zuschlag pro Monat.');
    if (f.anbieterAktiv && (!(n(f.anbieterBetrag) > 0) || !f.anbieterAb)) return setFehler('Bitte Rate an den Anbieter und den ersten Monat eintragen — oder den Haken bei „Ich zahle an den Anbieter“ entfernen.');
    onSpeichern(baueNachforderung({ ...f, mieter: f.mieter.map(m => ({ ...m, ab: f.mieterAb })) }));
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 sm:p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">{f.id ? 'Nachforderung bearbeiten' : 'Neue Nachforderung'}</div>
          <div className="text-sm text-gray-500">Zum Beispiel eine Strom-Nachzahlung, die deine Mieter in Raten zurückzahlen.</div>
        </div>
        <button type="button" onClick={onAbbrechen} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="sm:col-span-3 block">
          <span className="text-xs font-semibold text-gray-600">Bezeichnung</span>
          <input className={inputCls} value={f.titel} onChange={e => set('titel', e.target.value)} placeholder="z. B. Strom-Nachzahlung 2025" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Gesamtbetrag</span>
          <input type="number" inputMode="decimal" className={inputCls} value={f.gesamt} onChange={e => set('gesamt', e.target.value)} placeholder="€" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Davon trägst du selbst</span>
          <input type="number" inputMode="decimal" className={inputCls} value={f.eigenanteil} onChange={e => set('eigenanteil', e.target.value)} placeholder="€" />
        </label>
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <div className="text-xs font-semibold text-gray-500">Zahlen die Mieter zurück</div>
          <div className="text-base font-extrabold text-gray-900">{eur(rueckzahlen)}</div>
        </div>
      </div>

      {/* Anbieter */}
      <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <input type="checkbox" checked={f.anbieterAktiv} onChange={e => set('anbieterAktiv', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          Ich zahle die Nachforderung an den Anbieter (geht von meinem Konto ab)
        </label>
        {f.anbieterAktiv && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Rate pro Monat</span>
              <input type="number" inputMode="decimal" className={inputCls} value={f.anbieterBetrag} onChange={e => set('anbieterBetrag', e.target.value)} placeholder="€" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Erste Rate im</span>
              <input type="month" className={inputCls} value={f.anbieterAb} onChange={e => set('anbieterAb', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Anzahl Raten</span>
              <input type="number" inputMode="numeric" min="1" className={inputCls} value={f.anbieterMonate} onChange={e => set('anbieterMonate', e.target.value)} placeholder="1 = auf einmal" />
            </label>
            <div className="sm:col-span-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-gray-500">Ergibt {eur(anbieterSumme)}</span>
              {n(f.gesamt) > 0 && anbieterSumme > 0 && Math.abs(anbieterSumme - n(f.gesamt)) > 0.5 && (
                <span className="text-amber-700 font-semibold">weicht vom Gesamtbetrag ({eur(f.gesamt)}) ab</span>
              )}
              {n(f.gesamt) > 0 && (
                <button type="button" onClick={() => setF(p => ({ ...p, anbieterBetrag: p.gesamt, anbieterMonate: 1 }))} className="font-semibold text-indigo-600 hover:underline">Auf einmal bezahlt</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mieter */}
      <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-sm font-bold text-gray-800">Wer zahlt wie viel zurück?</div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 flex items-center gap-1.5">ab
              <input type="month" className="px-2 py-1 border border-gray-300 rounded-md text-base sm:text-xs" value={f.mieterAb} onChange={e => set('mieterAb', e.target.value)} />
            </label>
            <button type="button" onClick={aufteilen} disabled={!(n(f.gesamt) > 0)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 disabled:opacity-40">Gleichmäßig aufteilen</button>
          </div>
        </div>
        <datalist id="nf-mieter-namen">{mieterNamen.map(x => <option key={x} value={x} />)}</datalist>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 px-0.5">
            <span className="col-span-4">Name</span><span className="col-span-3">Anteil gesamt</span><span className="col-span-3">Zuschlag pro Monat</span><span className="col-span-2" />
          </div>
          {f.mieter.map((m, i) => (
            <div key={m.id || i} className="grid grid-cols-12 gap-2 items-center">
              <input list="nf-mieter-namen" className={`${inputCls} col-span-12 sm:col-span-4`} value={m.name} onChange={e => setM(i, 'name', e.target.value)} placeholder="Name" />
              <input type="number" inputMode="decimal" className={`${inputCls} col-span-5 sm:col-span-3`} value={m.anteil} onChange={e => setM(i, 'anteil', e.target.value)} placeholder="Anteil €" />
              <input type="number" inputMode="decimal" className={`${inputCls} col-span-5 sm:col-span-3`} value={m.zuschlag} onChange={e => setM(i, 'zuschlag', e.target.value)} placeholder="€ / Monat" />
              <div className="col-span-2 flex items-center justify-end gap-1">
                {n(m.anteil) > 0 && n(m.zuschlag) > 0 && <span className="hidden sm:inline text-[11px] text-gray-400">{Math.ceil(n(m.anteil) / n(m.zuschlag))} Mon.</span>}
                <button type="button" onClick={() => setF(p => ({ ...p, mieter: p.mieter.filter((_, j) => j !== i) }))} className="p-1.5 text-gray-300 hover:text-red-500" title="Entfernen"><Trash2 size={15} /></button>
              </div>
              {(m.zahlungen || []).length > 0 && <div className="col-span-12 -mt-1 text-[11px] text-gray-400">{m.zahlungen.length} Zahlung{m.zahlungen.length !== 1 ? 'en' : ''} bleiben erhalten</div>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <button type="button" onClick={() => setF(p => ({ ...p, mieter: [...p.mieter, { name: '', anteil: '', zuschlag: '', ab: '' }] }))} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14} /> Mieter hinzufügen</button>
          {n(f.gesamt) > 0 && (
            <span className={`text-xs ${Math.abs(summeAnteile - rueckzahlen) > 0.5 ? 'text-amber-700 font-semibold' : 'text-gray-500'}`}>
              Anteile zusammen {eur(summeAnteile)} von {eur(rueckzahlen)}
            </span>
          )}
        </div>
      </div>

      {fehler && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fehler}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onAbbrechen} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Abbrechen</button>
        <button type="button" onClick={speichern} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-700">Speichern</button>
      </div>
    </div>
  );
}

function ZahlungErfassen({ onErfassen }) {
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [betrag, setBetrag] = useState('');
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md text-base sm:text-xs" />
      <input type="number" inputMode="decimal" value={betrag} onChange={e => setBetrag(e.target.value)} placeholder="Betrag €" className="w-28 px-2 py-1 border border-gray-300 rounded-md text-base sm:text-xs" />
      <button type="button" disabled={!(n(betrag) > 0) || !datum}
        onClick={() => { onErfassen({ datum, monat: datum.slice(0, 7), betrag: n(betrag), art: 'sonstig' }); setBetrag(''); }}
        className="px-2.5 py-1 rounded-md bg-gray-900 text-white text-xs font-bold disabled:opacity-40">Zahlung erfassen</button>
    </div>
  );
}

function MieterZeile({ nf, m, onListe, liste }) {
  const [offen, setOffen] = useState(false);
  const key = heuteKey();
  const rest = restbetrag(m);
  const soll = sollImMonat(m, key);
  const ist = istImMonat(m, key);
  const faellig = soll > 0 && ist + 0.004 < soll;
  const ende = voraussichtlichFertig(m, key);
  const quote = n(m.anteil) > 0 ? Math.min(100, (gezahlt(m) / n(m.anteil)) * 100) : 0;
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-40">
          <div className="text-sm font-bold text-gray-900 truncate">{m.name}</div>
          <div className="text-xs text-gray-500">
            {rest <= 0.004
              ? <span className="text-emerald-700 font-semibold">Komplett zurückgezahlt{ende ? ` · ${monatName(ende)}` : ''}</span>
              : <>{eur(m.zuschlag)} pro Monat · noch {eur(rest)}{ende ? ` · fertig voraussichtlich ${monatName(ende)}` : ''}</>}
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-xs"><div className="h-full bg-emerald-500" style={{ width: `${quote}%` }} /></div>
        </div>
        <div className="text-right text-xs text-gray-500 w-28">
          <div><span className="font-bold text-gray-900">{eur(gezahlt(m))}</span> von {eur(m.anteil)}</div>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {faellig && (
            <button type="button" onClick={() => onListe(rateEingegangen(liste, nf.id, m.id))}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
              {monatName(key).split(' ')[0]} eingegangen · {eur(soll - ist)}
            </button>
          )}
          {rest > 0.004 && (
            <button type="button" onClick={() => { if (confirm(`${m.name} hat den Rest von ${eur(rest)} auf einmal gezahlt?`)) onListe(restKomplett(liste, nf.id, m.id)); }}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 text-xs font-bold text-gray-700">Rest auf einmal</button>
          )}
          <button type="button" onClick={() => setOffen(o => !o)} className="px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 flex items-center gap-1">
            Zahlungen {offen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>
      {offen && (
        <div className="mt-2 ml-0 sm:ml-2 rounded-lg bg-gray-50 border border-gray-100 p-2.5">
          {(m.zahlungen || []).length === 0 && <div className="text-xs text-gray-400">Noch keine Zahlung erfasst.</div>}
          {[...(m.zahlungen || [])].sort((a, b) => (a.datum || a.monat).localeCompare(b.datum || b.monat)).map(z => (
            <div key={z.id} className="flex items-center justify-between gap-2 text-xs py-1">
              <span className="text-gray-600">{z.datum ? new Date(z.datum).toLocaleDateString('de-DE') : monatName(z.monat)}{z.art === 'einmal' ? ' · Rest auf einmal' : ''}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{eur(z.betrag)}</span>
                <button type="button" onClick={() => onListe(ohneZahlung(liste, nf.id, m.id, z.id))} className="text-gray-300 hover:text-red-500" title="Zahlung löschen"><Trash2 size={13} /></button>
              </span>
            </div>
          ))}
          <ZahlungErfassen onErfassen={(z) => onListe(mitZahlung(liste, nf.id, m.id, z))} />
        </div>
      )}
    </div>
  );
}

function Karte({ nf, liste, onListe, onBearbeiten }) {
  const s = nachforderungStand(nf);
  const quote = s.anteile > 0 ? Math.min(100, (s.zurueck / s.anteile) * 100) : 0;
  const ende = anbieterEnde(nf);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 flex flex-wrap items-start justify-between gap-2 border-b border-gray-100">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-amber-500 shrink-0" />
            <span className="font-extrabold text-gray-900">{nf.titel}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.fertig ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{s.fertig ? 'zurückgezahlt' : 'läuft'}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{eur(nf.gesamt)} insgesamt · getrennt von der Miete gebucht</div>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={onBearbeiten} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100" title="Bearbeiten"><Pencil size={15} /></button>
          <button type="button" onClick={() => { if (confirm(`„${nf.titel}“ mit allen erfassten Zahlungen löschen?`)) onListe(liste.filter(x => x.id !== nf.id)); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Löschen"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
        <div className="bg-white px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">An den Anbieter</div>
          {nf.anbieter ? (
            <>
              <div className="text-base font-extrabold text-gray-900">{eur(s.anbieterBezahlt)} <span className="text-xs font-semibold text-gray-400">von {eur(s.anbieterSumme)}</span></div>
              <div className="text-[11px] text-gray-500">{nf.anbieter.monate > 1 ? `${eur(nf.anbieter.betragMonat)} / Monat bis ${monatName(ende)}` : `einmal im ${monatName(nf.anbieter.ab)}`}</div>
            </>
          ) : <div className="text-xs text-gray-400 mt-1">nicht erfasst</div>}
        </div>
        <div className="bg-white px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Von Mietern zurück</div>
          <div className="text-base font-extrabold text-emerald-700">{eur(s.zurueck)} <span className="text-xs font-semibold text-gray-400">von {eur(s.anteile)}</span></div>
        </div>
        <div className="bg-white px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Noch offen bei Mietern</div>
          <div className="text-base font-extrabold text-gray-900">{eur(s.offen)}</div>
        </div>
        <div className="bg-white px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Dein Eigenanteil</div>
          <div className="text-base font-extrabold text-indigo-700">{eur(s.eigenanteil)}</div>
          <div className="text-[11px] text-gray-500">bleibt am Ende bei dir</div>
        </div>
      </div>
      <div className="px-4 sm:px-5 pt-3">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${quote}%` }} /></div>
      </div>

      {(Math.abs(s.luecke) > 0.5 || Math.abs(s.anbieterAbweichung) > 0.5) && (
        <div className="mx-4 sm:mx-5 mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 space-y-1">
          {Math.abs(s.luecke) > 0.5 && <div className="flex gap-1.5"><AlertTriangle size={13} className="shrink-0 mt-0.5" />Anteile der Mieter ({eur(s.anteile)}) plus dein Eigenanteil ergeben nicht den Gesamtbetrag — es {s.luecke > 0 ? 'fehlen' : 'sind zu viel'} {eur(Math.abs(s.luecke))}.</div>}
          {Math.abs(s.anbieterAbweichung) > 0.5 && <div className="flex gap-1.5"><AlertTriangle size={13} className="shrink-0 mt-0.5" />Die Raten an den Anbieter ergeben {eur(s.anbieterSumme)}, die Nachforderung ist {eur(nf.gesamt)}.</div>}
        </div>
      )}

      <div className="px-4 sm:px-5 divide-y divide-gray-100">
        {nf.mieter.map(m => <MieterZeile key={m.id} nf={nf} m={m} liste={liste} onListe={onListe} />)}
      </div>
      {s.fertig && (
        <div className="mx-4 sm:mx-5 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 size={14} /> Alle Mieter haben ihren Anteil zurückgezahlt.
        </div>
      )}
    </div>
  );
}

export default function NachforderungenManager({ liste = [], onChange, mieterNamen = [] }) {
  const [formular, setFormular] = useState(null); // null | Startwerte
  const speichern = (nf) => {
    const neu = liste.some(x => x.id === nf.id) ? liste.map(x => x.id === nf.id ? nf : x) : [...liste, nf];
    onChange(neu);
    setFormular(null);
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900">Nachforderungen mit Ratenplan</h3>
          <p className="text-xs text-gray-500">Zum Beispiel eine Strom-Nachzahlung: du zahlst den Anbieter, deine Mieter zahlen mit einem Zuschlag zurück. Zählt nicht als Mieterhöhung.</p>
        </div>
        {!formular && (
          <button type="button" onClick={() => setFormular(leeresFormular(mieterNamen))} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5">
            <Plus size={14} /> Nachforderung anlegen
          </button>
        )}
      </div>
      {formular && <Formular key={formular.id || 'neu'} start={formular} mieterNamen={mieterNamen} onAbbrechen={() => setFormular(null)} onSpeichern={speichern} />}
      {liste.map(nf => (
        <Karte key={nf.id} nf={nf} liste={liste} onListe={onChange} onBearbeiten={() => setFormular(ausNachforderung(nf))} />
      ))}
    </div>
  );
}
