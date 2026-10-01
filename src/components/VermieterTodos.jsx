import { useMemo, useState } from 'react';
import {
  CheckCircle2, ChevronDown, Landmark, TrendingDown, ClipboardList,
  Key, TrendingUp, CalendarDays, AlertTriangle, Building2, ScrollText,
} from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuelleUntermiete, berechneMietStatusFuerMonat } from '../utils/miete.js';
import { offeneRueckzahlungen, rateEingegangen } from '../utils/nachforderung.js';
import { finanzierungsStatus, formatMonatJahr } from '../utils/finanzierung.js';
import { darlehensVerlauf } from '../utils/darlehen.js';
import { pruefeImmobilie, zaehle, brauchtErinnerung } from '../utils/plausibilitaet.js';

// Abschnitt 5 (Erinnerungs-Engine): 3 Stufen statt der alten rot/gelb/grün-Logik —
// "grün" suggerierte fälschlich "erledigt", dabei sind das offene, nur unkritische
// Punkte. "grau" nach PDF-Vorlage für rein informative Hinweise ohne Frist-Druck.
const PRIORITAET = { rot: 0, gelb: 1, grau: 2 };

// Exportiert, damit Portfolio-Kacheln und die Immobilien-Übersicht dieselbe
// Aufgaben-Logik nutzen können (gefiltert auf immoId) statt sie zu duplizieren.
// Jede Erinnerung trägt laut Abschnitt 5 Objektbezug/Kategorie/Text/Stufe/1 Aktion.
export function generiereAufgaben(portfolio, mieterListe, nkAbrechnungen) {
  const todos = [];
  const heute = new Date();
  const aktuellesJahr = heute.getFullYear();
  const aktuellerMonat = heute.getMonth() + 1;
  const letztesJahr = aktuellesJahr - 1;

  // UX-Paket Teil 2, Fehler 4: Eine Erinnerung darf nur feuern, wenn der
  // betroffene Zeitraum vollständig nach dem Eigentumsdatum liegt.
  const gehoertSeit = (immo) => {
    const d = immo.kaufdatum || immo.mietvertragStart;
    return d ? new Date(d) : null;
  };
  const zeitraumNachEigentum = (immo, von) => {
    const seit = gehoertSeit(immo);
    return !seit || seit <= von;
  };

  // ── 1. Zinsbindung läuft ab ───────────────────────────────────────────────
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;

    // Kein Kredit vorhanden → keine Zinsbindungswarnung
    const kaufpreis = immo.kaufpreis || 0;
    if (immo.geschenkt || immo.vollEigenfinanziert || kaufpreis <= 0) return;
    const ekFuerKaufpreis = immo.ekFuerKaufpreis != null ? immo.ekFuerKaufpreis : (immo.eigenkapital || 0);
    const kreditbetrag = kaufpreis - ekFuerKaufpreis;
    if (kreditbetrag < 1) return; // vollständig eigenfinanziert

    // UX-Paket Teil 3, Abschnitt 6: Alarm nur für die aktive/letzte Phase —
    // eine Phase mit Folgephase ist Historie. Dazu Lücken-Hinweis und
    // leiser Forward-Hinweis ab 60 Monaten. Zinsbindungsende ist ein Datum;
    // ein nur geschätztes Datum wird als "ungeprüft" gekennzeichnet.
    const st = finanzierungsStatus(immo, heute);
    if (!st) return;
    const name = immo.name || immo.adresse || 'Immobilie';
    if (st.luecke) {
      todos.push({
        id: `finanzierung-luecke-${immo.id}`, priority: 'gelb', icon: <Landmark size={16} />,
        kategorie: 'Finanzierung',
        titel: `Zwischen ${formatMonatJahr(st.luecke.von)} und ${formatMonatJahr(st.luecke.bis)} fehlt eine Finanzierung`,
        sub: name, immoId: immo.id, badge: 'Prüfen', targetTab: 'finanzierung',
      });
    }
    if (st.stufe === 'neutral' || st.monate == null) return;
    const ungeprueft = st.letzte.endeGeschaetzt ? ' (Datum ungeprüft)' : '';
    const ende = formatMonatJahr(st.letzte.ende);
    todos.push({
      id: `zinsbindung-${immo.id}`,
      priority: st.stufe,
      icon: <Landmark size={16} />,
      kategorie: 'Finanzierung',
      titel: st.stufe === 'rot'
        ? `Zinsbindung seit ${ende} abgelaufen — keine Anschlussfinanzierung hinterlegt${ungeprueft}`
        : st.stufe === 'gelb'
          ? `Zinsbindung endet ${ende} — noch ${Math.ceil(st.monate)} Monate${ungeprueft}`
          : `Zinsbindung endet ${ende} — Forward-Darlehen wäre jetzt möglich${ungeprueft}`,
      sub: (() => {
        const v = st.stufe !== 'rot' ? darlehensVerlauf(immo, heute) : null;
        const rs = v?.phasen[v.phasen.length - 1]?.restschuldBeiZinsbindung;
        return rs > 0 ? `${name} · Restschuld dann ca. ${formatCurrency(Math.round(rs / 100) * 100)}` : name;
      })(),
      immoId: immo.id,
      badge: st.stufe === 'rot' ? 'Dringend' : st.stufe === 'gelb' ? 'Bald' : 'Hinweis',
      targetTab: 'finanzierung',
    });
  });

  // ── 2. Miete ausstehend (ab dem Fälligkeitstag warnen) ────────────────────
  // Abschnitt 7.1: nutzt jetzt dieselbe berechneMietStatusFuerMonat()-Funktion wie
  // Mieteinnahmen-Tab und Cockpit-Ampel — vorher zählte hier bereits eine
  // Teilzahlung als "verbucht", was zum gemeldeten Widerspruch führte.
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;
    const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
    if (aktiveMieter.length === 0) return;

    const faelligkeitstag = immo.mieteFaelligkeitstag ?? 3;
    if (heute.getDate() < faelligkeitstag) return;
    // Miete des laufenden Monats nur, wenn das Objekt zum Fälligkeitstag schon gehörte
    if (!zeitraumNachEigentum(immo, new Date(aktuellesJahr, aktuellerMonat - 1, faelligkeitstag))) return;

    const nkVomMieter = immo.vermietungsmodell === 'kaltmiete_nk' ? (immo.nebenkostenVomMieter || 0) : 0;
    const erwarteterBetrag = immo.dauerauftrag
      ? (immo.dauerauftragBetrag || getAktuelleMiete(immo) || 0)
      : getAktuelleMiete(immo) + nkVomMieter;
    const { status } = berechneMietStatusFuerMonat(immo.mietEingaenge, aktuellesJahr, aktuellerMonat, erwarteterBetrag, immo.dauerauftrag);

    if (status === 'offen' || status === 'teilweise' || status === 'nicht_bezahlt') {
      const tag = heute.getDate();
      const tageUeberfaellig = tag - faelligkeitstag;
      todos.push({
        id: `miete-ausstehend-${immo.id}`,
        priority: status === 'nicht_bezahlt' || tageUeberfaellig >= 10 ? 'rot' : 'gelb',
        icon: <TrendingDown size={16} />,
        kategorie: 'Miete',
        titel: `Miete ${heute.toLocaleDateString('de-DE', { month: 'long' })} ${status === 'teilweise' ? 'nur teilweise da' : 'offen'} · ${formatCurrency(erwarteterBetrag)}${tageUeberfaellig > 0 ? ` · seit ${tageUeberfaellig} Tag${tageUeberfaellig !== 1 ? 'en' : ''}` : ''}`,
        sub: immo.name || immo.adresse || 'Immobilie',
        buchen: { betrag: erwarteterBetrag, jahr: aktuellesJahr, monat: aktuellerMonat },
        immoId: immo.id,
        badge: tageUeberfaellig >= 10 ? `${tag}. des Monats` : 'Prüfen',
        targetTab: 'mieteinnahmen',
      });
    }
  });

  // ── 2b. Untermiete offen (Anmieten und untervermieten) ─────────────────
  // Gleiche Logik wie bei Kaufobjekten: ab dem Fälligkeitstag, nur wenn der
  // Hauptmietvertrag läuft und Zimmer untervermietet sind.
  portfolio.forEach(immo => {
    if (immo.immobilienTyp !== 'mietimmobilie' || immo.aktiv === false) return;
    const zimmer = Number(immo.anzahlZimmerVermietet) || 0;
    if (zimmer <= 0) return;
    const start = immo.mietvertragStart ? new Date(immo.mietvertragStart) : null;
    const ende = immo.mietvertragEnde ? new Date(immo.mietvertragEnde) : null;
    const faelligkeitstag = immo.mieteFaelligkeitstag ?? 3;
    const stichtag = new Date(aktuellesJahr, aktuellerMonat - 1, faelligkeitstag);
    if (heute.getDate() < faelligkeitstag) return;
    if ((start && start > stichtag) || (ende && ende < stichtag)) return;
    const erwartet = immo.dauerauftrag ? (immo.dauerauftragBetrag || zimmer * getAktuelleUntermiete(immo)) : zimmer * getAktuelleUntermiete(immo);
    if (!(erwartet > 0)) return;
    const { status } = berechneMietStatusFuerMonat(immo.mietEingaenge, aktuellesJahr, aktuellerMonat, erwartet, immo.dauerauftrag);
    if (status === 'offen' || status === 'teilweise' || status === 'nicht_bezahlt') {
      const tageUeberfaellig = heute.getDate() - faelligkeitstag;
      todos.push({
        id: `miete-ausstehend-${immo.id}`,
        priority: status === 'nicht_bezahlt' || tageUeberfaellig >= 10 ? 'rot' : 'gelb',
        icon: <TrendingDown size={16} />,
        kategorie: 'Miete',
        titel: `Untermiete ${heute.toLocaleDateString('de-DE', { month: 'long' })} ${status === 'teilweise' ? 'nur teilweise da' : 'offen'} · ${formatCurrency(erwartet)}${tageUeberfaellig > 0 ? ` · seit ${tageUeberfaellig} Tag${tageUeberfaellig !== 1 ? 'en' : ''}` : ''}`,
        sub: `${immo.name || immo.adresse || 'Wohnung'} · ${zimmer} Zimmer`,
        immoId: immo.id,
        badge: tageUeberfaellig >= 10 ? `${heute.getDate()}. des Monats` : 'Prüfen',
        targetTab: 'mieteinnahmen',
        buchen: { betrag: erwartet, jahr: aktuellesJahr, monat: aktuellerMonat },
      });
    }
  });

  // ── 2c. Rückzahlung einer Nachforderung offen (z. B. Strom-Nachzahlung in Raten)
  portfolio.forEach(immo => {
    if (immo.aktiv === false || !(immo.nachforderungen || []).length) return;
    offeneRueckzahlungen(immo, heute).forEach(o => {
      todos.push({
        id: `nachforderung-${immo.id}-${o.nf.id}-${o.mieter.id}`,
        priority: o.tage >= 10 ? 'rot' : 'gelb',
        icon: <TrendingDown size={16} />,
        kategorie: 'Miete',
        titel: `Rückzahlung ${o.nf.titel} offen · ${o.mieter.name} · ${formatCurrency(o.betrag)}`,
        sub: `Zuschlag ${heute.toLocaleDateString('de-DE', { month: 'long' })} · noch ${formatCurrency(Math.max(0, (o.mieter.anteil || 0) - (o.mieter.zahlungen || []).reduce((s, z) => s + (Number(z.betrag) || 0), 0)))} offen`,
        immoId: immo.id,
        badge: 'Prüfen',
        targetTab: 'mieteinnahmen',
        // Direkt buchbar: fertige Felder zum Speichern
        felder: { nachforderungen: rateEingegangen(immo.nachforderungen, o.nf.id, o.mieter.id, heute) },
      });
    });
  });

  // ── 3. Nebenkostenabrechnung fehlt (PDF Abschnitt 5): Vorjahr ohne
  // Abrechnung UND heute nach dem 1. Oktober → gelb. Einstufig, kein Rot.
  // Korrektur (Gegencheck): vorher wurden März/Juni-Schwellen benutzt und
  // gegen das globale, DB-gestützte Shape-B-nkAbrechnungen-Array geprüft
  // (Felder immobilie_id/immobilieName, die dort gar nicht existieren) —
  // die eigentlichen Abrechnungen liegen aber pro Objekt in
  // immo.nkAbrechnungen (Shape A, siehe NKAbrechnungTab.jsx). Der Parameter
  // nkAbrechnungen (global) wird hier bewusst nicht mehr verwendet.
  const nachNKFrist = heute > new Date(aktuellesJahr, 9, 1); // 1. Oktober
  if (nachNKFrist) {
    portfolio.forEach(immo => {
      if (immo.immobilienTyp === 'mietimmobilie') return;
      const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
      if (aktiveMieter.length === 0) return;
      // Nur wenn das ganze Vorjahr schon im Eigentum war (Fehler 4)
      if (!zeitraumNachEigentum(immo, new Date(letztesJahr, 0, 1))) return;

      const hatAbrechnung = (immo.nkAbrechnungen || []).some(nk =>
        nk.typ === 'nk_abrechnung_detail' && parseInt(nk.abrechnungsjahr) === letztesJahr
      );

      if (!hatAbrechnung) {
        todos.push({
          id: `nk-abrechnung-${immo.id}`,
          priority: 'gelb',
          icon: <ClipboardList size={16} />,
          kategorie: 'Steuer',
          titel: `Nebenkostenabrechnung ${letztesJahr} fehlt · Frist 31.12.${aktuellesJahr}`,
          sub: immo.name || immo.adresse || 'Immobilie',
          immoId: immo.id,
          badge: 'Offen',
          targetTab: 'nkabrechnung',
        });
      }
    });
  }

  // Abschnitt 3.7: Kaution ist bei allen Objekttypen ein Block im Mieter-Reiter.
  const kautionZielTab = () => 'mieter';

  // ── 4. Kaution nicht zurückgegeben ────────────────────────────────────────
  mieterListe.forEach(mieter => {
    if (mieter.aktiv !== false) return; // Nur ausgezogene
    if (!mieter.kaution_betrag || mieter.kaution_betrag <= 0) return;
    if (mieter.kaution_zurueck) return;

    const auszugsdatum = mieter.auszugsdatum ? new Date(mieter.auszugsdatum) : null;
    const wochenSeitAuszug = auszugsdatum ? (heute - auszugsdatum) / (1000 * 60 * 60 * 24 * 7) : 99;

    todos.push({
      id: `kaution-${mieter.id}`,
      priority: wochenSeitAuszug >= 6 ? 'rot' : 'gelb',
      icon: <Key size={16} />,
      kategorie: 'Mieter',
      titel: 'Kaution noch nicht zurückgegeben',
      sub: `${mieter.name} · ${formatCurrency(mieter.kaution_betrag)}`,
      immoId: mieter.immobilie_id,
      badge: wochenSeitAuszug >= 6 ? 'Überfällig' : 'Offen',
      targetTab: kautionZielTab(mieter.id),
    });
  });

  // ── 4b. Kaution fehlt (aktiver Mieter, kein Betrag hinterlegt) — Abschnitt 5,
  // Regel 5, Stufe grau: reine Datenpflege-Erinnerung, keine Frist. ────────────
  mieterListe.forEach(mieter => {
    if (mieter.aktiv === false) return;
    if (mieter.kaution_betrag && mieter.kaution_betrag > 0) return;
    todos.push({
      id: `kaution-fehlt-${mieter.id}`,
      priority: 'grau',
      icon: <Key size={16} />,
      kategorie: 'Mieter',
      titel: 'Keine Kaution hinterlegt',
      sub: mieter.name,
      immoId: mieter.immobilie_id,
      badge: 'Eintragen',
      targetTab: kautionZielTab(mieter.id),
    });
  });

  // ── 5. Mieterhöhung möglich (§ 558 BGB: frühestens 15 Monate nach der letzten
  // Erhöhung bzw. dem Einzug wirksam) — mit Spielraum bis zur Kappungsgrenze
  // (20 % in 3 Jahren; in angespannten Märkten 15 %) und Datum der letzten Anpassung.
  const mieteAm = (immo, datum) => {
    let m = Number(immo.kaltmiete) || 0;
    [...(immo.mietAnpassungen || [])].filter(a => a.kaltmiete != null).sort((a, b) => new Date(a.datum) - new Date(b.datum))
      .forEach(a => { if (new Date(a.datum) <= datum) m = Number(a.kaltmiete) || m; });
    return m;
  };
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie' || immo.immobilienTyp === 'mehrfamilienhaus') return;
    const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
    if (aktiveMieter.length === 0) return;
    // Ohne hinterlegtes Datum meldet Regel 5b "nicht hinterlegt" — hier nichts raten
    if (aktiveMieter.some(m => !m.letzte_mieterhoehung)) return;

    let letzte = null;
    const nimm = (d) => { if (d && !Number.isNaN(d.getTime()) && (!letzte || d > letzte)) letzte = d; };
    (immo.mietAnpassungen || []).filter(a => a.kaltmiete != null).forEach(a => nimm(new Date(a.datum)));
    aktiveMieter.forEach(m => { nimm(m.mietbeginn ? new Date(m.mietbeginn) : null); nimm(new Date(m.letzte_mieterhoehung)); });
    nimm(gehoertSeit(immo));
    if (!letzte) return;
    const monate = (heute - letzte) / (1000 * 60 * 60 * 24 * 30.44);
    const aktuell = getAktuelleMiete(immo);
    const vor3 = new Date(heute); vor3.setFullYear(vor3.getFullYear() - 3);
    const kappung = Math.max(0, Math.round(mieteAm(immo, vor3) * 1.2 - aktuell));
    const mmjj = letzte.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' });
    if (monate >= 15) {
      todos.push({
        id: `mieterhoehung-${immo.id}`,
        priority: 'gelb',
        icon: <TrendingUp size={16} />,
        kategorie: 'Mieter',
        titel: `Mieterhöhung möglich · Spielraum bis Kappungsgrenze ca. +${formatCurrency(kappung)}/Mo · letzte Anpassung ${mmjj}`,
        sub: `${immo.name || immo.adresse} · Obergrenze ist auch die ortsübliche Vergleichsmiete (Mietspiegel)`,
        immoId: immo.id,
        badge: 'Möglich',
        targetTab: 'mieter',
      });
    } else if (monate >= 12) {
      const ab = new Date(letzte); ab.setMonth(ab.getMonth() + 15);
      todos.push({
        id: `mieterhoehung-bald-${immo.id}`,
        priority: 'grau',
        icon: <CalendarDays size={16} />,
        kategorie: 'Mieter',
        titel: `Mieterhöhung ab ${ab.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })} wirksam möglich — jetzt vorbereiten`,
        sub: `${immo.name || immo.adresse} · letzte Anpassung ${mmjj}`,
        immoId: immo.id,
        badge: 'Vorbereiten',
        targetTab: 'mieter',
      });
    }
  });

  // ── 5b. Letzte Mieterhöhung nach § 558 BGB — 3-Jahres-Kappungsgrenze ────────
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;
    const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
    if (aktiveMieter.length === 0) return;

    aktiveMieter.forEach(mieter => {
      // Monate seit Mietbeginn — bei neuen Mietern (<12 Monate) keine Hinweise
      // Maßgeblich ist der spätere Zeitpunkt aus Mietbeginn und Eigentumsdatum (Fehler 4)
      const mietbeginnDatum = mieter.mietbeginn ? new Date(mieter.mietbeginn) : null;
      const seit = gehoertSeit(immo);
      const bezug = mietbeginnDatum && seit ? (mietbeginnDatum > seit ? mietbeginnDatum : seit) : (mietbeginnDatum || seit);
      const monateSeitEinzug = bezug ? (heute - bezug) / (1000 * 60 * 60 * 24 * 30.44) : 999;

      if (!mieter.letzte_mieterhoehung) {
        // Feld nicht gepflegt → nur zeigen wenn Mieter mind. 12 Monate drin ist
        if (monateSeitEinzug < 12) return;
        todos.push({
          id: `mieterhoehung-datum-${mieter.id}`,
          priority: 'gelb',
          icon: <ScrollText size={16} />,
          kategorie: 'Mieter',
          titel: 'Letzte Mieterhöhung nicht hinterlegt',
          sub: `${mieter.name} · ${immo.name || immo.adresse} — Datum für 3-Jahres-Kappungsgrenze fehlt`,
          immoId: immo.id,
          badge: 'Eintragen',
          targetTab: 'mieter',
        });
      }
    });
  });

  // ── 6. Leerstehende Immobilie ─────────────────────────────────────────────
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;
    if (!immo.aktiv) return;
    const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
    if (aktiveMieter.length === 0 && immo.kaltmiete > 0) {
      todos.push({
        id: `leerstand-${immo.id}`,
        priority: 'gelb',
        icon: <Building2 size={16} />,
        kategorie: 'Mieter',
        titel: 'Immobilie steht leer',
        sub: immo.name || immo.adresse || 'Immobilie',
        immoId: immo.id,
        badge: 'Leerstand',
        targetTab: 'mieter',
      });
    }
  });

  // ── 7. Mieter-Vertragsende bald ───────────────────────────────────────────
  mieterListe.forEach(mieter => {
    if (mieter.aktiv === false) return;
    if (!mieter.mietende) return;
    const ende = new Date(mieter.mietende);
    const monate = (ende - heute) / (1000 * 60 * 60 * 24 * 30.44);
    if (monate <= 3 && monate >= 0) {
      todos.push({
        id: `vertragsende-${mieter.id}`,
        priority: monate <= 1 ? 'rot' : 'gelb',
        icon: <CalendarDays size={16} />,
        kategorie: 'Mieter',
        titel: `Mietvertrag läuft in ${Math.ceil(monate)} Monat${monate > 1 ? 'en' : ''} aus`,
        sub: `${mieter.name}`,
        immoId: mieter.immobilie_id,
        badge: monate <= 1 ? 'Dringend' : 'Bald',
        targetTab: 'mieter',
      });
    }
  });

  // ── 8. 15%-Regel (§ 6 Abs. 1 Nr. 1a EStG) ───────────────────────────────
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;
    const kaufdatum = immo.kaufdatum;
    const kaufpreis = immo.kaufpreis || 0;
    const grundstueck = immo.grundstueck || 0;
    const gebaeudewert = kaufpreis - grundstueck;
    if (!kaufdatum || gebaeudewert <= 0) return;

    const kauf = new Date(kaufdatum);
    const fensterEnde = new Date(kauf);
    fensterEnde.setFullYear(fensterEnde.getFullYear() + 3);
    if (heute > fensterEnde) return; // 3-Jahres-Fenster abgelaufen

    const relevantKategorien = ['erhaltung', 'modernisierung', 'herstellung'];
    const relevantKosten = (immo.investitionen || [])
      .filter(inv => {
        const d = new Date(inv.datum);
        return d >= kauf && d <= fensterEnde && relevantKategorien.includes(inv.kategorie);
      })
      .reduce((sum, inv) => sum + inv.betrag, 0);

    const grenze = gebaeudewert * 0.15;
    const prozent = grenze > 0 ? (relevantKosten / grenze) * 100 : 0;
    const monate = Math.ceil((fensterEnde - heute) / (1000 * 60 * 60 * 24 * 30.44));

    if (relevantKosten > grenze) {
      todos.push({
        id: `regel15-${immo.id}`,
        priority: 'rot',
        icon: <AlertTriangle size={16} />,
        kategorie: 'Steuer',
        titel: '15%-Grenze überschritten! Steuerlicher Verlust droht',
        sub: `${immo.name || immo.adresse} · ${Math.round(prozent)}% der Grenze (${formatCurrency(relevantKosten)} / ${formatCurrency(grenze)})`,
        immoId: immo.id,
        badge: 'Steuerfalle',
        targetTab: 'investitionen',
      });
    } else if (prozent >= 75) {
      todos.push({
        id: `regel15-${immo.id}`,
        priority: 'gelb',
        icon: <AlertTriangle size={16} />,
        kategorie: 'Steuer',
        titel: `15%-Regel: ${Math.round(prozent)}% der Grenze — noch ${formatCurrency(grenze - relevantKosten)} Spielraum`,
        sub: `${immo.name || immo.adresse} · 3-Jahres-Fenster läuft noch ${monate} Monate`,
        immoId: immo.id,
        badge: 'Achtung',
        targetTab: 'investitionen',
      });
    }
  });

  // ── 9. Marktwert veraltet (>12 Monate nicht aktualisiert) ──────────────────
  // Abschnitt 5, Stufe grau: rein informativ, keine Frist — betrifft nur Objekte,
  // für die überhaupt ein geschätzter Marktwert gepflegt wird.
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;
    if (!immo.aktiv) return;
    if (!immo.geschaetzterWert || immo.geschaetzterWert <= 0) return;

    const zuletzt = immo.geschaetzterWertDatum ? new Date(immo.geschaetzterWertDatum) : null;
    const monateSeitUpdate = zuletzt ? (heute - zuletzt) / (1000 * 60 * 60 * 24 * 30.44) : 999;
    if (monateSeitUpdate < 12) return;

    todos.push({
      id: `marktwert-veraltet-${immo.id}`,
      priority: 'grau',
      icon: <TrendingUp size={16} />,
      kategorie: 'Finanzierung',
      titel: zuletzt ? 'Marktwert seit über 12 Monaten nicht aktualisiert' : 'Marktwert noch nie aktualisiert',
      sub: immo.name || immo.adresse || 'Immobilie',
      immoId: immo.id,
      badge: 'Prüfen',
      targetTab: 'stammdaten',
    });
  });

  // ── 10. Sondertilgung ungenutzt (nach 1. November) ──────────────────────────
  // Abschnitt 5, Stufe grau: erinnert daran, eine erlaubte, aber im laufenden Jahr
  // noch nicht genutzte Sondertilgungsquote nicht verfallen zu lassen.
  if (heute.getMonth() >= 10) { // ab November
    portfolio.forEach(immo => {
      if (immo.immobilienTyp === 'mietimmobilie') return;
      if (!immo.aktiv) return;
      const phasen = immo.finanzierungsphasen || [];
      const aktivePhase = phasen[phasen.length - 1];
      if (!aktivePhase) return;
      if (!aktivePhase.sondertilgungErlaubtProzent || aktivePhase.sondertilgungErlaubtProzent <= 0) return;
      if (aktivePhase.sondertilgungJaehrlich > 0) return; // wird bereits genutzt

      todos.push({
        id: `sondertilgung-ungenutzt-${immo.id}`,
        priority: 'grau',
        icon: <Landmark size={16} />,
        kategorie: 'Finanzierung',
        titel: `Sondertilgung (${aktivePhase.sondertilgungErlaubtProzent}% erlaubt) dieses Jahr noch nicht genutzt`,
        sub: immo.name || immo.adresse || 'Immobilie',
        immoId: immo.id,
        badge: 'Prüfen',
        targetTab: 'finanzierung',
      });
    });
  }

  // Sortieren: rot → gelb → grau
  // ── Plausibilitätsprüfung (Teil 3, Abschnitt 8): "X Zahlen prüfen" ab 1 Widerspruch
  // oder mehr als 2 gelben Hinweisen. Nur Kaufimmobilien.
  portfolio.forEach(immo => {
    const hinweise = pruefeImmobilie(immo, { portfolio, mieter: mieterListe, heute });
    if (!brauchtErinnerung(hinweise)) return;
    const z = zaehle(hinweise);
    todos.push({
      id: `plausi-${immo.id}`,
      priority: z.rot > 0 ? 'rot' : 'gelb',
      icon: <AlertTriangle size={16} />,
      kategorie: 'Daten',
      titel: `${z.rot + z.gelb} Zahlen prüfen${z.rot > 0 ? ` · ${z.rot} ${z.rot === 1 ? 'Widerspruch' : 'Widersprüche'}` : ''}`,
      sub: immo.name || immo.adresse || 'Immobilie',
      immoId: immo.id,
      badge: 'Prüfen',
      targetTab: 'pruefen',
    });
  });

  return todos.sort((a, b) => PRIORITAET[a.priority] - PRIORITAET[b.priority]);
}

export const PRIORITY_STYLE = {
  rot: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', row: 'border-red-100 hover:bg-red-50' },
  gelb: { dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', row: 'border-amber-100 hover:bg-amber-50' },
  grau: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600', row: 'border-gray-100 hover:bg-gray-50' },
};

const LS_AKTIV_KEY = 'vermieter-todos-aktiv';

// Genau eine Aktion pro Erinnerung (Abschnitt 5), beschriftet nach Ziel-Route
const AKTION_LABEL = {
  pruefen: 'Zahlen prüfen',
  mieteinnahmen: 'Miete buchen',
  finanzierung: 'Konditionen prüfen',
  nkabrechnung: 'Abrechnen',
  mieter: 'Mieter öffnen',
  kaution: 'Kaution eintragen',
  stammdaten: 'Wert aktualisieren',
  investitionen: 'Investitionen prüfen',
};

const VermieterTodos = ({ portfolio, mieterListe = [], nkAbrechnungen = [], onSelectImmobilie, onBuchen }) => {
  const [offeneGruppen, setOffeneGruppen] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  // Gegencheck 2: "Was steht an" ist laut Abschnitt 3.1 ein fester Dashboard-
  // Block — standardmäßig AN, nur wer ihn bewusst ausschaltet, sieht ihn aus.
  const [aktiv, setAktiv] = useState(() => {
    try { return localStorage.getItem(LS_AKTIV_KEY) !== 'false'; }
    catch { return true; }
  });
  // Abschnitt 3.1: filterbar nach Miete, Finanzierung, Mieter, Steuer
  const [kategorieFilter, setKategorieFilter] = useState('alle');

  const toggleAktiv = (e) => {
    e.stopPropagation();
    setAktiv(prev => {
      const next = !prev;
      try { localStorage.setItem(LS_AKTIV_KEY, String(next)); } catch {}
      return next;
    });
  };

  const todos = useMemo(
    () => aktiv ? generiereAufgaben(portfolio, mieterListe, nkAbrechnungen) : [],
    [portfolio, mieterListe, nkAbrechnungen, aktiv]
  );

  const KATEGORIEN = ['Miete', 'Finanzierung', 'Mieter', 'Steuer', 'Daten'];
  const gefilterteTodos = kategorieFilter === 'alle' ? todos : todos.filter(t => t.kategorie === kategorieFilter);

  const anzahlRot = todos.filter(t => t.priority === 'rot').length;
  const anzahlGelb = todos.filter(t => t.priority === 'gelb').length;
  const anzahlGrau = todos.filter(t => t.priority === 'grau').length;

  return (
    <div id="was-steht-an" className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 overflow-hidden scroll-mt-4">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 transition-all select-none"
        onClick={() => aktiv && setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CheckCircle2 size={18} className={aktiv ? 'text-emerald-500' : 'text-gray-300'} />
          <span className={`font-bold ${aktiv ? 'text-gray-800' : 'text-gray-400'}`}>Was steht an</span>
          {aktiv && todos.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {anzahlRot > 0 && (
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {anzahlRot} dringend
                </span>
              )}
              {anzahlGelb > 0 && (
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {anzahlGelb} offen
                </span>
              )}
              {anzahlGrau > 0 && (
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {anzahlGrau} Hinweis
                </span>
              )}
            </div>
          )}
          {!aktiv && (
            <span className="text-xs text-gray-400">deaktiviert</span>
          )}
        </div>

        {/* Regler (Toggle) */}
        <button
          onClick={toggleAktiv}
          className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none mx-2 ${aktiv ? 'bg-emerald-500' : 'bg-gray-200'}`}
          title={aktiv ? 'Aufgaben deaktivieren' : 'Aufgaben aktivieren'}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${aktiv ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>

        {aktiv && (
          <span className={`text-gray-400 transition-transform inline-flex ${collapsed ? '' : 'rotate-180'}`}>
            <ChevronDown size={14} />
          </span>
        )}
      </div>

      {/* Content — nur wenn aktiv und nicht collapsed */}
      {aktiv && !collapsed && (
        <div className="border-t border-gray-100">
          {todos.length > 0 && (
            <div className="flex gap-1.5 px-5 py-2.5 overflow-x-auto border-b border-gray-50">
              {['alle', ...KATEGORIEN].map(k => {
                const anzahl = k === 'alle' ? todos.length : todos.filter(t => t.kategorie === k).length;
                return (
                  <button key={k} onClick={() => setKategorieFilter(k)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors ${
                      kategorieFilter === k ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {k === 'alle' ? 'Alle' : k} <span className="opacity-70">{anzahl}</span>
                  </button>
                );
              })}
            </div>
          )}
          {todos.length === 0 ? (
            <div className="text-center py-10 px-5">
              <div className="flex justify-center mb-3">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <div className="font-bold text-gray-700 mb-1">Alles erledigt!</div>
              <div className="text-sm text-gray-400">Keine offenen Aufgaben. Gut gemacht.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {gefilterteTodos.length === 0 && (
                <div className="px-5 py-4 text-sm text-gray-400">In dieser Kategorie ist nichts offen.</div>
              )}
              {(() => {
                // Gleicher Hinweis bei mehreren Objekten → eine Zeile "N Objekte" mit "Anzeigen"
                const gruppen = [];
                const index = {};
                gefilterteTodos.forEach(t => {
                  const key = t.buchen || t.felder ? t.id : `${t.kategorie}|${t.titel}`;
                  if (index[key] === undefined) { index[key] = gruppen.length; gruppen.push([t]); } else gruppen[index[key]].push(t);
                });
                const zeile = (todo, eingerueckt = false) => {
                  const style = PRIORITY_STYLE[todo.priority];
                  const immo = portfolio.find(i => i.id === todo.immoId);
                  return (
                    <div key={todo.id} className={`flex items-center gap-4 px-5 py-3.5 transition-all ${style.row} ${eingerueckt ? 'pl-12 bg-gray-50/60' : ''}`}>
                      <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${style.dot}`} />
                      <div className="flex-shrink-0 w-7 flex items-center justify-center text-gray-500">{todo.icon}</div>
                      <div className="flex-1 min-w-0">
                        {/* Abschnitt 3.1: jede Zeile nennt Objektname + Sachverhalt */}
                        <div className="text-[11px] font-semibold text-gray-500 truncate">{immo ? (immo.name || immo.adresse || 'Immobilie') : ''}{todo.kategorie ? ` · ${todo.kategorie}` : ''}</div>
                        <div className="font-semibold text-gray-800 text-sm leading-snug truncate">{todo.titel}</div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">{todo.sub}</div>
                      </div>
                      {immo && todo.felder && onBuchen ? (
                        <button
                          onClick={() => onBuchen(immo.id, todo.felder)}
                          className="flex-shrink-0 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-colors">
                          Eingegangen
                        </button>
                      ) : immo && todo.buchen && onBuchen ? (
                        <button
                          onClick={() => {
                            const b = todo.buchen;
                            const monatKey = `${b.jahr}-${String(b.monat).padStart(2, '0')}`;
                            onBuchen(immo.id, { mietEingaenge: [...(immo.mietEingaenge || []), { id: Date.now(), monat: monatKey, datum: new Date().toISOString().slice(0, 10), betrag: b.betrag, typ: 'kaltmiete', notiz: '' }] });
                          }}
                          className="flex-shrink-0 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-colors">
                          Eingegangen
                        </button>
                      ) : immo && onSelectImmobilie && (
                        <button
                          onClick={() => onSelectImmobilie(immo, todo.targetTab)}
                          className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-700 text-gray-600 text-xs font-bold rounded-lg transition-colors">
                          {AKTION_LABEL[todo.targetTab] || 'Öffnen'}
                        </button>
                      )}
                    </div>
                  );
                };
                return gruppen.map(g => {
                  if (g.length === 1) return zeile(g[0]);
                  const t = g[0];
                  const key = `${t.kategorie}|${t.titel}`;
                  const style = PRIORITY_STYLE[t.priority];
                  return (
                    <div key={key}>
                      <div className={`flex items-center gap-4 px-5 py-3.5 ${style.row}`}>
                        <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${style.dot}`} />
                        <div className="flex-shrink-0 w-7 flex items-center justify-center text-gray-500">{t.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-gray-500 truncate">{g.length} Objekte{t.kategorie ? ` · ${t.kategorie}` : ''}</div>
                          <div className="font-semibold text-gray-800 text-sm leading-snug truncate">{t.titel}</div>
                        </div>
                        <button onClick={() => setOffeneGruppen(o => ({ ...o, [key]: !o[key] }))}
                          className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-700 text-gray-600 text-xs font-bold rounded-lg transition-colors">
                          {offeneGruppen[key] ? 'Zuklappen' : 'Anzeigen'}
                        </button>
                      </div>
                      {offeneGruppen[key] && g.map(x => zeile(x, true))}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VermieterTodos;
