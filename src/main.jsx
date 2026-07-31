import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const MietrenditeRechner = lazy(() => import('./rechner/MietrenditeRechner.jsx'))
const AfaRechner = lazy(() => import('./rechner/AfaRechner.jsx'))

const root = ReactDOM.createRoot(document.getElementById('root'))

const Loading = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-white text-sm opacity-60">Laden…</div>
  </div>
)

// Rechner-Routen ohne Auth — SPA-Fallback bedient diese via /*→index.html
// Die dedizierten *.html-Dateien (mietrendite-rechner.html, afa-rechner.html)
// bedienen Crawler direkt (SEO)
const path = window.location.pathname

if (path === '/mietrendite-rechner') {
  root.render(
    <React.StrictMode>
      <Suspense fallback={<Loading />}>
        <MietrenditeRechner />
      </Suspense>
    </React.StrictMode>
  )
} else if (path === '/afa-rechner') {
  root.render(
    <React.StrictMode>
      <Suspense fallback={<Loading />}>
        <AfaRechner />
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
