import { useState } from 'react';
import { Home, Building2, ArrowLeftRight, MapPin, User, CircleDot, Pencil, X, Users, ChevronDown, ChevronUp, ClipboardList, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuelleUntermiete, getAktuelleWarmmiete } from '../utils/miete.js';
import { berechneWertsteigerungSeitKauf, berechneRestschuld, getAktuellerGesamtwert } from '../utils/berechnung.js';
import { cashflowVorNach, beleihbarFrei, getBeleihungsgrenze } from '../utils/kapital.js';
import SchaetzInfo, { SchaetzZeile, beleihbarFreiInfo } from './SchaetzInfo';

const ImmobilienKarte = ({ immobilie, mieterListe = [], aufgaben = [], onClick, onOpenAufgabe, onDelete, onEdit }) => {
  const [mfhExpanded, setMfhExpanded] = useState(false);
  const isMietimmobilie = immobilie.immobilienTyp === 'mietimmobilie';
  const isMFH = immobilie.immobilienTyp === 'mehrfamilienhaus';
  const aktuellerWert = (!isMietimmobilie && !isMFH) ? getAktuellerGesamtwert(immobilie) : (immobilie.geschaetzterWert || immobilie.kaufpreis);
  const wertsteigerung = (!isMietimmobilie && !isMFH) ? berechneWertsteigerungSeitKauf(immobilie, aktuellerWert) : null;
  const restschuldInfo = (!isMietimmobilie && !isMFH) ? berechneRestschuld(immobilie) : null;

  // MFH: Gesamtmiete aller Wohnungen (auch für Anzeige in der Karte genutzt)
  const mfhGesamtMiete = isMFH ? (immobilie.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0) : 0;

  // Mieter-Anzeige: aktiver Mieter für Kauf-/Mietimmobilien
  const aktiverMieter = (!isMFH)
    ? mieterListe.find(m => m.immobilie_id === immobilie.id && m.aktiv !== false)
    : null;
  // Leerstand nur wenn je ein Mieter registriert war
  const hatteJeMieterEinzel = (!isMFH) && mieterListe.some(m => m.immobilie_id === immobilie.id);

  // MFH: Wohnungen mit Mieterinfos
  const mfhWohnungen = isMFH ? (immobilie.wohnungen || []) : [];

  // Monatlicher Cashflow — einheitliche Berechnung via berechneMtlCashflow
  // Teil 3, Abschnitt 9: Cashflow vor UND nach Tilgung nebeneinander
  const cf = cashflowVorNach(immobilie);
  const cashflow = cf.nach;

  const eigenkapital = (!isMietimmobilie && !isMFH) && restschuldInfo
    ? aktuellerWert - restschuldInfo.restschuld
    : null;

  // Vermieter-Aufgaben, die genau diese Immobilie betreffen (bereits rot→gelb→grau sortiert)
  const eigeneAufgaben = aufgaben.filter(t => t.immoId === immobilie.id);
  const aufgabenRot = eigeneAufgaben.filter(t => t.priority === 'rot').length;
  // Alle Einträge sind offene Punkte — auch 'grau' (informativ, aber unerledigt) zählt mit.
  const aufgabenOffen = eigeneAufgaben.length;

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden border border-gray-100 hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Card Header Strip */}
      <div className="bg-ink px-5 pt-4 pb-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/90 flex items-center gap-1"
                title={isMietimmobilie ? 'Mietimmobilie (Arbitrage: anmieten & untervermieten)' : isMFH ? 'Mehrfamilienhaus' : 'Kaufimmobilie'}
              >
                {isMietimmobilie
                  ? <><ArrowLeftRight size={12}/>Arbitrage</>
                  : isMFH
                    ? <><Building2 size={12}/>MFH · {(immobilie.wohnungen || []).length} WE</>
                    : <><Home size={12}/>Kaufimmobilie</>
                }
              </span>
              {!isMietimmobilie && !isMFH && immobilie.vermietungsmodell && immobilie.vermietungsmodell !== 'kaltmiete' && (
                <span className="text-xs font-medium bg-white/10 text-white/90 px-2 py-0.5 rounded-md">
                  {immobilie.vermietungsmodell === 'kaltmiete_nk' ? 'NK inkl.' : 'Warmmiete'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white leading-tight truncate">
              {immobilie.name || 'Unbenannte Immobilie'}
            </h3>
            {(immobilie.plz || immobilie.adresse) && (
              <p className="text-white/70 text-xs mt-0.5 truncate flex items-center gap-1" title="Adresse">
                <MapPin size={12}/>{immobilie.plz} {immobilie.adresse}
              </p>
            )}
            {!isMFH && (
              <p className="text-white/80 text-xs mt-1 truncate font-medium flex items-center gap-1">
                {aktiverMieter
                  ? <span className="flex items-center gap-1" title="Aktueller Mieter"><User size={14} className="text-white/70"/>{aktiverMieter.name}</span>
                  : hatteJeMieterEinzel
                    ? <span className="text-white/50 flex items-center gap-1" title="Aktuell kein Mieter"><CircleDot size={12} className="text-red-300"/> Leerstand</span>
                    : null
                }
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onOpenAufgabe ? onOpenAufgabe(eigeneAufgaben[0]) : (onClick && onClick()); }}
              className={`px-2 h-6 flex items-center justify-center rounded-full text-[11px] font-bold whitespace-nowrap transition-opacity hover:opacity-90 ${
                aufgabenOffen === 0 ? 'bg-emerald-600 text-white' : aufgabenRot > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              }`}
              title={aufgabenOffen > 0 ? `${aufgabenOffen} offene Aufgabe${aufgabenOffen !== 1 ? 'n' : ''}` : 'Keine offenen Aufgaben'}
            >
              {aufgabenOffen > 0 ? `${aufgabenOffen} offen` : 'alles klar'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
              className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              title="Bearbeiten"
            >
              <Pencil size={14}/>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              title="Löschen"
            >
              <X size={16}/>
            </button>
          </div>
        </div>
      </div>

      {/* Cashflow — Teil 3, Abschnitt 9: nach und vor Tilgung nebeneinander */}
      <div className="mx-5 -mt-3 mb-4">
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm grid grid-cols-2 divide-x divide-gray-100">
          {[
            ['Nach Tilgung', cf.nach, `${cf.nach >= 0 ? '+' : ''}${formatCurrency(cf.nach * 12)} pro Jahr`],
            ['Vor Tilgung', cf.vor, isMietimmobilie ? 'kein Kredit' : cf.hatKredit ? `davon ${formatCurrency(cf.tilgung)} Tilgung` : 'schuldenfrei, keine Tilgung'],
          ].map(([label, wert, sub]) => (
            <div key={label} className="px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
              <div className={`text-lg font-black ${wert >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {wert >= 0 ? '+' : ''}{formatCurrency(wert)}
              </div>
              <div className="text-[11px] text-gray-400 truncate">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-3">
        {/* Eckdaten */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {isMFH ? (
            <>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Kaufpreis</div>
                <div className="text-sm font-semibold text-gray-800">{formatCurrency(immobilie.kaufpreis)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Wohneinheiten</div>
                <div className="text-sm font-semibold text-orange-600">{(immobilie.wohnungen || []).length} WE</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Gesamtfläche</div>
                <div className="text-sm font-semibold text-gray-800">{(immobilie.wohnungen || []).reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0)} m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Gesamtmiete</div>
                <div className="text-sm font-semibold text-emerald-600">{formatCurrency(mfhGesamtMiete)}/Monat</div>
              </div>
            </>
          ) : !isMietimmobilie ? (
            <>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Kaufpreis</div>
                <div className="text-sm font-semibold text-gray-800">{formatCurrency(immobilie.kaufpreis)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Aktueller Wert</div>
                <div className="text-sm font-semibold text-slate-700">{formatCurrency(aktuellerWert)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Wohnfläche</div>
                <div className="text-sm font-semibold text-gray-800">{immobilie.wohnflaeche || '–'} m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Kaltmiete</div>
                <div className="text-sm font-semibold text-emerald-600">{formatCurrency(getAktuelleMiete(immobilie))}/Monat</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Eigene Miete</div>
                <div className="text-sm font-semibold text-red-500">−{formatCurrency(getAktuelleWarmmiete(immobilie))}/Mon</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Untermiet-Einnahmen</div>
                <div className="text-sm font-semibold text-emerald-600">+{formatCurrency((immobilie.anzahlZimmerVermietet||0)*getAktuelleUntermiete(immobilie))}/Mon</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Wohnfläche</div>
                <div className="text-sm font-semibold text-gray-800">{immobilie.wohnflaeche || '–'} m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Vermietet</div>
                <div className="text-sm font-semibold text-gray-800">{immobilie.anzahlZimmerVermietet} von {immobilie.zimmer} Zi.</div>
              </div>
            </>
          )}
        </div>

        {/* MFH: Mieter-Aufklapper */}
        {isMFH && mfhWohnungen.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={(e) => { e.stopPropagation(); setMfhExpanded(v => !v); }}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              title={mfhExpanded ? 'Mieterliste einklappen' : 'Mieterliste aufklappen'}
            >
              <span className="flex items-center gap-1" title="Vermietungsstand"><Users size={14}/>Mieter ({mfhWohnungen.filter(w => w.mieterName && !w.mietende).length}/{mfhWohnungen.length} vermietet)</span>
              <span className="text-gray-400">{mfhExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
            </button>
            {mfhExpanded && (
              <div className="mt-2 space-y-1">
                {mfhWohnungen.map((w, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500 truncate mr-2">{w.name || `WE ${i + 1}`}</span>
                    {(() => {
                      const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date());
                      const jeMieter = !!(w.mieterName || w.mietende || w.mietbeginn);
                      if (belegt) return <span className="font-medium truncate flex items-center gap-0.5 text-gray-800"><User size={12} className="inline"/>{w.mieterName}</span>;
                      if (jeMieter) return <span className="font-medium flex items-center gap-0.5 text-red-400"><CircleDot size={10} className="text-red-400"/>Leerstand</span>;
                      return <span className="text-gray-300 text-xs">Noch kein Mieter</span>;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wertsteigerung (Kaufimmobilie) */}
        {!isMietimmobilie && wertsteigerung && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Wertsteigerung seit Kauf</span>
              <span className={`text-sm font-bold ${wertsteigerung.absoluteSteigerung >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {wertsteigerung.absoluteSteigerung >= 0 ? '+' : ''}{formatCurrency(wertsteigerung.absoluteSteigerung)}
                <span className="text-xs font-medium ml-1 opacity-75">
                  ({wertsteigerung.prozentSteigerung >= 0 ? '+' : ''}{wertsteigerung.prozentSteigerung.toFixed(1)}%)
                </span>
              </span>
            </div>
            {eigenkapital !== null && restschuldInfo && aktuellerWert > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400">Restschuld</div>
                  <div className={`text-sm font-semibold ${restschuldInfo.restschuld > 0 ? 'text-orange-600' : 'text-emerald-700'}`}>{restschuldInfo.restschuld > 0 ? formatCurrency(restschuldInfo.restschuld) : 'schuldenfrei'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400" title="Marktwert minus Restschuld — nicht das eingebrachte Eigenkapital">Netto-Vermögen</div>
                  <div className="text-sm font-semibold text-gray-800">{formatCurrency(eigenkapital)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 flex items-center">Beleihbar frei
                    <SchaetzInfo {...beleihbarFreiInfo({ grenze: getBeleihungsgrenze(), marktwert: aktuellerWert, restschuld: restschuldInfo.restschuld,
                      onGrenze: () => window.dispatchEvent(new Event('renditly-beleihungsgrenze-dialog')),
                      onMarktwert: onOpenAufgabe ? () => onOpenAufgabe({ targetTab: 'stammdaten' }) : null })} />
                  </div>
                  <div className="text-sm font-semibold text-emerald-700">{formatCurrency(beleihbarFrei(aktuellerWert, restschuldInfo.restschuld))}</div>
                  <SchaetzZeile>Schätzung bei {getBeleihungsgrenze()} %</SchaetzZeile>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
// Portfolio-Übersicht Komponente

export default ImmobilienKarte;
