import { useState } from 'react';
import { Home, TrendingUp, TrendingDown, CalendarDays, Receipt, Building2, Wallet, X, Info } from 'lucide-react';
import { getAktuellerWert } from '../utils/miete.js';
import { formatCurrency } from '../utils/format.js';
import { PlausiFeldHinweis } from './PlausiPruefung';
import KostenZahler from './KostenZahler';
import ZahlInput from './ZahlInput';

const MietKostenManager = ({ params, updateParams, immobilie, hasChanges, setHasChanges, plausi = [] }) => {
  const [modus, setModus] = useState(immobilie.mietModus || 'automatisch'); // 'automatisch' oder 'manuell'
  const [ansicht, setAnsicht] = useState('jahr'); // 'jahr' oder 'monat'
  const [mietHistorie, setMietHistorie] = useState(immobilie.mietHistorie || {});

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();
  const jahre = [];
  for (let j = kaufjahr; j <= aktuellesJahr + 5; j++) {
    jahre.push(j);
  }

  const monate = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  const getWertFuerZeitraum = (jahr, monat = null, feld) => {
    const key = monat !== null ? `${jahr}-${monat}` : `${jahr}`;
    if (mietHistorie[key] && mietHistorie[key][feld] !== undefined) {
      return mietHistorie[key][feld];
    }
    // Fallback auf params oder berechne mit Steigerung
    const jahreVergangen = jahr - kaufjahr;
    const basisWert = params[feld] || 0;
    if (modus === 'automatisch' && feld === 'kaltmiete') {
      return Math.round(basisWert * Math.pow(1 + (params.mietsteigerung || 0) / 100, jahreVergangen));
    }
    return basisWert;
  };

  const setWertFuerZeitraum = (jahr, monat, feld, wert) => {
    const key = monat !== null ? `${jahr}-${monat}` : `${jahr}`;
    const neueHistorie = {
      ...mietHistorie,
      [key]: {
        ...(mietHistorie[key] || {}),
        [feld]: parseFloat(wert) || 0
      }
    };
    setMietHistorie(neueHistorie);
    updateParams({ ...params, mietHistorie: neueHistorie, mietModus: modus });
  };

  const handleModusChange = (neuerModus) => {
    setModus(neuerModus);
    updateParams({ ...params, mietModus: neuerModus });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Einnahmen & Kosten</h3>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => handleModusChange('automatisch')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'automatisch' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-gray-600'}`}
          >
            Automatisch
          </button>
          <button
            onClick={() => handleModusChange('manuell')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'manuell' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-gray-600'}`}
          >
            Manuell
          </button>
        </div>
      </div>

      {modus === 'automatisch' ? (
        <div className="space-y-3">
          {/* Vermietungsmodell — Abschnitt 6.2: Frage statt Fachbegriff, Rechenbeispiel
              aus den echten (bereits erfassten) Objektwerten statt Abkürzungen. */}
          {(() => {
            const kalt = Number(params.kaltmiete) || 0;
            // Kein erfundener Beispielwert: ohne hinterlegte NK-Vorauszahlung wird
            // das Beispiel nicht mit einer ausgedachten Zahl "ausgerechnet".
            const nkVz = Number(params.nebenkostenVomMieter) || 0;
            const aktuellesModell = params.vermietungsmodell || 'kaltmiete';
            const VERMIETUNGS_OPTIONEN = [
              {
                value: 'kaltmiete_nk', label: 'Miete + Nebenkosten', badge: 'Normalfall',
                erklaerung: 'Kaltmiete plus monatliche Nebenkosten-Vorauszahlung. Einmal im Jahr rechnest du ab.',
                beispiel: kalt > 0 && nkVz > 0
                  ? `${formatCurrency(kalt)} + ${formatCurrency(nkVz)} = ${formatCurrency(kalt + nkVz)} Überweisung`
                  : kalt > 0 ? `${formatCurrency(kalt)} + Nebenkosten-Vorauszahlung` : 'Kaltmiete + Nebenkosten-Vorauszahlung',
              },
              {
                value: 'kaltmiete', label: 'Nur Kaltmiete', badge: null,
                erklaerung: 'Hausgeld und Betriebskosten trägst du und holst sie über die Jahresabrechnung zurück.',
                beispiel: aktuellesModell !== 'warmmiete' && kalt > 0 ? `${formatCurrency(kalt)} Überweisung` : 'nur die Kaltmiete',
              },
              {
                value: 'warmmiete', label: 'Pauschalmiete, alles drin', badge: null,
                erklaerung: 'Ein einziger Betrag, keine Jahresabrechnung.',
                beispiel: aktuellesModell === 'warmmiete' && kalt > 0
                  ? `${formatCurrency(kalt)} Überweisung`
                  : kalt > 0 && nkVz > 0 ? `${formatCurrency(kalt + nkVz)} Überweisung` : 'ein fester Gesamtbetrag',
              },
            ];
            return (
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><Home size={12} /> Was überweist dein Mieter jeden Monat?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {VERMIETUNGS_OPTIONEN.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => updateParams({ ...params, vermietungsmodell: opt.value })}
                  className={`p-2 rounded-lg border-2 text-xs transition-all text-left ${
                    aktuellesModell === opt.value
                      ? 'border-indigo-500 bg-white text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{opt.label}</span>
                    {opt.badge && <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">{opt.badge}</span>}
                  </div>
                  <div className="text-gray-400 text-[10px] mt-0.5">{opt.erklaerung}</div>
                  <div className="font-mono text-[10px] text-gray-400 mt-1">{opt.beispiel}</div>
                </button>
              ))}
            </div>
          </div>
            );
          })()}

          {/* Einnahmen — UX-Paket Teil 2, Nachtrag: nur Kaltmiete + NK-Vorauszahlung */}
          {(() => {
            const modell = params.vermietungsmodell || 'kaltmiete';
            const kalt = Number(params.kaltmiete) || 0;
            const nk = modell === 'kaltmiete_nk' ? (Number(params.nebenkostenVomMieter) || 0) : 0;
            const Feld = ({ label, hint, feld, step = 10, nullbar = false, value }) => (
              <div className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-gray-800 font-medium">{label}</div>
                  {hint && <div className="text-[10px] text-gray-400">{hint}</div>}
                  {PlausiFeldHinweis({ hinweise: plausi, feld, params, updateParams })}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <ZahlInput type="number" min={0} step={step}
                    value={value !== undefined ? value : (nullbar ? (params[feld] ?? '') : (params[feld] ?? 0))}
                    placeholder={nullbar ? 'leer' : undefined}
                    onChange={e => updateParams({ ...params, [feld]: e.target.value === '' ? (nullbar ? null : 0) : (parseFloat(e.target.value) || 0) })}
                    className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tabular-nums" />
                  <span className="text-xs text-gray-400 w-5 text-left">€</span>
                </div>
              </div>
            );
            return (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><TrendingUp size={12} /> Einnahmen — was dein Mieter überweist</p>
            </div>
            <div className="divide-y divide-gray-100 px-4">
              {Feld({ label: modell === 'warmmiete' ? 'Pauschalmiete' : 'Kaltmiete', feld: 'kaltmiete', step: 25,
                hint: modell === 'warmmiete' ? 'Ein fester Betrag, alle Nebenkosten eingepreist' : 'Monatliche Grundmiete, ohne Nebenkosten' })}
              {modell === 'kaltmiete_nk' && (
                Feld({ label: 'Nebenkosten-Vorauszahlung', feld: 'nebenkostenVomMieter', hint: 'Was der Mieter zusätzlich für Betriebskosten zahlt' })
              )}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-bold text-gray-800">Der Mieter überweist</span>
                <span className="text-sm font-black text-emerald-600 tabular-nums">{formatCurrency(kalt + nk)}</span>
              </div>
            </div>
          </div>
            );
          })()}

          {/* Ausgaben — Hausgeld (davon nicht umlagefähig), SEV, Grundsteuer; Rest hinter einer Frage */}
          {(() => {
            const modell = params.vermietungsmodell || 'kaltmiete';
            const hausgeld = Number(params.hausgeld) || 0;
            const setFeld = (feld, v, nullbar = false) => updateParams({ ...params, [feld]: v === '' ? (nullbar ? null : 0) : (parseFloat(v) || 0),
              ...(feld === 'hausgeldNichtUmlagefaehig' ? { feldHerkunft: { ...(params.feldHerkunft || {}), hausgeldNichtUmlagefaehig: 'manuell' } } : {}) });
            const input = (feld, nullbar = false, step = 5) => (
              <div className="flex items-center gap-1.5 shrink-0">
                <ZahlInput type="number" min={0} step={step}
                  value={nullbar ? (params[feld] ?? '') : (params[feld] ?? 0)}
                  placeholder={nullbar ? 'leer' : undefined}
                  onChange={e => setFeld(feld, e.target.value, nullbar)}
                  className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tabular-nums bg-white" />
                <span className="text-xs text-gray-400 w-5 text-left">€</span>
              </div>
            );
            const zeile = (label, hint, feld, opts = {}) => (
              <div className={`flex items-center justify-between py-2.5 gap-3 ${opts.klasse || ''}`}>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${opts.labelKlasse || 'text-gray-800'}`}>{label}</div>
                  {hint && <div className="text-[10px] text-gray-400">{hint}</div>}
                  {opts.extra}
                  {PlausiFeldHinweis({ hinweise: plausi, feld, params, updateParams })}
                </div>
                {input(feld, opts.nullbar, opts.step)}
              </div>
            );
            // Weitere Kosten: Frage Ja/Nein. "Ja" ist automatisch aktiv, sobald etwas eingetragen ist.
            const WEITERE = [
              ['instandhaltung', 'Eigene Rücklage für Reparaturen', 'Zusätzlich zur WEG-Rücklage, für Sondereigentum wie Bad oder Heizung'],
              ['versicherungMonat', 'Versicherungen', 'Nur was nicht schon im Hausgeld steckt'],
            ];
            const CHIPS = [['strom', 'Strom'], ['heizung', 'Heizung'], ['internet', 'Internet'], ['rundfunk', 'Rundfunkbeitrag'], ['kontofuehrung', 'Kontoführung'], ['nebenkosten', 'Eigene Position']];
            // Positionen, bei denen der Mieter/die Firma direkt zahlen kann (Wer zahlt? mit Datum)
            const MIT_ZAHLER = ['strom', 'heizung', 'internet', 'rundfunk', 'nebenkosten'];
            const weitereWerte = [...WEITERE.map(w => w[0]), ...CHIPS.map(c => c[0])].map(k => Number(params[k]) || 0);
            const hatWeitere = weitereWerte.some(v => v > 0);
            const weitereAn = params.weitereKostenAktiv === true || hatWeitere;
            const aktiveChips = params.weitereKostenChips || [];
            const chipAn = (k) => (Number(params[k]) || 0) > 0 || aktiveChips.includes(k);
            return (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Receipt size={12} /> Ausgaben — was du jeden Monat zahlst</p>
            </div>
            <div className="divide-y divide-gray-100 px-4">
              {zeile('Hausgeld an die WEG', 'Was du monatlich an die Verwaltung der Eigentümergemeinschaft zahlst', 'hausgeld', { step: 10 })}
              {modell !== 'warmmiete' && hausgeld > 0 && zeile(
                'davon nicht umlagefähig',
                'Verwaltervergütung und Zuführung zur Instandhaltungsrücklage — diesen Teil bekommst du nie vom Mieter zurück. Steht in deiner Hausgeldabrechnung.',
                'hausgeldNichtUmlagefaehig',
                {
                  nullbar: true, klasse: 'pl-4 -mx-4 pr-4 bg-indigo-50/60 border-l-4 border-l-indigo-400', labelKlasse: 'text-indigo-800',
                  extra: (params.hausgeldNichtUmlagefaehig == null || params.hausgeldNichtUmlagefaehig === '') && (
                    <button type="button" onClick={() => updateParams({ ...params, hausgeldNichtUmlagefaehig: Math.round(hausgeld * 0.35), feldHerkunft: { ...(params.feldHerkunft || {}), hausgeldNichtUmlagefaehig: 'geschaetzt' } })}
                      className="mt-1 text-[11px] font-semibold text-indigo-700 hover:underline">
                      Mit 35 % schätzen ({formatCurrency(Math.round(hausgeld * 0.35))})
                    </button>
                  ),
                }
              )}
              {zeile('Sondereigentumsverwaltung', 'Was du einer Verwaltung für deine Wohnung zahlst — Mietinkasso, Abrechnung, Mieterkontakt. Nicht das Hausgeld.', 'verwaltung')}
              {zeile('Grundsteuer', `Jahresbetrag durch zwölf — seit 2025 nach neuem Bescheid${(Number(params.grundsteuerMonat) || 0) > 0 ? ` · ${formatCurrency((Number(params.grundsteuerMonat) || 0) * 12)} im Jahr` : ''}`, 'grundsteuerMonat', { step: 1 })}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Willst du Rücklagen bilden oder hast du weitere laufende Kosten?</div>
                  <div className="text-[10px] text-gray-400">Die meisten brauchen das nicht — nur anhaken, wenn wirklich etwas dazukommt.</div>
                </div>
                <div className="flex gap-1.5">
                  <button type="button"
                    onClick={() => {
                      if (hatWeitere && !window.confirm('Die eingetragenen weiteren Kosten werden auf 0 gesetzt. Fortfahren?')) return;
                      const leer = {}; [...WEITERE.map(w => w[0]), ...CHIPS.map(c => c[0])].forEach(k => { leer[k] = 0; });
                      updateParams({ ...params, ...leer, weitereKostenAktiv: false, weitereKostenChips: [] });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!weitereAn ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>Nein</button>
                  <button type="button" onClick={() => updateParams({ ...params, weitereKostenAktiv: true })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${weitereAn ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>Ja</button>
                </div>
              </div>
              {weitereAn && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl px-4 divide-y divide-gray-100">
                  {WEITERE.map(([k, l, h]) => <div key={k}>{zeile(l, h, k)}</div>)}
                  <div className="py-2.5 flex flex-wrap gap-1.5">
                    {CHIPS.map(([k, l]) => (
                      <button key={k} type="button"
                        onClick={() => {
                          if (chipAn(k)) updateParams({ ...params, [k]: 0, weitereKostenChips: aktiveChips.filter(c => c !== k) });
                          else updateParams({ ...params, weitereKostenChips: [...aktiveChips, k] });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${chipAn(k) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}>
                        {chipAn(k) ? '✓ ' : '+ '}{l}
                      </button>
                    ))}
                  </div>
                  {CHIPS.filter(([k]) => chipAn(k)).map(([k, l]) => (
                    <div key={k}>{zeile(l, k === 'nebenkosten' ? 'Eigene laufende Kosten, die oben nicht vorkommen' : 'Monatsbetrag für die Wohnung', k, {
                      extra: MIT_ZAHLER.includes(k) ? <KostenZahler params={params} feld={k} onChange={(kz) => updateParams({ ...params, kostenZahler: kz })} /> : null,
                    })}</div>
                  ))}
                </div>
              )}
            </div>
            <p className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100">Kostenanpassungen ab Stichtag (z. B. Hausgelderhöhung zum 1. Juli) trägst du unten ein.</p>
          </div>
            );
          })()}

          {/* Mietanpassungen */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><CalendarDays size={12} /> Mietanpassungen</p>
              <button type="button"
                onClick={() => {
                  const neueAnpassung = { datum: new Date().toISOString().split('T')[0], kaltmiete: params.kaltmiete || 0 };
                  updateParams({ ...params, mietAnpassungen: [...(params.mietAnpassungen || []), neueAnpassung] });
                }}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-indigo-700 px-2 py-1 rounded-lg font-medium">
                + Anpassung
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700 mb-3">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>Fließt in Cashflow, Rendite und alle Berechnungen ein — die jeweils zum betreffenden Zeitpunkt gültige Miete wird automatisch verwendet.</span>
              </div>
              {(params.mietAnpassungen || []).length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  <p>Noch keine Verlaufshistorie</p>
                  <p className="text-xs mt-1 text-gray-300">Nicht nötig für Berechnungen — optional für den Miete-Verlaufsgraph</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(params.mietAnpassungen || [])
                    .map((anp, originalIdx) => ({ ...anp, originalIdx }))
                    .sort((a, b) => new Date(a.datum) - new Date(b.datum))
                    .map(anp => (
                      <div key={anp.originalIdx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5">
                        <input type="date" value={anp.datum}
                          onChange={e => {
                            const neu = [...(params.mietAnpassungen || [])];
                            neu[anp.originalIdx] = { ...neu[anp.originalIdx], datum: e.target.value };
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="text-xs border border-gray-300 rounded px-1 py-0.5 flex-1 min-w-0" />
                        <ZahlInput type="number" value={anp.kaltmiete}
                          onChange={e => {
                            const neu = [...(params.mietAnpassungen || [])];
                            neu[anp.originalIdx] = { ...neu[anp.originalIdx], kaltmiete: parseFloat(e.target.value) || 0 };
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          className="w-20 text-xs border border-gray-300 rounded px-1 py-0.5 text-right" />
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">€/Mon</span>
                        <button type="button"
                          onClick={() => {
                            const neu = (params.mietAnpassungen || []).filter((_, i) => i !== anp.originalIdx);
                            updateParams({ ...params, mietAnpassungen: neu });
                          }}
                          title="Anpassung löschen"
                          className="text-red-400 hover:text-red-600 text-xs px-1 shrink-0"><X size={12} /></button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Kostenanpassungen — datumsbasierte Overrides für alle Kostenfelder,
              analog zu den Mietanpassungen oben (statt starr pro Kalenderjahr). */}
          {(() => {
            const COST_FELDER = [
              { key: 'instandhaltung', label: 'Eigene Rücklage' },
              { key: 'verwaltung', label: 'Sondereigentumsverwaltung' },
              { key: 'hausgeld', label: 'Hausgeld an die WEG' },
              { key: 'strom', label: 'Strom' },
              { key: 'internet', label: 'Internet' },
              { key: 'heizung', label: 'Heizung' },
              { key: 'rundfunk', label: 'Rundfunk' },
              { key: 'nebenkosten', label: 'Eigene Position' },
            ];
            const hatKostenFeld = (entry) => COST_FELDER.some(f => entry[f.key] != null);
            const kostenAnpassungen = (params.mietAnpassungen || [])
              .map((anp, originalIdx) => ({ ...anp, originalIdx }))
              .filter(hatKostenFeld)
              .sort((a, b) => new Date(a.datum) - new Date(b.datum));

            const addAnpassung = () => {
              const neueAnpassung = {
                datum: new Date().toISOString().split('T')[0],
                instandhaltung: getAktuellerWert(params, 'instandhaltung'),
                verwaltung: getAktuellerWert(params, 'verwaltung'),
                hausgeld: getAktuellerWert(params, 'hausgeld'),
                strom: getAktuellerWert(params, 'strom'),
                internet: getAktuellerWert(params, 'internet'),
                nebenkosten: getAktuellerWert(params, 'nebenkosten'),
              };
              updateParams({ ...params, mietAnpassungen: [...(params.mietAnpassungen || []), neueAnpassung] });
            };

            const removeAnpassung = (originalIdx) => {
              // Nur die Kosten-Felder aus dem Eintrag entfernen — falls derselbe
              // Eintrag auch eine Mietanpassung (kaltmiete) trägt, bleibt der
              // erhalten; ist der Eintrag danach leer, ganz entfernen.
              const neu = [...(params.mietAnpassungen || [])];
              const entry = { ...(neu[originalIdx] || {}) };
              COST_FELDER.forEach(f => delete entry[f.key]);
              const bleibtEtwas = Object.keys(entry).some(k => k !== 'datum');
              if (bleibtEtwas) neu[originalIdx] = entry;
              else neu.splice(originalIdx, 1);
              updateParams({ ...params, mietAnpassungen: neu });
            };

            const updateAnpassungDatum = (originalIdx, datum) => {
              const neu = [...(params.mietAnpassungen || [])];
              neu[originalIdx] = { ...neu[originalIdx], datum };
              updateParams({ ...params, mietAnpassungen: neu });
            };

            const updateAnpassungFeld = (originalIdx, feldKey, wert) => {
              const neu = [...(params.mietAnpassungen || [])];
              neu[originalIdx] = { ...neu[originalIdx], [feldKey]: parseFloat(wert) || 0 };
              updateParams({ ...params, mietAnpassungen: neu });
            };

            return (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><CalendarDays size={12} /> Kostenanpassungen</p>
                    <p className="text-[10px] text-gray-400">Basiswerte gelten ab Kauf — hier ab einem bestimmten Datum überschreiben (z.B. Hausgeld-Erhöhung zum 1. Juli)</p>
                  </div>
                  <button type="button" onClick={addAnpassung}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-indigo-700 px-2 py-1 rounded-lg font-medium shrink-0 ml-3">
                    + Anpassung
                  </button>
                </div>
                <div className="px-4 py-3">
                  {kostenAnpassungen.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic bg-gray-50 border border-gray-100 p-2 rounded-lg">Keine Anpassungen → Basiswerte gelten durchgehend</p>
                  ) : (
                    <div className="space-y-3">
                      {kostenAnpassungen.map(anp => {
                        const istKuenftig = new Date(anp.datum) > new Date();
                        return (
                          <div key={anp.originalIdx} className={`border rounded-xl p-3 ${istKuenftig ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                            <div className="flex items-center justify-between mb-2.5 gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <label className="text-[10px] text-gray-500 shrink-0">Gültig ab</label>
                                <input type="date" value={anp.datum}
                                  onChange={e => updateAnpassungDatum(anp.originalIdx, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white min-w-0" />
                                {istKuenftig && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded shrink-0">Künftig</span>}
                              </div>
                              <button type="button" onClick={() => removeAnpassung(anp.originalIdx)}
                                title="Anpassung löschen"
                          className="text-red-400 hover:text-red-600 text-xs px-1 shrink-0"><X size={12} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                              {COST_FELDER.map(item => (
                                <div key={item.key} className="flex items-center gap-1">
                                  <label className="text-[10px] text-gray-500 w-[70px] shrink-0">{item.label}</label>
                                  <ZahlInput type="number"
                                    value={anp[item.key] ?? ''}
                                    placeholder={`${getAktuellerWert(params, item.key)}`}
                                    onChange={e => updateAnpassungFeld(anp.originalIdx, item.key, e.target.value)}
                                    className="flex-1 text-xs text-right border border-gray-200 rounded px-1.5 py-1 min-w-0 bg-white focus:ring-1 focus:ring-blue-400" />
                                  <span className="text-[10px] text-gray-400">€</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div>
          {/* Vermietungsmodell auch im manuellen Modus */}
          <div className="mb-3 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
            <p className="text-[10px] font-semibold text-blue-800 mb-1.5 flex items-center gap-1"><Home size={12} /> Was überweist dein Mieter jeden Monat?</p>
            <div className="flex gap-1.5">
              {[
                { value: 'kaltmiete_nk', label: 'Miete + NK' },
                { value: 'kaltmiete', label: 'Nur Kaltmiete' },
                { value: 'warmmiete', label: 'Pauschal, alles drin' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParams({ ...params, vermietungsmodell: opt.value })}
                  className={`px-2 py-1 rounded text-[10px] border transition-all flex-1 ${
                    (params.vermietungsmodell || 'kaltmiete') === opt.value
                      ? 'border-indigo-500 bg-white text-indigo-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-gray-500">Manuelle Eingabe pro Zeitraum</p>
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setAnsicht('jahr')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'jahr' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}
              >
                Jahre
              </button>
              <button
                onClick={() => setAnsicht('monat')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'monat' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}
              >
                Monate
              </button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-3">
            {ansicht === 'jahr' ? (
              // Jahresansicht - Card Layout
              jahre.map(jahr => (
                <div key={jahr} className={`border rounded-lg p-3 ${jahr === aktuellesJahr ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-gray-800">{jahr}</span>
                    {jahr === aktuellesJahr && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                  </div>

                  {/* Einnahmen */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><TrendingUp size={12} /> Einnahmen</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <label className="text-sm text-gray-700">
                          {(params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete' : 'Kaltmiete'}
                        </label>
                        <div className="flex items-center gap-1">
                          <ZahlInput
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'kaltmiete')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'kaltmiete', e.target.value)}
                            className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-500">€</span>
                        </div>
                      </div>
                      {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' && (
                        <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <label className="text-sm text-gray-700">Nebenkosten-Vorauszahlung</label>
                          <div className="flex items-center gap-1">
                            <ZahlInput
                              type="number"
                              value={getWertFuerZeitraum(jahr, null, 'nebenkostenVomMieter')}
                              onChange={(e) => setWertFuerZeitraum(jahr, null, 'nebenkostenVomMieter', e.target.value)}
                              className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                            />
                            <span className="text-xs text-gray-500">€</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kosten */}
                  <div>
                    <div className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1"><TrendingDown size={12} /> Kosten (Vermieter)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Rücklage für Reparaturen</label>
                        <div className="flex items-center gap-1">
                          <ZahlInput
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'instandhaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'instandhaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Sondereigentumsverwaltung</label>
                        <div className="flex items-center gap-1">
                          <ZahlInput
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'verwaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'verwaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Hausgeld an die WEG</label>
                        <div className="flex items-center gap-1">
                          <ZahlInput
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'hausgeld')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'hausgeld', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Strom</label>
                        <div className="flex items-center gap-1">
                          <ZahlInput
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'strom')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'strom', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Internet</label>
                        <div className="flex items-center gap-1">
                          <ZahlInput
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'internet')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'internet', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Monatsansicht - Card Layout
              <div>
                <select
                  className="w-full mb-3 p-2 border rounded-lg text-sm font-semibold"
                  onChange={(e) => document.getElementById(`monat-${e.target.value}`)?.scrollIntoView({ behavior: 'smooth' })}
                  defaultValue={aktuellesJahr}
                >
                  {jahre.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                {jahre.map(jahr => (
                  <div key={jahr} id={`monat-${jahr}`} className="mb-6">
                    <div className={`font-bold text-lg p-2 rounded-t-lg ${jahr === aktuellesJahr ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {jahr}
                    </div>
                    <div className="border border-t-0 rounded-b-lg divide-y">
                      {monate.map((monat, idx) => {
                        const aktuellerMonat = new Date().getMonth();
                        const istAktuell = jahr === aktuellesJahr && idx === aktuellerMonat;
                        return (
                          <div key={`${jahr}-${idx}`} className={`p-3 ${istAktuell ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-gray-700">{monat}</span>
                              {istAktuell && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                            </div>

                            {/* Einnahmen */}
                            <div className="mb-2 space-y-1">
                              <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                                <label className="text-sm text-green-800 flex items-center gap-1">
                                  <Wallet size={12} /> {(params.vermietungsmodell || 'kaltmiete') === 'warmmiete' ? 'Warmmiete' : 'Kaltmiete'}
                                </label>
                                <div className="flex items-center gap-1">
                                  <ZahlInput
                                    type="number"
                                    value={getWertFuerZeitraum(jahr, idx, 'kaltmiete')}
                                    onChange={(e) => setWertFuerZeitraum(jahr, idx, 'kaltmiete', e.target.value)}
                                    className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                                  />
                                  <span className="text-xs text-gray-500">€</span>
                                </div>
                              </div>
                              {(params.vermietungsmodell || 'kaltmiete') === 'kaltmiete_nk' && (
                                <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                                  <label className="text-sm text-green-800 flex items-center gap-1"><Wallet size={12} /> Nebenkosten-Vorauszahlung</label>
                                  <div className="flex items-center gap-1">
                                    <ZahlInput
                                      type="number"
                                      value={getWertFuerZeitraum(jahr, idx, 'nebenkostenVomMieter')}
                                      onChange={(e) => setWertFuerZeitraum(jahr, idx, 'nebenkostenVomMieter', e.target.value)}
                                      className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                                    />
                                    <span className="text-xs text-gray-500">€</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Kosten Grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Inst.</label>
                                <ZahlInput
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'instandhaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'instandhaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Verw.</label>
                                <ZahlInput
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'verwaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'verwaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Hausgeld an die WEG</label>
                                <ZahlInput
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'hausgeld')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'hausgeld', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Strom</label>
                                <ZahlInput
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'strom')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'strom', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Internet</label>
                                <ZahlInput
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'internet')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'internet', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Alle Werte in € pro Monat</p>
        </div>
      )}
    </div>
  );
};

// Cashflow-Übersicht Komponente

export default MietKostenManager;
