// Belegung je Wohneinheit — EINE Regel für „Was steht an“, Vermietung und Karten.
//
// Eine Einheit ist
//   • vermietet     — aktiver Mieter in der Mieterverwaltung ODER Mietername an der Wohnung
//                     (aus dem Anlegen) ODER bei Einzelobjekten „vermietet“ laut Anlage
//   • leer          — nur, wenn das ausdrücklich so erfasst ist (Wohnung „steht leer“,
//                     Objekt „steht leer“) oder ein Mietverhältnis beendet ist
//   • eigennutzung  — Objekt selbst genutzt
//   • unbekannt     — keine Angaben. Fehlende Mieterdatensätze sind KEIN bestätigter Leerstand.
// Gesamt: voll · teilweise · leer · unbekannt · eigennutzung

import { weMieteAm } from './mfh.js';

const norm = (s) => String(s || '').trim().toLocaleLowerCase('de-DE');
const laeuft = (ende, heute) => !ende || new Date(ende) >= heute;

export function einheitenStatus(immo, mieterListe = [], heute = new Date()) {
  const aktive = (mieterListe || []).filter(m => m.immobilie_id === immo?.id && m.aktiv !== false && laeuft(m.mietende, heute));
  const ehemalige = (mieterListe || []).filter(m => m.immobilie_id === immo?.id && (m.aktiv === false || !laeuft(m.mietende, heute)));
  let einheiten = [];

  if (immo?.immobilienTyp === 'mehrfamilienhaus') {
    const frei = [...aktive];
    const nimm = (pred) => { const i = frei.findIndex(pred); return i >= 0 ? frei.splice(i, 1)[0] : null; };
    einheiten = (immo.wohnungen || []).map((w, i) => {
      const name = w.name || `WE ${i + 1}`;
      const datensatz = nimm(m => (w.mieterId && m.id === w.mieterId))
        || nimm(m => norm(m.zimmer_bezeichnung) && norm(m.zimmer_bezeichnung) === norm(name))
        || (w.mieterName ? nimm(m => norm(m.name) === norm(w.mieterName)) : null);
      if (datensatz) return { key: w.id ?? i, name, status: 'vermietet', mieterName: datensatz.name, quelle: 'mieter', mieterId: datensatz.id, wohnung: w };
      // Mieter in der Mieterverwaltung ausgezogen/beendet → Wohnung leer, auch wenn der Name noch an der Wohnung steht
      const ehemaliger = ehemalige.find(m => (w.mieterId != null && String(m.id) === String(w.mieterId))
        || (norm(m.zimmer_bezeichnung) && norm(m.zimmer_bezeichnung) === norm(name))
        || (w.mieterName && norm(m.name) === norm(w.mieterName)));
      if (ehemaliger && (!w.mieterId || String(w.mieterId) === String(ehemaliger.id)) && (!w.mieterName || norm(w.mieterName) === norm(ehemaliger.name))) {
        return { key: w.id ?? i, name, status: 'leer', quelle: 'mieter', ehemalig: ehemaliger.name, wohnung: w };
      }
      if (w.mieterName && laeuft(w.mietende, heute)) return { key: w.id ?? i, name, status: 'vermietet', mieterName: w.mieterName, quelle: 'wohnung', wohnung: w };
      if (w.leer === true || (w.mietende && !laeuft(w.mietende, heute))) return { key: w.id ?? i, name, status: 'leer', quelle: 'wohnung', wohnung: w };
      return { key: w.id ?? i, name, status: 'unbekannt', quelle: null, wohnung: w };
    });
    // Mieter ohne erkennbare Wohnung füllen Einheiten mit unbekannter Belegung auf
    einheiten = einheiten.map(e => (e.status === 'unbekannt' && frei.length)
      ? (() => { const m = frei.shift(); return { ...e, status: 'vermietet', mieterName: m.name, quelle: 'mieter', mieterId: m.id }; })()
      : e);
  } else {
    const name = immo?.name || 'Wohnung';
    if (aktive.length) einheiten = [{ key: 'objekt', name, status: 'vermietet', mieterName: aktive.map(m => m.name).join(', '), quelle: 'mieter', mieterId: aktive[0].id }];
    else if (immo?.mietstatus === 'selbst') einheiten = [{ key: 'objekt', name, status: 'eigennutzung', quelle: 'objekt' }];
    else if (immo?.mietstatus === 'leer' || ehemalige.length) einheiten = [{ key: 'objekt', name, status: 'leer', quelle: immo?.mietstatus === 'leer' ? 'objekt' : 'mieter' }];
    // Ältere Objekte ohne Angabe: eine eingetragene Miete heißt vermietet (Mieterdaten fehlen nur)
    else if (immo?.mietstatus === 'vermietet' || (!immo?.mietstatus && Number(immo?.kaltmiete) > 0)) einheiten = [{ key: 'objekt', name, status: 'vermietet', quelle: 'objekt' }];
    else einheiten = [{ key: 'objekt', name, status: 'unbekannt', quelle: null }];
  }

  const zaehl = (s) => einheiten.filter(e => e.status === s).length;
  const relevant = einheiten.filter(e => e.status !== 'eigennutzung').length;
  const vermietet = zaehl('vermietet'), leer = zaehl('leer'), unbekannt = zaehl('unbekannt');
  const gesamt = relevant === 0 ? (einheiten.length ? 'eigennutzung' : 'unbekannt')
    : vermietet === relevant ? 'voll'
      : vermietet > 0 ? 'teilweise'
        : leer === relevant ? 'leer'
          : 'unbekannt';
  return {
    einheiten, anzahl: einheiten.length, vermietet, leer, unbekannt, gesamt,
    // Mieter, die nur an der Wohnung stehen und noch nicht in der Mieterverwaltung sind
    ohneMieterdatensatz: einheiten.filter(e => e.status === 'vermietet' && e.quelle === 'wohnung'),
  };
}

// Mieterdatensätze für Wohnungen, deren Mieter beim Anlegen erfasst, aber nie in die
// Mieterverwaltung übernommen wurden (Felder wie in MieterFormular/saveMieter)
export function mieterAusWohnungen(immo, mieterListe = [], heute = new Date()) {
  if (immo?.immobilienTyp !== 'mehrfamilienhaus') return [];
  return einheitenStatus(immo, mieterListe, heute).ohneMieterdatensatz.map(e => {
    const kalt = weMieteAm(e.wohnung) || 0; // aktuelle Miete inkl. Mieterhöhungen
    return {
      immobilieId: immo.id,
      name: e.mieterName,
      zimmerBezeichnung: e.name,
      kaltmiete: kalt || null,
      gesamtueberweisung: kalt || null,
      mietbeginn: e.wohnung?.mietbeginn || null,
      mietende: e.wohnung?.mietende || null,
      letzteMieterhoehung: e.wohnung?.letzteMieterhoehung || null,
      kautionBetrag: Number(e.wohnung?.kautionBetrag) || null,
      kautionBezahlt: !!e.wohnung?.kautionBezahlt,
      aktiv: true,
    };
  });
}

export const BELEGUNG_TEXT = {
  voll: 'voll vermietet', teilweise: 'teilweise vermietet', leer: 'steht leer',
  unbekannt: 'Belegung offen', eigennutzung: 'selbst genutzt',
};

// ── Mehrfamilienhaus: EINE Quelle für Mieterdaten ─────────────────────────────
// Gibt es einen Mieterdatensatz, ist ER die Quelle (Name, Mietbeginn, Mietende/Auszug, Kaution).
// Die Felder an der Wohnung sind nur noch die Anzeige davon und werden nach jedem Speichern des
// Mieters nachgezogen. Änderungen im Wohnungsformular gehen umgekehrt an den Datensatz.
const feldVon = (m, snake, camel) => (m?.[camel] !== undefined ? m[camel] : m?.[snake]);
const iso10 = (s) => (s ? String(s).slice(0, 10) : '');

export function wohnungIndexFuer(wohnungen, m) {
  if (!m) return -1;
  const id = m.id;
  let i = id != null ? (wohnungen || []).findIndex(w => w.mieterId != null && String(w.mieterId) === String(id)) : -1;
  if (i >= 0) return i;
  const zimmer = feldVon(m, 'zimmer_bezeichnung', 'zimmerBezeichnung');
  i = zimmer ? (wohnungen || []).findIndex(w => norm(w.name) === norm(zimmer)) : -1;
  if (i >= 0) return i;
  return (wohnungen || []).findIndex(w => w.mieterName && norm(w.mieterName) === norm(m.name));
}

// Wohnungsfelder aus dem Mieterdatensatz (Spiegel). Liefert dieselbe Liste, wenn sich nichts ändert.
export function wohnungenMitMieter(wohnungen, m) {
  const i = wohnungIndexFuer(wohnungen, m);
  if (i < 0) return wohnungen;
  const w = wohnungen[i];
  const aktiv = feldVon(m, 'aktiv', 'aktiv') !== false;
  const auszug = iso10(feldVon(m, 'auszugsdatum', 'auszugsdatum'));
  const ende = iso10(feldVon(m, 'mietende', 'mietende')) || (!aktiv ? (auszug || iso10(new Date().toISOString())) : '');
  // Ein ehemaliger Mieter darf einen inzwischen eingetragenen Nachfolger nicht überschreiben
  if (!aktiv && w.mieterId != null && m.id != null && String(w.mieterId) !== String(m.id)) return wohnungen;
  const kaution = feldVon(m, 'kaution_betrag', 'kautionBetrag');
  const neu = {
    ...w,
    ...(m.id != null ? { mieterId: m.id } : {}),
    mieterName: m.name || w.mieterName,
    mietbeginn: iso10(feldVon(m, 'mietbeginn', 'mietbeginn')) || w.mietbeginn || '',
    mietende: ende,
    ...(kaution !== undefined && kaution !== null && kaution !== '' ? { kautionBetrag: Number(kaution) || 0 } : {}),
    ...(feldVon(m, 'kaution_bezahlt', 'kautionBezahlt') !== undefined ? { kautionBezahlt: !!feldVon(m, 'kaution_bezahlt', 'kautionBezahlt') } : {}),
    leer: false,
  };
  const gleich = ['mieterId', 'mieterName', 'mietbeginn', 'mietende', 'kautionBetrag', 'kautionBezahlt', 'leer'].every(k => (neu[k] ?? '') === (w[k] ?? ''));
  if (gleich) return wohnungen;
  const liste = [...wohnungen]; liste[i] = neu; return liste;
}

// Umgekehrt: was im Wohnungsformular geändert wurde, als Änderung am Mieterdatensatz (oder null)
export function mieterAusWohnungAenderung(m, w) {
  if (!m?.id || !w) return null;
  const ziel = {
    name: w.mieterName || m.name,
    mietbeginn: w.mietbeginn || null,
    mietende: w.mietende || null,
    kautionBetrag: Number(w.kautionBetrag) || 0,
    kautionBezahlt: !!w.kautionBezahlt,
  };
  const ist = {
    name: m.name, mietbeginn: iso10(m.mietbeginn) || null, mietende: iso10(m.mietende) || null,
    kautionBetrag: Number(m.kaution_betrag ?? m.kautionBetrag) || 0, kautionBezahlt: !!(m.kaution_bezahlt ?? m.kautionBezahlt),
  };
  const anders = Object.keys(ziel).some(k => (ziel[k] ?? '') !== (ist[k] ?? ''));
  if (!anders) return null;
  return { ...m, ...ziel, naechsteAnpassungDatum: m.naechste_anpassung_datum || m.naechsteAnpassungDatum || '' };
}
