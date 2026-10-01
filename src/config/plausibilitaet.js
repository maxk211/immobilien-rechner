// Schwellen der Plausibilitätsprüfung (UX-Paket Teil 3, Abschnitt 8).
// Bewusst Konfiguration statt Code: sobald genug Objekte im System sind,
// lassen sich diese Werte aus den eigenen Daten ableiten.
export const PLAUSI_SCHWELLEN = {
  mieteProQm: { min: 4, max: 25 },            // €/m² Kaltmiete
  kaufpreisfaktor: { min: 10, max: 40, ueblichMin: 15, ueblichMax: 30 },
  hausgeldProQm: { min: 1, max: 5 },           // €/m² im Monat
  sollzins: { min: 0.5, max: 9 },              // % p. a.
  anfangstilgung: { min: 0.5, max: 15 },       // % p. a.
  kaufnebenkosten: { min: 5, max: 18 },        // % vom Kaufpreis
  wohnflaeche: { min: 15, max: 400 },          // m²
  eigenkapitalquote: { min: 0.05 },            // Anteil der Gesamtinvestition
  marktwertFaktor: { min: 0.3, max: 3 },       // Marktwert ÷ Kaufpreis
  marktwertAlterMonate: 18,
  rateAbweichung: 0.05,                        // Rate vs. Zins + Tilgung
  schlusszahlungAbweichung: 0.05,
  // Cockpit-Erinnerung "X Zahlen prüfen": ab 1 Widerspruch oder mehr als 2 gelben Hinweisen
  erinnerung: { rotAb: 1, gelbMehrAls: 2 },
};

// ── "Warum fragt ihr das?" (UX-Gesamtpaket A.3) ─────────────────────────────
// Je Regel: mögliche Ursachen (nach Häufigkeit), was auf dem Spiel steht, woher die
// Spanne kommt. Eine Begründung statt einer Behauptung — sonst klickt man blind
// "Stimmt so". Schlüssel = Regel-ID bzw. ihr Präfix (z. B. "sollzins" für "sollzins-0").
// Jede Funktion bekommt den Kontext c (siehe utils/plausibilitaet.js) und den Hinweis h.
const e0 = (v) => `${Math.round(Number(v) || 0).toLocaleString('de-DE')} €`;
const e2 = (v) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const p1 = (v) => `${(Number(v) || 0).toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`;
const S = PLAUSI_SCHWELLEN;

export const PLAUSI_BEGRUENDUNG = {
  'hausgeld-qm': (c) => ({
    ursachen: [
      'Es stimmt. Aufzug, Tiefgarage, Concierge oder eine hohe Instandhaltungsrücklage treiben das Hausgeld — dann einmal bestätigen, wir fragen nicht wieder.',
      'Es ist ein Jahresbetrag. Der häufigste Eingabefehler.',
      'Es steckt mehr drin als Hausgeld, z. B. die Sondereigentumsverwaltung. Die gehört in ein eigenes Feld, sonst zählt sie doppelt.',
    ],
    auswirkung: `${e0(c.hausgeld)} im Monat gegen ${e0(c.hausgeld)} im Jahr sind ${e0(c.hausgeld * 11)} Unterschied im Cashflow pro Jahr.`,
    spanne: `${e2(S.hausgeldProQm.min)} bis ${e2(S.hausgeldProQm.max)} pro m² ist der übliche Rahmen für Eigentumswohnungen ohne Aufzug.${c.pfHausgeld ? ` Dein eigener Portfolio-Schnitt liegt bei ${e2(c.pfHausgeld.schnitt)}/m².` : ''}`,
  }),
  'miete-qm': (c) => ({
    ursachen: c.mieteQm > S.mieteProQm.max
      ? ['Jahresmiete statt Monatsmiete eingetragen.', 'Warmmiete statt Kaltmiete — die Nebenkosten gehören in ein eigenes Feld.', 'Es stimmt, z. B. möbliert oder Toplage.']
      : ['Die Wohnfläche ist zu groß eingetragen.', 'Es stimmt — z. B. eine geförderte Wohnung oder ein alter Mietvertrag.', 'Ein Teil der Miete fehlt, z. B. Stellplatz oder Zuschlag.'],
    auswirkung: `Die Miete bestimmt Rendite, Cashflow und jede Mieterhöhungs-Erinnerung. ${e0(c.miete)} statt ${e0(c.miete * (c.mieteQm > S.mieteProQm.max ? 1 / 12 : 1))} verschiebt die Bruttorendite auf ${p1(c.kaufpreis > 0 ? c.miete * 12 / c.kaufpreis * 100 : 0)}.`,
    spanne: `${S.mieteProQm.min} bis ${S.mieteProQm.max} €/m² decken fast alle deutschen Wohnungen ab.${c.pfMiete ? ` In deinen anderen ${c.pfMiete.anzahl} Objekten liegt der Schnitt bei ${e2(c.pfMiete.schnitt)}/m² — das ist der bessere Vergleich.` : ''}`,
  }),
  kaufpreisfaktor: (c) => ({
    ursachen: ['Kaufpreis oder Miete falsch eingetragen (Tippfehler, eine Null zu viel oder zu wenig).', 'Monats- und Jahresmiete verwechselt.', 'Es stimmt — z. B. Toplage mit sehr niedriger Rendite oder eine Wohnung mit Altmieter.'],
    auswirkung: `Der Faktor von ${Math.round(c.faktor)} entspricht einer Bruttorendite von ${p1(c.faktor > 0 ? 100 / c.faktor : 0)}. Liegt ein Eingabefehler vor, ist jede Renditekennzahl falsch.`,
    spanne: `Üblich ist das ${S.kaufpreisfaktor.ueblichMin}- bis ${S.kaufpreisfaktor.ueblichMax}-fache der Jahreskaltmiete; unter ${S.kaufpreisfaktor.min} oder über ${S.kaufpreisfaktor.max} kommt praktisch nicht vor.`,
  }),
  sollzins: (c, h) => ({
    ursachen: ['Komma an der falschen Stelle (38 statt 3,8).', 'Effektivzins oder Rate statt Sollzins eingetragen.', 'Es stimmt — z. B. ein sehr altes oder ein gefördertes Darlehen.'],
    auswirkung: `Der Zins bestimmt Rate, Zinsanteil im Cashflow und die Steuer (Schuldzinsen). Bei ${e0(c.fk)} Darlehen macht jeder Prozentpunkt ${e0(c.fk / 100)} im Jahr aus.`,
    spanne: `${p1(S.sollzins.min)} bis ${p1(S.sollzins.max)} deckt alle Baufinanzierungen der letzten 20 Jahre ab. Der Wert steht auf Seite 1 deines Kreditvertrags.`,
  }),
  tilgung: () => ({
    ursachen: ['Tippfehler beim Komma.', 'Bauspardarlehen — die tilgen oft 8 bis 12 % im Jahr.', 'Tilgung in Euro statt in Prozent eingetragen.'],
    auswirkung: 'Die Tilgung bestimmt Rate, Restschuld zum Zinsbindungsende und wann du schuldenfrei bist — und damit die wichtigste Erinnerung.',
    spanne: `${p1(S.anfangstilgung.min)} bis ${p1(S.anfangstilgung.max)} ist der übliche Rahmen; 2 bis 3 % sind der Normalfall.`,
  }),
  rate: () => ({
    ursachen: ['Die Rate enthält Sondertilgung, Kontoführung oder eine Versicherung.', 'Zins oder Tilgung stimmen nicht mit dem Vertrag überein.', 'Es gab schon eine Zinsanpassung.'],
    auswirkung: 'renditly rechnet mit der eingetragenen Rate. Passt sie nicht zu Zins und Tilgung, stimmen Restschuld und Schuldenfrei-Datum nicht.',
    spanne: `Erlaubt ist eine Abweichung bis ${Math.round(S.rateAbweichung * 100)} % gegenüber Darlehen × (Zins + Tilgung) ÷ 12.`,
  }),
  kaufnebenkosten: (c) => ({
    ursachen: ['Betrag statt Prozent eingetragen (oder umgekehrt).', 'Makler vergessen oder doppelt gezählt.', 'Es stimmt — z. B. ohne Makler in einem Land mit niedriger Grunderwerbsteuer.'],
    auswirkung: `Die Kaufnebenkosten bestimmen Gesamtinvestition, Eigenkapitalrendite und die Abschreibung. 1 % Unterschied sind bei diesem Kaufpreis ${e0(c.kaufpreis / 100)}.`,
    spanne: `${S.kaufnebenkosten.min} bis ${S.kaufnebenkosten.max} % — Grunderwerbsteuer je Bundesland (3,5 bis 6,5 %), Notar und Grundbuch rund 1,9 %, Makler bis 3,57 %.`,
  }),
  'kaufnebenkosten-grest': (c) => ({
    ursachen: ['Nur Notar und Grundbuch eingetragen, die Grunderwerbsteuer fehlt.', 'Falsches Bundesland in der Adresse.', 'Es stimmt — z. B. Übertragung in der Familie ohne Grunderwerbsteuer.'],
    auswirkung: 'Fehlt die Grunderwerbsteuer, ist die Gesamtinvestition zu niedrig und die Eigenkapitalrendite zu hoch.',
    spanne: c.grest ? `Grunderwerbsteuer am Kaufdatum: ${p1(c.grest)} — allein das liegt über deinen Kaufnebenkosten.` : 'Grunderwerbsteuer je Bundesland 3,5 bis 6,5 %.',
  }),
  wohnflaeche: () => ({
    ursachen: ['Tippfehler (z. B. 600 statt 60).', 'Nutzfläche oder Grundstück statt Wohnfläche.', 'Es stimmt — Apartment oder sehr große Wohnung.'],
    auswirkung: 'Aus der Wohnfläche entstehen Marktwert (m²-Preis × Fläche), Miete pro m² und Hausgeld pro m².',
    spanne: 'Fast alle Eigentumswohnungen liegen zwischen 15 und 400 m².',
  }),
  'marktwert-faktor': (c) => ({
    ursachen: ['Jahreszahl statt Betrag eingetragen.', 'Eine Null zu viel oder zu wenig.', 'Es stimmt — z. B. nach großer Sanierung oder sehr altem Kauf.'],
    auswirkung: `Der Marktwert treibt Netto-Vermögen und beleihbar frei. Bei ${e0(c.mw)} Marktwert sind das ${e0(Math.max(0, c.mw - c.restschuld))} Netto-Vermögen.`,
    spanne: 'Ein Marktwert unter dem 0,3-fachen oder über dem 3-fachen des Kaufpreises kommt praktisch nur bei Eingabefehlern vor.',
  }),
  'zb-vor-start': () => ({
    ursachen: ['Zinsbindung als Jahr statt als Datum gelesen.', 'Kreditstart falsch — es zählt die Auszahlung, nicht das Kaufdatum.'],
    auswirkung: 'Solange beides nicht zusammenpasst, ist die Restschuld zum Zinsbindungsende nicht berechenbar — und die wichtigste Erinnerung fehlt.',
    spanne: 'Die Zinsbindung endet immer nach dem Kreditstart, meist 5, 10 oder 15 Jahre später.',
  }),
  'nu-ueber-hausgeld': () => ({
    ursachen: ['Jahresbetrag statt Monatsbetrag beim nicht umlagefähigen Teil.', 'Hausgeld zu niedrig eingetragen.'],
    auswirkung: 'Ein Teilbetrag kann nicht größer sein als das Ganze — der Cashflow wäre zu niedrig.',
    spanne: 'Der nicht umlagefähige Anteil liegt meist bei 20 bis 50 % des Hausgelds.',
  }),
  'restschuld-waechst': () => ({
    ursachen: ['Die Rate ist zu niedrig eingetragen.', 'Der Zins ist zu hoch eingetragen.'],
    auswirkung: 'Mit dieser Rate würdest du das Darlehen nie zurückzahlen. Restschuld, Netto-Vermögen und beleihbar frei sind dann falsch.',
    spanne: 'Bei einem Annuitätendarlehen ist die Rate immer größer als die Zinsen.',
  }),
};
export const plausiBegruendung = (h, c) => {
  const key = Object.keys(PLAUSI_BEGRUENDUNG).sort((a, b) => b.length - a.length).find(k => h.id === k || h.id.startsWith(`${k}-`));
  return key ? PLAUSI_BEGRUENDUNG[key](c, h) : null;
};
