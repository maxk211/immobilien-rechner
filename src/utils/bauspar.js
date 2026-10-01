// Bausparvertrag (UX-Gesamtpaket A.7)
// Felder je Vertrag (immo.bausparvertraege[]):
//   id, rolle: 'tilgungsersatz' | 'ruecklage', bausparkasse, vertragsnummer,
//   bausparsumme, monatlicheSparrate, vertragSeit ('JJJJ-MM-TT'),
//   aktuellerSparbetrag (optional, überschreibt die Rechnung), guthabenzins (% p. a.),
//   zuteilungsreifAb (optional — sonst geschätzt), darlehenszins (% p. a.)
// Rolle steuert den Cashflow: Tilgungsersatz zählt wie Tilgung (Vermögensaufbau, nicht in
// "vor Tilgung"), Rücklage zählt als laufende Kosten. Ohne Rolle: wie bisher als Kosten.

export const MINDEST_GUTHABEN = 0.4; // übliches Mindestsparguthaben für die Zuteilung (40 %)
const n = (v) => Number(v) || 0;
const monateZwischen = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());

// Guthaben zu einem Datum: eingetragener Stand (zum heutigen Tag) oder Sparrate × Monate + einfache Guthabenzinsen
export function bausparGuthaben(v, datum = new Date()) {
  const rate = n(v.monatlicheSparrate);
  const zins = n(v.guthabenzins) / 100;
  const heute = new Date();
  if (v.aktuellerSparbetrag != null && v.aktuellerSparbetrag !== '' && n(v.aktuellerSparbetrag) > 0) {
    const m = Math.max(0, monateZwischen(heute, datum));
    return n(v.aktuellerSparbetrag) * (1 + zins * m / 12) + rate * m;
  }
  if (!v.vertragSeit) return 0;
  const m = Math.max(0, monateZwischen(new Date(v.vertragSeit), datum));
  return rate * m * (1 + zins * m / 24); // Zinsen auf das durchschnittliche Guthaben
}

// Zuteilung: eingetragen oder geschätzt (Mindestguthaben erreicht)
export function bausparZuteilung(v) {
  if (v.zuteilungsreifAb) return { datum: new Date(v.zuteilungsreifAb), geschaetzt: false };
  const ziel = n(v.bausparsumme) * MINDEST_GUTHABEN;
  if (!(ziel > 0) || !(n(v.monatlicheSparrate) > 0)) return null;
  const start = v.vertragSeit ? new Date(v.vertragSeit) : new Date();
  for (let m = 0; m <= 600; m++) {
    const d = new Date(start.getFullYear(), start.getMonth() + m, 1);
    if (bausparGuthaben(v, d) >= ziel) return { datum: d, geschaetzt: true };
  }
  return null;
}

export function bausparStand(v, heute = new Date()) {
  const z = bausparZuteilung(v);
  const guthabenHeute = bausparGuthaben(v, heute);
  const guthabenZuteilung = z ? bausparGuthaben(v, z.datum) : null;
  const darlehen = z ? Math.max(0, n(v.bausparsumme) - guthabenZuteilung) : null;
  const zinsDarlehen = n(v.darlehenszins) / 100;
  // Darlehensphase: übliche Tilgungsbeiträge ~ 6 ‰ der Bausparsumme im Monat
  const darlehensRate = n(v.bausparsumme) * 0.006;
  let laufzeitMonate = null;
  if (darlehen > 0 && darlehensRate > darlehen * zinsDarlehen / 12) {
    let rs = darlehen; laufzeitMonate = 0;
    while (rs > 0.5 && laufzeitMonate < 600) { rs -= darlehensRate - rs * zinsDarlehen / 12; laufzeitMonate++; }
  }
  return {
    zuteilung: z?.datum || null, zuteilungGeschaetzt: !!z?.geschaetzt,
    guthabenHeute, guthabenZuteilung, darlehen, darlehensRate, laufzeitMonate,
    aktiv: !z || z.datum > heute, // Ansparphase läuft
  };
}

// Sparraten aktiver Verträge, getrennt nach Wirkung auf den Cashflow
export function bausparMonat(immo, heute = new Date()) {
  let tilgung = 0, kosten = 0;
  (immo?.bausparvertraege || []).forEach(v => {
    const z = v.zuteilungsreifAb ? new Date(v.zuteilungsreifAb) : null;
    if (z && z <= heute) return; // nach Zuteilung keine Sparrate mehr
    const r = parseFloat(v.monatlicheSparrate) || 0;
    if (v.rolle === 'tilgungsersatz') tilgung += r; else kosten += r;
  });
  return { tilgung, kosten, gesamt: tilgung + kosten };
}
