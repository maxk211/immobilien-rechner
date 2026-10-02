import { useMemo, useState } from 'react';
import { Trash2, Pencil, X } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { cashflowMonat } from '../utils/berechnung.js';
import { darlehensVerlauf } from '../utils/darlehen.js';
import { bausparStand, MINDEST_GUTHABEN } from '../utils/bauspar.js';
import ZahlInput from './ZahlInput';

// Eigener Reiter "Bauspar" unter Zahlen (UX-Gesamtpaket A.7, B16).
// Die Rollenfrage kommt VOR dem Anlegen: Tilgungsersatz und Rücklage gehören zum Objekt,
// Eigenkapital für den nächsten Kauf nicht — der würde den Cashflow dieser Wohnung verfälschen.

const ROLLEN = {
  tilgungsersatz: {
    titel: 'Tilgungsersatz für das Darlehen',
    text: 'Das Guthaben löst später die Restschuld ab. Die Sparrate zählt wie Tilgung — Vermögensaufbau, kein Verlust.',
  },
  ruecklage: {
    titel: 'Rücklage für Modernisierung',
    text: 'Zweckgebunden für dieses Objekt. Die Sparrate zählt als laufende Kosten, weil das Geld wieder ins Objekt fließt.',
  },
};
const eur = (v) => formatCurrency(Math.round(v || 0));
const sg = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatCurrency(Math.abs(Math.round(v || 0)))}`;
const mmjjjj = (d) => d ? d.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }) : '—';
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-xl text-base sm:text-sm bg-white';

function RollenKarten({ aktiv, onWaehle, mitPortfolio = true }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Object.entries(ROLLEN).map(([k, r]) => (
        <button key={k} type="button" onClick={() => onWaehle(k)}
          className={`text-left rounded-2xl border-2 p-4 transition-colors ${aktiv === k ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
          <div className="text-sm font-extrabold text-gray-900">{r.titel}</div>
          <div className="text-xs text-gray-600 mt-1">{r.text}</div>
          <div className="text-xs font-bold text-indigo-600 mt-3">{aktiv === k ? 'Gewählt ✓' : 'Hier anlegen →'}</div>
        </button>
      ))}
      {mitPortfolio && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-extrabold text-gray-500">Eigenkapital für den nächsten Kauf</div>
          <div className="text-xs text-gray-500 mt-1">Hat mit dieser Wohnung nichts zu tun und würde ihren Cashflow um die Sparrate verfälschen.</div>
          <div className="text-xs font-bold text-gray-400 mt-3">Gehört ins Portfolio — hier nicht anlegen</div>
        </div>
      )}
    </div>
  );
}

function VertragsFormular({ start, onSpeichern, onAbbrechen }) {
  const [v, setV] = useState(start);
  const [fehler, setFehler] = useState('');
  const set = (k, w) => setV(x => ({ ...x, [k]: w }));
  const speichern = () => {
    if (!(Number(v.bausparsumme) > 0) || !(Number(v.monatlicheSparrate) > 0) || !v.vertragSeit) {
      setFehler('Bitte Bausparsumme, Sparrate und „Vertrag läuft seit“ eintragen.'); return;
    }
    onSpeichern({ ...v, bausparsumme: Number(v.bausparsumme), monatlicheSparrate: Number(v.monatlicheSparrate) });
  };
  const feld = (label, k, opts = {}) => (
    <label className="block text-xs text-gray-500">{label}{opts.pflicht && <span className="text-indigo-600"> *</span>}
      {opts.typ === 'text' || opts.typ === 'date'
        ? <input type={opts.typ} className={`${inputCls} mt-1 ${opts.gelb ? 'border-amber-300 bg-amber-50' : ''}`} value={v[k] || ''} placeholder={opts.ph} onChange={e => set(k, e.target.value)} />
        : <ZahlInput min="0" step={opts.step || '1'} className={`${inputCls} mt-1`} value={v[k] ?? ''} placeholder={opts.ph} onChange={e => set(k, e.target.value === '' ? '' : Number(e.target.value))} />}
      {opts.hint && <span className="block text-[11px] text-gray-400 mt-0.5">{opts.hint}</span>}
    </label>
  );
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Die Vertragsdaten</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {feld('Bausparkasse', 'bausparkasse', { typ: 'text', ph: 'z. B. Schwäbisch Hall' })}
        {feld('Bausparsumme', 'bausparsumme', { pflicht: true, ph: '€', step: '1000' })}
        {feld('Sparrate pro Monat', 'monatlicheSparrate', { pflicht: true, ph: '€' })}
        {feld('Vertrag läuft seit', 'vertragSeit', { typ: 'date', pflicht: true })}
        {feld('Bisher angespart', 'aktuellerSparbetrag', { ph: 'wird berechnet', hint: 'Leer lassen — wir rechnen es aus der Sparrate.' })}
        {feld('Guthabenzins p. a.', 'guthabenzins', { ph: '%', step: '0.01' })}
        {feld('Zuteilung ab', 'zuteilungsreifAb', { typ: 'date', gelb: !v.zuteilungsreifAb, hint: 'Steht im Vertrag. Ohne Datum schätzen wir es.' })}
        {feld('Darlehenszins danach', 'darlehenszins', { ph: '%', step: '0.01' })}
        {feld('Vertragsnummer', 'vertragsnummer', { typ: 'text' })}
      </div>
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">Drei Pflichtfelder. Den Rest kannst du später nachtragen.</span>
        <div className="flex gap-2">
          <button type="button" onClick={onAbbrechen} className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100">Abbrechen</button>
          <button type="button" onClick={speichern} className="px-4 py-2 text-sm font-bold rounded-xl bg-gray-900 text-white hover:bg-gray-700">{start.id ? 'Speichern' : 'Vertrag anlegen'}</button>
        </div>
      </div>
    </div>
  );
}

function Vertrag({ v, immo, onAendern, onLoeschen }) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const st = bausparStand(v);
  const heute = new Date();
  const start = v.vertragSeit ? new Date(v.vertragSeit) : heute;
  const ende = st.zuteilung && st.laufzeitMonate ? new Date(st.zuteilung.getFullYear(), st.zuteilung.getMonth() + st.laufzeitMonate, 1) : (st.zuteilung ? new Date(st.zuteilung.getFullYear() + 10, 0, 1) : new Date(heute.getFullYear() + 10, 0, 1));
  const spanne = Math.max(1, ende - start);
  const pos = (d) => `${Math.min(100, Math.max(0, (d - start) / spanne * 100))}%`;

  // Wirkung der Rolle auf den Cashflow (Vorher-Nachher je Rolle)
  const cfMit = (rolle) => cashflowMonat({ ...immo, bausparvertraege: (immo.bausparvertraege || []).map(x => x.id === v.id ? { ...x, rolle } : x) });
  const jetzt = cfMit(v.rolle || 'ruecklage');

  if (bearbeiten) return <VertragsFormular start={v} onAbbrechen={() => setBearbeiten(false)} onSpeichern={(neu) => { onAendern(neu); setBearbeiten(false); }} />;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${st.aktiv ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{st.aktiv ? 'Bausparvertrag · Ansparphase' : 'Zuteilung erreicht'}</span>
          <span className="text-sm font-extrabold text-gray-900 truncate">{v.bausparkasse || 'Bausparvertrag'}</span>
          {v.vertragsnummer && <span className="text-xs text-gray-400">Nr. {v.vertragsnummer}</span>}
          {v.vertragSeit && <span className="text-xs text-gray-400">· seit {mmjjjj(start)}</span>}
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setBearbeiten(true)} className="px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-200 hover:border-indigo-300 flex items-center gap-1"><Pencil size={12} /> Konditionen bearbeiten</button>
          <button type="button" onClick={() => { if (confirm('Diesen Bausparvertrag löschen?')) onLoeschen(); }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600" title="Löschen"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-gray-100">
        {[
          ['Bausparsumme', eur(v.bausparsumme)],
          ['Sparrate', `${eur(v.monatlicheSparrate)}`],
          ['Guthabenzins', v.guthabenzins ? `${Number(v.guthabenzins).toLocaleString('de-DE')} %` : '—'],
          ['Zuteilung ab', `${mmjjjj(st.zuteilung)}${st.zuteilungGeschaetzt ? ' *' : ''}`],
          ['Darlehenszins danach', v.darlehenszins ? `${Number(v.darlehenszins).toLocaleString('de-DE')} %` : '—'],
        ].map(([l, w]) => (
          <div key={l} className="bg-white px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{l}</div>
            <div className="text-sm font-extrabold text-gray-900">{w}</div>
          </div>
        ))}
      </div>
      {!(Number(v.bausparsumme) > 0) && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-2">
          <span><strong>Bausparsumme fehlt.</strong> Ohne sie lassen sich Zuteilung und Bauspardarlehen nicht berechnen.</span>
          <button type="button" onClick={() => setBearbeiten(true)} className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-bold">Jetzt eintragen</button>
        </div>
      )}
      {st.zuteilungGeschaetzt && <p className="px-4 pt-2 text-[11px] text-gray-400">* Geschätzt: Zuteilung, sobald {Math.round(MINDEST_GUTHABEN * 100)} % der Bausparsumme angespart sind. Das echte Datum steht im Vertrag — unter „Konditionen bearbeiten“ eintragen.</p>}

      {/* Zeitstrahl über den ganzen Vertrag */}
      <div className="px-4 py-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">So läuft der Vertrag ab</p>
        {st.zuteilung && <p className="text-sm text-gray-700 mt-0.5 mb-3">Zuteilung {mmjjjj(st.zuteilung)} · Guthaben dann <strong>{eur(st.guthabenZuteilung)}</strong>{st.darlehen > 0 ? ` · Bauspardarlehen ${eur(st.darlehen)}${v.darlehenszins ? ` zu ${Number(v.darlehenszins).toLocaleString('de-DE')} %` : ''}` : ''}</p>}
        <div className="relative h-5 rounded-full bg-gray-100 overflow-hidden flex">
          <div className="h-full bg-emerald-600" style={{ width: pos(heute) }} title={`angespart ${eur(st.guthabenHeute)}`} />
          {st.zuteilung && st.zuteilung > heute && <div className="h-full bg-emerald-300" style={{ width: `calc(${pos(st.zuteilung)} - ${pos(heute)})` }} title="weiter sparen" />}
          {st.zuteilung && <div className="h-full bg-indigo-500" style={{ width: `calc(100% - ${pos(st.zuteilung > heute ? st.zuteilung : heute)})` }} title="Darlehensphase" />}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> angespart {eur(st.guthabenHeute)}</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-300 inline-block" /> weiter sparen</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Bauspardarlehen</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>{start.getFullYear()}</span><span>{st.zuteilung ? st.zuteilung.getFullYear() : ''}</span><span>{ende.getFullYear()}</span></div>
        <p className="text-xs text-gray-500 mt-2">Ab Zuteilung fällt die Sparrate weg und die Darlehensrate beginnt — renditly rechnet ab diesem Monat automatisch um.</p>
      </div>

      {/* Rolle — änderbar, mit Wirkung */}
      <div className="px-4 pb-4">
        <p className="text-sm font-bold text-gray-800">Wofür nutzt du den Vertrag?</p>
        <p className="text-xs text-gray-500 mb-3">Davon hängt ab, ob die Sparrate im Cashflow dieses Objekts als Kosten oder als Vermögensaufbau zählt.</p>
        {!v.rolle && <p className="text-xs font-semibold text-amber-700 mb-2">Noch nicht festgelegt — bis dahin zählt die Sparrate als Kosten.</p>}
        <RollenKarten aktiv={v.rolle} onWaehle={(rolle) => onAendern({ ...v, rolle })} />
        <div className="mt-3 rounded-2xl bg-ink text-white p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[['Cashflow vor Tilgung', jetzt.vor, v.rolle === 'tilgungsersatz' ? 'Sparrate zählt nicht als Kosten' : 'Sparrate zählt als Kosten'],
            ['Cashflow nach Tilgung', jetzt.nach, 'hier zählt sie immer mit'],
            ['Vermögensaufbau pro Monat', jetzt.vermoegensaufbau, `${eur(jetzt.tilgung)} Tilgung${jetzt.bausparTilgung > 0 ? ` + ${eur(jetzt.bausparTilgung)} Sparrate` : ''}`]].map(([l, w, s]) => (
            <div key={l}>
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">{l}</div>
              <div className={`text-lg font-extrabold ${l.startsWith('Verm') ? 'text-indigo-300' : w >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{l.startsWith('Verm') ? eur(w) : sg(w)}</div>
              <div className="text-[11px] text-white/50">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BausparReiter({ params, immobilie, onChange }) {
  const immo = useMemo(() => ({ ...immobilie, ...params }), [immobilie, params]);
  const vertraege = params.bausparvertraege || [];
  const [neu, setNeu] = useState(null); // null | { rolle }
  const speichere = (liste) => onChange(liste);
  const verlauf = useMemo(() => (immo.finanzierungsphasen?.length ? darlehensVerlauf(immo) : null), [immo]);
  const cf = cashflowMonat(immo);
  const guthaben = vertraege.reduce((s, v) => s + bausparStand(v).guthabenHeute, 0);
  const naechsteZuteilung = vertraege.map(v => bausparStand(v).zuteilung).filter(Boolean).sort((a, b) => a - b)[0];

  return (
    <div className="space-y-4">
      {vertraege.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Restschuld Darlehen', verlauf ? eur(verlauf.restschuldHeute) : '—', null],
            ['Bausparguthaben', eur(guthaben), 'angespart bis heute'],
            ['Monatlich gesamt', eur(cf.rate + cf.bauspar), `${eur(cf.rate)} Rate + ${eur(cf.bauspar)} Sparrate`],
            ['Zuteilung erwartet', naechsteZuteilung ? naechsteZuteilung.getFullYear() : '—', null],
          ].map(([l, w, s]) => (
            <div key={l} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{l}</div>
              <div className="text-xl font-black text-gray-900">{w}</div>
              {s && <div className="text-xs text-gray-400 mt-0.5">{s}</div>}
            </div>
          ))}
        </div>
      )}

      {vertraege.map(v => (
        <Vertrag key={v.id} v={v} immo={immo}
          onAendern={(x) => speichere(vertraege.map(y => y.id === v.id ? x : y))}
          onLoeschen={() => speichere(vertraege.filter(y => y.id !== v.id))} />
      ))}

      {(vertraege.length === 0 || neu) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
          {vertraege.length === 0 && (
            <div>
              <p className="text-base font-extrabold text-gray-900">Noch kein Bausparvertrag hinterlegt</p>
              <p className="text-sm text-gray-500 mt-1">Ein Bausparvertrag gehört nur dann hierher, wenn er mit diesem Objekt zu tun hat. Verträge, die du für einen späteren Kauf besparst, gehören nicht zu dieser Wohnung — sonst verzerren sie ihren Cashflow.</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Erste Frage: Wofür ist der Vertrag da?</p>
            {neu && vertraege.length > 0 && <button type="button" onClick={() => setNeu(null)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>}
          </div>
          <RollenKarten aktiv={neu?.rolle} onWaehle={(rolle) => setNeu({ rolle })} />
          <p className="text-[11px] text-gray-400">Die Wahl lässt sich später jederzeit ändern. Sie steuert nur, ob die Sparrate als Vermögensaufbau zählt wie die Tilgung, oder als Kosten wie das Hausgeld.</p>
          {neu?.rolle && (
            <VertragsFormular start={{ rolle: neu.rolle, bausparkasse: '', bausparsumme: '', monatlicheSparrate: '', vertragSeit: '', guthabenzins: '', zuteilungsreifAb: '', darlehenszins: '' }}
              onAbbrechen={() => setNeu(null)}
              onSpeichern={(v) => { speichere([...vertraege, { ...v, id: Date.now() }]); setNeu(null); }} />
          )}
        </div>
      )}
      {vertraege.length > 0 && !neu && (
        <button type="button" onClick={() => setNeu({})} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 text-sm font-semibold">+ Weiteren Bausparvertrag anlegen</button>
      )}
    </div>
  );
}
