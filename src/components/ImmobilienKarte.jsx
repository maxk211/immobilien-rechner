import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete } from '../utils/miete.js';
import { berechneWertsteigerungSeitKauf, berechneRestschuld, berechneMtlCashflow } from '../utils/berechnung.js';

const ImmobilienKarte = ({ immobilie, onClick, onDelete, onEdit }) => {
  const isMietimmobilie = immobilie.immobilienTyp === 'mietimmobilie';
  const isMFH = immobilie.immobilienTyp === 'mehrfamilienhaus';
  const aktuellerWert = immobilie.geschaetzterWert || immobilie.kaufpreis;
  const wertsteigerung = (!isMietimmobilie && !isMFH) ? berechneWertsteigerungSeitKauf(immobilie, aktuellerWert) : null;
  const restschuldInfo = (!isMietimmobilie && !isMFH) ? berechneRestschuld(immobilie) : null;

  // MFH: Gesamtmiete aller Wohnungen (auch für Anzeige in der Karte genutzt)
  const mfhGesamtMiete = isMFH ? (immobilie.wohnungen || []).reduce((s, w) => s + (Number(w.kaltmiete) || 0), 0) : 0;

  // Monatlicher Cashflow — einheitliche Berechnung via berechneMtlCashflow
  const cashflow = berechneMtlCashflow(immobilie);
  const cashflowPositiv = cashflow >= 0;

  // Tile accent color — psychologisch: Slate=Vertrauen/Premium, Teal=Cashflow/Wachstum, Amber=Ertrag
  const accentClass = isMietimmobilie
    ? 'from-emerald-500 to-emerald-700'
    : isMFH
      ? 'from-amber-600 to-orange-700'
      : 'from-slate-700 to-slate-900';

  const eigenkapital = (!isMietimmobilie && !isMFH) && restschuldInfo
    ? aktuellerWert - restschuldInfo.restschuld
    : null;

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden border border-gray-100 hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Card Header Strip */}
      <div className={`bg-gradient-to-r ${accentClass} px-5 pt-4 pb-5`}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {isMietimmobilie ? '🔄 Arbitrage' : isMFH ? `🏘️ MFH · ${(immobilie.wohnungen || []).length} WE` : '🏠 Kaufimmobilie'}
              </span>
              {!isMietimmobilie && !isMFH && immobilie.vermietungsmodell && immobilie.vermietungsmodell !== 'kaltmiete' && (
                <span className="text-xs font-medium bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {immobilie.vermietungsmodell === 'kaltmiete_nk' ? 'NK inkl.' : 'Warmmiete'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white leading-tight truncate">
              {immobilie.name || 'Unbenannte Immobilie'}
            </h3>
            {(immobilie.plz || immobilie.adresse) && (
              <p className="text-white/70 text-xs mt-0.5 truncate">
                📍 {immobilie.plz} {immobilie.adresse}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
              className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition-colors text-sm"
              title="Bearbeiten"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 rounded-lg text-xl leading-none transition-colors"
              title="Löschen"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Cashflow Hero — pulled up over the border */}
      <div className="mx-5 -mt-3 mb-4">
        <div className={`rounded-xl px-4 py-3 flex items-center justify-between shadow-sm ${cashflowPositiv ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <div>
            <div className="text-xs text-gray-500 font-medium">Monatlicher Cashflow</div>
            <div className={`text-xl font-black ${cashflowPositiv ? 'text-emerald-600' : 'text-red-600'}`}>
              {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-medium">pro Jahr</div>
            <div className={`text-sm font-bold ${cashflowPositiv ? 'text-emerald-600' : 'text-red-600'}`}>
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
                <div className="text-sm font-semibold text-gray-800">{immobilie.wohnflaeche} m²</div>
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
                <div className="text-sm font-semibold text-red-500">−{formatCurrency(immobilie.eigeneWarmmiete)}/Mon</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Untermiet-Einnahmen</div>
                <div className="text-sm font-semibold text-emerald-600">+{formatCurrency((immobilie.anzahlZimmerVermietet||0)*(immobilie.untermieteProZimmer||0))}/Mon</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Wohnfläche</div>
                <div className="text-sm font-semibold text-gray-800">{immobilie.wohnflaeche} m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Vermietet</div>
                <div className="text-sm font-semibold text-gray-800">{immobilie.anzahlZimmerVermietet} von {immobilie.zimmer} Zi.</div>
              </div>
            </>
          )}
        </div>

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
            {eigenkapital !== null && restschuldInfo && restschuldInfo.anfangsFremdkapital > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400">Restschuld</div>
                  <div className="text-sm font-semibold text-orange-600">{formatCurrency(restschuldInfo.restschuld)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Netto-Eigenkapital</div>
                  <div className="text-sm font-semibold text-amber-700">{formatCurrency(eigenkapital)}</div>
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
