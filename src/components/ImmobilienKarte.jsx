import { useState } from 'react';
import { Home, Building2, ArrowLeftRight, MapPin, User, CircleDot, Pencil, X, Users, ChevronDown, ChevronUp, ClipboardList, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuelleUntermiete } from '../utils/miete.js';
import { berechneWertsteigerungSeitKauf, berechneRestschuld, berechneMtlCashflow, getAktuellerGesamtwert } from '../utils/berechnung.js';

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
  const cashflow = berechneMtlCashflow(immobilie);
  const cashflowPositiv = cashflow >= 0;

  // Typ-Akzentfarbe — nur als dezenter Badge-Ton, der Kartenkopf selbst
  // bleibt für alle Typen einheitlich dunkel (ruhiger als drei Gradients).
  const typAkzent = isMietimmobilie
    ? { text: 'text-honey-200', bg: 'bg-honey-400/15' }
    : isMFH
      ? { text: 'text-sage-200', bg: 'bg-sage-400/15' }
      : { text: 'text-clay-200', bg: 'bg-clay-400/15' };

  const eigenkapital = (!isMietimmobilie && !isMFH) && restschuldInfo
    ? aktuellerWert - restschuldInfo.restschuld
    : null;

  // Vermieter-Aufgaben, die genau diese Immobilie betreffen (bereits rot→gelb→grün sortiert)
  const eigeneAufgaben = aufgaben.filter(t => t.immoId === immobilie.id);
  const aufgabenRot = eigeneAufgaben.filter(t => t.priority === 'rot').length;
  const aufgabenOffen = eigeneAufgaben.filter(t => t.priority !== 'gruen').length;

  return (
    <div
      className="bg-white rounded-2xl border border-cream-200 hover:border-cream-300 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Card Header Strip */}
      <div className="bg-cream-900 px-5 pt-4 pb-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typAkzent.bg} ${typAkzent.text} flex items-center gap-1`}>
                {isMietimmobilie
                  ? <><ArrowLeftRight size={12}/>Arbitrage</>
                  : isMFH
                    ? <><Building2 size={12}/>MFH · {(immobilie.wohnungen || []).length} WE</>
                    : <><Home size={12}/>Kaufimmobilie</>
                }
              </span>
              {!isMietimmobilie && !isMFH && immobilie.vermietungsmodell && immobilie.vermietungsmodell !== 'kaltmiete' && (
                <span className="text-xs font-medium bg-white/10 text-cream-100 px-2 py-0.5 rounded-full">
                  {immobilie.vermietungsmodell === 'kaltmiete_nk' ? 'NK inkl.' : 'Warmmiete'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white leading-tight truncate">
              {immobilie.name || 'Unbenannte Immobilie'}
            </h3>
            {(immobilie.plz || immobilie.adresse) && (
              <p className="text-cream-300 text-xs mt-0.5 truncate flex items-center gap-1">
                <MapPin size={12}/>{immobilie.plz} {immobilie.adresse}
              </p>
            )}
            {!isMFH && (
              <p className="text-cream-200 text-xs mt-1 truncate font-medium flex items-center gap-1">
                {aktiverMieter
                  ? <><User size={14} className="text-cream-400"/>{aktiverMieter.name}</>
                  : hatteJeMieterEinzel
                    ? <span className="text-cream-400 flex items-center gap-1"><CircleDot size={12} className="text-brick-300"/> Leerstand</span>
                    : null
                }
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onOpenAufgabe ? onOpenAufgabe(eigeneAufgaben[0]) : (onClick && onClick()); }}
              className="relative w-7 h-7 flex items-center justify-center text-cream-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={aufgabenOffen > 0 ? `${aufgabenOffen} offene Aufgabe${aufgabenOffen !== 1 ? 'n' : ''}` : 'Keine offenen Aufgaben'}
            >
              {aufgabenOffen > 0
                ? <ClipboardList size={14}/>
                : <CheckCircle2 size={14} className="text-cream-500"/>
              }
              {aufgabenOffen > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white leading-none ${aufgabenRot > 0 ? 'bg-brick-500' : 'bg-honey-400'}`}>
                  {aufgabenOffen}
                </span>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
              className="w-7 h-7 flex items-center justify-center text-cream-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Bearbeiten"
            >
              <Pencil size={14}/>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 flex items-center justify-center text-cream-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Löschen"
            >
              <X size={16}/>
            </button>
          </div>
        </div>
      </div>

      {/* Cashflow Hero — pulled up over die Kante */}
      <div className="mx-5 -mt-3 mb-4">
        <div className={`rounded-xl px-4 py-3 flex items-center justify-between border ${cashflowPositiv ? 'bg-sage-50 border-sage-200' : 'bg-brick-50 border-brick-200'}`}>
          <div>
            <div className="text-xs text-cream-500 font-medium">Monatlicher Cashflow</div>
            <div className={`text-xl font-semibold ${cashflowPositiv ? 'text-sage-700' : 'text-brick-600'}`}>
              {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-cream-500 font-medium">pro Jahr</div>
            <div className={`text-sm font-semibold ${cashflowPositiv ? 'text-sage-700' : 'text-brick-600'}`}>
              {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow * 12)}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-3">
        {/* Eckdaten */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {isMFH ? (
            <>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Kaufpreis</div>
                <div className="text-sm font-semibold text-cream-800">{formatCurrency(immobilie.kaufpreis)}</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Wohneinheiten</div>
                <div className="text-sm font-semibold text-clay-600">{(immobilie.wohnungen || []).length} WE</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Gesamtfläche</div>
                <div className="text-sm font-semibold text-cream-800">{(immobilie.wohnungen || []).reduce((s, w) => s + (Number(w.wohnflaeche) || 0), 0)} m²</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Gesamtmiete</div>
                <div className="text-sm font-semibold text-sage-600">{formatCurrency(mfhGesamtMiete)}/Monat</div>
              </div>
            </>
          ) : !isMietimmobilie ? (
            <>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Kaufpreis</div>
                <div className="text-sm font-semibold text-cream-800">{formatCurrency(immobilie.kaufpreis)}</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Aktueller Wert</div>
                <div className="text-sm font-semibold text-cream-700">{formatCurrency(aktuellerWert)}</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Wohnfläche</div>
                <div className="text-sm font-semibold text-cream-800">{immobilie.wohnflaeche} m²</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Kaltmiete</div>
                <div className="text-sm font-semibold text-sage-600">{formatCurrency(getAktuelleMiete(immobilie))}/Monat</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Eigene Miete</div>
                <div className="text-sm font-semibold text-brick-500">−{formatCurrency(immobilie.eigeneWarmmiete)}/Mon</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Untermiet-Einnahmen</div>
                <div className="text-sm font-semibold text-sage-600">+{formatCurrency((immobilie.anzahlZimmerVermietet||0)*getAktuelleUntermiete(immobilie))}/Mon</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Wohnfläche</div>
                <div className="text-sm font-semibold text-cream-800">{immobilie.wohnflaeche} m²</div>
              </div>
              <div>
                <div className="text-xs text-cream-400 uppercase tracking-wide">Vermietet</div>
                <div className="text-sm font-semibold text-cream-800">{immobilie.anzahlZimmerVermietet} von {immobilie.zimmer} Zi.</div>
              </div>
            </>
          )}
        </div>

        {/* MFH: Mieter-Aufklapper */}
        {isMFH && mfhWohnungen.length > 0 && (
          <div className="border-t border-cream-100 pt-3">
            <button
              onClick={(e) => { e.stopPropagation(); setMfhExpanded(v => !v); }}
              className="w-full flex items-center justify-between text-xs font-semibold text-cream-500 hover:text-cream-800 transition-colors"
            >
              <span className="flex items-center gap-1"><Users size={14}/>Mieter ({mfhWohnungen.filter(w => w.mieterName && !w.mietende).length}/{mfhWohnungen.length} vermietet)</span>
              <span className="text-cream-400">{mfhExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
            </button>
            {mfhExpanded && (
              <div className="mt-2 space-y-1">
                {mfhWohnungen.map((w, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-cream-100 last:border-0">
                    <span className="text-cream-500 truncate mr-2">{w.name || `WE ${i + 1}`}</span>
                    {(() => {
                      const belegt = w.mieterName && (!w.mietende || new Date(w.mietende) >= new Date());
                      const jeMieter = !!(w.mieterName || w.mietende || w.mietbeginn);
                      if (belegt) return <span className="font-medium truncate flex items-center gap-0.5 text-cream-800"><User size={12} className="inline"/>{w.mieterName}</span>;
                      if (jeMieter) return <span className="font-medium flex items-center gap-0.5 text-brick-400"><CircleDot size={10} className="text-brick-400"/>Leerstand</span>;
                      return <span className="text-cream-300 text-xs">Noch kein Mieter</span>;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wertsteigerung (Kaufimmobilie) */}
        {!isMietimmobilie && wertsteigerung && (
          <div className="bg-cream-50 rounded-xl p-3 border border-cream-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-cream-500 font-medium">Wertsteigerung seit Kauf</span>
              <span className={`text-sm font-semibold ${wertsteigerung.absoluteSteigerung >= 0 ? 'text-sage-600' : 'text-brick-500'}`}>
                {wertsteigerung.absoluteSteigerung >= 0 ? '+' : ''}{formatCurrency(wertsteigerung.absoluteSteigerung)}
                <span className="text-xs font-medium ml-1 opacity-75">
                  ({wertsteigerung.prozentSteigerung >= 0 ? '+' : ''}{wertsteigerung.prozentSteigerung.toFixed(1)}%)
                </span>
              </span>
            </div>
            {eigenkapital !== null && restschuldInfo && restschuldInfo.anfangsFremdkapital > 0 && (
              <div className="mt-2 pt-2 border-t border-cream-200 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-cream-400">Restschuld</div>
                  <div className="text-sm font-semibold text-clay-600">{formatCurrency(restschuldInfo.restschuld)}</div>
                </div>
                <div>
                  <div className="text-xs text-cream-400">Netto-Eigenkapital</div>
                  <div className="text-sm font-semibold text-clay-700">{formatCurrency(eigenkapital)}</div>
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
