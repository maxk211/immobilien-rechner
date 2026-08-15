import { useMemo, useState } from 'react';
import { STAEDTE_LISTE } from '../staedte/staedteDaten';
import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz';

const fmt1 = (n) => (isFinite(n) ? n.toFixed(1).replace('.', ',') : '–');
const fmtEur = (n) => (isFinite(n) ? Math.round(n).toLocaleString('de-DE') + ' €' : '–');

export default function MietrenditeReport() {
  const [kopiert, setKopiert] = useState(false);

  const stats = useMemo(() => {
    const liste = STAEDTE_LISTE; // bereits nach bruttorendite absteigend sortiert
    const n = liste.length;
    const avgRendite = liste.reduce((s, o) => s + o.bruttorendite, 0) / n;
    const avgKaufpreis = liste.reduce((s, o) => s + o.kaufpreisM2, 0) / n;
    const avgMiete = liste.reduce((s, o) => s + o.mieteM2, 0) / n;
    const hoechsteRendite = liste[0];
    const niedrigsteRendite = liste[n - 1];
    const teuersteKaufpreis = [...liste].sort((a, b) => b.kaufpreisM2 - a.kaufpreisM2)[0];
    const guenstigsteKaufpreis = [...liste].sort((a, b) => a.kaufpreisM2 - b.kaufpreisM2)[0];
    const teuersteMiete = [...liste].sort((a, b) => b.mieteM2 - a.mieteM2)[0];
    const guenstigsteMiete = [...liste].sort((a, b) => a.mieteM2 - b.mieteM2)[0];
    const top5 = liste.slice(0, 5);
    const bottom5 = [...liste].slice(-5).reverse();
    return { liste, n, avgRendite, avgKaufpreis, avgMiete, hoechsteRendite, niedrigsteRendite, teuersteKaufpreis, guenstigsteKaufpreis, teuersteMiete, guenstigsteMiete, top5, bottom5 };
  }, []);

  const zitatText = `Laut renditly-Mietrendite-Report Deutschland 2026 liegt die durchschnittliche Bruttomietrendite über ${stats.n} deutsche Großstädte bei ${fmt1(stats.avgRendite)} %. Quelle: https://www.renditly.de/mietrendite-report-2026`;

  const kopiereZitat = () => {
    navigator.clipboard?.writeText(zitatText).then(() => {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    });
  };

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
            <a href="/app" className="text-xs sm:text-sm font-medium text-slate-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">Login</a>
            <a href="/app" className="text-xs sm:text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all">Kostenlos testen</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-4">
            Datenstudie · {stats.n} Städte · Stand August 2026
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Mietrendite-Report Deutschland 2026
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
            Kaufpreise, Mieten und Bruttomietrendite der {stats.n} größten deutschen Städte im direkten Vergleich — mit Rangliste, Auffälligkeiten und frei zitierbaren Kennzahlen.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">

        {/* Kern-Kennzahlen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="bg-indigo-600 rounded-2xl p-4 border border-indigo-500">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-1">Ø Bruttomietrendite</div>
            <div className="text-2xl font-black text-white">{fmt1(stats.avgRendite)} %</div>
            <div className="text-xs text-indigo-200 mt-0.5">über {stats.n} Städte</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Höchste Rendite</div>
            <div className="text-2xl font-black text-slate-900">{fmt1(stats.hoechsteRendite.bruttorendite)} %</div>
            <div className="text-xs text-slate-400 mt-0.5">{stats.hoechsteRendite.name}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Niedrigste Rendite</div>
            <div className="text-2xl font-black text-slate-900">{fmt1(stats.niedrigsteRendite.bruttorendite)} %</div>
            <div className="text-xs text-slate-400 mt-0.5">{stats.niedrigsteRendite.name}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Ø Kaufpreis/m²</div>
            <div className="text-2xl font-black text-slate-900">{fmtEur(stats.avgKaufpreis)}</div>
            <div className="text-xs text-slate-400 mt-0.5">über {stats.n} Städte</div>
          </div>
        </div>

        {/* Zitat-Box */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-10">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Für Journalisten & Blogger — zum Zitieren freigegeben</div>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{zitatText}</p>
          <button
            onClick={kopiereZitat}
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            {kopiert ? '✓ Kopiert' : 'Zitat kopieren →'}
          </button>
        </div>

        {/* Top/Flop 5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Top 5: Höchste Bruttomietrendite</h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {stats.top5.map((s, i) => (
                <a key={s.slug} href={`/mietrendite-${s.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-700"><span className="text-slate-400 mr-2">{i + 1}.</span>{s.name}</span>
                  <span className="text-sm font-bold text-emerald-600">{fmt1(s.bruttorendite)} %</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Flop 5: Niedrigste Bruttomietrendite</h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {stats.bottom5.map((s, i) => (
                <a key={s.slug} href={`/mietrendite-${s.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-700"><span className="text-slate-400 mr-2">{i + 1}.</span>{s.name}</span>
                  <span className="text-sm font-bold text-rose-500">{fmt1(s.bruttorendite)} %</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Einordnung */}
        <article className="prose-sm max-w-none mb-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-4">
            <h2 className="text-base font-bold text-slate-900 mb-2">Die zentrale Erkenntnis: Kaufpreis schlägt Miete</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {stats.teuersteKaufpreis.name} hat mit {fmtEur(stats.teuersteKaufpreis.kaufpreisM2)}/m² den höchsten Kaufpreis aller {stats.n} untersuchten Städte, während {stats.guenstigsteKaufpreis.name} mit {fmtEur(stats.guenstigsteKaufpreis.kaufpreisM2)}/m² am günstigsten ist. Bei der Kaltmiete liegt {stats.teuersteMiete.name} mit {fmt1(stats.teuersteMiete.mieteM2)} €/m² vorn, {stats.guenstigsteMiete.name} bildet mit {fmt1(stats.guenstigsteMiete.mieteM2)} €/m² das Schlusslicht. Entscheidend für die Rendite ist aber nicht die absolute Miete, sondern ihr Verhältnis zum Kaufpreis — und hier zeigt sich: Hohe Mieten allein machen noch keine gute Rendite, wenn der Kaufpreis überproportional mitgestiegen ist.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">Methodik</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Datenbasis sind die durchschnittlichen Kaufpreise und Kaltmieten pro Quadratmeter für {stats.n} deutsche Großstädte (Tier-1-Städte: Engel & Völkers Marktbericht Deutschland, Stand Juni 2026; Tier-2-Städte: aggregiert aus mehreren Immobilienportalen, Stand August 2026). Die Bruttomietrendite berechnet sich als Jahreskaltmiete pro m² geteilt durch den Kaufpreis pro m², multipliziert mit 100. Kaufnebenkosten, Instandhaltung und Leerstand sind in der Bruttomietrendite nicht enthalten — für eine realistischere Einschätzung empfiehlt sich die Nettomietrendite im Einzelfall.
            </p>
          </div>
        </article>

        {/* Vollständige Tabelle */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm overflow-x-auto mb-10">
          <h2 className="text-base font-bold text-slate-900 mb-4">Alle {stats.n} Städte im Vergleich</h2>
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-gray-100">
                <th className="py-2 pr-3 font-semibold">Rang</th>
                <th className="py-2 pr-3 font-semibold">Stadt</th>
                <th className="py-2 pr-3 font-semibold text-right">Kaufpreis/m²</th>
                <th className="py-2 pr-3 font-semibold text-right">Kaltmiete/m²</th>
                <th className="py-2 font-semibold text-right">Bruttomietrendite</th>
              </tr>
            </thead>
            <tbody>
              {stats.liste.map((s, i) => (
                <tr key={s.slug} className="border-b border-gray-50">
                  <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <a href={`/mietrendite-${s.slug}`} className="text-indigo-600 font-medium hover:underline">{s.name}</a>
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-600">{fmtEur(s.kaufpreisM2)}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">{fmt1(s.mieteM2)} €</td>
                  <td className="py-2 text-right text-slate-800 font-semibold">{fmt1(s.bruttorendite)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-10 flex flex-col sm:flex-row gap-3">
          <a href="/mietrendite-staedte" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="text-xs text-indigo-600 font-semibold mb-1">Vergleichstabelle</div>
            <div className="text-sm font-bold text-slate-900">Mietrendite Deutschland: Städtevergleich →</div>
          </a>
          <a href="/mietrendite-rechner" className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="text-xs text-indigo-600 font-semibold mb-1">Rechner</div>
            <div className="text-sm font-bold text-slate-900">Mietrendite für deine eigene Immobilie berechnen →</div>
          </a>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl sm:text-2xl font-black mb-2">Dein eigenes Portfolio, immer aktuell</h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
            renditly berechnet Rendite und Cashflow nicht nur für den Markt, sondern für jede einzelne Immobilie in deinem Portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
            <a href="/#pricing" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Preise ansehen</a>
          </div>
          <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center max-w-2xl mx-auto">
          Zahlen und Grafiken aus diesem Report dürfen mit Quellenangabe und Verlinkung zu renditly.de frei verwendet werden. Diese Auswertung dient der Orientierung und ersetzt keine individuelle Anlageberatung.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span className="font-black text-slate-700" style={{letterSpacing:'-0.02em'}}>renditly</span>
          <div className="flex gap-4 flex-wrap justify-center">
            <a href="/" className="hover:text-slate-700 transition-colors">Startseite</a>
            <a href="/mietrendite-staedte" className="hover:text-slate-700 transition-colors">Städte</a>
            <a href="/#pricing" className="hover:text-slate-700 transition-colors">Preise</a>
          </div>
          <ImpressumDatenschutzLinks className="text-slate-400 hover:text-slate-700" />
          <span>© {new Date().getFullYear()} renditly</span>
        </div>
      </footer>
    </div>
  );
}
