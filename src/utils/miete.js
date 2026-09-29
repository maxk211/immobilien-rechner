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

// EINZIGE Quelle der Wahrheit für den Mietstatus eines Monats — vorher hatten
// die Cashflow-Ampel (KaufimmobilieDetail/MehrfamilienhausDetail, prüfte nur
// "existiert irgendein Eintrag") und der MieteinnahmenTracker (prüfte Summe
// gegen erwarteten Betrag) unterschiedliche Logik und konnten für denselben
// Monat widersprüchliche Status zeigen (z.B. Ampel "eingegangen" bei einer
// Teilzahlung, die der Tracker korrekt als "teilweise"/offen einstuft).
// Alle drei Stellen müssen ab jetzt diese Funktion nutzen.
// status: 'dauerauftrag' | 'nicht_bezahlt' | 'bezahlt' | 'teilweise' | 'offen'
export const berechneMietStatusFuerMonat = (mietEingaenge, jahr, monatNr, erwarteterBetrag, isDauerauftrag) => {
  // Zuordnung zum Monat: ein gebuchter Monat (e.monat = "JJJJ-MM") hat Vorrang vor dem
  // Zahlungsdatum. Sonst landete eine nachträglich abgehakte Miete (Buchung heute) im
  // aktuellen Monat, und der vergessene Monat blieb offen.
  const monatKey = `${jahr}-${String(monatNr).padStart(2, '0')}`;
  const monatEintraege = (mietEingaenge || []).filter(e => {
    if (e.monat) return e.monat === monatKey;
    const d = new Date(e.datum);
    return d.getFullYear() === jahr && (d.getMonth() + 1) === monatNr;
  });
  const ausnahmen = monatEintraege.filter(e => e.typ === 'ausnahme');
  const zahlungen = monatEintraege.filter(e => e.typ !== 'ausnahme');
  const summe = zahlungen.reduce((s, e) => s + (parseFloat(e.betrag) || 0), 0);

  let status;
  if (ausnahmen.some(e => e.ausnahmeTyp === 'nicht_bezahlt')) {
    status = 'nicht_bezahlt';
  } else if (isDauerauftrag && ausnahmen.length === 0) {
    status = 'dauerauftrag';
  } else if (summe >= erwarteterBetrag && summe > 0) {
    status = 'bezahlt';
  } else if (summe > 0) {
    status = 'teilweise';
  } else {
    status = 'offen';
  }
  return { status, summe, zahlungen, ausnahmen, letzterEintrag: zahlungen[zahlungen.length - 1] || null };
};

// Berechnet den historisch korrekten Cashflow eines Arbitrage-Objekts Monat für Monat
export const berechneHistorischenArbitrageCashflow = (p, vonDatum, bisDatum) => {
  if (!vonDatum || !bisDatum || vonDatum > bisDatum) return 0;
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
    gesamt += (p.anzahlZimmerVermietet || 0) * untermiete - warmmiete - arbitrageZusatzkosten(p, monatsMitte);
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return gesamt;
};

// ── Wer zahlt eine Kostenposition? ─────────────────────────────────────────
// params.kostenZahler = { [feld]: [{ ab: 'JJJJ-MM-TT', zahler: 'ich' | 'mieter' }] }
// Ohne Eintrag zahlt der Eigentümer/Hauptmieter ("ich"). Ein Wechsel gilt ab seinem
// Datum und darf rückwirkend eingetragen werden (z. B. "Rundfunk ab März zahlt die Firma").
// Zahlt der Mieter direkt, ist die Position weder Kosten noch Einnahme für dich.
export const ZAHLER_LABEL = { ich: 'Ich', mieter: 'Mieter / Firma zahlt direkt' };

export const zahltIchAm = (params, feld, datum = new Date()) => {
  const liste = [...((params?.kostenZahler || {})[feld] || [])].sort((a, b) => new Date(a.ab) - new Date(b.ab));
  let zahler = 'ich';
  for (const e of liste) { if (new Date(e.ab) <= datum) zahler = e.zahler; }
  return zahler === 'ich';
};

// Anteil der Monate eines Jahres, in denen ich zahle (0…1) — für Jahreswerte
export const zahlerAnteilJahr = (params, feld, jahr) => {
  const liste = (params?.kostenZahler || {})[feld];
  if (!liste || liste.length === 0) return 1;
  let m = 0;
  for (let i = 0; i < 12; i++) if (zahltIchAm(params, feld, new Date(jahr, i, 15))) m++;
  return m / 12;
};

// Laufende Zusatzkosten einer Arbitrage-Wohnung (Strom, Internet, Rundfunk, weitere),
// nur die Positionen, die ich selbst trage. datum = Stichtag (Standard: heute).
export const arbitrageZusatzkosten = (p, datum = new Date()) =>
  (zahltIchAm(p, 'arbitrageStrom', datum) ? (p.arbitrageStrom || 0) : 0)
  + (zahltIchAm(p, 'arbitrageInternet', datum) ? (p.arbitrageInternet || 0) : 0)
  + (zahltIchAm(p, 'arbitrageGEZ', datum) ? (p.arbitrageGEZ ?? 18.36) : 0)
  + (zahltIchAm(p, 'arbitrageHeizung', datum) ? (p.arbitrageHeizung || 0) : 0)
  + (zahltIchAm(p, 'arbitrageSonstige', datum) ? (p.arbitrageSonstige || 0) : 0);

// Jahresdurchschnitt pro Monat (berücksichtigt Zahler-Wechsel im Jahr)
export const arbitrageZusatzkostenJahr = (p, jahr) => {
  let s = 0;
  for (let i = 0; i < 12; i++) s += arbitrageZusatzkosten(p, new Date(jahr, i, 15));
  return s / 12;
};

// Kurzer Text der Positionen, die ich heute selbst trage (für Aufschlüsselungen)
export const arbitrageKostenText = (p, fmt) => [
  ['arbitrageStrom', 'Strom', p.arbitrageStrom || 0],
  ['arbitrageHeizung', 'Heizung', p.arbitrageHeizung || 0],
  ['arbitrageInternet', 'Internet', p.arbitrageInternet || 0],
  ['arbitrageGEZ', 'Rundfunk', p.arbitrageGEZ ?? 18.36],
  ['arbitrageSonstige', 'Weitere', p.arbitrageSonstige || 0],
].filter(([f, , v]) => v > 0 && zahltIchAm(p, f)).map(([, l, v]) => `${l} ${fmt(v)}`).join(' · ') || 'keine';
