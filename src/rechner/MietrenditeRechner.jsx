import { useState } from 'react';

const fmt = (n, decimals = 2) =>
  isFinite(n) ? n.toFixed(decimals).replace('.', ',') : '–';

const fmtEur = (n) =>
  isFinite(n) ? Math.round(n).toLocaleString('de-DE') + ' €' : '–';

const InputField = ({ label, value, onChange, prefix, suffix, hint }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">{prefix}</span>
      )}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-200 rounded-xl py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all ${prefix ? 'pl-7 pr-3' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'}`}
      />
      {suffix && (
        <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">{suffix}</span>
      )}
    </div>
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

const ResultCard = ({ label, value, sub, accent }) => (
  <div className={`rounded-2xl p-4 border ${accent ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-gray-100'}`}>
    <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</div>
    <div className={`text-2xl font-black ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    {sub && <div className={`text-xs mt-0.5 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</div>}
  </div>
);

const RatingBadge = ({ value, unit = '%' }) => {
  if (!isFinite(value)) return null;
  const good = value >= 4;
  const ok = value >= 2;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${good ? 'bg-emerald-100 text-emerald-700' : ok ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
      {good ? '✓ Gut' : ok ? '~ OK' : '✗ Niedrig'}
    </span>
  );
};

export default function MietrenditeRechner() {
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [nebenkosten, setNebenkosten] = useState(10);
  const [eigenkapital, setEigenkapital] = useState(60000);
  const [kaltmiete, setKaltmiete] = useState(900);
  const [kosten, setKosten] = useState(150);
  const [zins, setZins] = useState(3.8);

  const kp = parseFloat(kaufpreis) || 0;
  const nk = parseFloat(nebenkosten) || 0;
  const ek = parseFloat(eigenkapital) || 0;
  const km = parseFloat(kaltmiete) || 0;
  const ko = parseFloat(kosten) || 0;
  const zi = parseFloat(zins) || 0;

  const gesamtkosten = kp * (1 + nk / 100);
  const fremdkapital = Math.max(0, gesamtkosten - ek);
  const rate = fremdkapital * (zi / 100 / 12);
  const brutto = kp > 0 ? (km * 12) / kp * 100 : 0;
  const netto = gesamtkosten > 0 ? ((km - ko) * 12) / gesamtkosten * 100 : 0;
  const cashflow = km - ko - rate;
  const cashonCash = ek > 0 ? (cashflow * 12) / ek * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1.5 text-slate-900 hover:text-indigo-600 transition-colors">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span className="font-black text-base" style={{letterSpacing:'-0.02em'}}>renditly</span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/app"
              className="text-xs sm:text-sm font-medium text-slate-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
            >
              Login
            </a>
            <a
              href="/app"
              className="text-xs sm:text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all"
            >
              Kostenlos testen
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-4">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Kostenlos · Sofortiges Ergebnis
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Mietrendite berechnen
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl">
            Brutto- und Nettomietrendite, Cashflow und Cash-on-Cash-Rendite — sofort berechnet. Für Eigentumswohnungen, Mehrfamilienhäuser und alle Anlageimmobilien.
          </p>
        </div>
      </header>

      {/* Rechner */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Eingaben */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-5">Deine Immobilie</h2>
            <div className="space-y-4">
              <InputField label="Kaufpreis" value={kaufpreis} onChange={setKaufpreis} prefix="€" hint="Ohne Kaufnebenkosten" />
              <InputField label="Kaufnebenkosten" value={nebenkosten} onChange={setNebenkosten} suffix="%" hint="Notar, Grunderwerbsteuer, Makler — typisch 8–12 %" />
              <InputField label="Eigenkapital" value={eigenkapital} onChange={setEigenkapital} prefix="€" hint="Für Cashflow- und Renditeberechnung" />
              <InputField label="Kaltmiete pro Monat" value={kaltmiete} onChange={setKaltmiete} prefix="€" />
              <InputField label="Laufende Kosten / Monat" value={kosten} onChange={setKosten} prefix="€" hint="Hausgeld, Instandhaltung, Verwaltung" />
              <InputField label="Finanzierungszins" value={zins} onChange={setZins} suffix="%" hint="Aktueller Zinssatz für die Rate-Berechnung" />
            </div>
          </div>

          {/* Ergebnisse */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Deine Rendite</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <ResultCard
                    label="Bruttomietrendite"
                    value={`${fmt(brutto)} %`}
                    sub="Kaltmiete × 12 / Kaufpreis"
                    accent
                  />
                </div>
                <ResultCard
                  label="Nettomietrendite"
                  value={`${fmt(netto)} %`}
                  sub="nach Kosten, inkl. Nebenkosten"
                />
                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Bewertung</div>
                  <RatingBadge value={netto} />
                  <div className="text-xs text-slate-400 mt-2">{netto >= 4 ? '≥ 4 % Netto gilt als rentabel' : netto >= 2 ? '2–4 % ist Durchschnitt' : '< 2 % Netto ist knapp'}</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Cashflow</h2>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard
                  label="Monatlicher Cashflow"
                  value={isFinite(cashflow) ? `${cashflow >= 0 ? '+' : ''}${fmtEur(cashflow)}`.replace(' €', ' €') : '–'}
                  sub="Miete − Kosten − Rate"
                />
                <ResultCard
                  label="Cash-on-Cash"
                  value={`${fmt(cashonCash)} %`}
                  sub="Rendite auf Eigenkapital"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 text-sm">
              <div className="font-semibold text-slate-800 mb-2">Zusammenfassung</div>
              <div className="space-y-1.5 text-slate-600 text-xs">
                <div className="flex justify-between"><span>Gesamtkosten (inkl. NK)</span><span className="font-medium text-slate-800">{fmtEur(gesamtkosten)}</span></div>
                <div className="flex justify-between"><span>Fremdkapital</span><span className="font-medium text-slate-800">{fmtEur(fremdkapital)}</span></div>
                <div className="flex justify-between"><span>Monatliche Zinsrate</span><span className="font-medium text-slate-800">{fmtEur(rate)}</span></div>
                <div className="flex justify-between"><span>Jahreskaltmiete</span><span className="font-medium text-slate-800">{fmtEur(km * 12)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Erklärtexte — wichtig für GEO */}
        <article className="mt-12 sm:mt-16 prose-sm max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was ist die Bruttomietrendite?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Die <strong>Bruttomietrendite</strong> ist das Verhältnis der jährlichen Kaltmiete zum Kaufpreis — ohne Berücksichtigung von Kosten oder Kaufnebenkosten. <strong>Formel: (Kaltmiete × 12) / Kaufpreis × 100</strong>. Sie eignet sich für einen schnellen ersten Vergleich zwischen Objekten, sagt aber nichts über den tatsächlichen Gewinn aus.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was ist die Nettomietrendite?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Die <strong>Nettomietrendite</strong> berücksichtigt alle Kosten: Hausgeld, Instandhaltungsrücklage, Verwaltung und die Kaufnebenkosten. <strong>Formel: (Kaltmiete − Kosten) × 12 / Gesamtinvestition × 100</strong>. Alles ab 4 % Netto gilt als rentabel; unter 2 % ist die Rendite für die meisten Märkte zu niedrig.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was ist ein guter Cashflow bei Immobilien?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Der <strong>monatliche Cashflow</strong> ist der Betrag, der nach Abzug aller Kosten und der Finanzierungsrate übrig bleibt. Ein positiver Cashflow bedeutet, dass die Immobilie sich selbst trägt. Negativer Cashflow ist nicht automatisch schlecht — wenn die Wertsteigerung ihn überkompensiert. Als Faustregel: mindestens kostendeckend (≥ 0 €/Monat) sollte das Ziel sein.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was sind Kaufnebenkosten?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kaufnebenkosten entstehen zusätzlich zum Kaufpreis und bestehen aus <strong>Grunderwerbsteuer</strong> (3,5–6,5 % je nach Bundesland), <strong>Notarkosten</strong> (ca. 1,5 %) und ggf. <strong>Maklerprovision</strong> (bis 3,57 %). In Deutschland liegen die Gesamtnebenkosten typischerweise zwischen 8 und 12 % des Kaufpreises.
              </p>
            </div>
          </div>

          {/* Ratgeber-Verlinkung */}
          <div className="mb-10 flex flex-col sm:flex-row gap-3">
            <a href="/ratgeber/mietrendite-berechnen" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">Mietrendite berechnen: Der komplette Guide →</div>
            </a>
            <a href="/ratgeber/cashflow-bei-immobilien" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">Cashflow bei Immobilien: Was Vermieter wissen müssen →</div>
            </a>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
            <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
            <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              renditly trackt Cashflow, Mieter, Steuern und Wertsteigerung für alle deine Immobilien — dauerhaft, automatisch und sicher.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/"
                className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base"
              >
                90 Tage kostenlos testen →
              </a>
              <a
                href="/#pricing"
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base"
              >
                Preise ansehen
              </a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span className="font-black text-slate-700" style={{letterSpacing:'-0.02em'}}>renditly</span>
          <div className="flex gap-4">
            <a href="/" className="hover:text-slate-700 transition-colors">Startseite</a>
            <a href="/#pricing" className="hover:text-slate-700 transition-colors">Preise</a>
          </div>
          <span>© {new Date().getFullYear()} renditly</span>
        </div>
      </footer>
    </div>
  );
}
