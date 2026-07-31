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

// AfA-Satz nach Baujahr (linear, § 7 Abs. 4 EStG)
const ermittleAfaSatz = (baujahr) => {
  const jahr = parseInt(baujahr) || 0;
  if (jahr >= 2023) return 3; // Neubau ab 2023: 3 % linear
  if (jahr >= 1925) return 2; // Gebäude ab 1925: 2 %
  return 2.5; // Gebäude vor 1925: 2,5 %
};

export default function AfaRechner() {
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [grundstuecksanteil, setGrundstuecksanteil] = useState(20);
  const [nebenkosten, setNebenkosten] = useState(10);
  const [baujahr, setBaujahr] = useState(2010);
  const [steuersatz, setSteuersatz] = useState(42);
  const [sonderAfa, setSonderAfa] = useState(false);

  const kp = parseFloat(kaufpreis) || 0;
  const ga = parseFloat(grundstuecksanteil) || 0;
  const nk = parseFloat(nebenkosten) || 0;
  const bj = parseInt(baujahr) || 0;
  const sz = parseFloat(steuersatz) || 0;

  const gesamtkosten = kp * (1 + nk / 100);
  const gebaeudeAnteil = 100 - ga;
  const afaBemessungsgrundlage = gesamtkosten * (gebaeudeAnteil / 100);
  const afaSatz = ermittleAfaSatz(bj);
  const afaJahrLinear = afaBemessungsgrundlage * (afaSatz / 100);
  const steuerersparnisLinear = afaJahrLinear * (sz / 100);

  // Sonder-AfA §7b EStG für Neubau-Mietwohnungen (5 % p.a. zusätzlich, 4 Jahre, bei Baujahr ab 2023)
  const sonderAfaJahr = sonderAfa && bj >= 2023 ? afaBemessungsgrundlage * 0.05 : 0;
  const afaJahrGesamt = afaJahrLinear + sonderAfaJahr;
  const steuerersparnisGesamt = afaJahrGesamt * (sz / 100);

  const afaDauerJahre = afaSatz > 0 ? Math.round(100 / afaSatz) : 0;

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
          <a
            href="/"
            className="text-xs sm:text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all"
          >
            Kostenlos testen
          </a>
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
            AfA berechnen
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl">
            Abschreibung für Abnutzung bei vermieteten Immobilien — jährliche AfA, Steuerersparnis und Abschreibungsdauer sofort berechnet.
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
              <InputField label="Kaufnebenkosten" value={nebenkosten} onChange={setNebenkosten} suffix="%" hint="Notar, Grunderwerbsteuer, Makler — erhöht die AfA-Basis" />
              <InputField label="Grundstücksanteil" value={grundstuecksanteil} onChange={setGrundstuecksanteil} suffix="%" hint="Anteil des Grund und Bodens am Kaufpreis — nicht abschreibbar. Typisch 15–30 %, siehe Kaufvertrag/Bodenrichtwert" />
              <InputField label="Baujahr" value={baujahr} onChange={setBaujahr} hint="Bestimmt den gesetzlichen AfA-Satz" />
              <InputField label="Persönlicher Steuersatz" value={steuersatz} onChange={setSteuersatz} suffix="%" hint="Grenzsteuersatz für die Ersparnis-Berechnung" />
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={sonderAfa}
                  onChange={(e) => setSonderAfa(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                />
                Sonder-AfA § 7b EStG (Neubau-Mietwohnungen ab 2023, +5 % für 4 Jahre)
              </label>
            </div>
          </div>

          {/* Ergebnisse */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Deine AfA</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <ResultCard
                    label="Jährliche AfA"
                    value={fmtEur(afaJahrGesamt)}
                    sub={`${fmt(afaSatz + (sonderAfa && bj >= 2023 ? 5 : 0), 1)} % der Bemessungsgrundlage`}
                    accent
                  />
                </div>
                <ResultCard
                  label="Monatliche AfA"
                  value={fmtEur(afaJahrGesamt / 12)}
                  sub="Rechnerischer Wertverzehr/Monat"
                />
                <ResultCard
                  label="AfA-Satz"
                  value={`${fmt(afaSatz, 1)} %`}
                  sub={afaDauerJahre > 0 ? `Abschreibung über ${afaDauerJahre} Jahre` : ''}
                />
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Steuerersparnis</h2>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard
                  label="Steuerersparnis/Jahr"
                  value={fmtEur(steuerersparnisGesamt)}
                  sub="AfA × Grenzsteuersatz"
                />
                <ResultCard
                  label="Steuerersparnis/Monat"
                  value={fmtEur(steuerersparnisGesamt / 12)}
                  sub="Wirkt sich auf Cashflow aus"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 text-sm">
              <div className="font-semibold text-slate-800 mb-2">Zusammenfassung</div>
              <div className="space-y-1.5 text-slate-600 text-xs">
                <div className="flex justify-between"><span>Gesamtkosten (inkl. NK)</span><span className="font-medium text-slate-800">{fmtEur(gesamtkosten)}</span></div>
                <div className="flex justify-between"><span>Gebäudeanteil ({fmt(gebaeudeAnteil, 0)} %)</span><span className="font-medium text-slate-800">{fmtEur(afaBemessungsgrundlage)}</span></div>
                <div className="flex justify-between"><span>Lineare AfA</span><span className="font-medium text-slate-800">{fmtEur(afaJahrLinear)}</span></div>
                {sonderAfa && bj >= 2023 && (
                  <div className="flex justify-between"><span>Sonder-AfA § 7b (4 Jahre)</span><span className="font-medium text-slate-800">{fmtEur(sonderAfaJahr)}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Erklärtexte — wichtig für GEO */}
        <article className="mt-12 sm:mt-16 prose-sm max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was ist die AfA bei Immobilien?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Die <strong>AfA (Absetzung für Abnutzung)</strong> ist die steuerliche Abschreibung des Gebäudewerts einer vermieteten Immobilie über die Nutzungsdauer. Sie mindert jedes Jahr das zu versteuernde Einkommen aus Vermietung und Verpachtung. <strong>Formel: Gebäudewert × AfA-Satz</strong>. Der Grundstücksanteil ist nicht abschreibbar, da Grund und Boden sich nicht abnutzt.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Wie hoch ist der AfA-Satz 2026?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Der lineare AfA-Satz richtet sich nach dem Baujahr: <strong>3 % pro Jahr</strong> für Neubauten ab Fertigstellung 2023, <strong>2 % pro Jahr</strong> für Gebäude ab Baujahr 1925, und <strong>2,5 % pro Jahr</strong> für Altbauten vor 1925 (§ 7 Abs. 4 EStG). Bei 2 % ergibt sich eine Abschreibungsdauer von 50 Jahren, bei 3 % rund 33 Jahre.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was ist die AfA-Bemessungsgrundlage?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Die AfA-Bemessungsgrundlage ist der <strong>Gebäudeanteil</strong> der Anschaffungskosten inklusive Kaufnebenkosten — ohne den Grundstücksanteil. Wird im Kaufvertrag kein Aufteilungsschlüssel genannt, orientiert sich das Finanzamt am Bodenrichtwert; ein üblicher Grundstücksanteil liegt bei 15–30 % je nach Lage.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Was ist die Sonder-AfA § 7b EStG?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Für neu gebaute Mietwohnungen mit Bauantrag/Bauanzeige seit 2023 gibt es zusätzlich zur linearen AfA eine <strong>Sonder-AfA von 5 % pro Jahr</strong> über die ersten 4 Jahre — vorausgesetzt bestimmte Effizienz- und Kostengrenzen werden eingehalten (u. a. Baukosten max. 5.200 €/m² Wohnfläche). Das erhöht die AfA in den ersten Jahren erheblich.
              </p>
            </div>
          </div>

          {/* Ratgeber-Verlinkung */}
          <div className="mb-10 flex flex-col sm:flex-row gap-3">
            <a href="/ratgeber/afa-und-steuern-vermietung" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">AfA und Steuern bei Vermietung: Der Leitfaden →</div>
            </a>
            <a href="/ratgeber/mietrendite-berechnen" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">Mietrendite berechnen: Der komplette Guide →</div>
            </a>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
            <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
            <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              renditly berechnet die AfA automatisch für jede Immobilie im Portfolio und exportiert deine kompletten Steuerdaten für den Steuerberater.
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

          {/* Rechtlicher Hinweis */}
          <p className="text-xs text-slate-400 mt-6 text-center max-w-2xl mx-auto">
            Diese Berechnung dient der Orientierung und ersetzt keine steuerliche Beratung. Bitte lasse die AfA-Bemessungsgrundlage und den Grundstücksanteil im Zweifel von deinem Steuerberater prüfen.
          </p>
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
