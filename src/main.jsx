import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// App (Dashboard) und LandingApp (Marketing) lazy laden — sonst landet
// die komplette Dashboard-Logik (PDF, Excel, Charts) im Bundle jeder Route,
// auch wenn nur die Landingpage aufgerufen wird.
const App = lazy(() => import('./App.jsx'))
const LandingApp = lazy(() => import('./LandingApp.jsx'))
const MietrenditeRechner = lazy(() => import('./rechner/MietrenditeRechner.jsx'))
const AfaRechner = lazy(() => import('./rechner/AfaRechner.jsx'))
const MietrenditeGuide = lazy(() => import('./ratgeber/MietrenditeGuide.jsx'))
const CashflowGuide = lazy(() => import('./ratgeber/CashflowGuide.jsx'))
const AfaSteuerGuide = lazy(() => import('./ratgeber/AfaSteuerGuide.jsx'))

const root = ReactDOM.createRoot(document.getElementById('root'))

const Loading = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-white text-sm opacity-60">Laden…</div>
  </div>
)

// Rechner- und Ratgeber-Routen ohne Auth — SPA-Fallback bedient diese via /*→index.html
// Die dedizierten *.html-Dateien bedienen Crawler direkt (SEO)
const ROUTES = {
  '/mietrendite-rechner': MietrenditeRechner,
  '/afa-rechner': AfaRechner,
  '/ratgeber/mietrendite-berechnen': MietrenditeGuide,
  '/ratgeber/cashflow-bei-immobilien': CashflowGuide,
  '/ratgeber/afa-und-steuern-vermietung': AfaSteuerGuide,
}

const path = window.location.pathname
const RouteComponent = path === '/app' ? App : (ROUTES[path] || LandingApp)

root.render(
  <React.StrictMode>
    <Suspense fallback={<Loading />}>
      <RouteComponent />
    </Suspense>
  </React.StrictMode>
)
