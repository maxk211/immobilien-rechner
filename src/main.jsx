import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const MietrenditeRechner = lazy(() => import('./rechner/MietrenditeRechner.jsx'))

const root = ReactDOM.createRoot(document.getElementById('root'))

// Rechner-Routen ohne Auth — SPA-Fallback bedient diese via /*→index.html
// Das dedizierte mietrendite-rechner.html bedient Crawler direkt (SEO)
if (window.location.pathname === '/mietrendite-rechner') {
  root.render(
    <React.StrictMode>
      <Suspense fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white text-sm opacity-60">Laden…</div>
        </div>
      }>
        <MietrenditeRechner />
      </Suspense>
    </React.StrictMode>
  )
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
