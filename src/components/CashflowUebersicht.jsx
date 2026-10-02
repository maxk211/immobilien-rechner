import { useState, useMemo } from 'react';
import { Wallet, Landmark, AlertTriangle, ParkingSquare } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { getAktuelleMiete, getAktuellerWert, getJahresDurchschnittFuerFeld } from '../utils/miete.js';
import { berechneJahresRateFuerPhasen, berechneZinsUndTilgung, kostenStruktur, cashflowMonat } from '../utils/berechnung.js';
import { bausparMonat } from '../utils/bauspar.js';
import { nachforderungMonat, nachforderungJahr, hatNachforderungen, heuteKey } from '../utils/nachforderung.js';

// ── Hilfsfunktion: Zeile in Tabelle ─────────────────────────────────────────
function CfZeile({ label, monat, jahr, color = 'gray', einzug = false, bold = false, separator = false, plus = false, hideZero = false }) {
  if (hideZero && !monat && !jahr) return null;
  const colors = {
    green: 'text-emerald-600',
    red: 'text-red-500',
    blue: 'text-indigo-600',
    orange: 'text-orange-500',
    gray: 'text-gray-700',
  };
  const textClass = `${colors[color]} ${bold ? 'font-bold' : ''}`;
  const sign = (v) => v > 0 && plus ? '+' : v < 0 ? '−' : '';
  const fmt = (v) => v == null ? '—' : `${sign(v)}${formatCurrency(Math.abs(v))}`;

  return (
    <>
      {separator && <tr><td colSpan={3}><div className="border-t border-gray-200 my-0.5" /></td></tr>}
      <tr className={bold ? 'bg-gray-50' : ''}>
        <td className={`py-1.5 pr-2 text-xs ${textClass} ${einzug ? 'pl-4' : 'pl-1'}`}>{label}</td>
        <td className={`py-1.5 text-right text-xs ${textClass} font-${bold ? 'bold' : 'medium'} pr-3`}>{fmt(monat)}</td>
        <td className={`py-1.5 text-right text-xs ${textClass} font-${bold ? 'bold' : 'medium'} pr-1`}>{fmt(jahr)}</td>
      </tr>
    </>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
const CashflowUebersicht = ({ params, ergebnis, immobilie, investitionen = [], anteilFaktor = 1, onOpenFinanzierung }) => {
  const [tab, setTab] = useState('monat'); // 'monat' | 'jahr' | 'verlauf' (Rechenweg Monat/Jahr/Prognose)

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();
  const a = (v) => Math.round((v || 0) * anteilFaktor);
  const isGbR = anteilFaktor !== 1;

  // ── Monatswerte: dieselbe Funktion wie Objektkarte, Cockpit und Dashboard (B12/B15) ──
  const cfGemeinsam = useMemo(() => cashflowMonat({ ...immobilie, ...params }), [immobilie, params]);
  const kreditDetails = { zinsen: cfGemeinsam.zinsen, tilgung: cfGemeinsam.tilgung, gesamt: cfGemeinsam.rate };

  // ── Jahreszins/-tilgung: exakte Summe der 12 Monate (nicht × 12!) ──────────
  const jahresKredit = useMemo(() => {
    const result = berechneZinsUndTilgung(params, aktuellesJahr);
    if (!result || ergebnis.monatlicheRate <= 0) return null;
    return {
      // Dieselbe Monatsliste wie der Finanzierungs-Reiter — auch im Startjahr nur die echten Monate
      zinsen: result.zinsen,
      tilgung: result.tilgung,
      gesamt: result.zinsen + result.tilgung,
    };
  }, [params, ergebnis, aktuellesJahr]);

  // ── Monatswerte für aktuelles Jahr (aus cashflowMonat) ──────────────────────
  const monat = useMemo(() => {
    const cf = cfGemeinsam;
    const sp = params.stellplatz;
    return {
      einnahmen: cf.kaltmiete, stellplatz: cf.stellplatz, nkVomMieter: cf.ks ? cf.ks.nkVomMieter : 0, ks: cf.ks,
      zinsen: cf.zinsen, tilgung: cf.tilgung,
      kreditrate: cf.rate, bauspar: cf.bauspar,
      gesamtEinnahmen: cf.einnahmen, gesamtBetrieb: cf.betrieb,
      vorTilgung: cf.vor, // "vor Tilgung" = nach Zinsen und Bausparrate, vor Tilgungsanteil
      nachTilgung: cf.nach,
      sp, spAnzahl: sp?.anzahl || 1,
    };
  }, [cfGemeinsam, params.stellplatz]);

  // ── Jahreszahlen für die Ergebnisleiste (Abschnitt 3.3) — exakte Zinssummen,
  // nicht × 12. Auf Komponentenebene statt in einer IIFE im JSX, damit die
  // Ergebnisleiste oben unabhängig vom aktiven Unter-Tab (aktuell/verlauf)
  // gerendert werden kann. ────────────────────────────────────────────────────
  // Jahreswerte des laufenden Jahres: Kosten monatsgenau (Kostenanpassungen und
  // "Wer zahlt?"-Wechsel im Jahr), nicht einfach der heutige Monat × 12.
  const ksJahr = useMemo(() => kostenStruktur(params, (f) => getJahresDurchschnittFuerFeld(params, aktuellesJahr, f), aktuellesJahr), [params, aktuellesJahr]);
  const betriebJahr = ksJahr.bewirtschaftung * 12;
  const einnahmenJahr = (monat.einnahmen + monat.stellplatz + ksJahr.nkImCashflow) * 12;
  const jZinsenJahr = jahresKredit?.zinsen ?? monat.zinsen * 12;
  const jGesamtJahr = jahresKredit?.gesamt ?? monat.kreditrate * 12;
  const vorTilgungJahr = a(einnahmenJahr) - a(betriebJahr) - a(jZinsenJahr) - a(cfGemeinsam.bausparKosten) * 12;
  const nachTilgungJahr = a(einnahmenJahr) - a(betriebJahr) - a(jGesamtJahr) - a(monat.bauspar) * 12;

  // ── Jahresverlaufsdaten ────────────────────────────────────────────────────
  const verlaufDaten = useMemo(() => {
    const daten = [];
    let kumuliert = 0;
    const phasen = params.finanzierungsphasen;
    const kreditStartStr = phasen?.[0]?.kreditStartDatum || params.kaufdatum;
    const kreditStartJahr = kreditStartStr ? new Date(kreditStartStr).getFullYear() : kaufjahr;
    const cfFK = (() => {
      const kauf = params.kaufnebenkosten ?? 10;
      const kNKAbs = params.kaufpreis * (kauf / 100);
      const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
        ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
        : (params.eigenkapital ?? 0);
      return params.finanzierungsbetrag ?? Math.max(0, params.kaufpreis + kNKAbs - gesamtEK);
    })();

    // Mietanpassungen sortiert (für getMieteForJahr)
    const mietAnpSorted = [...(params.mietAnpassungen || [])]
      .filter(a => a.kaltmiete != null)
      .sort((a, b) => new Date(a.datum) - new Date(b.datum));

    // Monatlich gewichtete Durchschnittsmiete für ein Jahr — berücksichtigt
    // geplante und vergangene Mietanpassungen korrekt (auch unterjährige Änderungen)
    const getMieteForJahr = (jahr) => {
      const histMiete = (params.mietHistorie || {})[`${jahr}`];
      if (histMiete?.kaltmiete != null) return histMiete.kaltmiete; // Manuelle Override hat Vorrang
      if (mietAnpSorted.length === 0) return params.kaltmiete || 0;
      let summe = 0;
      for (let m = 0; m < 12; m++) {
        const monatsMitte = new Date(jahr, m, 15);
        let gueltige = null;
        for (const a of mietAnpSorted) {
          if (new Date(a.datum) <= monatsMitte) gueltige = a;
        }
        summe += gueltige?.kaltmiete ?? (params.kaltmiete || 0);
      }
      return summe / 12; // Monatsdurchschnitt (berücksichtigt unterjährige Anpassungen)
    };

    for (let jahr = kaufjahr; jahr <= aktuellesJahr + 5; jahr++) {
      const kaltmiete  = getMieteForJahr(jahr);
      const ksJ = kostenStruktur(params, (f) => getJahresDurchschnittFuerFeld(params, jahr, f), jahr);
      const nkVM = ksJ.nkImCashflow;
      const sp = params.stellplatz;
      const stellplatz = (sp?.vorhanden && sp?.istVermietet)
        ? (sp.monatlicheMiete || 0) * (sp.anzahl || 1) : 0;

      const einnahmen = (kaltmiete + nkVM + stellplatz) * 12;
      // Monatlich gewichteter Jahresdurchschnitt je Kostenfeld — berücksichtigt
      // unterjährige, datumsbasierte Anpassungen (analog getMieteForJahr oben).
      const betrieb = ksJ.bewirtschaftung * 12;

      const monatsRate = berechneJahresRateFuerPhasen(phasen, cfFK, kreditStartJahr, jahr, ergebnis.monatlicheRate);
      const kreditrate = monatsRate * 12;
      const bsJ = bausparMonat(params, new Date(jahr, 5, 15));
      const bauspar = bsJ.gesamt * 12;
      const bausparKosten = bsJ.kosten * 12; // Rücklage zählt auch "vor Tilgung", Tilgungsersatz nicht
      const einmalInvest = investitionen
        .filter(inv => new Date(inv.datum).getFullYear() === jahr)
        .reduce((sum, inv) => sum + inv.betrag, 0);

      // Cashflow vor Tilgung: Einnahmen − Betrieb − Zinsen (exakt, phasenaware) − Bauspar
      const zinsResult = berechneZinsUndTilgung(params, jahr);
      const jahresZinsen = zinsResult?.zinsen ?? 0;
      const cfVorTilgung = einnahmen - betrieb - jahresZinsen - bausparKosten;

      // Cashflow nach Tilgung: Einnahmen − Betrieb − Kreditrate − Bauspar − Einmalinvestitionen
      // Nachforderung mit Ratenplan (vorübergehend): Rückzahlungen der Mieter − Raten an den Anbieter
      const nachforderung = hatNachforderungen(params) ? nachforderungJahr(params, jahr).netto : 0;
      const cashflow = einnahmen - betrieb - kreditrate - bauspar - einmalInvest + nachforderung;
      kumuliert += cashflow;

      daten.push({
        jahr,
        einnahmen: Math.round(einnahmen),
        stellplatzJahr: Math.round(stellplatz * 12),
        betrieb: Math.round(betrieb),
        kreditrate: Math.round(kreditrate),
        bauspar: Math.round(bauspar),
        investitionen: Math.round(einmalInvest),
        jahresZinsen: Math.round(jahresZinsen),
        cfVorTilgung: Math.round(cfVorTilgung),
        cashflow: Math.round(cashflow),
        nachforderung: Math.round(nachforderung),
        kumuliert: Math.round(kumuliert),
        istVorjahr: jahr < aktuellesJahr,
        istAktuell: jahr === aktuellesJahr,
        istPrognose: jahr > aktuellesJahr,
      });
    }
    return daten;
  }, [params, ergebnis, kaufjahr, aktuellesJahr, investitionen]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-1"><Wallet size={16} /> Cashflow-Übersicht</h3>
          {isGbR && (
            <span className="text-[10px] text-violet-600 font-medium flex items-center gap-0.5">
              <Landmark size={11} /> GbR — Ihr {Math.round(anteilFaktor * 100)}%-Anteil
            </span>
          )}
        </div>
        {/* Rechenweg: Monat / Jahr / Prognose */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
          {[['monat', 'Monat'], ['jahr', 'Jahr'], ['verlauf', 'Prognose']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${tab === id ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Abschnitt 3.3: Ergebnisleiste oben, unabhängig vom Unter-Tab sichtbar —
          "Cashflow nach Tilgung" groß, davor "vor Tilgung". Echtes CSS-Sticky
          (bleibt beim Scrollen fixiert) ist hier bewusst nicht umgesetzt: die
          Tab-Leiste in KaufimmobilieDetail ist bereits sticky top-0 in
          demselben Scroll-Container, ein zweites sticky-Element ohne exakten
          Pixel-Offset würde dahinter verschwinden oder überlappen — das lässt
          sich ohne visuelle Prüfung nicht sicher einstellen.
          Reihenfolge weiter unten identisch, nur nicht mehr dupliziert. */}
      <div className="px-4 pt-4 space-y-2">
        <div className={`rounded-xl border px-4 py-3 flex justify-between items-center ${monat.vorTilgung >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div>
            <div className="font-bold text-sm text-gray-800">Cashflow vor Tilgung</div>
            <div className="text-[11px] text-gray-500">Einnahmen − Betrieb − Zinsen{monat.bauspar > 0 ? ' − Bauspar' : ''}</div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black ${monat.vorTilgung >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {monat.vorTilgung >= 0 ? '+' : ''}{formatCurrency(a(monat.vorTilgung))}
              <span className="text-xs font-normal text-gray-400">/Mo</span>
            </div>
            <div className={`text-sm font-semibold ${vorTilgungJahr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {vorTilgungJahr >= 0 ? '+' : ''}{formatCurrency(Math.abs(vorTilgungJahr))}
              <span className="text-xs font-normal text-gray-400">/Jahr</span>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border px-4 py-3 flex justify-between items-center ${monat.nachTilgung >= 0 ? 'bg-emerald-100 border-emerald-300' : 'bg-red-100 border-red-300'}`}>
          <div>
            <div className="font-bold text-sm text-gray-800">Cashflow nach Tilgung</div>
            <div className="text-[11px] text-gray-500">Einnahmen − Betrieb − Kreditrate{monat.bauspar > 0 ? ' − Bauspar' : ''}</div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black ${monat.nachTilgung >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {monat.nachTilgung >= 0 ? '+' : ''}{formatCurrency(a(monat.nachTilgung))}
              <span className="text-xs font-normal text-gray-400">/Mo</span>
            </div>
            <div className={`text-sm font-semibold ${nachTilgungJahr >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {nachTilgungJahr >= 0 ? '+' : ''}{formatCurrency(Math.abs(nachTilgungJahr))}
              <span className="text-xs font-normal text-gray-400">/Jahr</span>
            </div>
          </div>
        </div>

        {/* "Aus der Finanzierung" — schreibgeschützte Kurzfassung mit Link zum
            Finanzierungs-Tab, damit Zins/Tilgung/Bauspar nur an einer Stelle
            editierbar sind ("eine Wahrheit pro Zahl"). */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            <span className="font-bold text-indigo-700 flex items-center gap-1"><Landmark size={12}/> Aus der Finanzierung</span>
            <span>Zins <strong className="text-gray-800">{formatCurrency(a(monat.zinsen))}</strong>/Mo</span>
            <span>Tilgung <strong className="text-gray-800">{formatCurrency(a(monat.tilgung))}</strong>/Mo</span>
            {monat.bauspar > 0 && <span>Bausparrate <strong className="text-gray-800">{formatCurrency(a(monat.bauspar))}</strong>/Mo</span>}
          </div>
          {onOpenFinanzierung && (
            <button onClick={onOpenFinanzierung} className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap">
              Öffnen ›
            </button>
          )}
        </div>
      </div>

      {/* ── Rechenweg Monat / Jahr (UX-Paket Teil 2, Nachtrag) ───────────────── */}
      {(tab === 'monat' || tab === 'jahr') && (() => {
        const jz = tab === 'jahr';
        // Nachforderung: echter Wert dieses Monats bzw. Summe des Jahres (Ist bis heute, danach Plan)
        const nf = hatNachforderungen(params) ? (jz ? nachforderungJahr(params, aktuellesJahr) : nachforderungMonat(params, heuteKey())) : null;
        const ks = jz ? ksJahr : monat.ks; // Jahr: monatsgenaue Summe des laufenden Jahres
        const f = tab === 'monat' ? 1 : 12;
        const Z = ({ label, wert, color = 'red', einzug = false, bold = false, separator = false, plus = false, hideZero = false, gedimmt = false, jahrWert }) => {
          const v = jz && jahrWert != null ? jahrWert : wert * f;
          if (hideZero && !v) return null;
          const c = gedimmt ? 'text-gray-400' : { green: 'text-emerald-600', red: 'text-red-500', blue: 'text-indigo-600', violet: 'text-indigo-700', orange: 'text-orange-500', gray: 'text-gray-600' }[color];
          const sign = v > 0 && plus ? '+' : v < 0 || (!plus && v > 0 && color === 'red') ? '−' : '';
          return (
            <>
              {separator && <tr><td colSpan={2}><div className="border-t border-gray-200 my-0.5" /></td></tr>}
              <tr className={bold ? 'bg-gray-50' : ''}>
                <td className={`py-1.5 pr-2 text-xs ${c} ${bold ? 'font-bold' : ''} ${einzug ? 'pl-5' : 'pl-1'}`}>{label}</td>
                <td className={`py-1.5 text-right text-xs ${c} ${bold ? 'font-bold' : 'font-medium'} pr-1 tabular-nums`}>{sign}{formatCurrency(Math.abs(a(v)))}</td>
              </tr>
            </>
          );
        };
        const kopf = (t) => <tr><td colSpan={2} className="pt-3 pb-0.5 pl-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">{t}</td></tr>;
        return (
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Rechenweg {aktuellesJahr} · {jz ? 'pro Jahr' : 'pro Monat'}</p>
          <table className="w-full">
            <tbody>
              {kopf('Einnahmen')}
              <Z label={ks.modell === 'warmmiete' ? 'Pauschalmiete' : 'Kaltmiete'} color="green" plus wert={monat.einnahmen} />
              {monat.stellplatz > 0 && (
                <Z label={<span className="inline-flex items-center gap-1"><ParkingSquare size={11}/>{`Stellplatz${monat.spAnzahl > 1 ? ` (${monat.spAnzahl}×)` : ''}`}</span>}
                  color="green" plus einzug wert={monat.stellplatz} />
              )}
              {monat.nkVomMieter > 0 && (
                <Z label={ks.nuBekannt ? 'Nebenkosten vom Mieter · läuft durch' : 'Nebenkosten vom Mieter'} color="green" plus gedimmt={ks.nuBekannt} wert={monat.nkVomMieter} />
              )}
              <Z label="Einnahmen" color="green" plus bold separator wert={monat.gesamtEinnahmen} jahrWert={einnahmenJahr} />

              {kopf('Ausgaben')}
              <Z label="Hausgeld an die WEG" wert={ks.hausgeld} hideZero gedimmt={ks.nuBekannt} />
              {ks.nuBekannt && ks.hausgeld > 0 && (<>
                <Z label="davon umlagefähig, durch NK gedeckt" einzug gedimmt wert={ks.umlagefaehig} />
                <Z label="davon nicht umlagefähig" einzug color="violet" wert={ks.nichtUmlagefaehig} />
              </>)}
              <Z label="Sondereigentumsverwaltung" wert={ks.sev} hideZero />
              <Z label="Grundsteuer" wert={ks.grundsteuer} hideZero />
              <Z label="Eigene Rücklage für Reparaturen" wert={ks.weitere.ruecklage} hideZero />
              <Z label="Versicherungen" wert={ks.weitere.versicherung} hideZero />
              <Z label="Strom" wert={ks.weitere.strom} hideZero />
              <Z label="Heizung" wert={ks.weitere.heizung} hideZero />
              <Z label="Rundfunkbeitrag" wert={ks.weitere.rundfunk} hideZero />
              <Z label="Internet" wert={ks.weitere.internet} hideZero />
              <Z label="Kontoführung" wert={ks.weitere.kontofuehrung} hideZero />
              <Z label="Eigene Position" wert={ks.weitere.sonstige} hideZero />
              <Z label="Ausgaben" bold separator wert={monat.gesamtBetrieb} jahrWert={betriebJahr} />

              {kopf('Finanzierung')}
              <Z label="Zinsen" wert={monat.zinsen} jahrWert={jahresKredit?.zinsen} />
              <Z label="Tilgung (Eigenkapitalaufbau)" color="blue" einzug wert={monat.tilgung} jahrWert={jahresKredit?.tilgung} />
              {cfGemeinsam.bausparTilgung > 0 && <Z label="Bausparrate · Tilgungsersatz (Vermögensaufbau)" color="blue" einzug wert={cfGemeinsam.bausparTilgung} />}
              {cfGemeinsam.bausparKosten > 0 && <Z label="Bausparrate · Rücklage fürs Objekt" color="orange" wert={cfGemeinsam.bausparKosten} />}

              <Z label="Cashflow vor Tilgung" color={monat.vorTilgung >= 0 ? 'green' : 'red'} plus bold separator
                wert={monat.vorTilgung} jahrWert={vorTilgungJahr / (anteilFaktor || 1)} />
              <Z label="Cashflow nach Tilgung" color={monat.nachTilgung >= 0 ? 'green' : 'red'} plus bold
                wert={monat.nachTilgung} jahrWert={nachTilgungJahr / (anteilFaktor || 1)} />

              {nf && (nf.einnahmen > 0 || nf.ausgabe > 0) && (<>
                {kopf(jz ? `Nachforderung ${aktuellesJahr} · vorübergehend` : 'Nachforderung · vorübergehend')}
                <Z label="Rückzahlungen der Mieter" color="green" plus wert={nf.einnahmen} jahrWert={nf.einnahmen} />
                <Z label="Raten an den Anbieter" wert={nf.ausgabe} jahrWert={nf.ausgabe} />
                <Z label="Nach Tilgung inkl. Nachforderung" color={(jz ? nachTilgungJahr / (anteilFaktor || 1) : monat.nachTilgung) + nf.netto >= 0 ? 'green' : 'red'} plus bold separator
                  wert={monat.nachTilgung + nf.netto} jahrWert={nachTilgungJahr / (anteilFaktor || 1) + nf.netto} />
              </>)}
            </tbody>
          </table>

          {!ks.nuBekannt && ks.hausgeld > 0 && ks.modell !== 'warmmiete' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              Der nicht umlagefähige Teil des Hausgelds fehlt noch. Bis dahin rechnet renditly mit dem vollen Hausgeld
              und der vollen Nebenkosten-Vorauszahlung — das macht den Cashflow meist zu positiv.
            </div>
          )}
          {ks.nuBekannt && (
            <p className="mt-3 text-[11px] text-gray-400">
              Im Cashflow zählt vom Hausgeld nur der nicht umlagefähige Teil. Der Rest und die Nebenkosten-Vorauszahlung laufen durch und gleichen sich über die Jahresabrechnung aus.
            </p>
          )}
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
            Tilgung ist kein Verlust, sondern Eigenkapitalaufbau. Der Wert vor Tilgung zeigt, ob die Wohnung aus eigener Kraft trägt.
          </div>
        </div>
        );
      })()}

      {/* ── TAB: Verlauf & Prognose ─────────────────────────────────────────── */}
      {tab === 'verlauf' && (
        <div className="p-4">
          {/* Disclaimer */}
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="font-bold inline-flex items-center gap-1"><AlertTriangle size={12}/> Hinweis zu historischen Werten:</span> Vorjahres-Cashflows
            sind nur korrekt, wenn Miethistorie und Kostenwerte gepflegt wurden.
            Mietanpassungen (geplante & vergangene) werden automatisch pro Jahr berücksichtigt.
          </div>

          {/* Mobile: Karten */}
          <div className="sm:hidden space-y-2">
            {verlaufDaten.map(d => {
              const af = anteilFaktor;
              return (
                <div key={d.jahr} className={`rounded-xl border p-3 ${
                  d.istAktuell ? 'bg-blue-50 border-blue-300' :
                  d.istPrognose ? 'bg-gray-50 border-dashed border-gray-200' :
                  'bg-white border-gray-100'
                }`}>
                  {/* Header: Jahr + CF nach Tilgung */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold text-sm ${d.istAktuell ? 'text-indigo-700' : d.istPrognose ? 'text-gray-400' : 'text-gray-700'}`}>
                        {d.jahr}
                      </span>
                      {d.istAktuell && <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">Aktuell</span>}
                      {d.istPrognose && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Prognose</span>}
                      {d.istVorjahr && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Vorjahr</span>}
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-sm ${d.cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {d.cashflow >= 0 ? '+' : ''}{formatCurrency(Math.round(d.cashflow * af))}
                        <span className="text-[10px] font-normal text-gray-400 ml-0.5">nach Tilg.</span>
                      </div>
                      <div className={`text-[11px] font-semibold ${d.cfVorTilgung >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {d.cfVorTilgung >= 0 ? '+' : ''}{formatCurrency(Math.round(d.cfVorTilgung * af))}
                        <span className="text-[10px] font-normal text-gray-400 ml-0.5">vor Tilg.</span>
                      </div>
                    </div>
                  </div>
                  {/* Kennzahlen */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-400 mb-0.5">Einnahmen</div>
                      <div className="text-emerald-600 font-semibold">{formatCurrency(Math.round(d.einnahmen * af))}</div>
                      {d.stellplatzJahr > 0 && (
                        <div className="text-[10px] text-emerald-400">inkl. {formatCurrency(Math.round(d.stellplatzJahr * af))} SP</div>
                      )}
                    </div>
                    <div>
                      <div className="text-gray-400 mb-0.5">Betrieb</div>
                      <div className="text-red-500 font-semibold">{formatCurrency(Math.round(d.betrieb * af))}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-0.5">Kumuliert</div>
                      <div className={`font-semibold ${d.kumuliert >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.round(d.kumuliert * af))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Tabelle */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left p-2 font-semibold rounded-l">Jahr</th>
                  <th className="text-right p-2 text-emerald-600 font-semibold">Einnahmen</th>
                  <th className="text-right p-2 text-red-500 font-semibold">Betrieb</th>
                  <th className="text-right p-2 text-red-600 font-semibold">Kreditrate</th>
                  <th className="text-right p-2 text-orange-500 font-semibold">Invest.</th>
                  <th className="text-right p-2 text-emerald-500 font-semibold">CF vor Tilg.</th>
                  <th className="text-right p-2 font-bold text-gray-800">CF nach Tilg.</th>
                  <th className="text-right p-2 text-indigo-600 font-semibold rounded-r">Kumuliert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verlaufDaten.map(d => (
                  <tr key={d.jahr} className={`${
                    d.istAktuell ? 'bg-blue-50 font-semibold' :
                    d.istPrognose ? 'text-gray-400 bg-gray-50/50' :
                    'hover:bg-gray-50'
                  }`}>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <span>{d.jahr}</span>
                        {d.istAktuell && <span className="text-[9px] bg-blue-200 text-blue-800 px-1 py-0.5 rounded-full font-bold">Aktuell</span>}
                        {d.istPrognose && <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded-full">Prognose</span>}
                        {d.istVorjahr && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">Vorjahr</span>}
                      </div>
                    </td>
                    <td className="p-2 text-right text-emerald-600">
                      {formatCurrency(Math.round(d.einnahmen * anteilFaktor))}
                      {d.stellplatzJahr > 0 && (
                        <div className="text-[10px] text-emerald-400 font-normal">
                          inkl. {formatCurrency(Math.round(d.stellplatzJahr * anteilFaktor))} SP
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-right text-red-500">{formatCurrency(Math.round(d.betrieb * anteilFaktor))}</td>
                    <td className="p-2 text-right text-red-600">{formatCurrency(Math.round(d.kreditrate * anteilFaktor))}</td>
                    <td className="p-2 text-right text-orange-500">{d.investitionen > 0 ? formatCurrency(Math.round(d.investitionen * anteilFaktor)) : '—'}</td>
                    <td className={`p-2 text-right font-semibold ${d.cfVorTilgung >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {d.cfVorTilgung >= 0 ? '+' : ''}{formatCurrency(Math.round(d.cfVorTilgung * anteilFaktor))}
                    </td>
                    <td className={`p-2 text-right font-bold ${d.cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {d.cashflow >= 0 ? '+' : ''}{formatCurrency(Math.round(d.cashflow * anteilFaktor))}
                    </td>
                    <td className={`p-2 text-right ${d.kumuliert >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.round(d.kumuliert * anteilFaktor))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {verlaufDaten.some(d => d.nachforderung) && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              Enthält die Nachforderung mit Ratenplan (Rückzahlungen der Mieter minus Raten an den Anbieter):{' '}
              {verlaufDaten.filter(d => d.nachforderung).map(d => `${d.jahr} ${d.nachforderung > 0 ? '+' : '−'}${formatCurrency(Math.abs(d.nachforderung))}`).join(' · ')}
            </div>
          )}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
            Mietanpassungen (geplante Mieterhöhungen) werden monatlich gewichtet eingerechnet.
            Anschlussfinanzierungen werden aus den Finanzierungsphasen übernommen.
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowUebersicht;
