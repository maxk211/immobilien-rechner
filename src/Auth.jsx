import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

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
        redirectTo: window.location.origin,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo & Titel */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-gray-800">Immobilien Portfolio</h1>
          <p className="text-gray-500 mt-1">
            {isResetMode
              ? 'Neues Passwort vergeben'
              : isLogin
                ? 'Willkommen zurück!'
                : 'Erstelle deinen Account'}
          </p>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Erfolgsmeldung */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {message}
          </div>
        )}

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResetMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail Adresse
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="max@beispiel.de"
                required={!isResetMode}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isResetMode ? 'Neues Passwort' : 'Passwort'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {isLogin && !isResetMode && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Passwort vergessen?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isLogin ? (
                <>
                  Noch kein Account?{' '}
                  <span className="text-blue-600 font-semibold">Jetzt registrieren</span>
                </>
              ) : (
                <>
                  Bereits registriert?{' '}
                  <span className="text-blue-600 font-semibold">Zum Login</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">Was dich erwartet:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Portfolio-Übersicht
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Rendite-Berechnung
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Steuer-Export
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Cloud-Speicherung
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
