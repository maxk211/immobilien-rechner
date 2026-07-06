import { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/format.js';

const PRIORITAET = { rot: 0, gelb: 1, gruen: 2 };

function generiereAufgaben(portfolio, mieterListe, nkAbrechnungen) {
  const todos = [];
  const heute = new Date();
  const aktuellesJahr = heute.getFullYear();
  const aktuellerMonat = heute.getMonth() + 1;
  const letztesJahr = aktuellesJahr - 1;

  // ── 1. Zinsbindung läuft ab ───────────────────────────────────────────────
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;

    // Kein Kredit vorhanden → keine Zinsbindungswarnung
    const kaufpreis = immo.kaufpreis || 0;
    if (immo.geschenkt || immo.vollEigenfinanziert || kaufpreis <= 0) return;
    const ekFuerKaufpreis = immo.ekFuerKaufpreis != null ? immo.ekFuerKaufpreis : (immo.eigenkapital || 0);
    const kreditbetrag = kaufpreis - ekFuerKaufpreis;
    if (kreditbetrag < 1) return; // vollständig eigenfinanziert

    const phasen = immo.finanzierungsphasen || [];
    phasen.forEach((phase, idx) => {
      // Wenn bereits eine Folge-Phase hinterlegt ist → Anschlussfinanzierung geregelt, keine Warnung
      if (idx < phasen.length - 1) return;

      const startDatum = idx === 0
        ? (phase.kreditStartDatum || immo.kaufdatum)
        : phase.kreditStartDatum || null;
      if (!startDatum) return;
      const ablauf = new Date(startDatum);
      ablauf.setFullYear(ablauf.getFullYear() + (phase.zinsbindung || 10));
      const monate = (ablauf - heute) / (1000 * 60 * 60 * 24 * 30.44);
      if (monate > 18 || monate < -6) return;

      const abgelaufen = monate < 0;
      todos.push({
        id: `zinsbindung-${immo.id}-${idx}`,
        priority: abgelaufen || monate <= 6 ? 'rot' : 'gelb',
        icon: '🏦',
        titel: abgelaufen
          ? 'Zinsbindung bereits abgelaufen!'
          : `Zinsbindung läuft in ${Math.ceil(monate)} Monaten ab`,
        sub: immo.name || immo.adresse || 'Immobilie',
        immoId: immo.id,
        badge: abgelaufen ? 'Dringend' : monate <= 3 ? 'Kritisch' : 'Bald',
        targetTab: 'finanzierung',
      });
    });
  });

  // ── 2. Miete ausstehend (ab dem 5. des Monats warnen) ─────────────────────
  if (heute.getDate() >= 5) {
    portfolio.forEach(immo => {
      if (immo.immobilienTyp === 'mietimmobilie') return;
      const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
      if (aktiveMieter.length === 0) return;

      const eingaenge = immo.mietEingaenge || [];
      const bezahlt = eingaenge.some(e => {
        const d = new Date(e.datum);
        return d.getFullYear() === aktuellesJahr && (d.getMonth() + 1) === aktuellerMonat;
      });

      if (!bezahlt) {
        const tag = heute.getDate();
        todos.push({
          id: `miete-ausstehend-${immo.id}`,
          priority: tag >= 15 ? 'rot' : 'gelb',
          icon: '💸',
          titel: `Mieteingang ${aktuellerMonat}/${aktuellesJahr} noch nicht verbucht`,
          sub: immo.name || immo.adresse || 'Immobilie',
          immoId: immo.id,
          badge: tag >= 15 ? `${tag}. des Monats` : 'Prüfen',
          targetTab: 'mieteinnahmen',
        });
      }
    });
  }

  // ── 3. NK-Abrechnung fehlt (ab März für das Vorjahr) ─────────────────────
  if (heute.getMonth() >= 2) { // März = Index 2
    portfolio.forEach(immo => {
      if (immo.immobilienTyp === 'mietimmobilie') return;
      const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
      if (aktiveMieter.length === 0) return;

      const hatAbrechnung = (nkAbrechnungen || []).some(nk =>
        (nk.immobilie_id === immo.id || nk.immobilieName === (immo.name || immo.adresse)) &&
        parseInt(nk.abrechnungsjahr) === letztesJahr
      );

      if (!hatAbrechnung) {
        todos.push({
          id: `nk-abrechnung-${immo.id}`,
          priority: heute.getMonth() >= 5 ? 'rot' : 'gelb', // Ab Juni rot
          icon: '📋',
          titel: `NK-Abrechnung ${letztesJahr} noch ausstehend`,
          sub: immo.name || immo.adresse || 'Immobilie',
          immoId: immo.id,
          badge: heute.getMonth() >= 5 ? 'Überfällig' : 'Offen',
          targetTab: 'nkabrechnung',
        });
      }
    });
  }

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
      icon: '🔑',
      titel: 'Kaution noch nicht zurückgegeben',
      sub: `${mieter.name} · ${formatCurrency(mieter.kaution_betrag)}`,
      immoId: mieter.immobilie_id,
      badge: wochenSeitAuszug >= 6 ? 'Überfällig' : 'Offen',
      targetTab: 'kaution',
    });
  });

  // ── 5. Mieterhöhung möglich (≥15 Monate seit letzter Anpassung) ───────────
  portfolio.forEach(immo => {
    if (immo.immobilienTyp === 'mietimmobilie') return;
    const aktiveMieter = mieterListe.filter(m => m.immobilie_id === immo.id && m.aktiv !== false);
    if (aktiveMieter.length === 0) return;

    const anpassungen = immo.mietAnpassungen || [];
    let letzteAnpassung = immo.kaufdatum ? new Date(immo.kaufdatum) : null;
    anpassungen.forEach(a => {
      const d = new Date(a.datum);
      if (!letzteAnpassung || d > letzteAnpassung) letzteAnpassung = d;
    });

    if (!letzteAnpassung) return;
    const monate = (heute - letzteAnpassung) / (1000 * 60 * 60 * 24 * 30.44);
    if (monate >= 15) {
      todos.push({
        id: `mieterhoehung-${immo.id}`,
        priority: 'gruen',
        icon: '📈',
        titel: `Mieterhöhung möglich`,
        sub: `${immo.name || immo.adresse} · ${Math.floor(monate)} Monate seit letzter Anpassung`,
        immoId: immo.id,
        badge: 'Möglich',
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
      if (!mieter.letzte_mieterhoehung) {
        // Feld nicht gepflegt → Erinnerungs-TODO
        todos.push({
          id: `mieterhoehung-datum-${mieter.id}`,
          priority: 'gelb',
          icon: '📜',
          titel: 'Letzte Mieterhöhung nicht hinterlegt',
          sub: `${mieter.name} · ${immo.name || immo.adresse} — Datum für 3-Jahres-Kappungsgrenze fehlt`,
          immoId: immo.id,
          badge: 'Eintragen',
          targetTab: 'mieter',
        });
      } else {
        const letzte = new Date(mieter.letzte_mieterhoehung);
        const naechsteMoeglich = new Date(letzte);
        naechsteMoeglich.setFullYear(naechsteMoeglich.getFullYear() + 3);
        const monateVerbleibend = (naechsteMoeglich - heute) / (1000 * 60 * 60 * 24 * 30.44);
        const immoName = immo.name || immo.adresse || 'Immobilie';

        if (monateVerbleibend <= 0) {
          // 3 Jahre überschritten → Mieterhöhung jetzt möglich
          todos.push({
            id: `mieterhoehung-3j-${mieter.id}`,
            priority: 'gruen',
            icon: '📈',
            titel: '3-Jahres-Mieterhöhung möglich',
            sub: `${mieter.name} · ${immoName} · letzte Erhöhung: ${letzte.toLocaleDateString('de-DE')}`,
            immoId: immo.id,
            badge: 'Jetzt möglich',
            targetTab: 'mieter',
          });
        } else if (monateVerbleibend <= 3) {
          // Vorwarnung 3 Monate vorher
          todos.push({
            id: `mieterhoehung-3j-warnung-${mieter.id}`,
            priority: 'gruen',
            icon: '📅',
            titel: `Mieterhöhungs-Fenster öffnet in ${Math.ceil(monateVerbleibend)} Monat${Math.ceil(monateVerbleibend) !== 1 ? 'en' : ''}`,
            sub: `${mieter.name} · ${immoName} · möglich ab ${naechsteMoeglich.toLocaleDateString('de-DE')} — jetzt Schreiben vorbereiten`,
            immoId: immo.id,
            badge: 'Vorbereiten',
            targetTab: 'mieter',
          });
        }
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
        icon: '🏚️',
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
        icon: '📅',
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
        icon: '🚨',
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
        icon: '⚠️',
        titel: `15%-Regel: ${Math.round(prozent)}% der Grenze — noch ${formatCurrency(grenze - relevantKosten)} Spielraum`,
        sub: `${immo.name || immo.adresse} · 3-Jahres-Fenster läuft noch ${monate} Monate`,
        immoId: immo.id,
        badge: 'Achtung',
        targetTab: 'investitionen',
      });
    }
  });

  // Sortieren: rot → gelb → grün
  return todos.sort((a, b) => PRIORITAET[a.priority] - PRIORITAET[b.priority]);
}

const PRIORITY_STYLE = {
  rot: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', row: 'border-red-100 hover:bg-red-50' },
  gelb: { dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', row: 'border-amber-100 hover:bg-amber-50' },
  gruen: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', row: 'border-emerald-100 hover:bg-emerald-50' },
};

const VermieterTodos = ({ portfolio, mieterListe = [], nkAbrechnungen = [], onSelectImmobilie }) => {
  const [collapsed, setCollapsed] = useState(false);

  const todos = useMemo(
    () => generiereAufgaben(portfolio, mieterListe, nkAbrechnungen),
    [portfolio, mieterListe, nkAbrechnungen]
  );

  const anzahlRot = todos.filter(t => t.priority === 'rot').length;
  const anzahlGelb = todos.filter(t => t.priority === 'gelb').length;
  const anzahlGruen = todos.filter(t => t.priority === 'gruen').length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 transition-all select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">✅</span>
          <span className="font-bold text-gray-800">Vermieter-Aufgaben</span>
          {todos.length > 0 && (
            <div className="flex items-center gap-1.5">
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
              {anzahlGruen > 0 && (
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {anzahlGruen} Hinweis
                </span>
              )}
            </div>
          )}
        </div>
        <span className={`text-gray-400 text-sm transition-transform ${collapsed ? '' : 'rotate-180'}`}>▼</span>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="border-t border-gray-100">
          {todos.length === 0 ? (
            <div className="text-center py-10 px-5">
              <div className="text-4xl mb-3">🎉</div>
              <div className="font-bold text-gray-700 mb-1">Alles erledigt!</div>
              <div className="text-sm text-gray-400">Keine offenen Aufgaben. Gut gemacht.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todos.map(todo => {
                const style = PRIORITY_STYLE[todo.priority];
                const immo = portfolio.find(i => i.id === todo.immoId);
                return (
                  <div
                    key={todo.id}
                    onClick={() => immo && onSelectImmobilie && onSelectImmobilie(immo, todo.targetTab)}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-all ${style.row} ${immo && onSelectImmobilie ? 'cursor-pointer' : ''}`}
                  >
                    {/* Priority dot */}
                    <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${style.dot}`} />

                    {/* Icon */}
                    <div className="flex-shrink-0 text-xl w-7 text-center">{todo.icon}</div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm leading-snug truncate">{todo.titel}</div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{todo.sub}</div>
                    </div>

                    {/* Badge */}
                    <div className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                      {todo.badge}
                    </div>

                    {/* Arrow wenn klickbar */}
                    {immo && onSelectImmobilie && (
                      <div className="flex-shrink-0 text-gray-300 text-sm">›</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VermieterTodos;
