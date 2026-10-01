import { useState, useMemo } from 'react';
import { MoreHorizontal, X, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Landmark } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { darlehensVerlauf, mitSondertilgung, anschlussRate, phasenZins } from '../utils/darlehen.js';
import { beleihbarFrei, getBeleihungsgrenze } from '../utils/kapital.js';
import ZahlInput from './ZahlInput';
import SchaetzInfo, { SchaetzZeile, beleihbarFreiInfo, zinsbindungInfo, restschuldZbInfo } from './SchaetzInfo';

// Finanzierungs-Reiter (UX-Paket Teil 3, Abschnitte 5–7):
// Kopfleiste · Phasen-Zeitstrahl · abgeschlossene Phasen eingeklappt · aktive Phase mit
// Tilgungsverlauf · Anschluss-Szenarien · Sondertilgungs-Rechner · "Konditionen bearbeiten"
// (Panel mit Vorher/Nachher) · "Darlehen abschließen".

const TYP_LABEL = { annuitaet: 'Annuität', tilgung: 'Tilgungsdarlehen', endfaellig: 'Endfällig', bauspardarlehen: 'Bauspardarlehen', kfw: 'KfW-Darlehen' };
const mmjjjj = (d) => d ? d.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }) : '—';
const ttmmjjjj = (d) => d ? d.toLocaleDateString('de-DE') : '—';
const iso = (d) => d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '';
const monateZwischen = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
const pct = (v, n = 2) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n })} %`;

// Jahre zwischen Start und Datum — hält die jahresbasierten Felder (zinsbindung/laufzeit) konsistent
const jahreBis = (start, datum) => Math.max(1, Math.round((new Date(datum) - new Date(start)) / (1000 * 60 * 60 * 24 * 365.25)));

function Kachel({ label, wert, sub, ton }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-black ${ton || 'text-gray-900'}`}>{wert}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function FinanzierungsReiter({ params, updateParams, marktwert, cashflowNachTilgung = 0 }) {
  const heute = new Date();
  const v = useMemo(() => darlehensVerlauf(params, heute), [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const [panelIdx, setPanelIdx] = useState(null);
  const [abschlussIdx, setAbschlussIdx] = useState(null);
  const [menuOffen, setMenuOffen] = useState(false);
  const [offeneHistorie, setOffeneHistorie] = useState({});
  const [sonderBetrag, setSonderBetrag] = useState(null); // B8: null = vorbelegt mit 5 % des Darlehens bzw. dem erlaubten Betrag
  const [mittelZins, setMittelZins] = useState(null);
  if (!v) return null;

  const phasen = params.finanzierungsphasen || [];
  const aktiv = v.phasen[v.aktivIdx];
  const letzteIdx = v.phasen.length - 1;
  const aktivIstLetzte = v.aktivIdx === letzteIdx;
  const grenze = getBeleihungsgrenze();
  const rsHeute = v.restschuldHeute;
  const auslauf = marktwert > 0 ? (rsHeute / marktwert) * 100 : null;
  const monateBisZb = aktiv.ende ? monateZwischen(heute, aktiv.ende) : null;
  const zbRot = aktivIstLetzte && monateBisZb != null && monateBisZb < 24 && !v.abbezahltHeute;
  const abbezahlt = v.abbezahltHeute;
  // Plausibilität (Teil 3, 8): Widerspruch → abhängige Werte aussetzen statt falsch zu rechnen
  const zbWiderspruch = !!(aktiv.ende && aktiv.start && aktiv.ende.getTime() <= aktiv.start.getTime() + 36 * 3600 * 1000);

  const setPhasen = (neu, extra = {}) => updateParams({ ...params, ...extra, finanzierungsphasen: neu, zinssatz: neu[0]?.sollzinssatz ?? params.zinssatz });

  // ── Zeitstrahl über alle Phasen ────────────────────────────────────────────
  const tStart = v.phasen[0].start;
  const tEnde = v.schuldenfrei || (v.phasen[letzteIdx].ende || heute);
  const spanne = Math.max(1, monateZwischen(tStart, tEnde));
  const anteil = (a, b) => Math.max(0, Math.min(100, (monateZwischen(a, b) / spanne) * 100));

  return (
    <div className="space-y-4">
      {/* Kopfleiste — Teil 3, 5.1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kachel label="Beleihungsauslauf" wert={auslauf != null ? `${Math.round(auslauf)} %` : '—'} sub={marktwert > 0 ? `von ${formatCurrency(marktwert)} Marktwert` : 'Marktwert fehlt'} />
        <Kachel label="Restschuld heute" wert={formatCurrency(rsHeute)} sub="berechnet, nicht gefragt" />
        <Kachel label="Monatsrate" wert={formatCurrency(v.rateHeute)} sub={abbezahlt ? 'Darlehen abbezahlt' : `${formatCurrency(v.zinsHeute)} Zins · ${formatCurrency(v.tilgungHeute)} Tilgung`} />
        <Kachel label={abbezahlt ? 'Status' : 'Zinsbindung endet'}
          wert={abbezahlt ? 'schuldenfrei' : `${mmjjjj(aktiv.ende)}${aktiv.endeGeschaetzt ? '*' : ''}`}
          ton={abbezahlt ? 'text-emerald-600' : zbRot ? 'text-red-600' : undefined}
          sub={abbezahlt ? null : monateBisZb != null ? (monateBisZb >= 0 ? `in ${monateBisZb} Monaten` : 'abgelaufen') + (aktiv.endeGeschaetzt ? ' · *ungeprüft' : '') : null} />
        <div className="col-span-2 lg:col-span-1 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1 flex items-center">Beleihbar frei
            <SchaetzInfo ausrichtung="rechts" {...beleihbarFreiInfo({ grenze, marktwert, restschuld: rsHeute, onGrenze: () => window.dispatchEvent(new Event('renditly-beleihungsgrenze-dialog')) })} />
          </div>
          <div className="text-xl font-black text-emerald-700">{formatCurrency(beleihbarFrei(marktwert, rsHeute, grenze))}</div>
          <SchaetzZeile className="text-emerald-700/70">Schätzung bei {grenze} % — so viel würde eine Bank ungefähr noch geben</SchaetzZeile>
        </div>
      </div>

      {/* Teil 3, 9: Der Abschluss-Dialog wird automatisch vorgeschlagen, sobald die Zinsbindung ausläuft */}
      {!abbezahlt && aktivIstLetzte && aktiv.ende && monateBisZb != null && monateBisZb < 1 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-red-800">
            <strong>Die Zinsbindung {monateBisZb < 0 ? `ist am ${ttmmjjjj(aktiv.ende)} ausgelaufen` : `läuft am ${ttmmjjjj(aktiv.ende)} aus`}.</strong> Wie geht es mit dem Darlehen weiter — abbezahlt oder Anschlussfinanzierung?
          </div>
          <button onClick={() => setAbschlussIdx(aktiv.idx)} className="px-3 py-2 text-sm font-bold rounded-xl bg-gray-900 text-white hover:bg-gray-700 shrink-0">Jetzt festlegen</button>
        </div>
      )}

      {/* Phasen-Zeitstrahl — nur bei mehreren Phasen */}
      {v.phasen.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Deine Finanzierung über die Zeit</p>
          <div className="relative h-7 rounded-full bg-gray-100 overflow-hidden flex">
            {v.phasen.map(p => {
              const ende = p.idx < letzteIdx ? v.phasen[p.idx + 1].start : tEnde;
              return (
                <div key={p.idx} style={{ width: `${anteil(p.start, ende)}%` }}
                  className={`h-full border-r-2 border-white flex items-center px-2 text-[10px] font-bold truncate ${
                    p.idx < v.aktivIdx ? 'bg-gray-300 text-gray-600' : p.idx === v.aktivIdx ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
                  title={`Phase ${p.idx + 1}`}>
                  Phase {p.idx + 1}{p.phase.kreditinstitut ? ` · ${p.phase.kreditinstitut}` : ''}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{tStart.getFullYear()}</span>
            {v.phasen.slice(1).map(p => <span key={p.idx}>Umschuldung {mmjjjj(p.start)} · {formatCurrency(p.startbetrag)}</span>)}
            <span>{tEnde.getFullYear()}</span>
          </div>
        </div>
      )}

      {/* Abgeschlossene Phasen: eine graue Zeile, aufklappbar */}
      {v.phasen.filter(p => p.idx < v.aktivIdx).map(p => (
        <div key={p.idx} className="bg-gray-50 border border-gray-200 rounded-2xl">
          <button onClick={() => setOffeneHistorie(o => ({ ...o, [p.idx]: !o[p.idx] }))}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Phase {p.idx + 1} · abgeschlossen</div>
              <div className="text-sm font-semibold text-gray-600 truncate">
                {p.phase.kreditinstitut || TYP_LABEL[p.typ] || 'Darlehen'} · {mmjjjj(p.start)} bis {mmjjjj(v.phasen[p.idx + 1]?.start || p.abbezahlt)} · {pct(p.sollzins)}
              </div>
              <div className="text-xs text-gray-400">
                {formatCurrency(p.zinsenGesamt)} Zinsen gezahlt · {formatCurrency(p.tilgungGesamt)} getilgt{p.restschuldAmEnde > 0 ? ` · abgelöst mit ${formatCurrency(p.restschuldAmEnde)}` : ''}
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500 shrink-0 flex items-center gap-1">{offeneHistorie[p.idx] ? <>Zuklappen <ChevronUp size={14}/></> : <>Aufklappen <ChevronDown size={14}/></>}</span>
          </button>
          {offeneHistorie[p.idx] && (
            <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
              <div>Startbetrag<br/><strong className="text-gray-700">{formatCurrency(p.startbetrag)}</strong></div>
              <div>Rate<br/><strong className="text-gray-700">{formatCurrency(p.rate)}</strong></div>
              <div>Anfangstilgung<br/><strong className="text-gray-700">{pct(p.anfangstilgung)}</strong></div>
              <div><button onClick={() => setPanelIdx(p.idx)} className="text-indigo-600 font-semibold hover:underline">Konditionen ansehen</button></div>
            </div>
          )}
        </div>
      ))}

      {/* Aktive Phase */}
      <div className="bg-white border-2 border-indigo-300 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">{phasen.length > 1 ? `Phase ${aktiv.idx + 1}` : 'Darlehen 1'}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${abbezahlt ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{abbezahlt ? 'abbezahlt' : 'läuft'}</span>
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">{aktiv.phase.kreditinstitut || 'Bank nicht hinterlegt'} · {TYP_LABEL[aktiv.phase.darlehensTyp] || 'Annuität'}</div>
            <div className="text-xs text-gray-400">{aktiv.phase.darlehensnummer ? `Nr. ${aktiv.phase.darlehensnummer} · ` : ''}seit {mmjjjj(aktiv.start)}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 relative">
            <button onClick={() => setPanelIdx(aktiv.idx)} className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700">Konditionen bearbeiten</button>
            <button onClick={() => setMenuOffen(o => !o)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50" aria-label="Weitere Aktionen"><MoreHorizontal size={16}/></button>
            {menuOffen && (
              <div className="absolute right-0 top-9 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
                <button onClick={() => { setAbschlussIdx(aktiv.idx); setMenuOffen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Darlehen abschließen</button>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          <div><div className="text-[10px] text-gray-400">{aktiv.idx > 0 ? 'Startbetrag' : 'Darlehen'}</div><div className="font-bold text-gray-800">{formatCurrency(aktiv.startbetrag)}</div></div>
          <div><div className="text-[10px] text-gray-400">Sollzins</div><div className="font-bold text-gray-800">{pct(aktiv.sollzins)}</div></div>
          <div><div className="text-[10px] text-gray-400">Anfangstilgung</div><div className="font-bold text-gray-800">{aktiv.typ === 'endfaellig' ? '—' : pct(aktiv.anfangstilgung)}</div></div>
          <div><div className="text-[10px] text-gray-400">Zinsbindung bis</div><div className={`font-bold ${aktiv.endeGeschaetzt ? 'text-amber-600' : 'text-gray-800'}`}>{ttmmjjjj(aktiv.ende)}{aktiv.endeGeschaetzt ? ' *' : ''}</div></div>
          <div><div className="text-[10px] text-gray-400">Sondertilgung</div><div className="font-bold text-gray-800">{aktiv.phase.sondertilgungErlaubtProzent ? `${aktiv.phase.sondertilgungErlaubtProzent} % p. a.` : '—'}</div></div>
        </div>
        {aktiv.endeGeschaetzt && (
          <p className="px-4 pb-2 text-[11px] text-amber-700">* Zinsbindungsende ist geschätzt. Unter „Konditionen bearbeiten“ das Datum aus dem Kreditvertrag eintragen — daran hängt deine Erinnerung.</p>
        )}

        {/* So läuft dein Kredit ab */}
        {zbWiderspruch && (
          <div className="px-4 py-3 border-t border-red-100 bg-red-50 text-sm text-red-800 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5"/>
            <span>Restschuld zum Zinsbindungsende nicht berechenbar: Die Zinsbindung ({ttmmjjjj(aktiv.ende)}) endet vor dem Kreditstart ({ttmmjjjj(aktiv.start)}). Unter „Konditionen bearbeiten“ korrigieren.</span>
          </div>
        )}
        {!abbezahlt && !zbWiderspruch && aktiv.ende && (() => {
          const pEnde = aktiv.idx === letzteIdx ? (v.schuldenfrei || aktiv.ende) : v.phasen[aktiv.idx + 1].start;
          const span = Math.max(1, monateZwischen(aktiv.start, pEnde));
          const w = (a, b) => Math.max(0, Math.min(100, (monateZwischen(a, b) / span) * 100));
          const getilgtBisHeute = Math.max(0, aktiv.startbetrag - rsHeute);
          const nullBeiZb = aktiv.restschuldBeiZinsbindung < 1;
          return (
            <div className="px-4 py-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">So läuft dein Kredit ab</p>
              <p className="text-sm text-gray-700 mt-0.5 mb-3">
                Zinsbindung endet {mmjjjj(aktiv.ende)}{aktiv.endeGeschaetzt && <SchaetzInfo {...zinsbindungInfo({ jahre: aktiv.phase.zinsbindung || 10 })} />} · Restschuld dann <strong>{formatCurrency(aktiv.restschuldBeiZinsbindung)}</strong>
                <SchaetzInfo {...restschuldZbInfo()} />
              </p>
              <div className="relative h-5 rounded-full bg-gray-100 overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${w(aktiv.start, heute)}%` }} title={`getilgt ${formatCurrency(getilgtBisHeute)}`} />
                <div className="h-full bg-indigo-500" style={{ width: `${Math.max(0, w(aktiv.start, aktiv.ende) - w(aktiv.start, heute))}%` }} title={`Zinsbindung · ${pct(aktiv.sollzins)} fest`} />
                <div className="h-full bg-indigo-100 flex-1" />
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500" style={{ left: `${w(aktiv.start, aktiv.ende)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{aktiv.start.getFullYear()} · getilgt {formatCurrency(getilgtBisHeute)}</span>
                <span className="text-indigo-600">Zinsbindung · {pct(aktiv.sollzins)} fest bis {aktiv.ende.getFullYear()}</span>
                <span>{nullBeiZb ? 'schuldenfrei ' + aktiv.ende.getFullYear() : aktiv.idx === letzteIdx && v.schuldenfrei ? `danach unbekannter Zins bis ca. ${v.schuldenfrei.getFullYear()}` : ''}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Gezahlte Zinsen bis zum Zinsbindungsende: <strong>{formatCurrency(aktiv.zinsenBisZinsbindung)}</strong> · getilgt <strong>{formatCurrency(aktiv.tilgungBisZinsbindung)}</strong>
              </p>
              {nullBeiZb && (
                <p className="mt-2 text-sm text-emerald-700 flex items-start gap-1.5"><CheckCircle2 size={15} className="shrink-0 mt-0.5"/> Bei dieser Tilgung ist das Darlehen zum Ende der Zinsbindung abbezahlt. Ein Anschlusszins-Risiko hast du hier nicht.</p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Anschluss-Szenarien — Teil 3, 5.4 */}
      {!abbezahlt && !zbWiderspruch && aktivIstLetzte && aktiv.ende && aktiv.restschuldBeiZinsbindung >= 1 && aktiv.typ !== 'endfaellig' && (() => {
        const rs = aktiv.restschuldBeiZinsbindung;
        const tilg = Math.round((aktiv.anfangstilgung || 2) * 100) / 100;
        const mittel = mittelZins ?? Math.round(aktiv.sollzins * 10) / 10;
        const szen = [
          { label: 'Zins fällt auf', zins: 3 },
          { label: 'Zins bleibt bei', zins: mittel, editierbar: true },
          { label: 'Zins steigt auf', zins: 6 },
        ].map(s => {
          const rate = anschlussRate(rs, s.zins, tilg);
          return { ...s, rate, cf: cashflowNachTilgung + aktiv.rate - rate };
        });
        const schlechtester = Math.min(...szen.map(s => s.cf));
        const forwardAb = new Date(aktiv.ende.getFullYear(), aktiv.ende.getMonth() - 60, 1);
        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-800">Was passiert {aktiv.ende.getFullYear()}, wenn du neu verhandeln musst?</p>
            <p className="text-xs text-gray-500 mb-3">Restschuld dann {formatCurrency(rs)}, Tilgung bleibt bei {pct(tilg)}. Die Zahlen zeigen deine neue Rate und was das mit dem Cashflow macht.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {szen.map(s => (
                <div key={s.label} className={`rounded-xl border p-3 ${s.editierbar ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200'}`}>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    {s.label}{' '}
                    {s.editierbar ? (
                      <ZahlInput type="number" step="0.1" min="0" value={mittel}
                        onChange={e => setMittelZins(parseFloat(e.target.value) || 0)}
                        className="w-16 px-1 py-0.5 border border-indigo-200 rounded text-right text-base sm:text-xs bg-white" />
                    ) : <strong>{pct(s.zins, 1)}</strong>}
                    {s.editierbar && ' %'}
                  </div>
                  <div className="text-xl font-black text-gray-900 mt-1">{formatCurrency(s.rate)}</div>
                  <div className="text-[10px] text-gray-400">neue Monatsrate</div>
                  <div className={`text-sm font-bold mt-1 ${s.cf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cashflow {s.cf >= 0 ? '+' : ''}{formatCurrency(s.cf)}/Monat</div>
                  {s.editierbar && <div className="text-[10px] text-indigo-600 font-bold mt-0.5">ANNAHME · änderbar</div>}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              {schlechtester >= 0
                ? 'Selbst im schlechtesten der drei Fälle bleibt dieses Objekt über Null. Das ist die Zahl, die du brauchst, wenn die Bank fragt, wie du das Zinsänderungsrisiko einschätzt.'
                : `Bei 6 % rutscht der Cashflow auf ${formatCurrency(schlechtester)} im Monat. Plane dafür Puffer ein oder senke die Restschuld vorher mit Sondertilgungen.`}
            </p>
            {monateBisZb != null && monateBisZb > 0 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Ein Forward-Darlehen kannst du bis zu 60 Monate vor Zinsbindungsende abschließen. {monateBisZb > 60 ? `renditly erinnert dich ab ${mmjjjj(forwardAb)}.` : 'Das ist jetzt schon möglich.'}
              </p>
            )}
          </div>
        );
      })()}

      {/* Sondertilgungs-Rechner — Teil 3, 5.5 */}
      {!abbezahlt && aktiv.typ !== 'endfaellig' && rsHeute > 0 && (() => {
        const erlaubtProzent = Number(aktiv.phase.sondertilgungErlaubtProzent) || 0;
        const max = Math.min(rsHeute, Math.round(((erlaubtProzent || 5) / 100) * aktiv.startbetrag / 100) * 100);
        const betrag = Math.min(sonderBetrag ?? max, max);
        const sim = betrag > 0 ? mitSondertilgung(params, aktiv.idx, betrag, heute) : v;
        const zinsenGesamt = (x) => x.phasen.slice(aktiv.idx).reduce((s, p) => s + p.zinsenGesamt, 0);
        const gespart = Math.max(0, zinsenGesamt(v) - zinsenGesamt(sim));
        const frueherMon = v.schuldenfrei && sim.schuldenfrei ? Math.max(0, monateZwischen(sim.schuldenfrei, v.schuldenfrei)) : 0;
        const erfasst = aktiv.phase.sondertilgungen || [];
        const erfassen = () => {
          if (!(betrag > 0)) return;
          const neu = phasen.map((p, i) => i === aktiv.idx
            ? { ...p, sondertilgungen: [...(p.sondertilgungen || []), { id: Date.now(), datum: iso(heute), betrag }] } : p);
          setPhasen(neu);
          setSonderBetrag(0);
        };
        const loeschen = (id) => setPhasen(phasen.map((p, i) => i === aktiv.idx ? { ...p, sondertilgungen: (p.sondertilgungen || []).filter(s => s.id !== id) } : p));
        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-800">Lohnt sich eine Sondertilgung?</p>
            <p className="text-xs text-gray-500 mb-3">
              {erlaubtProzent
                ? `Dein Vertrag erlaubt ${formatCurrency(erlaubtProzent / 100 * aktiv.startbetrag)} pro Jahr. Schieb den Betrag und sieh, was er bringt.`
                : 'Kein Sondertilgungsrecht hinterlegt — der Regler geht als Annahme bis 5 % des Darlehens. Das echte Recht trägst du unter „Konditionen bearbeiten“ ein.'}
            </p>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={max} step={100} value={betrag} onChange={e => setSonderBetrag(parseFloat(e.target.value) || 0)} className="flex-1" />
              <span className="w-24 text-right font-bold text-gray-800 tabular-nums">{formatCurrency(betrag)}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              <div className="rounded-xl bg-gray-50 p-2"><div className="text-[10px] text-gray-400">Zinsen gespart</div><div className="font-black text-emerald-600">{formatCurrency(gespart)}</div></div>
              <div className="rounded-xl bg-gray-50 p-2"><div className="text-[10px] text-gray-400">Früher schuldenfrei</div><div className="font-black text-gray-800">{frueherMon ? `${Math.floor(frueherMon / 12)} J. ${frueherMon % 12} M.` : '—'}</div></div>
              <div className="rounded-xl bg-gray-50 p-2"><div className="text-[10px] text-gray-400">Restschuld {aktiv.ende?.getFullYear() || ''}</div><div className="font-black text-gray-800">{formatCurrency(sim.phasen[aktiv.idx].restschuldBeiZinsbindung)}</div></div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Wenn du es machst, trag es ein — dann rechnet renditly ab sofort damit.</span>
              <button onClick={erfassen} disabled={!(betrag > 0)} className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 disabled:opacity-40">Sondertilgung erfassen</button>
            </div>
            {erfasst.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Erfasste Sondertilgungen</p>
                {erfasst.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{ttmmjjjj(new Date(s.datum))}</span>
                    <span className="flex items-center gap-2"><strong className="text-gray-800">{formatCurrency(s.betrag)}</strong>
                      <button onClick={() => loeschen(s.id)} className="text-gray-300 hover:text-red-500" title="Entfernen"><X size={14}/></button></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Weitere Bausteine */}
      {aktivIstLetzte && !abbezahlt && aktiv.ende && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAbschlussIdx(aktiv.idx)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-700">
            + Anschlussfinanzierung ab {aktiv.ende.getFullYear()} anlegen
          </button>
        </div>
      )}

      {panelIdx !== null && (
        <KonditionenPanel params={params} idx={panelIdx} verlauf={v} cashflowNachTilgung={cashflowNachTilgung}
          onClose={() => setPanelIdx(null)}
          onSave={(neuePhasen, extra) => { setPhasen(neuePhasen, extra); setPanelIdx(null); }} />
      )}
      {abschlussIdx !== null && (
        <DarlehenAbschliessen params={params} idx={abschlussIdx} verlauf={v} cashflowNachTilgung={cashflowNachTilgung}
          onClose={() => setAbschlussIdx(null)}
          onAbbezahlt={(datum, schlusszahlung) => {
            setPhasen(phasen.map((p, i) => i === abschlussIdx ? { ...p, abbezahltAm: datum, schlusszahlung: schlusszahlung || null } : p));
            setAbschlussIdx(null);
          }}
          onAnschluss={(startDatum, startbetrag) => {
            const alt = phasen[abschlussIdx];
            const neu = [...phasen.slice(0, abschlussIdx + 1), {
              id: Date.now(), name: `Anschlussfinanzierung ${abschlussIdx + 1}`,
              darlehensTyp: alt?.darlehensTyp === 'endfaellig' ? 'annuitaet' : (alt?.darlehensTyp || 'annuitaet'),
              sollzinssatz: alt?.sollzinssatz ?? 4, anfangstilgung: alt?.anfangstilgung ?? 2,
              monatlicherBetrag: null, zinsbindung: 10, laufzeit: 10, sondertilgungJaehrlich: 0,
              kreditStartDatum: startDatum, restschuldOverride: Math.round(startbetrag),
            }, ...phasen.slice(abschlussIdx + 1)];
            setPhasen(neu);
            setAbschlussIdx(null);
            setPanelIdx(abschlussIdx + 1);
          }} />
      )}
    </div>
  );
}

// ── "Konditionen bearbeiten" — Panel von rechts mit Vorher/Nachher ────────────
function KonditionenPanel({ params, idx, verlauf, cashflowNachTilgung, onClose, onSave }) {
  const phasen = params.finanzierungsphasen || [];
  const orig = phasen[idx];
  // B6: Anfangstilgung/Sollzins aus dem Verlauf vorbelegen, wenn sie nur an der Immobilie (Altdaten) oder gar nicht hinterlegt sind
  const [p, setP] = useState(() => {
    const vp = verlauf.phasen[idx];
    const r2 = (x) => Math.round(x * 100) / 100;
    return {
      ...orig,
      sollzinssatz: orig.sollzinssatz ?? orig.zinssatz ?? (params.zinssatz != null ? Number(params.zinssatz) : undefined),
      anfangstilgung: orig.anfangstilgung ?? (orig.monatlicherBetrag > 0 ? undefined : (vp?.anfangstilgung ? r2(vp.anfangstilgung) : undefined)), // so rechnet der Verlauf schon
    };
  });
  const [kenne, setKenne] = useState(orig.monatlicherBetrag > 0 ? 'rate' : 'tilgung');
  const [betrag, setBetrag] = useState(() => idx === 0 ? (params.finanzierungsbetrag ?? Math.round(verlauf.fk)) : (orig.restschuldOverride ?? Math.round(verlauf.phasen[idx]?.startbetrag || 0)));
  const [bankOffen, setBankOffen] = useState(false);
  const set = (upd) => setP(x => ({ ...x, ...upd }));
  const alt = verlauf.phasen[idx];
  const start = p.kreditStartDatum ? new Date(p.kreditStartDatum) : alt.start;
  const zbDatum = p.zinsbindungBis || (alt.ende ? iso(alt.ende) : '');

  const entwurf = () => {
    const np = { ...p };
    if (kenne === 'tilgung') np.monatlicherBetrag = null;
    if (zbDatum) {
      np.zinsbindungBis = zbDatum; np.zinsbindungBisBestaetigt = true;
      const j = jahreBis(start, zbDatum);
      if (np.darlehensTyp === 'endfaellig') np.laufzeit = j; else np.zinsbindung = j;
    }
    if (idx > 0) np.restschuldOverride = Number(betrag) || 0;
    return np;
  };
  const neuePhasen = phasen.map((x, i) => i === idx ? entwurf() : x);
  const extra = idx === 0 ? { finanzierungsbetrag: Number(betrag) || 0 } : {};
  const neuV = darlehensVerlauf({ ...params, ...extra, finanzierungsphasen: neuePhasen }) || verlauf;
  const neu = neuV.phasen[idx];
  const cfNeu = cashflowNachTilgung + verlauf.rateHeute - neuV.rateHeute;
  const typ = p.darlehensTyp || 'annuitaet';
  const zinsNum = phasenZins(p, params);
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-xl text-base sm:text-sm';

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/30" onClick={onClose}>
      {/* B5: Panel 660 px breit, legt sich über die Seite statt sie zusammenzuschieben */}
      <div className="w-full sm:w-[660px] max-w-full h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Phase {idx + 1}{p.kreditinstitut ? ` · ${p.kreditinstitut}` : ''}</div>
            <div className="text-lg font-black text-gray-900">Konditionen bearbeiten</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Darlehensart</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {['annuitaet', 'tilgung', 'endfaellig', 'bauspardarlehen'].map(t => (
                <button key={t} onClick={() => set({ darlehensTyp: t })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border ${typ === t || (t === 'annuitaet' && typ === 'kfw') ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {TYP_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Betrag und Zins</p>
            <label className="block text-xs text-gray-500">{idx === 0 ? 'Darlehensbetrag' : 'Startbetrag'}
              <ZahlInput type="number" min="0" step="100" value={betrag} onChange={e => setBetrag(e.target.value)} className={`${inputCls} mt-1`} />
              {idx > 0 && <span className="text-[10px] text-gray-400">Aus Phase {idx} übernommen · ändern, falls die Ablösesumme anders war</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-gray-500">Sollzins p. a.
                <ZahlInput type="number" step="0.01" min="0" value={p.sollzinssatz ?? ''} onChange={e => set({ sollzinssatz: parseFloat(e.target.value) || 0 })} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-xs text-gray-500">Effektivzins
                <ZahlInput type="number" step="0.01" min="0" value={p.effektivzins ?? ''} placeholder="optional" onChange={e => set({ effektivzins: e.target.value === '' ? null : parseFloat(e.target.value) })} className={`${inputCls} mt-1`} />
              </label>
            </div>
          </div>

          {typ !== 'endfaellig' && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Was kennst du auswendig? Die jeweils andere Zahl rechnen wir.</p>
              <div className="flex gap-1.5">
                {[['tilgung', typ === 'tilgung' ? 'Tilgungssatz' : 'Anfangstilgung'], ['rate', typ === 'tilgung' ? 'Tilgung/Monat' : 'Monatsrate']].map(([k, l]) => (
                  <button key={k} onClick={() => setKenne(k)} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${kenne === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>{l}</button>
                ))}
              </div>
              {kenne === 'tilgung' ? (
                <label className="block text-xs text-gray-500">{typ === 'tilgung' ? 'Tilgungssatz p. a.' : 'Anfangstilgung p. a.'}
                  <ZahlInput type="number" step="0.01" min="0"
                    value={(typ === 'tilgung' ? p.tilgungssatz : p.anfangstilgung) ?? ''}
                    onChange={e => set(typ === 'tilgung' ? { tilgungssatz: parseFloat(e.target.value) || 0, monatlicheTilgung: null } : { anfangstilgung: parseFloat(e.target.value) || 0, monatlicherBetrag: null })}
                    className={`${inputCls} mt-1`} />
                  <span className="text-[11px] text-indigo-700 font-semibold">Ergibt eine Monatsrate von {formatCurrency(neu?.rate || 0)}</span>
                </label>
              ) : (
                <label className="block text-xs text-gray-500">{typ === 'tilgung' ? 'Feste Tilgung pro Monat' : 'Monatsrate'}
                  <ZahlInput type="number" step="1" min="0"
                    value={(typ === 'tilgung' ? p.monatlicheTilgung : p.monatlicherBetrag) ?? ''}
                    onChange={e => set(typ === 'tilgung' ? { monatlicheTilgung: parseFloat(e.target.value) || null } : { monatlicherBetrag: parseFloat(e.target.value) || null })}
                    className={`${inputCls} mt-1`} />
                  <span className="text-[11px] text-indigo-700 font-semibold">Ergibt eine Anfangstilgung von {pct(neu?.anfangstilgung || 0)} bei {pct(zinsNum)} Zins</span>
                </label>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Laufzeit</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-gray-500">Phase beginnt
                <input type="date" value={p.kreditStartDatum || iso(alt.start)} onChange={e => set({ kreditStartDatum: e.target.value })} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-xs text-gray-500">{typ === 'endfaellig' ? 'Laufzeit bis' : 'Zinsbindung bis'}
                <input type="date" value={zbDatum} onChange={e => set({ zinsbindungBis: e.target.value })}
                  className={`${inputCls} mt-1 ${!orig.zinsbindungBisBestaetigt ? 'border-amber-400 bg-amber-50' : ''}`} />
                <span className="text-[10px] text-amber-700">Volles Datum nötig — daran hängt deine Erinnerung</span>
              </label>
            </div>
            <label className="block text-xs text-gray-500">Sondertilgung erlaubt (% vom Darlehen pro Jahr)
              <ZahlInput type="number" step="0.5" min="0" max="100" value={p.sondertilgungErlaubtProzent ?? ''} placeholder="z. B. 5"
                onChange={e => set({ sondertilgungErlaubtProzent: e.target.value === '' ? null : parseFloat(e.target.value) })} className={`${inputCls} mt-1`} />
            </label>
          </div>

          <div className="border border-gray-200 rounded-xl">
            <button onClick={() => setBankOffen(o => !o)} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1"><Landmark size={12}/> Bank {p.kreditinstitut ? `· ${p.kreditinstitut}` : ''}</span>
              {bankOffen ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
            </button>
            {bankOffen && (
              <div className="px-3 pb-3 space-y-2">
                {[['kreditinstitut', 'Kreditinstitut'], ['darlehensnummer', 'Darlehensnummer'], ['ansprechpartner', 'Ansprechpartner'], ['ansprechpartnerKontakt', 'Telefon / E-Mail']].map(([k, l]) => (
                  <label key={k} className="block text-xs text-gray-500">{l}
                    <input type="text" value={p[k] || ''} onChange={e => set({ [k]: e.target.value })} className={`${inputCls} mt-1`} />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Das ändert sich, wenn du speicherst */}
        <div className="bg-ink text-white px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/50 mb-2">Das ändert sich, wenn du speicherst</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              ['Monatsrate', formatCurrency(alt.rate), formatCurrency(neu?.rate || 0)],
              ['Schuldenfrei', verlauf.schuldenfrei ? String(verlauf.schuldenfrei.getFullYear()) : '—', neuV.schuldenfrei ? String(neuV.schuldenfrei.getFullYear()) : '—'],
              ['Cashflow nach Tilgung', `${cashflowNachTilgung >= 0 ? '+' : ''}${formatCurrency(cashflowNachTilgung)}`, `${cfNeu >= 0 ? '+' : ''}${formatCurrency(cfNeu)}`],
            ].map(([l, vorher, nachher]) => (
              <div key={l}>
                <div className="text-[10px] text-white/50">{l}</div>
                <div className="text-white/40 line-through text-xs">{vorher}</div>
                <div className="font-black">{nachher}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
          {phasen.length > 1 ? (
            <button onClick={() => { if (window.confirm('Diese Phase wirklich löschen?')) onSave(phasen.filter((_, i) => i !== idx), {}); }}
              className="text-xs font-semibold text-red-600 hover:underline">Diese Phase löschen</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl">Abbrechen</button>
            <button onClick={() => onSave(neuePhasen, extra)} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Änderungen übernehmen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── "Darlehen abschließen": abbezahlt oder Anschlussfinanzierung ─────────────
function DarlehenAbschliessen({ params, idx, verlauf, cashflowNachTilgung, onClose, onAbbezahlt, onAnschluss }) {
  const p = verlauf.phasen[idx];
  const endeStd = p.ende || new Date();
  // Nächster Monatserster nach Zinsbindungsende
  const folgeStart = new Date(endeStd.getFullYear(), endeStd.getMonth() + (endeStd.getDate() >= 28 ? 1 : 0), 1);
  const [art, setArt] = useState(null);
  const [datum, setDatum] = useState(iso(folgeStart));
  const rsAm = verlauf.restschuldAm(new Date(datum || folgeStart));
  const [schluss, setSchluss] = useState('');
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Phase {idx + 1}{p.phase.kreditinstitut ? ` · ${p.phase.kreditinstitut}` : ''}{p.ende ? ` · endet ${ttmmjjjj(p.ende)}` : ''}</div>
            <div className="text-lg font-black text-gray-900">Wie geht es mit diesem Darlehen weiter?</div>
            <div className="text-xs text-gray-500">Rechnerische Restschuld zum Ende der Zinsbindung: {formatCurrency(p.restschuldBeiZinsbindung)}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setArt('abbezahlt')} className={`text-left rounded-xl border-2 p-3 ${art === 'abbezahlt' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
              <div className="text-sm font-bold text-gray-900">Darlehen ist abbezahlt</div>
              <div className="text-xs text-gray-500 mt-1">Die Restschuld geht auf 0, die Kreditrate fällt aus dem Cashflow, und das Objekt gilt ab dem gewählten Datum als schuldenfrei.</div>
              <div className="text-xs mt-2">Dein Cashflow danach <strong className="text-emerald-600">{formatCurrency(cashflowNachTilgung + p.rate)}</strong></div>
            </button>
            <button onClick={() => setArt('anschluss')} className={`text-left rounded-xl border-2 p-3 ${art === 'anschluss' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
              <div className="text-sm font-bold text-gray-900">Anschlussfinanzierung anlegen</div>
              <div className="text-xs text-gray-500 mt-1">Es geht mit einem neuen Darlehen weiter. Wir legen Phase {idx + 2} an und übernehmen die Restschuld als Startbetrag.</div>
              <div className="text-xs mt-2">Startbetrag Phase {idx + 2} <strong>{formatCurrency(rsAm)}</strong></div>
            </button>
          </div>

          {art && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Zum Abschluss brauchen wir noch {art === 'abbezahlt' ? 'zwei Angaben' : 'eine Angabe'}</p>
              <label className="block text-xs text-gray-500">{art === 'abbezahlt' ? 'Abbezahlt zum' : 'Neues Darlehen beginnt am'}
                <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-base sm:text-sm bg-white" />
                <span className="text-[10px] text-gray-400">{art === 'abbezahlt' ? 'Ab diesem Monat rechnen wir ohne Kreditrate.' : 'Startbetrag und Startdatum sind im nächsten Schritt schon ausgefüllt.'}</span>
              </label>
              {art === 'abbezahlt' && (
                <label className="block text-xs text-gray-500">Tatsächliche Schlusszahlung
                  <ZahlInput type="number" min="0" value={schluss} placeholder={String(Math.round(rsAm))} onChange={e => setSchluss(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-base sm:text-sm bg-white" />
                  <span className="text-[10px] text-gray-400">Unser Rechenwert: {formatCurrency(rsAm)}. Steht auf deinem Kontoauszug etwas anderes, trag das ein.</span>
                </label>
              )}
              <ol className="text-xs text-gray-500 space-y-1 list-decimal pl-4">
                <li>Phase {idx + 1} wandert in die Historie und wird auf eine Zeile eingeklappt.</li>
                <li>Die Erinnerung zur Zinsbindung verschwindet, weil sie erledigt ist.</li>
                {art === 'anschluss'
                  ? <li>Das Panel „Konditionen bearbeiten“ öffnet sich — mit Startbetrag und Startdatum schon ausgefüllt.</li>
                  : <li>Die Objektkarte zeigt „schuldenfrei“, und beleihbar frei steigt auf den vollen Betrag.</li>}
              </ol>
            </div>
          )}
          {!p.ende && <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle size={12}/> Kein Zinsbindungsende hinterlegt — das Datum oben bitte anpassen.</p>}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl">Abbrechen</button>
          <button disabled={!art || !datum}
            onClick={() => art === 'abbezahlt' ? onAbbezahlt(datum, schluss ? Number(schluss) : null) : onAnschluss(datum, rsAm)}
            className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40">
            {art === 'anschluss' ? 'Phase anlegen' : 'Als abbezahlt markieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
export { KonditionenPanel, DarlehenAbschliessen };
