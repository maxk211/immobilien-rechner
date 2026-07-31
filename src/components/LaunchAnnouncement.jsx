import { Rocket, Sparkles, Gift } from 'lucide-react';

const LaunchAnnouncement = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 px-6 pt-8 pb-10 text-center relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full"></div>
        <div className="relative">
          <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Rocket size={30} className="text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs font-semibold text-white mb-3">
            <Sparkles size={12} /> Wir sind live!
          </div>
          <h2 className="text-2xl font-black text-white leading-tight">
            renditly ist gestartet 🚀
          </h2>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        <p className="text-gray-600 text-sm leading-relaxed mb-5">
          Schön, dass du von Anfang an dabei bist! Als einer der ersten Nutzer bekommst du
          <strong className="text-gray-900"> vollen Zugriff auf alle Features</strong> — Portfolio-Tracking,
          Rendite- und Cashflow-Berechnung, Steuer-Export und mehr.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Gift size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-emerald-900 text-sm">90 Tage komplett kostenlos</div>
            <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">
              Keine Kreditkarte, keine versteckten Kosten — einfach loslegen und dein Portfolio aufbauen.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Los geht's! →
        </button>
      </div>
    </div>
  </div>
);

export default LaunchAnnouncement;
