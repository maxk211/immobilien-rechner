// Nachgebaute App-Ausschnitte für die Marketing-Seiten (Startseite, /vermieter-software).
// Bewusst als HTML statt Screenshot: scharf auf jedem Bildschirm, passt sich an,
// und sieht exakt aus wie die App (gleiche Tailwind-Klassen, Violett aus .font-app).
// Alle Objekte und Zahlen sind ausgedacht. Die "Rechnet sich das?"-Werte stammen aus
// rechne()/grenzwerte() der App (Sachsen, 189.000 €, 690 € Kaltmiete, 25.000 € EK).
import { AlertCircle, Clock, TrendingUp, FileText, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const heute = new Date();
const MONAT = MONATE[heute.getMonth()];
const JAHR = heute.getFullYear();

// Kopfzeile wie in der App (dunkler Balken, Logo, violetter Hauptknopf)
export function AppKopf({ titel = 'Rendite · Cashflow · Vermögen', knopf = 'Neue Immobilie' }) {
  return (
    <div className="bg-ink px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-sm font-black flex items-center justify-center shrink-0">r</span>
        <div className="min-w-0">
          <div className="text-white text-sm font-extrabold leading-none">renditly</div>
          <div className="text-[10px] text-white/50 truncate">{titel}</div>
        </div>
      </div>
      {knopf && <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold whitespace-nowrap">{knopf}</span>}
    </div>
  );
}

// Fensterrahmen um einen App-Ausschnitt
export function Fenster({ children, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden bg-canvas ring-1 ring-black/10 shadow-2xl shadow-indigo-900/20 ${className}`}>
      {children}
    </div>
  );
}

function Kpi({ label, wert, sub, ton = 'text-gray-900', className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-3 min-w-0 ${className}`}>
      <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400 truncate">{label}</div>
      <div className={`text-lg sm:text-xl font-black leading-tight ${ton}`}>{wert}</div>
      {sub && <div className="text-[10px] text-gray-400 truncate">{sub}</div>}
    </div>
  );
}

const AUFGABEN = [
  { ton: 'rot', icon: AlertCircle, objekt: 'Lindenstraße 12', text: `Miete ${MONAT} offen · 640 € · seit 6 Tagen`, knopf: 'Eingegangen', primaer: true },
  { ton: 'gelb', icon: Clock, objekt: 'Am Mühlbach 3', text: 'Zinsbindung endet in 14 Monaten · Restschuld dann 168.400 €', knopf: 'Anschluss planen' },
  { ton: 'gelb', icon: TrendingUp, objekt: 'Kastanienweg 8', text: 'Mieterhöhung möglich · bis +58 € im Monat', knopf: 'Durchrechnen' },
  { ton: 'grau', icon: FileText, objekt: '2 Objekte', text: `Nebenkostenabrechnung ${JAHR - 1} fehlt · Frist 31.12.${JAHR}`, knopf: 'Anzeigen' },
];
const ZEILE = { rot: 'bg-red-50 text-red-600', gelb: 'bg-amber-50 text-amber-600', grau: 'bg-gray-50 text-gray-500' };

export function WasStehtAn({ kompakt = false }) {
  const liste = kompakt ? AUFGABEN.slice(0, 3) : AUFGABEN;
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-gray-900">Was steht an</span>
          <span className="text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-1.5">{AUFGABEN.length}</span>
        </div>
        <div className={kompakt ? 'hidden' : 'hidden sm:flex gap-1'}>
          {['Alle', 'Miete', 'Finanzierung', 'Mieter'].map((f, i) => (
            <span key={f} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-500'}`}>{f}</span>
          ))}
        </div>
      </div>
      <div className="p-2 space-y-1.5">
        {liste.map(a => {
          const Icon = a.icon;
          return (
            <div key={a.objekt} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${ZEILE[a.ton]}`}>
              <Icon size={13} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-gray-900 truncate">{a.objekt}</div>
                <div className="text-[10px] text-gray-600 truncate">{a.text}</div>
              </div>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${a.primaer ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{a.knopf}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Dashboard-Kopf: 4 Kennzahlen + "Was steht an"
export function DashboardMockup() {
  return (
    <Fenster>
      <AppKopf />
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-gray-200 p-3 col-span-2 sm:col-span-1">
            <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Cashflow / Monat</div>
            <div className="flex items-end gap-3">
              <div><div className="text-xl font-black text-emerald-600 leading-tight">+184 €</div><div className="text-[9px] font-bold text-gray-400 uppercase">nach Tilgung</div></div>
              <div className="w-px h-8 bg-gray-200" />
              <div><div className="text-xl font-black text-gray-900 leading-tight">+1.236 €</div><div className="text-[9px] font-bold text-gray-400 uppercase">vor Tilgung</div></div>
            </div>
          </div>
          <Kpi label="Mieteinnahmen" wert="3.420 €" sub="41.040 € im Jahr" />
          <Kpi label="Portfoliowert" wert="742.000 €" sub="+96.000 € seit Kauf" />
          <Kpi label="Netto-Immobilienvermögen" wert="318.400 €" sub="Marktwert − Restschuld" ton="text-indigo-700" className="col-span-2 sm:col-span-1" />
        </div>
        <WasStehtAn />
      </div>
    </Fenster>
  );
}

// "Rechnet sich das?" — Urteil in einem Satz + Grenzwerte
export function RechnetSichDasMockup({ kompakt = false }) {
  return (
    <Fenster>
      <AppKopf titel={kompakt ? 'Rechnet sich das? · 189.000 €, 690 € Miete' : 'Rechnet sich das?'} knopf={null} />
      <div className={`p-3 grid grid-cols-1 gap-3 ${kompakt ? '' : 'sm:grid-cols-5'}`}>
        <div className={`${kompakt ? 'hidden' : 'sm:col-span-2'} bg-white rounded-xl border border-gray-200 p-3 space-y-2`}>
          {[['Kaufpreis', '189.000 €'], ['Bundesland', 'Sachsen · 5,5 % GrESt'], ['Kaltmiete', '690 €'], ['Eigenkapital', '25.000 €'], ['Sollzins · Tilgung', '3,8 % · 2,0 %']].map(([l, w]) => (
            <div key={l}>
              <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{l}</div>
              <div className="text-xs font-semibold text-gray-800 border border-gray-200 rounded-md px-2 py-1 mt-0.5">{w}</div>
            </div>
          ))}
        </div>
        <div className={`${kompakt ? '' : 'sm:col-span-3'} space-y-2`}>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="text-base font-black text-amber-900">Trägt sich knapp nicht</div>
            <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">Nach Kosten und voller Kreditrate fehlen dir 255 € im Monat. Vor Tilgung bleibt es positiv — du legst nur für den Vermögensaufbau drauf.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Vor Tilgung" wert="+41 €" ton="text-emerald-600" />
            <Kpi label="Nach Tilgung" wert="−255 €" ton="text-red-600" />
          </div>
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
            <div className="text-[9px] font-bold uppercase tracking-wide text-indigo-700 mb-1">Ab hier trägt es sich</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
              <span className="text-gray-600">Kaltmiete ab</span><span className="font-bold text-gray-900 text-right">946 €</span>
              <span className="text-gray-600">Kaufpreis bis</span><span className="font-bold text-gray-900 text-right">139.800 €</span>
              <span className="text-gray-600">Eigenkapital ab</span><span className="font-bold text-gray-900 text-right">77.800 €</span>
              <span className="text-gray-600">Sollzins bis</span><span className="font-bold text-gray-900 text-right">2,08 %</span>
            </div>
          </div>
        </div>
      </div>
    </Fenster>
  );
}

// Finanzierung: Laufzeitbalken + Restschuld zum Zinsbindungsende
export function FinanzierungMockup() {
  return (
    <Fenster>
      <AppKopf titel="Lindenstraße 12 · Finanzierung" knopf={null} />
      <div className="p-3 space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-gray-900">Darlehen 225.000 €</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">läuft</span>
          </div>
          <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden flex">
            <div className="bg-emerald-500" style={{ width: '12%' }} />
            <div className="bg-indigo-500" style={{ width: '22%' }} />
          </div>
          <div className="relative h-0">
            <span className="absolute -top-4 w-0.5 h-5 bg-red-500" style={{ left: '17%' }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> getilgt</span>
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Zinsbindung bis 05/2031</span>
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-red-500 inline-block" /> heute</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi label="Restschuld heute" wert="198.900 €" />
          <Kpi label="Am ZB-Ende" wert="170.900 €" sub="05/2031" />
          <Kpi label="Anschlussrate" wert="855 €" sub="bei 4 % + 2 %" />
        </div>
      </div>
    </Fenster>
  );
}

// Plausibilitätsprüfung + "Wer zahlt?"
export function PlausiMockup() {
  return (
    <Fenster>
      <AppKopf titel="Kurz prüfen, dann rechnen wir richtig" knopf={null} />
      <div className="p-3 space-y-2">
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-800"><AlertTriangle size={13} /> Die Zinsbindung endet vor dem Kreditstart</div>
          <p className="text-[11px] text-red-900/70 mt-0.5">Kreditstart 01.06.2021, Zinsbindung bis 31.05.2011. Das kann nicht beides stimmen.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-900 text-white">Vorschlag übernehmen: 31.05.2031</span>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs font-extrabold text-amber-900">Sollzins 38,00 %</div>
          <p className="text-[11px] text-amber-900/70 mt-0.5">Üblich sind 0,5 % bis 9 %. Tippfehler beim Komma?</p>
          <div className="mt-2 flex gap-1.5">
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700">Korrigieren</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700">Stimmt so</span>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 flex items-center gap-2 text-[11px]">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span className="text-gray-600">11 weitere Werte sind unauffällig</span>
          <span className="text-gray-300">·</span>
          <span className="font-semibold text-indigo-600">Alle anzeigen</span>
        </div>
      </div>
    </Fenster>
  );
}

export function WerZahltMockup() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-900">Rundfunkbeitrag</span>
        <span className="font-bold text-gray-900">18,36 € / Monat</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-gray-500">Wer zahlt?</span>
        <span className="font-semibold text-emerald-700">Mieter / Firma zahlt direkt</span>
        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">ab 01.03.: Mieter/Firma</span>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-gray-600">
        <Check size={12} className="text-emerald-600" /> Im Jahr {JAHR} zählen nur Januar und Februar: 36,72 €
      </div>
    </div>
  );
}
