import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Home, Check } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Prüfe ob User über Password-Reset-Link kommt
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setIsResetMode(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isResetMode) {
        // Neues Passwort setzen
        const { error } = await supabase.auth.updateUser({
          password: password
        });
        if (error) throw error;
        setMessage('Passwort erfolgreich geändert! Du wirst eingeloggt...');
        setIsResetMode(false);
        // Clear URL hash
        window.history.replaceState(null, '', window.location.pathname);
      } else if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // Registrierung
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Registrierung erfolgreich! Du kannst dich jetzt einloggen.');
        setIsLogin(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Bitte gib deine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app`,
      });
      if (error) throw error;
      setMessage('Passwort-Reset E-Mail wurde gesendet! Prüfe dein Postfach.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-app min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-cream-200 w-full max-w-md p-8">
        {/* Zurück zur Startseite */}
        <a href="/" className="inline-flex items-center gap-1 text-xs text-cream-500 hover:text-cream-700 transition-colors mb-4">
          ← Zurück zur Startseite
        </a>
        {/* Logo & Titel */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-clay-500">
              <Home size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-cream-900" style={{letterSpacing: '-0.02em'}}>renditly</h1>
          <p className="text-clay-600 text-xs font-semibold mt-0.5" style={{letterSpacing: '0.05em'}}>DEIN IMMOBILIEN-PORTFOLIO</p>
          <p className="text-cream-600 mt-1">
            {isResetMode
              ? 'Neues Passwort vergeben'
              : isLogin
                ? 'Willkommen zurück!'
                : 'Erstelle deinen Account'}
          </p>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div className="mb-4 p-3 bg-brick-50 border border-brick-200 rounded-lg text-brick-700 text-sm">
            {error}
          </div>
        )}

        {/* Erfolgsmeldung */}
        {message && (
          <div className="mb-4 p-3 bg-sage-50 border border-sage-200 rounded-lg text-sage-700 text-sm">
            {message}
          </div>
        )}

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResetMode && (
            <div>
              <label className="block text-sm font-medium text-cream-700 mb-1">
                E-Mail Adresse
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-400 focus:border-clay-400 transition-all text-base sm:text-sm"
                placeholder="max@beispiel.de"
                required={!isResetMode}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-cream-700 mb-1">
              {isResetMode ? 'Neues Passwort' : 'Passwort'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-cream-300 rounded-lg focus:ring-2 focus:ring-clay-400 focus:border-clay-400 transition-all text-base sm:text-sm"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {isLogin && !isResetMode && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-clay-600 hover:text-clay-800"
            >
              Passwort vergessen?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-clay-500 text-white font-semibold rounded-lg hover:bg-clay-600 focus:ring-4 focus:ring-clay-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Laden...
              </span>
            ) : isResetMode ? (
              'Passwort speichern'
            ) : isLogin ? (
              'Einloggen'
            ) : (
              'Registrieren'
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        {!isResetMode && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-cream-600 hover:text-cream-800"
            >
              {isLogin ? (
                <>
                  Noch kein Account?{' '}
                  <span className="text-clay-600 font-semibold">Jetzt registrieren</span>
                </>
              ) : (
                <>
                  Bereits registriert?{' '}
                  <span className="text-clay-600 font-semibold">Zum Login</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 pt-6 border-t border-cream-200">
          <p className="text-xs text-cream-500 text-center mb-3">Was dich erwartet:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-cream-700">
            <div className="flex items-center gap-1">
              <Check size={12} className="text-sage-500" /> Portfolio-Übersicht
            </div>
            <div className="flex items-center gap-1">
              <Check size={12} className="text-sage-500" /> Rendite-Berechnung
            </div>
            <div className="flex items-center gap-1">
              <Check size={12} className="text-sage-500" /> Steuer-Export
            </div>
            <div className="flex items-center gap-1">
              <Check size={12} className="text-sage-500" /> Cloud-Speicherung
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
