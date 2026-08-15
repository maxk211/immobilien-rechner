import { useState, useMemo } from 'react';

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

function berechneTilgungsplan(darlehen, zinssatz, anfangstilgung, zinsbindung) {
  const rows = [];
  let restschuld = darlehen;
  const z = zinssatz / 100;
  const annuitaet = darlehen * (z + anfangstilgung / 100);
  let jahr = 1;
  let volltilgungJahr = null;

  while (restschuld > 1 && jahr <= 60) {
    const zinsJahr = restschuld * z;
    let tilgungJahr = annuitaet - zinsJahr;
    if (tilgungJahr > restschuld) tilgungJahr = restschuld;
    const restschuldEnde = Math.max(0, restschuld - tilgungJahr);
    rows.push({ jahr, restschuldStart: restschuld, zins: zinsJahr, tilgung: tilgungJahr, restschuldEnde });
    if (restschuldEnde <= 1 && volltilgungJahr === null) volltilgungJahr = jahr;
    restschuld = restschuldEnde;
    jahr++;
  }

  const restschuldNachZinsbindung = rows[zinsbindung - 1]?.restschuldEnde ?? restschuld;
  const gezahlteZinsenZinsbindung = rows.slice(0, zinsbindung).reduce((sum, r) => sum + r.zins, 0);
  const gezahlteTilgungZinsbindung = rows.slice(0, zinsbindung).reduce((sum, r) => sum + r.tilgung, 0);

  return { rows, annuitaet, volltilgungJahr, restschuldNachZinsbindung, gezahlteZinsenZinsbindung, gezahlteTilgungZinsbindung };
}

export default function TilgungsplanRechner() {
  const [darlehen, setDarlehen] = useState(320000);
  const [zinssatz, setZinssatz] = useState(3.8);
  const [anfangstilgung, setAnfangstilgung] = useState(2.0);
  const [zinsbindung, setZinsbindung] = useState(10);

  const d = parseFloat(darlehen) || 0;
  const z = parseFloat(zinssatz) || 0;
  const t = parseFloat(anfangstilgung) || 0;
  const zb = Math.max(1, Math.min(40, parseInt(zinsbindung) || 10));

  const plan = useMemo(() => berechneTilgungsplan(d, z, t, zb), [d, z, t, zb]);
  const monatsrate = plan.annuitaet / 12;

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
            Kostenlos · Jahr für Jahr
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Tilgungsplan-Rechner
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl">
            Annuitätendarlehen Jahr für Jahr durchrechnen — Restschuld, Zinsen und Tilgung auf einen Blick, inklusive Restschuld nach Ende der Zinsbindung.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-5">Dein Darlehen</h2>
            <div className="space-y-4">
              <InputField label="Darlehenssumme" value={darlehen} onChange={setDarlehen} prefix="€" />
              <InputField label="Sollzins p.a." value={zinssatz} onChange={setZinssatz} suffix="%" hint="Effektiver Jahreszins laut Finanzierungsangebot" />
              <InputField label="Anfängliche Tilgung" value={anfangstilgung} onChange={setAnfangstilgung} suffix="%" hint="Üblich 1–3 % p.a. zu Beginn" />
              <InputField label="Zinsbindung" value={zinsbindung} onChange={setZinsbindung} suffix="Jahre" hint="Für die Restschuld-Anzeige zum Ende der Zinsbindung" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Deine Rate</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <ResultCard label="Monatliche Annuität" value={fmtEur(monatsrate)} sub={`${fmtEur(plan.annuitaet)} pro Jahr, konstant`} accent />
                </div>
                <ResultCard label="Restschuld nach Zinsbindung" value={fmtEur(plan.restschuldNachZinsbindung)} sub={`Nach ${zb} Jahren`} />
                <ResultCard label="Volltilgung nach" value={plan.volltilgungJahr ? `${plan.volltilgungJahr} Jahren` : '> 60 Jahre'} sub="Bei konstanter Rate" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 text-sm">
              <div className="font-semibold text-slate-800 mb-2">Bis Ende der Zinsbindung ({zb} Jahre)</div>
              <div className="space-y-1.5 text-slate-600 text-xs">
                <div className="flex justify-between"><span>Gezahlte Zinsen</span><span className="font-medium text-slate-800">{fmtEur(plan.gezahlteZinsenZinsbindung)}</span></div>
                <div className="flex justify-between"><span>Gezahlte Tilgung</span><span className="font-medium text-slate-800">{fmtEur(plan.gezahlteTilgungZinsbindung)}</span></div>
                <div className="flex justify-between"><span>Restschuld danach</span><span className="font-medium text-slate-800">{fmtEur(plan.restschuldNachZinsbindung)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tilgungsplan-Tabelle */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm overflow-x-auto">
          <h2 className="text-base font-bold text-slate-900 mb-4">Tilgungsplan im Detail</h2>
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-gray-100">
                <th className="py-2 pr-3 font-semibold">Jahr</th>
                <th className="py-2 pr-3 font-semibold text-right">Restschuld (Start)</th>
                <th className="py-2 pr-3 font-semibold text-right">Zinsen</th>
                <th className="py-2 pr-3 font-semibold text-right">Tilgung</th>
                <th className="py-2 font-semibold text-right">Restschuld (Ende)</th>
              </tr>
            </thead>
            <tbody>
              {plan.rows.map((r) => (
                <tr key={r.jahr} className={`border-b border-gray-50 ${r.jahr === zb ? 'bg-indigo-50' : ''}`}>
                  <td className="py-2 pr-3 text-slate-700 font-medium">{r.jahr}{r.jahr === zb ? ' *' : ''}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">{fmtEur(r.restschuldStart)}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">{fmtEur(r.zins)}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">{fmtEur(r.tilgung)}</td>
                  <td className="py-2 text-right text-slate-800 font-medium">{fmtEur(r.restschuldEnde)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3">* Ende der eingegebenen Zinsbindung — hier wird üblicherweise eine Anschlussfinanzierung fällig.</p>
        </div>

        <article className="mt-12 sm:mt-16 prose-sm max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Wie funktioniert ein Annuitätendarlehen?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bei einem Annuitätendarlehen bleibt die <strong>monatliche Rate über die Zinsbindung konstant</strong>. Da die Restschuld mit jeder Zahlung sinkt, verschiebt sich das Verhältnis innerhalb der Rate: Der Zinsanteil sinkt von Jahr zu Jahr, der Tilgungsanteil steigt entsprechend — bei gleichbleibender Gesamtrate.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was passiert nach Ende der Zinsbindung?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nach Ablauf der Zinsbindung ist die Restschuld in der Regel noch nicht vollständig getilgt. Für die verbleibende Summe wird eine <strong>Anschlussfinanzierung</strong> zum dann aktuellen Zinssatz benötigt — dieser kann höher oder niedriger sein als der ursprüngliche Zins.
              </p>
            </div>
          </div>

          <div className="mb-10 flex flex-col sm:flex-row gap-3">
            <a href="/ratgeber/immobilienfinanzierung" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">Immobilienfinanzierung für Kapitalanleger →</div>
            </a>
            <a href="/kaufnebenkosten-rechner" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Rechner</div>
              <div className="text-sm font-bold text-slate-900">Kaufnebenkosten-Rechner →</div>
            </a>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
            <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
            <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              renditly verwaltet mehrere Finanzierungsphasen pro Immobilie und warnt automatisch vor auslaufender Zinsbindung.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
              <a href="/#pricing" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Preise ansehen</a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
          </div>

          <p className="text-xs text-slate-400 mt-6 text-center max-w-2xl mx-auto">
            Diese Berechnung dient der Orientierung und ersetzt keine individuelle Finanzierungsberatung. Reale Konditionen hängen von Bonität, Beleihungsauslauf und Bank ab.
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
