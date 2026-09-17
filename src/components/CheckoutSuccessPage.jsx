import { CheckCircle, Mail } from 'lucide-react';

const CheckoutSuccessPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">

      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={44} className="text-emerald-500" />
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-2">Zahlung erfolgreich!</h1>
      <p className="text-gray-500 mb-6">
        Wir haben dir einen Login-Link per E-Mail gesendet.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={16} className="text-amber-600" />
          <span className="text-sm font-bold text-amber-800">So geht's weiter</span>
        </div>
        <ol className="space-y-2">
          {[
            'Schau in dein E-Mail-Postfach',
            'Klicke auf „Bei renditly einloggen"',
            'Du wirst direkt in die App weitergeleitet',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-amber-800">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-gray-400">
        E-Mail nicht angekommen? Schau auch im Spam-Ordner.
      </p>
    </div>
  </div>
);

export default CheckoutSuccessPage;
