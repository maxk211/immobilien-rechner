import { useState } from 'react';
import { zahlAusText } from '../utils/zahlen.js';

// Zahlenfeld für deutsche Eingaben: „478,10“ und „1.250,50“ werden richtig gelesen (statt still 0),
// beim Tippen springt nichts — der Text bleibt, wie er getippt wird. Ein leeres Feld meldet '' (leer),
// keine erfundene 0. Drop-in für <input type="number">: onChange bekommt { target: { value } } mit
// Punkt als Dezimaltrenner, wie es ein Zahlenfeld liefern würde.
export default function ZahlFeld({ value, onChange, onFocus, onBlur, min, max, step, className = '', ...rest }) {
  const [text, setText] = useState(null); // null = nicht in Bearbeitung → Wert von außen zeigen
  const vonAussen = value === null || value === undefined || Number.isNaN(value) ? '' : String(value).replace('.', ',');
  const sende = (v) => onChange?.({ target: { value: v, name: rest.name, id: rest.id }, currentTarget: { value: v } });
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={className}
      value={text ?? vonAussen}
      onFocus={(e) => { setText(vonAussen); onFocus?.(e); }}
      onBlur={(e) => { setText(null); onBlur?.(e); }}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        if (t.trim() === '') { sende(''); return; }
        if (/^[-+]?[\d.,]*[.,]?$/.test(t.trim()) && /[,.]$/.test(t.trim())) return; // „478,“ — noch am Tippen
        const n = zahlAusText(t);
        if (n === null || n === undefined) return; // ungültig: nichts übernehmen, Text bleibt sichtbar
        let v = n;
        if (min !== undefined && min !== '' && v < Number(min)) v = Number(min);
        if (max !== undefined && max !== '' && v > Number(max)) v = Number(max);
        sende(String(v));
      }}
    />
  );
}
