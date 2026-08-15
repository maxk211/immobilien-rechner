import { useState } from 'react';
import { GRUNDERWERBSTEUER_SAETZE } from './grunderwerbsteuerSaetze';

const fmt = (n, decimals = 2) => isFinite(n) ? n.toFixed(decimals).replace('.', ',') : '–';
const fmtEur = (n) => isFinite(n) ? Math.round(n).toLocaleString('de-DE') + ' €' : '–';

const InputField = ({ label, value, onChange, prefix, suffix, hint }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-200 rounded-xl py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all ${prefix ? 'pl-7 pr-3' : 'pl-3'} ${suffix ? 'pr-14' : 'pr-3'}`}
      />
      {suffix && <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">{suffix}</span>}
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

export default function KaufnebenkostenRechner() {
  const [kaufpreis, setKaufpreis] = useState(400000);
  const [land, setLand] = useState('Nordrhein-Westfalen');
  const [notarGrundbuch, setNotarGrundbuch] = useState(2.0);
  const [maklerprovision, setMaklerprovision] = useState(3.57);
  const [eigenkapital, setEigenkapital] = useState(80000);

  const kp = parseFloat(kaufpreis) || 0;
  const grestSatz = GRUNDERWERBSTEUER_SAETZE.find((s) => s.land === land)?.satz || 0;
  const ngSatz = parseFloat(notarGrundbuch) || 0;
  const maklerSatz = parseFloat(maklerprovision) || 0;
  const ek = parseFloat(eigenkapital) || 0;

  const grest = kp * (grestSatz / 100);
  const notarGrundbuchKosten = kp * (ngSatz / 100);
  const maklerKosten = kp * (maklerSatz / 100);
  const nebenkostenGesamt = grest + notarGrundbuchKosten + maklerKosten;
  const nebenkostenSatzGesamt = grestSatz + ngSatz + maklerSatz;
  const gesamtinvestition = kp + nebenkostenGesamt;
  const finanzierungsbedarf = Math.max(0, gesamtinvestition - ek);
  const ekQuote = gesamtinvestition > 0 ? (ek / gesamtinvestition) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1.5 text-slate-900 hover:text-indigo-600 transition-colors">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span className="font-black text-base" style={{letterSpacing:'-0.02em'}}>renditly</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/app" className="text-xs sm:text-sm font-medium text-slate-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">Login</a>
            <a href="/app" className="text-xs sm:text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all">Kostenlos testen</a>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-4">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Kostenlos · Grunderwerbsteuer, Notar, Makler in einem Rechner
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Kaufnebenkosten-Rechner
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl">
            Alle Kaufnebenkosten einer Immobilie auf einen Blick — Grunderwerbsteuer, Notar- und Grundbuchkosten sowie Maklerprovision, kostenlos berechnet.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-5">Deine Immobilie</h2>
            <div className="space-y-4">
              <InputField label="Kaufpreis" value={kaufpreis} onChange={setKaufpreis} prefix="€" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bundesland</label>
                <select
                  value={land}
                  onChange={(e) => setLand(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                >
                  {GRUNDERWERBSTEUER_SAETZE.map((s) => (
                    <option key={s.land} value={s.land}>{s.land} (GrESt {s.satz.toFixed(1).replace('.', ',')} %)</option>
                  ))}
                </select>
              </div>
              <InputField label="Notar- und Grundbuchkosten" value={notarGrundbuch} onChange={setNotarGrundbuch} suffix="%" hint="Typisch 1,5–2,0 % des Kaufpreises" />
              <InputField label="Maklerprovision" value={maklerprovision} onChange={setMaklerprovision} suffix="%" hint="Käuferanteil, bei Halbteilung oft ~3,57 % brutto. 0 falls maklerfrei" />
              <InputField label="Vorhandenes Eigenkapital" value={eigenkapital} onChange={setEigenkapital} prefix="€" hint="Für Finanzierungsbedarf und EK-Quote" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Kaufnebenkosten</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <ResultCard label="Kaufnebenkosten gesamt" value={fmtEur(nebenkostenGesamt)} sub={`${fmt(nebenkostenSatzGesamt, 2)} % des Kaufpreises`} accent />
                </div>
                <ResultCard label="Grunderwerbsteuer" value={fmtEur(grest)} sub={`${fmt(grestSatz, 1)} % · ${land}`} />
                <ResultCard label="Notar + Grundbuch" value={fmtEur(notarGrundbuchKosten)} sub={`${fmt(ngSatz, 1)} %`} />
                <ResultCard label="Maklerprovision" value={fmtEur(maklerKosten)} sub={`${fmt(maklerSatz, 2)} %`} />
                <ResultCard label="Gesamtinvestition" value={fmtEur(gesamtinvestition)} sub="Kaufpreis + Nebenkosten" />
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Finanzierung</h2>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Finanzierungsbedarf" value={fmtEur(finanzierungsbedarf)} sub="Nach Abzug Eigenkapital" />
                <ResultCard label="Eigenkapitalquote" value={`${fmt(ekQuote, 1)} %`} sub="Bezogen auf Gesamtinvestition" />
              </div>
            </div>
          </div>
        </div>

        <article className="mt-12 sm:mt-16 prose-sm max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Welche Kaufnebenkosten fallen beim Immobilienkauf an?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Die drei größten Positionen sind die <strong>Grunderwerbsteuer</strong> (3,5–6,5 % je Bundesland), <strong>Notar- und Grundbuchkosten</strong> (üblich 1,5–2 %) sowie eine ggf. anfallende <strong>Maklerprovision</strong>. Zusammen liegen die Kaufnebenkosten in Deutschland meist zwischen 8 % und 15 % des Kaufpreises.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Wie viel Maklerprovision zahlt der Käufer?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seit 2020 gilt der Halbteilungsgrundsatz nach § 656c BGB: Ist der Makler für beide Seiten tätig, wird die Provision hälftig geteilt. Der Käuferanteil darf den Verkäuferanteil nicht übersteigen — in der Praxis meist rund 3,57 % brutto pro Seite.
              </p>
            </div>
          </div>

          <div className="mb-10 flex flex-col sm:flex-row gap-3">
            <a href="/grunderwerbsteuer-rechner" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Rechner</div>
              <div className="text-sm font-bold text-slate-900">Grunderwerbsteuer-Rechner →</div>
            </a>
            <a href="/ratgeber/maklerprovision-immobilienkauf" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">Maklerprovision beim Immobilienkauf →</div>
            </a>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
            <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
            <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              renditly berechnet deine tatsächliche Rendite inklusive aller Kaufnebenkosten und Finanzierungskosten automatisch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
              <a href="/#pricing" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Preise ansehen</a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
          </div>

          <p className="text-xs text-slate-400 mt-6 text-center max-w-2xl mx-auto">
            Diese Berechnung dient der Orientierung und ersetzt keine notarielle oder steuerliche Beratung. Tatsächliche Notar-, Grundbuch- und Maklerkosten können regional und je nach Anbieter abweichen.
          </p>
        </article>
      </main>

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
