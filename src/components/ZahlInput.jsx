import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

// Zahlenfeld, das nicht bei jedem Tastendruck durchschreibt (UX-Gesamtpaket B2).
//
// Vorher: Ein Klick ins m²-Preis-Feld und eine gelöschte Ziffer machten aus 2650
// sofort 265 — der Objektwert fiel um 90 %, ohne Warnung und ohne Rückgängig.
//
// Jetzt:
//  - kleine Änderungen werden nach 500 ms Tipp-Pause übernommen,
//  - große Änderungen (über 50 % Abweichung) erst beim Verlassen des Feldes oder mit Enter,
//  - nach jeder Übernahme erscheint „Rückgängig“; bei großen Änderungen zusätzlich ein
//    deutlicher Hinweis mit altem und neuem Wert.
// Drop-in für <input type="number">: gleiche Props, onChange bekommt { target: { value } }.

const fmt = (v) => {
  const x = Number(v);
  return v === '' || v == null || !Number.isFinite(x) ? 'leer' : x.toLocaleString('de-DE', { maximumFractionDigits: 2 });
};
const grosseAenderung = (alt, neu) => {
  const a = Number(alt), b = Number(neu);
  if (!Number.isFinite(a) || a === 0) return false;
  if (neu === '' || neu == null) return true;
  return Math.abs(b - a) / Math.abs(a) > 0.5;
};

export default function ZahlInput({ value, onChange, onBlur, onFocus, onKeyDown, verzoegerung = 500, ...rest }) {
  const [entwurf, setEntwurf] = useState(value ?? '');
  const fokus = useRef(false);
  const timer = useRef(null);
  const zuletzt = useRef(value ?? '');

  // Von außen geänderte Werte übernehmen, solange niemand tippt
  useEffect(() => {
    if (!fokus.current) { setEntwurf(value ?? ''); zuletzt.current = value ?? ''; }
  }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const sende = (v) => onChange?.({ target: { value: v }, currentTarget: { value: v } });

  const uebernehmen = (v) => {
    clearTimeout(timer.current);
    const alt = zuletzt.current;
    if (String(v) === String(alt ?? '')) return;
    zuletzt.current = v;
    sende(v);
    const gross = grosseAenderung(alt, v);
    const rueckgaengig = () => { zuletzt.current = alt; setEntwurf(alt ?? ''); sende(alt ?? ''); };
    toast((t) => (
      <span className="flex items-center gap-3 text-sm">
        <span>
          {gross ? <strong className="text-amber-700">Große Änderung: </strong> : 'Geändert: '}
          {fmt(alt)} → {fmt(v)}
          {gross && Number(alt) ? ` (${Math.round(((Number(v) || 0) - Number(alt)) / Math.abs(Number(alt)) * 100)} %)` : ''}
        </span>
        <button type="button" onClick={() => { rueckgaengig(); toast.dismiss(t.id); }}
          className="px-2 py-0.5 rounded-md bg-gray-900 text-white text-xs font-bold whitespace-nowrap">Rückgängig</button>
      </span>
    ), { id: 'zahl-rueckgaengig', duration: gross ? 10000 : 4000 });
  };

  return (
    <input
      type="number"
      {...rest}
      value={entwurf}
      onFocus={(e) => { fokus.current = true; onFocus?.(e); }}
      onChange={(e) => {
        const v = e.target.value;
        setEntwurf(v);
        clearTimeout(timer.current);
        // Große Sprünge (z. B. gelöschte Ziffer) nie automatisch — erst beim Verlassen
        if (!grosseAenderung(zuletzt.current, v)) timer.current = setTimeout(() => uebernehmen(v), verzoegerung);
      }}
      onBlur={(e) => { fokus.current = false; uebernehmen(e.target.value); onBlur?.(e); }}
      onKeyDown={(e) => { if (e.key === 'Enter') uebernehmen(e.currentTarget.value); onKeyDown?.(e); }}
    />
  );
}
