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

// Generische Version von getAktuelleMiete für beliebige Felder (Vermieterkosten,
// WEG/Betriebskosten etc.) — funktioniert ähnlich, nur mit variablem Feldnamen
// statt fest "kaltmiete". Nutzt dieselben datumsbasierten mietAnpassungen-
// Einträge; ein Eintrag kann mehrere Felder gleichzeitig tragen (z.B. eine
// Mieterhöhung UND eine Hausgeld-Anpassung zum selben Datum). Eine alte,
// manuell gesetzte Jahres-Override in mietHistorie[aktuellesJahr][feld] hat
// weiterhin Vorrang (Bestandsdaten aus der Zeit vor der Anpassungsliste).
export const getAktuellerWert = (params, feld) => {
  const basis = params[feld] || 0;
  const jahr = new Date().getFullYear();
  const histWert = (params.mietHistorie || {})[`${jahr}`]?.[feld];
  if (histWert != null) return histWert;
  const anpassungen = (params.mietAnpassungen || []).filter(a => a[feld] != null);
  if (anpassungen.length === 0) return basis;
  const heute = new Date();
  heute.setHours(23, 59, 59, 999);
  const sorted = [...anpassungen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
  let aktuelle = null;
  for (const anp of sorted) {
    if (new Date(anp.datum) <= heute) aktuelle = anp;
    else break;
  }
  return aktuelle ? aktuelle[feld] : basis;
};

// Monatlich gewichteter Jahresdurchschnitt für ein beliebiges Feld — berück-
// sichtigt unterjährige Anpassungen (analog zur bestehenden getMieteForJahr-
// Logik in CashflowUebersicht, hier generalisiert). Eine alte, manuell gesetzte
// Jahres-Override in mietHistorie[jahr][feld] hat weiterhin Vorrang (Bestands-
// daten aus der Zeit vor der datumsgenauen Anpassungsliste bleiben gültig).
export const getJahresDurchschnittFuerFeld = (params, jahr, feld) => {
  const histWert = (params.mietHistorie || {})[`${jahr}`]?.[feld];
  if (histWert != null) return histWert;
  const anpassungen = (params.mietAnpassungen || [])
    .filter(a => a[feld] != null)
    .sort((a, b) => new Date(a.datum) - new Date(b.datum));
  if (anpassungen.length === 0) return params[feld] || 0;
  let summe = 0;
  for (let m = 0; m < 12; m++) {
    const monatsMitte = new Date(jahr, m, 15);
    let gueltige = null;
    for (const a of anpassungen) { if (new Date(a.datum) <= monatsMitte) gueltige = a; }
    summe += gueltige ? gueltige[feld] : (params[feld] || 0);
  }
  return summe / 12;
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
