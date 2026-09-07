import { useState } from 'react';
import FloatingCTA from '../components/FloatingCTA';
import ResultCTA from '../components/ResultCTA';

const fmtDatum = (d) => d instanceof Date && !isNaN(d)
  ? d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  : '–';

function addJahre(datum, jahre) {
  const d = new Date(datum);
  d.setFullYear(d.getFullYear() + jahre);
  return d;
}

function diffJahreMonate(von, bis) {
  if (bis <= von) return { jahre: 0, monate: 0 };
  let jahre = bis.getFullYear() - von.getFullYear();
  let monate = bis.getMonth() - von.getMonth();
  if (bis.getDate() < von.getDate()) monate -= 1;
  if (monate < 0) { monate += 12; jahre -= 1; }
  return { jahre, monate };
}

const ResultCard = ({ label, value, sub, accent }) => (
  <div className={`rounded-2xl p-4 border ${accent ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-gray-100'}`}>
    <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</div>
    <div className={`text-xl sm:text-2xl font-black ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    {sub && <div className={`text-xs mt-0.5 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</div>}
  </div>
);

export default function SpekulationsfristRechner() {
  const heuteStr = new Date().toISOString().slice(0, 10);
  const [erwerbsart, setErwerbsart] = useState('kauf'); // 'kauf' | 'schenkung'
  const [erwerbsdatum, setErwerbsdatum] = useState('2020-06-15');
  const [verkaufsdatum, setVerkaufsdatum] = useState(heuteStr);
  const [eigennutzung, setEigennutzung] = useState(false);

  const erwerb = erwerbsdatum ? new Date(erwerbsdatum) : null;
  const verkauf = verkaufsdatum ? new Date(verkaufsdatum) : new Date();
  const fristEnde = erwerb ? addJahre(erwerb, 10) : null;
  const fristAbgelaufen = fristEnde ? verkauf >= fristEnde : false;
  const steuerfrei = eigennutzung || fristAbgelaufen;
  const rest = fristEnde && !fristAbgelaufen ? diffJahreMonate(verkauf, fristEnde) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <FloatingCTA text="Steuerfreien Verkaufszeitpunkt automatisch im Blick behalten?" />
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
            Kostenlos · Sofort berechnet
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Spekulationsfrist-Rechner
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl">
            Ab wann ist der Verkauf deiner Immobilie steuerfrei? Berechne die 10-Jahresfrist nach § 23 EStG — inklusive Ausnahme bei Eigennutzung und Sonderfall Schenkung/Erbschaft.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-5">Deine Immobilie</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wie hast du die Immobilie erworben?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setErwerbsart('kauf')}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${erwerbsart === 'kauf' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-slate-600 hover:border-indigo-300'}`}
                  >
                    Gekauft
                  </button>
                  <button
                    onClick={() => setErwerbsart('schenkung')}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${erwerbsart === 'schenkung' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-slate-600 hover:border-indigo-300'}`}
                  >
                    Geschenkt / geerbt
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {erwerbsart === 'kauf' ? 'Kaufdatum (notarieller Vertrag)' : 'Kaufdatum des Vorbesitzers (Schenker/Erblasser)'}
                </label>
                <input
                  type="date"
                  value={erwerbsdatum}
                  onChange={(e) => setErwerbsdatum(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
                {erwerbsart === 'schenkung' && (
                  <p className="text-xs text-slate-400 mt-1">
                    Bei Schenkung oder Erbschaft läuft die Frist ab dem Kaufdatum des Vorbesitzers weiter (§ 23 Abs. 1 Satz 3 EStG) — nicht ab dem Datum der Schenkung/Erbschaft.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Geplantes Verkaufsdatum</label>
                <input
                  type="date"
                  value={verkaufsdatum}
                  onChange={(e) => setVerkaufsdatum(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">Standard: heute — ändere es, um einen zukünftigen Verkaufszeitpunkt zu prüfen.</p>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={eigennutzung}
                  onChange={(e) => setEigennutzung(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-indigo-600"
                />
                <span className="text-sm text-slate-600">
                  Ich habe die Immobilie im Verkaufsjahr und den beiden vorangegangenen Jahren <strong>selbst zu Wohnzwecken genutzt</strong>
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Ergebnis</h2>
              <div className="grid grid-cols-1 gap-3">
                <ResultCard
                  label={steuerfrei ? 'Verkauf ist steuerfrei' : 'Verkauf ist aktuell steuerpflichtig'}
                  value={steuerfrei ? '✓ Steuerfrei' : '⏳ Noch nicht'}
                  sub={
                    eigennutzung && !fristAbgelaufen
                      ? 'Wegen Eigennutzung — unabhängig von der 10-Jahresfrist'
                      : fristAbgelaufen
                        ? `10-Jahresfrist seit ${fmtDatum(fristEnde)} abgelaufen`
                        : rest ? `Noch ${rest.jahre} Jahr${rest.jahre === 1 ? '' : 'e'}${rest.monate > 0 ? ` und ${rest.monate} Monat${rest.monate === 1 ? '' : 'e'}` : ''} bis Fristablauf` : '–'
                  }
                  accent
                />
                <ResultCard label="Fristende (10 Jahre nach Erwerb)" value={fmtDatum(fristEnde)} sub={erwerbsart === 'schenkung' ? 'Gerechnet ab Kaufdatum des Vorbesitzers' : 'Gerechnet ab notariellem Kaufvertrag'} />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 text-sm">
              <div className="font-semibold text-slate-800 mb-2">Hinweis</div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Maßgeblich für Beginn und Ende der Frist ist jeweils das Datum des <strong>notariellen Kaufvertrags</strong> (Verpflichtungsgeschäft), nicht der Grundbucheintrag oder die Übergabe. Diese Berechnung dient der Orientierung und ersetzt keine steuerliche Beratung — insbesondere bei gemischten Fällen (teilweise Eigennutzung, mehrere Erwerbszeitpunkte durch WEG-Teilung o.ä.) im Zweifel den Steuerberater fragen.
              </p>
            </div>
          </div>
        </div>

        <ResultCTA text="renditly zeigt dir automatisch, wann jede deiner Immobilien steuerfrei verkäuflich ist — direkt im Portfolio, ohne manuell nachzurechnen." />

        <article className="mt-12 sm:mt-16 prose-sm max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Ab wann läuft die 10-Jahresfrist bei Immobilien?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Die <strong>Spekulationsfrist</strong> von 10 Jahren nach § 23 EStG beginnt mit dem Datum des <strong>notariellen Kaufvertrags</strong> (obligatorisches Rechtsgeschäft) und endet exakt 10 Jahre später am selben Kalendertag. Grundbucheintrag oder Übergabe der Immobilie spielen für die Fristberechnung keine Rolle.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Wie wird die Frist bei Schenkung oder Erbschaft berechnet?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bei unentgeltlichem Erwerb (Schenkung, Erbschaft) tritt der neue Eigentümer nach der sogenannten <strong>Fußstapfentheorie</strong> in die Rechtsposition des Vorbesitzers ein — die Frist läuft ab dessen ursprünglichem Kaufdatum weiter, nicht ab dem Datum der Schenkung oder des Erbfalls.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Wann ist ein Verkauf trotz laufender Frist steuerfrei?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Wurde die Immobilie im <strong>Verkaufsjahr und den beiden vorangegangenen Kalenderjahren durchgehend zu eigenen Wohnzwecken genutzt</strong> (§ 23 Abs. 1 Nr. 1 Satz 3 EStG), ist der Verkauf unabhängig von der 10-Jahresfrist steuerfrei. Ein volles mittleres Kalenderjahr plus jeweils ein Tag am Anfang und Ende reichen bereits aus.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2">Wie hoch ist die Spekulationssteuer, wenn die Frist noch läuft?</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Es gibt keinen festen Steuersatz — der Veräußerungsgewinn (Verkaufspreis minus Anschaffungskosten minus AfA-Absetzungen minus Verkaufskosten) wird zum persönlichen Einkommensteuersatz versteuert, der je nach Einkommen zwischen 14 % und 45 % (plus Soli, ggf. Kirchensteuer) liegen kann.
              </p>
            </div>
          </div>

          <div className="mb-10 flex flex-col sm:flex-row gap-3">
            <a href="/ratgeber/spekulationssteuer-immobilienverkauf" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Ratgeber</div>
              <div className="text-sm font-bold text-slate-900">Spekulationssteuer beim Immobilienverkauf →</div>
            </a>
            <a href="/afa-rechner" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Rechner</div>
              <div className="text-sm font-bold text-slate-900">AfA-Rechner →</div>
            </a>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
            <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
            <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              renditly trackt Kaufdatum, Wertentwicklung und den steuerfreien Verkaufszeitpunkt für jede deiner Immobilien automatisch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
              <a href="/#pricing" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Preise ansehen</a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
          </div>

          <p className="text-xs text-slate-400 mt-6 text-center max-w-2xl mx-auto">
            Diese Berechnung dient der Orientierung und ersetzt keine steuerliche Beratung. Bitte vor dem Verkauf im Zweifel mit einem Steuerberater abstimmen, insbesondere bei Sonderfällen wie Teilverkäufen, WEG-Teilungen oder gemischter Nutzung.
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
