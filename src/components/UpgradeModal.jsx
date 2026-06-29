import { PAYMENTS_LIVE } from '../config/payments';

// ─── UpgradeModal ─────────────────────────────────────────────────────────────
// Wird angezeigt wenn Free-User eine gesperrte Aktion auslöst.
// Solange PAYMENTS_LIVE = false wird diese Komponente nie gerendert.
// ─────────────────────────────────────────────────────────────────────────────

const UpgradeModal = ({ onClose, onCheckout, reason = 'limit' }) => {
  if (!PAYMENTS_LIVE) return null; // Sicherheitsnetz — sollte nie aufgerufen werden

  const reasons = {
    limit: {
      title: 'Immobilien-Limit erreicht',
      desc: 'Im Free Tier kannst du eine Immobilie verwalten. Upgrade auf Pro für unlimitierte Objekte.',
      icon: '🏠',
    },
    feature: {
      title: 'Pro-Feature',
      desc: 'Dieses Feature ist im Pro-Plan verfügbar.',
      icon: '⭐',
    },
  };

  const { title, desc, icon } = reasons[reason] || reasons.limit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-6">{desc}</p>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-5 text-white">
          <div className="text-2xl font-black">9,99 €</div>
          <div className="text-blue-200 text-sm">pro Monat · jederzeit kündbar</div>
          <ul className="mt-3 text-sm text-left space-y-1.5">
            {['Unlimitierte Immobilien', 'Alle Features freigeschaltet', 'Steuerexporte', 'Prioritäts-Support'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-blue-300">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onCheckout}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all mb-2"
        >
          Jetzt upgraden →
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
