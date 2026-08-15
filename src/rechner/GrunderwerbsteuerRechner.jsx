import { useState } from 'react';
import { GRUNDERWERBSTEUER_SAETZE } from './grunderwerbsteuerSaetze';

const fmtEur = (n) =>
  isFinite(n) ? Math.round(n).toLocaleString('de-DE') + ' €' : '–';

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
        className={`w-full border border-gray-200 rounded-xl py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all ${prefix ? 'pl-7 pr-3' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'}`}
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

export default function GrunderwerbsteuerRechner() {
  const [kaufpreis, setKaufpreis] = useState(400000);
  const [land, setLand] = useState('Nordrhein-Westfalen');

  const kp = parseFloat(kaufpreis) || 0;
  const satz = GRUNDERWERBSTEUER_SAETZE.find((s) => s.land === land)?.satz || 0;
  const steuer = kp * (satz / 100);

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
            Kostenlos · Alle 16 Bundesländer
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Grunderwerbsteuer-Rechner
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl">
            Grunderwerbsteuer beim Immobilienkauf sofort berechnen — mit den aktuellen Sätzen aller 16 Bundesländer, kostenlos und ohne Anmeldung.
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
                    <option key={s.land} value={s.land}>{s.land} ({s.satz.toFixed(1).replace('.', ',')} %)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Grunderwerbsteuer</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <ResultCard label="Grunderwerbsteuer" value={fmtEur(steuer)} sub={`${satz.toFixed(1).replace('.', ',')} % von ${fmtEur(kp)}`} accent />
                </div>
                <ResultCard label="Steuersatz" value={`${satz.toFixed(1).replace('.', ',')} %`} sub={land} />
                <ResultCard label="Kaufpreis inkl. GrESt" value={fmtEur(kp + steuer)} sub="Ohne Notar/Grundbuch/Makler" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 text-sm">
              <div className="font-semibold text-slate-800 mb-2">Hinweis</div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Die Grunderwerbsteuer ist nur eine von mehreren Kaufnebenkosten. Notar-, Grundbuch- und ggf. Maklerkosten kommen hinzu — nutze dafür unseren <a href="/kaufnebenkosten-rechner" className="text-indigo-600 font-semibold hover:underline">Kaufnebenkosten-Rechner</a> für die vollständige Kalkulation.
              </p>
            </div>
          </div>
        </div>

        <article className="mt-12 sm:mt-16 prose-sm max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Wie wird die Grunderwerbsteuer berechnet?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Die Grunderwerbsteuer berechnet sich als <strong>Kaufpreis × Steuersatz des Bundeslands</strong>, in dem sich die Immobilie befindet. Sie wird einmalig beim Eigentumswechsel fällig und ist vom Käufer zu zahlen, sofern im Kaufvertrag nichts anderes vereinbart ist.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Warum unterscheiden sich die Sätze je Bundesland?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seit der Föderalismusreform 2006 legen die Bundesländer den Steuersatz eigenständig fest. Die Sätze reichen aktuell von <strong>3,5 % in Bayern</strong> bis <strong>6,5 % in mehreren Ländern</strong> wie NRW, Brandenburg, Saarland und Schleswig-Holstein.
              </p>
            </div>
          </div>

          <div className="mb-10 flex flex-col sm:flex-row gap-3">
            <a href="/ratgeber/grunderwerbsteuer-bundeslaender" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">Grunderwerbsteuer nach Bundesland →</div>
            </a>
            <a href="/kaufnebenkosten-rechner" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Rechner</div>
              <div className="text-sm font-bold text-slate-900">Kaufnebenkosten-Rechner →</div>
            </a>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
            <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
            <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              renditly kalkuliert alle Kaufnebenkosten automatisch und berechnet deine tatsächliche Rendite nach Steuern.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
              <a href="/#pricing" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Preise ansehen</a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
          </div>

          <p className="text-xs text-slate-400 mt-6 text-center max-w-2xl mx-auto">
            Diese Berechnung dient der Orientierung und ersetzt keine steuerliche Beratung. Steuersätze können sich per Landesgesetz ändern — bitte vor dem Kauf beim zuständigen Finanzamt oder Notar verifizieren.
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
