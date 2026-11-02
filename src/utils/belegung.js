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
    const kalt = Number(e.wohnung?.kaltmiete) || 0;
    return {
      immobilieId: immo.id,
      name: e.mieterName,
      zimmerBezeichnung: e.name,
      kaltmiete: kalt || null,
      gesamtueberweisung: kalt || null,
      mietbeginn: e.wohnung?.mietbeginn || null,
      mietende: e.wohnung?.mietende || null,
      aktiv: true,
    };
  });
}

export const BELEGUNG_TEXT = {
  voll: 'voll vermietet', teilweise: 'teilweise vermietet', leer: 'steht leer',
  unbekannt: 'Belegung offen', eigennutzung: 'selbst genutzt',
};
