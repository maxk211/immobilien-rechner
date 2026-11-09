import { useState } from 'react';
import { TrendingUp, FileText, CalendarCheck } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { kappungsgrenze } from '../utils/kappung.js';

// Mieter-Seite (UX-Paket Teil 1): Mietanpassungen als Tabelle alt → neu
// und der Kasten "Was du hier tun kannst" in der rechten Spalte.

export function MietanpassungenTabelle({ anpassungen = [], basisMiete = 0, onAdd, cfFuerMiete }) {
  const [offen, setOffen] = useState(false);
  const leer = { datum: '', kaltmiete: '', grund: 'Mieterhöhung', vorher: '', prozent: '' };
  const [form, setForm] = useState(leer);
  const [fehler, setFehler] = useState('');
  const sortiert = [...anpassungen].filter(a => a.kaltmiete != null && a.datum).sort((a, b) => new Date(a.datum) - new Date(b.datum));
  const zeilen = sortiert.map((a, i) => ({
    ...a,
    alt: i === 0 ? (a.vorher != null && a.vorher !== '' ? Number(a.vorher) : basisMiete) : Number(sortiert[i - 1].kaltmiete) || 0,
    neu: Number(a.kaltmiete) || 0,
  })).reverse();

  // Miete davor: bei der zeitlich ersten Anpassung kennt renditly sie nur als Ausgangsmiete —
  // wird eine frühere Erhöhung nachgetragen, steht die Ausgangsmiete meist schon auf dem neuen Wert.
  const zahlVon = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : null; };
  const vorgaenger = form.datum ? [...sortiert].reverse().find(a => new Date(a.datum) < new Date(form.datum)) : null;
  const istErste = !!form.datum && !vorgaenger;
  const alt = istErste ? (zahlVon(form.vorher) ?? basisMiete) : (Number(vorgaenger?.kaltmiete) || 0);
  const neuBetrag = zahlVon(form.kaltmiete) ?? (zahlVon(form.prozent) != null && alt > 0 ? Math.round(alt * (1 + zahlVon(form.prozent) / 100) * 100) / 100 : null);

  const speichern = () => {
    const fehlt = [!form.datum && 'gültig ab', !(neuBetrag > 0) && 'neue Kaltmiete oder %'].filter(Boolean);
    if (fehlt.length) { setFehler(`Bitte ausfüllen: ${fehlt.join(', ')}`); return; }
    const erhoehung = !/senk/i.test(form.grund);
    if (istErste && erhoehung && zahlVon(form.vorher) == null && !(basisMiete < neuBetrag)) {
      setFehler(`Wie hoch war die Miete vor dieser Erhöhung? Hinterlegt sind ${formatCurrency(basisMiete)} — ohne die Miete davor lässt sich die Kappungsgrenze nicht prüfen.`);
      return;
    }
    onAdd({ datum: form.datum, kaltmiete: neuBetrag, grund: form.grund, ...(istErste && zahlVon(form.vorher) != null ? { vorher: zahlVon(form.vorher) } : {}) });
    setForm(leer); setFehler('');
    setOffen(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-800">Mietanpassungen</p>
          <p className="text-xs text-gray-400">Grundlage für die Erinnerung im Cockpit — ohne Datum der letzten Erhöhung kann renditly nicht warnen.</p>
        </div>
        {onAdd && (
          <button onClick={() => setOffen(v => !v)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 shrink-0">
            {offen ? 'Abbrechen' : 'Anpassung eintragen'}
          </button>
        )}
      </div>
      {offen && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <label className="text-xs text-gray-500">Gültig ab
            <input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })}
              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm" />
          </label>
          {istErste && (
            <label className="text-xs text-gray-500">Miete davor
              <input type="text" inputMode="decimal" value={form.vorher} placeholder={`hinterlegt: ${basisMiete}`} onChange={e => setForm({ ...form, vorher: e.target.value })}
                className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm" />
            </label>
          )}
          <label className="text-xs text-gray-500">Neue Kaltmiete
            <input type="text" inputMode="decimal" value={form.kaltmiete} onChange={e => setForm({ ...form, kaltmiete: e.target.value, prozent: '' })}
              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm" />
          </label>
          <label className="text-xs text-gray-500">oder Erhöhung in %
            <input type="text" inputMode="decimal" value={form.prozent} onChange={e => setForm({ ...form, prozent: e.target.value, kaltmiete: '' })}
              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm" />
          </label>
          <label className="text-xs text-gray-500">Grund
            <select value={form.grund} onChange={e => setForm({ ...form, grund: e.target.value })}
              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm bg-white">
              <option>Mieterhöhung</option>
              <option>Mietspiegel</option>
              <option>Indexmiete</option>
              <option>Staffelmiete</option>
              <option>Modernisierung</option>
              <option>Neuvermietung</option>
              <option>Mietsenkung</option>
            </select>
          </label>
          <button onClick={speichern}
            className="px-3 py-2 text-sm font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-700">
            Speichern
          </button>
          {form.datum && neuBetrag > 0 && alt > 0 && (
            <p className="sm:col-span-4 text-[11px] text-gray-600">{formatCurrency(alt)} → {formatCurrency(neuBetrag)} ({neuBetrag >= alt ? '+' : ''}{((neuBetrag / alt - 1) * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} %)</p>
          )}
          {fehler && <p className="sm:col-span-4 text-[11px] text-red-600">{fehler}</p>}
        </div>
      )}
      {zeilen.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-400">
          Noch keine Anpassung erfasst. Trag die letzte Erhöhung nach, dann rechnet renditly Sperrfrist und Kappungsgrenze
          automatisch und meldet sich, sobald wieder etwas möglich ist.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wide text-gray-400 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Gültig ab</th>
                <th className="text-left px-4 py-2 font-semibold">Grund</th>
                <th className="text-right px-4 py-2 font-semibold">Alt</th>
                <th className="text-right px-4 py-2 font-semibold">Neu</th>
                {cfFuerMiete && <th className="text-right px-4 py-2 font-semibold">Cashflow ab dann</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zeilen.map((z, i) => {
                const diff = z.neu - z.alt;
                return (
                  <tr key={`${z.datum}-${i}`}>
                    <td className="px-4 py-2 text-gray-700">{new Date(z.datum).toLocaleDateString('de-DE')}</td>
                    <td className="px-4 py-2 text-gray-500">{z.grund || 'Mieterhöhung'}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{z.alt > 0 ? formatCurrency(z.alt) : '—'}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-800">
                      {formatCurrency(z.neu)}
                      {z.alt > 0 && diff !== 0 && (
                        <span className={`ml-1 text-[10px] ${diff > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {diff > 0 ? '+' : ''}{(diff / z.alt * 100).toFixed(1)} %
                        </span>
                      )}
                    </td>
                    {cfFuerMiete && (() => {
                      // A.5: was die Anpassung ab ihrem Stichtag mit dem Cashflow macht — alt durchgestrichen, neu fett
                      const a = cfFuerMiete(z.alt), b = cfFuerMiete(z.neu);
                      const f = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatCurrency(Math.abs(Math.round(v)))}`;
                      return (
                        <td className="px-4 py-2 text-right text-[11px] whitespace-nowrap">
                          <div><span className="text-gray-400">nach Tilgung </span><span className="line-through text-gray-400">{f(a.nach)}</span> <strong className={b.nach >= 0 ? 'text-emerald-700' : 'text-red-600'}>{f(b.nach)}</strong></div>
                          <div><span className="text-gray-400">vor Tilgung </span><span className="line-through text-gray-400">{f(a.vor)}</span> <strong className={b.vor >= 0 ? 'text-emerald-700' : 'text-red-600'}>{f(b.vor)}</strong></div>
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function WasDuHierTunKannst({ onMieterhoehung, onNebenkosten, onMieteingaenge }) {
  const eintraege = [
    onMieterhoehung && { label: 'Mieterhöhung berechnen und Schreiben erstellen', icon: <TrendingUp size={15} />, onClick: onMieterhoehung },
    onNebenkosten && { label: 'Nebenkosten abrechnen', icon: <FileText size={15} />, onClick: onNebenkosten },
    onMieteingaenge && { label: 'Mieteingänge ansehen', icon: <CalendarCheck size={15} />, onClick: onMieteingaenge },
  ].filter(Boolean);
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">Was du hier tun kannst</p>
      <div className="space-y-1.5">
        {eintraege.map(e => (
          <button key={e.label} onClick={e.onClick}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-700 text-left transition-colors">
            <span className="text-indigo-500">{e.icon}</span>{e.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Kappungsgrenze 15 % / 20 % — mit Vorschlag aus dem Ort (Landesverordnung), nie still gesetzt
export function KappungsgrenzeWahl({ immo, onChange }) {
  const g = kappungsgrenze(immo);
  const bis = g.ort ? new Date(g.ort.bis).toLocaleDateString('de-DE') : '';
  return (
    <div className="text-[11px] text-gray-600 space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold">Kappungsgrenze</span>
        {[20, 15].map(k => (
          <button key={k} type="button" onClick={() => onChange?.(k)}
            className={`px-2 py-0.5 rounded-md border font-bold ${g.prozent === k && g.quelle === 'eingestellt' ? 'bg-gray-900 text-white border-gray-900' : g.prozent === k ? 'border-amber-400 text-amber-800 bg-amber-50' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
            {k} %
          </button>
        ))}
        <span className="text-gray-400">in drei Jahren{k15Text(g)}</span>
      </div>
      {g.quelle === 'ort' && (
        <p className="text-amber-700">{g.ort.name}: 15 % per {g.ort.quelle} (bis {bis}). renditly rechnet vorsichtshalber mit 15 % — bitte bestätigen.</p>
      )}
      {g.quelle === 'eingestellt' && g.prozent === 20 && g.ort && (
        <p className="text-amber-700">Achtung: In {g.ort.name} gilt laut {g.ort.quelle} 15 % (bis {bis}).</p>
      )}
    </div>
  );
}
const k15Text = (g) => (g.prozent === 15 ? ' · angespannter Wohnungsmarkt' : '');
