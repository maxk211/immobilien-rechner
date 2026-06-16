// Gibt die aktuell gültige Kaltmiete zurück, berücksichtigt mietAnpassungen
// Nimmt das aktuellste Datum <= heute aus mietAnpassungen[].kaltmiete
export const getAktuelleMiete = (immobilieOrParams) => {
  const basisMiete = immobilieOrParams.kaltmiete || 0;
  const anpassungen = (immobilieOrParams.mietAnpassungen || []).filter(a => a.kaltmiete != null);
  if (anpassungen.length === 0) return basisMiete;
  const heute = new Date();
  heute.setHours(23, 59, 59, 999);
  const sorted = [...anpassungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
  let aktuelle = null;
  for (const anp of sorted) {
    if (new Date(anp.datum) <= heute) aktuelle = anp;
    else break;
  }
  return aktuelle ? aktuelle.kaltmiete : basisMiete;
};

// Gibt die aktuell gültige Warmmiete (Vermieter→User) zurück, berücksichtigt mietAnpassungen
export const getAktuelleWarmmiete = (p) => {
  const basis = p.eigeneWarmmiete || 0;
  const anpassungen = (p.mietAnpassungen || []).filter(a => a.eigeneWarmmiete != null);
  if (anpassungen.length === 0) return basis;
  const heute = new Date(); heute.setHours(23, 59, 59, 999);
  const sorted = [...anpassungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
  let akt = null;
  for (const anp of sorted) { if (new Date(anp.datum) <= heute) akt = anp; else break; }
  return akt ? akt.eigeneWarmmiete : basis;
};

// Gibt die aktuell gültige Untermiete pro Zimmer zurück, berücksichtigt mietAnpassungen
export const getAktuelleUntermiete = (p) => {
  const basis = p.untermieteProZimmer || 0;
  const anpassungen = (p.mietAnpassungen || []).filter(a => a.untermieteProZimmer != null);
  if (anpassungen.length === 0) return basis;
  const heute = new Date(); heute.setHours(23, 59, 59, 999);
  const sorted = [...anpassungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
  let akt = null;
  for (const anp of sorted) { if (new Date(anp.datum) <= heute) akt = anp; else break; }
  return akt ? akt.untermieteProZimmer : basis;
};

// Berechnet den historisch korrekten Cashflow eines Arbitrage-Objekts Monat für Monat
export const berechneHistorischenArbitrageCashflow = (p, vonDatum, bisDatum) => {
  if (!vonDatum || !bisDatum || vonDatum > bisDatum) return 0;
  const zusatzkosten = (p.arbitrageStrom || 0) + (p.arbitrageInternet || 0) + (p.arbitrageGEZ ?? 18.36);
  const anpassungen = [...(p.mietAnpassungen || [])].sort((a, b) => new Date(a.datum) - new Date(b.datum));
  let gesamt = 0;
  let d = new Date(vonDatum.getFullYear(), vonDatum.getMonth(), 1);
  const ende = new Date(bisDatum.getFullYear(), bisDatum.getMonth(), 1);
  while (d <= ende) {
    const monatsMitte = new Date(d.getFullYear(), d.getMonth(), 15);
    let gueltige = null;
    for (const a of anpassungen) { if (new Date(a.datum) <= monatsMitte) gueltige = a; }
    const warmmiete = gueltige?.eigeneWarmmiete ?? (p.eigeneWarmmiete || 0);
    const untermiete = gueltige?.untermieteProZimmer ?? (p.untermieteProZimmer || 0);
    gesamt += (p.anzahlZimmerVermietet || 0) * untermiete - warmmiete - zusatzkosten;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return gesamt;
};
