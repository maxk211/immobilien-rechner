import { useState } from 'react';
import { Check, X, Zap, Building2, Crown, Clock } from 'lucide-react';
import { PAYMENTS_LIVE, PLANS } from '../config/payments';

// ─── UpgradeModal ─────────────────────────────────────────────────────────────
// Zeigt 3-Plan-Vergleich (Starter / Standard / Pro) mit Monatlich/Jährlich-Toggle.
// Wird angezeigt wenn: Plan-Limit erreicht, Trial abgelaufen, oder explizit geöffnet.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_KEYS = ['starter', 'standard', 'pro'];

const PLAN_ICONS = {
  starter:  Zap,
  standard: Building2,
  pro:      Crown,
};

const PLAN_FEATURES = {
  starter: [
    '1 Immobilie verwalten',
    'Cashflow & Rendite',
    'Mieterverwaltung',
    'Finanzierungsrechner',
    'Steuerübersicht',
  ],
  standard: [
    'Bis zu 10 Immobilien',
    'Alle Starter-Features',
    'Mehrfamilienhäuser (MFH)',
    'NK-Abrechnung',
    'Jahresauswertung',
  ],
  pro: [
    'Unlimitierte Immobilien',
    'Alle Standard-Features',
    'Prioritäts-Support',
    'Frühzeitiger Zugang zu neuen Features',
    'Persönliches Onboarding',
  ],
};

const REASON_TEXTS = {
  limit:   { title: 'Immobilien-Limit erreicht', sub: 'Upgrade für mehr Objekte.' },
  expired: { title: 'Dein Trial ist abgelaufen', sub: 'Wähle einen Plan, um weiter zu machen.' },
  trial:   { title: 'Dein Trial läuft bald ab', sub: 'Sichere dir jetzt einen Plan, damit dein Portfolio nahtlos weiterläuft.' },
  feature: { title: 'Feature nicht verfügbar', sub: 'Dieses Feature ist in deinem aktuellen Plan nicht enthalten.' },
  default: { title: 'Upgrade deinen Plan', sub: 'Mehr Immobilien, mehr Features.' },
};

const UpgradeModal = ({
  onClose,
  openCheckout,
  reason      = 'default',
  currentPlan = 'trial',
  trialDaysLeft = 0,
}) => {
  const [billing, setBilling] = useState('monthly');

  if (!PAYMENTS_LIVE) return null;

  const { title, sub } = REASON_TEXTS[reason] || REASON_TEXTS.default;

  const handleSelect = (planKey) => {
    openCheckout(planKey, billing);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{title}</h2>
            <p className="text-gray-500 text-sm mt-1">{sub}</p>

            {/* Trial-Banner */}
            {currentPlan === 'trial' && trialDaysLeft > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-amber-600 text-xs font-semibold">
                <Clock size={12}/> Noch {trialDaysLeft} {trialDaysLeft === 1 ? 'Tag' : 'Tage'} kostenlos testen
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 ml-4 flex-shrink-0"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center pt-5 pb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 text-sm font-semibold">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                billing === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                billing === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Jährlich
              <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-md font-bold">
                –20 %
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 pb-6">
          {PLAN_KEYS.map((key) => {
            const plan    = PLANS[key];
            const price   = plan.prices[billing];
            const Icon    = PLAN_ICONS[key];
            const popular = plan.popular;
            const isCurrent = key === currentPlan;

            return (
              <div
                key={key}
                className={`relative rounded-2xl border-2 flex flex-col transition-all ${
                  popular
                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                      Beliebt
                    </span>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  {/* Plan-Name & Icon */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${popular ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <Icon size={16} className={popular ? 'text-indigo-600' : 'text-gray-600'}/>
                    </div>
                    <span className="font-black text-gray-900">{plan.label}</span>
                    {isCurrent && (
                      <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        Aktuell
                      </span>
                    )}
                  </div>

                  {/* Preis */}
                  <div className="mb-1">
                    {billing === 'yearly' ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-gray-900">{price.perMonth}</span>
                          <span className="text-gray-400 text-sm">/Mo</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {price.display} jährlich · {price.saveLabel}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900">{price.display}</span>
                        <span className="text-gray-400 text-sm">/Mo</span>
                      </div>
                    )}
                  </div>

                  {/* Immobilien-Limit */}
                  <div className={`text-xs font-bold mb-4 mt-1 ${popular ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {plan.maxImmobilien === Infinity ? 'Unlimitierte Immobilien' : `Bis zu ${plan.maxImmobilien} Immobili${plan.maxImmobilien === 1 ? 'e' : 'en'}`}
                  </div>

                  {/* Feature-Liste */}
                  <ul className="space-y-2 flex-1">
                    {PLAN_FEATURES[key].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={14} className={`mt-0.5 flex-shrink-0 ${popular ? 'text-indigo-500' : 'text-emerald-500'}`}/>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelect(key)}
                    disabled={isCurrent}
                    className={`mt-5 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isCurrent ? 'Aktueller Plan' : `${plan.label} wählen`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Jederzeit kündbar · Sicher via Stripe · Keine versteckten Kosten
          </p>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
