// Formatierungsfunktionen

// Fehlende oder ungültige Werte (leer, NaN, Infinity) als "–" statt "NaN €" anzeigen.
const zahlOk = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

export const formatCurrency = (value) =>
  zahlOk(value)
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value))
    : '– €';

export const formatPercent = (value) =>
  zahlOk(value)
    ? new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) / 100)
    : '– %';
