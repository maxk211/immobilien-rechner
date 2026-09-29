import { useState } from 'react';
import { TrendingUp, FileText, CalendarCheck } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';

// Mieter-Seite (UX-Paket Teil 1): Mietanpassungen als Tabelle alt → neu
// und der Kasten "Was du hier tun kannst" in der rechten Spalte.

export function MietanpassungenTabelle({ anpassungen = [], basisMiete = 0, onAdd }) {
  const [offen, setOffen] = useState(false);
  const [form, setForm] = useState({ datum: '', kaltmiete: '', grund: 'Mieterhöhung' });
  const sortiert = [...anpassungen].filter(a => a.kaltmiete != null && a.datum).sort((a, b) => new Date(a.datum) - new Date(b.datum));
  const zeilen = sortiert.map((a, i) => ({
    ...a,
    alt: i === 0 ? basisMiete : Number(sortiert[i - 1].kaltmiete) || 0,
    neu: Number(a.kaltmiete) || 0,
  })).reverse();

  const speichern = () => {
    const betrag = parseFloat(form.kaltmiete);
    if (!form.datum || !(betrag > 0)) return;
    onAdd({ datum: form.datum, kaltmiete: betrag, grund: form.grund });
    setForm({ datum: '', kaltmiete: '', grund: 'Mieterhöhung' });
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
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <label className="text-xs text-gray-500">Gültig ab
            <input type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })}
              className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base sm:text-sm" />
          </label>
          <label className="text-xs text-gray-500">Neue Kaltmiete
            <input type="number" min="0" step="1" value={form.kaltmiete} onChange={e => setForm({ ...form, kaltmiete: e.target.value })}
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
          <button onClick={speichern} disabled={!form.datum || !(parseFloat(form.kaltmiete) > 0)}
            className="px-3 py-2 text-sm font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40">
            Speichern
          </button>
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
