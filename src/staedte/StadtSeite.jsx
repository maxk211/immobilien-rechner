import { useState } from 'react';
import { STAEDTE, STAEDTE_LISTE } from './staedteDaten';

const fmt = (n, decimals = 1) => isFinite(n) ? n.toFixed(decimals).replace('.', ',') : '–';
const fmtEur = (n) => isFinite(n) ? Math.round(n).toLocaleString('de-DE') + ' €' : '–';

const RatingBadge = ({ value }) => {
  const good = value >= 4.2;
  const ok = value >= 3.5;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${good ? 'bg-emerald-100 text-emerald-700' : ok ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
      {good ? '✓ Überdurchschnittlich' : ok ? '~ Durchschnitt' : '– Unterdurchschnittlich'}
    </span>
  );
};

export default function StadtSeite({ slug }) {
  const stadt = STAEDTE[slug];
  const typischeWohnflaeche = 65;

  const [wohnflaeche, setWohnflaeche] = useState(typischeWohnflaeche);
  const [nebenkosten, setNebenkosten] = useState(10);
  const [eigenkapitalProzent, setEigenkapitalProzent] = useState(20);
  const [kosten, setKosten] = useState(150);
  const [zins, setZins] = useState(3.8);

  const wf = parseFloat(wohnflaeche) || 0;
  const nk = parseFloat(nebenkosten) || 0;
  const ekProzent = parseFloat(eigenkapitalProzent) || 0;
  const ko = parseFloat(kosten) || 0;
  const zi = parseFloat(zins) || 0;

  const kaufpreis = stadt.kaufpreisM2 * wf;
  const kaltmiete = stadt.mieteM2 * wf;
  const gesamtkosten = kaufpreis * (1 + nk / 100);
  const ek = gesamtkosten * (ekProzent / 100);
  const fremdkapital = Math.max(0, gesamtkosten - ek);
  const rate = fremdkapital * (zi / 100 / 12);
  const netto = gesamtkosten > 0 ? ((kaltmiete - ko) * 12) / gesamtkosten * 100 : 0;
  const cashflow = kaltmiete - ko - rate;

  const andereStaedte = STAEDTE_LISTE.filter(s => s.slug !== slug).slice(0, 6);

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

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-400 flex items-center gap-1.5">
          <a href="/" className="hover:text-indigo-600 transition-colors">renditly</a>
          <span>/</span>
          <a href="/mietrendite-staedte" className="hover:text-indigo-600 transition-colors">Mietrendite Städte</a>
          <span>/</span>
          <span className="text-slate-600">{stadt.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <header className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-10 sm:py-14 mt-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-indigo-200 mb-4">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Marktdaten Juni 2026 · Engel &amp; Völkers
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
            Mietrendite {stadt.name}
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl">
            Die durchschnittliche Bruttomietrendite für Anlageimmobilien in {stadt.name} liegt bei {fmt(stadt.bruttorendite)} % — berechnet aus aktuellen Kaufpreisen und Kaltmieten pro Quadratmeter, plus eigener Rechner für deine konkrete Immobilie.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Datenkarten */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Ø Kaufpreis</div>
            <div className="text-xl font-black text-slate-900">{fmtEur(stadt.kaufpreisM2)}</div>
            <div className="text-xs text-slate-400">pro m²</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Ø Kaltmiete</div>
            <div className="text-xl font-black text-slate-900">{fmt(stadt.mieteM2, 2)} €</div>
            <div className="text-xs text-slate-400">pro m²/Monat</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-indigo-600 rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-1">Bruttomietrendite</div>
            <div className="text-xl font-black text-white">{fmt(stadt.bruttorendite)} %</div>
            <div className="text-xs text-indigo-200">Ø für {stadt.name}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-center">
            <RatingBadge value={stadt.bruttorendite} />
            <div className="text-xs text-slate-400 mt-2">im Städtevergleich</div>
          </div>
        </div>

        {/* Analysetext */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-3">Immobilienmarkt {stadt.name}: Einordnung</h2>
          <p className="text-slate-600 leading-relaxed">{stadt.text}</p>
        </section>

        {/* Mini-Rechner */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-1">Deine Mietrendite in {stadt.name} berechnen</h2>
          <p className="text-sm text-slate-500 mb-5">Voreingestellt mit den Ø-Werten für {stadt.name} bei einer {typischeWohnflaeche} m² Wohnung — passe die Werte an deine Immobilie an.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wohnfläche</label>
                <div className="relative flex items-center">
                  <input type="number" inputMode="decimal" value={wohnflaeche} onChange={(e) => setWohnflaeche(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-3 pl-3 pr-10 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                  <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">m²</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kaufnebenkosten</label>
                <div className="relative flex items-center">
                  <input type="number" inputMode="decimal" value={nebenkosten} onChange={(e) => setNebenkosten(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-3 pl-3 pr-10 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                  <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Eigenkapitalanteil</label>
                <div className="relative flex items-center">
                  <input type="number" inputMode="decimal" value={eigenkapitalProzent} onChange={(e) => setEigenkapitalProzent(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-3 pl-3 pr-10 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                  <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Laufende Kosten / Monat</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">€</span>
                  <input type="number" inputMode="decimal" value={kosten} onChange={(e) => setKosten(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-3 pl-7 pr-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Finanzierungszins</label>
                <div className="relative flex items-center">
                  <input type="number" inputMode="decimal" value={zins} onChange={(e) => setZins(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-3 pl-3 pr-10 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                  <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-indigo-600 rounded-2xl p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-1">Nettomietrendite</div>
                <div className="text-2xl font-black text-white">{fmt(netto)} %</div>
                <div className="text-xs text-indigo-200 mt-0.5">nach Kosten, inkl. Nebenkosten</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Monatlicher Cashflow</div>
                <div className="text-2xl font-black text-slate-900">{isFinite(cashflow) ? `${cashflow >= 0 ? '+' : ''}${fmtEur(cashflow)}` : '–'}</div>
                <div className="text-xs text-slate-400 mt-0.5">Miete − Kosten − Rate</div>
              </div>
              <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 text-sm">
                <div className="space-y-1.5 text-slate-600 text-xs">
                  <div className="flex justify-between"><span>Kaufpreis ({wf} m² × {fmtEur(stadt.kaufpreisM2)}/m²)</span><span className="font-medium text-slate-800">{fmtEur(kaufpreis)}</span></div>
                  <div className="flex justify-between"><span>Kaltmiete/Monat</span><span className="font-medium text-slate-800">{fmtEur(kaltmiete)}</span></div>
                  <div className="flex justify-between"><span>Eigenkapital</span><span className="font-medium text-slate-800">{fmtEur(ek)}</span></div>
                  <div className="flex justify-between"><span>Monatliche Zinsrate</span><span className="font-medium text-slate-800">{fmtEur(rate)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-4">Häufige Fragen zu {stadt.name}</h2>
          <div className="space-y-3">
            {stadt.faq.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="font-bold text-slate-900 mb-1.5 text-sm">{f.q}</div>
                <div className="text-sm text-slate-600 leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Andere Städte */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-4">Mietrendite in anderen Städten</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {andereStaedte.map((s) => (
              <a key={s.slug} href={`/mietrendite-${s.slug}`} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="text-sm font-bold text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Ø {fmt(s.bruttorendite)} % Bruttorendite</div>
              </a>
            ))}
          </div>
          <a href="/mietrendite-staedte" className="inline-block mt-3 text-sm font-semibold text-indigo-600 hover:underline">Alle Städte im Vergleich →</a>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl sm:text-2xl font-black mb-2">Portfolio verwalten — nicht nur berechnen</h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
            renditly trackt Cashflow, Mieter, Steuern und Wertsteigerung für alle deine Immobilien — dauerhaft, automatisch und sicher.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/app" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base">90 Tage kostenlos testen →</a>
            <a href="/#pricing" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base">Preise ansehen</a>
          </div>
          <p className="text-indigo-300 text-xs mt-4">Keine Kreditkarte · Keine Mindestlaufzeit · 1 Immobilie kostenlos</p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Datenquelle: Engel &amp; Völkers Marktbericht Deutschland, Stand Juni 2026 (Angebotspreise). Werte sind Durchschnittswerte und können je nach Lage und Objekt stark abweichen.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span className="font-black text-slate-700" style={{letterSpacing:'-0.02em'}}>renditly</span>
          <div className="flex gap-4">
            <a href="/" className="hover:text-slate-700 transition-colors">Startseite</a>
            <a href="/mietrendite-staedte" className="hover:text-slate-700 transition-colors">Städtevergleich</a>
            <a href="/#pricing" className="hover:text-slate-700 transition-colors">Preise</a>
          </div>
          <span>© {new Date().getFullYear()} renditly</span>
        </div>
      </footer>
    </div>
  );
}
