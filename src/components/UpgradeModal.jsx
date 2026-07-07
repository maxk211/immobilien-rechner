import { Home, Trophy, Check, ArrowRight } from 'lucide-react';
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
      Icon: Home,
    },
    feature: {
      title: 'Pro-Feature',
      desc: 'Dieses Feature ist im Pro-Plan verfügbar.',
      Icon: Trophy,
    },
  };

  const { title, desc, Icon } = reasons[reason] || reasons.limit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <Icon size={48} className="text-indigo-600"/>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-6">{desc}</p>

        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-4 mb-5 text-white">
          <div className="text-2xl font-black">9,99 €</div>
          <div className="text-indigo-200 text-sm">pro Monat · jederzeit kündbar</div>
          <ul className="mt-3 text-sm text-left space-y-1.5">
            {['Unlimitierte Immobilien', 'Alle Features freigeschaltet', 'Steuerexporte', 'Prioritäts-Support'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <Check size={14} className="text-indigo-300"/> {f}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onCheckout}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all mb-2 flex items-center justify-center gap-2"
        >
          Jetzt upgraden <ArrowRight size={14}/>
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
