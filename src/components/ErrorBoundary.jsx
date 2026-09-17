import { Component } from 'react';

// ─── Basis-ErrorBoundary ────────────────────────────────────────────────────
// Fängt Render-Fehler in Kind-Komponenten ab, bevor sie die gesamte App
// in den weißen Bildschirm reißen.
//
// Props:
//   fallback   – ReactNode oder ({ error, reset }) => ReactNode
//   resetKey   – wenn sich dieser Wert ändert, wird der Fehlerzustand
//                automatisch zurückgesetzt (ideal für Tab-Wechsel)
//   onError    – optionaler Callback mit (error, info)

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  // Automatisches Reset wenn resetKey sich ändert (z.B. Tab-Wechsel)
  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  reset() {
    this.setState({ error: null, errorInfo: null });
  }

  render() {
    if (!this.state.error) return this.props.children;

    const { fallback } = this.props;
    if (!fallback) return <DefaultFallback error={this.state.error} reset={this.reset} />;
    if (typeof fallback === 'function') return fallback({ error: this.state.error, reset: this.reset });
    return fallback;
  }
}

// ─── Standard-Fallback (generisch) ─────────────────────────────────────────
const DefaultFallback = ({ error, reset }) => (
  <div className="p-6 bg-brick-50 border border-brick-200 rounded-2xl">
    <p className="text-brick-700 font-bold mb-2">⚠ Ein Fehler ist aufgetreten</p>
    <p className="text-brick-600 text-sm mb-4 font-mono">{error?.message}</p>
    <button onClick={reset}
      className="px-4 py-2 bg-brick-600 text-white rounded-lg text-sm font-semibold hover:bg-brick-700">
      Neu versuchen
    </button>
  </div>
);

// ─── Modal-ErrorBoundary ────────────────────────────────────────────────────
// Zeigt den Fehler innerhalb eines Modal-Overlays statt den gesamten
// Seiteninhalt zu ersetzen. Nutze onClose um das Modal zu schließen.
export const ModalErrorBoundary = ({ children, onClose, resetKey }) => (
  <ErrorBoundary
    resetKey={resetKey}
    fallback={({ error, reset }) => (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-brick-100 flex items-center justify-center shrink-0">
              <span className="text-2xl">⚠</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-cream-900 mb-1">Anzeige-Fehler</h2>
              <p className="text-sm text-cream-500 mb-4">
                Diese Ansicht konnte nicht geladen werden. Deine Daten sind nicht betroffen.
              </p>
              <div className="bg-brick-50 border border-brick-200 rounded-xl p-3 mb-5">
                <p className="text-xs font-mono text-brick-700 break-all">{error?.message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={reset}
                  className="px-4 py-2 bg-clay-600 text-white rounded-xl text-sm font-semibold hover:bg-clay-700 transition-colors">
                  Neu laden
                </button>
                <button onClick={() => { reset(); onClose?.(); }}
                  className="px-4 py-2 bg-cream-100 text-cream-700 rounded-xl text-sm font-semibold hover:bg-cream-200 transition-colors">
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// ─── Tab-ErrorBoundary ──────────────────────────────────────────────────────
// Kompakte Fehlerkarte im Tab-Content-Bereich.
// Setzt sich automatisch zurück wenn resetKey (= activeTab) wechselt.
export const TabErrorBoundary = ({ children, resetKey }) => (
  <ErrorBoundary
    resetKey={resetKey}
    fallback={({ error, reset }) => (
      <div className="m-2 p-5 bg-brick-50 border border-brick-200 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-brick-100 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lg">🐛</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brick-800 mb-1">Dieser Tab konnte nicht geladen werden</p>
          <p className="text-xs text-brick-600 mb-3 font-mono break-all">{error?.message}</p>
          <div className="flex gap-2">
            <button onClick={reset}
              className="px-3 py-1.5 bg-brick-600 text-white rounded-lg text-xs font-semibold hover:bg-brick-700 transition-colors">
              Tab neu laden
            </button>
            <span className="text-xs text-brick-400 self-center">oder anderen Tab wählen</span>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
