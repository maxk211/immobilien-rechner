import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { PLANS } from '../config/payments';

// Preise für Startseite und /vermieter-software — gleiche Tarife, gleicher Checkout.
// Alle Tarife enthalten alle Funktionen; der Unterschied ist die Zahl der Objekte
// (so ist es auch technisch umgesetzt: useSubscription begrenzt nur maxImmobilien).

export const FUNKTIONEN = [
  'Cockpit und „Was steht an“',
  'Cashflow vor und nach Tilgung',
  'Rechnet sich das? vor dem Kauf',
  'Finanzierung mit Zinsbindung',
  'Steuern: AfA, Zinsen, Werbungskosten',
  'Mieter, Mieteingänge, Mieterhöhung',
  'Nebenkostenabrechnung',
  'Selbstauskunft-PDF für die Bank',
];

const TARIFE = [
  { key: 'starter', name: 'Starter', objekte: '1 Immobilie', monat: '4,99', jahrMonat: '3,99', jahr: '47,88', spar: '12' },
  { key: 'standard', name: 'Standard', objekte: 'bis 10 Immobilien', monat: '12,49', jahrMonat: '9,99', jahr: '119,88', spar: '30', beliebt: true },
  { key: 'pro', name: 'Pro', objekte: 'unbegrenzt', monat: '24,99', jahrMonat: '19,99', jahr: '239,88', spar: '60', extra: 'Prioritäts-Support' },
];

export default function Preise({ onGetStarted, id = 'pricing' }) {
  const [billing, setBilling] = useState('jaehrlich');
  const [laedt, setLaedt] = useState(null);

  const waehle = async (planKey) => {
    const priceId = PLANS[planKey]?.prices?.[billing === 'jaehrlich' ? 'yearly' : 'monthly']?.id;
    if (!priceId) return;
    setLaedt(planKey);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-anon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ priceId, planKey }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url; else setLaedt(null);
    } catch (err) {
      console.error('Checkout Fehler:', err);
      setLaedt(null);
    }
  };

  const jaehrlich = billing === 'jaehrlich';

  return (
    <section id={id} className="py-16 sm:py-24 bg-canvas scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-2">Preise</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Alle Funktionen in jedem Tarif</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Du zahlst nur nach Zahl deiner Objekte. Erst 90 Tage kostenlos testen, ohne Kreditkarte.</p>
        </div>

        {/* Umschalter wie in der App */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 text-sm font-semibold">
            {[['monatlich', 'Monatlich'], ['jaehrlich', 'Jährlich']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setBilling(k)}
                className={`px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${billing === k ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                {l}
                {k === 'jaehrlich' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${billing === k ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-700'}`}>−20 %</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Testphase */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="text-sm font-extrabold text-gray-900">Kostenlos testen</div>
            <div className="text-xs text-gray-400">1 Immobilie</div>
            <div className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight">0 €</div>
            <div className="text-xs text-gray-500 mt-1">90 Tage, ohne Kreditkarte</div>
            <p className="text-sm text-gray-600 mt-5 flex-1">Leg dein erstes Objekt an und sieh dir alles an. Danach entscheidest du.</p>
            <button type="button" onClick={onGetStarted} className="mt-6 w-full py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 hover:bg-gray-50">
              Kostenlos starten
            </button>
          </div>

          {TARIFE.map(t => (
            <div key={t.key} className={`relative rounded-2xl p-6 flex flex-col ${t.beliebt ? 'bg-ink text-white ring-2 ring-indigo-500 shadow-xl shadow-indigo-900/20' : 'bg-white border border-gray-200'}`}>
              {t.beliebt && <span className="absolute -top-3 left-6 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">Am beliebtesten</span>}
              <div className={`text-sm font-extrabold ${t.beliebt ? 'text-white' : 'text-gray-900'}`}>{t.name}</div>
              <div className={`text-xs ${t.beliebt ? 'text-white/60' : 'text-gray-400'}`}>{t.objekte}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{jaehrlich ? t.jahrMonat : t.monat} €</span>
                <span className={`text-sm ${t.beliebt ? 'text-white/60' : 'text-gray-400'}`}>/ Monat</span>
              </div>
              <div className={`text-xs mt-1 ${jaehrlich ? (t.beliebt ? 'text-emerald-300 font-semibold' : 'text-emerald-600 font-semibold') : (t.beliebt ? 'text-white/60' : 'text-gray-500')}`}>
                {jaehrlich ? `${t.jahr} € im Jahr · du sparst ${t.spar} €` : 'monatlich kündbar'}
              </div>
              <ul className="mt-5 space-y-2 flex-1 text-sm">
                <li className="flex items-start gap-2"><Check size={15} className={`mt-0.5 shrink-0 ${t.beliebt ? 'text-indigo-300' : 'text-indigo-600'}`} /><span className="font-semibold">{t.objekte === 'unbegrenzt' ? 'Unbegrenzt viele Immobilien' : t.objekte.charAt(0).toUpperCase() + t.objekte.slice(1)}</span></li>
                <li className="flex items-start gap-2"><Check size={15} className={`mt-0.5 shrink-0 ${t.beliebt ? 'text-indigo-300' : 'text-indigo-600'}`} /><span className={t.beliebt ? 'text-white/80' : 'text-gray-600'}>Alle Funktionen</span></li>
                {t.extra && <li className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-indigo-600" /><span className="text-gray-600">{t.extra}</span></li>}
              </ul>
              <button type="button" onClick={() => waehle(t.key)} disabled={!!laedt}
                className={`mt-6 w-full py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${t.beliebt ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'}`}>
                {laedt === t.key
                  ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full" /> Wird geladen …</>
                  : `${t.name} wählen`}
              </button>
            </div>
          ))}
        </div>

        {/* Was in jedem Tarif steckt */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">In jedem Tarif enthalten</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            {FUNKTIONEN.map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-gray-700"><Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />{f}</div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} /> Alle Preise inkl. MwSt. · monatlich oder jährlich kündbar · sichere Zahlung über Stripe
        </p>
      </div>
    </section>
  );
}
