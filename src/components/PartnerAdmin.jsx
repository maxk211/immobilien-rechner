import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { X, Search, Plus, QrCode, Trash2, ChevronDown, ChevronUp, Users, Handshake, Mail, Loader2, Download, Copy, Link2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { MAKLER_STATUS, PARTNER_URL } from '../config/partner';
import { initialen, markiere } from '../utils/partner';

// Admin-Seite Partner-Programm (nur Founder): Makler pflegen, Status, Zuordnungen, QR-Codes.
// Ziel: auch mit 200 Maklern übersichtlich — eine Suche (Anfangsbuchstaben), Status-Filter,
// Schnell-Anlage in einer Zeile, Details nur beim Aufklappen.

const leer = { name: '', firma: '', ort: '', status: 'angeschrieben' };
const datum = (d) => d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–';
const passt = (m, q) => {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return [m.name, m.firma, m.ort, m.email].filter(Boolean).some(f => f.toLowerCase().split(/\s+/).some(w => w.startsWith(t)) || f.toLowerCase().startsWith(t));
};
const codeVorschlag = (m) => {
  const basis = (m.firma || m.name || 'makler').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/immobilien|gmbh|makler|& co\.?|kg/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 10) || 'makler';
  return `${basis}${Math.random().toString(36).slice(2, 5)}`;
};

function Hl({ text, q }) {
  return markiere(text || '', q).map((t, i) => t.treffer ? <mark key={i} className="bg-amber-100 rounded px-0.5">{t.text}</mark> : <span key={i}>{t.text}</span>);
}

async function qrHerunterladen(url, dateiname, format = 'svg') {
  if (format === 'svg') {
    const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#14161c', light: '#ffffff' } });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = `${dateiname}.svg`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } else {
    const png = await QRCode.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#14161c', light: '#ffffff' } });
    const a = document.createElement('a'); a.href = png; a.download = `${dateiname}.png`; a.click();
  }
}

function QrVorschau({ url }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { QRCode.toDataURL(url, { width: 280, margin: 1, color: { dark: '#14161c', light: '#ffffff' } }).then(setSrc).catch(() => setSrc(null)); }, [url]);
  return src ? <img src={src} alt={`QR-Code für ${url}`} className="w-36 h-36 rounded-lg border border-gray-200 bg-white" /> : <div className="w-36 h-36 rounded-lg bg-gray-100" />;
}

function StatusAuswahl({ wert, onChange }) {
  const s = MAKLER_STATUS[wert] || MAKLER_STATUS.angeschrieben;
  return (
    <select value={wert} onChange={e => onChange(e.target.value)} onClick={e => e.stopPropagation()}
      className={`text-xs font-bold rounded-full border px-2.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${s.farbe}`}>
      {Object.entries(MAKLER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
    </select>
  );
}

function MaklerZeile({ m, q, stat, offen, toggle, speichern, loeschen }) {
  const [f, setF] = useState(m);
  useEffect(() => setF(m), [m]);
  const persoenlich = m.code ? `${PARTNER_URL}?m=${m.code}` : null;
  const feld = (k, label, typ = 'text') => (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</span>
      <input type={typ} value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })}
        onBlur={() => { if ((f[k] || '') !== (m[k] || '')) speichern(m.id, { [k]: f[k] || null }); }}
        className="mt-0.5 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
    </label>
  );
  return (
    <li className={`rounded-xl border bg-white ${offen ? 'border-indigo-200 shadow-sm' : 'border-gray-200'}`}>
      <div onClick={toggle} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
        <span className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">{initialen(m.firma || m.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-gray-900 truncate"><Hl text={m.name} q={q} /></div>
          <div className="text-xs text-gray-500 truncate">
            {m.firma && <Hl text={m.firma} q={q} />}{m.firma && m.ort && ' · '}{m.ort && <Hl text={m.ort} q={q} />}
            {!m.firma && !m.ort && <span className="text-gray-300">ohne Firma/Ort</span>}
          </div>
        </div>
        <div className="hidden sm:block text-right w-24">
          <div className="text-sm font-extrabold text-gray-900 tabular-nums">{stat?.registrierungen || 0}</div>
          <div className="text-[10px] text-gray-400">{stat?.zahlend ? `${stat.zahlend} zahlend` : 'Registrierungen'}</div>
        </div>
        <StatusAuswahl wert={m.status} onChange={(s) => speichern(m.id, { status: s })} />
        {offen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
      {offen && (
        <div className="border-t border-gray-100 px-3 py-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {feld('name', 'Ansprechpartner')}
            {feld('firma', 'Firma')}
            {feld('ort', 'Ort')}
            {feld('email', 'E-Mail', 'email')}
            {feld('telefon', 'Telefon', 'tel')}
            {feld('code', 'Kurzcode (persönlicher QR)')}
            <label className="block sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Notiz</span>
              <textarea rows={2} value={f.notiz || ''} onChange={e => setF({ ...f, notiz: e.target.value })}
                onBlur={() => { if ((f.notiz || '') !== (m.notiz || '')) speichern(m.id, { notiz: f.notiz || null }); }}
                placeholder="z. B. angeschrieben am …, Rückruf vereinbart"
                className="mt-0.5 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </label>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span>Angelegt {datum(m.created_at)}</span>
              {stat?.letzte && <span>· letzte Registrierung {datum(stat.letzte)}</span>}
              {m.email && <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-indigo-600 font-semibold"><Mail size={12} /> Mail schreiben</a>}
              <button onClick={() => loeschen(m)} className="ml-auto inline-flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold"><Trash2 size={12} /> Löschen</button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 md:w-44">
            {persoenlich ? (<>
              <QrVorschau url={persoenlich} />
              <div className="flex gap-1.5">
                <button onClick={() => qrHerunterladen(persoenlich, `renditly-qr-${m.code}`, 'svg')} className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 hover:border-indigo-300">SVG</button>
                <button onClick={() => qrHerunterladen(persoenlich, `renditly-qr-${m.code}`, 'png')} className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 hover:border-indigo-300">PNG</button>
                <button onClick={() => { navigator.clipboard?.writeText(persoenlich); toast.success('Link kopiert'); }} className="px-2 py-1 rounded-lg border border-gray-200 text-gray-700 hover:border-indigo-300" aria-label="Link kopieren"><Copy size={12} /></button>
              </div>
              <p className="text-[10px] text-gray-400 text-center leading-snug">Wählt den Makler automatisch vor{m.status !== 'aufgenommen' && ' — greift erst bei Status „Aufgenommen“'}.</p>
            </>) : (
              <button onClick={() => speichern(m.id, { code: codeVorschlag(m) })}
                className="w-full rounded-xl border border-dashed border-gray-300 px-3 py-4 text-xs font-semibold text-gray-500 hover:border-indigo-300 hover:text-indigo-700 flex flex-col items-center gap-1.5">
                <QrCode size={20} /> Persönlichen QR-Code erzeugen
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function PartnerAdmin({ onClose }) {
  const [makler, setMakler] = useState([]);
  const [zuordnungen, setZuordnungen] = useState([]);
  const [stats, setStats] = useState({});
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('alle');
  const [neu, setNeu] = useState(leer);
  const [offenId, setOffenId] = useState(null);
  const [ansicht, setAnsicht] = useState('makler'); // 'makler' | 'registrierungen'

  const laden = async () => {
    setLaedt(true);
    const [m, z, s] = await Promise.all([
      supabase.from('makler').select('*').order('name'),
      supabase.from('partner_zuordnungen').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.rpc('partner_statistik'),
    ]);
    if (m.error) setFehler(m.error.message);
    else {
      setFehler(null);
      setMakler(m.data || []);
      setZuordnungen(z.data || []);
      setStats(Object.fromEntries((s.data || []).map(r => [r.makler_id, r])));
    }
    setLaedt(false);
  };
  useEffect(() => { laden(); }, []);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const speichern = async (id, aenderung) => {
    setMakler(l => l.map(m => m.id === id ? { ...m, ...aenderung } : m));
    const { error } = await supabase.from('makler').update(aenderung).eq('id', id);
    if (error) { toast.error(/duplicate|unique/i.test(error.message) ? 'Diesen Kurzcode gibt es schon.' : 'Speichern fehlgeschlagen'); laden(); }
  };

  const anlegen = async (e) => {
    e?.preventDefault();
    if (!neu.name.trim()) return;
    const doppelt = makler.find(m => m.name.trim().toLowerCase() === neu.name.trim().toLowerCase() && (m.firma || '').toLowerCase() === neu.firma.trim().toLowerCase());
    if (doppelt) { toast.error('Diesen Makler gibt es schon.'); setOffenId(doppelt.id); return; }
    const { data, error } = await supabase.from('makler')
      .insert({ name: neu.name.trim(), firma: neu.firma.trim() || null, ort: neu.ort.trim() || null, status: neu.status }).select().single();
    if (error) { toast.error('Anlegen fehlgeschlagen'); return; }
    setMakler(l => [...l, data].sort((a, b) => a.name.localeCompare(b.name, 'de')));
    setNeu({ ...leer, status: neu.status });
    toast.success(`${data.name} angelegt`);
  };

  const loeschen = async (m) => {
    if (!window.confirm(`${m.name} wirklich löschen? Bestehende Registrierungen bleiben erhalten, verlieren aber die Zuordnung.`)) return;
    const { error } = await supabase.from('makler').delete().eq('id', m.id);
    if (error) { toast.error('Löschen fehlgeschlagen'); return; }
    setMakler(l => l.filter(x => x.id !== m.id));
  };

  const zuordnungSetzen = async (z, maklerId) => {
    const { error } = await supabase.from('partner_zuordnungen').update({ makler_id: maklerId || null }).eq('id', z.id);
    if (error) { toast.error('Zuordnen fehlgeschlagen'); return; }
    toast.success('Zugeordnet');
    laden();
  };

  const zaehler = useMemo(() => {
    const c = { alle: makler.length, angeschrieben: 0, aufgenommen: 0, pausiert: 0 };
    makler.forEach(m => { c[m.status] = (c[m.status] || 0) + 1; });
    return c;
  }, [makler]);
  const liste = useMemo(() => makler.filter(m => (filter === 'alle' || m.status === filter) && passt(m, q)), [makler, filter, q]);
  const maklerName = (id) => { const m = makler.find(x => x.id === id); return m ? [m.name, m.firma].filter(Boolean).join(' · ') : null; };
  const offeneFreitexte = zuordnungen.filter(z => !z.makler_id && z.makler_freitext).length;
  const letzte30 = zuordnungen.filter(z => Date.now() - new Date(z.created_at) < 30 * 864e5).length;

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 overflow-y-auto font-app" role="dialog" aria-label="Partner-Programm">
      <div className="sticky top-0 z-10 bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Handshake size={20} className="text-indigo-300" />
          <h1 className="font-extrabold">Partner-Programm</h1>
          <span className="text-xs text-white/50 hidden sm:inline">nur für das renditly-Team sichtbar</span>
          <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-white/10" aria-label="Schließen"><X size={18} /></button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {fehler ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <strong>Die Partner-Tabellen sind noch nicht da.</strong> Die Datenbank-Migration <code>013_partner_makler.sql</code> läuft beim nächsten Push automatisch (GitHub-Action „Supabase deploy“).
            <div className="text-xs text-amber-700/80 mt-1">Technisch: {fehler}</div>
          </div>
        ) : (<>
          {/* Kennzahlen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Aufgenommen', w: zaehler.aufgenommen, s: `${zaehler.angeschrieben} angeschrieben` },
              { l: 'Registrierungen', w: zuordnungen.length, s: `${letzte30} in den letzten 30 Tagen` },
              { l: 'Zahlende Nutzer', w: Object.values(stats).reduce((a, s) => a + Number(s.zahlend || 0), 0), s: 'über Partner gekommen' },
              { l: 'Ohne Zuordnung', w: offeneFreitexte, s: 'Makler nicht in der Liste', warn: offeneFreitexte > 0 },
            ].map(k => (
              <div key={k.l} className={`rounded-xl border bg-white px-4 py-3 ${k.warn ? 'border-amber-300' : 'border-gray-200'}`}>
                <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{k.l}</div>
                <div className="text-2xl font-black text-gray-900 tabular-nums mt-0.5">{laedt ? '–' : k.w}</div>
                <div className="text-xs text-gray-500">{k.s}</div>
              </div>
            ))}
          </div>

          {/* QR-Code für alle Visitenkarten */}
          <div className="mt-4 rounded-2xl bg-white border border-gray-200 p-4 flex flex-col sm:flex-row items-center gap-4">
            <QrVorschau url={PARTNER_URL} />
            <div className="flex-1 text-center sm:text-left">
              <div className="font-extrabold text-gray-900">QR-Code für alle Visitenkarten</div>
              <p className="text-sm text-gray-500 mt-0.5">Führt auf <span className="font-semibold text-gray-700">renditly.de/partner</span>. Dort wählt der Kunde seinen Makler selbst aus — ein Code reicht für alle Karten.</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <button onClick={() => qrHerunterladen(PARTNER_URL, 'renditly-partner-qr', 'svg')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500"><Download size={15} /> SVG für die Druckerei</button>
                <button onClick={() => qrHerunterladen(PARTNER_URL, 'renditly-partner-qr', 'png')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-indigo-300"><Download size={15} /> PNG</button>
                <a href="/partner" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-indigo-300"><Link2 size={15} /> Seite ansehen</a>
              </div>
            </div>
          </div>

          {/* Umschalter */}
          <div className="mt-6 flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[['makler', `Makler (${makler.length})`], ['registrierungen', `Registrierungen (${zuordnungen.length})`]].map(([k, l]) => (
              <button key={k} onClick={() => setAnsicht(k)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${ansicht === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{l}</button>
            ))}
          </div>

          {ansicht === 'makler' ? (<>
            {/* Schnell anlegen */}
            <form onSubmit={anlegen} className="mt-4 rounded-xl bg-white border border-gray-200 p-3 grid grid-cols-2 md:grid-cols-[1.3fr_1.3fr_1fr_auto_auto] gap-2">
              <input value={neu.name} onChange={e => setNeu({ ...neu, name: e.target.value })} placeholder="Name *" aria-label="Name"
                className="col-span-2 md:col-span-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <input value={neu.firma} onChange={e => setNeu({ ...neu, firma: e.target.value })} placeholder="Firma" aria-label="Firma"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <input value={neu.ort} onChange={e => setNeu({ ...neu, ort: e.target.value })} placeholder="Ort" aria-label="Ort"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <select value={neu.status} onChange={e => setNeu({ ...neu, status: e.target.value })} aria-label="Status"
                className="rounded-lg border border-gray-200 px-2 py-2 text-sm">
                {Object.entries(MAKLER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button type="submit" disabled={!neu.name.trim()} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold disabled:opacity-40"><Plus size={15} /> Anlegen</button>
            </form>

            {/* Suche + Filter */}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Suchen — Anfangsbuchstaben von Name, Firma oder Ort"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto">
                {['alle', 'aufgenommen', 'angeschrieben', 'pausiert'].map(k => (
                  <button key={k} onClick={() => setFilter(k)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${filter === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {k === 'alle' ? 'Alle' : MAKLER_STATUS[k].label} <span className="opacity-60">{zaehler[k] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Nur Makler mit Status <strong>Aufgenommen</strong> erscheinen in der Auswahl auf der Partner-Seite.</p>

            <ul className="mt-3 space-y-2">
              {laedt && <li className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center"><Loader2 size={16} className="animate-spin" /> Lädt…</li>}
              {!laedt && liste.map(m => (
                <MaklerZeile key={m.id} m={m} q={q} stat={stats[m.id]} offen={offenId === m.id}
                  toggle={() => setOffenId(offenId === m.id ? null : m.id)} speichern={speichern} loeschen={loeschen} />
              ))}
              {!laedt && liste.length === 0 && (
                <li className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                  {makler.length === 0 ? 'Noch keine Makler. Leg oben den ersten an.' : 'Keine Treffer.'}
                </li>
              )}
            </ul>
          </>) : (
            <div className="mt-4 rounded-xl bg-white border border-gray-200 overflow-hidden">
              {zuordnungen.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500"><Users size={22} className="mx-auto mb-2 text-gray-300" />Noch keine Registrierungen über die Partner-Seite.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
                    <tr><th className="text-left px-3 py-2">Datum</th><th className="text-left px-3 py-2">Nutzer</th><th className="text-left px-3 py-2">Makler</th></tr>
                  </thead>
                  <tbody>
                    {zuordnungen.map(z => (
                      <tr key={z.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{datum(z.created_at)}</td>
                        <td className="px-3 py-2 text-gray-800 break-all">{z.email || '–'}</td>
                        <td className="px-3 py-2">
                          {z.makler_id ? <span className="font-semibold text-gray-800">{maklerName(z.makler_id) || 'gelöschter Makler'}</span> : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span className="text-amber-700 text-xs font-semibold bg-amber-50 rounded px-1.5 py-0.5 w-fit">„{z.makler_freitext}“</span>
                              <select defaultValue="" onChange={e => e.target.value && zuordnungSetzen(z, e.target.value)}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-xs">
                                <option value="">zuordnen …</option>
                                {makler.map(m => <option key={m.id} value={m.id}>{[m.name, m.firma].filter(Boolean).join(' · ')}</option>)}
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
